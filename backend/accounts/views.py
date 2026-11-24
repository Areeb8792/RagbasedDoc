from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import User
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer,
    ProfileUpdateSerializer, ChangePasswordSerializer,
    AdminUserManagementSerializer
)
from .permissions import IsAdminRole
from audit.services import log_audit_event

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        log_audit_event(
            actor=user,
            action='user_registered',
            target_type='User',
            target_id=str(user.id),
            metadata={'username': user.username, 'role': user.role, 'email': user.email}
        )
        return Response({
            'success': True,
            'message': 'Registration successful! You may now log in.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = data['user']
        log_audit_event(
            actor=user,
            action='user_logged_in',
            target_type='User',
            target_id=str(user.id),
            metadata={'username': user.username, 'ip': request.META.get('REMOTE_ADDR')}
        )
        return Response({
            'success': True,
            'tokens': {
                'access': data['access'],
                'refresh': data['refresh']
            },
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)

class MeProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        serializer = ProfileUpdateSerializer(self.request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': 'Profile updated successfully.',
            'user': UserSerializer(self.request.user).data
        })

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        log_audit_event(
            actor=request.user,
            action='password_changed',
            target_type='User',
            target_id=str(request.user.id)
        )
        return Response({
            'success': True,
            'message': 'Password changed successfully.'
        }, status=status.HTTP_200_OK)

class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = AdminUserManagementSerializer
    permission_classes = [IsAdminRole]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['role', 'is_active', 'department']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'student_id']
    ordering_fields = ['date_joined', 'last_login', 'username']

class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserManagementSerializer
    permission_classes = [IsAdminRole]
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        log_audit_event(
            actor=request.user,
            action='admin_updated_user',
            target_type='User',
            target_id=str(kwargs.get('id')),
            metadata=request.data
        )
        return response
