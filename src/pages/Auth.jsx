import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

/* ════════════════════════════════════════════════════════════
   FHC ARCADE // AUTHENTICATION TERMINAL
   The primary gateway for ALL FHC website users.
   Login / Sign up / Password recovery are handled here through
   Supabase Auth. Separate from /join (EXECom application flow).
   ════════════════════════════════════════════════════════════ */

const INK = "#04060C";

const SYS_CY = "#00E5FF";
const SYS_PK = "#FF007F";
const SYS_CR = "#FFF4D6";
const SYS_GR = "#4CFF4C";
const SYS_YL = "#FFD400";

const LOGIN_STEPS = ["ESTABLISHING SECURE LINK...", "VERIFYING PLAYER CREDENTIALS...", "CONNECTING TO FHC NETWORK...", "HANDSHAKE COMPLETE"];
const SIGNUP_STEPS = ["INITIALIZING PLAYER NODE...", "ENCRYPTING ACCESS CREDENTIALS...", "CREATING PLAYER PROFILE...", "GENERATING AVATAR...", "NODE INITIALIZED ✓"];
const FORGOT_STEPS = ["TRANSMITTING RECOVERY REQUEST...", "VERIFYING EMAIL REGISTRY...", "OPENING SECURE CHANNEL...", "REQUEST TRANSMITTED"];
const RECOVERY_STEPS = ["DECRYPTING SESSION KEYS...", "REINITIALIZING ACCESS CODE...", "SYNCING CREDENTIALS..."];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function mapAuthError(err, ctx) {
  /* Log the raw error for development debugging */
  console.warn("[FHC AUTH]", ctx, err);

  /* Extract the error message from any shape Supabase might return */
  const m = (
    (err && (err.message || err.error_description || err.msg || err.statusText)) ||
    (typeof err === "string" ? err : "") ||
    ""
  ).toLowerCase();

  /* If there is literally no message at all, surface that */
  if (!m && !err) {
    return { title: "SYSTEM ERROR", lines: ["NO RESPONSE FROM SERVER_", "CHECK CONSOLE FOR DETAILS_"] };
  }

  /* ── Credential / auth errors ── */
  if (m.includes("invalid login") || m.includes("invalid email or password") || m.includes("user not found") || m.includes("invalid_grant")) {
    return { title: "ACCESS DENIED", lines: ["PLAYER ID OR ACCESS CODE INVALID_"] };
  }
  if (m.includes("email not confirmed") || m.includes("email not verified") || m.includes("not confirmed")) {
    return { title: "NODE NOT ACTIVATED", lines: ["VERIFY YOUR ACCOUNT", "CHECK YOUR EMAIL CHANNEL_"] };
  }

  /* ── Signup-specific errors ── */
  if (ctx === "signup") {
    if (m.includes("signup") && m.includes("disabled") || m.includes("email signups are disabled") || m.includes("signups are disabled")) {
      return { title: "SIGNUP DISABLED", lines: ["EMAIL REGISTRATION IS OFFLINE_", "CONTACT THE SYSTEM ADMINISTRATOR_"] };
    }
    if (m.includes("already registered") || m.includes("already been registered") || m.includes("already exists") || m.includes("already been")) {
      return { title: "NODE ALREADY EXISTS", lines: ["THIS EMAIL IS ALREADY REGISTERED_"] };
    }
    if (m.includes("password") && (m.includes("weak") || m.includes("at least") || m.includes("minimum") || m.includes("too short") || m.includes("should be"))) {
      return { title: "SECURITY PROTOCOL FAILED", lines: ["ACCESS CODE DOES NOT MEET REQUIREMENTS_"] };
    }
    if (m.includes("valid email") || m.includes("invalid email") || m.includes("email address") || m.includes("invalid format")) {
      return { title: "INVALID EMAIL CHANNEL", lines: ["ENTER A VALID EMAIL ADDRESS_"] };
    }
    if (m.includes("rate limit") || m.includes("too many")) {
      return { title: "RATE LIMIT EXCEEDED", lines: ["TOO MANY REQUESTS_", "WAIT AND TRY AGAIN_"] };
    }
    /* Catch-all for signup password issues */
    if (m.includes("password")) {
      return { title: "SECURITY PROTOCOL FAILED", lines: ["ACCESS CODE DOES NOT MEET REQUIREMENTS_"] };
    }
  }

  /* ── Configuration errors ── */
  if (m.includes("supabase") || m.includes("project not found") || m.includes("invalid api key") || m.includes("invalid url")) {
    return { title: "TERMINAL NOT CONFIGURED", lines: ["ADD VITE_SUPABASE_* TO .ENV_", "SEE .ENV.EXAMPLE FOR DETAILS"] };
  }

  /* ── Network / connection errors ── */
  if (m.includes("network") || m.includes("fetch") || m.includes("unavailable") || m.includes("failed to") || m.includes("cors") || m.includes("econnrefused") || m.includes("econnreset") || m.includes("timeout")) {
    return { title: "CONNECTION INTERRUPTED", lines: ["HORIZON NETWORK UNAVAILABLE_", "CHECK YOUR CONNECTION AND RETRY"] };
  }

  /* ── Rate limiting ── */
  if (m.includes("rate limit") || m.includes("too many") || m.includes("too many requests")) {
    return { title: "RATE LIMIT EXCEEDED", lines: ["TOO MANY REQUESTS_", "WAIT AND TRY AGAIN_"] };
  }

  /* ── Recovery-specific ── */
  if (ctx === "recovery") {
    if (m.includes("expired") || m.includes("invalid") || m.includes("token")) {
      return { title: "RECOVERY EXPIRED", lines: ["LINK HAS EXPIRED_", "REQUEST A NEW RECOVERY LINK_"] };
    }
  }

  /* ── Fallback: include the actual error text for debugging ── */
  const rawSnippet = m.slice(0, 60) || "UNKNOWN ERROR";
  return { title: "SYSTEM ERROR", lines: [rawSnippet, "TRY AGAIN_", "CHECK CONSOLE FOR DETAILS_"] };
}

/* ════════════════════════════════════════════════════════════
   SHARED ATOMICS
   ════════════════════════════════════════════════════════════ */

function Brackets({ color = SYS_CY, size = 8, opacity = 0.6, inset = -3, className = "" }) {
  const base = { position: "absolute", background: color, opacity, zIndex: 5 };
  return (
    <span className={`auth-brackets ${className}`} aria-hidden="true" style={{ position: "absolute", inset, pointerEvents: "none" }}>
      <span style={{ ...base, top: 0, left: 0, width: size, height: 1 }} />
      <span style={{ ...base, top: 0, left: 0, width: 1, height: size }} />
      <span style={{ ...base, top: 0, right: 0, width: size, height: 1 }} />
      <span style={{ ...base, top: 0, right: 0, width: 1, height: size }} />
      <span style={{ ...base, bottom: 0, left: 0, width: size, height: 1 }} />
      <span style={{ ...base, bottom: 0, left: 0, width: 1, height: size }} />
      <span style={{ ...base, bottom: 0, right: 0, width: size, height: 1 }} />
      <span style={{ ...base, bottom: 0, right: 0, width: 1, height: size }} />
    </span>
  );
}

