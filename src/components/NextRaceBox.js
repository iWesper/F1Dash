import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import geojsonFile from "../extra/f1-circuits.geojson";

const NextRaceBox = () => {
  const [geojsonData, setGeojsonData] = useState(null);
  const [nextRaceAvailability, setNextRaceAvailability] = useState(true);
  const [lastWinners, setLastWinners] = useState([]);
  const [nextRace, setNextRace] = useState(null); // [circuito, data, horas]
  const [circuitLatitude, setCircuitLatitude] = useState(null);
  const [circuitLongitude, setCircuitLongitude] = useState(null);
  const [nextRaceWeatherData, setNextRaceWeatherData] = useState(null);
  const [previousRaceWeatherData, setPreviousRaceWeatherData] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const mapRef = useRef(null);

  const getWeatherData = async (latitude, longitude, dates) => {
    const apiKey = process.env.REACT_APP_WEATHER_API_KEY;
    const weatherData = [];

    for (const date of dates) {
      // Formatar a data para o formato YYYY-MM-DD
      const formattedDate = date;

      try {
        // Obter os dados meteorológicos do dia
        const response = await axios.get(
          `https://api.worldweatheronline.com/premium/v1/weather.ashx?q=${latitude},${longitude}&date=${formattedDate}&format=json&key=${apiKey}`
        );

        // Obter os dados meteorológicos do dia
        const dailyWeather = response.data.data.weather[0];
        const hourlyWeather = dailyWeather.hourly;

        // Calcular a média da temperatura, pressão, precipitação e velocidade do vento
        const avgTemperature =
          hourlyWeather.reduce((sum, data) => sum + Number(data.tempC), 0) /
          hourlyWeather.length;
        const avgPressure =
          hourlyWeather.reduce((sum, data) => sum + Number(data.pressure), 0) /
          hourlyWeather.length;
        const avgPrecipitation =
          hourlyWeather.reduce((sum, data) => sum + Number(data.precipMM), 0) /
          hourlyWeather.length;
        const avgWindSpeed =
          hourlyWeather.reduce(
            (sum, data) => sum + Number(data.windspeedKmph),
            0
          ) / hourlyWeather.length;

        weatherData.push({
          date: dailyWeather.date,
          temperature: avgTemperature,
          pressure: avgPressure,
          precipitationIntensity: avgPrecipitation,
          windSpeed: avgWindSpeed,
        });
      } catch (error) {
        console.error("Error fetching weather data", error);
      }
    }

    return weatherData;
  };

  // Corre apenas uma vez, quando o componente é montado, para carregar o ficheiro geojson
  useEffect(() => {
    fetch(geojsonFile)
      .then((response) => response.json())
      .then((data) => setGeojsonData(data));
  }, []);

  useEffect(() => {
    if (nextRace && nextRace[1]) {
      const raceDate = new Date(nextRace[1]);
      
      const updateCountdown = () => {
        const now = new Date();
        const timeDifference = raceDate - now;

        if (timeDifference > 0) {
          const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

          setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        } else {
          setCountdown('Race has started!');
        }
      };
      const timer = setInterval(updateCountdown, 1000);

      return () => clearInterval(timer);
    }
   }, [nextRace]);

  // Corre quando o lastWinners, circuitLatitude ou circuitLongitude é alterado
  useEffect(() => {
    // Se houver vencedores e latitude e longitude do circuito
    if (lastWinners.length > 0 && circuitLatitude && circuitLongitude) {
      // Obter as datas das últimas 5 corridas
      const lastFiveRaceDates = lastWinners.map((winner) => {
        // Transformar a data em ano
        const date = new Date(winner.date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0"); // +1 porque os meses começam em 0
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      });

      // // Obter os dados meteorológicos das últimas 5 corridas
      // getWeatherData(circuitLatitude, circuitLongitude, lastFiveRaceDates)
      //   .then((weatherData) => {
      //     setWeatherData(weatherData);
      //   })
      //   .catch((error) => {
      //     console.error(error);
      //   });
    }
  }, [lastWinners]);

  // Corre quando o nextRace, circuitLatitude ou circuitLongitude é alterado
  useEffect(() => {
    // Se houver uma próxima corrida e latitude e longitude do circuito
    if (nextRace && circuitLatitude && circuitLongitude) {
      // Transformar a data em ano
      const date = new Date(nextRace[1]);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // +1 porque os meses começam em 0
      const day = String(date.getDate()).padStart(2, "0");
      const nextRaceDate = `${year}-${month}-${day}`;

      // Obter os dados meteorológicos da próxima corrida
      getWeatherData(circuitLatitude, circuitLongitude, [nextRaceDate])
        .then((weatherData) => {
          // Se houver dados meteorológicos
          if (weatherData.length > 0) {
            setNextRaceWeatherData(weatherData[0]);
          } else {
            setNextRaceWeatherData(null);
          }
        })
        .catch((error) => {
          console.error(error);
          setNextRaceWeatherData(null);
        });
    }
  }, [nextRace]);

  // Corre quando o geojson é carregado e sempre que o geojsonData é alterado
  useEffect(() => {
    // Se o geojson foi carregado
    if (geojsonData) {
      // Se o mapa já existir, remover
      if (mapRef.current) {
        mapRef.current.remove();
      }

      // Criar o mapa
      mapRef.current = L.map("map").setView([51.505, -0.09], 13);

      // Adicionar a camada do OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Obter a próxima corrida
      axios
        .get("https://ergast.com/api/f1/current/next.json")
        .then((response) => {
          // Se houver uma próxima corrida já definida
          if (response.data.MRData.RaceTable.Races.length > 0) {
            // Obter o circuito da próxima corrida
            const circuitName =
              response.data.MRData.RaceTable.Races[0].Circuit.circuitName;
            // Obter o ID do circuito
            const circuitID =
              response.data.MRData.RaceTable.Races[0].Circuit.circuitId;
            // Obter o circuito do geojson
            const circuit = geojsonData.features.find(
              (feature) => feature.properties.Name === circuitName
            );
            // Obter a data e hora da próxima corrida
            const raceDate = response.data.MRData.RaceTable.Races[0].date;
            const raceTime = response.data.MRData.RaceTable.Races[0].time;

            // Guardar a próxima corrida no estado
            setNextRace([circuitName, raceDate, raceTime]);

            // Obter a latitude e longitude do circuito
            const circuitLatitude =
              response.data.MRData.RaceTable.Races[0].Circuit.Location.lat;
            const circuitLongitude =
              response.data.MRData.RaceTable.Races[0].Circuit.Location.long;

            // Guardar a latitude e longitude do circuito no estado
            setCircuitLatitude(circuitLatitude);
            setCircuitLongitude(circuitLongitude);

            // Se o circuito existir
            if (circuit) {
              // Adicionar o circuito ao mapa e fazer zoom
              L.geoJSON(circuit).addTo(mapRef.current);
              mapRef.current.fitBounds(L.geoJSON(circuit).getBounds());

              // Obter os vencedores de todas as corridas no circuito
              axios
                .get(
                  `https://ergast.com/api/f1/circuits/${circuitID}/results/1.json`
                )
                .then((response) => {
                  // Guardar as corridas no estado
                  const races = response.data.MRData.RaceTable.Races;

                  // Filtrar os vencedores das últimas 5 corridas
                  const winners = races.slice(-5).map((race) => ({
                    ...race.Results[0],
                    season: race.season,
                    date: race.date,
                  }));

                  // Guardar os vencedores no estado
                  setLastWinners(winners);
                });
            }
          } else {
            // Se não houver uma próxima corrida definida (off season)
            setNextRaceAvailability(false);
            // Obter o circuito da última corrida
            axios
              .get("https://ergast.com/api/f1/current/last.json")
              .then((response) => {
                const circuitName =
                  response.data.MRData.RaceTable.Races[0].Circuit.circuitName;
                const circuitID =
                  response.data.MRData.RaceTable.Races[0].Circuit.circuitId;
                const circuit = geojsonData.features.find(
                  (feature) => feature.properties.Name === circuitName
                );
                // Obter a data e hora da próxima corrida
                const raceDate = response.data.MRData.RaceTable.Races[0].date;
                const raceTime = response.data.MRData.RaceTable.Races[0].time;

                // Guardar a próxima corrida no estado
                setNextRace([circuitName, raceDate, raceTime]);

                // Obter a latitude e longitude do circuito
                const circuitLatitude =
                  response.data.MRData.RaceTable.Races[0].Circuit.Location.lat;
                const circuitLongitude =
                  response.data.MRData.RaceTable.Races[0].Circuit.Location.long;

                // Guardar a latitude e longitude do circuito no estado
                setCircuitLatitude(circuitLatitude);
                setCircuitLongitude(circuitLongitude);

                // Se o circuito existir
                if (circuit) {
                  // Adicionar o circuito ao mapa e fazer zoom
                  L.geoJSON(circuit).addTo(mapRef.current);
                  mapRef.current.fitBounds(L.geoJSON(circuit).getBounds());

                  // Obter os vencedores de todas as corridas no circuito
                  // Ao implementar a API de meteorologia, esta call da API foi aproveitada para guardar as datas das corridas anteriores no mesmo circuito
                  axios
                    .get(
                      `https://ergast.com/api/f1/circuits/${circuitID}/results/1.json`
                    )
                    .then((response) => {
                      // Guardar as corridas no estado
                      const races = response.data.MRData.RaceTable.Races;

                      // Filtrar os vencedores das últimas 5 corridas
                      const winners = races.slice(-5).map((race) => ({
                        ...race.Results[0],
                        season: race.season,
                        date: race.date,
                      }));

                      // Guardar os vencedores no estado
                      setLastWinners(winners);
                      console.log(lastWinners);
                    });
                }
              });
          }
        });
    }
  }, [geojsonData, circuitLatitude, circuitLongitude]);

  return (
    <div className="box max-vh-60v2 p-4">
      <div className="nextrace-container w-100">
        {nextRaceAvailability ? (
          // Se houver uma próxima corrida definida
          <div className="d-flex flex-row justify-content-between border-bottom mb-3">
            <p className="d-flex text-white fs-2 fw-bold text-start">
              NEXT RACE
            </p>
            {nextRace && (
              <div className="d-flex text-white text-end fs-2">
                {new Date(nextRace[1]).getFullYear()} {nextRace[0]} Grand Prix
              </div>
            )}
          </div>
        ) : (
          // Se não houver uma próxima corrida definida (off season)
          <p className="text-white fs-2 mb-3 fw-bold text-start border-bottom">
            OFF SEASON - CHECK OUT THE LAST RACE
          </p>
        )}
        <div className="d-flex flex-row ps-0 ms-0 justify-content-between align-middle mt-2 w-100">
          {nextRace && (
            // Mostrar o nome da próxima corrida, a data e a hora
            <div className="fs-5 text-start d-flex flex-column text-white">
              <h2 className="text-white">📅 Date: {nextRace[1]} </h2>
              <h2 className="text-white">🕙 Time: {nextRace[2] ? nextRace[2] : "TBA"}</h2>
              <h2 className="text-white mt-5 text-center" style={{width: '20vw'}}>⏳ Countdown <div className="fs-2 text-center">{countdown}</div></h2>
              <h2 className="text-white mt-5">First race winner: {lastWinners.length > 0 ? `${lastWinners[0].Driver.givenName} ${lastWinners[0].Driver.familyName}` : "N/A"}</h2>
            </div>
          )}
          <div
            id="map"
            className="w-50 rounded d-flex"
            style={{ height: "20rem", minHeight: "15rem", minWidth: "20rem" }}
          ></div>
          <div className="d-flex flex-row ms-2 align-items-center">
            {nextRaceWeatherData ? (
              <div className="mb-3">
                <h2 className="mb-4 fs-4">Weather forecast for the next race</h2>
                <table>
                  <thead>
                    <tr className="fs-5">
                      <th scope="col" className="px-1">
                        <div className="d-flex flex-column align-items-center border-end border-light p-4">
                          <span style={{ fontSize: "2em" }}>🌡️</span>
                          <span>Temperature</span>
                        </div>
                      </th>
                      <th scope="col" className="px-1">
                        <div className="d-flex flex-column align-items-center border-end border-light p-4">
                          <span style={{ fontSize: "2em" }}>💨</span>
                          <span>Wind Speed</span>
                        </div>
                      </th>
                      <th scope="col" className="px-1">
                        <div className="d-flex flex-column align-items-center border-end border-light p-4">
                          <span style={{ fontSize: "2em" }}>📊</span>
                          <span>Pressure</span>
                        </div>
                      </th>
                      <th scope="col" className="px-1">
                        <div className="d-flex flex-column align-items-center p-4">
                          <span style={{ fontSize: "2em" }}>💧</span>
                          <span>Precipitation</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="fs-4">
                      <td className="text-white px-1">
                        {nextRaceWeatherData.temperature.toFixed(1)} ºC
                      </td>
                      <td className="text-white px-1">
                        {nextRaceWeatherData.windSpeed.toFixed(1)} m/s
                      </td>
                      <td className="text-white px-1">
                        {(nextRaceWeatherData.pressure / 100).toFixed(2)} hPa
                      </td>
                      <td className="text-white px-1">
                        {nextRaceWeatherData.precipitationIntensity === 0
                          ? "None"
                          : nextRaceWeatherData.precipitationIntensity < 0.05
                          ? "Very Low"
                          : nextRaceWeatherData.precipitationIntensity < 0.1
                          ? "Low"
                          : nextRaceWeatherData.precipitationIntensity < 0.4
                          ? "Medium"
                          : "High"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mb-3">
                <p className="text-danger">
                  Sorry! Next race's weather forecast isn't available. Take a
                  look at the weather from the last 5 races:
                </p>
                <table>
                  <thead>
                    <tr className="fs-5">
                      <th scope="col" className="px-1">
                        Year
                      </th>
                      <th scope="col" className="px-1">
                        🏆 Winner
                      </th>
                      <th scope="col" className="px-1">
                        🌡️ Temperature
                      </th>
                      <th scope="col" className="px-1">
                        📊 Pressure
                      </th>
                      <th scope="col" className="px-1">
                        💧 Precipitation Intensity
                      </th>
                      <th scope="col" className="px-1">
                        💨 Wind Speed
                      </th>
                    </tr>
                  </thead>
                  {nextRaceWeatherData ? (
                    <tbody>
                      {nextRaceWeatherData &&
                        nextRaceWeatherData.map((data, index) => {
                          // Transformar a data em ano
                          const year = new Date(data.date).getFullYear();
                          // Obter o vencedor da corrida desse ano
                          const winner = lastWinners.find(
                            (winner) => winner.season === String(year)
                          );
                          // Obter o nome do vencedor da corrida desse ano
                          const winnerName = winner
                            ? `${winner.Driver.givenName} ${winner.Driver.familyName}`
                            : "N/A";

                          // Formatar os dados para serem apresentados (obrigado AI)
                          // Formatar a temperatura para celsius
                          const temperature = `${data.temperature.toFixed(
                            1
                          )} ºC`;
                          // Formatar a velocidade do vento para m/s
                          const windSpeed = `${data.windSpeed.toFixed(1)} m/s`;
                          // Formatar a intensidade da precipitação para Low, Medium ou High
                          const precipitationIntensity =
                            data.precipitationIntensity === 0
                              ? "None"
                              : data.precipitationIntensity < 0.05
                              ? "Very Low"
                              : data.precipitationIntensity < 0.1
                              ? "Low"
                              : data.precipitationIntensity < 0.4
                              ? "Medium"
                              : "High";
                          // Formatar a pressão para hPa
                          const pressure = `${(data.pressure / 100).toFixed(
                            2
                          )} hPa`;

                          return (
                            <tr key={index} className="fs-4">
                              <td className="text-white px-1">{year}</td>
                              <td className="text-white px-1">{winnerName}</td>
                              <td className="text-white px-1">{temperature}</td>
                              <td className="text-white px-1">{pressure}</td>
                              <td className="text-white px-1">
                                {precipitationIntensity}
                              </td>
                              <td className="text-white px-1">{windSpeed}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  ) : (
                    <tbody>
                      <tr>
                        <td>Loading...</td>
                      </tr>
                    </tbody>
                  )}
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NextRaceBox;
