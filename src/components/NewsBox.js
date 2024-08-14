import React, { useState, useEffect } from "react";
import axios from "axios";

const NewsBox = () => {
  const [news, setNews] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      const response = await axios.get(
        "https://newsapi.org/v2/everything?q=F1&sortBy=relevancy&language=en&apiKey=59937ef7a57d4640888089fe80a46311"
      );
      setNews(response.data.articles);
    };

    fetchNews();
  }, []);

  return (
    <div className="box max-vh-60 p-4 text-start">
      <p className="text-white fs-2 mb-3 fw-bold text-start border-bottom">
        LATEST NEWS
      </p>
      <div className="news-container">
        {news.slice(0, 10).map((article, index) => (
          <div key={index} className="news-item max-vh-60v2 mt-4">
            <a href={article.url} className="text-white py-2 border-bottom text-center">
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
        ))}
      </div>
    </div>
  );
};

export default NewsBox;
