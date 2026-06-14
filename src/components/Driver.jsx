import { useEffect, useState } from "react";
import axios from "axios";

function Driver({ driverId }) {
  const [currentSeasonData, setCurrentSeasonData] = useState(null);
  const [careerData, setCareerData] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        let offset = 0;
        let limit = 100;
        let races = [];

        while (true) {
          const response = await axios.get(
            `https://api.jolpi.ca/ergast/f1/drivers/${driverId}/results.json?limit=${limit}&offset=${offset}`
          );
          races = races.concat(response.data.MRData.RaceTable.Races);
          if (response.data.MRData.total > races.length) {
            offset += limit;
          } else {
            break;
          }
        }

        // Obter os dados do piloto da primeira corrida da temporada atual
        const driverInfo = races[0].Results[0].Driver;

        // A API da Wikipedia suporta CORS anónimo através de origin=* (sem proxy).
        let imageUrl = null;
        try {
          const wikipediaResponse = await axios.get(
            `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&origin=*&titles=${driverInfo.givenName}_${driverInfo.familyName}`
          );
          const pages = wikipediaResponse.data.query.pages;
          const pageID = Object.keys(pages)[0];
          imageUrl = pages[pageID]?.original?.source ?? null;
        } catch {
          // Sem imagem — o card mostra um placeholder.
        }

        // Adicionar a imagem ao objeto driverInfo
        setDriverInfo({ ...driverInfo, imageUrl });

        // Calcular as estatísticas da temporada atual e da carreira.
        // Usar a temporada mais recente presente nos resultados (em vez de um ano fixo).
        const latestSeason = races.reduce(
          (max, race) => (Number(race.season) > Number(max) ? race.season : max),
          races[0].season
        );
        setCurrentSeasonData(
          calculateStats(races.filter((race) => race.season === latestSeason))
        );
        setCareerData(calculateStats(races));
      } catch (err) {
        console.error(err);
        setError(true);
      }
    };

    fetchDriverData();
  }, [driverId]);

  // Função que calcula as estatísticas do piloto
  const calculateStats = (races) => {
    let stats = {
      season: races[0].season,
      races: races.length,
      points: 0,
      polePositions: 0,
      wins: 0,
      podiums: 0,
      dnfs: 0,
    };

    races.forEach((race) => {
      const result = race.Results[0];
      stats.points += parseInt(result.points);
      // Comparar posições numericamente (a comparação de strings tratava
      // a 10ª posição como pódio).
      if (Number(result.position) === 1) stats.wins++;
      if (Number(result.position) <= 3) stats.podiums++;
      if (result.positionText === "R") stats.dnfs++;
      if (result.grid === "1") stats.polePositions++;
    });

    return stats;
  };

  if (error) {
    return (
      <section className="glass panel state-panel">
        <div className="state">
          <h3>Couldn't load this driver</h3>
          <p>The results API may be temporarily unavailable.</p>
        </div>
      </section>
    );
  }

  if (!currentSeasonData || !careerData || !driverInfo) {
    return (
      <section className="glass panel state-panel">
        <div className="state">
          <div className="spinner" />
          <p>Loading driver…</p>
        </div>
      </section>
    );
  }

  const rows = [
    ["Races", currentSeasonData.races, careerData.races],
    ["Points", currentSeasonData.points, careerData.points],
    ["Pole positions", currentSeasonData.polePositions, careerData.polePositions],
    ["Wins", currentSeasonData.wins, careerData.wins],
    ["Podiums", currentSeasonData.podiums, careerData.podiums],
    ["DNFs", currentSeasonData.dnfs, careerData.dnfs],
  ];

  return (
    <section className="glass panel driver-card">
      <div className="driver-card__media">
        {driverInfo.imageUrl ? (
          <>
            <img
              className="driver-card__photo"
              src={driverInfo.imageUrl}
              alt={`${driverInfo.givenName} ${driverInfo.familyName}`}
            />
            <span className="driver-card__credit">Image: Wikipedia</span>
          </>
        ) : (
          <div className="driver-card__photo" />
        )}
      </div>

      <div className="driver-card__main">
        <div>
          <h2 className="driver-card__name">
            {driverInfo.givenName} {driverInfo.familyName}
          </h2>
          <div className="driver-card__meta">
            {driverInfo.permanentNumber && (
              <span className="pill">#{driverInfo.permanentNumber}</span>
            )}
            <span>{driverInfo.nationality}</span>
          </div>
        </div>

        <table className="dtable">
          <thead>
            <tr>
              <th>Stat</th>
              <th>{currentSeasonData.season}</th>
              <th>Career</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, season, career]) => (
              <tr key={label}>
                <td className="strong">{label}</td>
                <td className="num">{season}</td>
                <td className="num">{career}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default Driver;
