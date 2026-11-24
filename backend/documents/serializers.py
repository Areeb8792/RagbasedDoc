import hashlib
from rest_framework import serializers
from django.conf import settings
from .models import Document, DocumentChunk, KnowledgeCollection

class KnowledgeCollectionSerializer(serializers.ModelSerializer):
    documents_count = serializers.SerializerMethodField()

    class Meta:
        model = KnowledgeCollection
        fields = (
            'id', 'name', 'description', 'color', 'icon',
            'documents_count', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_documents_count(self, obj):
        return obj.documents.count()

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class DocumentChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentChunk
        fields = (
            'id', 'chunk_index', 'content', 'page_number',
            'page_start', 'page_end', 'section_title',
            'token_count', 'extraction_method', 'metadata', 'created_at'
        )


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.CharField(source='uploaded_by.email', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    chunks_count = serializers.IntegerField(source='chunk_count', read_only=True)
    collection_name = serializers.CharField(source='collection.name', read_only=True)
    collection_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Document
        fields = (
            'id', 'title', 'original_filename', 'stored_file',
            'file_type', 'is_personal', 'collection', 'collection_id', 'collection_name',
            'description', 'category', 'tags', 'uploaded_by',
            'uploaded_by_email', 'uploaded_by_name', 'document_status',
            'visibility', 'language', 'version', 'previous_version',
            'checksum', 'file_size', 'page_count', 'effective_from',
            'effective_until', 'review_date', 'indexed_at',
            'processing_error', 'chunks_count', 'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'checksum', 'file_size', 'uploaded_by',
            'document_status', 'indexed_at', 'processing_error',
            'chunks_count', 'created_at', 'updated_at'
        )

    def update(self, instance, validated_data):
        request = self.context.get('request')
        user = request.user if request else None

        if 'collection_id' in validated_data:
            col_id = validated_data.pop('collection_id')
            if col_id:
                try:
                    collection = KnowledgeCollection.objects.get(id=col_id, owner=user)
                    instance.collection = collection
                    instance.category = collection.name
                except KnowledgeCollection.DoesNotExist:
                    raise serializers.ValidationError({"collection_id": "Specified folder does not exist or access is denied."})
            else:
                instance.collection = None
                instance.category = 'Unorganized'
            instance.save(update_fields=['collection', 'category', 'updated_at'])
            # Keep chunks in sync for chunk-level collection queries
            instance.chunks.update(collection=instance.collection)

        return super().update(instance, validated_data)


class DocumentUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField(source='stored_file', required=True)
    collection_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = Document
        fields = (
            'title', 'file', 'description', 'category', 'tags',
            'collection_id', 'is_personal', 'visibility',
            'effective_from', 'effective_until', 'review_date'
        )

    def validate_file(self, value):
        max_size = getattr(settings, 'MAX_UPLOAD_SIZE', 25 * 1024 * 1024)
        if value.size > max_size:
            raise serializers.ValidationError(f"File size exceeds maximum allowed size ({max_size // (1024*1024)}MB).")

        allowed_exts = getattr(settings, 'ALLOWED_UPLOAD_EXTENSIONS', ['.pdf', '.docx', '.pptx', '.txt', '.md', '.doc', '.ppt'])
        filename = value.name.lower()
        if not any(filename.endswith(ext) for ext in allowed_exts):
            raise serializers.ValidationError(f"Unsupported file type. Allowed: {', '.join(allowed_exts)}")

        return value

    def create(self, validated_data):
        file_obj = validated_data['stored_file']
        user = self.context['request'].user
        collection_id = validated_data.pop('collection_id', None)

        collection = None
        if collection_id:
            try:
                collection = KnowledgeCollection.objects.get(id=collection_id, owner=user)
            except KnowledgeCollection.DoesNotExist:
                raise serializers.ValidationError({"collection_id": "Specified collection does not exist or access is denied."})

        # Compute checksum to identify exact duplicates
        hasher = hashlib.sha256()
        for chunk in file_obj.chunks():
            hasher.update(chunk)
        checksum = hasher.hexdigest()

        title = validated_data.get('title')
        if not title:
            title = file_obj.name.rsplit('.', 1)[0].replace('_', ' ').replace('-', ' ').title()

        file_ext = file_obj.name.rsplit('.', 1)[-1].lower() if '.' in file_obj.name else 'pdf'
        is_personal = validated_data.get('is_personal', True)

        doc = Document.objects.create(
            title=title,
            original_filename=file_obj.name,
            stored_file=file_obj,
            file_type=file_ext,
            is_personal=is_personal,
            collection=collection,
            description=validated_data.get('description', ''),
            category=validated_data.get('category', collection.name if collection else 'Personal Research'),
            tags=validated_data.get('tags', []),
            uploaded_by=user,
            visibility='private' if is_personal else validated_data.get('visibility', 'published'),
            effective_from=validated_data.get('effective_from'),
            effective_until=validated_data.get('effective_until'),
            review_date=validated_data.get('review_date'),
            checksum=checksum,
            file_size=file_obj.size,
            document_status='uploaded'
        )
        return doc