function Led({ color = SYS_GR, size = 5, className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`auth-led ${className}`}
      style={{ width: size, height: size, background: color, boxShadow: `0 0 5px ${color}55` }}
    />
  );
}

function Tele({ children, color = SYS_CY, opacity = 0.4, ls = "0.16em", size = 6, className = "" }) {
  return (
    <span className={`auth-tele ${className}`} style={{ color, opacity, letterSpacing: ls, fontSize: size }}>
      {children}
    </span>
  );
}

function StatusIndicator({ label, value, color = SYS_GR, blink = false, valueColor }) {
  return (
    <div className="auth-status" style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <Led color={color} size={5} className={blink ? "is-blink" : ""} />
      <Tele opacity={0.5}>{label}</Tele>
      <span
        className="auth-tele auth-status-value"
        style={{ color: valueColor || color, opacity: 0.95, letterSpacing: "0.14em", fontSize: 7 }}
      >
        {value}
      </span>
    </div>
  );
}

function Scanlines({ tint = "rgba(0,229,255,0.014)" }) {
  return (
    <span
      aria-hidden="true"
      className="auth-scanlines-layer"
      style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2,
        background: `repeating-linear-gradient(to bottom, ${tint} 0px, ${tint} 1px, transparent 1px, transparent 4px)`,
      }}
    />
  );
}

/* ════════════════════════════════════════════════════════════
   ARCADE INPUT SLOT — embedded terminal input
   Keeps password visibility + validation intact.
   ════════════════════════════════════════════════════════════ */
