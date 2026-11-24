from rest_framework import permissions

class IsAdminRole(permissions.BasePermission):
    """Allows access only to authenticated users with admin or superadmin role."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role in ['admin', 'superadmin'] or request.user.is_staff or request.user.is_superuser)
        )

class IsStudentRole(permissions.BasePermission):
    """Allows access to authenticated students (or admins in preview mode)."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

class IsOwnerOrAdmin(permissions.BasePermission):
    """Object-level permission: owner can view/edit their own object; admins can view."""
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin_or_superadmin:
            return True
        user_attr = getattr(obj, 'user', None)
        return user_attr == request.user
