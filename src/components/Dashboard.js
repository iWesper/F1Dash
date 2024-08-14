import React from "react";
import { Row, Col } from 'reactstrap';
import StandingsBox from "./StandingsBox";
import NextRaceBox from "./NextRaceBox";
import NewsBox from "./NewsBox";
import VideosBox from "./VideosBox";

const Dashboard = ({setAlert}) => {
  return (
    <div className="dashboard">
      <Row className="m-0">
        <Col>
          <NextRaceBox />
        </Col>
      </Row>
      <Row className="m-0">
        <Col md="8">
          <StandingsBox setAlert={setAlert}/>
        </Col>
        <Col md="4">
          <NewsBox />
        </Col>
      </Row>
      <Row className="m-0">
        <Col>
          <VideosBox />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
