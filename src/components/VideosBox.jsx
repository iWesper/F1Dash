import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaPlay } from "react-icons/fa6";
import he from "he";
import { fetchVideos } from "../api/media";
import { relativeTime } from "../utils/race";
import { QueryError, Skeleton, State } from "./State";

/** Hides a broken thumbnail so the frame shows the placeholder background. */
function Thumb({ src }) {
  const [broken, setBroken] = useState(false);
  return broken ? null : (
    <img src={src} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} />
  );
}

const VideosBox = () => {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["videos"],
    queryFn: fetchVideos,
    staleTime: 30 * 60 * 1000,
  });

  return (
    <section className="glass panel" aria-labelledby="videos-title">
      <div className="panel__head">
        <div>
          <span className="eyebrow">From the paddock</span>
          <h2 className="panel__title" id="videos-title">
            Latest videos
          </h2>
        </div>
        <a
          className="btn btn--ghost btn--sm"
          href="https://www.youtube.com/@Formula1/videos"
          target="_blank"
          rel="noopener noreferrer"
        >
          All videos<span className="visually-hidden"> on YouTube (opens in a new tab)</span>
        </a>
      </div>

      {isPending ? (
        <div className="videos" role="status">
          <span className="visually-hidden">Loading videos</span>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} aria-hidden="true">
              <Skeleton height="auto" radius={18} style={{ aspectRatio: "16 / 9" }} />
              <Skeleton width="85%" style={{ marginTop: 12 }} />
            </div>
          ))}
        </div>
      ) : isError ? (
        <QueryError what="Videos" error={error} onRetry={refetch} />
      ) : data.length === 0 ? (
        <State kind="empty" title="No new videos">
          Nothing's been uploaded recently.
        </State>
      ) : (
        <ul className="videos">
          {data.map((video) => (
            <li key={video.id}>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={`https://www.youtube.com/watch?v=${video.id}`}
                className="video"
              >
                <span className="video__thumb">
                  <Thumb src={video.thumb} />
                  <span className="video__play" aria-hidden="true">
                    <FaPlay />
                  </span>
                </span>
                <span className="video__title">{he.decode(video.title)}</span>
                <span className="video__meta">
                  {relativeTime(new Date(video.publishedAt))}
                  <span className="visually-hidden"> · opens YouTube in a new tab</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default VideosBox;
