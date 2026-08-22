from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, timedelta
from api.models import (
    User, City, Activity, Trip, TripStop, TripActivity,
    BudgetItem, SavedDestination, TripShare
)


class GlobeTrotterAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create test users
        self.user1 = User.objects.create_user(
            email='john@example.com',
            name='John Doe',
            password='password123'
        )
        self.user2 = User.objects.create_user(
            email='jane@example.com',
            name='Jane Doe',
            password='password123'
        )

        # Create sample cities and activity
        self.city1 = City.objects.create(
            name='Paris',
            country='France',
            cost_index=110.0,
            popularity=95
        )
        self.city2 = City.objects.create(
            name='Rome',
            country='Italy',
            cost_index=90.0,
            popularity=90
        )
        self.activity1 = Activity.objects.create(
            city=self.city1,
            name='Eiffel Tower Tour',
            category='sightseeing',
            cost=35.00,
            duration_minutes=120
        )

    def test_user_registration_and_login(self):
        # Register
        reg_response = self.client.post('/api/auth/register', {
            'email': 'newuser@example.com',
            'name': 'New User',
            'password': 'password123'
        }, format='json')
        self.assertEqual(reg_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(reg_response.data['success'])
        self.assertIn('token', reg_response.data['data'])

        # Login
        login_response = self.client.post('/api/auth/login', {
            'email': 'newuser@example.com',
            'password': 'password123'
        }, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertTrue(login_response.data['success'])
        self.assertEqual(login_response.data['data']['user']['email'], 'newuser@example.com')

    def test_city_and_activity_search(self):
        # Cities list
        res = self.client.get('/api/cities')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['success'])
        self.assertEqual(len(res.data['data']), 2)

        # Recommended cities
        rec_res = self.client.get('/api/cities/recommended?limit=1')
        self.assertEqual(rec_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(rec_res.data['data']), 1)
        self.assertEqual(rec_res.data['data'][0]['name'], 'Paris')

        # Activities list
        act_res = self.client.get(f'/api/activities?city_id={self.city1.city_id}')
        self.assertEqual(act_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(act_res.data['data']), 1)

    def test_trip_crud_and_budget(self):
        # Authenticate John
        self.client.force_authenticate(user=self.user1)

        start = date.today() + timedelta(days=10)
        end = start + timedelta(days=5)

        # Create Trip
        trip_res = self.client.post('/api/trips', {
            'name': 'Europe Getaway',
            'description': 'Summer vacation in Europe',
            'start_date': start.isoformat(),
            'end_date': end.isoformat(),
            'budget_limit': '2500.00',
            'is_public': True
        }, format='json')
        self.assertEqual(trip_res.status_code, status.HTTP_201_CREATED)
        trip_id = trip_res.data['data']['trip_id']

        # Add Stop
        stop_res = self.client.post('/api/stops', {
            'trip': trip_id,
            'city': self.city1.city_id,
            'sequence_order': 1,
            'arrival_date': start.isoformat(),
            'departure_date': (start + timedelta(days=3)).isoformat(),
            'notes': 'Booked hotel near center.'
        }, format='json')
        self.assertEqual(stop_res.status_code, status.HTTP_201_CREATED)
        stop_id = stop_res.data['data']['stop_id']

        # Add Activity to Stop
        act_res = self.client.post('/api/trip-activities', {
            'stop': stop_id,
            'activity': self.activity1.activity_id,
            'scheduled_date': (start + timedelta(days=1)).isoformat(),
            'cost_override': '30.00',
            'sequence_order': 1
        }, format='json')
        self.assertEqual(act_res.status_code, status.HTTP_201_CREATED)

        # Add Budget Item
        budget_item_res = self.client.post('/api/budget-items', {
            'trip': trip_id,
            'category': 'transport',
            'description': 'Flight to Paris',
            'amount': '450.00',
            'expense_date': start.isoformat()
        }, format='json')
        self.assertEqual(budget_item_res.status_code, status.HTTP_201_CREATED)

        # Check Trip Budget Summary
        budget_summary = self.client.get(f'/api/trips/{trip_id}/budget')
        self.assertEqual(budget_summary.status_code, status.HTTP_200_OK)
        self.assertEqual(budget_summary.data['data']['budget_limit'], 2500.0)
        self.assertEqual(budget_summary.data['data']['total_actual_spent'], 450.0)
        self.assertEqual(budget_summary.data['data']['scheduled_activities_cost'], 30.0)
        self.assertEqual(budget_summary.data['data']['remaining_budget'], 2050.0)

    def test_saved_destinations(self):
        self.client.force_authenticate(user=self.user1)

        # Save Paris
        save_res = self.client.post('/api/saved-destinations', {
            'city_id': self.city1.city_id
        }, format='json')
        self.assertEqual(save_res.status_code, status.HTTP_201_CREATED)

        # List saved
        list_res = self.client.get('/api/saved-destinations')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data['data']), 1)
        self.assertEqual(list_res.data['data'][0]['city_details']['name'], 'Paris')

        # Unsave
        del_res = self.client.delete(f'/api/saved-destinations/unsave?city_id={self.city1.city_id}')
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)
        self.assertEqual(SavedDestination.objects.filter(user=self.user1).count(), 0)
