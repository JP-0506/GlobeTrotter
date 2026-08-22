from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    RegisterView, LoginView, MeView, ChangePasswordView,
    TripViewSet, TripStopViewSet, TripActivityViewSet,
    CityViewSet, ActivityViewSet, SavedDestinationViewSet,
    BudgetItemViewSet, TripBudgetSummaryView, DashboardSummaryView
)

router = DefaultRouter(trailing_slash=False)
router.register(r'trips', TripViewSet, basename='trip')
router.register(r'stops', TripStopViewSet, basename='trip-stop')
router.register(r'trip-activities', TripActivityViewSet, basename='trip-activity')
router.register(r'cities', CityViewSet, basename='city')
router.register(r'activities', ActivityViewSet, basename='activity')
router.register(r'saved-destinations', SavedDestinationViewSet, basename='saved-destination')
router.register(r'budget-items', BudgetItemViewSet, basename='budget-item')

urlpatterns = [
    # Auth endpoints
    path('auth/register', RegisterView.as_view(), name='auth-register'),
    path('auth/register/', RegisterView.as_view(), name='auth-register-slash'),
    path('auth/login', LoginView.as_view(), name='auth-login'),
    path('auth/login/', LoginView.as_view(), name='auth-login-slash'),
    path('auth/me', MeView.as_view(), name='auth-me'),
    path('auth/me/', MeView.as_view(), name='auth-me-slash'),
    path('auth/change-password', ChangePasswordView.as_view(), name='auth-change-password'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='auth-change-password-slash'),

    # Trip budget summary
    path('trips/<int:pk>/budget', TripBudgetSummaryView.as_view(), name='trip-budget-summary'),
    path('trips/<int:pk>/budget/', TripBudgetSummaryView.as_view(), name='trip-budget-summary-slash'),

    # Dashboard overview
    path('dashboard/summary', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary-slash'),

    # Router endpoints (CRUD viewsets)
    path('', include(router.urls)),
]
