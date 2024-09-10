import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Row, Col } from 'reactstrap';

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
              key: process.env.REACT_APP_YOUTUBE_API_KEY,
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

        setVideos(filterNoShortsVideos.slice(0, 6));
      } catch (err) {
        setError("Failed to load videos. Please try again later.");
      }
    };

    fetchVideos();
  }, []);

  return (
    <Container fluid className="box p-4 mb-4">
      <Row className="align-items-start">
        <Col>
          <p className="text-white fs-2 mb-2 fw-bold text-start border-bottom">
            LATEST VIDEOS
          </p>
        </Col>
      </Row>
      <Row>
        {error ? (
          <Col>
            <p>{error}</p>
          </Col>
        ) : (
          videos.map((video) => (
            <Col xs="12" sm="6" md="4" lg="2" key={video.id.videoId} className="mb-4">
              <div className="px-2">
                <a
                  target="_blank"
                  href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
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
            </Col>
          ))
        )}
      </Row>
    </Container>
  );
};

export default VideosBox;