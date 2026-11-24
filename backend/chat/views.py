import logging
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.conf import settings

logger = logging.getLogger(__name__)

from .models import Conversation, Message, MessageCitation, SavedAnswer
from .serializers import (
    ConversationSerializer, ConversationDetailSerializer,
    MessageSerializer, SavedAnswerSerializer
)
from rag.services.pipeline import RAGPipeline
from rag.services.gemini_service import gemini_service
from documents.models import Document, DocumentChunk

class ConversationListCreateView(generics.ListCreateAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['archived']
    search_fields = ['title']
    ordering_fields = ['updated_at', 'created_at', 'title']

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user).order_by('-updated_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ConversationDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ConversationDetailSerializer
        return ConversationSerializer

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)

class AskQuestionView(APIView):
    """
    Primary Student Chat Endpoint:
    Receives student question, coordinates hybrid RAG retrieval, runs Gemini generation,
    stores user and assistant messages, and creates verified citations.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        question = (request.data.get('question') or request.data.get('query') or '').strip()
        if not question:
            return Response({'error': 'Question cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        conversation_id = request.data.get('conversation_id')
        category_filter = request.data.get('category')
        scope = request.data.get('scope', 'all')
        collection_id = request.data.get('collection_id')
        document_id = request.data.get('document_id')
        language = request.data.get('language') or getattr(request.user, 'preferred_language', 'English')
        if language == 'hi':
            language = 'Hindi'
        elif language == 'pa':
            language = 'Punjabi'
        elif language == 'en':
            language = 'English'

        # 1. Get or create conversation
        if conversation_id:
            conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
            # If conversation has a default title, derive meaningful title from first question
            if conversation.title in ['New Academic Inquiry', 'New Conversation']:
                conversation.title = question[:45] + ('...' if len(question) > 45 else '')
                conversation.save(update_fields=['title', 'updated_at'])
        else:
            # Derive initial title from question
            derived_title = question[:45] + ('...' if len(question) > 45 else '')
            conversation = Conversation.objects.create(
                user=request.user,
                title=derived_title,
                scope=scope or 'all'
            )

        # Determine active retrieval context (Mode 1: Folder, Mode 2: Specific Document, Mode 3: Automatic / All)
        if 'collection_id' in request.data:
            active_collection = request.data.get('collection_id') or None
        else:
            active_collection = str(conversation.collection_id) if conversation.collection_id else None

        if 'document_id' in request.data:
            active_document = request.data.get('document_id') or None
        else:
            active_document = str(conversation.document_id) if conversation.document_id else None

        if active_document:
            active_scope = 'document'
        elif active_collection:
            active_scope = 'collection'
        else:
            active_scope = scope if scope else (conversation.scope or 'all')

        # Persist updated scope state to conversation
        conversation.scope = active_scope
        conversation.collection_id = active_collection
        conversation.document_id = active_document
        conversation.save(update_fields=['scope', 'collection', 'document', 'updated_at'])

        import time
        start_req_time = time.time()
        username = getattr(request.user, 'username', 'anonymous')
        user_role = getattr(request.user, 'role', 'student')
        logger.info(f"[CHAT-API] Request received: user='{username}' (ID: {request.user.id}, role: {user_role}) | query='{question[:60]}' | conv_id={conversation_id}")
        logger.info(f"[CHAT-API] Scope selected: scope='{active_scope}' | collection_id={active_collection} | document_id={active_document}")

        # 2. Persist user message
        user_message = Message.objects.create(
            conversation=conversation,
            role='user',
            content=question
        )

        # 3. Fetch past conversation turns for context
        past_messages = list(conversation.messages.exclude(id=user_message.id).order_by('created_at')[:6])
        history_payload = [{'role': m.role, 'content': m.content} for m in past_messages]

        # 4. Execute Grounded RAG Pipeline with Scope Isolation
        rag_output = RAGPipeline.execute(
            query=question,
            user=request.user,
            conversation_history=history_payload,
            category_filter=category_filter,
            language=language,
            scope=active_scope,
            collection_id=active_collection,
            document_id=active_document
        )

        raw_answer = (rag_output.get('answer') or '').strip()
        if not raw_answer:
            if rag_output.get('insufficient_evidence'):
                raw_answer = "I couldn't find relevant information in your uploaded documents for this question."
            else:
                raw_answer = "No response content could be generated for this question. Please try asking again."

        # 5. Persist assistant message
        assistant_message = Message.objects.create(
            conversation=conversation,
            role='assistant',
            content=raw_answer,
            response_status='insufficient_evidence' if rag_output['insufficient_evidence'] else 'success',
            insufficient_evidence=rag_output['insufficient_evidence'],
            model_identifier=getattr(settings, 'GEMINI_MODEL', 'gemini-3.1-flash-lite'),
            response_time_ms=rag_output['response_time_ms'],
            follow_up_suggestions=rag_output['follow_up_questions']
        )

        # 6. Persist verified source citations
        citation_instances = []
        for idx, citation_data in enumerate(rag_output['citations']):
            try:
                doc_instance = Document.objects.get(id=citation_data['document_id'])
                chunk_instance = None
                if citation_data.get('chunk_id'):
                    chunk_instance = DocumentChunk.objects.filter(id=citation_data['chunk_id']).first()

                citation_instances.append(MessageCitation(
                    message=assistant_message,
                    document=doc_instance,
                    document_chunk=chunk_instance,
                    citation_order=idx + 1,
                    page_number=citation_data.get('page_number'),
                    section_title=citation_data.get('section_title', '')[:255],
                    excerpt=citation_data.get('excerpt', ''),
                    similarity_score=citation_data.get('similarity', 0.0)
                ))
            except Exception:
                continue

        if citation_instances:
            MessageCitation.objects.bulk_create(citation_instances)

        # Update conversation timestamp and title if it's the first Q&A turn
        conversation.save()  # triggers updated_at auto_now

        # 7. Serialize and return response with complete dual-contract compatibility
        serialized_assistant_message = MessageSerializer(
            assistant_message,
            context={'request': request}
        ).data

        total_latency_ms = int((time.time() - start_req_time) * 1000)
        logger.info(f"[CHAT-API] Response successfully generated in {total_latency_ms}ms (message_id: {assistant_message.id}, citations: {len(citation_instances)}, length: {len(raw_answer)} chars)")

        return Response({
            'success': True,
            'conversation_id': str(conversation.id),
            'conversation_title': conversation.title,
            'message': serialized_assistant_message,
            'message_id': str(assistant_message.id),
            'answer': raw_answer,
            'content': raw_answer,
            'citations': serialized_assistant_message.get('citations', []),
            'follow_up_suggestions': rag_output.get('follow_up_questions', []),
            'insufficient_evidence': rag_output.get('insufficient_evidence', False),
            'evidence_status': rag_output.get('evidence_status', 'fully_supported'),
            'user_message_id': str(user_message.id),
            'response_time_ms': rag_output.get('response_time_ms', 0),
        }, status=status.HTTP_200_OK)

class SimplifyMessageView(APIView):
    """
    Transforms an already verified answer into a requested style
    ('simple', 'detailed', 'steps', 'bullets', 'key_points', 'formal')
    without compromising factual fidelity.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        message = get_object_or_404(Message, id=id, conversation__user=request.user)
        style = request.data.get('style', 'simple')

        simplified_text = gemini_service.simplify_answer(message.content, style)
        return Response({
            'success': True,
            'style': style,
            'simplified_content': simplified_text,
            'original_id': str(message.id)
        })

