import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { FaBars, FaXmark } from "react-icons/fa6";

const HeaderNav = () => {
  const [open, setOpen] = useState(false);
  const { user, signOutUser } = useAuth();

  const close = () => setOpen(false);

  return (
    <header className="nav">
      <div className={`nav__inner glass ${open ? "is-open" : ""}`}>
        <Link to="/" className="brand" onClick={close}>
          <span className="brand__mark">F1</span>
          Dash
        </Link>

        <button
          className="nav__toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <FaXmark size={18} /> : <FaBars size={18} />}
        </button>

        <nav className="nav__menu">
          <Link to="/calendar" className="nav__link" onClick={close}>
            Calendar
          </Link>
          <Link to="/favorites" className="nav__link" onClick={close}>
            Favorites
          </Link>

          <span className="nav__spacer" />

          {user ? (
            <div className="nav__user-wrap">
              <span className="nav__user">{user.email || "Signed in"}</span>
              <button
                className="btn btn--ghost"
                onClick={() => {
                  signOutUser();
                  close();
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn--primary" onClick={close}>
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default HeaderNav;
