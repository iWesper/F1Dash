import { Link } from "react-router";
import { FaArrowRotateRight, FaTriangleExclamation, FaRegFolderOpen } from "react-icons/fa6";
import { MissingKeyError, NotFoundError } from "../api/http";

/**
 * One component for every non-success state, so panels behave consistently.
 *
 *  kind:    "loading" | "error" | "empty"
 *  action:  { label, onClick } or { label, to } — rendered as a button/link
 *  compact: smaller padding for use inside a panel column
 */
export function State({ kind = "empty", title, children, action, compact, icon }) {
  const Icon =
    icon ?? (kind === "error" ? FaTriangleExclamation : kind === "empty" ? FaRegFolderOpen : null);

  return (
    <div
      className={`state state--${kind} ${compact ? "state--compact" : ""}`}
      role={kind === "error" ? "alert" : kind === "loading" ? "status" : undefined}
    >
      {kind === "loading" ? (
        <span className="spinner" aria-hidden="true" />
      ) : (
        Icon && (
          <span className="state__icon" aria-hidden="true">
            <Icon />
          </span>
        )
      )}
      {title && <h3>{title}</h3>}
      {children && <p>{children}</p>}
      {action &&
        (action.to ? (
          <Link
            to={action.to}
            state={action.state}
            className={`btn ${action.primary ? "btn--primary" : ""}`}
          >
            {action.label}
          </Link>
        ) : (
          <button type="button" className="btn" onClick={action.onClick}>
            {action.icon !== false && <FaArrowRotateRight aria-hidden="true" />}
            {action.label}
          </button>
        ))}
    </div>
  );
}

/**
 * Standard error state for a failed query: picks copy by error type and
 * offers a retry only when retrying could help.
 */
export function QueryError({ error, onRetry, what, compact }) {
  if (error instanceof MissingKeyError) {
    return (
      <State kind="empty" title={`${what} unavailable`} compact={compact}>
        This feed isn't configured on this deployment.
      </State>
    );
  }
  if (error instanceof NotFoundError) {
    return (
      <State kind="empty" title={`No ${what.toLowerCase()} found`} compact={compact}>
        {error.message}
      </State>
    );
  }
  const rateLimited = error?.status === 429;
  return (
    <State
      kind="error"
      title={`Couldn't load ${what.toLowerCase()}`}
      compact={compact}
      action={onRetry && { label: "Try again", onClick: onRetry }}
    >
      {rateLimited
        ? "The data provider is rate-limiting requests. Give it a few seconds."
        : "The provider didn't respond. It's usually back within a few minutes."}
    </State>
  );
}

/** Shimmering placeholder block. Purely decorative, hidden from AT. */
export function Skeleton({ width = "100%", height = 14, radius = 8, style, className = "" }) {
  return (
    <span
      className={`skeleton ${className}`}
      aria-hidden="true"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

/** N skeleton rows shaped like a data table, with a screen-reader label. */
export function SkeletonRows({ rows = 8, label = "Loading" }) {
  return (
    <div className="skeleton-rows" role="status">
      <span className="visually-hidden">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div className="skeleton-row" key={i}>
          <Skeleton width={26} height={26} />
          <Skeleton width={`${40 + ((i * 17) % 35)}%`} />
          <Skeleton width={48} style={{ marginLeft: "auto" }} />
        </div>
      ))}
    </div>
  );
}
