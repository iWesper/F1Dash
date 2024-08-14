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
          `https://newsapi.org/v2/everything?q=F1&sortBy=relevancy&language=en&apiKey=${apiKey}`
        );
        setNews(response.data.articles);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError(err);
      }
    };

    fetchNews();
  }, [apiKey]);

  return (
    <div className="box max-vh-60 p-4 text-start">
      <p className="text-white fs-2 mb-3 fw-bold text-start border-bottom">
        LATEST NEWS
      </p>
      {error ? (
        <p className="text-danger">Failed to load news. Please try again later.</p>
      ) : (
        <div className="news-container">
          {news.slice(0, 10).map((article, index) => (
            <div key={index} className="news-item max-vh-60v2 mt-4">
              <a href={article.url} className="text-white py-2 border-bottom text-center">
                <img
                  src={article.urlToImage}
                  alt={article.title}
                  className="img-fluid h-50"
                />
              </a>
              <p className="text-white">{article.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsBox;