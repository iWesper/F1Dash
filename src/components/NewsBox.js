import React, { useState, useEffect } from "react";
import axios from "axios";

const NewsBox = () => {
  const [news, setNews] = useState([]);
  const [error, setError] = useState(null);
  const apiKey = process.env.REACT_APP_NEWS_API_KEY;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get(
          `https://api.webz.io/newsApiLite?token=${apiKey}&q=Formula%201`
        );
        setNews(response.data.posts);
      } catch (err) {
        setError("Failed to load news. This may be due to News API's policies restricting access outside localhost.");
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="box max-vh-80 p-4 mt-4 my-lg-0 text-start">
      <p className="text-white fs-2 mb-3 fw-bold text-start border-bottom">
        LATEST NEWS
      </p>
      <div className="news-container">
        {error ? (
          <div className="text-white">
            <p>{error}</p>
          </div>
        ) : (
          news.slice(0, 10).map((post, index) => (
            <div key={index} className="news-item max-vh-60v2 mt-4">
              <a href={post.url} className="text-white py-2 text-center">
                <img
                  src={post.thread.main_image}
                  alt={post.title}
                  className="img-fluid"
                />
                <div>
                  <h2 className="fw-bold fs-5 text-white py-1">
                    {post.title}
                  </h2>
                </div>
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NewsBox;