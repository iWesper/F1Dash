import React, { useState, useEffect } from "react";
import axios from "axios";

const NewsBox = () => {
  const [news, setNews] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiKey = import.meta.env.REACT_APP_NEWS_API_KEY;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get(
          `https://api.webz.io/newsApiLite?token=${apiKey}&q=site%3Aformula1.com`
        );
        setNews(response.data.posts || []);
      } catch (err) {
        setError(
          "Couldn't load news — the provider restricts access outside localhost on the free plan."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [apiKey]);

  return (
    <section className="glass panel">
      <div className="panel__head">
        <div>
          <span className="eyebrow">Headlines</span>
          <h2 className="panel__title">Latest News</h2>
        </div>
      </div>

      {loading ? (
        <div className="state">
          <div className="spinner" />
          <p>Loading news…</p>
        </div>
      ) : error ? (
        <div className="state">
          <h3>News unavailable</h3>
          <p>{error}</p>
        </div>
      ) : news.length === 0 ? (
        <div className="state">
          <p>No recent articles found.</p>
        </div>
      ) : (
        <div className="panel__scroll">
          <div className="news">
            {news.slice(0, 10).map((post, index) => (
              <a
                key={index}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="news__item"
              >
                <img
                  src={post.thread?.main_image}
                  alt=""
                  className="news__thumb"
                  loading="lazy"
                />
                <h3 className="news__title">{post.title}</h3>
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default NewsBox;
