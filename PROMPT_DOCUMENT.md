# ParkWise Melbourne — Prompt Document

This document records the AI prompts used to develop ParkWise Melbourne for Assignment 3.
Each prompt is listed with a brief explanation of its purpose and the outcome it produced.

**GitHub Repository:** `https://github.com/your-username/parkwise-melbourne`

---

## Prompt 1: Initial Assignment 3 Upgrade Planning

**Purpose:** To plan the overall upgrade from the clean Assignment 2 MVP to a full-stack Assignment 3 app with backend integration, database storage, and deployment.

**Prompt:**

> I have a clean React/Vite MVP called ParkWise Melbourne. I now need to upgrade it for Assignment 3.
>
> Important assignment requirements:
> - React frontend
> - Python backend
> - Supabase database that stores and retrieves user-submitted data
> - Sensitive credentials must be stored as environment variables
> - Supabase keys must not be exposed in frontend code
> - App must be deployed live
> - Project must be committed to GitHub
>
> Important decision: Do NOT use Vercel Python serverless functions. The previous attempt caused routing problems. Use a cleaner architecture:
> - React/Vite frontend in the project root
> - Python Flask backend in a separate backend folder
> - Supabase database
> - Frontend deployed on Vercel
> - Backend deployed separately on Render
> - Frontend calls backend through VITE_API_BASE_URL
>
> Required project structure: root React app + backend/ folder with Flask + supabase/ folder with schema.sql.
> Before coding, inspect the current clean project and provide a careful implementation plan only.

**Explanation:** This prompt established the full scope of the upgrade, defined the architecture split (Vercel frontend + Render backend), and asked for a plan before any code was written. This ensured all requirements were mapped out before implementation began.

---

## Prompt 2: Backend Integration and Supabase Connection

**Purpose:** To build the Python Flask backend with Supabase REST API integration and create the database schema.

**Prompt:**

> Create a Python Flask backend in backend/app.py with the following requirements:
>
> - Use Flask, flask-cors, and requests (not FastAPI).
> - Create routes: GET /, GET /api/health, POST /api/parking_sessions, GET /api/parking_sessions.
> - POST /api/parking_sessions should receive parking session data, validate required fields, insert into Supabase table parking_sessions via REST API, and return the inserted record.
> - GET /api/parking_sessions should retrieve recent records ordered by created_at descending with a configurable limit parameter.
> - Use os.environ to read SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Never hardcode credentials.
> - Create supabase/schema.sql with the parking_sessions table definition including uuid primary key, user_type, full_name, email, phone_number, location_choice, parking_duration, parking_purpose, selected_zone, parking_status, result, rule_summary, and created_at columns.
> - Also create backend/requirements.txt, backend/.env.example, and backend/README.md.

**Explanation:** This prompt defined the backend API contract, the Supabase table schema, and the security requirement that Supabase credentials must only exist in the backend environment. It produced `backend/app.py`, `supabase/schema.sql`, and supporting backend files.

---

## Prompt 3: Frontend Save Logic and Recent Sessions Display

**Purpose:** To integrate the frontend with the new backend, adding save-on-confirm and session history display to the confirmation screen.

**Prompt:**

> Update the React frontend (src/App.jsx) to integrate with the Flask backend:
>
> - On the confirmation/result screen, use a useEffect at the top level of the component (not inside a render function) to POST parking session data to the backend.
> - Use a useRef duplicate-save guard (hasSavedRef) to prevent React StrictMode from creating duplicate Supabase rows. Reset the guard when the user clicks Check Another Spot, Back to Map, or when a new zone is selected.
> - Show loading state while saving, success message when saved, and error message if the save fails.
> - Display a saved session summary card showing what was saved.
> - After a successful save, fetch the 5 most recent sessions from GET /api/parking_sessions?limit=5 and display them in a Recent Parking Sessions section.
> - Do NOT send password values to the backend. Keep passwords simulated only.
> - Use this frontend API base URL logic: const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
> - Update privacy wording across all screens to: "Passwords are not stored. Parking check details may be saved to the ParkWise demo database for assignment demonstration purposes."
> - Keep the legal disclaimer unchanged: "This app provides parking guidance only and is not a legal authority. Always check posted street signs before parking."

**Explanation:** This prompt specified the exact frontend integration behaviour, including the critical hook placement rules (top-level useEffect, not inside render functions), the duplicate-save guard pattern using useRef, and the updated privacy wording required for assignment compliance.

---

## Prompt 4: Deployment Architecture Correction

**Purpose:** To correct the deployment approach after routing problems with Vercel serverless functions.

**Prompt:**

> The previous deployment attempt used Vercel Python serverless functions for the backend, which caused routing problems where API routes conflicted with the React frontend routes. Correct the deployment architecture:
>
> - Frontend (React/Vite) deploys on Vercel as a static site.
> - Backend (Flask) deploys separately on Render as a Web Service.
> - Frontend calls the backend via VITE_API_BASE_URL environment variable pointing to the Render URL.
> - Add a render.yaml file in the backend/ directory for Render deployment configuration.
> - The backend start command on Render should be: gunicorn app:app
> - Both deployments must be environment-variable-driven with no hardcoded URLs or credentials.

**Explanation:** This prompt addressed the critical deployment issue. Vercel's serverless functions do not work well with Flask's routing model, causing 404 errors on API endpoints. The correction separates frontend and backend into independent deployments on different platforms, connected only by the `VITE_API_BASE_URL` environment variable.

---

## Summary

| Prompt | Focus Area | Key Output |
|--------|-----------|------------|
| 1 | Architecture planning | Implementation plan, project structure decisions |
| 2 | Backend + database | `backend/app.py`, `supabase/schema.sql`, backend config files |
| 3 | Frontend integration | `src/App.jsx` save logic, privacy wording, recent sessions |
| 4 | Deployment fix | Separate Vercel + Render deployment, `render.yaml` |