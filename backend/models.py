from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify
import uuid


# ==============================================================================
# 1. Custom User Manager & User Model
# ==============================================================================

class CustomUserManager(BaseUserManager):
    """Define a model manager for User model with email as unique identifier."""

    def create_user(self, email, name, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_admin', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    users table: Authenticated account holder; owns trips and favorites.
    """
    user_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=255, unique=True)
    photo_url = models.URLField(max_length=500, blank=True, null=True)
    language_pref = models.CharField(max_length=10, default='en')
    is_admin = models.BooleanField(
        default=False,
        help_text=_('Gates the analytics dashboard and administrative features.')
    )
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'
        verbose_name = _('User')
        verbose_name_plural = _('Users')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.email})"


# ==============================================================================
# 2. Cities Model
# ==============================================================================

class City(models.Model):
    """
    cities table: Master/reference data used by search and recommendations.
    """
    city_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=150)
    country = models.CharField(max_length=100)
    region = models.CharField(max_length=100, blank=True, null=True)
    cost_index = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Relative cost-of-living index for budgeting.')
    )
    popularity = models.IntegerField(
        default=0,
        help_text=_('Drives recommended destinations.')
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    image_url = models.URLField(max_length=500, blank=True, null=True)

    class Meta:
        db_table = 'cities'
        verbose_name = _('City')
        verbose_name_plural = _('Cities')
        ordering = ['-popularity', 'name']
        constraints = [
            models.UniqueConstraint(
                fields=['name', 'country'],
                name='unique_city_country'
            )
        ]

    def __str__(self):
        return f"{self.name}, {self.country}"


# ==============================================================================
# 3. Activities Model
# ==============================================================================

class Activity(models.Model):
    """
    activities table: A bookable/doable thing at a given city; browsed via Activity Search.
    """
    CATEGORY_CHOICES = [
        ('sightseeing', _('Sightseeing')),
        ('food', _('Food & Dining')),
        ('adventure', _('Adventure & Outdoors')),
        ('culture', _('Culture & History')),
        ('nightlife', _('Nightlife')),
        ('shopping', _('Shopping')),
        ('relaxation', _('Relaxation & Wellness')),
        ('other', _('Other')),
    ]

    activity_id = models.AutoField(primary_key=True)
    city = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name='activities',
        db_column='city_id'
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, blank=True, null=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    image_url = models.URLField(max_length=500, blank=True, null=True)

    class Meta:
        db_table = 'activities'
        verbose_name = _('Activity')
        verbose_name_plural = _('Activities')
        ordering = ['city', 'name']

    def __str__(self):
        return f"{self.name} ({self.city.name})"


# ==============================================================================
# 4. Trips Model
# ==============================================================================

class Trip(models.Model):
    """
    trips table: A user's trip — the top-level container created on the 'Create Trip' screen.
    """
    trip_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='trips',
        db_column='user_id'
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField()
    budget_limit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_("User's planned maximum budget.")
    )
    cover_photo_url = models.URLField(max_length=500, blank=True, null=True)
    is_public = models.BooleanField(
        default=False,
        help_text=_('Enables the shareable public view.')
    )
    public_slug = models.SlugField(
        max_length=100,
        unique=True,
        blank=True,
        null=True,
        help_text=_('Used in the public share URL.')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'trips'
        verbose_name = _('Trip')
        verbose_name_plural = _('Trips')
        ordering = ['-start_date']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(end_date__gte=models.F('start_date')),
                name='check_trip_end_date_gte_start_date'
            )
        ]

    def clean(self):
        super().clean()
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValidationError({
                'end_date': _('Trip end date cannot be earlier than start date.')
            })

    def save(self, *args, **kwargs):
        # Auto-generate public_slug if empty and marked public
        if not self.public_slug and self.is_public:
            base_slug = slugify(self.name) or 'trip'
            self.public_slug = f"{base_slug}-{uuid.uuid4().hex[:8]}"
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.start_date} -> {self.end_date})"


# ==============================================================================
# 5. Trip Stops Model
# ==============================================================================

class TripStop(models.Model):
    """
    trip_stops table: A city visited on a trip; ordered, with its own date range.
    The core of the Itinerary Builder.
    """
    stop_id = models.AutoField(primary_key=True)
    trip = models.ForeignKey(
        Trip,
        on_delete=models.CASCADE,
        related_name='stops',
        db_column='trip_id'
    )
    city = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name='trip_stops',
        db_column='city_id'
    )
    sequence_order = models.PositiveIntegerField(
        help_text=_('Supports drag-to-reorder.')
    )
    arrival_date = models.DateField()
    departure_date = models.DateField()
    notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'trip_stops'
        verbose_name = _('Trip Stop')
        verbose_name_plural = _('Trip Stops')
        ordering = ['trip', 'sequence_order']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(departure_date__gte=models.F('arrival_date')),
                name='check_stop_departure_gte_arrival'
            ),
            models.UniqueConstraint(
                fields=['trip', 'sequence_order'],
                name='unique_trip_sequence_order'
            )
        ]

    def clean(self):
        super().clean()
        if self.arrival_date and self.departure_date and self.departure_date < self.arrival_date:
            raise ValidationError({
                'departure_date': _('Departure date cannot be earlier than arrival date.')
            })

        # Validate stop date range falls within parent trip dates
        if self.trip_id:
            trip = self.trip
            if self.arrival_date and (self.arrival_date < trip.start_date or self.arrival_date > trip.end_date):
                raise ValidationError({
                    'arrival_date': _(f'Stop arrival date must fall within the trip dates ({trip.start_date} to {trip.end_date}).')
                })
            if self.departure_date and (self.departure_date < trip.start_date or self.departure_date > trip.end_date):
                raise ValidationError({
                    'departure_date': _(f'Stop departure date must fall within the trip dates ({trip.start_date} to {trip.end_date}).')
                })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Stop #{self.sequence_order}: {self.city.name} ({self.trip.name})"


# ==============================================================================
# 6. Trip Activities Model
# ==============================================================================

class TripActivity(models.Model):
    """
    trip_activities table: An activity scheduled into a specific stop and day.
    Feeds the timeline/calendar view.
    """
    trip_activity_id = models.AutoField(primary_key=True)
    stop = models.ForeignKey(
        TripStop,
        on_delete=models.CASCADE,
        related_name='activities',
        db_column='stop_id'
    )
    activity = models.ForeignKey(
        Activity,
        on_delete=models.CASCADE,
        related_name='trip_activities',
        db_column='activity_id'
    )
    scheduled_date = models.DateField(
        help_text=_("Must fall within the stop's date range.")
    )
    start_time = models.TimeField(null=True, blank=True)
    cost_override = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('User-edited cost, if different from default.')
    )
    sequence_order = models.PositiveIntegerField(
        default=1,
        help_text=_('Order within the day.')
    )

    class Meta:
        db_table = 'trip_activities'
        verbose_name = _('Trip Activity')
        verbose_name_plural = _('Trip Activities')
        ordering = ['scheduled_date', 'sequence_order', 'start_time']
        constraints = [
            models.UniqueConstraint(
                fields=['stop', 'scheduled_date', 'sequence_order'],
                name='unique_stop_date_sequence_order'
            )
        ]

    def clean(self):
        super().clean()
        # Validation 1: Activity must belong to the stop's city
        if self.stop_id and self.activity_id:
            if self.activity.city_id != self.stop.city_id:
                raise ValidationError({
                    'activity': _(f"The activity must belong to the stop's city ({self.stop.city.name}).")
                })

        # Validation 2: Scheduled date must fall within stop's date range
        if self.stop_id and self.scheduled_date:
            stop = self.stop
            if self.scheduled_date < stop.arrival_date or self.scheduled_date > stop.departure_date:
                raise ValidationError({
                    'scheduled_date': _(f"Scheduled date must fall within the stop's dates ({stop.arrival_date} to {stop.departure_date}).")
                })

    @property
    def effective_cost(self):
        """Returns cost_override if specified, otherwise the default activity cost."""
        if self.cost_override is not None:
            return self.cost_override
        return self.activity.cost

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.activity.name} on {self.scheduled_date} (Stop: {self.stop.city.name})"


# ==============================================================================
# 7. Budget Items Model
# ==============================================================================

class BudgetItem(models.Model):
    """
    budget_items table: Line-item expenses feeding the Trip Budget & Cost Breakdown screen.
    """
    CATEGORY_CHOICES = [
        ('transport', _('Transport')),
        ('stay', _('Stay / Accommodation')),
        ('activities', _('Activities')),
        ('meals', _('Meals & Dining')),
        ('other', _('Other')),
    ]

    budget_item_id = models.AutoField(primary_key=True)
    trip = models.ForeignKey(
        Trip,
        on_delete=models.CASCADE,
        related_name='budget_items',
        db_column='trip_id'
    )
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.CharField(max_length=255, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    expense_date = models.DateField(null=True, blank=True)
    stop = models.ForeignKey(
        TripStop,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='budget_items',
        db_column='stop_id'
    )

    class Meta:
        db_table = 'budget_items'
        verbose_name = _('Budget Item')
        verbose_name_plural = _('Budget Items')
        ordering = ['-expense_date', '-budget_item_id']

    def __str__(self):
        return f"[{self.category}] {self.description or 'Expense'}: ${self.amount}"


# ==============================================================================
# 8. Saved Destinations Model
# ==============================================================================

class SavedDestination(models.Model):
    """
    saved_destinations table: A user's favorited cities, shown in Profile / Settings.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='saved_destinations',
        db_column='user_id'
    )
    city = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name='saved_by_users',
        db_column='city_id'
    )
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'saved_destinations'
        verbose_name = _('Saved Destination')
        verbose_name_plural = _('Saved Destinations')
        ordering = ['-saved_at']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'city'],
                name='unique_user_saved_city'
            )
        ]

    def __str__(self):
        return f"{self.user.name} saved {self.city.name}"


