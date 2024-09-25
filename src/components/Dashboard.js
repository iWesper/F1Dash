import React from "react";
import { Row, Col, Container } from 'reactstrap';
import StandingsBox from "./StandingsBox";
import NextRaceBox from "./NextRaceBox";
import NewsBox from "./NewsBox";
import VideosBox from "./VideosBox";

const Dashboard = ({setAlert}) => {
  return (
    <Container fluid className="dashboard">
      <Row>
        <Col xs="12">
          <NextRaceBox />
        </Col>
      </Row>
      <Row>
        <Col xs="12" lg="8">
          <StandingsBox setAlert={setAlert}/>
        </Col>
        <Col xs="12" lg="4">
          <NewsBox />
        </Col>
      </Row>
      <Row>
        <Col>
          <VideosBox />
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
