import React from "react";
import { Row, Col, Container } from 'reactstrap';
import StandingsBox from "./StandingsBox";
import NextRaceBox from "./NextRaceBox";
import NewsBox from "./NewsBox";
import VideosBox from "./VideosBox";
import ErrorBoundary from "./ErrorBoundary";

const Dashboard = ({setAlert}) => {
  return (
    <Container fluid className="dashboard">
      <Row>
        <Col xs="12">
          <ErrorBoundary label="the next race">
            <NextRaceBox />
          </ErrorBoundary>
        </Col>
      </Row>
      <Row>
        <Col xs="12" lg="8">
          <ErrorBoundary label="the standings">
            <StandingsBox setAlert={setAlert}/>
          </ErrorBoundary>
        </Col>
        <Col xs="12" lg="4">
          <ErrorBoundary label="the news">
            <NewsBox />
          </ErrorBoundary>
        </Col>
      </Row>
      <Row>
        <Col>
          <ErrorBoundary label="the videos">
            <VideosBox />
          </ErrorBoundary>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
