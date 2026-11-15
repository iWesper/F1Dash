import { useId, useState } from "react";
import { useNavigate } from "react-router";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaEyeSlash, FaCircleCheck } from "react-icons/fa6";
import { authErrorMessage, isPopupDismissal, useAuth } from "./AuthProvider";

// ---- Shared form pieces -----------------------------------------------------

export function FormError({ message }) {
  return message ? (
    <div className="form__error" role="alert">
      {message}
    </div>
  ) : null;
}

export function EmailField({ value, onChange }) {
  return (
    <label className="field">
      <span className="field__label">Email</span>
      <input
        className="input"
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        inputMode="email"
        required
      />
    </label>
  );
}

export function PasswordField({ label, value, onChange, autoComplete, hint, extra }) {
  const [visible, setVisible] = useState(false);
  const hintId = useId();
  return (
    <div className="field">
      <div className="field__row">
        <label className="field__label" htmlFor={`${hintId}-input`}>
          {label}
        </label>
        {extra}
      </div>
      <div className="input-wrap">
        <input
          id={`${hintId}-input`}
          className="input"
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-describedby={hint ? hintId : undefined}
          required
        />
        <button
          type="button"
          className="input-wrap__btn"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
        </button>
      </div>
      {hint && (
        <span className="field__hint" id={hintId}>
          {hint}
        </span>
      )}
    </div>
  );
}

export function GoogleButton({ onError, from }) {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    onError("");
    setBusy(true);
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      if (!isPopupDismissal(err)) onError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className="btn btn--block btn--google"
      onClick={handle}
      disabled={busy}
      aria-busy={busy}
    >
      <FcGoogle size={18} aria-hidden="true" />
      {busy ? "Waiting for Google…" : "Continue with Google"}
    </button>
  );
}

// ---- Sign in ----------------------------------------------------------------

export const Login = ({ email, setEmail, onSwitch, from }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSignIn}>
      <FormError message={error} />
      <EmailField value={email} onChange={setEmail} />
      <PasswordField
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        extra={
          <button type="button" className="link-btn link-btn--sm" onClick={() => onSwitch("reset")}>
            Forgot password?
          </button>
        }
      />

      <button className="btn btn--primary btn--block" type="submit" disabled={busy} aria-busy={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>

      <div className="divider">or</div>
      <GoogleButton onError={setError} from={from} />

      <p className="form__switch">
        New here?{" "}
        <button type="button" className="link-btn" onClick={() => onSwitch("signup")}>
          Create an account
        </button>
      </p>
    </form>
  );
};

// ---- Password reset ---------------------------------------------------------

export const ResetPassword = ({ email, setEmail, onSwitch }) => {
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const { resetPassword } = useAuth();

  const handle = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      // Don't reveal whether an account exists for that address.
      if (err?.code === "auth/user-not-found") setSent(true);
      else setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="form">
        <div className="form__success" role="status">
          <FaCircleCheck aria-hidden="true" />
          <span>
            If an account exists for <strong>{email}</strong>, a reset link is on its way.
            Check your inbox (and spam).
          </span>
        </div>
        <button type="button" className="btn btn--primary btn--block" onClick={() => onSwitch("signin")}>
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={handle}>
      <p className="form__lead">Enter your account email and we'll send you a reset link.</p>
      <FormError message={error} />
      <EmailField value={email} onChange={setEmail} />
      <button className="btn btn--primary btn--block" type="submit" disabled={busy} aria-busy={busy}>
        {busy ? "Sending…" : "Send reset link"}
      </button>
      <p className="form__switch">
        Remembered it?{" "}
        <button type="button" className="link-btn" onClick={() => onSwitch("signin")}>
          Back to sign in
        </button>
      </p>
    </form>
  );
};
