# F1 Dash

A comprehensive dashboard for Formula 1 enthusiasts, providing current information on races, driver standings, news, and videos.

Made by me, for a university class on React & API usage.

## Live Demo

You can view the live application at [f1dash.vercel.app](https://f1dash.vercel.app).

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [APIs Used](#apis-used)
- [Installation](#installation)
- [Usage](#usage)

## Features

- Display upcoming race information, including date, time, and circuit layout.
- Show the complete driver standings for the current Formula 1 season.
- Integrate the latest news related to Formula 1.
- Present recent videos from the official Formula 1 YouTube channel.
- User authentication to manage favorite drivers.
- Interactive map of F1 circuits using geoJSON.

## Technologies Used

- **Frontend:** React, Axios
- **Styling:** Reactstrap, Bootstrap
- **Mapping:** Leaflet, geoJSON
- **Backend:** Firebase (for user authentication)

## APIs Used

- **Ergast F1 API:** Access historical data related to Formula 1.
- **WorldWeatherOnline:** Fetch weather data for race locations.
- **News API:** Retrieve the latest news articles about Formula 1.
- **YouTube Data API:** Display recent videos from the official Formula 1 channel.
- **Wikipedia API:** Display driver's photos in the favorites page.

## Installation

To run this project locally, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/f1-dash.git
   ```
2. Navigate to the project directory:
   ```bash
   cd f1-dash
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory and add your API keys:
   ```plaintext
   REACT_APP_WEATHER_API_KEY=your_weather_api_key
   REACT_APP_NEWS_API_KEY=your_news_api_key
   REACT_APP_YOUTUBE_API_KEY=your_youtube_api_key
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   ```
5. Start the development server:
   ```bash
   npm start
   ```

## Usage

Once the application is running, you can:

- View the upcoming race details on the main dashboard.
- Check the driver standings and favorite your preferred drivers.
- Read the latest news articles and watch recent videos related to Formula 1.

## Disclaimer
This project is my first take at using APIs and React in a personal project. The code is horrendous.
Thanks for reading.
