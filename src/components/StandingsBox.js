import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Flag from "react-world-flags";
import axios from "axios";
import {
  addFavoriteDriver,
  removeFavoriteDriver,
  getFavoriteDrivers,
} from "./FavoritesService";
import { useAuth } from "./AuthProvider";
import { FaStar, FaRegStar } from "react-icons/fa";

const StandingsBox = ({ setAlert }) => {
  // Variável driverStandings que guarda o array de dados da API
  const [driverStandings, setDriverStandings] = useState([]);
  const [favoriteDrivers, setFavoriteDrivers] = useState([]);
  const [apiIsDown, setApiIsDown] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Transformar nacionalidade em código de país para usar corretamente a flag do react-world-flags
  const nationalityToCode = {
    British: "GBR",
    German: "DEU",
    Dutch: "NLD",
    Thai: "THA",
    Monegasque: "MCO",
    Finnish: "FIN",
    French: "FRA",
    Spanish: "ESP",
    Canadian: "CAN",
    Australian: "AUS",
    Mexican: "MEX",
    Russian: "RUS",
    Danish: "DNK",
    Swedish: "SWE",
    Italian: "ITA",
    Belgian: "BEL",
    Polish: "POL",
    Japanese: "JPN",
    Brazilian: "BRA",
    American: "USA",
    Indonesian: "IDN",
    Chinese: "CHN",
    Portuguese: "PRT",
    Venezuelan: "VEN",
    Argentine: "ARG",
    Colombian: "COL",
    NewZealander: "NZL",
    Indian: "IND",
    Irish: "IRL",
    Austrian: "AUT",
    Uruguayan: "URY",
    Rhodesian: "ZWE",
    Liechtensteiner: "LIE",
    Swiss: "CHE",
    SouthAfrican: "ZAF",
    Hungarian: "HUN",
    EastGerman: "DEU",
    Rhodesian: "ZWE",
    Argentinian: "ARG",
  };

  // Adicionar um driver aos favoritos
  const addFavorite = (driver) => {
    // Verificar se o utilizador está logado
    if (user) {
      // Adicionar o driver aos favoritos
      addFavoriteDriver(user.uid, driver.Driver.driverId)
        .then(() => {
          setAlert({
            visible: true,
            message: "Added to your favorite drivers",
            color: "success",
          });
          setFavoriteDrivers([...favoriteDrivers, driver.Driver.driverId]);
        })
        .catch((error) => {
          setAlert({
            visible: true,
            message: `An error occurred while adding your favorite driver! Please try again later.`,
            color: "danger",
          });
          console.error(error);
        });
    } else {
      // Redirecionar o utilizador para a página de login
      navigate("/login");
    }
  };

  // Remover um driver dos favoritos
  const removeFavorite = (driver) => {
    if (user) {
      removeFavoriteDriver(user.uid, driver.Driver.driverId)
        .then(() => {
          setAlert({
            visible: true,
            message: "Removed from your favorite drivers",
            color: "success",
          });
          setFavoriteDrivers(
            favoriteDrivers.filter((id) => id !== driver.Driver.driverId)
          );
        })
        .catch((error) => {
          setAlert({
            visible: true,
            message:
              "An error occurred while removing your favorite driver! Please try again later.",
            color: "danger",
          });
        });
    }
  };

  // Ao carregar na página, faz uma request à Firebase e guarda os dados no array driverStandings
  useEffect(() => {
    if (user) {
      getFavoriteDrivers(user.uid)
        .then((drivers) => {
          setFavoriteDrivers(drivers);
        })
        .catch((error) =>
          window.alert(
            "An error occurred while fetching your favorite drivers! Please try again later.",
            error
          )
        );
    }
  }, [user]);

  // Ao carregar na página, faz um GET request à API e guarda os dados no array driverStandings
  useEffect(() => {
    // Utilizar uma proxy para contornar o erro de CORS
    const corsProxy = "https://corsproxy.io/?";
    axios
      .get(`${corsProxy}https://ergast.com/api/f1/current/driverStandings.json`)
      .then((response) => {
        setApiIsDown(false);
        setDriverStandings(
          response.data.MRData.StandingsTable.StandingsLists[0].DriverStandings
        );
      })
      .catch((error) => {
        setApiIsDown(true);
        window.alert(
          "At the moment, the F1 Data API used isn't available. Please, try again later.",
          error
        );
      });
  }, []);

  return (
    <div className="box max-vh-80">
      <div className="standings-container p-4">
        {/* <Link to="/standings"> */}
        <p className="text-white fs-2 mb-3 fw-bold text-start border-bottom">
          STANDINGS
        </p>
        {apiIsDown && (
          <div className="d-flex flex-column h-100 align-items-center text-center justify-content-center">
            <h1 className="text-white">
              Oops! The F1 Data API is currently unavailable.
            </h1>
            <h2 className="text-white">Please try again later.</h2>
          </div>
        )}
        {driverStandings && !apiIsDown ? (
          <table className="w-100">
            <thead>
              <tr className="text-start">
                <th>FAV</th>
                <th>POS</th>
                <th>DRIVER</th>
                <th>NATIONALITY</th>
                <th>CONSTRUCTOR</th>
                <th>PTS</th>
              </tr>
            </thead>
            <tbody className="fs-5">
              {driverStandings.map((driver, index) => (
                <tr className="text-start" key={index}>
                  <td>
                    {favoriteDrivers.includes(driver.Driver.driverId) ? (
                      <FaStar
                        className="me-1"
                        onClick={() => removeFavorite(driver)}
                        style={{ cursor: "pointer" }}
                      />
                    ) : (
                      <FaRegStar
                        className="me-1"
                        onClick={() => addFavorite(driver)}
                        style={{ cursor: "pointer" }}
                      />
                    )}
                  </td>
                  <td>{index + 1}</td>
                  <td className="text-white fw-bold">
                    {driver.Driver.givenName.charAt(0)}.
                    {driver.Driver.familyName}
                  </td>
                  <td>
                    <Flag
                      code={nationalityToCode[driver.Driver.nationality]}
                      height="15px"
                      width="30px"
                      className="mx-1"
                    />
                    {driver.Driver.nationality}
                  </td>
                  <td>{driver.Constructors[0].name}</td>
                  <td className="fw-bold text-white">{driver.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : !apiIsDown ? (
          <div className="text-white">Loading...</div>
        ) : null}
        {/* </Link> */}
      </div>
    </div>
  );
};

export default StandingsBox;
