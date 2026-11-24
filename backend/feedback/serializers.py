from rest_framework import serializers
from .models import Feedback

class FeedbackCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ('id', 'message', 'rating', 'issue_type', 'comment')

class FeedbackDetailSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    message_content = serializers.CharField(source='message.content', read_only=True)

    class Meta:
        model = Feedback
        fields = (
            'id', 'user', 'user_email', 'message', 'message_content',
            'rating', 'issue_type', 'comment', 'status', 'admin_notes',
            'created_at', 'resolved_at'
        )
        read_only_fields = ('id', 'user', 'user_email', 'message', 'message_content', 'created_at')
