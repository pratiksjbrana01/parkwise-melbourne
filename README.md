# ParkWise Melbourne

A map-based parking assistant for Melbourne drivers. Users can check parking zones, view restrictions, and save parking session results to a cloud database.

## Purpose

ParkWise Melbourne helps drivers quickly understand where they can park and for how long in the Richmond / Melbourne CBD area. The app displays parking zones on an interactive map, colour-coded by availability status, and provides detailed rule information for each zone.

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Frontend       | React 19, Vite 8                    |
| Backend        | Python Flask, flask-cors, requests  |
| Database       | Supabase (PostgreSQL)               |
| Frontend Host  | Vercel                              |
| Backend Host   | Render                              |

## Architecture

```
┌──────────────────────┐        ┌───────────────────────┐        ┌──────────────┐
│ React/Vite Frontend   │ ──API─ │ Flask Backend (Render) │ ──REST─ │   Supabase   │
│ (Vercel)              │  calls │ backend/               │  calls  │  PostgreSQL  │
│                       │        │                         │        │              │
│ VITE_API_BASE_URL     │        │ SUPABASE_URL            │        │ parking_     │
│ (only frontend env)   │        │ SUPABASE_SERVICE_KEY    │        │ sessions     │
└──────────────────────┘        └───────────────────────┘        └──────────────┘
```

### Data Flow

1. User completes the parking check flow in the React frontend.
2. On the confirmation screen, the frontend POSTs the session data to the Flask backend.
3. The backend validates the data and inserts it into the Supabase `parking_sessions` table.
4. The backend returns the saved record, and the frontend displays a summary.
5. The frontend also fetches recent sessions from the backend to display a history list.

### Security

- **Supabase credentials** (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) are stored **only** in the backend environment. They never appear in frontend code.
- **Passwords are not stored.** Login and sign-up are simulated for MVP demonstration.
- **Environment variables** are listed in `.gitignore` and never committed to the repository.
- The frontend communicates only with `VITE_API_BASE_URL`.

## Frontend Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create environment file:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set:

   ```
   VITE_API_BASE_URL=http://localhost:5000
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

   The app runs at `http://localhost:5173` by default.

## Backend Setup

1. **Navigate to the backend directory:**

   ```bash
   cd backend
   ```

2. **Create a virtual environment and activate it:**

   ```bash
   python -m venv venv
   venv\Scripts\activate        # Windows
   source venv/bin/activate     # macOS/Linux
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Create environment file:**

   ```bash
   cp .env.example .env
   ```

   Edit `backend/.env` with your Supabase credentials:

   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

5. **Start the backend server:**

   ```bash
   python app.py
   ```

   The backend runs at `http://localhost:5000`.

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in the Supabase dashboard.
3. Copy the contents of `supabase/schema.sql` and run the query.
4. This creates the `parking_sessions` table with the required columns.
5. Copy your **Project URL** and **service_role key** from Settings → API into `backend/.env`.

> **Important:** Use the `service_role` key (not the `anon` key) so the backend can insert data without Row Level Security restrictions.

## Deployment Plan

### Frontend → Vercel

1. Push the repository to GitHub.
2. Connect the repository to [Vercel](https://vercel.com).
3. Set the root directory to the project root (where `package.json` is).
4. Add environment variable: `VITE_API_BASE_URL` = your Render backend URL.
5. Vercel will auto-detect Vite and build correctly.

### Backend → Render

1. Connect the repository to [Render](https://render.com).
2. Create a new **Web Service**.
3. Set root directory to `backend`.
4. Build command: `pip install -r requirements.txt`
5. Start command: `gunicorn app:app`
6. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Project Structure

```
ParkWise Melbourne/
├── src/                        # React frontend source
│   ├── App.jsx                 # Main application component
│   ├── App.css                 # (Vite boilerplate, unused)
│   ├── index.css               # Full design system and component styles
│   ├── main.jsx                # React entry point
│   └── data/
│       └── parkingData.js      # Mock parking zone data
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── supabase/
│   └── schema.sql              # Supabase table definition
├── backend/
│   ├── app.py                  # Flask backend (4 API routes)
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Backend environment template
│   ├── README.md               # Backend-specific documentation
│   └── render.yaml             # Render deployment config
├── .env.example                # Frontend environment template
├── .gitignore
├── index.html                  # Vite HTML entry point
├── package.json
├── vite.config.js
├── eslint.config.js
├── PROMPT_DOCUMENT.md          # AI prompt documentation
└── README.md                   # This file
```

## API Endpoints

| Method | Endpoint                    | Description                         |
|--------|-----------------------------|-------------------------------------|
| GET    | `/`                         | Root health check                   |
| GET    | `/api/health`               | Backend health status               |
| POST   | `/api/parking_sessions`     | Save a parking session              |
| GET    | `/api/parking_sessions`     | Retrieve recent parking sessions    |

## License

This project was created for educational purposes as part of a university assignment.