function AuthInput({
  label, prompt, type = "text", value, onChange, autoComplete,
  isPassword, show, onToggleShow, id, name, caretColor = SYS_PK, error, scan,
}) {
  return (
    <motion.div
      className="auth-input-block"
      whileFocus={{ scale: 1.002 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <label htmlFor={id} className="auth-input-label font-pixel">
        <span className="auth-input-label-caret">&gt;</span>
        <span className="auth-input-label-text">{label}</span>
        <span className="auth-input-label-state font-pixel">{scan || "CHANNEL ACTIVE"}</span>
      </label>
      <div className={`auth-input-slot ${error ? "has-error" : ""}`}>
        <span className="auth-slot-corner auth-slot-corner-tl" aria-hidden="true" />
        <span className="auth-slot-corner auth-slot-corner-br" aria-hidden="true" />
        <span className="auth-slot-led" aria-hidden="true" />
        <input
          id={id}
          name={name}
          type={isPassword ? (show ? "text" : "password") : type}
          defaultValue={value}
          onChange={onChange}
          placeholder={prompt}
          autoComplete={autoComplete}
          aria-required="true"
          aria-invalid={!!error}
          className="auth-input font-mono"
          style={{ caretColor }}
        />
        {isPassword && (
          <button
            type="button"
            className="auth-eye font-pixel"
            onClick={onToggleShow}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
          >
            <span className={show ? "is-visible" : ""}>{show ? "VISIBLE" : "MASKED"}</span>
          </button>
        )}
        <span className="auth-slot-prompt font-pixel" aria-hidden="true">{prompt}</span>
        <span className="auth-underline" aria-hidden="true" style={{ background: caretColor }} />
      </div>
      {error && (
        <motion.span
          className="auth-field-error font-pixel"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          style={{ color: SYS_PK, fontSize: 6, letterSpacing: "0.1em", marginTop: 4, display: "block" }}
        >
          {error}
        </motion.span>
      )}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   PIXEL CHECKBOX — remember device
   ════════════════════════════════════════════════════════════ */
function PixelCheck({ checked, onChange, labelText }) {
  return (
    <label className="auth-pixelcheck">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <motion.span
        className={`auth-checkbox ${checked ? "is-checked" : ""}`}
        aria-hidden="true"
        style={{ background: checked ? SYS_PK : "transparent", borderColor: checked ? SYS_PK : "rgba(255,244,214,0.4)" }}
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence>
          {checked && (
            <motion.span
              className="auth-checkbox-mark"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              ▪
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>
      <span className="auth-checkbox-label font-pixel">{labelText}</span>
    </label>
  );
}

/* ════════════════════════════════════════════════════════════
   ARCADE START BUTTON — physical arcade press control
   ════════════════════════════════════════════════════════════ */
function ArcadeStartButton({ children, onClick, color = SYS_PK }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="arcade-start-btn group"
      whileHover={{ y: -2 }}
      whileTap={{ y: 2, scale: 0.985 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      style={{ "--accent": color }}
    >
      {/* mechanical pressed-under shadow */}
      <span className="arcade-start-shadow" aria-hidden="true" />
      {/* very top lit face */}
      <span className="arcade-start-face" aria-hidden="true" />
      <span className="arcade-start-body">
        <span className="arcade-start-scan" aria-hidden="true" />
        <span className="arcade-start-icon font-pixel">▶</span>
        <span className="arcade-start-label font-pixel">{children}</span>
        <span className="arcade-start-status font-pixel">
          <Led color={SYS_GR} size={5} className="is-blink" /> LIVE
        </span>
      </span>
    </motion.button>
  );
}

/* ════════════════════════════════════════════════════════════
   AUTH PROGRESS — sequential terminal status during submit
   ════════════════════════════════════════════════════════════ */
function AuthProcess({ steps, accent = SYS_PK, step = null, progress = null }) {
  const controlled = typeof step === "number" && step >= 0;
  const [uStep, setUStep] = useState(0);
  const [uProgress, setUProgress] = useState(0);
  const stepsKey = steps.join("|");

  const activeStep = controlled ? Math.min(step, steps.length - 1) : Math.min(uStep, steps.length - 1);
  const fill = controlled
    ? `${Math.min(Math.max(progress ?? 0, 0), 100)}%`
    : `${Math.min((uProgress / (steps.length * 11)) * 100, 100)}%`;

  useEffect(() => {
    if (controlled) return;
    setUStep(0);
    setUProgress(0);
    const iv = setInterval(() => {
      setUProgress((p) => {
        const next = p + 1;
        if (next % 11 === 0) setUStep((s) => Math.min(s + 1, steps.length));
        return next;
      });
    }, 40);
    return () => clearInterval(iv);
  }, [stepsKey, steps.length, controlled]);

  return (
    <motion.div
      className="auth-process"
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          className="auth-process-label font-pixel"
          style={{ color: accent }}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 8 }}
          transition={{ duration: 0.12 }}
        >
          {steps[Math.min(activeStep, steps.length - 1)]}
          <span className="auth-process-cursor" />
        </motion.div>
      </AnimatePresence>
      <div className="auth-process-bar">
        <motion.span
          className="auth-process-bar-fill"
          style={{ background: accent }}
          animate={{ width: fill }}
          transition={{ duration: 0.05 }}
        />
      </div>
      <div className="auth-process-dots" aria-hidden="true">
        {steps.map((_, i) => (
          <span key={i} className={`${i < activeStep ? "is-lit" : ""} ${i === activeStep && activeStep < steps.length ? "is-current" : ""}`} style={{ background: i < activeStep ? accent : "rgba(255,244,214,0.15)" }} />
        ))}
      </div>
      <Tele opacity={0.4}>CONNECTING TO HORIZON... PLEASE WAIT</Tele>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   SYSTEM MESSAGE — error / success native terminal feedback
   ════════════════════════════════════════════════════════════ */
function SystemMessage({ kind, title, lines = [] }) {
  const color = kind === "error" ? SYS_PK : SYS_GR;
  return (
    <motion.div
      className="auth-msg"
      role={kind === "error" ? "alert" : "status"}
      style={{ borderColor: `${color}55`, background: kind === "error" ? "rgba(255,0,127,0.07)" : "rgba(76,255,76,0.06)" }}
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Brackets color={color} size={8} opacity={0.7} inset={-3} />
      <div className="auth-msg-top">
        <span className="auth-msg-icon font-pixel" style={{ color }}>{kind === "error" ? "[!]" : "[✓]"}</span>
        <span className="auth-msg-title font-pixel">{title}</span>
      </div>
      {lines.map((l, i) => (
        <motion.div
          key={l}
          className="auth-msg-line font-mono"
          style={{ color: SYS_CR }}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 + i * 0.08, duration: 0.2 }}
        >
          {l}
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   PRESS START — insert-coin idle state of the terminal
   ════════════════════════════════════════════════════════════ */
function PressStart({ onStart }) {
  return (
    <div className="ps-screen">
      <div className="ps-center">
        <div className="ps-brand font-pixel">
          FHC <span style={{ color: SYS_CY }}>//</span> HORIZON NETWORK
        </div>
        <div className="ps-badge font-pixel" style={{ color: SYS_GR }}>
          <Led color={SYS_GR} size={6} className="is-blink" /> SYSTEM ONLINE
        </div>

        <div className="ps-panel">
          <Brackets color={SYS_PK} size={12} opacity={0.5} inset={0} />
          <div className="ps-kicker font-pixel">PLAYER ACCESS TERMINAL</div>
          <div className="ps-title font-pixel">
            AUTHENTICATION
            <br />
            <span style={{ color: SYS_CY }}>REQUIRED</span>
          </div>
          <div className="ps-divider" aria-hidden="true">
            <span />
            <b>✦</b>
            <span />
          </div>
          <div className="ps-sub font-mono">
            INSERT COIN TO AUTHENTICATE
            <br />
            AN EXISTING FHC MEMBER NODE
          </div>
        </div>

        <ArcadeStartButton onClick={onStart}>PRESS START</ArcadeStartButton>

        <div className="ps-foot">
          <Tele opacity={0.4}>HORIZON OS v2.6</Tele>
          <span className="ps-dot" aria-hidden="true">·</span>
          <Tele opacity={0.4}>NODE FHC-01</Tele>
        </div>
      </div>

      <Scanlines tint="rgba(255,0,127,0.015)" />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   LOGIN SCREEN — primary experience (existing member only)
   ════════════════════════════════════════════════════════════ */
function LoginScreen({ fields, onField, onForgot, errors, onSubmit, connecting, onSignup }) {
  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <div className="login-head">
        <div className="login-eyebrow font-pixel" style={{ color: SYS_PK }}>
          <Led color={SYS_PK} size={5} /> PLAYER ACCESS
        </div>
        <h1 className="login-title font-pixel">
          CONNECT TO FHC<span className="auth-title-cursor">_</span>
        </h1>
        <p className="login-sub font-pixel">MEMBER AUTHENTICATION TERMINAL</p>
        <div className="auth-pxdivider" />
      </div>

      <div className="auth-fields">
        <AuthInput
          id="login-id"
          name="username"
          label="PLAYER ID / EMAIL"
          prompt="ENTER MEMBER ID_"
          value={fields.loginId}
          onChange={(e) => onField("loginId", e.target.value)}
          autoComplete="username"
          error={errors?.loginId}
          scan="MEMBER ID"
        />
        <AuthInput
          id="login-pw"
          name="password"
          label="ACCESS CODE"
          prompt="ENTER ACCESS CODE_"
          isPassword
          show={fields.showPw}
          onToggleShow={() => onField("showPw", !fields.showPw)}
          value={fields.loginPw}
          onChange={(e) => onField("loginPw", e.target.value)}
          autoComplete="current-password"
          error={errors?.loginPw}
          scan="SECURE"
        />

        <div className="auth-options-row">
          <PixelCheck checked={fields.remember} onChange={(v) => onField("remember", v)} labelText="REMEMBER THIS DEVICE" />
          <motion.button
            type="button"
            className="auth-forgot font-pixel"
            onClick={onForgot}
            whileHover={{ x: 2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            FORGOT ACCESS CODE?
          </motion.button>
        </div>
      </div>

      <div className="auth-cta-zone">
        <motion.button
          type="submit"
          disabled={connecting}
          className="auth-connect group"
          whileHover={!connecting ? { y: -2 } : {}}
          whileTap={!connecting ? { y: 1, scale: 0.99 } : {}}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <span className="auth-connect-shadow" aria-hidden="true" />
          <span className="auth-connect-face" aria-hidden="true" />
          <span className="auth-connect-scan" aria-hidden="true" />
          <span className="auth-connect-body">
            {connecting ? (
              <>
                <span className="auth-spinner" aria-hidden="true" />
                <span className="font-pixel auth-connect-label">CONNECTING...</span>
              </>
            ) : (
              <>
                <span className="font-pixel auth-connect-icon" style={{ color: SYS_PK }}>▶</span>
                <span className="font-pixel auth-connect-label">CONNECT TO FHC</span>
                <span className="font-pixel auth-connect-side">READY</span>
              </>
            )}
          </span>
        </motion.button>
      </div>

      <div className="login-divider font-pixel" aria-hidden="true">
        <span className="login-divider-line" />
        <span>NEW TO FHC?</span>
        <span className="login-divider-line" />
      </div>

      <motion.button
        type="button"
        onClick={onSignup}
        className="join-club font-pixel auth-mode-toggle"
        whileHover={{ x: 2 }}
        whileTap={{ y: 1, scale: 0.99 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <span className="join-club-arrow">▶</span>
        <span>SIGN UP</span>
      </motion.button>
      <div className="join-club-note font-pixel">ACCOUNT CREDENTIALS — PLAYER PROFILE VIA /JOIN</div>
    </form>
  );
}

/* ════════════════════════════════════════════════════════════
   SIGN UP SCREEN — arcade account registration state
   ════════════════════════════════════════════════════════════ */
function SignupScreen({ fields, onField, errors, onSubmit, onLogin }) {
  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <div className="login-head">
        <div className="login-eyebrow font-pixel" style={{ color: SYS_CY }}>
          <Led color={SYS_CY} size={5} /> NEW MEMBER
        </div>
        <h1 className="login-title font-pixel">
          CREATE ACCOUNT<span className="auth-title-cursor">_</span>
        </h1>
        <p className="login-sub font-pixel">MEMBER AUTHENTICATION REGISTRATION</p>
        <div className="auth-pxdivider" />
      </div>

      <div className="auth-fields">
        <div className="auth-fields-two">
          <AuthInput
            id="su-name"
            name="fullname"
            label="FULL NAME"
            prompt="YOUR NAME_"
            value={fields.signupName}
            onChange={(e) => onField("signupName", e.target.value)}
            autoComplete="name"
            caretColor={SYS_CY}
            error={errors?.signupName}
            scan="IDENTITY"
          />
          <AuthInput
            id="su-email"
            name="email"
            label="EMAIL"
            prompt="MEMBER@FHC.NET"
            type="email"
            value={fields.signupEmail}
            onChange={(e) => onField("signupEmail", e.target.value)}
            autoComplete="email"
            caretColor={SYS_CY}
            error={errors?.signupEmail}
            scan="CHANNEL"
          />
        </div>
        <div className="auth-fields-two">
          <AuthInput
            id="su-pw"
            name="new-password"
            label="ACCESS CODE"
            prompt="CREATE ACCESS CODE_"
            isPassword
            show={fields.signupShowPw}
            onToggleShow={() => onField("signupShowPw", !fields.signupShowPw)}
            value={fields.signupPw}
            onChange={(e) => onField("signupPw", e.target.value)}
            autoComplete="new-password"
            caretColor={SYS_CY}
            error={errors?.signupPw}
            scan="SECURE"
          />
          <AuthInput
            id="su-pw2"
            name="confirm-new-password"
            label="CONFIRM ACCESS CODE"
            prompt="RE-ENTER CODE_"
            isPassword
            show={fields.signupShowPw2}
            onToggleShow={() => onField("signupShowPw2", !fields.signupShowPw2)}
            value={fields.signupPw2}
            onChange={(e) => onField("signupPw2", e.target.value)}
            autoComplete="new-password"
            caretColor={SYS_CY}
            error={errors?.signupPw2}
            scan="VERIFY"
          />
        </div>
      </div>

      <div className="auth-cta-zone">
        <motion.button
          type="submit"
          className="auth-connect group"
          whileHover={{ y: -2 }}
          whileTap={{ y: 1, scale: 0.99 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <span className="auth-connect-shadow" aria-hidden="true" />
          <span className="auth-connect-face" aria-hidden="true" />
          <span className="auth-connect-scan" aria-hidden="true" />
          <span className="auth-connect-body">
            <span className="font-pixel auth-connect-icon" style={{ color: SYS_CY }}>▶</span>
            <span className="font-pixel auth-connect-label">CREATE ACCOUNT</span>
            <span className="font-pixel auth-connect-side">NEW</span>
          </span>
        </motion.button>
      </div>

      <div className="login-divider font-pixel" aria-hidden="true">
        <span className="login-divider-line" />
        <span>ALREADY A MEMBER?</span>
        <span className="login-divider-line" />
      </div>

      <motion.button
        type="button"
        onClick={onLogin}
        className="join-club font-pixel auth-mode-toggle"
        whileHover={{ x: 2 }}
        whileTap={{ y: 1, scale: 0.99 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <span className="join-club-arrow">▶</span>
        <span>LOGIN</span>
      </motion.button>
    </form>
  );
}

/* ════════════════════════════════════════════════════════════
   FORGOT SCREEN — compact arcade recovery state
   ════════════════════════════════════════════════════════════ */
function ForgotScreen({ email, onEmail, onBack, onSubmit }) {
  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <div className="login-head">
        <div className="login-eyebrow font-pixel" style={{ color: SYS_YL }}>
          <Led color={SYS_YL} size={5} /> ACCESS RECOVERY
        </div>
        <h1 className="login-title font-pixel">
          RESTORE ACCESS<span className="auth-title-cursor">_</span>
        </h1>
        <p className="login-sub font-pixel">ENTER YOUR REGISTERED EMAIL</p>
        <div className="auth-pxdivider" />
      </div>

      <div className="auth-fields">
        <AuthInput
          id="forgot-email"
          name="email"
          label="REGISTERED EMAIL"
          prompt="MEMBER@FHC.NET"
          type="email"
          value={email || ""}
          onChange={(e) => onEmail(e.target.value)}
          autoComplete="email"
          caretColor={SYS_PK}
          scan="RECOVERY"
        />
      </div>

      <div className="auth-cta-zone">
        <motion.button
          type="submit"
          className="auth-connect group"
          whileHover={{ y: -2 }}
          whileTap={{ y: 1, scale: 0.99 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <span className="auth-connect-shadow" aria-hidden="true" />
          <span className="auth-connect-face" aria-hidden="true" />
          <span className="auth-connect-scan" aria-hidden="true" />
          <span className="auth-connect-body">
            <span className="font-pixel auth-connect-icon" style={{ color: SYS_YL }}>▶</span>
            <span className="font-pixel auth-connect-label">REQUEST RECOVERY</span>
            <span className="font-pixel auth-connect-side">SEND</span>
          </span>
        </motion.button>
      </div>

      <div className="auth-switchhint font-pixel">
        <motion.button type="button" onClick={onBack} className="auth-switchlink" style={{ color: SYS_CY }} whileHover={{ x: -3 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          ← BACK TO LOGIN
        </motion.button>
      </div>
    </form>
  );
}

/* ════════════════════════════════════════════════════════════
   RECOVERY SCREEN — set a new access code (Supabase recovery link)
   ════════════════════════════════════════════════════════════ */
function RecoveryScreen({ fields, onField, errors, onSubmit, onCancel }) {
  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <div className="login-head">
        <div className="login-eyebrow font-pixel" style={{ color: SYS_YL }}>
          <Led color={SYS_YL} size={5} /> ACCESS RECOVERY
        </div>
        <h1 className="login-title font-pixel">
          REINITIALIZE ACCESS<span className="auth-title-cursor">_</span>
        </h1>
        <p className="login-sub font-pixel">SET A NEW ACCESS CODE</p>
        <div className="auth-pxdivider" />
      </div>

      <div className="auth-fields">
        <AuthInput
          id="rc-pw"
          name="new-password"
          label="NEW ACCESS CODE"
          prompt="ENTER NEW CODE_"
          isPassword
          show={fields.rcShowPw}
          onToggleShow={() => onField("rcShowPw", !fields.rcShowPw)}
          value={fields.rcPw}
          onChange={(e) => onField("rcPw", e.target.value)}
          autoComplete="new-password"
          caretColor={SYS_YL}
          error={errors?.rcPw}
          scan="RESET"
        />
        <AuthInput
          id="rc-pw2"
          name="confirm-new-password"
          label="CONFIRM NEW CODE"
          prompt="RE-ENTER NEW CODE_"
          isPassword
          show={fields.rcShowPw2}
          onToggleShow={() => onField("rcShowPw2", !fields.rcShowPw2)}
          value={fields.rcPw2}
          onChange={(e) => onField("rcPw2", e.target.value)}
          autoComplete="new-password"
          caretColor={SYS_YL}
          error={errors?.rcPw2}
          scan="VERIFY"
        />
      </div>

      <div className="auth-cta-zone">
        <motion.button
          type="submit"
          className="auth-connect group"
          whileHover={{ y: -2 }}
          whileTap={{ y: 1, scale: 0.99 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <span className="auth-connect-shadow" aria-hidden="true" />
          <span className="auth-connect-face" aria-hidden="true" />
          <span className="auth-connect-scan" aria-hidden="true" />
          <span className="auth-connect-body">
            <span className="font-pixel auth-connect-icon" style={{ color: SYS_YL }}>▶</span>
            <span className="font-pixel auth-connect-label">REINITIALIZE CODE</span>
            <span className="font-pixel auth-connect-side">SAVE</span>
          </span>
        </motion.button>
      </div>

      <div className="auth-switchhint font-pixel">
        <motion.button type="button" onClick={onCancel} className="auth-switchlink" style={{ color: SYS_CY }} whileHover={{ x: -3 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          ← BACK TO LOGIN
        </motion.button>
      </div>
    </form>
  );
}

/* ════════════════════════════════════════════════════════════
   FHC NETWORK HUD — supporting "you are connecting to a system"
   ════════════════════════════════════════════════════════════ */
function NetworkHud({ state }) {
  const isActive = state !== "success";
  return (
    <div className="nhud">
      <Brackets color={SYS_PK} size={9} opacity={0.5} inset={-2} />
      <Scanlines tint="rgba(0,229,255,0.012)" />

      <div className="nhud-head">
        <Led color={SYS_GR} size={6} className="is-blink" />
        <span className="font-pixel nhud-title" style={{ color: SYS_CY }}>FHC NETWORK</span>
        <span className="font-pixel nhud-status" style={{ color: SYS_GR }}>LIVE</span>
      </div>

      {/* mini topology — LOGIN ─ NODE ─ DATA */}
      <div className="nhud-topo" aria-hidden="true">
        <svg viewBox="0 0 260 120" className="nhud-topo-svg">
          <motion.line x1="130" y1="60" x2="30" y2="30" stroke={`${SYS_PK}55`} strokeWidth="1.6" strokeDasharray="4 4"
            animate={{ strokeOpacity: [0.4, 1, 0.4] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />
          <motion.line x1="130" y1="60" x2="230" y2="30" stroke={`${SYS_CY}50`} strokeWidth="1.4" strokeDasharray="4 4"
            animate={{ strokeOpacity: [0.3, 0.9, 0.3] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }} />
          <motion.line x1="130" y1="60" x2="230" y2="90" stroke={`${SYS_GR}40`} strokeWidth="1.2" strokeDasharray="4 4"
            animate={{ strokeOpacity: [0.2, 0.8, 0.2] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} />
        </svg>
        <div className="nhud-node nhud-node-core">
          <motion.div className="nhud-node-box" animate={{ boxShadow: ["0 0 12px rgba(255,22,135,0.4)", "0 0 22px rgba(255,22,135,0.6)", "0 0 12px rgba(255,22,135,0.4)"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <span className="font-pixel" style={{ color: INK }}>FHC</span>
          </motion.div>
        </div>
        <div className="nhud-node nhud-node-login">
          <motion.span className="nhud-node-dot" style={{ background: SYS_PK, boxShadow: `0 0 6px ${SYS_PK}aa` }} animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />
          <Tele opacity={isActive ? 0.9 : 0.5} ls="0.08em" size={5} color={SYS_PK}>LOGIN</Tele>
        </div>
        <div className="nhud-node nhud-node-data">
          <span className="nhud-node-dot" style={{ background: SYS_CY, boxShadow: `0 0 6px ${SYS_CY}aa` }} />
          <Tele opacity={0.5} ls="0.08em" size={5} color={SYS_CY}>NODE</Tele>
        </div>
        <div className="nhud-node nhud-node-sys">
          <span className="nhud-node-dot" style={{ background: SYS_GR, boxShadow: `0 0 6px ${SYS_GR}aa` }} />
          <Tele opacity={0.5} ls="0.08em" size={5} color={SYS_GR}>DATA</Tele>
        </div>
      </div>

      {/* readouts */}
      <div className="nhud-readouts">
        <StatusIndicator label="SYSTEM" value="ONLINE" color={SYS_GR} valueColor={SYS_GR} blink />
        <StatusIndicator label="NODE" value="FHC-01" color={SYS_CY} valueColor={SYS_CY} />
        <StatusIndicator label="SECURITY" value="ACTIVE" color={SYS_PK} valueColor={SYS_PK} />
        <StatusIndicator label="ACCESS" value="RESTRICTED" color={SYS_YL} valueColor={SYS_YL} />
      </div>

      <div className="nhud-foot">
        <span className="nhud-os font-pixel" style={{ color: SYS_CY }}>HORIZON OS</span>
        <span className="font-pixel nhud-ver" style={{ color: SYS_CR, opacity: 0.7 }}>v2.6</span>
        <span className="nhud-sec" style={{ color: SYS_GR }}>♥</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN AUTH PAGE
   ════════════════════════════════════════════════════════════ */
export default function Auth() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const location = useLocation();
  const { status: authStatus, refreshProfile, role } = useAuth();

  const [entered, setEntered] = useState(false);
  const [started, setStarted] = useState(false);

  const [view, setView] = useState("start"); // start | form | forgot | recovery | process | error | success
  const [mode, setMode] = useState("login"); // login | signup
  const [switching, setSwitching] = useState(false);
  const [processDone, setProcessDone] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [origin, setOrigin] = useState("login");
  const [successKind, setSuccessKind] = useState("login");
  const [procSteps, setProcSteps] = useState([]);
  const [procStep, setProcStep] = useState(0);

  const busyRef = useRef(false);

  const [msgError, setMsgError] = useState(null);
  const [errors, setErrors] = useState({});

  const [fields, setFields] = useState({
    loginId: "", loginPw: "", showPw: false,
    remember: true, forgotEmail: "",
    signupName: "", signupEmail: "", signupPw: "", signupPw2: "",
    signupShowPw: false, signupShowPw2: false,
    rcPw: "", rcPw2: "", rcShowPw: false, rcShowPw2: false,
  });

  /* ── live-input reconciliation ────────────────────────────────────
     These fields are fully controlled (value={fields.*}), so browser
     autofill/credential managers can write straight into the DOM node
     WITHOUT firing onChange — leaving React state stale while the input
     LOOKS filled. That stale state is exactly what made validation
     report "COMPLETE ALL REQUIRED FIELDS_" on a visibly-complete form.
     current() prefers the live DOM value over state for every field. */
  const LIVE_IDS = {
    loginId: "login-id",
    loginPw: "login-pw",
    signupName: "su-name",
    signupEmail: "su-email",
    signupPw: "su-pw",
    signupPw2: "su-pw2",
    forgotEmail: "forgot-email",
    rcPw: "rc-pw",
    rcPw2: "rc-pw2",
  };
  const current = () => {
    const out = {};
    for (const [key, id] of Object.entries(LIVE_IDS)) {
      const el = document.getElementById(id);
      out[key] = el && typeof el.value === "string" ? el.value : fields[key];
    }
    return out;
  };

  /* if already authenticated and NOT handling a recovery link → go to dashboard
     (admins land in the FHC Command Center, everyone else in their member area) */
  useEffect(() => {
    if (authStatus === "authed" && !location.hash.includes("type=recovery") && successKind !== "recovery-complete") {
      navigate(role === "admin" ? "/admin" : "/dashboard", { replace: true });
    }
  }, [authStatus, navigate, location.hash, successKind, role]);

  /* detect a Supabase password-recovery deep link (#access_token&type=recovery) */
  useEffect(() => {
    if (location.hash.includes("type=recovery")) {
      setView("recovery");
    }
  }, [location.hash]);

  const [uptime, setUptime] = useState("00:00:00");
  const uptimeRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 60);
    const iv = setInterval(() => {
      uptimeRef.current += 1;
      const h = String(Math.floor(uptimeRef.current / 3600)).padStart(2, "0");
      const m = String(Math.floor((uptimeRef.current % 3600) / 60)).padStart(2, "0");
      const s = String(uptimeRef.current % 60).padStart(2, "0");
      setUptime(`${h}:${m}:${s}`);
    }, 1000);
    return () => { clearTimeout(t); clearInterval(iv); };
  }, []);

  const onField = (key, val) => {
    setFields((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  /* quick auto-focus once the login screen is revealed */
  useEffect(() => {
    if (view !== "form" || !started || reduceMotion) return;
    const t = setTimeout(() => {
      if (window.matchMedia("(min-width: 768px)").matches) {
        document.getElementById(mode === "login" ? "login-id" : "su-name")?.focus();
      }
    }, 300);
    return () => clearTimeout(t);
  }, [view, started, mode, reduceMotion]);

  const start = () => {
    setStarted(true);
    setView("form");
    setMsgError(null);
    setErrors({});
  };

  const switchMode = (next) => {
    if (next === mode || switching) return;
    setErrors({});
    setSwitching(true);
    setTimeout(() => {
      setMode(next);
      setFields((f) => ({ ...f, signupShowPw: false, signupShowPw2: false, showPw: false }));
      setSwitching(false);
    }, 200);
  };

  const validation = () => {
    const c = current();
    const errs = {};
    if (mode === "signup") {
      if (!c.signupName.trim()) errs.signupName = "NAME REQUIRED_";
      if (!c.signupEmail.trim()) errs.signupEmail = "EMAIL REQUIRED_";
      else if (!c.signupEmail.includes("@")) errs.signupEmail = "INVALID EMAIL FORMAT_";
      if (!c.signupPw.trim()) errs.signupPw = "ACCESS CODE REQUIRED_";
      else if (c.signupPw.length < 6) errs.signupPw = "MIN 6 CHARS_";
      if (!c.signupPw2.trim()) errs.signupPw2 = "CONFIRM REQUIRED_";
      else if (c.signupPw !== c.signupPw2) errs.signupPw2 = "CODES DO NOT MATCH_";
      return errs;
    }
    if (!c.loginId.trim()) errs.loginId = "ID REQUIRED_";
    if (!c.loginPw.trim()) errs.loginPw = "ACCESS CODE REQUIRED_";
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    (async () => {
      try {
        if (view === "forgot") return await runForgot();
        if (view === "recovery") return await runRecovery();
        if (mode === "signup") return await runSignup();
        return await runLogin();
      } catch (err) {
        console.error("[FHC] handleSubmit caught:", err);
        failWith(err, "unknown");
      } finally {
        busyRef.current = false;
      }
    })();
  };

  const enterProcess = (steps, accent) => {
    setProcSteps(steps);
    setProcStep(0);
    setErrors({});
    setMsgError(null);
    setConnecting(true);
    setProcessDone(false);
    setView("process");
    return accent;
  };

  const failWith = (err, ctx) => {
    setConnecting(false);
    setProcessDone(true);
    setMsgError(mapAuthError(err, ctx));
    setView("error");
  };

  const runLogin = async () => {
    const v = validation();
    if (Object.keys(v).length > 0) {
      setErrors(v);
      setOrigin("login");
      setMsgError({ title: "ACCESS DENIED", lines: ["COMPLETE ALL REQUIRED FIELDS_"] });
      setView("error");
      setProcessDone(true);
      setConnecting(false);
      return;
    }
    /* Read live DOM values so browser autofill is respected (see current()). */
    const c = current();
    setOrigin("login");
    setSuccessKind("login");
    enterProcess(LOGIN_STEPS, SYS_PK);
    try {
      await sleep(300);
      setProcStep(1);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: c.loginId.trim(),
        password: c.loginPw,
      });
      if (error) throw error;
      setProcStep(2);
      /* NOTE: last_login_at is an optional column that does not exist in the
         live profiles schema; writing it silently 400s, so we no longer
         attempt it.  The column can be added by a future migration. */
      await sleep(140);
      setProcStep(3);
      /* Pass uid directly — user state in React may not have updated yet */
      await refreshProfile(data?.user?.id);
      await sleep(180);
      setConnecting(false);
      setProcessDone(true);
      /* Resolve the landing from the returned user object (React state may lag):
         admins go straight to the Command Center. */
      const landedAdmin = data?.user?.app_metadata?.role === "admin" || data?.user?.user_metadata?.role === "admin";
      navigate(landedAdmin ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      console.error("[FHC] Login failed:", err);
      failWith(err, "signin");
    }
  };

  const runSignup = async () => {
    const v = validation();
    if (Object.keys(v).length > 0) {
      setErrors(v);
      setOrigin("signup");
      setMsgError({ title: "REGISTRATION INCOMPLETE", lines: ["COMPLETE ALL REQUIRED FIELDS_"] });
      setView("error");
      setProcessDone(true);
      setConnecting(false);
      return;
    }
    /* Read live DOM values so browser autofill is respected (see current()). */
    const c = current();
    setOrigin("signup");
    setSuccessKind("signup-verify");
    enterProcess(SIGNUP_STEPS, SYS_CY);
    try {
      await sleep(300);
      setProcStep(1);
      const { data, error } = await supabase.auth.signUp({
        email: c.signupEmail.trim(),
        password: c.signupPw,
        options: {
          data: { full_name: c.signupName.trim(), role: "user" },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      setProcStep(2);
      await sleep(160);
      setProcStep(3);
      /* Pass uid directly — React state may lag */
      await refreshProfile(data?.user?.id);
      await sleep(180);
      setProcStep(4);
      setConnecting(false);
      setProcessDone(true);
      if (data?.session) {
        /* Email confirmation disabled — user is authenticated immediately */
        console.log("[FHC] Signup successful — session active");
        const landedAdmin = data.user?.app_metadata?.role === "admin" || data.user?.user_metadata?.role === "admin";
        navigate(landedAdmin ? "/admin" : "/dashboard", { replace: true });
      } else {
        /* Email confirmation enabled — user must verify first */
        console.log("[FHC] Signup successful — awaiting email confirmation");
        setMsgError(null);
        setView("success");
      }
    } catch (err) {
      console.error("[FHC] Signup failed:", err);
      failWith(err, "signup");
    }
  };

  const runForgot = async () => {
    const c = current();
    if (!c.forgotEmail || !c.forgotEmail.includes("@")) {
      setOrigin("forgot");
      setMsgError({ title: "EMAIL REQUIRED", lines: ["ENTER REGISTERED MEMBER EMAIL_"] });
      setView("error");
      setProcessDone(true);
      setConnecting(false);
      return;
    }
    setOrigin("forgot");
    setSuccessKind("recovery");
    enterProcess(FORGOT_STEPS, SYS_PK);
    try {
      await sleep(280);
      setProcStep(1);
      const { error } = await supabase.auth.resetPasswordForEmail(c.forgotEmail.trim(), {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      setProcStep(2);
      await sleep(160);
      setProcStep(3);
      setConnecting(false);
      setProcessDone(true);
      setMsgError(null);
      setView("success");
    } catch (err) {
      console.error("[FHC] Password recovery request failed:", err);
      failWith(err, "recovery");
    }
  };

  const runRecovery = async () => {
    const c = current();
    const v = {};
    if (!c.rcPw) v.rcPw = "NEW ACCESS CODE REQUIRED_";
    else if (c.rcPw.length < 6) v.rcPw = "MIN 6 CHARS_";
    if (!c.rcPw2) v.rcPw2 = "CONFIRM REQUIRED_";
    else if (c.rcPw !== c.rcPw2) v.rcPw2 = "CODES DO NOT MATCH_";
    if (Object.keys(v).length > 0) {
      setErrors(v);
      setOrigin("recovery");
      setMsgError({ title: "INVALID RESET", lines: ["COMPLETE ALL REQUIRED FIELDS_"] });
      setView("error");
      setProcessDone(true);
      setConnecting(false);
      return;
    }
    setOrigin("recovery");
    setSuccessKind("recovery-complete");
    enterProcess(RECOVERY_STEPS, SYS_YL);
    try {
      await sleep(300);
      setProcStep(1);
      const { error } = await supabase.auth.updateUser({ password: c.rcPw });
      if (error) throw error;
      setProcStep(2);
      await sleep(160);
      setConnecting(false);
      setProcessDone(true);
      setMsgError(null);
      window.history.replaceState(null, "", window.location.pathname);
      setView("success");
    } catch (err) {
      console.error("[FHC] Password update failed:", err);
      failWith(err, "recovery");
    }
  };

  const goForgot = () => {
    setErrors({});
    setView("forgot");
  };

  const backToLogin = () => {
    setErrors({});
    setMode("login");
    setView("form");
  };

  const cancelRecovery = () => {
    setErrors({});
    setView("form");
  };

  const retry = () => {
    setErrors({});
    setProcessDone(false);
    setConnecting(false);
    setMode(origin === "forgot" || origin === "recovery" || origin === "login" ? "login" : "signup");
    setView(origin === "forgot" ? "forgot" : origin === "recovery" ? "recovery" : "form");
    setMsgError(null);
  };

  const resetAll = () => {
    setView("form");
    setStarted(true);
    setMode("login");
    setMsgError(null);
    setProcessDone(false);
    setErrors({});
    setFields((f) => ({
      ...f,
      loginId: "", loginPw: "", forgotEmail: "",
      signupName: "", signupEmail: "", signupPw: "", signupPw2: "",
      signupShowPw: false, signupShowPw2: false,
      rcPw: "", rcPw2: "", rcShowPw: false, rcShowPw2: false,
    }));
  };

  const state = view === "success" ? "success" : view === "process" ? "authenticating" : (view === "recovery" ? "active" : started ? "active" : "idle");

  const isSignupFlow = origin === "signup";
  const processAccent = isSignupFlow ? SYS_CY : SYS_PK;

  const SUCCESS = {
    login: { title: "ACCESS GRANTED", lines: ["WELCOME BACK, PLAYER_", "MEMBER NODE // ACTIVE", "CONNECTING TO HORIZON..."] },
    "signup-verify": { title: "NODE PENDING ACTIVATION", lines: ["VERIFICATION SENT TO EMAIL CHANNEL", "ACTIVATE YOUR NODE TO ENTER THE TERMINAL"] },
    recovery: { title: "RECOVERY REQUEST SENT", lines: ["CHECK YOUR REGISTERED EMAIL CHANNEL", "USE THE LINK TO REINITIALIZE ACCESS"] },
    "recovery-complete": { title: "ACCESS REINITIALIZED", lines: ["ACCESS CODE UPDATED", "YOU MAY NOW LOG IN WITH THE NEW CODE"] },
  };
  const successTitle = (SUCCESS[successKind] || SUCCESS.login).title;
  const successLines = (SUCCESS[successKind] || SUCCESS.login).lines;
  const successBtn = successKind === "login" || successKind === "signup-verify" ? "ENTER FHC" : "RETURN TO TERMINAL";

  return (
    <div className="auth-root">
      {/* ── background layers ── */}
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-bg-grid" />
        <div className="auth-bg-scan" />
        <div className="auth-bg-glow auth-bg-glow-cyan" />
        <div className="auth-bg-glow auth-bg-glow-pink" />
        <div className="auth-bg-noise" />
        <div className="auth-bg-stream" />
        <span className="auth-particle" style={{ left: "8%", top: "22%" }} />
        <span className="auth-particle auth-particle-slow" style={{ left: "86%", top: "18%" }} />
        <span className="auth-particle" style={{ left: "78%", top: "72%" }} />
        <span className="auth-particle auth-particle-pink" style={{ left: "35%", top: "85%" }} />
        <span className="auth-particle" style={{ left: "92%", top: "55%" }} />
      </div>

      {/* corner telemetry */}
      <Link to="/" className="auth-return font-pixel">
        <span className="auth-return-arrow" aria-hidden="true">←</span>
        <span>RETURN TO FHC</span>
      </Link>
      <div className="auth-corner-tele" aria-hidden="true">
        <Tele>FHC // ARCADE</Tele>
        <Tele color={SYS_PK} opacity={0.25}>SECURE LINK ACTIVE</Tele>
      </div>

      {/* ── top arcade marquee header ── */}
      <motion.header
        className="auth-marquee"
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : -14 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="auth-marquee-inner">
          <div className="auth-marquee-left">
            <Led color={SYS_GR} size={6} className="is-blink" />
            <span className="auth-marquee-name font-pixel">
              FHC ARCADE <span style={{ color: SYS_PK }}>//</span> AUTH TERMINAL
            </span>
          </div>
          <div className="auth-marquee-right">
            <StatusIndicator label="AXIS" value="SECURE" color={SYS_CY} valueColor={SYS_CY} />
            <span className="auth-marquee-sep" aria-hidden="true">//</span>
            <StatusIndicator label="TERMINAL" value="FHC-01" color={SYS_PK} valueColor={SYS_PK} />
          </div>
        </div>
      </motion.header>

      {/* ── the arcade environment ── */}
      <motion.div
        className="auth-shell"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : 18 }}
        transition={{ delay: 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* MAIN: arcade cabinet */}
        <motion.div
          className="auth-cabinet"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* marquee light strip (top of cabinet) */}
          <div className="cab-marquee" aria-hidden="true">
            <span className="cab-marquee-glow" />
            <span className="cab-marquee-light" />
            <span className="cab-marquee-text font-pixel">FHC ARCADE&nbsp;&nbsp;//&nbsp;&nbsp;PLAYER ACCESS</span>
            <span className="cab-marquee-light" />
            <span className="cab-marquee-glow" />
          </div>

          {/* CRT screen bezel */}
          <div className="cab-bezel">
            <div className="cab-bezel-inner">
              <Scanlines tint="rgba(0,229,255,0.02)" />
              <div className="cab-scan-sweep" aria-hidden="true" />

              {/* bezel status row */}
              <div className="cab-bezel-bar">
                <div className="cab-bezel-brand">
                  <Led color={SYS_GR} size={5} className="is-blink" />
                  <span className="font-pixel cab-bezel-name">SYSTEM ONLINE</span>
                </div>
                <div className="cab-bezel-meta">
                  <span className="font-pixel cab-bezel-term">TERM://MAC-02</span>
                  <span className="cab-bezel-sep" aria-hidden="true">·</span>
                  <span className="font-pixel cab-bezel-up" style={{ color: SYS_GR, opacity: 0.7 }}>UP {uptime}</span>
                </div>
              </div>

              {/* screen content */}
              <div className={`cab-screen state-${state}`}>
                {/* CRT mode-swap sweep */}
                <motion.span
                  key={`sweep-${mode}`}
                  className="cab-mode-sweep"
                  aria-hidden="true"
                  initial={{ y: "-140%", opacity: 1 }}
                  animate={{ y: "240%", opacity: [1, 1, 0] }}
                  transition={{ duration: 0.45, ease: "easeIn" }}
                />
                <AnimatePresence mode="wait">
                  {view === "start" && (
                    <motion.div
                      key="start"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.25 }}
                    >
                      <PressStart onStart={start} />
                    </motion.div>
                  )}

                  {(view === "form" || view === "forgot" || view === "recovery") && (
                    <motion.div
                      key={view === "forgot" ? "forgot" : view === "recovery" ? "recovery" : `form-${mode}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="cab-screen-body"
                    >
                      {view === "forgot" ? (
                        <ForgotScreen
                          email={fields.forgotEmail}
                          onEmail={(v) => onField("forgotEmail", v)}
                          onBack={backToLogin}
                          onSubmit={handleSubmit}
                        />
                      ) : view === "recovery" ? (
                        <RecoveryScreen
                          fields={fields}
                          onField={onField}
                          errors={errors}
                          onSubmit={handleSubmit}
                          onCancel={cancelRecovery}
                        />
                      ) : mode === "signup" ? (
                        <SignupScreen
                          fields={fields}
                          onField={onField}
                          errors={errors}
                          onSubmit={handleSubmit}
                          onLogin={() => switchMode("login")}
                        />
                      ) : (
                        <LoginScreen
                          fields={fields}
                          onField={onField}
                          onForgot={goForgot}
                          errors={errors}
                          onSubmit={handleSubmit}
                          connecting={connecting}
                          onSignup={() => switchMode("signup")}
                        />
                      )}
                    </motion.div>
                  )}

                  {view === "process" && (
                    <motion.div
                      key="process"
                      className="cab-screen-body"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="process-wrap">
                        <AuthProcess
                          steps={procSteps.length ? procSteps : LOGIN_STEPS}
                          accent={processAccent}
                          step={procStep}
                          progress={Math.round((procStep / Math.max(procSteps.length, 1)) * 100)}
                        />
                      </div>
                    </motion.div>
                  )}

                  {view === "error" && (
                    <motion.div
                      key="error"
                      className="cab-screen-body"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        animate={{ x: [0, -4, 4, -2, 2, 0] }}
                        transition={{ duration: 0.3 }}
                      >
                        <SystemMessage kind="error" title={(msgError && msgError.title) || "ACCESS DENIED"} lines={(msgError && msgError.lines) || []} />
                      </motion.div>
                      <motion.button
                        onClick={retry}
                        className="auth-linkbtn font-pixel"
                        style={{ color: SYS_PK }}
                        whileHover={{ x: 2, backgroundColor: "rgba(255,0,127,0.12)" }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        ↻ TRY AGAIN_
                      </motion.button>
                    </motion.div>
                  )}

                  {view === "success" && (
                    <motion.div
                      key="success"
                      className="cab-screen-body"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SystemMessage kind="success" title={successTitle} lines={successLines} />
                      <motion.button
                        onClick={resetAll}
                        className="auth-linkbtn font-pixel"
                        style={{ color: SYS_GR }}
                        whileHover={{ x: 2, backgroundColor: "rgba(76,255,76,0.1)" }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <span className="auth-linkbtn-arrow">▶</span> {successBtn}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* control deck */}
          <div className="cab-deck" aria-hidden="true">
            <div className="cab-deck-inner">
              <div className="cab-deck-leds">
                <span className="cab-deck-led" style={{ background: SYS_GR, boxShadow: `0 0 6px ${SYS_GR}` }} />
                <span className="cab-deck-led" style={{ background: SYS_PK, boxShadow: `0 0 6px ${SYS_PK}` }} />
                <span className="cab-deck-led" style={{ background: SYS_CY, boxShadow: `0 0 6px ${SYS_CY}` }} />
                <span className="cab-deck-led" style={{ background: SYS_YL, boxShadow: `0 0 6px ${SYS_YL}` }} />
              </div>
              <span className="cab-deck-label font-pixel">FHC AUTH CONTROLS</span>
              <div className="cab-deck-leds">
                <span className="cab-deck-led dim" />
                <span className="cab-deck-led dim" />
                <span className="cab-deck-led" style={{ background: SYS_GR, boxShadow: `0 0 6px ${SYS_GR}` }} />
                <span className="cab-deck-led dim" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* SIDE: network HUD */}
        <motion.aside
          className="auth-side"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: entered ? 1 : 0, x: entered ? 0 : 20 }}
          transition={{ delay: 0.22, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="auth-side-stick">
            {/* connector line */}
            <div className="auth-connector-line" aria-hidden="true">
              <span className="auth-connector-dot" />
              <span className="auth-connector-dash" />
              <span className="auth-connector-dot" />
            </div>
            <NetworkHud state={state} />
          </div>
        </motion.aside>
      </motion.div>

      {/* footer */}
      <motion.div
        className="auth-env-foot"
        initial={{ opacity: 0 }}
        animate={{ opacity: entered ? 1 : 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <Tele>HORIZON NETWORK</Tele>
        <span className="auth-env-foot-heart" aria-hidden="true" style={{ color: SYS_PK }}>♥</span>
        <Tele color={SYS_GR} opacity={0.6}>AUTHENTICATE. CONNECT. PLAY.</Tele>
        <span className="auth-env-foot-heart" aria-hidden="true" style={{ color: SYS_PK }}>♥</span>
        <Tele color={SYS_PK} opacity={0.5}>v2.6</Tele>
      </motion.div>
    </div>
  );
}
