import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "../components/AuthProvider";
import { useNavigate } from "react-router-dom";

export const Login = ({ handleRegisterForm }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { signInWithGoogle, signIn } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signIn(email, password);
      navigate("/");
    } catch (err) {
      setError("Couldn't sign in. Check your email and password.");
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
    <form className="form" onSubmit={handleSignIn}>
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
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />
      </label>

      <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
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
        Don't have an account?{" "}
        <button type="button" className="link-btn" onClick={handleRegisterForm}>
          Sign up
        </button>
      </p>
    </form>
  );
};
