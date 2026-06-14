import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import geojsonFile from "../extra/f1-circuits.geojson";

// --- helpers ----------------------------------------------------------------
const precipLabel = (v) => {
  if (v === undefined || v === null) return "?";
  if (v === 0) return "None";
  if (v < 0.05) return "Very Low";
  if (v < 0.1) return "Low";
  if (v < 0.4) return "Medium";
  return "High";
};
const isWet = (label) => label === "Medium" || label === "High";

const NextRaceBox = () => {
  const [geojsonData, setGeojsonData] = useState(null);
  const [nextRaceAvailability, setNextRaceAvailability] = useState(true);
  const [lastWinners, setLastWinners] = useState([]);
  const [nextCircuit, setNextCircuit] = useState(null); // [circuito, data, horas]
  const [circuitLatitude, setCircuitLatitude] = useState(null);
  const [circuitLongitude, setCircuitLongitude] = useState(null);
  const [nextRaceWeatherData, setNextRaceWeatherData] = useState(null);
  const [previousRaceWeatherData, setPreviousRaceWeatherData] = useState(null);
  const [countdown, setCountdown] = useState(null); // { days, hours, minutes, seconds } | { live: true }
  const mapRef = useRef(null);

  const getWeatherData = async (
    latitude,
    longitude,
    nextRaceDate,
    previousRaceDates
  ) => {
    const apiKey = import.meta.env.REACT_APP_WEATHER_API_KEY;
    const nextRaceWeatherData = [];
    const previousRaceWeatherData = [];

    // Fetch next race weather data
    try {
      const nextRaceResponse = await axios.get(
        `https://api.worldweatheronline.com/premium/v1/weather.ashx?q=${latitude},${longitude}&date=${nextRaceDate}&format=json&key=${apiKey}`
      );

      const nextRaceDailyWeather = nextRaceResponse.data.data.weather[0];
      const nextRaceHourlyWeather = nextRaceDailyWeather.hourly;

      const avg = (arr, prop) =>
        arr.reduce((sum, data) => sum + Number(data[prop]), 0) / arr.length;

      nextRaceWeatherData.push({
        date: nextRaceDailyWeather.date,
        temperature: avg(nextRaceHourlyWeather, "tempC"),
        pressure: avg(nextRaceHourlyWeather, "pressure"),
        precipitationIntensity: avg(nextRaceHourlyWeather, "precipMM"),
        windSpeed: avg(nextRaceHourlyWeather, "windspeedKmph"),
      });

      setNextRaceWeatherData(nextRaceWeatherData);
    } catch (error) {
      console.error("Error fetching next race weather data", error);
    }

    // Fetch previous races weather data
    try {
      for (const date of previousRaceDates) {
        const previousRaceResponse = await axios.get(
          `https://api.worldweatheronline.com/premium/v1/past-weather.ashx?q=${latitude},${longitude}&date=${date}&format=json&key=${apiKey}`
        );

        const previousRaceDailyWeather =
          previousRaceResponse.data.data.weather[0];
        const previousRaceHourlyWeather = previousRaceDailyWeather.hourly;

        const avg = (arr, prop) =>
          arr.reduce((sum, data) => sum + Number(data[prop]), 0) / arr.length;

        previousRaceWeatherData.push({
          date: previousRaceDailyWeather.date,
          temperature: avg(previousRaceHourlyWeather, "tempC"),
          pressure: avg(previousRaceHourlyWeather, "pressure"),
          precipitationIntensity: avg(previousRaceHourlyWeather, "precipMM"),
          windSpeed: avg(previousRaceHourlyWeather, "windspeedKmph"),
        });
      }

      setPreviousRaceWeatherData(previousRaceWeatherData);
    } catch (error) {
      console.error("Error fetching previous races weather data", error);
    }

    return { nextRaceWeatherData, previousRaceWeatherData };
  };

  // Carregar o ficheiro geojson uma vez, na montagem
  useEffect(() => {
    fetch(geojsonFile)
      .then((response) => response.json())
      .then((data) => setGeojsonData(data));
  }, []);

  // Contagem decrescente até à corrida (atualiza a cada segundo)
  useEffect(() => {
    if (nextCircuit && nextCircuit[1]) {
      const iso = nextCircuit[2]
        ? `${nextCircuit[1]}T${nextCircuit[2]}`
        : nextCircuit[1];
      const raceDate = new Date(iso);

      const updateCountdown = () => {
        const timeDifference = raceDate - new Date();
        if (timeDifference > 0) {
          setCountdown({
            days: Math.floor(timeDifference / (1000 * 60 * 60 * 24)),
            hours: Math.floor(
              (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            ),
            minutes: Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((timeDifference % (1000 * 60)) / 1000),
          });
        } else {
          setCountdown({ live: true });
        }
      };

      updateCountdown();
      const timer = setInterval(updateCountdown, 1000);
      return () => clearInterval(timer);
    }
  }, [nextCircuit]);

  // Obter dados meteorológicos quando há próxima corrida + coordenadas
  useEffect(() => {
    if (nextCircuit && circuitLatitude && circuitLongitude) {
      const toYmd = (d) => {
        const date = new Date(d);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const nextRaceDate = toYmd(nextCircuit[1]);
      const lastFiveRaceDates = lastWinners.map((winner) => toYmd(winner.date));

      getWeatherData(
        circuitLatitude,
        circuitLongitude,
        nextRaceDate,
        lastFiveRaceDates
      )
        .then(({ nextRaceWeatherData, previousRaceWeatherData }) => {
          if (
            nextRaceWeatherData.length > 0 ||
            previousRaceWeatherData.length > 0
          ) {
            setNextRaceWeatherData(nextRaceWeatherData[0]);
            setPreviousRaceWeatherData(previousRaceWeatherData);
          } else {
            setNextRaceWeatherData(null);
            setPreviousRaceWeatherData(null);
          }
        })
        .catch((error) => {
          console.error(error);
          setNextRaceWeatherData(null);
          setPreviousRaceWeatherData(null);
        });
    }
  }, [nextCircuit, circuitLatitude, circuitLongitude]);

  // Construir o mapa e ir buscar a próxima corrida quando o geojson carrega
  useEffect(() => {
    // Jolpica é o sucessor compatível da API Ergast (desativada no início de 2025).
    const ergastBase = "https://api.jolpi.ca/ergast/f1";
    if (geojsonData) {
      if (mapRef.current) {
        mapRef.current.remove();
      }

      mapRef.current = L.map("map", { zoomControl: true, attributionControl: true })
        .setView([30, 10], 2);

      // Tiles escuros (CARTO) para combinar com o tema; suportam CORS diretamente.
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 19,
          subdomains: "abcd",
          attribution: "&copy; OpenStreetMap &copy; CARTO",
        }
      ).addTo(mapRef.current);

      const drawCircuit = (circuit) => {
        const layer = L.geoJSON(circuit, {
          style: { color: "#ff2b39", weight: 3, opacity: 0.95 },
        }).addTo(mapRef.current);
        mapRef.current.fitBounds(layer.getBounds(), { padding: [24, 24] });
      };

      const handleRace = (race, isNext) => {
        const circuitName = race.Circuit.circuitName;
        const circuitID = race.Circuit.circuitId;
        const circuit = geojsonData.features.find(
          (feature) => feature.properties.Name === circuitName
        );
        setNextCircuit([circuitName, race.date, race.time]);
        setCircuitLatitude(race.Circuit.Location.lat);
        setCircuitLongitude(race.Circuit.Location.long);

        if (circuit) {
          drawCircuit(circuit);
          axios
            .get(`${ergastBase}/circuits/${circuitID}/results/1.json`)
            .then((response) => {
              const races = response.data.MRData.RaceTable.Races;
              const winners = races.slice(-5).map((r) => ({
                ...r.Results[0],
                season: r.season,
                date: r.date,
              }));
              setLastWinners(winners);
            });
        }
      };

      axios.get(`${ergastBase}/current/next.json`).then((response) => {
        const races = response.data.MRData.RaceTable.Races;
        if (races.length > 0) {
          handleRace(races[0], true);
        } else {
          // Off season — mostrar a última corrida
          setNextRaceAvailability(false);
          axios.get(`${ergastBase}/current/last.json`).then((res) => {
            handleRace(res.data.MRData.RaceTable.Races[0], false);
          });
        }
      });
    }
  }, [geojsonData, circuitLatitude, circuitLongitude]);

  const year = nextCircuit ? new Date(nextCircuit[1]).getFullYear() : "";

  // Linhas combinadas da tabela meteorológica (próxima + anteriores)
  const weatherRows = [];
  if (nextRaceWeatherData) {
    weatherRows.push({
      key: "next",
      label: "Next race",
      winner: "—",
      ...nextRaceWeatherData,
    });
  }
  if (previousRaceWeatherData) {
    previousRaceWeatherData
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach((data) => {
        const y = new Date(data.date).getFullYear();
        const winner = lastWinners.find((w) => w.season === String(y));
        weatherRows.push({
          key: data.date,
          label: String(y),
          winner: winner
            ? `${winner.Driver.givenName.charAt(0)}. ${winner.Driver.familyName}`
            : "N/A",
          ...data,
        });
      });
  }

  return (
    <section className="glass panel">
      <div className="panel__head">
        <div>
          <span className="eyebrow">
            {nextRaceAvailability ? "Next race" : "Off season · last race"}
          </span>
          <h1 className="nextrace__title">
            {nextCircuit ? (
              <>
                {year} <em>{nextCircuit[0]}</em> Grand Prix
              </>
            ) : (
              "Loading race…"
            )}
          </h1>
        </div>
      </div>

      <div className="nextrace__grid">
        {/* Left: key stats + countdown */}
        <div className="stat-stack">
          <div className="stat">
            <span className="stat__label">📅 Date</span>
            <span className="stat__value">
              {nextCircuit ? nextCircuit[1] : "—"}
            </span>
          </div>
          <div className="stat">
            <span className="stat__label">🕙 Time</span>
            <span className="stat__value">
              {nextCircuit && nextCircuit[2]
                ? nextCircuit[2].replace("Z", " UTC")
                : "TBA"}
            </span>
          </div>

          <span className="stat__label">⏳ Countdown</span>
          {countdown && countdown.live ? (
            <div className="countdown--live">🏁 Lights out!</div>
          ) : countdown ? (
            <div className="countdown">
              {[
                ["days", "Days"],
                ["hours", "Hrs"],
                ["minutes", "Min"],
                ["seconds", "Sec"],
              ].map(([k, label]) => (
                <div className="countdown__seg" key={k}>
                  <div className="countdown__num">
                    {String(countdown[k]).padStart(2, "0")}
                  </div>
                  <span className="countdown__unit">{label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-dim">Calculating…</div>
          )}
        </div>

        {/* Middle: circuit map (always rendered so Leaflet can mount) */}
        <div className="nextrace__map-col">
          <div id="map" className="map" />
        </div>

        {/* Right: weather */}
        <div className="nextrace__weather-col">
          <span className="eyebrow" style={{ marginBottom: 12 }}>
            Weather
          </span>
          {weatherRows.length > 0 ? (
            <table className="dtable">
              <thead>
                <tr>
                  <th>When</th>
                  <th>🏆 Winner</th>
                  <th>🌡️ Temp</th>
                  <th>💨 Wind</th>
                  <th>💧 Rain</th>
                </tr>
              </thead>
              <tbody>
                {weatherRows.map((row) => {
                  const label = precipLabel(row.precipitationIntensity);
                  return (
                    <tr key={row.key}>
                      <td className="strong">{row.label}</td>
                      <td>{row.winner}</td>
                      <td className="num">
                        {row.temperature === undefined
                          ? "?"
                          : `${row.temperature.toFixed(1)}°C`}
                      </td>
                      <td className="num">
                        {row.windSpeed === undefined
                          ? "?"
                          : `${row.windSpeed.toFixed(0)} km/h`}
                      </td>
                      <td>
                        <span
                          className={`pill ${
                            label === "None" ? "pill--none" : ""
                          } ${isWet(label) ? "pill--wet" : ""}`}
                        >
                          {label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="state">
              <p>
                Weather forecast isn't available right now (needs the weather API
                key).
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NextRaceBox;
