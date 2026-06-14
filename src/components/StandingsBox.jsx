import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// react-world-flags é CommonJS e, sob o interop ESM do Vite, o export default
// vem encapsulado em { default: Componente }. Desembrulhar para obter o componente.
import FlagModule from "react-world-flags";
import axios from "axios";
import {
  addFavoriteDriver,
  removeFavoriteDriver,
  getFavoriteDrivers,
} from "./FavoritesService";
import { useAuth } from "./AuthProvider";
import { FaStar, FaRegStar } from "react-icons/fa";

const Flag = FlagModule.default || FlagModule;

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
    Argentinian: "ARG",
  };

  // Adicionar um driver aos favoritos
  const addFavorite = (driver) => {
    if (user) {
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
        .catch(() => {
          setAlert({
            visible: true,
            message:
              "An error occurred while removing your favorite driver! Please try again later.",
            color: "danger",
          });
        });
    }
  };

  // Ao carregar na página, vai buscar os favoritos do utilizador
  useEffect(() => {
    if (user) {
      getFavoriteDrivers(user.uid)
        .then((drivers) => setFavoriteDrivers(drivers))
        .catch((error) =>
          console.error("Error fetching favorite drivers", error)
        );
    }
  }, [user]);

  // Ao carregar na página, faz um GET request à API e guarda os dados
  useEffect(() => {
    // Jolpica é o sucessor compatível da API Ergast e suporta CORS diretamente.
    axios
      .get("https://api.jolpi.ca/ergast/f1/current/driverStandings.json")
      .then((response) => {
        setApiIsDown(false);
        setDriverStandings(
          response.data.MRData.StandingsTable.StandingsLists[0].DriverStandings
        );
      })
      .catch((error) => {
        setApiIsDown(true);
        console.error("F1 data API unavailable", error);
      });
  }, []);

  const season =
    driverStandings.length > 0 ? new Date().getFullYear() : "";

  return (
    <section className="glass panel">
      <div className="panel__head">
        <div>
          <span className="eyebrow">Championship</span>
          <h2 className="panel__title">Driver Standings</h2>
        </div>
        {season && <span className="text-dim">{season}</span>}
      </div>

      {apiIsDown ? (
        <div className="state">
          <h3>Standings unavailable</h3>
          <p>The F1 data API isn't responding right now. Please try again later.</p>
        </div>
      ) : driverStandings.length === 0 ? (
        <div className="state">
          <div className="spinner" />
          <p>Loading standings…</p>
        </div>
      ) : (
        <div className="panel__scroll">
          <table className="dtable">
            <thead>
              <tr>
                <th aria-label="Favorite"></th>
                <th>Pos</th>
                <th>Driver</th>
                <th>Nationality</th>
                <th>Constructor</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {driverStandings.map((driver, index) => {
                const isFav = favoriteDrivers.includes(driver.Driver.driverId);
                const pos = index + 1;
                return (
                  <tr key={driver.Driver.driverId}>
                    <td>
                      <button
                        className={`star-btn ${isFav ? "star-btn--on" : ""}`}
                        aria-label={
                          isFav ? "Remove favorite" : "Add favorite"
                        }
                        onClick={() =>
                          isFav ? removeFavorite(driver) : addFavorite(driver)
                        }
                      >
                        {isFav ? <FaStar /> : <FaRegStar />}
                      </button>
                    </td>
                    <td>
                      <span className={`pos ${pos <= 3 ? `pos--${pos}` : ""}`}>
                        {pos}
                      </span>
                    </td>
                    <td className="strong">
                      {driver.Driver.givenName.charAt(0)}. {driver.Driver.familyName}
                    </td>
                    <td>
                      <span className="cell-inline">
                        <Flag
                          code={nationalityToCode[driver.Driver.nationality]}
                          className="flag"
                          fallback={null}
                        />
                        {driver.Driver.nationality}
                      </span>
                    </td>
                    <td>{driver.Constructors[0].name}</td>
                    <td className="num">{driver.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default StandingsBox;
