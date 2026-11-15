import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";
import { fetchNews } from "../api/media";
import { relativeTime } from "../utils/race";
import { QueryError, Skeleton, State } from "./State";

/** Thumbnail that falls back to a branded tile if the image is missing or broken. */
function Thumb({ src }) {
  const [broken, setBroken] = useState(!src);
  return broken ? (
    <span className="news__thumb news__thumb--empty" aria-hidden="true">
      F1
    </span>
  ) : (
    <img
      src={src}
      alt=""
      className="news__thumb"
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
    />
  );
}

const NewsBox = () => {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
    staleTime: 15 * 60 * 1000,
  });

  return (
    <section className="glass panel" aria-labelledby="news-title">
      <div className="panel__head">
        <div>
          <span className="eyebrow">Headlines</span>
          <h2 className="panel__title" id="news-title">
            Latest news
          </h2>
        </div>
      </div>

      {isPending ? (
        <div className="news" role="status">
          <span className="visually-hidden">Loading news</span>
          {Array.from({ length: 5 }, (_, i) => (
            <div className="news__item" key={i} aria-hidden="true">
              <Skeleton width={84} height={60} radius={10} />
              <span style={{ display: "grid", gap: 8 }}>
                <Skeleton />
                <Skeleton width="70%" />
              </span>
            </div>
          ))}
        </div>
      ) : isError ? (
        <QueryError what="News" error={error} onRetry={refetch} />
      ) : data.length === 0 ? (
        <State kind="empty" title="No headlines right now">
          Check back after the next session.
        </State>
      ) : (
        <div className="panel__scroll">
          <ul className="news">
            {data.slice(0, 12).map((post) => (
              <li key={post.uuid ?? post.url}>
                <a href={post.url} target="_blank" rel="noopener noreferrer" className="news__item">
                  <Thumb src={post.thread?.main_image} />
                  <span className="news__text">
                    <span className="news__title">{post.title}</span>
                    <span className="news__meta">
                      {post.published && relativeTime(new Date(post.published))}
                      <FaArrowUpRightFromSquare aria-hidden="true" />
                      <span className="visually-hidden">(opens in a new tab)</span>
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default NewsBox;
