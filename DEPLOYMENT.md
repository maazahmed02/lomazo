# Deployment Guide

This document outlines the steps needed to deploy the health application.

## Environment Variables Setup

Create a `.env` file in the backend directory with the following variables:

```
# Google Cloud settings
GOOGLE_CLOUD_PROJECT_ID=avi-cdtm-hack-team-4688
GOOGLE_CLOUD_REGION=europe-west3

# Flask settings
FLASK_SECRET_KEY=your-secret-key-here
FLASK_ENV=development
FLASK_DEBUG=1
FLASK_PORT=5050

# API settings
BACKEND_API_URL=http://localhost:5050/api
```

For production, update these values accordingly.

## Frontend Environment Variables

Create a `.env` file in the lifestyle-questionnaire-app directory:

```
# API settings for frontend
REACT_APP_API_URL=http://localhost:5050/api
```

In production, this should point to your deployed backend URL.

## Backend Deployment

1. **Setup on Render.com**
   - Sign up at [render.com](https://render.com)
   - Create a Web Service and connect to your GitHub repository
   - Set the following:
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `cd backend && gunicorn app:app`
   - Add the environment variables listed above
   - Choose an appropriate plan (Free tier for testing)

## Frontend Deployment

1. **Setup on Vercel**
   - Sign up at [vercel.com](https://vercel.com)
   - Import your project from GitHub
   - Configure build settings:
     - Framework Preset: Other
     - Build Command: `npx expo export:web`
     - Output Directory: `web-build`
   - Add environment variables:
     - `REACT_APP_API_URL`: URL of your Render-deployed backend
   - Deploy

## Production Considerations

1. **API Keys**: Generate proper secret keys for production:
   ```bash
   python -c "import secrets; print(secrets.token_hex(24))"
   ```

2. **CORS Configuration**: Update the CORS settings in `app.py` to only allow requests from your frontend domain.

3. **Performance**: Consider adding caching for document processing results.

## Mobile App Distribution

If you wish to build native mobile apps:

1. Install EAS CLI: `npm install -g eas-cli`
2. Configure with `eas build:configure`
3. Build:
   ```bash
   cd lifestyle-questionnaire-app
   eas build --platform ios  # For iOS
   eas build --platform android  # For Android
   ``` 