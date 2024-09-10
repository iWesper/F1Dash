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
        setError("Failed to load news. This may be due to News API's policies restricting access outside localhost.");
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="box max-vh-60 p-4 mt-4 my-lg-0 text-start">
      <p className="text-white fs-2 mb-3 fw-bold text-start border-bottom">
        LATEST NEWS
      </p>
      <div className="news-container">
        {error ? (
          <div className="text-white">
            <p>{error}</p>
          </div>
        ) : (
          news.slice(0, 10).map((article, index) => (
            <div key={index} className="news-item max-vh-60v2 mt-4">
              <a href={article.url} className="text-white py-2 text-center">
                <img
                  src={article.urlToImage}
                  alt={article.title}
                  className="img-fluid h-50"
                />
                <div>
                  <h2 className="fw-bold fs-5 text-white py-1">
                    {article.title}
                  </h2>
                  <p>{article.description}</p>
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