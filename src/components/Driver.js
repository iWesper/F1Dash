import { useEffect, useState } from "react";
import { Container, Row, Col } from "reactstrap";
import axios from "axios";

function Driver({ driverId }) {
  const [currentSeasonData, setCurrentSeasonData] = useState(null);
  const [careerData, setCareerData] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);

  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        let offset = 0;
        let limit = 100;
        let races = [];

        while (true) {
          const response = await axios.get(
            `http://ergast.com/api/f1/drivers/${driverId}/results.json?limit=${limit}&offset=${offset}`
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

        // Utilizar uma proxy para contornar o erro de CORS
        const corsProxy = "https://corsproxy.io/?";
        // Fazer um GET request à API da Wikipedia para obter a imagem do piloto
        const wikipediaResponse = await axios.get(
          `${corsProxy}https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${driverInfo.givenName}_${driverInfo.familyName}`
        );
        const pages = wikipediaResponse.data.query.pages;
        const pageID = Object.keys(pages)[0];
        const imageUrl = pages[pageID].original.source;

        // Adicionar a imagem ao objeto driverInfo
        setDriverInfo({ ...driverInfo, imageUrl });

        // Calcular as estatísticas da temporada atual e da carreira
        setCurrentSeasonData(
          calculateStats(races.filter((race) => race.season === "2023"))
        );
        setCareerData(calculateStats(races));
      } catch (error) {
        console.error(error);
      }
    };

    fetchDriverData();
  }, [driverId]);

  // Função que calcula as estatísticas do piloto
  const calculateStats = (races) => {
    // Inicializar o objeto stats com os valores iniciais
    let stats = {
      season: races[0].season,
      races: races.length,
      points: 0,
      polePositions: 0,
      wins: 0,
      podiums: 0,
      dnfs: 0,
    };

    // Para cada corrida, adicionar os valores às estatísticas
    races.forEach((race) => {
      // Adicionar os pontos da corrida ao total de pontos
      stats.points += parseInt(race.Results[0].points);
      // Verificar se o piloto ganhou, ficou no pódio, se fez DNF ou se fez pole position
      if (race.Results[0].position === "1") stats.wins++;
      if (race.Results[0].position <= "3") stats.podiums++;
      if (race.Results[0].positionText === "R") stats.dnfs++;
      if (race.Results[0].grid === "1") stats.polePositions++;
    });

    return stats;
  };

  // Se os dados ainda não foram carregados, mostrar "Loading..."
  if (!currentSeasonData || !careerData || !driverInfo) {
    return <div className="text-center text-white fw-bold fs-2">Loading...</div>;
  }

  return (
    <Container className="border-bottom">
      <Row>
        <Col>
          <h2 className="text-white fw-bold">
            {driverInfo.givenName} {driverInfo.familyName}
          </h2>
        </Col>
      </Row>
      <Row>
        <Col md="4">
          <img
            src={driverInfo.imageUrl}
            alt={`${driverInfo.givenName} ${driverInfo.familyName}`}
            className="img-fluid rounded"
          />
          <p>Image sourced from wikipedia</p>
        </Col>
        <Col md="8">
          <div className="box p-4 mt-0">
            <p className="text-white fs-2 mb-3 fw-bold text-start border-bottom">
              STATS
            </p>
            
            <table className="fs-5">
              <thead>
                <tr className="fw-bold text-white">
                  <th></th>
                  <th className="fw-bold text-white">{currentSeasonData.season}</th>
                  <th className="fw-bold text-white">Career</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-white">Races</td>
                  <td>{currentSeasonData.races}</td>
                  <td>{careerData.races}</td>
                </tr>
                <tr>
                  <td className="text-white">Points</td>
                  <td>{currentSeasonData.points}</td>
                  <td>{careerData.points}</td>
                </tr>
                <tr>
                  <td className="text-white">Pole Positions</td>
                  <td>{currentSeasonData.polePositions}</td>
                  <td>{careerData.polePositions}</td>
                </tr>
                <tr>
                  <td className="text-white">Wins</td>
                  <td>{currentSeasonData.wins}</td>
                  <td>{careerData.wins}</td>
                </tr>
                <tr>
                  <td className="text-white">Podiums</td>
                  <td>{currentSeasonData.podiums}</td>
                  <td>{careerData.podiums}</td>
                </tr>
                <tr>
                  <td className="text-white">DNFs</td>
                  <td>{currentSeasonData.dnfs}</td>
                  <td>{careerData.dnfs}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default Driver;
