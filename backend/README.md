# ParkWise Melbourne — Backend

Python Flask backend for the ParkWise Melbourne parking assistant app.
Handles parking session CRUD operations via Supabase REST API.

## Tech Stack

- Python 3.11+
- Flask
- flask-cors
- requests
- Supabase (PostgreSQL)

## Local Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:

   ```bash
   python -m venv venv
   venv\Scripts\activate        # Windows
   source venv/bin/activate     # macOS/Linux
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file (copy from `.env.example`):

   ```bash
   copy .env.example .env       # Windows
   cp .env.example .env         # macOS/Linux
   ```

5. Fill in your Supabase credentials in `.env`:

   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

6. Run the server:

   ```bash
   python app.py
   ```

   The backend starts at `http://localhost:5000`.

## API Endpoints

| Method | Endpoint                    | Description                       |
|--------|-----------------------------|------------------------------------|
| GET    | `/`                         | Root health check (JSON)          |
| GET    | `/api/health`               | Health check                      |
| POST   | `/api/parking_sessions`     | Save a parking session            |
| GET    | `/api/parking_sessions`     | Get recent parking sessions       |

### POST /api/parking_sessions

Request body (JSON):

```json
{
  "user_type": "guest",
  "full_name": null,
  "email": null,
  "phone_number": null,
  "location_choice": "demo",
  "parking_duration": "2 hours",
  "parking_purpose": "Work",
  "selected_zone": "Swan Street",
  "parking_status": "green",
  "result": "Parking Confirmed",
  "rule_summary": "Unrestricted parking, 2P limit applies"
}
```

### GET /api/parking_sessions?limit=5

Returns the most recent parking sessions, ordered by `created_at` descending.

## Deployment (Render)

This backend is designed to deploy on [Render](https://render.com):

1. Connect your GitHub repo to Render.
2. Create a new **Web Service**.
3. Set the root directory to `backend`.
4. Set build command: `pip install -r requirements.txt`.
5. Set start command: `gunicorn app:app`.
6. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`