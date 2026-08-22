"""
WSGI config for globetrotter project.
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'globetrotter.settings')

application = get_wsgi_application()