# ==============================================================================
# 9. Trip Shares Model
# ==============================================================================

class TripShare(models.Model):
    """
    trip_shares table: Collaborators a trip has been shared with, and their permission level.
    """
    PERMISSION_CHOICES = [
        ('view', _('View')),
        ('edit', _('Edit')),
    ]

    trip = models.ForeignKey(
        Trip,
        on_delete=models.CASCADE,
        related_name='shares',
        db_column='trip_id'
    )
    shared_with_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='shared_trips',
        db_column='shared_with_user_id'
    )
    permission = models.CharField(max_length=20, choices=PERMISSION_CHOICES, default='view')
    shared_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'trip_shares'
        verbose_name = _('Trip Share')
        verbose_name_plural = _('Trip Shares')
        ordering = ['-shared_at']
        constraints = [
            models.UniqueConstraint(
                fields=['trip', 'shared_with_user'],
                name='unique_trip_share'
            )
        ]

    def __str__(self):
        return f"{self.trip.name} shared with {self.shared_with_user.name} ({self.permission})"


# ==============================================================================
# 10. Trip Copies Model
# ==============================================================================

class TripCopy(models.Model):
    """
    trip_copies table: Tracks lineage when a public itinerary is copied via 'Copy Trip'.
    """
    original_trip = models.ForeignKey(
        Trip,
        on_delete=models.CASCADE,
        related_name='copies_originated',
        db_column='original_trip_id'
    )
    copied_trip = models.ForeignKey(
        Trip,
        on_delete=models.CASCADE,
        related_name='copy_lineage',
        db_column='copied_trip_id'
    )
    copied_by_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='trip_copies',
        db_column='copied_by_user_id'
    )
    copied_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'trip_copies'
        verbose_name = _('Trip Copy')
        verbose_name_plural = _('Trip Copies')
        ordering = ['-copied_at']
        constraints = [
            models.UniqueConstraint(
                fields=['original_trip', 'copied_trip'],
                name='unique_trip_copy'
            )
        ]

    def __str__(self):
        return f"Trip #{self.copied_trip_id} copied from #{self.original_trip_id} by {self.copied_by_user.name}"
