import os
import hashlib
from django.core.management.base import BaseCommand
from django.core.files.storage import default_storage
from django.conf import settings
from documents.models import Document

class Command(BaseCommand):
    help = "Safely verify or migrate document storage files between local disk and cloud storage (S3/Cloudflare R2)."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate migration without copying files.'
        )
        parser.add_argument(
            '--verify-only',
            action='store_true',
            help='Check integrity and availability of all documents in active storage.'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        verify_only = options['verify_only']

        self.stdout.write(self.style.MIGRATE_HEADING("=== Morpheus Document Storage Migration & Integrity Tool ==="))
        self.stdout.write(f"Active Storage Backend: {default_storage.__class__.__name__}")
        self.stdout.write(f"Active MEDIA_ROOT: {settings.MEDIA_ROOT}")

        documents = Document.objects.filter(stored_file__isnull=False).exclude(stored_file='')
        total_docs = documents.count()
        self.stdout.write(f"Discovered {total_docs} document(s) with file associations.")

        if total_docs == 0:
            self.stdout.write(self.style.SUCCESS("No documents found. Nothing to process."))
            return

        verified_count = 0
        missing_count = 0
        checksum_mismatch_count = 0
        migrated_count = 0

        for doc in documents:
            file_name = doc.stored_file.name
            doc_label = f"[{doc.id}] '{doc.title}' ({file_name})"

            # Check if exists in active default_storage
            exists_in_storage = default_storage.exists(file_name)
            
            # Check local file path if available
            local_path = None
            try:
                local_path = doc.stored_file.path
            except (NotImplementedError, AttributeError):
                local_path = os.path.join(str(settings.MEDIA_ROOT), file_name)

            local_exists = os.path.exists(local_path) if local_path else False

            if not exists_in_storage and not local_exists:
                self.stdout.write(self.style.ERROR(f"  MISSING: {doc_label} - Not found on disk or storage."))
                missing_count += 1
                continue

            # Read content from available source
            content_bytes = None
            try:
                if exists_in_storage:
                    with default_storage.open(file_name, 'rb') as f:
                        content_bytes = f.read()
                elif local_exists:
                    with open(local_path, 'rb') as f:
                        content_bytes = f.read()
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  READ FAILED: {doc_label} ({e})"))
                missing_count += 1
                continue

            # Compute SHA-256
            computed_hash = hashlib.sha256(content_bytes).hexdigest()
            if doc.checksum and doc.checksum != computed_hash:
                self.stdout.write(self.style.WARNING(f"  CHECKSUM MISMATCH: {doc_label} (expected {doc.checksum[:8]}..., got {computed_hash[:8]}...)"))
                checksum_mismatch_count += 1
            else:
                if not doc.checksum:
                    doc.checksum = computed_hash
                    doc.save(update_fields=['checksum'])

            # If verify only, record verification
            if verify_only:
                verified_count += 1
                continue

            # If not in default_storage, migrate from local to default_storage
            if not exists_in_storage and local_exists:
                if dry_run:
                    self.stdout.write(self.style.NOTICE(f"  [DRY RUN] Would copy {file_name} ({len(content_bytes)} bytes) to active storage."))
                    migrated_count += 1
                else:
                    try:
                        from django.core.files.base import ContentFile
                        default_storage.save(file_name, ContentFile(content_bytes))
                        self.stdout.write(self.style.SUCCESS(f"  MIGRATED: {doc_label} -> active storage."))
                        migrated_count += 1
                        verified_count += 1
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"  MIGRATION FAILED: {doc_label} ({e})"))
            else:
                verified_count += 1

        self.stdout.write("\n" + self.style.MIGRATE_HEADING("=== Storage Summary ==="))
        self.stdout.write(f"Total documents scanned:    {total_docs}")
        self.stdout.write(f"Successfully verified:      {verified_count}")
        self.stdout.write(f"Missing from storage:       {missing_count}")
        self.stdout.write(f"Checksum discrepancies:     {checksum_mismatch_count}")
        if not verify_only:
            self.stdout.write(f"Migrated files:             {migrated_count}")
