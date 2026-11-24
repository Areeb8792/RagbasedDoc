import os
import hashlib
from datetime import timedelta
from django.utils import timezone
from django.db import models
from django.conf import settings
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404
from django.http import FileResponse, Http404

from .models import Document, DocumentChunk, KnowledgeCollection
from .serializers import (
    DocumentSerializer, DocumentUploadSerializer, DocumentChunkSerializer,
    KnowledgeCollectionSerializer
)
from .services.ingestion import DocumentIngestionPipeline
from .services.conflict_detector import PolicyConflictDetector
from rag.services.gemini_service import gemini_service
from accounts.permissions import IsAdminRole
from audit.services import log_audit_event

class DocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentSerializer
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'document_status', 'visibility', 'language']
    search_fields = ['title', 'description', 'original_filename']
    ordering_fields = ['created_at', 'title', 'version', 'file_size', 'indexed_at']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminRole()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_admin_or_superadmin:
            return Document.objects.all().order_by('-created_at')
        # Students only see published, non-archived documents
        return Document.objects.filter(visibility='published').exclude(document_status='archived').order_by('-created_at')

    def create(self, request, *args, **kwargs):
        upload_serializer = DocumentUploadSerializer(data=request.data, context={'request': request})
        upload_serializer.is_valid(raise_exception=True)
        document = upload_serializer.save()

        log_audit_event(
            actor=request.user,
            action='document_uploaded',
            target_type='Document',
            target_id=str(document.id),
            metadata={'title': document.title, 'category': document.category, 'file_size': document.file_size}
        )

        # Trigger synchronous processing for immediate feedback
        process_success = DocumentIngestionPipeline.process_document(str(document.id))

        # Re-fetch document with updated chunks and status
        document.refresh_from_db()
        return Response({
            'success': True,
            'message': 'Document uploaded and indexed successfully.' if process_success else 'Document uploaded but processing encountered an issue.',
            'document': DocumentSerializer(document).data
        }, status=status.HTTP_201_CREATED)

class DocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    lookup_field = 'id'

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdminRole()]
        return [permissions.IsAuthenticated()]

    def perform_destroy(self, instance):
        doc_id = str(instance.id)
        doc_title = instance.title

        # Clean file from storage (works across local disk, persistent disk, and S3/R2)
        if instance.stored_file:
            try:
                instance.stored_file.delete(save=False)
            except Exception:
                pass

        instance.delete()

        log_audit_event(
            actor=self.request.user,
            action='document_deleted',
            target_type='Document',
            target_id=doc_id,
            metadata={'title': doc_title}
        )

class DocumentReprocessView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, id):
        doc = get_object_or_404(Document, id=id)
        success = DocumentIngestionPipeline.process_document(str(doc.id))
        doc.refresh_from_db()

        log_audit_event(
            actor=request.user,
            action='document_reprocessed',
            target_type='Document',
            target_id=str(doc.id),
            metadata={'title': doc.title, 'success': success}
        )

        return Response({
            'success': success,
            'message': 'Document reprocessed successfully.' if success else f"Reprocessing failed: {doc.processing_error}",
            'document': DocumentSerializer(doc).data
        }, status=status.HTTP_200_OK if success else status.HTTP_400_BAD_REQUEST)

class DocumentChunksListView(generics.ListAPIView):
    serializer_class = DocumentChunkSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        doc_id = self.kwargs.get('id')
        return DocumentChunk.objects.filter(document_id=doc_id).order_by('chunk_index')

class DocumentVersionsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request, id):
        doc = get_object_or_404(Document, id=id)
        # Find root document in version chain
        root = doc
        while root.previous_version:
            root = root.previous_version

        # Traverse versions down
        versions = [root]
        current = root
        while True:
            children = current.next_versions.all().order_by('version')
            if not children.exists():
                break
            current = children.first()
            versions.append(current)

        return Response({
            'success': True,
            'current_id': str(doc.id),
            'versions': DocumentSerializer(versions, many=True).data
        })

