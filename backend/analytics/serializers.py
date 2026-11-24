from rest_framework import serializers
from .models import KnowledgeGap

class KnowledgeGapSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeGap
        fields = (
            'id', 'query_text', 'category', 'frequency',
            'status', 'resolution_notes', 'created_at', 'updated_at'
        )
