"""
Django settings for BhojanQR project.
Restaurant Digital Menu and QR Order System.
Internship Assignment for Atronz Innovations.
"""

from pathlib import Path
import os
from dotenv import load_dotenv
import dj_database_url

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-bhojan-qr-secret-key-atronz-innovations-2026')

DEBUG = os.getenv('DEBUG', 'True') == 'True'

def _csv_env(name: str, default: str = ''):
    return [v.strip() for v in os.getenv(name, default).split(',') if v.strip()]


ALLOWED_HOSTS = _csv_env(
    'ALLOWED_HOSTS',
    'localhost,127.0.0.1,192.168.1.5,10.218.105.8,backend',
)
# Render/Vercel-hosted backends commonly expose a hostname env var.
for _host_env in ('RENDER_EXTERNAL_HOSTNAME', 'DJANGO_ALLOWED_HOST'):
    _host_val = os.getenv(_host_env, '').strip()
    if _host_val and _host_val not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(_host_val)

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',
    'corsheaders',

    # Local apps
    'menu',
    'tables',
    'orders',
    'accounts',
] 

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# PostgreSQL Database Configuration
# PostgreSQL Database Configuration
if os.getenv("DATABASE_URL"):
    DATABASES = {
        "default": dj_database_url.config(
            default=os.getenv("DATABASE_URL"),
            conn_max_age=600,
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("DB_NAME", "bhojan_db"),
            "USER": os.getenv("DB_USER", "bhojan_user"),
            "PASSWORD": os.getenv("DB_PASSWORD", ""),
            "HOST": os.getenv("DB_HOST", "localhost"),
            "PORT": os.getenv("DB_PORT", "5432"),
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# API URLs are registered without trailing slashes (trailing_slash=False in routers),
# so disable Django's APPEND_SLASH to avoid POST-redirect conflicts.
APPEND_SLASH = False

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_PAGINATION_CLASS': None,
}

# CSRF trusted origins for session-authenticated staff portals.
# Production: set CSRF_TRUSTED_ORIGINS to the exact frontend origin(s), e.g.
# https://your-app.vercel.app (comma-separated). Do not use unsafe wildcards.
CSRF_TRUSTED_ORIGINS = _csv_env(
    'CSRF_TRUSTED_ORIGINS',
    'http://localhost:3000,http://127.0.0.1:3000,http://192.168.1.5:3000,http://10.218.105.8:3000',
)

# CORS settings for frontend connection. Keep credentials enabled for session auth.
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = _csv_env(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000,http://127.0.0.1:3000,http://192.168.1.5:3000,http://10.218.105.8:3000',
)
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Public URL used in table QR codes and as a trusted frontend origin.
FRONTEND_PUBLIC_URL = os.getenv('FRONTEND_PUBLIC_URL', 'http://10.218.105.8:3000')
NEXT_PUBLIC_BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', '')

# Ensure configured frontend origins are always allowed for CORS and CSRF.
for _origin_env in ('FRONTEND_PUBLIC_URL', 'NEXT_PUBLIC_BASE_URL', 'FRONTEND_URL'):
    _frontend_origin = os.getenv(_origin_env, '').strip().rstrip('/')
    if not _frontend_origin.startswith(('http://', 'https://')):
        continue
    if _frontend_origin not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(_frontend_origin)
    if _frontend_origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(_frontend_origin)

# Production deployment behind HTTPS proxy (Render/Vercel-backed API).
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = os.getenv('USE_X_FORWARDED_HOST', 'True') == 'True'

# Cookie settings for session-auth + CSRF across frontend/backend deployments.
# For cross-site frontend (Vercel) -> backend (Render), SameSite=None and Secure
# are required. Override via env if using same-site proxying.
SESSION_COOKIE_SAMESITE = os.getenv('SESSION_COOKIE_SAMESITE', 'Lax' if DEBUG else 'None')
CSRF_COOKIE_SAMESITE = os.getenv('CSRF_COOKIE_SAMESITE', 'Lax' if DEBUG else 'None')
SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'False' if DEBUG else 'True') == 'True'
CSRF_COOKIE_SECURE = os.getenv('CSRF_COOKIE_SECURE', 'False' if DEBUG else 'True') == 'True'
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False  # frontend JS/axios reads csrftoken cookie for X-CSRFToken header
CSRF_USE_SESSIONS = os.getenv('CSRF_USE_SESSIONS', 'False') == 'True'