class DocumentCompareVersionView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request, id, other_id):
        doc1 = get_object_or_404(Document, id=id)
        doc2 = get_object_or_404(Document, id=other_id)
        comparison = PolicyConflictDetector.compare_versions(doc1, doc2)
        return Response({
            'success': True,
            'comparison': comparison
        })

# --- Personal Document Intelligence & Collections Views ---

class KnowledgeCollectionListCreateView(generics.ListCreateAPIView):
    """
    CRUD for personal Knowledge Collections (e.g. "Machine Learning", "Biology", "Economics").
    """
    serializer_class = KnowledgeCollectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']

    def get_queryset(self):
        return KnowledgeCollection.objects.filter(owner=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class KnowledgeCollectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = KnowledgeCollectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return KnowledgeCollection.objects.filter(owner=self.request.user)

    def perform_destroy(self, instance):
        delete_docs = self.request.query_params.get('delete_documents', 'false').lower() == 'true'
        if delete_docs:
            docs = instance.documents.all()
            for doc in docs:
                if doc.stored_file:
                    try:
                        doc.stored_file.delete(save=False)
                    except Exception:
                        pass
                doc.delete()
        else:
            # Safely unorganize documents before deleting collection
            instance.documents.update(collection=None, category='Unorganized')
            instance.chunks.update(collection=None)
        instance.delete()


class PersonalDocumentStatsView(APIView):
    """
    Returns real-time dynamic statistics for the authenticated user's documents and folders.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        user_docs = Document.objects.filter(uploaded_by=user, is_personal=True)
        total_documents = user_docs.count()
        total_folders = KnowledgeCollection.objects.filter(owner=user).count()

        storage_bytes = user_docs.aggregate(total_size=models.Sum('file_size'))['total_size'] or 0

        # Formatted storage
        if storage_bytes < 1024:
            storage_formatted = f"{storage_bytes} B"
        elif storage_bytes < 1024 * 1024:
            storage_formatted = f"{storage_bytes / 1024:.1f} KB"
        elif storage_bytes < 1024 * 1024 * 1024:
            storage_formatted = f"{storage_bytes / (1024 * 1024):.1f} MB"
        else:
            storage_formatted = f"{storage_bytes / (1024 * 1024 * 1024):.2f} GB"

        one_week_ago = timezone.now() - timedelta(days=7)
        recently_uploaded = user_docs.filter(created_at__gte=one_week_ago).count()

        indexed_documents = user_docs.filter(document_status='indexed').count()
        failed_documents = user_docs.filter(document_status='failed').count()
        processing_documents = user_docs.filter(
            document_status__in=['uploaded', 'pending', 'extracting', 'chunking', 'generating_embeddings', 'indexing']
        ).count()

        return Response({
            'total_documents': total_documents,
            'total_folders': total_folders,
            'total_storage_bytes': storage_bytes,
            'storage_used_formatted': storage_formatted,
            'recently_uploaded': recently_uploaded,
            'recent_days': 7,
            'indexed_documents': indexed_documents,
            'failed_documents': failed_documents,
            'processing_documents': processing_documents,
        })


class PersonalDocumentBulkUploadView(APIView):
    """
    Upload and index multiple files at once into an optional collection/folder.
    """
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        files = request.FILES.getlist('files') or request.FILES.getlist('file')
        if not files:
            return Response({'error': 'No files provided for upload.'}, status=status.HTTP_400_BAD_REQUEST)

        collection_id = request.data.get('collection_id')
        collection = None
        if collection_id:
            try:
                collection = KnowledgeCollection.objects.get(id=collection_id, owner=request.user)
            except KnowledgeCollection.DoesNotExist:
                return Response({'error': 'Specified folder does not exist or access denied.'}, status=status.HTTP_404_NOT_FOUND)

        created_docs = []
        errors = []

        max_size = getattr(settings, 'MAX_UPLOAD_SIZE', 25 * 1024 * 1024)
        allowed_exts = getattr(settings, 'ALLOWED_UPLOAD_EXTENSIONS', ['.pdf', '.docx', '.pptx', '.txt', '.md', '.doc', '.ppt'])

        for f in files:
            if f.size > max_size:
                errors.append(f"{f.name}: File size exceeds {max_size // (1024 * 1024)}MB.")
                continue

            fname_lower = f.name.lower()
            if not any(fname_lower.endswith(ext) for ext in allowed_exts):
                errors.append(f"{f.name}: Unsupported file type.")
                continue

            hasher = hashlib.sha256()
            for chunk in f.chunks():
                hasher.update(chunk)
            checksum = hasher.hexdigest()

            title = f.name.rsplit('.', 1)[0].replace('_', ' ').replace('-', ' ').title()
            file_ext = f.name.rsplit('.', 1)[-1].lower() if '.' in f.name else 'pdf'

            doc = Document.objects.create(
                title=title,
                original_filename=f.name,
                stored_file=f,
                file_type=file_ext,
                is_personal=True,
                collection=collection,
                category=collection.name if collection else 'Personal Research',
                uploaded_by=request.user,
                visibility='private',
                checksum=checksum,
                file_size=f.size,
                document_status='uploaded'
            )

            # Ingest & index immediately
            success = DocumentIngestionPipeline.process_document(str(doc.id))
            doc.refresh_from_db()
            created_docs.append(DocumentSerializer(doc).data)

        return Response({
            'success': len(created_docs) > 0,
            'uploaded_count': len(created_docs),
            'documents': created_docs,
            'errors': errors
        }, status=status.HTTP_201_CREATED if created_docs else status.HTTP_400_BAD_REQUEST)


class PersonalDocumentListCreateView(generics.ListCreateAPIView):
    """
    List and upload domain-agnostic personal documents for the authenticated user.
    """
    serializer_class = DocumentSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['collection', 'document_status', 'file_type']
    search_fields = ['title', 'description', 'original_filename']
    ordering_fields = ['created_at', 'title', 'file_size', 'indexed_at']

    def get_queryset(self):
        qs = Document.objects.filter(uploaded_by=self.request.user, is_personal=True)
        collection_id = self.request.query_params.get('collection_id')
        unorganized = self.request.query_params.get('unorganized')
        if unorganized == 'true':
            qs = qs.filter(collection__isnull=True)
        elif collection_id:
            qs = qs.filter(collection_id=collection_id)
        return qs.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        upload_serializer = DocumentUploadSerializer(data=request.data, context={'request': request})
        upload_serializer.is_valid(raise_exception=True)
        document = upload_serializer.save()

        # Synchronously process document ingestion, extraction, chunking, and vector indexing
        process_success = DocumentIngestionPipeline.process_document(str(document.id))
        document.refresh_from_db()

        return Response({
            'success': True,
            'message': 'Personal document uploaded and indexed successfully.' if process_success else 'Document uploaded but processing encountered an issue.',
            'document': DocumentSerializer(document).data
        }, status=status.HTTP_201_CREATED)


class PersonalDocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return Document.objects.filter(uploaded_by=self.request.user, is_personal=True)

    def perform_destroy(self, instance):
        if instance.stored_file:
            try:
                instance.stored_file.delete(save=False)
            except Exception:
                pass
        instance.delete()


class PersonalDocumentReprocessView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        doc = get_object_or_404(Document, id=id, uploaded_by=request.user, is_personal=True)
        success = DocumentIngestionPipeline.process_document(str(doc.id))
        doc.refresh_from_db()
        return Response({
            'success': success,
            'message': 'Document reprocessed successfully.' if success else f"Reprocessing failed: {doc.processing_error}",
            'document': DocumentSerializer(doc).data
        }, status=status.HTTP_200_OK if success else status.HTTP_400_BAD_REQUEST)


class DocumentSummarizeView(APIView):
    """
    Generate an executive summary, core takeaways, and section breakdown for a document.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        user = request.user
        doc = get_object_or_404(Document, id=id)
        if doc.is_personal and doc.uploaded_by != user:
            return Response({'error': 'Unauthorized access to private document'}, status=status.HTTP_403_FORBIDDEN)
        if not doc.is_personal and doc.visibility != 'published' and not user.is_admin_or_superadmin:
            return Response({'error': 'Unauthorized access'}, status=status.HTTP_403_FORBIDDEN)

        chunks = list(doc.chunks.all().order_by('chunk_index'))
        summary_data = gemini_service.summarize_document(chunks, doc.title, doc.file_type)
        return Response({
            'success': True,
            'document_id': str(doc.id),
            'title': doc.title,
            'summary': summary_data
        })


class DocumentStudyMaterialView(APIView):
    """
    Generate multiple-choice practice questions, flashcards, and key definitions from document chunks.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        user = request.user
        doc = get_object_or_404(Document, id=id)
        if doc.is_personal and doc.uploaded_by != user:
            return Response({'error': 'Unauthorized access to private document'}, status=status.HTTP_403_FORBIDDEN)
        if not doc.is_personal and doc.visibility != 'published' and not user.is_admin_or_superadmin:
            return Response({'error': 'Unauthorized access'}, status=status.HTTP_403_FORBIDDEN)

        chunks = list(doc.chunks.all().order_by('chunk_index'))
        materials = gemini_service.generate_study_materials(chunks, doc.title)
        return Response({
            'success': True,
            'document_id': str(doc.id),
            'title': doc.title,
            'study_materials': materials
        })


class PersonalDocumentPreviewView(APIView):
    """
    Structured preview of chunks, page counts, metadata, and token counts.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, id):
        user = request.user
        doc = get_object_or_404(Document, id=id)
        if doc.is_personal and doc.uploaded_by != user:
            return Response({'error': 'Unauthorized access to private document'}, status=status.HTTP_403_FORBIDDEN)
        if not doc.is_personal and doc.visibility != 'published' and not user.is_admin_or_superadmin:
            return Response({'error': 'Unauthorized access'}, status=status.HTTP_403_FORBIDDEN)

        chunks = doc.chunks.all().order_by('chunk_index')[:25]
        return Response({
            'id': str(doc.id),
            'title': doc.title,
            'file_type': doc.file_type,
            'page_count': doc.page_count,
            'file_size': doc.file_size,
            'collection': doc.collection.name if doc.collection else None,
            'collection_id': str(doc.collection.id) if doc.collection else None,
            'document_status': doc.document_status,
            'chunks_count': doc.chunks.count(),
            'description': doc.description,
            'created_at': doc.created_at,
            'sample_chunks': DocumentChunkSerializer(chunks, many=True).data
        })


