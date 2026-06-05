"""
ParkWise Melbourne — Flask Backend

Provides REST API endpoints for saving and retrieving parking sessions.
Connects to Supabase via its PostgREST REST API using the service role key.
"""

import os
import json
from datetime import datetime, timezone

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from dotenv import load_dotenv

# Load .env file when running locally
load_dotenv()

app = Flask(__name__)
CORS(app)

# Supabase configuration from environment variables
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

SUPABASE_REST_URL = f"{SUPABASE_URL}/rest/v1/parking_sessions"

HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}


@app.route("/")
def index():
    """Root health check endpoint."""
    return jsonify({
        "success": True,
        "message": "ParkWise Melbourne API is running",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


@app.route("/api/health")
def health():
    """Health check endpoint."""
    return jsonify({
        "success": True,
        "message": "ParkWise backend is running",
    })


@app.route("/api/parking_sessions", methods=["POST"])
def create_parking_session():
    """
    Save a new parking session to Supabase.

    Required fields:
      - location_choice, parking_duration, parking_purpose,
        selected_zone, parking_status, result, rule_summary

    Optional fields:
      - user_type (defaults to 'guest'), full_name, email, phone_number
    """
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "error": "Request body is required"}), 400

    # Validate required fields
    required_fields = [
        "location_choice",
        "parking_duration",
        "parking_purpose",
        "selected_zone",
        "parking_status",
        "result",
        "rule_summary",
    ]

    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return jsonify({
            "success": False,
            "error": f"Missing required fields: {', '.join(missing)}",
        }), 400

    # Build insert payload — never accept password
    payload = {
        "user_type": data.get("user_type", "guest"),
        "full_name": data.get("full_name"),
        "email": data.get("email"),
        "phone_number": data.get("phone_number"),
        "location_choice": data["location_choice"],
        "parking_duration": data["parking_duration"],
        "parking_purpose": data["parking_purpose"],
        "selected_zone": data["selected_zone"],
        "parking_status": data["parking_status"],
        "result": data["result"],
        "rule_summary": data["rule_summary"],
    }

    # Insert into Supabase
    try:
        resp = requests.post(
            SUPABASE_REST_URL,
            headers=HEADERS,
            data=json.dumps(payload),
            timeout=10,
        )

        if resp.status_code in (200, 201):
            inserted = resp.json()
            record = inserted[0] if isinstance(inserted, list) and inserted else inserted
            return jsonify({
                "success": True,
                "data": record,
            }), 201
        else:
            return jsonify({
                "success": False,
                "error": f"Supabase error: {resp.status_code} — {resp.text}",
            }), 502

    except requests.exceptions.RequestException as e:
        return jsonify({
            "success": False,
            "error": f"Failed to connect to Supabase: {str(e)}",
        }), 503


@app.route("/api/parking_sessions", methods=["GET"])
def get_parking_sessions():
    """
    Retrieve recent parking sessions from Supabase.
    Optional query param: limit (default 5).
    """
    limit = request.args.get("limit", 5, type=int)

    try:
        resp = requests.get(
            SUPABASE_REST_URL,
            headers={
                **HEADERS,
                "Prefer": "return=representation",
            },
            params={
                "order": "created_at.desc",
                "limit": limit,
            },
            timeout=10,
        )

        if resp.status_code == 200:
            sessions = resp.json()
            return jsonify({
                "success": True,
                "data": sessions,
            })
        else:
            return jsonify({
                "success": False,
                "error": f"Supabase error: {resp.status_code} — {resp.text}",
            }), 502

    except requests.exceptions.RequestException as e:
        return jsonify({
            "success": False,
            "error": f"Failed to connect to Supabase: {str(e)}",
        }), 503


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)