#!/usr/bin/env bash
# exit on error
set -o errexit

# 1. Install all backend dependencies (no requirements.txt needed!)
pip install django djangorestframework django-cors-headers pymongo python-dotenv whitenoise pyjwt spacy pypdf requests gunicorn

# 2. Download the English NLP model for the Resume Scorer
python -m spacy download en_core_web_sm

# 3. Collect static files for production
python manage.py collectstatic --no-input
