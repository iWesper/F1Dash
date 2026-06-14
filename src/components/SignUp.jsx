import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "../components/AuthProvider";
import { useNavigate } from "react-router-dom";

export const SignUp = ({ handleRegisterForm }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Your password must be at least 6 characters long.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }

    setBusy(true);
    try {
      await signUp(email, password);
      navigate("/");
    } catch (err) {
      setError(
        err?.code === "auth/email-already-in-use"
          ? "An account with that email already exists."
          : "Couldn't create your account. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await signInWithGoogle();
      navigate("/");
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
    }
  };

  return (
    <form className="form" onSubmit={handleSignUp}>
      {error && (
        <div className="form__error" role="alert">
          {error}
        </div>
      )}

      <label className="field">
        <span className="field__label">Email</span>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@mail.com"
          autoComplete="email"
          required
        />
      </label>

      <label className="field">
        <span className="field__label">Password</span>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          autoComplete="new-password"
          required
        />
      </label>

      <label className="field">
        <span className="field__label">Confirm password</span>
        <input
          className="input"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          required
        />
      </label>

      <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
        {busy ? "Creating account…" : "Create account"}
      </button>

      <div className="divider">or</div>

      <button
        type="button"
        className="btn btn--block btn--google"
        onClick={handleGoogle}
      >
        <FcGoogle size={18} /> Continue with Google
      </button>

      <p className="form__switch">
        Already have an account?{" "}
        <button type="button" className="link-btn" onClick={handleRegisterForm}>
          Sign in
        </button>
      </p>
    </form>
  );
};
