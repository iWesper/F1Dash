import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import geojsonFile from "../extra/f1-circuits.geojson";
import { Container, Row, Col, Table } from "reactstrap";

const NextRaceBox = () => {
  const [geojsonData, setGeojsonData] = useState(null);
  const [nextRaceAvailability, setNextRaceAvailability] = useState(true);
  const [lastWinners, setLastWinners] = useState([]);
  const [nextCircuit, setNextCircuit] = useState(null); // [circuito, data, horas]
  const [circuitLatitude, setCircuitLatitude] = useState(null);
  const [circuitLongitude, setCircuitLongitude] = useState(null);
  const [nextRaceWeatherData, setNextRaceWeatherData] = useState(null);
  const [previousRaceWeatherData, setPreviousRaceWeatherData] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const mapRef = useRef(null);

  const getWeatherData = async (
    latitude,
    longitude,
    nextRaceDate,
    previousRaceDates
  ) => {
    const apiKey = process.env.REACT_APP_WEATHER_API_KEY;
    const nextRaceWeatherData = [];
    const previousRaceWeatherData = [];

    // Fetch next race weather data
    try {
      const nextRaceResponse = await axios.get(
        `https://api.worldweatheronline.com/premium/v1/weather.ashx?q=${latitude},${longitude}&date=${nextRaceDate}&format=json&key=${apiKey}`
      );

      const nextRaceDailyWeather = nextRaceResponse.data.data.weather[0];
      const nextRaceHourlyWeather = nextRaceDailyWeather.hourly;

      const nextRaceAvgTemperature =
        nextRaceHourlyWeather.reduce(
          (sum, data) => sum + Number(data.tempC),
          0
        ) / nextRaceHourlyWeather.length;
      const nextRaceAvgPressure =
        nextRaceHourlyWeather.reduce(
          (sum, data) => sum + Number(data.pressure),
          0
        ) / nextRaceHourlyWeather.length;
      const nextRaceAvgPrecipitation =
        nextRaceHourlyWeather.reduce(
          (sum, data) => sum + Number(data.precipMM),
          0
        ) / nextRaceHourlyWeather.length;
      const nextRaceAvgWindSpeed =
        nextRaceHourlyWeather.reduce(
          (sum, data) => sum + Number(data.windspeedKmph),
          0
        ) / nextRaceHourlyWeather.length;

      nextRaceWeatherData.push({
        date: nextRaceDailyWeather.date,
        temperature: nextRaceAvgTemperature,
        pressure: nextRaceAvgPressure,
        precipitationIntensity: nextRaceAvgPrecipitation,
        windSpeed: nextRaceAvgWindSpeed,
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

        const previousRaceAvgTemperature =
          previousRaceHourlyWeather.reduce(
            (sum, data) => sum + Number(data.tempC),
            0
          ) / previousRaceHourlyWeather.length;
        const previousRaceAvgPressure =
          previousRaceHourlyWeather.reduce(
            (sum, data) => sum + Number(data.pressure),
            0
          ) / previousRaceHourlyWeather.length;
        const previousRaceAvgPrecipitation =
          previousRaceHourlyWeather.reduce(
            (sum, data) => sum + Number(data.precipMM),
            0
          ) / previousRaceHourlyWeather.length;
        const previousRaceAvgWindSpeed =
          previousRaceHourlyWeather.reduce(
            (sum, data) => sum + Number(data.windspeedKmph),
            0
          ) / previousRaceHourlyWeather.length;

        previousRaceWeatherData.push({
          date: previousRaceDailyWeather.date,
          temperature: previousRaceAvgTemperature,
          pressure: previousRaceAvgPressure,
          precipitationIntensity: previousRaceAvgPrecipitation,
          windSpeed: previousRaceAvgWindSpeed,
        });
      }

      setPreviousRaceWeatherData(previousRaceWeatherData);
      console.log(previousRaceWeatherData);
    } catch (error) {
      console.error("Error fetching previous races weather data", error);
    }

    return { nextRaceWeatherData, previousRaceWeatherData };
  };

  // Corre apenas uma vez, quando o componente é montado, para carregar o ficheiro geojson
  useEffect(() => {
    fetch(geojsonFile)
      .then((response) => response.json())
      .then((data) => setGeojsonData(data));
  }, []);

  useEffect(() => {
    if (nextCircuit && nextCircuit[1]) {
      const raceDate = new Date(nextCircuit[1]);

      const updateCountdown = () => {
        const now = new Date();
        const timeDifference = raceDate - now;

        if (timeDifference > 0) {
          const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor(
            (timeDifference % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

          setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        } else {
          setCountdown("Race has started!");
        }
      };
      const timer = setInterval(updateCountdown, 1000);

      return () => clearInterval(timer);
    }
  }, [nextCircuit]);

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
      //     setPreviousRaceWeatherData(weatherData);
      //   })
      //   .catch((error) => {
      //     console.error(error);
      //   });
    }
  }, [lastWinners]);

  // Corre quando o nextRace, circuitLatitude ou circuitLongitude é alterado
  useEffect(() => {
    // Se houver uma próxima corrida e latitude e longitude do circuito
    if (nextCircuit && circuitLatitude && circuitLongitude) {
      // Transformar a data em ano
      const date = new Date(nextCircuit[1]);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // +1 porque os meses começam em 0
      const day = String(date.getDate()).padStart(2, "0");
      const nextRaceDate = `${year}-${month}-${day}`;

      // Obter as datas das últimas 5 corridas
      const lastFiveRaceDates = lastWinners.map((winner) => {
        // Transformar a data em ano
        const date = new Date(winner.date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0"); // +1 porque os meses começam em 0
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      });

      // Obter os dados meteorológicos da próxima corrida
      getWeatherData(
        circuitLatitude,
        circuitLongitude,
        nextRaceDate,
        lastFiveRaceDates
      )
        .then(({ nextRaceWeatherData, previousRaceWeatherData }) => {
          // Se houver dados meteorológicos
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

  // Corre quando o geojson é carregado e sempre que o geojsonData é alterado
  useEffect(() => {
    // Utilizar uma proxy para contornar o erro de CORS
    const corsProxy = "https://corsproxy.io/?";
    // Se o geojson foi carregado
    if (geojsonData) {
      // Se o mapa já existir, remover
      if (mapRef.current) {
        mapRef.current.remove();
      }

      // Criar o mapa
      mapRef.current = L.map("map").setView([51.505, -0.09], 13);

      // Adicionar a camada do OpenStreetMap
      L.tileLayer(
        `${corsProxy}https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`,
        {
          maxZoom: 19,
        }
      ).addTo(mapRef.current);

      // Obter a próxima corrida
      axios
        .get(`${corsProxy}https://ergast.com/api/f1/current/next.json`)
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
            setNextCircuit([circuitName, raceDate, raceTime]);

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
                  `${corsProxy}https://ergast.com/api/f1/circuits/${circuitID}/results/1.json`
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
              .get(`${corsProxy}https://ergast.com/api/f1/current/last.json`)
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
                setNextCircuit([circuitName, raceDate, raceTime]);

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
                      `${corsProxy}https://ergast.com/api/f1/circuits/${circuitID}/results/1.json`
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
    <Container fluid className="box m-0 p-4">
      <Row className="nextrace-container">
        <Col xs="12">
          {nextRaceAvailability ? (
            // Se houver uma próxima corrida definida
            <div className="d-flex flex-row justify-content-between border-bottom mb-3">
              <p className="d-flex text-white fs-2 fw-bold text-start">
                NEXT RACE
              </p>
              {nextCircuit && (
                <div className="d-flex text-white text-end fs-2">
                  {new Date(nextCircuit[1]).getFullYear()} {nextCircuit[0]}{" "}
                  Grand Prix
                </div>
              )}
            </div>
          ) : (
            // Se não houver uma próxima corrida definida (off season)
            <p className="text-white fs-2 mb-3 fw-bold text-start border-bottom">
              OFF SEASON - CHECK OUT THE LAST RACE
            </p>
          )}
        </Col>
      </Row>
      <Row className="d-flex flex-row ps-0 ms-0 justify-content-between align-middle mt-2 w-100">
        <Col
          xs="12"
          md="6"
          lg="2"
          className="fs-5 text-start d-flex flex-column text-white"
        >
          {nextCircuit && (
            <Row>
              <Col
                xs="12"
                className="text-center mb-1 d-flex align-items-center justify-content-center"
              >
                <div className="text-white fs-4">📅 Date: {nextCircuit[1]}</div>
              </Col>
              <Col
                xs="12"
                className="text-center mb-1 d-flex align-items-center justify-content-center"
              >
                <div className="text-white fs-4">
                  🕙 Time: {nextCircuit[2] ? nextCircuit[2] : "TBA"}
                </div>
              </Col>
              <Col
                xs="12"
                className="mb-1 d-flex align-items-center justify-content-center"
              >
                <div className="text-white mt-4 text-center w-100 fs-4">
                  ⏳ Countdown{" "}
                  <div className="fs-2 text-center">{countdown}</div>
                </div>
              </Col>
            </Row>
          )}
        </Col>
        <Col
          xs="12"
          md="6"
          lg="4"
          className="d-flex flex-column align-items-center"
        >
          <div
            id="map"
            className="w-100 rounded d-flex px-2 my-auto"
            style={{ height: "20rem", maxHeight: "20rem", maxWidth: "100%" }}
          ></div>
        </Col>
        <Col xs="12" lg="6" className="d-flex flex-column align-items-center">
          {nextRaceWeatherData ? (
            <div className="mb-3 w-100">
              <div className="table-responsive">
                <Table className="table-sm table-custom table-striped table-borderless caption-top">
                  <caption className="text-white text-lg-center fs-4">
                    Weather Forecast
                  </caption>
                  <thead>
                    <tr className="fs-5">
                      <th scope="col" className="px-1">
                        <div className="d-flex flex-column align-items-center p-4">
                          <span style={{ fontSize: "1em" }}>🏆</span>
                          <span>Winner</span>
                        </div>
                      </th>
                      <th scope="col" className="px-1">
                        <div className="d-flex flex-column align-items-center p-4">
                          <span style={{ fontSize: "1em" }}>📅</span>
                          <span>Date</span>
                        </div>
                      </th>
                      <th scope="col" className="px-1">
                        <div className="d-flex flex-column align-items-center p-4">
                          <span style={{ fontSize: "1em" }}>🌡️</span>
                          <span>Temperature</span>
                        </div>
                      </th>
                      <th scope="col" className="px-1">
                        <div className="d-flex flex-column align-items-center p-4">
                          <span style={{ fontSize: "1em" }}>💨</span>
                          <span>Wind</span>
                        </div>
                      </th>
                      <th scope="col" className="px-1">
                        <div className="d-flex flex-column align-items-center p-4">
                          <span style={{ fontSize: "1em" }}>📊</span>
                          <span>Pressure</span>
                        </div>
                      </th>
                      <th scope="col" className="px-1">
                        <div className="d-flex flex-column align-items-center p-4">
                          <span style={{ fontSize: "1em" }}>💧</span>
                          <span>Precipitation</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="fs-4">
                      <td className="text-white px-1"> - </td>
                      <td className="text-white px-1"> Next race </td>
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
                    {previousRaceWeatherData &&
                      previousRaceWeatherData
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((data, index) => {
                          // Transformar a data em ano
                          const year = new Date(data.date).getFullYear();
                          // Obter o vencedor da corrida desse ano
                          const winner = lastWinners.find(
                            (winner) => winner.season === String(year)
                          );
                          // Obter o nome do vencedor da corrida desse ano
                          const winnerName = winner
                            ? `${winner.Driver.givenName.charAt(0)}. ${
                                winner.Driver.familyName
                              }`
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
                              <td className="text-white px-1">{winnerName}</td>
                              <td className="text-white px-1">{year}</td>
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
                </Table>
              </div>
            </div>
          ) : (
            <div className="mb-3 w-100">
              <p className="text-danger">
                Sorry! Next race's weather forecast still isn't available. Take
                a look at the weather from the last 5 races:
              </p>
              <div className="table-responsive">
                <Table className="table-sm table-custom table-striped table-borderless caption-top">
                  <caption className="text-white text-lg-center fs-4">
                    Weather Forecast
                  </caption>
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
                  {previousRaceWeatherData ? (
                    <tbody>
                      {previousRaceWeatherData
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((data, index) => {
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
                </Table>
              </div>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default NextRaceBox;
