import React, { useState, useEffect } from "react";
import axios from "axios";
import he from "he";

const VideosBox = () => {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get(
          "https://www.googleapis.com/youtube/v3/search",
          {
            params: {
              part: "snippet",
              channelId: "UCB_qr75-ydFVKSF9Dmo6izg",
              maxResults: 10,
              order: "date",
              type: "video",
              videoType: "any",
              key: import.meta.env.REACT_APP_YOUTUBE_API_KEY,
            },
          }
        );

        // Remover shorts: filtrar títulos com emojis ou a hashtag #shorts
        const filterNoShortsVideos = response.data.items.filter((video) => {
          const title = video.snippet.title;
          const hasEmoji = title.match(/[\p{Extended_Pictographic}]/u);
          const hasShortsHashtag = title.toLowerCase().includes("#shorts");
          return !hasEmoji && !hasShortsHashtag;
        });

        setVideos(filterNoShortsVideos.slice(0, 6));
      } catch (err) {
        setError("Couldn't load videos. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  return (
    <section className="glass panel">
      <div className="panel__head">
        <div>
          <span className="eyebrow">From the paddock</span>
          <h2 className="panel__title">Latest Videos</h2>
        </div>
      </div>

      {loading ? (
        <div className="state">
          <div className="spinner" />
          <p>Loading videos…</p>
        </div>
      ) : error ? (
        <div className="state">
          <h3>Videos unavailable</h3>
          <p>{error}</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="state">
          <p>No recent videos found.</p>
        </div>
      ) : (
        <div className="videos">
          {videos.map((video) => (
            <a
              key={video.id.videoId}
              target="_blank"
              rel="noopener noreferrer"
              href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
              className="video"
            >
              <div className="video__thumb">
                <img
                  src={video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default.url}
                  alt=""
                  loading="lazy"
                />
              </div>
              <p className="video__title">{he.decode(video.snippet.title)}</p>
            </a>
          ))}
        </div>
      )}
    </section>
  );
};

export default VideosBox;
