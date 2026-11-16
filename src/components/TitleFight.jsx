import { useQuery } from "@tanstack/react-query";
import * as m from "motion/react-m";
import { fetchPointsProgression, fetchSchedule } from "../api/f1";
import { teamColour } from "../data/teams";
import { EASE_OUT } from "../motion";
import { QueryError, Skeleton, State } from "./State";

const W = 640;
const H = 300;
const PAD = { top: 16, right: 64, bottom: 30, left: 40 };
const SHOWN = 5;
const SPRINT_WIN = 8;
const RACE_WIN = 25;

/** Push overlapping end-of-line labels apart, keeping their order. */
const spread = (ys, gap = 13) => {
  const out = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < out.length; k++) {
    if (out[k].y - out[k - 1].y < gap) out[k].y = out[k - 1].y + gap;
  }
  const res = [];
  out.forEach(({ y, i }) => (res[i] = y));
  return res;
};

/**
 * Points after every round for the top drivers, plus the title maths:
 * who can still win with the points left on the table.
 */
export default function TitleFight() {
  const prog = useQuery({
    queryKey: ["pointsProgression"],
    queryFn: fetchPointsProgression,
    staleTime: 30 * 60 * 1000,
  });
  const schedule = useQuery({ queryKey: ["schedule"], queryFn: fetchSchedule });

  if (prog.isPending) {
    return (
      <div role="status" className="stack">
        <span className="visually-hidden">Loading the season's results</span>
        <Skeleton height={260} />
        <Skeleton height={16} width="60%" />
      </div>
    );
  }
  if (prog.isError) return <QueryError what="Results" error={prog.error} onRetry={prog.refetch} />;

  const { rounds, drivers } = prog.data;
  if (rounds.length < 2) {
    return (
      <State kind="empty" title="Too early to chart">
        The title fight appears once two rounds have been run.
      </State>
    );
  }

  const top = drivers.slice(0, SHOWN);
  const maxPts = Math.max(...top.map((d) => d.total), 1);
  const yMax = Math.ceil(maxPts / 50) * 50;
  const x = (i) => PAD.left + (i / (rounds.length - 1)) * (W - PAD.left - PAD.right);
  const y = (pts) => PAD.top + (1 - pts / yMax) * (H - PAD.top - PAD.bottom);
  const ticks = [0, yMax / 2, yMax];
  const labelY = spread(top.map((d) => y(d.total)));
  // Teammates share a colour, so the second one on a team gets a dashed line.
  const seen = new Set();
  const dashed = top.map((d) => (seen.has(d.constructorId) ? true : (seen.add(d.constructorId), false)));

  // Title maths. Points left = a win in every remaining race and sprint.
  const lastRound = rounds[rounds.length - 1];
  const remainingRaces = (schedule.data ?? []).filter((r) => Number(r.round) > lastRound);
  const left = remainingRaces.reduce((sum, r) => sum + RACE_WIN + (r.Sprint ? SPRINT_WIN : 0), 0);
  const leader = drivers[0];
  const alive = drivers.filter((d) => leader.total - d.total <= left);
  const verdict = !schedule.data
    ? null
    : remainingRaces.length === 0
      ? `${leader.name} is champion with ${leader.total} points.`
      : alive.length === 1
        ? `${leader.name} is champion: ${leader.total - drivers[1].total} points clear with only ${left} left to win.`
        : `${alive.length} drivers can still win it. ${left} points are left over ${remainingRaces.length} ${
            remainingRaces.length === 1 ? "round" : "rounds"
          }, and ${alive[alive.length - 1].name} is the last one in reach, ${
            leader.total - alive[alive.length - 1].total
          } behind.`;

  return (
    <div className="fight">
      {verdict && <p className="fight__verdict">{verdict}</p>}
      <svg
        className="fight__chart"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Points after each of ${rounds.length} rounds. ${top
          .map((d) => `${d.name} ${d.total}`)
          .join(", ")}.`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line className="fight__grid" x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} />
            <text className="fight__tick" x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle">
              {t}
            </text>
          </g>
        ))}
        {[0, rounds.length - 1].map((i) => (
          <text key={i} className="fight__tick" x={x(i)} y={H - 8} textAnchor={i ? "end" : "start"}>
            R{rounds[i]}
          </text>
        ))}
        {top.map((d, di) => {
          const path = d.cumulative.map((pts, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(pts).toFixed(1)}`).join("");
          const colour = teamColour(d.constructorId);
          return (
            <g key={d.id}>
              {/* One-shot draw-in when the chart first appears. */}
              <m.path
                d={path}
                fill="none"
                stroke={colour}
                strokeWidth={di === 0 ? 2.5 : 1.75}
                strokeLinejoin="round"
                strokeDasharray={dashed[di] ? "5 4" : undefined}
                initial={dashed[di] ? { opacity: 0 } : { pathLength: 0 }}
                animate={dashed[di] ? { opacity: 1 } : { pathLength: 1 }}
                transition={{ duration: 0.9, ease: EASE_OUT, delay: di * 0.05 }}
              />
              <circle cx={x(rounds.length - 1)} cy={y(d.total)} r={di === 0 ? 4 : 3} fill={colour} />
              <text className="fight__label" x={x(rounds.length - 1) + 9} y={labelY[di]} dominantBaseline="middle">
                {d.code} <tspan className="fight__pts">{d.total}</tspan>
              </text>
            </g>
          );
        })}
      </svg>
      <p className="hint">Race and sprint points, top {top.length} drivers. Dashed line: second driver of a team.</p>
    </div>
  );
}
