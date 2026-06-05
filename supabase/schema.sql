-- ParkWise Melbourne — Supabase Schema
-- Run this in the Supabase SQL Editor to create the parking_sessions table.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS parking_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type text NOT NULL,
  full_name text,
  email text,
  phone_number text,
  location_choice text NOT NULL,
  parking_duration text NOT NULL,
  parking_purpose text NOT NULL,
  selected_zone text NOT NULL,
  parking_status text NOT NULL,
  result text NOT NULL,
  rule_summary text NOT NULL,
  created_at timestamptz DEFAULT now()
);