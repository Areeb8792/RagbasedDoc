from rest_framework import serializers
from .models import Conversation, Message, MessageCitation, SavedAnswer
from documents.serializers import DocumentSerializer

class MessageCitationSerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source='document.title', read_only=True)
    document_version = serializers.IntegerField(source='document.version', read_only=True)
    category = serializers.CharField(source='document.category', read_only=True)

    class Meta:
        model = MessageCitation
        fields = (
            'id', 'document', 'document_title', 'document_version',
            'category', 'document_chunk', 'citation_order', 'page_number',
            'section_title', 'excerpt', 'similarity_score', 'created_at'
        )

class MessageSerializer(serializers.ModelSerializer):
    citations = MessageCitationSerializer(many=True, read_only=True)
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = (
            'id', 'conversation', 'role', 'content', 'response_status',
            'insufficient_evidence', 'model_identifier', 'response_time_ms',
            'follow_up_suggestions', 'citations', 'is_saved', 'created_at'
        )
        read_only_fields = fields

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and obj.role == 'assistant':
            return obj.saved_by_users.filter(user=request.user).exists()
        return False

class ConversationSerializer(serializers.ModelSerializer):
    message_count = serializers.IntegerField(source='messages.count', read_only=True)
    last_message = serializers.SerializerMethodField()
    collection_name = serializers.CharField(source='collection.name', read_only=True)
    document_title = serializers.CharField(source='document.title', read_only=True)

    class Meta:
        model = Conversation
        fields = (
            'id', 'title', 'archived', 'scope', 'collection', 'collection_name',
            'document', 'document_title', 'message_count',
            'last_message', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'message_count', 'last_message', 'created_at', 'updated_at')

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return {
                'role': last_msg.role,
                'content': last_msg.content[:80] + ('...' if len(last_msg.content) > 80 else ''),
                'created_at': last_msg.created_at
            }
        return None

class ConversationDetailSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    collection_name = serializers.CharField(source='collection.name', read_only=True)
    document_title = serializers.CharField(source='document.title', read_only=True)

    class Meta:
        model = Conversation
        fields = (
            'id', 'title', 'archived', 'scope', 'collection', 'collection_name',
            'document', 'document_title', 'messages', 'created_at', 'updated_at'
        )

class SavedAnswerSerializer(serializers.ModelSerializer):
    message = MessageSerializer(read_only=True)

    class Meta:
        model = SavedAnswer
        fields = ('id', 'message', 'note', 'created_at')
        read_only_fields = ('id', 'created_at')
