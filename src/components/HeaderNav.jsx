import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { FaBars, FaXmark, FaArrowRightFromBracket } from "react-icons/fa6";
import { useAuth } from "./AuthProvider";

const HeaderNav = () => {
  const [open, setOpen] = useState(false);
  const { user, enabled, authReady, signOutUser } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Close the mobile menu on navigation and on Escape.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const handleSignOut = async () => {
    await signOutUser().catch(() => {});
    if (pathname === "/favorites") navigate("/");
  };

  const linkClass = ({ isActive }) => `nav__link ${isActive ? "is-active" : ""}`;

  return (
    <header className="nav">
      <div className={`nav__inner glass ${open ? "is-open" : ""}`}>
        <Link to="/" className="brand" aria-label="F1 Dash home">
          <span className="brand__mark" aria-hidden="true">
            F1
          </span>
          Dash
        </Link>

        <button
          type="button"
          className="nav__toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="nav-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <FaXmark size={18} /> : <FaBars size={18} />}
        </button>

        <nav className="nav__menu" id="nav-menu" aria-label="Main">
          <NavLink to="/" end className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/calendar" className={linkClass}>
            Calendar
          </NavLink>
          <NavLink to="/favorites" className={linkClass}>
            Favorites
          </NavLink>

          <span className="nav__spacer" />

          {!authReady ? (
            // Reserve the button's space while Firebase restores the session.
            <span className="nav__auth-placeholder" aria-hidden="true" />
          ) : user ? (
            <div className="nav__user-wrap">
              <span className="nav__user" title={user.email ?? undefined}>
                {user.displayName || user.email || "Signed in"}
              </span>
              <button type="button" className="btn btn--ghost" onClick={handleSignOut}>
                <FaArrowRightFromBracket aria-hidden="true" />
                Sign out
              </button>
            </div>
          ) : (
            enabled &&
            pathname !== "/login" && (
              <Link to="/login" state={{ from: pathname }} className="btn btn--primary">
                Sign in
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
};

export default HeaderNav;
