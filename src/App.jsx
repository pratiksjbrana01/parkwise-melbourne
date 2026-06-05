import { useState, useEffect, useRef } from "react";
import parkingZones from "./data/parkingData";

/* ============================================
   ParkWise Melbourne - Main Application
   A map-based parking assistant for Melbourne drivers
   ============================================ */

// API base URL — only VITE_API_BASE_URL is used on the frontend
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Step constants for screen navigation
const STEPS = {
  LOGIN: 0,
  LOCATION: 1,
  NEEDS: 2,
  MAP: 3,
  CONFIRMATION: 4,
  SIGNUP: 5,
};

function App() {
  // Navigation state
  const [currentStep, setCurrentStep] = useState(STEPS.LOGIN);

  // User data state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Location state
  const [locationChoice, setLocationChoice] = useState("");
  const [locationConsent, setLocationConsent] = useState(false);

  // Parking needs state
  const [duration, setDuration] = useState("");
  const [purpose, setPurpose] = useState("");

  // Map state
  const [selectedZone, setSelectedZone] = useState(null);

  // Validation errors
  const [errors, setErrors] = useState({});

  // Backend save state
  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle' | 'saving' | 'success' | 'error'
  const [saveError, setSaveError] = useState("");
  const [savedSession, setSavedSession] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);

  // Duplicate-save guard — prevents double POST in React StrictMode
  const hasSavedRef = useRef(false);

  // ── Fetch recent sessions from backend ───────────────────────────
  const fetchRecentSessions = () => {
    setRecentLoading(true);
    return fetch(`${API_BASE_URL}/api/parking_sessions?limit=5`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRecentSessions(data.data || []);
        }
      })
      .catch(() => {
        // Non-critical — don't overwrite save status
      })
      .finally(() => {
        setRecentLoading(false);
      });
  };

  // ── Save parking session to backend ──────────────────────────────
  // This useEffect lives at the top level of the component.
  // It triggers only when the user reaches the confirmation screen
  // and a selectedZone exists.
  useEffect(() => {
    if (currentStep !== STEPS.CONFIRMATION || !selectedZone) return;
    if (hasSavedRef.current) return;

    hasSavedRef.current = true;
    setSaveStatus("saving");
    setSaveError("");
    setSavedSession(null);
    setRecentSessions([]);

    const isSuccess =
      selectedZone.status === "green" || selectedZone.status === "yellow";

    const payload = {
      user_type: isGuest ? "guest" : "registered",
      full_name: fullName || null,
      email: email || null,
      phone_number: phoneNumber || null,
      location_choice: locationChoice,
      parking_duration: duration,
      parking_purpose: purpose,
      selected_zone: selectedZone.name,
      parking_status: selectedZone.status,
      result: isSuccess ? "Parking Confirmed" : "Parking Not Allowed",
      rule_summary: selectedZone.rule,
    };

    fetch(`${API_BASE_URL}/api/parking_sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSaveStatus("success");
          setSavedSession(data.data);
          // Fetch recent sessions after successful save
          return fetchRecentSessions();
        } else {
          setSaveStatus("error");
          setSaveError(data.error || "Failed to save session");
        }
      })
      .catch((err) => {
        setSaveStatus("error");
        setSaveError(err.message || "Network error — could not reach backend");
      });
  }, [currentStep, selectedZone]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear errors when changing fields
  const clearError = (field) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Navigation helpers
  const goNext = () => setCurrentStep((s) => s + 1);
  const goBack = () => {
    setCurrentStep((s) => s - 1);
    setErrors({});
  };

  // Login screen handler
  const handleSignIn = () => {
    const newErrors = {};
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    goNext();
  };

  const handleGuestContinue = () => {
    setIsGuest(true);
    setEmail("");
    setPassword("");
    goNext();
  };

  // Location screen handler
  const handleLocationContinue = () => {
    const newErrors = {};
    if (!locationChoice) newErrors.location = "Please select a location option";
    if (!locationConsent) newErrors.consent = "Please accept the location use terms";
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    goNext();
  };

  // Parking needs screen handler
  const handleNeedsContinue = () => {
    const newErrors = {};
    if (!duration) newErrors.duration = "Please select a parking duration";
    if (!purpose) newErrors.purpose = "Please select your parking purpose";
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    goNext();
  };

  // Sign up screen handler
  const handleCreateAccount = () => {
    const newErrors = {};
    if (!fullName) newErrors.fullName = "Full name is required";
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setCurrentStep(STEPS.LOCATION);
  };

  // Map screen handler
  const handleConfirmParking = () => {
    if (!selectedZone) return;
    // Reset save guard when confirming a new parking selection
    hasSavedRef.current = false;
    goNext();
  };

  // Reset to start another search
  const handleCheckAnother = () => {
    setSelectedZone(null);
    hasSavedRef.current = false;
    setSaveStatus("idle");
    setSaveError("");
    setSavedSession(null);
    setRecentSessions([]);
    setCurrentStep(STEPS.MAP);
  };

  // Back to map from confirmation
  const handleBackToMap = () => {
    hasSavedRef.current = false;
    setSaveStatus("idle");
    setSaveError("");
    setSavedSession(null);
    setRecentSessions([]);
    setSelectedZone(null);
    setCurrentStep(STEPS.MAP);
  };

  // ── Format a session timestamp for display ────────────────────────
  const formatTimestamp = (isoString) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleString("en-AU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // Render step indicator
  const renderStepIndicator = () => {
    if (currentStep === STEPS.LOGIN) return null;
    const activeStep = currentStep; // 1-4 maps to steps 2-5 in UI
    return (
      <div className="step-indicator">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`step-dot ${
              step < activeStep
                ? "completed"
                : step === activeStep
                  ? "active"
                  : ""
            }`}
          />
        ))}
      </div>
    );
  };

  // ========== LOGIN SCREEN ==========
  const renderLoginScreen = () => (
    <div className="screen">
      <div className="screen-content" style={{ justifyContent: "center" }}>
        {/* Logo */}
        <div className="logo">
          <div className="logo-icon">🅿️</div>
          <div className="logo-text">
            Park<span>Wise</span>
          </div>
        </div>

        <div className="screen-header">
          <h1 className="screen-title">Melbourne</h1>
          <p className="screen-subtitle">
            Find out where you can park and for how long.
          </p>
        </div>

        {/* Login Form */}
        <div className="card" style={{ marginBottom: "var(--space-md)" }}>
          <div className="input-group">
            <label className="input-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError("email");
              }}
            />
            {errors.email && (
              <div className="validation-error">⚠️ {errors.email}</div>
            )}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
              }}
            />
            {errors.password && (
              <div className="validation-error">⚠️ {errors.password}</div>
            )}
          </div>

          <button className="btn btn-primary" onClick={handleSignIn}>
            Sign In
          </button>

          <button
            className="btn btn-secondary"
            style={{ marginTop: "var(--space-sm)" }}
            onClick={() => {
              setCurrentStep(STEPS.SIGNUP);
              setErrors({});
            }}
          >
            Create Account
          </button>
        </div>

        <div className="divider">or</div>

        <button className="btn btn-secondary" onClick={handleGuestContinue}>
          Continue as Guest
        </button>

        {/* Transparency Notice */}
        <div className="transparency-notice" style={{ marginTop: "var(--space-xl)" }}>
          <p className="transparency-text">
            🔒 This is an MVP demonstration. Passwords are not stored. Parking
            check details may be saved to the ParkWise demo database for
            assignment demonstration purposes. Login is simulated for
            presentation purposes only.
          </p>
        </div>
      </div>
    </div>
  );

  // ========== LOCATION SELECTION SCREEN ==========
  const renderLocationScreen = () => (
    <div className="screen">
      {renderStepIndicator()}
      <div className="screen-header">
        <h1 className="screen-title">Select Your Location</h1>
        <p className="screen-subtitle">
          Choose how you'd like to find nearby parking options.
        </p>
      </div>

      <div className="screen-content">
        {/* Location Options */}
        <div className="option-group">
          <div className="option-radio">
            <div
              className={`option-radio-item ${locationChoice === "current" ? "selected" : ""}`}
              onClick={() => {
                setLocationChoice("current");
                clearError("location");
              }}
            >
              <input
                type="radio"
                name="location"
                checked={locationChoice === "current"}
                onChange={() => {
                  setLocationChoice("current");
                  clearError("location");
                }}
              />
              <label>📍 Use Current Location</label>
            </div>

            <div
              className={`option-radio-item ${locationChoice === "demo" ? "selected" : ""}`}
              onClick={() => {
                setLocationChoice("demo");
                clearError("location");
              }}
            >
              <input
                type="radio"
                name="location"
                checked={locationChoice === "demo"}
                onChange={() => {
                  setLocationChoice("demo");
                  clearError("location");
                }}
              />
              <label>🏙️ View Demo Area: Richmond / Melbourne CBD</label>
            </div>
          </div>
          {errors.location && (
            <div className="validation-error">⚠️ {errors.location}</div>
          )}
        </div>

        {locationChoice === "demo" && (
          <div className="helper-text">
            The demo area shows parking zones around Swan Street, Bridge Road,
            and Flinders Lane in the Richmond / Melbourne CBD area.
          </div>
        )}

        {/* Consent Checkbox */}
        <div className="consent-row">
          <input
            type="checkbox"
            id="location-consent"
            checked={locationConsent}
            onChange={(e) => {
              setLocationConsent(e.target.checked);
              clearError("consent");
            }}
          />
          <label className="consent-label" htmlFor="location-consent">
            I understand that my location is only used to show nearby parking
            options and will not be permanently stored.
          </label>
        </div>
        {errors.consent && (
          <div className="validation-error">⚠️ {errors.consent}</div>
        )}

        {/* Privacy Notice */}
        <div className="privacy-notice">
          <div className="privacy-notice-title">🔒 Privacy Notice</div>
          <p className="privacy-notice-text">
            Your location is only used to show nearby parking options and is not
            permanently stored. Passwords are not stored. Parking check details
            may be saved to the ParkWise demo database for assignment
            demonstration purposes.
          </p>
        </div>
      </div>

      <div className="screen-footer">
        <button className="btn btn-primary" onClick={handleLocationContinue}>
          Continue
        </button>
        <button className="btn btn-secondary" onClick={goBack}>
          Back
        </button>
      </div>
    </div>
  );

  // ========== PARKING NEEDS SCREEN ==========
  const renderNeedsScreen = () => (
    <div className="screen">
      {renderStepIndicator()}
      <div className="screen-header">
        <h1 className="screen-title">Your Parking Needs</h1>
        <p className="screen-subtitle">
          Tell us what you need so we can filter suitable parking options.
        </p>
      </div>

      <div className="screen-content">
        {/* Duration Selection */}
        <div className="option-group">
          <div className="option-group-title">How long do you need to park?</div>
          <div className="option-list">
            {["30 minutes", "1 hour", "2 hours"].map((d) => (
              <button
                key={d}
                className={`option-chip ${duration === d ? "selected" : ""}`}
                onClick={() => {
                  setDuration(d);
                  clearError("duration");
                }}
              >
                {d}
              </button>
            ))}
          </div>
          {errors.duration && (
            <div className="validation-error">⚠️ {errors.duration}</div>
          )}
        </div>

        {/* Parking Purpose */}
        <div className="option-group">
          <div className="option-group-title">Parking purpose</div>
          <div className="option-list">
            {["Work", "Leisure", "Other"].map((p) => (
              <button
                key={p}
                className={`option-chip ${purpose === p ? "selected" : ""}`}
                onClick={() => {
                  setPurpose(p);
                  clearError("purpose");
                }}
              >
                {p}
              </button>
            ))}
          </div>
          {errors.purpose && (
            <div className="validation-error">⚠️ {errors.purpose}</div>
          )}
        </div>

        <div className="helper-text">
          This information helps ParkWise filter suitable car parking options.
          Passwords are not stored. Parking check details may be saved to the
          ParkWise demo database for assignment demonstration purposes.
        </div>
      </div>

      <div className="screen-footer">
        <button className="btn btn-primary" onClick={handleNeedsContinue}>
          View Parking Map
        </button>
        <button className="btn btn-secondary" onClick={goBack}>
          Back
        </button>
      </div>
    </div>
  );

  // ========== DEMO MAP SCREEN ==========
  const renderMapScreen = () => (
    <div className="screen">
      {renderStepIndicator()}
      <div className="screen-header">
        <h1 className="screen-title">Parking Map</h1>
        <p className="screen-subtitle">
          {locationChoice === "demo"
            ? "Richmond / Melbourne CBD — Demo Area"
            : "Nearby Parking Zones"}
        </p>
      </div>

      <div className="screen-content">
        {/* Mock Map */}
        <div className="map-container">
          {/* Street grid background */}
          <div className="map-streets">
            {/* Horizontal streets */}
            <div
              className="map-street horizontal"
              style={{ top: "20%" }}
            />
            <div
              className="map-street horizontal"
              style={{ top: "45%" }}
            />
            <div
              className="map-street horizontal"
              style={{ top: "70%" }}
            />

            {/* Vertical streets */}
            <div
              className="map-street vertical"
              style={{ left: "20%" }}
            />
            <div
              className="map-street vertical"
              style={{ left: "50%" }}
            />
            <div
              className="map-street vertical"
              style={{ left: "75%" }}
            />

            {/* Street labels */}
            <span
              className="map-street-label"
              style={{ top: "16%", left: "5%" }}
            >
              Bridge Rd
            </span>
            <span
              className="map-street-label"
              style={{ top: "41%", left: "5%" }}
            >
              Swan St
            </span>
            <span
              className="map-street-label"
              style={{ top: "66%", left: "5%" }}
            >
              Flinders Ln
            </span>
            <span
              className="map-street-label"
              style={{ top: "5%", left: "15%", transform: "rotate(90deg)" }}
            >
              Church St
            </span>
            <span
              className="map-street-label"
              style={{ top: "5%", left: "46%", transform: "rotate(90deg)" }}
            >
              Swanston St
            </span>
            <span
              className="map-street-label"
              style={{ top: "5%", left: "71%", transform: "rotate(90deg)" }}
            >
              Victoria St
            </span>

            {/* Park area */}
            <div
              style={{
                position: "absolute",
                top: "30%",
                left: "35%",
                width: "15%",
                height: "12%",
                background: "#C8E6C9",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                color: "#2E7D32",
                fontWeight: "500",
              }}
            >
              🌳 Park
            </div>

            {/* Parking markers */}
            {parkingZones.map((zone) => (
              <div
                key={zone.id}
                className={`parking-marker ${zone.status} ${
                  selectedZone?.id === zone.id ? "selected" : ""
                }`}
                style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
                onClick={() => setSelectedZone(zone)}
                title={zone.name}
              >
                🅿️
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="legend">
          <div className="legend-item">
            <div className="legend-dot green" />
            <span>Allowed Now</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot yellow" />
            <span>Limited Time</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot red" />
            <span>Restricted</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot blue" />
            <span>Permit Zone</span>
          </div>
        </div>

        {/* Transparency notice */}
        <div className="transparency-notice" style={{ marginTop: "var(--space-md)" }}>
          <p className="transparency-text">
            This app provides parking guidance only and is not a legal authority.
            Always check posted street signs before parking.
          </p>
        </div>

        {/* Parking Detail Card */}
        {selectedZone && (
          <div className="card parking-detail">
            <div className="parking-detail-header">
              <div className={`parking-detail-status ${selectedZone.status}`}>
                🅿️
              </div>
              <div>
                <div className="parking-detail-title">{selectedZone.name}</div>
                <div
                  className={`parking-detail-status-text ${selectedZone.status}`}
                >
                  {selectedZone.statusLabel}
                </div>
              </div>
            </div>

            <div className="parking-detail-info">
              <div className="parking-detail-row">
                <span className="parking-detail-label">Location</span>
                <span className="parking-detail-value">
                  {selectedZone.location}
                </span>
              </div>
              <div className="parking-detail-row">
                <span className="parking-detail-label">Rule</span>
                <span className="parking-detail-value">
                  {selectedZone.rule}
                </span>
              </div>
              {selectedZone.allowedDuration && (
                <div className="parking-detail-row">
                  <span className="parking-detail-label">Allowed Duration</span>
                  <span className="parking-detail-value">
                    {selectedZone.allowedDuration}
                  </span>
                </div>
              )}
              <div className="parking-detail-row">
                <span className="parking-detail-label">Restrictions</span>
                <span className="parking-detail-value">
                  {selectedZone.restrictions}
                </span>
              </div>
              {selectedZone.restrictionChangeTime && (
                <div className="parking-detail-row">
                  <span className="parking-detail-label">Changes At</span>
                  <span className="parking-detail-value">
                    {selectedZone.restrictionChangeTime}
                  </span>
                </div>
              )}
            </div>

            {/* Caution message */}
            <div className="caution-box">
              <span className="caution-icon">⚠️</span>
              <span className="caution-text">
                This app provides parking guidance only and is not a legal
                authority. Always check posted street signs before parking.
              </span>
            </div>

            {/* Action Button */}
            <div style={{ marginTop: "var(--space-lg)" }}>
              {selectedZone.status === "green" ||
              selectedZone.status === "yellow" ? (
                <button
                  className="btn btn-success"
                  onClick={handleConfirmParking}
                >
                  ✅ Confirm This Parking Spot
                </button>
              ) : (
                <button
                  className="btn btn-danger"
                  onClick={handleConfirmParking}
                >
                  🚫{" "}
                  {selectedZone.status === "red"
                    ? "See Why Parking Is Not Available"
                    : "View Parking Restriction Details"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="screen-footer">
        <button className="btn btn-secondary" onClick={goBack}>
          Back
        </button>
      </div>
    </div>
  );

  // ========== CONFIRMATION / RESULT SCREEN ==========
  const renderConfirmationScreen = () => {
    if (!selectedZone) return null;

    const isSuccess =
      selectedZone.status === "green" || selectedZone.status === "yellow";

    return (
      <div className="screen">
        <div className="screen-content" style={{ justifyContent: "center" }}>
          <div className="confirmation">
            {/* Status Icon */}
            <div className={`confirmation-icon ${isSuccess ? "success" : "failure"}`}>
              {isSuccess ? "✅" : "🚫"}
            </div>

            {/* Title */}
            <h1
              className={`confirmation-title ${isSuccess ? "success" : "failure"}`}
            >
              {isSuccess ? "Parking Confirmed" : "Parking Not Allowed"}
            </h1>

            <p className="confirmation-subtitle">
              {isSuccess
                ? `You can park at ${selectedZone.name} for up to ${selectedZone.allowedDuration}.`
                : selectedZone.status === "blue"
                  ? `A valid council parking permit is required to park at ${selectedZone.name}.`
                  : `Parking is currently not available at ${selectedZone.name}.`}
            </p>

            {/* Details Card */}
            <div className="card" style={{ marginBottom: "var(--space-lg)" }}>
              <div className="confirmation-details">
                <div className="confirmation-row">
                  <span className="confirmation-label">Location</span>
                  <span className="confirmation-value">
                    {selectedZone.name}
                  </span>
                </div>
                <div className="confirmation-row">
                  <span className="confirmation-label">Status</span>
                  <span
                    className="confirmation-value"
                    style={{
                      color:
                        selectedZone.status === "green"
                          ? "var(--green-dark)"
                          : selectedZone.status === "yellow"
                            ? "var(--yellow-dark)"
                            : selectedZone.status === "red"
                              ? "var(--red-dark)"
                              : "var(--blue-dark)",
                    }}
                  >
                    {selectedZone.statusLabel}
                  </span>
                </div>

                {isSuccess ? (
                  <>
                    <div className="confirmation-row">
                      <span className="confirmation-label">Allowed Time</span>
                      <span className="confirmation-value">
                        {selectedZone.allowedDuration}
                      </span>
                    </div>
                    <div className="confirmation-row">
                      <span className="confirmation-label">Expires</span>
                      <span className="confirmation-value">
                        {selectedZone.expiryEstimate}
                      </span>
                    </div>
                    {selectedZone.restrictionChangeTime && (
                      <div className="confirmation-row">
                        <span className="confirmation-label">
                          Restriction Starts
                        </span>
                        <span className="confirmation-value">
                          {selectedZone.restrictionChangeTime}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="confirmation-row">
                      <span className="confirmation-label">Rule</span>
                      <span className="confirmation-value">
                        {selectedZone.rule}
                      </span>
                    </div>
                    <div className="confirmation-row">
                      <span className="confirmation-label">Reason</span>
                      <span className="confirmation-value">
                        {selectedZone.restrictions}
                      </span>
                    </div>
                    {selectedZone.restrictionChangeTime && (
                      <div className="confirmation-row">
                        <span className="confirmation-label">
                          Available After
                        </span>
                        <span className="confirmation-value">
                          {selectedZone.restrictionChangeTime}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Explanation for unsuccessful */}
            {!isSuccess && selectedZone.reasonUnavailable && (
              <div
                className="card"
                style={{
                  marginBottom: "var(--space-lg)",
                  borderColor: "var(--red)",
                  background: "var(--red-light)",
                }}
              >
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--red-dark)",
                    lineHeight: "1.6",
                  }}
                >
                  {selectedZone.reasonUnavailable}
                </p>
              </div>
            )}

            {/* Reminder for successful */}
            {isSuccess && (
              <div
                className="card"
                style={{
                  marginBottom: "var(--space-lg)",
                  borderColor: "var(--green)",
                  background: "var(--green-light)",
                }}
              >
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--green-dark)",
                    lineHeight: "1.6",
                  }}
                >
                  📋 Remember to check posted street signs. Parking rules may
                  change. Set a timer to avoid overstaying.
                </p>
              </div>
            )}

            {/* ── Save Status Indicator ── */}
            <div
              className={`save-status ${saveStatus}`}
              style={{ marginBottom: "var(--space-lg)" }}
            >
              {saveStatus === "saving" && (
                <span>⏳ Saving your parking check to the database...</span>
              )}
              {saveStatus === "success" && (
                <span>✅ Parking check saved to the ParkWise demo database.</span>
              )}
              {saveStatus === "error" && (
                <span>⚠️ Could not save to database: {saveError}</span>
              )}
            </div>

            {/* ── Saved Session Summary ── */}
            {savedSession && (
              <div
                className="card"
                style={{
                  marginBottom: "var(--space-lg)",
                  borderColor: "var(--primary)",
                  background: "var(--primary-light)",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--primary-dark)",
                    marginBottom: "var(--space-sm)",
                  }}
                >
                  📝 Saved Session Summary
                </div>
                <div className="confirmation-details">
                  <div className="confirmation-row">
                    <span className="confirmation-label">Zone</span>
                    <span className="confirmation-value">
                      {savedSession.selected_zone}
                    </span>
                  </div>
                  <div className="confirmation-row">
                    <span className="confirmation-label">Duration</span>
                    <span className="confirmation-value">
                      {savedSession.parking_duration}
                    </span>
                  </div>
                  <div className="confirmation-row">
                    <span className="confirmation-label">Purpose</span>
                    <span className="confirmation-value">
                      {savedSession.parking_purpose}
                    </span>
                  </div>
                  <div className="confirmation-row">
                    <span className="confirmation-label">Result</span>
                    <span className="confirmation-value">
                      {savedSession.result}
                    </span>
                  </div>
                  <div className="confirmation-row">
                    <span className="confirmation-label">Session ID</span>
                    <span
                      className="confirmation-value"
                      style={{ fontSize: "11px", fontFamily: "monospace" }}
                    >
                      {savedSession.id}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Recent Saved Sessions ── */}
            {recentSessions.length > 0 && (
              <div
                className="card"
                style={{
                  marginBottom: "var(--space-lg)",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: "var(--space-md)",
                  }}
                >
                  📊 Recent Parking Sessions
                </div>
                <div className="recent-sessions">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="recent-session-item">
                      <div className="recent-session-header">
                        <span className="recent-session-zone">
                          {session.selected_zone}
                        </span>
                        <span
                          className={`session-badge ${
                            session.parking_status === "green"
                              ? "green"
                              : session.parking_status === "yellow"
                                ? "yellow"
                                : session.parking_status === "red"
                                  ? "red"
                                  : "blue"
                          }`}
                        >
                          {session.parking_status === "green"
                            ? "Allowed"
                            : session.parking_status === "yellow"
                              ? "Limited"
                              : session.parking_status === "red"
                                ? "Restricted"
                                : "Permit"}
                        </span>
                      </div>
                      <div className="recent-session-detail">
                        {session.parking_duration} · {session.parking_purpose}
                      </div>
                      <div className="recent-session-time">
                        {formatTimestamp(session.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentLoading && (
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-light)",
                  marginBottom: "var(--space-lg)",
                }}
              >
                Loading recent sessions...
              </div>
            )}

            {/* Caution */}
            <div className="caution-box" style={{ marginBottom: "var(--space-lg)" }}>
              <span className="caution-icon">⚠️</span>
              <span className="caution-text">
                This app provides parking guidance only and is not a legal
                authority. Always check posted street signs before parking.
              </span>
            </div>

            {/* Action Buttons */}
            <button className="btn btn-primary" onClick={handleCheckAnother}>
              Check Another Spot
            </button>
            <button className="btn btn-secondary" onClick={handleBackToMap}>
              Back to Map
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ========== SIGN UP SCREEN ==========
  const renderSignupScreen = () => (
    <div className="screen">
      <div className="screen-content" style={{ justifyContent: "center" }}>
        {/* Logo */}
        <div className="logo">
          <div className="logo-icon">🅿️</div>
          <div className="logo-text">
            Park<span>Wise</span>
          </div>
        </div>

        <div className="screen-header">
          <h1 className="screen-title">Create Account</h1>
          <p className="screen-subtitle">
            Sign up to save your parking preferences.
          </p>
        </div>

        {/* Sign Up Form */}
        <div className="card" style={{ marginBottom: "var(--space-md)" }}>
          <div className="input-group">
            <label className="input-label" htmlFor="fullName">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              className="input-field"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearError("fullName");
              }}
            />
            {errors.fullName && (
              <div className="validation-error">⚠️ {errors.fullName}</div>
            )}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="signupEmail">
              Email
            </label>
            <input
              id="signupEmail"
              type="email"
              className="input-field"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError("email");
              }}
            />
            {errors.email && (
              <div className="validation-error">⚠️ {errors.email}</div>
            )}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="phoneNumber">
              Phone Number (optional)
            </label>
            <input
              id="phoneNumber"
              type="tel"
              className="input-field"
              placeholder="For parking reminders"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="signupPassword">
              Password
            </label>
            <input
              id="signupPassword"
              type="password"
              className="input-field"
              placeholder="Create a password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
              }}
            />
            {errors.password && (
              <div className="validation-error">⚠️ {errors.password}</div>
            )}
          </div>

          <button className="btn btn-primary" onClick={handleCreateAccount}>
            Create Account
          </button>

          <button
            className="btn btn-secondary"
            style={{ marginTop: "var(--space-sm)" }}
            onClick={() => {
              setCurrentStep(STEPS.LOGIN);
              setErrors({});
            }}
          >
            Back to Sign In
          </button>
        </div>

        {/* MVP Notice */}
        <div className="transparency-notice" style={{ marginTop: "var(--space-lg)" }}>
          <p className="transparency-text">
            🔒 Account creation is simulated for this MVP. Passwords are not
            stored. Parking check details may be saved to the ParkWise demo
            database for assignment demonstration purposes.
          </p>
        </div>
      </div>
    </div>
  );

  // ========== MAIN RENDER ==========
  const renderCurrentScreen = () => {
    switch (currentStep) {
      case STEPS.LOGIN:
        return renderLoginScreen();
      case STEPS.LOCATION:
        return renderLocationScreen();
      case STEPS.NEEDS:
        return renderNeedsScreen();
      case STEPS.MAP:
        return renderMapScreen();
      case STEPS.CONFIRMATION:
        return renderConfirmationScreen();
      case STEPS.SIGNUP:
        return renderSignupScreen();
      default:
        return renderLoginScreen();
    }
  };

  return (
    <div className="app">
      <div className="app-container">{renderCurrentScreen()}</div>
    </div>
  );
}

export default App;