import logging
from .models import AuditLog

logger = logging.getLogger(__name__)

def log_audit_event(actor=None, action="", target_type="", target_id="", metadata=None, ip_address=None):
    """Safely records an audit event in the database and server logs"""
    if metadata is None:
        metadata = {}

    actor_email = ""
    actor_instance = None
    if actor and getattr(actor, 'is_authenticated', False):
        actor_instance = actor
        actor_email = getattr(actor, 'email', str(actor))

    try:
        log_entry = AuditLog.objects.create(
            actor=actor_instance,
            actor_email=actor_email,
            action=action,
            target_type=target_type,
            target_id=str(target_id),
            metadata=metadata,
            ip_address=ip_address
        )
        logger.info(f"AUDIT LOG: {action} on {target_type}:{target_id} by {actor_email}")
        return log_entry
    except Exception as e:
        logger.error(f"Failed to record audit log: {str(e)}", exc_info=True)
        return None
