"""
ASGI config for globetrotter project.
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'globetrotter.settings')

application = get_asgi_application()