class SavedAnswerListCreateView(generics.ListCreateAPIView):
    serializer_class = SavedAnswerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SavedAnswer.objects.filter(user=self.request.user).select_related('message', 'message__conversation')

    def create(self, request, *args, **kwargs):
        message_id = request.data.get('message_id')
        note = request.data.get('note', '')

        message = get_object_or_404(Message, id=message_id, conversation__user=request.user)
        saved_obj, created = SavedAnswer.objects.get_or_create(
            user=request.user,
            message=message,
            defaults={'note': note}
        )

        return Response({
            'success': True,
            'message': 'Answer bookmarked successfully.' if created else 'Answer was already bookmarked.',
            'saved_answer': SavedAnswerSerializer(saved_obj, context={'request': request}).data
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

class SavedAnswerDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, message_id):
        SavedAnswer.objects.filter(user=request.user, message_id=message_id).delete()
        return Response({'success': True, 'message': 'Bookmark removed.'}, status=status.HTTP_200_OK)

class ExportConversationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, id):
        conversation = get_object_or_404(Conversation, id=id, user=request.user)
        messages = conversation.messages.all().order_by('created_at')

        lines = [
            f"# G38 AI College Assistant — Conversation Transcript",
            f"**Title:** {conversation.title}",
            f"**Student:** {request.user.username} ({request.user.email})",
            f"**Export Date:** {conversation.updated_at.strftime('%Y-%m-%d %H:%M UTC')}",
            f"{'='*60}\n"
        ]

        for msg in messages:
            role_label = "STUDENT" if msg.role == 'user' else "G38 AI ASSISTANT"
            lines.append(f"### [{role_label}] — {msg.created_at.strftime('%H:%M:%S')}")
            lines.append(msg.content.strip())

            # Citations
            citations = msg.citations.all()
            if citations.exists():
                lines.append("\n**Verified Sources:**")
                for c in citations:
                    page_str = f"Page {c.page_number}" if c.page_number else c.section_title
                    lines.append(f"- *{c.document.title}* ({page_str}): \"{c.excerpt[:150]}...\"")

            lines.append("\n" + "-"*40 + "\n")

        content = "\n".join(lines)
        response = HttpResponse(content, content_type='text/markdown')
        response['Content-Disposition'] = f'attachment; filename="conversation_{conversation.id}.md"'
        return response
