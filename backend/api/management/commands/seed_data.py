from django.core.management.base import BaseCommand
from datetime import date, timedelta
from api.models import (
    User, City, Activity, Trip, TripStop, TripActivity,
    BudgetItem, SavedDestination, TripShare
)


class Command(BaseCommand):
    help = 'Seeds database with realistic cities, activities, demo users, sample trips, and budget items.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting GlobeTrotter database seeding...'))

        # ======================================================================
        # 1. Seed Demo Users
        # ======================================================================
        demo_user, _ = User.objects.get_or_create(
            email='demo@globetrotter.com',
            defaults={
                'name': 'Alex Explorer',
                'photo_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
                'language_pref': 'en',
            }
        )
        demo_user.set_password('password123')
        demo_user.save()

        alice_user, _ = User.objects.get_or_create(
            email='alice@globetrotter.com',
            defaults={
                'name': 'Alice Wanderer',
                'photo_url': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
                'language_pref': 'en',
            }
        )
        alice_user.set_password('password123')
        alice_user.save()

        admin_user, _ = User.objects.get_or_create(
            email='admin@globetrotter.com',
            defaults={
                'name': 'GlobeTrotter Admin',
                'photo_url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
                'is_staff': True,
                'is_superuser': True,
                'is_admin': True,
            }
        )
        admin_user.set_password('adminpassword')
        admin_user.save()

        self.stdout.write(self.style.SUCCESS(f'Created users: {demo_user.email}, {alice_user.email}, {admin_user.email}'))

        # ======================================================================
        # 2. Seed Cities
        # ======================================================================
        cities_data = [
            {
                'name': 'Paris', 'country': 'France', 'region': 'Europe',
                'cost_index': 110.50, 'popularity': 99, 'latitude': 48.8566, 'longitude': 2.3522,
                'image_url': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Tokyo', 'country': 'Japan', 'region': 'Asia',
                'cost_index': 105.20, 'popularity': 98, 'latitude': 35.6762, 'longitude': 139.6503,
                'image_url': 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Rome', 'country': 'Italy', 'region': 'Europe',
                'cost_index': 88.40, 'popularity': 96, 'latitude': 41.9028, 'longitude': 12.4964,
                'image_url': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop&q=80'
            },
            {
                'name': 'New York', 'country': 'United States', 'region': 'North America',
                'cost_index': 135.00, 'popularity': 97, 'latitude': 40.7128, 'longitude': -74.0060,
                'image_url': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Barcelona', 'country': 'Spain', 'region': 'Europe',
                'cost_index': 82.00, 'popularity': 94, 'latitude': 41.3879, 'longitude': 2.1699,
                'image_url': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Kyoto', 'country': 'Japan', 'region': 'Asia',
                'cost_index': 92.00, 'popularity': 93, 'latitude': 35.0116, 'longitude': 135.7681,
                'image_url': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80'
            },
            {
                'name': 'London', 'country': 'United Kingdom', 'region': 'Europe',
                'cost_index': 120.00, 'popularity': 95, 'latitude': 51.5074, 'longitude': -0.1278,
                'image_url': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Bali (Denpasar)', 'country': 'Indonesia', 'region': 'Southeast Asia',
                'cost_index': 45.00, 'popularity': 92, 'latitude': -8.4095, 'longitude': 115.1889,
                'image_url': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Dubai', 'country': 'United Arab Emirates', 'region': 'Middle East',
                'cost_index': 115.00, 'popularity': 91, 'latitude': 25.2048, 'longitude': 55.2708,
                'image_url': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Sydney', 'country': 'Australia', 'region': 'Oceania',
                'cost_index': 118.00, 'popularity': 90, 'latitude': -33.8688, 'longitude': 151.2093,
                'image_url': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Amsterdam', 'country': 'Netherlands', 'region': 'Europe',
                'cost_index': 102.00, 'popularity': 89, 'latitude': 52.3676, 'longitude': 4.9041,
                'image_url': 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=800&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Cairo', 'country': 'Egypt', 'region': 'Africa',
                'cost_index': 38.00, 'popularity': 88, 'latitude': 30.0444, 'longitude': 31.2357,
                'image_url': 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Rio de Janeiro', 'country': 'Brazil', 'region': 'South America',
                'cost_index': 58.00, 'popularity': 87, 'latitude': -22.9068, 'longitude': -43.1729,
                'image_url': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Reykjavik', 'country': 'Iceland', 'region': 'Europe',
                'cost_index': 130.00, 'popularity': 86, 'latitude': 64.1466, 'longitude': -21.9426,
                'image_url': 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Bangkok', 'country': 'Thailand', 'region': 'Southeast Asia',
                'cost_index': 48.00, 'popularity': 91, 'latitude': 13.7563, 'longitude': 100.5018,
                'image_url': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Prague', 'country': 'Czech Republic', 'region': 'Europe',
                'cost_index': 65.00, 'popularity': 88, 'latitude': 50.0755, 'longitude': 14.4378,
                'image_url': 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Cape Town', 'country': 'South Africa', 'region': 'Africa',
                'cost_index': 52.00, 'popularity': 85, 'latitude': -33.9249, 'longitude': 18.4241,
                'image_url': 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800&auto=format&fit=crop&q=80'
            },
            {
                'name': 'Singapore', 'country': 'Singapore', 'region': 'Southeast Asia',
                'cost_index': 125.00, 'popularity': 90, 'latitude': 1.3521, 'longitude': 103.8198,
                'image_url': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&auto=format&fit=crop&q=80'
            }
        ]

        city_objects = {}
        for c in cities_data:
            obj, created = City.objects.update_or_create(
                name=c['name'],
                country=c['country'],
                defaults=c
            )
            city_objects[c['name']] = obj

        self.stdout.write(self.style.SUCCESS(f'Seeded {len(city_objects)} cities.'))

        # ======================================================================
        # 3. Seed Activities
        # ======================================================================
        activities_data = [
            # Paris
            {'city': 'Paris', 'name': 'Eiffel Tower Summit Access', 'category': 'sightseeing', 'cost': 35.00, 'duration_minutes': 150, 'description': 'Panoramic views of Paris from the iconic iron summit.', 'image_url': 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=600&auto=format&fit=crop&q=80'},
            {'city': 'Paris', 'name': 'Louvre Museum Guided Tour', 'category': 'culture', 'cost': 65.00, 'duration_minutes': 180, 'description': 'Skip-the-line entrance to see the Mona Lisa and Venus de Milo.', 'image_url': 'https://images.unsplash.com/photo-1565099824688-e93eb20fe622?w=600&auto=format&fit=crop&q=80'},
            {'city': 'Paris', 'name': 'Seine River Sunset Cruise & Wine', 'category': 'relaxation', 'cost': 45.00, 'duration_minutes': 90, 'description': 'Glide past Notre-Dame and illuminated monuments.', 'image_url': 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&auto=format&fit=crop&q=80'},
            {'city': 'Paris', 'name': 'Montmartre Food & Pastry Tasting', 'category': 'food', 'cost': 80.00, 'duration_minutes': 180, 'description': 'Sample authentic croissants, cheeses, and macarons.', 'image_url': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80'},

            # Tokyo
            {'city': 'Tokyo', 'name': 'Shibuya Crossing & Harajuku Tour', 'category': 'sightseeing', 'cost': 25.00, 'duration_minutes': 120, 'description': 'Experience the busiest intersection and trendy Takeshita Street.', 'image_url': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&auto=format&fit=crop&q=80'},
            {'city': 'Tokyo', 'name': 'Tsukiji Outer Market Sushi Masterclass', 'category': 'food', 'cost': 95.00, 'duration_minutes': 150, 'description': 'Learn sushi preparation from seasoned fish market chefs.', 'image_url': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80'},
            {'city': 'Tokyo', 'name': 'teamLab Planets Digital Art Immersion', 'category': 'culture', 'cost': 38.00, 'duration_minutes': 120, 'description': 'Walk through water and body-immersive digital light exhibits.', 'image_url': 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80'},
            {'city': 'Tokyo', 'name': 'Shinjuku Omoide Yokocho Bar Crawl', 'category': 'nightlife', 'cost': 55.00, 'duration_minutes': 180, 'description': 'Explore historic lantern-lit alleyways with local craft brews.', 'image_url': 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80'},

            # Rome
            {'city': 'Rome', 'name': 'Colosseum & Roman Forum VIP Entry', 'category': 'culture', 'cost': 45.00, 'duration_minutes': 180, 'description': 'Walk the gladiator arena floor and ancient ruins.', 'image_url': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop&q=80'},
            {'city': 'Rome', 'name': 'Handmade Pasta & Gelato Workshop', 'category': 'food', 'cost': 75.00, 'duration_minutes': 150, 'description': 'Make fettuccine and tiramisu in a historic Trastevere kitchen.', 'image_url': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80'},
            {'city': 'Rome', 'name': 'Vatican Museums & Sistine Chapel Tour', 'category': 'culture', 'cost': 70.00, 'duration_minutes': 210, 'description': 'Marvel at Michelangelo\'s ceiling and St. Peter\'s Basilica.', 'image_url': 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=600&auto=format&fit=crop&q=80'},

            # Kyoto
            {'city': 'Kyoto', 'name': 'Fushimi Inari 10,000 Torii Gates Hike', 'category': 'adventure', 'cost': 0.00, 'duration_minutes': 120, 'description': 'Hike through vermillion shrine gates into the sacred forest.', 'image_url': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop&q=80'},
            {'city': 'Kyoto', 'name': 'Traditional Tea Ceremony in Gion', 'category': 'culture', 'cost': 40.00, 'duration_minutes': 60, 'description': 'Authentic matcha preparation ritual in a traditional machiya.', 'image_url': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80'},
            {'city': 'Kyoto', 'name': 'Arashiyama Bamboo Grove & Monkey Park', 'category': 'adventure', 'cost': 15.00, 'duration_minutes': 150, 'description': 'Stroll towering bamboo stalks and feed wild macaques on the hill.', 'image_url': 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80'},

            # Barcelona
            {'city': 'Barcelona', 'name': 'Sagrada Familia Towers & Audioguide', 'category': 'sightseeing', 'cost': 40.00, 'duration_minutes': 120, 'description': 'Gaudí’s breathtaking masterpiece with nativity tower climb.', 'image_url': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&auto=format&fit=crop&q=80'},
            {'city': 'Barcelona', 'name': 'Tapas, Wine & Flamenco Night', 'category': 'food', 'cost': 65.00, 'duration_minutes': 180, 'description': 'Passionate flamenco performance accompanied by tapas.', 'image_url': 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=600&auto=format&fit=crop&q=80'},
            {'city': 'Barcelona', 'name': 'Park Güell Monumental Zone', 'category': 'sightseeing', 'cost': 18.00, 'duration_minutes': 90, 'description': 'Vibrant mosaic salamanders and panoramic coastal views.', 'image_url': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&auto=format&fit=crop&q=80'},

            # Bali
            {'city': 'Bali (Denpasar)', 'name': 'Ubud Sacred Monkey Forest & Rice Terraces', 'category': 'adventure', 'cost': 20.00, 'duration_minutes': 240, 'description': 'Tegalalang emerald rice terraces and playful macaque sanctuary.', 'image_url': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&auto=format&fit=crop&q=80'},
            {'city': 'Bali (Denpasar)', 'name': 'Mount Batur Sunrise Volcano Trek', 'category': 'adventure', 'cost': 55.00, 'duration_minutes': 360, 'description': 'Early morning trek above cloud level followed by natural hot springs.', 'image_url': 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&auto=format&fit=crop&q=80'},
            {'city': 'Bali (Denpasar)', 'name': 'Balinese Spa Massage & Floral Bath', 'category': 'relaxation', 'cost': 35.00, 'duration_minutes': 120, 'description': 'Herbal aromatherapy massage overlooking jungle greenery.', 'image_url': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80'},
        ]

        total_activities = 0
        for act in activities_data:
            city_obj = city_objects.get(act['city'])
            if city_obj:
                Activity.objects.update_or_create(
                    city=city_obj,
                    name=act['name'],
                    defaults={
                        'description': act.get('description', ''),
                        'category': act.get('category', 'sightseeing'),
                        'cost': act.get('cost', 0),
                        'duration_minutes': act.get('duration_minutes', 120),
                        'image_url': act.get('image_url', ''),
                    }
                )
                total_activities += 1

        self.stdout.write(self.style.SUCCESS(f'Seeded {total_activities} activities.'))

        # ======================================================================
        # 4. Seed Saved Destinations for Demo User
        # ======================================================================
        for cityName in ['Tokyo', 'Paris', 'Rome', 'Bali (Denpasar)']:
            if cityName in city_objects:
                SavedDestination.objects.get_or_create(user=demo_user, city=city_objects[cityName])

        # ======================================================================
        # 5. Seed Sample Trips for Demo User
        # ======================================================================
        # Trip 1: Upcoming Grand Europe Tour (Paris -> Rome -> Barcelona)
        t1_start = date.today() + timedelta(days=20)
        t1_end = t1_start + timedelta(days=12)
        trip1, _ = Trip.objects.get_or_create(
            user=demo_user,
            name='Grand Europe Summer Adventure',
            defaults={
                'description': 'Exploring the architectural wonders and culinary delights of France, Italy, and Spain.',
                'start_date': t1_start,
                'end_date': t1_end,
                'budget_limit': 3500.00,
                'cover_photo_url': 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&auto=format&fit=crop&q=80',
                'is_public': True,
                'public_slug': 'grand-europe-summer-adventure'
            }
        )

        # Stop 1: Paris (Days 1 to 4)
        stop1, _ = TripStop.objects.get_or_create(
            trip=trip1,
            city=city_objects['Paris'],
            defaults={
                'sequence_order': 1,
                'arrival_date': t1_start,
                'departure_date': t1_start + timedelta(days=4),
                'notes': 'Stay near Le Marais. Take metro pass for zones 1-3.'
            }
        )
        paris_eiffel = Activity.objects.filter(city=city_objects['Paris'], name__icontains='Eiffel').first()
        if paris_eiffel:
            TripActivity.objects.get_or_create(
                stop=stop1,
                activity=paris_eiffel,
                defaults={'scheduled_date': t1_start + timedelta(days=1), 'sequence_order': 1, 'cost_override': 35.00}
            )
        paris_louvre = Activity.objects.filter(city=city_objects['Paris'], name__icontains='Louvre').first()
        if paris_louvre:
            TripActivity.objects.get_or_create(
                stop=stop1,
                activity=paris_louvre,
                defaults={'scheduled_date': t1_start + timedelta(days=2), 'sequence_order': 1, 'cost_override': 65.00}
            )

        # Stop 2: Rome (Days 4 to 8)
        stop2, _ = TripStop.objects.get_or_create(
            trip=trip1,
            city=city_objects['Rome'],
            defaults={
                'sequence_order': 2,
                'arrival_date': t1_start + timedelta(days=4),
                'departure_date': t1_start + timedelta(days=8),
                'notes': 'Flight from CDG to FCO. Vatican tickets pre-booked.'
            }
        )
        rome_colosseum = Activity.objects.filter(city=city_objects['Rome'], name__icontains='Colosseum').first()
        if rome_colosseum:
            TripActivity.objects.get_or_create(
                stop=stop2,
                activity=rome_colosseum,
                defaults={'scheduled_date': t1_start + timedelta(days=5), 'sequence_order': 1, 'cost_override': 45.00}
            )

        # Stop 3: Barcelona (Days 8 to 12)
        stop3, _ = TripStop.objects.get_or_create(
            trip=trip1,
            city=city_objects['Barcelona'],
            defaults={
                'sequence_order': 3,
                'arrival_date': t1_start + timedelta(days=8),
                'departure_date': t1_end,
                'notes': 'Beach day and Gothic Quarter exploration.'
            }
        )
        barca_sagrada = Activity.objects.filter(city=city_objects['Barcelona'], name__icontains='Sagrada').first()
        if barca_sagrada:
            TripActivity.objects.get_or_create(
                stop=stop3,
                activity=barca_sagrada,
                defaults={'scheduled_date': t1_start + timedelta(days=9), 'sequence_order': 1, 'cost_override': 40.00}
            )

        # Budget Items for Trip 1
        BudgetItem.objects.get_or_create(
            trip=trip1,
            category='transport',
            description='Roundtrip International Flights',
            defaults={'amount': 950.00, 'expense_date': t1_start}
        )
        BudgetItem.objects.get_or_create(
            trip=trip1,
            category='stay',
            description='Boutique Hotel in Paris (4 nights)',
            defaults={'amount': 680.00, 'expense_date': t1_start, 'stop': stop1}
        )
        BudgetItem.objects.get_or_create(
            trip=trip1,
            category='stay',
            description='Rome City Center Apartment (4 nights)',
            defaults={'amount': 520.00, 'expense_date': t1_start + timedelta(days=4), 'stop': stop2}
        )
        BudgetItem.objects.get_or_create(
            trip=trip1,
            category='meals',
            description='Dining & Wine Budget (Estimated)',
            defaults={'amount': 450.00, 'expense_date': t1_start}
        )

        # Trip 2: Japan Journey (Tokyo -> Kyoto)
        t2_start = date.today() + timedelta(days=60)
        t2_end = t2_start + timedelta(days=10)
        trip2, _ = Trip.objects.get_or_create(
            user=demo_user,
            name='Discover Japan: Neon & Tradition',
            defaults={
                'description': 'From the bustling streets of Tokyo to the tranquil zen gardens of Kyoto.',
                'start_date': t2_start,
                'end_date': t2_end,
                'budget_limit': 4200.00,
                'cover_photo_url': 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
                'is_public': False
            }
        )

        # Share Trip 1 with Alice (collaborator with edit permission)
        TripShare.objects.get_or_create(
            trip=trip1,
            shared_with_user=alice_user,
            defaults={'permission': 'edit'}
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded demo trips, stops, activities, and budget items!'))
        self.stdout.write(self.style.SUCCESS('Seeding complete!'))
