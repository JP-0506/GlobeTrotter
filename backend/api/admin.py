from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import (
    User, City, Activity, Trip, TripStop, TripActivity,
    BudgetItem, SavedDestination, TripShare, TripCopy
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('user_id', 'email', 'name', 'is_admin', 'is_staff', 'is_active', 'created_at')
    list_filter = ('is_admin', 'is_staff', 'is_active')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('name', 'photo_url', 'language_pref')}),
        (_('Permissions'), {'fields': ('is_admin', 'is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    readonly_fields = ('created_at', 'updated_at', 'last_login')
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password', 'is_admin', 'is_staff'),
        }),
    )
    search_fields = ('email', 'name')
    ordering = ('-created_at',)


class ActivityInline(admin.TabularInline):
    model = Activity
    extra = 1


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ('city_id', 'name', 'country', 'region', 'cost_index', 'popularity')
    list_filter = ('country', 'region')
    search_fields = ('name', 'country', 'region')
    ordering = ('-popularity', 'name')
    inlines = [ActivityInline]


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ('activity_id', 'name', 'city', 'category', 'cost', 'duration_minutes')
    list_filter = ('category', 'city__country', 'city')
    search_fields = ('name', 'description', 'city__name')
    ordering = ('city', 'name')


class TripStopInline(admin.TabularInline):
    model = TripStop
    extra = 1


class BudgetItemInline(admin.TabularInline):
    model = BudgetItem
    extra = 1


class TripShareInline(admin.TabularInline):
    model = TripShare
    extra = 1


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ('trip_id', 'name', 'user', 'start_date', 'end_date', 'budget_limit', 'is_public', 'created_at')
    list_filter = ('is_public', 'start_date', 'end_date')
    search_fields = ('name', 'description', 'user__name', 'user__email', 'public_slug')
    readonly_fields = ('public_slug', 'created_at', 'updated_at')
    ordering = ('-start_date',)
    inlines = [TripStopInline, BudgetItemInline, TripShareInline]


class TripActivityInline(admin.TabularInline):
    model = TripActivity
    extra = 1


@admin.register(TripStop)
class TripStopAdmin(admin.ModelAdmin):
    list_display = ('stop_id', 'trip', 'city', 'sequence_order', 'arrival_date', 'departure_date')
    list_filter = ('city', 'trip')
    search_fields = ('trip__name', 'city__name')
    ordering = ('trip', 'sequence_order')
    inlines = [TripActivityInline]


@admin.register(TripActivity)
class TripActivityAdmin(admin.ModelAdmin):
    list_display = ('trip_activity_id', 'stop', 'activity', 'scheduled_date', 'start_time', 'effective_cost', 'sequence_order')
    list_filter = ('scheduled_date', 'stop__trip')
    search_fields = ('activity__name', 'stop__trip__name', 'stop__city__name')
    ordering = ('scheduled_date', 'sequence_order')


@admin.register(BudgetItem)
class BudgetItemAdmin(admin.ModelAdmin):
    list_display = ('budget_item_id', 'trip', 'category', 'description', 'amount', 'expense_date', 'stop')
    list_filter = ('category', 'expense_date', 'trip')
    search_fields = ('description', 'trip__name')
    ordering = ('-expense_date',)


@admin.register(SavedDestination)
class SavedDestinationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'city', 'saved_at')
    list_filter = ('saved_at', 'city')
    search_fields = ('user__name', 'user__email', 'city__name')


@admin.register(TripShare)
class TripShareAdmin(admin.ModelAdmin):
    list_display = ('id', 'trip', 'shared_with_user', 'permission', 'shared_at')
    list_filter = ('permission', 'shared_at')
    search_fields = ('trip__name', 'shared_with_user__name', 'shared_with_user__email')


@admin.register(TripCopy)
class TripCopyAdmin(admin.ModelAdmin):
    list_display = ('id', 'original_trip', 'copied_trip', 'copied_by_user', 'copied_at')
    search_fields = ('original_trip__name', 'copied_trip__name', 'copied_by_user__name')
    readonly_fields = ('copied_at',)
