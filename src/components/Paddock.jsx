import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import he from "he";
import { FaPlay, FaArrowUpRightFromSquare } from "react-icons/fa6";
import { fetchNews, fetchVideos } from "../api/media";
import { relativeTime } from "../utils/race";
import { QueryError, Skeleton, State } from "./State";

/** Image that swaps to a neutral tile when the source is missing or broken. */
function Thumb({ src, className }) {
  const [broken, setBroken] = useState(!src);
  return broken ? (
    <span className={`${className} thumb--empty`} aria-hidden="true" />
  ) : (
    <img src={src} alt="" className={className} loading="lazy" decoding="async" onError={() => setBroken(true)} />
  );
}

function News() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
    staleTime: 15 * 60 * 1000,
  });
  if (isPending)
    return (
      <div className="paddock__grid" role="status">
        <span className="visually-hidden">Loading news</span>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} height={72} />
        ))}
      </div>
    );
  if (isError) return <QueryError what="News" error={error} onRetry={refetch} compact />;
  if (data.length === 0)
    return (
      <State kind="empty" title="No headlines right now" compact>
        Check back after the next session.
      </State>
    );
  return (
    <ul className="paddock__grid">
      {data.slice(0, 8).map((post) => (
        <li key={post.uuid ?? post.url}>
          <a href={post.url} target="_blank" rel="noopener noreferrer" className="news">
            <Thumb src={post.thread?.main_image} className="news__thumb" />
            <span className="news__text">
              <span className="news__title">{post.title}</span>
              <span className="news__meta mono">
                {post.published && relativeTime(new Date(post.published))}
                <FaArrowUpRightFromSquare aria-hidden="true" />
                <span className="visually-hidden">(opens in a new tab)</span>
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function Videos() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["videos"],
    queryFn: fetchVideos,
    staleTime: 30 * 60 * 1000,
  });
  if (isPending)
    return (
      <div className="videos" role="status">
        <span className="visually-hidden">Loading videos</span>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} height="auto" style={{ aspectRatio: "16 / 9" }} />
        ))}
      </div>
    );
  if (isError) return <QueryError what="Videos" error={error} onRetry={refetch} compact />;
  if (data.length === 0)
    return (
      <State kind="empty" title="No new videos" compact>
        Nothing's been uploaded recently.
      </State>
    );
  return (
    <ul className="videos">
      {data.map((video) => (
        <li key={video.id}>
          <a
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="video"
          >
            <span className="video__thumb">
              <Thumb src={video.thumb} className="video__img" />
              <span className="video__play" aria-hidden="true">
                <FaPlay />
              </span>
            </span>
            <span className="video__title">{he.decode(video.title)}</span>
            <span className="news__meta mono">
              {relativeTime(new Date(video.publishedAt))}
              <span className="visually-hidden"> · opens YouTube in a new tab</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * News and videos in one panel. They're the least reliable feeds, so they
 * sit last, and videos only load when that tab is opened (YouTube quota).
 */
export default function Paddock() {
  const [tab, setTab] = useState("news");
  return (
    <section className="panel paddock" aria-labelledby="paddock-title">
      <header className="panel__head">
        <h2 className="panel__title" id="paddock-title">
          Paddock
        </h2>
        <div className="seg" role="group" aria-label="Paddock feed">
          {[
            ["news", "News"],
            ["videos", "Videos"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`seg__btn ${tab === id ? "is-active is-solid" : ""}`}
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
            >
              <span className="seg__text">{label}</span>
            </button>
          ))}
        </div>
      </header>
      {tab === "news" ? <News /> : <Videos />}
    </section>
  );
}
