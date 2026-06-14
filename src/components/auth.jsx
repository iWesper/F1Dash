import { useState } from "react";
import { Login } from "./Login";
import { SignUp } from "./SignUp";
// Logotipo (vite-plugin-svgr: ?react devolve o SVG como componente React)
import Logo from "../imgs/logo.svg?react";

export const Auth = () => {
  const [register, setRegister] = useState(false);
  const toggleForm = () => setRegister((r) => !r);

  return (
    <main className="page auth-page">
      <section className="glass auth-card">
        <aside className="auth-card__aside">
          <Logo className="auth-card__logo" />
          <p className="auth-card__tagline">
            Your Formula 1 race weekend — countdown, circuit, weather and live
            standings, all in one place.
          </p>
        </aside>

        <div className="auth-card__body">
          <span className="eyebrow">
            {register ? "Create account" : "Welcome back"}
          </span>
          <h1 className="auth-card__title">
            {register ? "Join F1 Dash" : "Sign in to F1 Dash"}
          </h1>

          {register ? (
            <SignUp handleRegisterForm={toggleForm} />
          ) : (
            <Login handleRegisterForm={toggleForm} />
          )}
        </div>
      </section>
    </main>
  );
};