class DocumentDownloadView(APIView):
    """
    Secure file streaming for institutional documents.
    Works transparently with local disk, Render Persistent Disk, and Cloudflare R2 / S3.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, id):
        doc = get_object_or_404(Document, id=id)
        if doc.visibility != 'published' and not request.user.is_admin_or_superadmin:
            return Response({'error': 'Unauthorized file access'}, status=status.HTTP_403_FORBIDDEN)
        if not doc.stored_file:
            raise Http404("No file attached to this document.")
        try:
            return FileResponse(doc.stored_file.open('rb'), as_attachment=False, filename=doc.original_filename)
        except Exception as e:
            return Response({'error': f"File cannot be accessed: {str(e)}"}, status=status.HTTP_404_NOT_FOUND)


class PersonalDocumentDownloadView(APIView):
    """
    Secure file streaming for personal documents.
    Only the document owner or an administrator can access this file.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, id):
        doc = get_object_or_404(Document, id=id)
        if doc.uploaded_by != request.user and not request.user.is_admin_or_superadmin:
            return Response({'error': 'Unauthorized access to private document'}, status=status.HTTP_403_FORBIDDEN)
        if not doc.stored_file:
            raise Http404("No file attached to this document.")
        try:
            return FileResponse(doc.stored_file.open('rb'), as_attachment=False, filename=doc.original_filename)
        except Exception as e:
            return Response({'error': f"File cannot be accessed: {str(e)}"}, status=status.HTTP_404_NOT_FOUND)

