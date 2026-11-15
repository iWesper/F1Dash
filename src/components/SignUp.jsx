import { useState } from "react";
import { useNavigate } from "react-router";
import { authErrorMessage, useAuth } from "./AuthProvider";
import { EmailField, FormError, GoogleButton, PasswordField } from "./Login";

const MIN_PASSWORD = 6; // Firebase's minimum

export const SignUp = ({ email, setEmail, onSwitch, from }) => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("That doesn't look like a valid email address.");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Your password needs at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }

    setBusy(true);
    try {
      await signUp(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  const mismatch = confirm.length > 0 && confirm !== password;

  return (
    <form className="form" onSubmit={handleSignUp}>
      <FormError message={error} />
      <EmailField value={email} onChange={setEmail} />
      <PasswordField
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        hint={`At least ${MIN_PASSWORD} characters.`}
      />
      <PasswordField
        label="Confirm password"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
        hint={mismatch ? "Doesn't match yet." : undefined}
      />

      <button className="btn btn--primary btn--block" type="submit" disabled={busy} aria-busy={busy}>
        {busy ? "Creating account…" : "Create account"}
      </button>

      <div className="divider">or</div>
      <GoogleButton onError={setError} from={from} />

      <p className="form__switch">
        Already have an account?{" "}
        <button type="button" className="link-btn" onClick={() => onSwitch("signin")}>
          Sign in
        </button>
      </p>
    </form>
  );
};
