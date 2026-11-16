import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { fetchDriverStandings, fetchSchedule } from "../api/f1";
import { fmtDay, raceStart } from "../utils/race";

const norm = (s) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

/**
 * Jump to any driver or race. Opens with "/" or Ctrl/⌘+K.
 *
 * Deliberately has no open/close or selection animation: it's a keyboard
 * tool people use repeatedly, where motion only reads as lag.
 * Built on <dialog> so focus trapping and Escape come from the browser.
 */
export default function Search({ open, onClose }) {
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  const drivers = useQuery({ queryKey: ["standings", "drivers"], queryFn: fetchDriverStandings, enabled: open });
  const schedule = useQuery({ queryKey: ["schedule"], queryFn: fetchSchedule, enabled: open });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) {
      setQuery("");
      setIndex(0);
      dialog.showModal();
      inputRef.current?.focus();
    } else if (!open && dialog.open) dialog.close();
  }, [open]);

  const items = useMemo(() => {
    const all = [
      ...(drivers.data?.rows ?? []).map((r) => ({
        key: `d-${r.Driver.driverId}`,
        label: `${r.Driver.givenName} ${r.Driver.familyName}`,
        detail: `Driver · P${r.position} · ${r.Constructors?.[r.Constructors.length - 1]?.name ?? ""}`,
        to: `/driver/${r.Driver.driverId}`,
        haystack: norm(`${r.Driver.givenName} ${r.Driver.familyName} ${r.Driver.code ?? ""}`),
      })),
      ...(schedule.data ?? []).map((r) => ({
        key: `r-${r.round}`,
        label: r.raceName,
        detail: `Race · Round ${r.round} · ${fmtDay(raceStart(r))}`,
        to: "/calendar",
        haystack: norm(`${r.raceName} ${r.Circuit.circuitName} ${r.Circuit.Location.locality} ${r.Circuit.Location.country}`),
      })),
    ];
    const q = norm(query.trim());
    return (q ? all.filter((i) => i.haystack.includes(q)) : all).slice(0, 8);
  }, [drivers.data, schedule.data, query]);

  const go = (item) => {
    onClose();
    navigate(item.to);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const dir = e.key === "ArrowDown" ? 1 : -1;
      setIndex((i) => (items.length ? (i + dir + items.length) % items.length : 0));
    } else if (e.key === "Enter" && items[index]) {
      e.preventDefault();
      go(items[index]);
    }
  };

  const loading = open && (drivers.isPending || schedule.isPending);

  return (
    <dialog
      ref={dialogRef}
      className="search"
      aria-label="Search drivers and races"
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
    >
      <div className="search__box">
        <label className="search__field">
          <FaMagnifyingGlass aria-hidden="true" />
          <span className="visually-hidden">Search drivers and races</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder="Driver or race"
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
            aria-activedescendant={items[index] ? `search-${items[index].key}` : undefined}
            autoComplete="off"
            spellCheck="false"
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={onKeyDown}
          />
          <kbd>Esc</kbd>
        </label>
        <ul className="search__results" id="search-results" role="listbox" aria-label="Results">
          {items.map((item, i) => (
            <li
              key={item.key}
              id={`search-${item.key}`}
              role="option"
              aria-selected={i === index}
              className={i === index ? "is-active" : ""}
              onMouseMove={() => setIndex(i)}
              onClick={() => go(item)}
            >
              <span>{item.label}</span>
              <span className="search__detail mono">{item.detail}</span>
            </li>
          ))}
        </ul>
        {items.length === 0 && (
          <p className="search__empty" role="status">
            {loading
              ? "Loading drivers and races…"
              : drivers.isError && schedule.isError
                ? "Search needs the F1 data provider, which isn't responding."
                : `Nothing matches “${query}”.`}
          </p>
        )}
      </div>
    </dialog>
  );
}
