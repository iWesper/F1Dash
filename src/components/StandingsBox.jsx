import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  addFavoriteDriver,
  removeFavoriteDriver,
  getFavoriteDrivers,
} from "./FavoritesService";
import { useAuth } from "./AuthProvider";
import { FaStar, FaRegStar } from "react-icons/fa";
import { Flag, nationalityToCode } from "../utils/flags";

const StandingsBox = ({ setAlert }) => {
  // Variável driverStandings que guarda o array de dados da API
  const [driverStandings, setDriverStandings] = useState([]);
  const [constructorStandings, setConstructorStandings] = useState([]);
  const [tab, setTab] = useState("drivers");
  const [favoriteDrivers, setFavoriteDrivers] = useState([]);
  const [apiIsDown, setApiIsDown] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

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

  // Ao carregar na página, faz um GET request à API e guarda os dados.
  // Jolpica é o sucessor compatível da API Ergast e suporta CORS diretamente.
  useEffect(() => {
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

    axios
      .get("https://api.jolpi.ca/ergast/f1/current/constructorStandings.json")
      .then((response) => {
        setConstructorStandings(
          response.data.MRData.StandingsTable.StandingsLists[0]
            .ConstructorStandings
        );
      })
      .catch((error) => {
        console.error("Constructor standings unavailable", error);
      });
  }, []);

  const season =
    driverStandings.length > 0 ? new Date().getFullYear() : "";

  const activeEmpty =
    tab === "drivers"
      ? driverStandings.length === 0
      : constructorStandings.length === 0;

  return (
    <section className="glass panel">
      <div className="panel__head">
        <div>
          <span className="eyebrow">Championship {season}</span>
          <h2 className="panel__title">Standings</h2>
        </div>
        <div className="seg" role="tablist" aria-label="Standings type">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "drivers"}
            className={`seg__btn ${tab === "drivers" ? "is-active" : ""}`}
            onClick={() => setTab("drivers")}
          >
            Drivers
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "constructors"}
            className={`seg__btn ${tab === "constructors" ? "is-active" : ""}`}
            onClick={() => setTab("constructors")}
          >
            Teams
          </button>
        </div>
      </div>

      {apiIsDown ? (
        <div className="state">
          <h3>Standings unavailable</h3>
          <p>The F1 data API isn't responding right now. Please try again later.</p>
        </div>
      ) : activeEmpty ? (
        <div className="state">
          <div className="spinner" />
          <p>Loading standings…</p>
        </div>
      ) : tab === "drivers" ? (
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
                      <button
                        className="driver-link"
                        onClick={() =>
                          navigate(`/driver/${driver.Driver.driverId}`)
                        }
                      >
                        {driver.Driver.givenName.charAt(0)}.{" "}
                        {driver.Driver.familyName}
                      </button>
                    </td>
                    <td>
                      <span className="cell-inline">
                        <Flag
                          code={nationalityToCode[driver.Driver.nationality]}
                          name={driver.Driver.nationality}
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
      ) : (
        <div className="panel__scroll">
          <table className="dtable">
            <thead>
              <tr>
                <th>Pos</th>
                <th>Constructor</th>
                <th>Nationality</th>
                <th>Wins</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {constructorStandings.map((team, index) => {
                const pos = index + 1;
                return (
                  <tr key={team.Constructor.constructorId}>
                    <td>
                      <span className={`pos ${pos <= 3 ? `pos--${pos}` : ""}`}>
                        {pos}
                      </span>
                    </td>
                    <td className="strong">{team.Constructor.name}</td>
                    <td>
                      <span className="cell-inline">
                        <Flag
                          code={nationalityToCode[team.Constructor.nationality]}
                          name={team.Constructor.nationality}
                        />
                        {team.Constructor.nationality}
                      </span>
                    </td>
                    <td className="num">{team.wins}</td>
                    <td className="num">{team.points}</td>
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
