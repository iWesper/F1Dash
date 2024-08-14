import React, { useState, useEffect } from "react";
import axios from "axios";

const VideosBox = () => {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);

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
              key: "AIzaSyCWZIm1CTw1hvMUVpdd8qUkIOYiME7p3Jc",
            },
          }
        );

        // Para remover os vídeos shorts dos resultados, verificar se o título tem emojis ou se tem a hashtag #shorts
        const filterNoShortsVideos = response.data.items.filter((video) => {
          const title = video.snippet.title;
          const hasEmoji = title.match(/[\p{Extended_Pictographic}]/u);
          const hasShortsHashtag = title.toLowerCase().includes("#shorts");

          return !hasEmoji && !hasShortsHashtag;
        });

        setVideos(filterNoShortsVideos.slice(0, 5));
      } catch (err) {
        setError("Failed to load videos. Please try again later.");
      }
    };

    fetchVideos();
  }, []);

  return (
    <div className="box p-4">
      <p className="text-white fs-2 mb-2 fw-bold text-start border-bottom">
        LATEST VIDEOS
      </p>
      <div className="video-container p-4">
        {error ? (
          <p>{error}</p>
        ) : (
          videos.map((video) => (
            <div
              key={video.id.videoId}
              className="border border-secondary border-top-0 border-bottom-0 border-start-0 px-2"
            >
              <a
                href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-0"
              >
                <div className="video-item">
                  <img
                    src={video.snippet.thumbnails.default.url}
                    alt={video.snippet.title}
                    className="img-fluid"
                  />
                </div>
                <p className="video-title pt-2">{video.snippet.title}</p>
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VideosBox;
