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

- Display upcoming race information: local-time countdown, weekend session schedule, circuit layout, race-day forecast and past winners.
- Show the driver and constructor standings for the current Formula 1 season.
- Full season calendar with "add to calendar" (.ics) for every session.
- Integrate the latest news related to Formula 1.
- Present recent videos from the official Formula 1 YouTube channel.
- User authentication to manage favorite drivers.
- Circuit layouts drawn as SVG from geoJSON.

## Technologies Used

- **Build tool:** Vite
- **Frontend:** React, React Router, TanStack Query
- **Styling:** Hand-written CSS (no framework)
- **Mapping:** geoJSON rendered as SVG
- **Backend:** Firebase (authentication + Firestore for favorites)

## APIs Used

- **Jolpica F1 API:** Drop-in successor to the (now shut down) Ergast API for current standings, race calendar, and historical results.
- **WorldWeatherOnline:** Fetch weather data for race locations.
- **News API:** Retrieve the latest news articles about Formula 1.
- **YouTube Data API:** Display recent videos from the official Formula 1 channel.
- **Wikipedia API:** Driver photos on profile and favorites pages.

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
   > The `REACT_APP_` prefix is kept for backwards compatibility; Vite is configured to read it.
   > Every key is optional: a panel whose key is missing shows a "not configured" state, and without the Firebase key accounts are disabled while the rest of the app works.
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Build for production:
   ```bash
   npm run build      # outputs to dist/
   npm run preview    # preview the production build locally
   ```

## Usage

Once the application is running, you can:

- View the upcoming race details on the main dashboard.
- Check the driver standings and favorite your preferred drivers.
- Read the latest news articles and watch recent videos related to Formula 1.

## Disclaimer
This project is my first take at using APIs and React in a personal project. The code is horrendous.
Thanks for reading.
