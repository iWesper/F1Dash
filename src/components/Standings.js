import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const Standings = () => {
  // Variável driverStandings que guarda o array de dados da API
  const [driverStandings, setDriverStandings] = useState([]);

  // Ao carregar na página, faz um GET request à API e guarda os dados no array driverStandings
  useEffect(() => {
    axios
      .get("http://ergast.com/api/f1/current/driverStandings.json")
      .then((response) => {
        setDriverStandings(
          response.data.MRData.StandingsTable.StandingsLists[0].DriverStandings
        );
      })
      .catch((error) => {
        console.log("There was an error!", error);
      });
  }, []);

  return (
    <div className="box">
      <Link to="/standings">
        {driverStandings ? (
          driverStandings.slice(0, 5).map((driver, index) => (
            <div key={index}>
              <h5>{driver.Driver.givenName}</h5>
              <p>{driver.points}</p>
            </div>
          ))
        ) : (
          <div>Loading...</div>
        )}
        {driverStandings && driverStandings.length > 5 && (
          <div>And more...</div>
        )}
      </Link>
    </div>
  );
};

export default Standings;
