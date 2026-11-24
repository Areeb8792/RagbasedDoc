import os
import sys
import time
import shutil
import sqlite3
import subprocess
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings

class Command(BaseCommand):
    help = "Safely back up the active Morpheus database (PostgreSQL or SQLite) and provide verified recovery instructions."

    def add_arguments(self, parser):
        parser.add_argument(
            '--output-dir',
            type=str,
            default='',
            help='Directory path where the database backup file will be stored.'
        )
        parser.add_argument(
            '--instructions-only',
            action='store_true',
            help='Display restore and backup instructions without running a backup.'
        )

    def handle(self, *args, **options):
        db_conf = settings.DATABASES['default']
        engine = db_conf.get('ENGINE', '')
        output_dir = options['output_dir'] or os.path.join(settings.BASE_DIR, 'backups')
        os.makedirs(output_dir, exist_ok=True)

        timestamp = time.strftime('%Y%m%d_%H%M%S')
        self.stdout.write(self.style.MIGRATE_HEADING("=== Morpheus Database Backup & Disaster Recovery Utility ==="))
        self.stdout.write(f"Active Database Engine: {engine}")

        if options['instructions_only']:
            self._print_recovery_instructions(engine, db_conf)
            return

        if 'postgresql' in engine:
            self._backup_postgres(db_conf, output_dir, timestamp)
        elif 'sqlite' in engine:
            self._backup_sqlite(db_conf, output_dir, timestamp)
        else:
            self.stdout.write(self.style.ERROR(f"Unsupported database engine for automated backup: {engine}"))

    def _backup_sqlite(self, db_conf, output_dir, timestamp):
        src_path = db_conf.get('NAME')
        if not src_path or not os.path.exists(src_path):
            self.stdout.write(self.style.ERROR(f"SQLite database file not found at: {src_path}"))
            return

        dest_filename = f"morpheus_sqlite_backup_{timestamp}.sqlite3"
        dest_path = os.path.join(output_dir, dest_filename)

        self.stdout.write(f"Performing atomic online backup from {src_path} to {dest_path}...")
        try:
            # Atomic backup using Python sqlite3 online backup API
            src_conn = sqlite3.connect(src_path)
            dest_conn = sqlite3.connect(dest_path)
            with dest_conn:
                src_conn.backup(dest_conn, pages=100)
            dest_conn.close()
            src_conn.close()

            # Integrity check on backup file
            verify_conn = sqlite3.connect(dest_path)
            cursor = verify_conn.cursor()
            cursor.execute("PRAGMA integrity_check;")
            status = cursor.fetchone()[0]
            verify_conn.close()

            file_size_mb = round(os.path.getsize(dest_path) / (1024 * 1024), 2)
            if status == "ok":
                self.stdout.write(self.style.SUCCESS(f"Backup SUCCESSFUL: {dest_path} ({file_size_mb} MB)"))
                self.stdout.write(self.style.SUCCESS(f"Integrity Check: PASSED ({status})"))
                self.stdout.write("\nTo restore SQLite database:")
                self.stdout.write(f"  cp \"{dest_path}\" \"{src_path}\"")
            else:
                self.stdout.write(self.style.ERROR(f"Backup integrity check FAILED: {status}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"SQLite backup failed: {e}"))

    def _backup_postgres(self, db_conf, output_dir, timestamp):
        db_name = db_conf.get('NAME')
        user = db_conf.get('USER')
        password = db_conf.get('PASSWORD')
        host = db_conf.get('HOST', 'localhost')
        port = db_conf.get('PORT', 5432)

        dest_filename = f"morpheus_postgres_backup_{timestamp}.dump"
        dest_path = os.path.join(output_dir, dest_filename)

        # Connection URL
        conn_url = f"postgresql://{user}:{password}@{host}:{port}/{db_name}" if password else f"postgresql://{user}@{host}:{port}/{db_name}"

        self.stdout.write(f"Target Postgres Host: {host}:{port}, Database: {db_name}")
        self.stdout.write(f"Destination Archive: {dest_path}")

        # Check if pg_dump is available on system
        pg_dump_bin = shutil.which("pg_dump")
        if pg_dump_bin:
            env = os.environ.copy()
            if password:
                env['PGPASSWORD'] = password
            cmd = [
                pg_dump_bin,
                "-Fc",
                "-v",
                "--no-owner",
                "--no-acl",
                "-h", host,
                "-p", str(port),
                "-U", user,
                "-d", db_name,
                "-f", dest_path
            ]
            self.stdout.write(f"Running pg_dump command...")
            try:
                res = subprocess.run(cmd, env=env, capture_output=True, text=True, check=True)
                size_mb = round(os.path.getsize(dest_path) / (1024 * 1024), 2)
                self.stdout.write(self.style.SUCCESS(f"PostgreSQL Backup SUCCESSFUL: {dest_path} ({size_mb} MB)"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"pg_dump execution failed: {e}"))
        else:
            self.stdout.write(self.style.WARNING("pg_dump binary not found in system PATH. Render/CLI command to run:"))
            self.stdout.write(self.style.NOTICE(f"  pg_dump -Fc -v --no-owner --no-acl -d \"{conn_url}\" -f \"{dest_path}\""))

        self._print_postgres_restore_commands(conn_url, dest_path)

    def _print_postgres_restore_commands(self, conn_url, dump_path):
        self.stdout.write("\n" + self.style.MIGRATE_HEADING("=== PostgreSQL Recovery / Restore Commands ==="))
        self.stdout.write("1. Restore command (clean & overwrite existing tables):")
        self.stdout.write(self.style.NOTICE(f"  pg_restore --clean --if-exists --no-owner --no-acl -d \"{conn_url}\" \"{dump_path}\""))
        self.stdout.write("\n2. Restore via Render Dashboard:")
        self.stdout.write("  On Render Postgres -> Backups tab -> Click 'Restore' to a specific point in time or upload archive.")

    def _print_recovery_instructions(self, engine, db_conf):
        self.stdout.write(f"Recovery instructions for {engine}:")
        if 'postgresql' in engine:
            self._print_postgres_restore_commands("postgresql://user:pass@host:5432/dbname", "backup.dump")
        else:
            self.stdout.write("SQLite: Replace db.sqlite3 with your desired backup file.")
