from rest_framework import serializers
from .models import FAQ
from documents.serializers import DocumentSerializer

class FAQSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    related_documents_info = DocumentSerializer(source='related_documents', many=True, read_only=True)

    class Meta:
        model = FAQ
        fields = (
            'id', 'question', 'answer', 'category', 'related_documents',
            'related_documents_info', 'visibility', 'order',
            'created_by', 'created_by_username', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_by', 'created_by_username', 'created_at', 'updated_at')
