import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/styles.css";
import { Form, Col, Container, Row, Card, CardBody } from "reactstrap";
import { Login } from "./Login";
import { SignUp } from "./SignUp";
// Logotipo
import { ReactComponent as Logo } from "../imgs/logo.svg";

export const Auth = () => {
  const [register, setRegister] = useState(false);

  const handleRegisterForm = () => {
    if (register) {
      setRegister(false);
    } else {
      setRegister(true);
    }
  };

  return (
    <Container className="w-100 h-100">
      <Row className="justify-content-center align-items-center">
        {/* Lado esquerdo */}
        <Col className="w-100 h-100" xl={10} lg={12} md={9}>
          <Card className="bg-dark text-white border-0 shadow-lg my-5">
            <CardBody className="p-0 shadow">
              <Row>
                <Col
                  className="d-none d-lg-block bg-secondary bg-gradient"
                  lg={6}
                >
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <Logo className="w-75 h-75" />
                    {/* <a href="https://iconscout.com/icons/car" class="text-underline font-size-sm" target="_blank">Car</a> by <a href="https://iconscout.com/contributors/abtocreative" class="text-underline font-size-sm" target="_blank">AbtoCreative</a> */}
                  </div>
                </Col>
                <Col className="p-5" lg={6}>
                  <div className="text-center">
                    <h1 className="h4 text-gray-900 mb-5 text-uppercase fw-bold">
                      Welcome to F1 Dash!
                    </h1>
                  </div>
                  <Form>
                    {/* Verificar modo de acesso */}
                    {register ? (
                      // Se estiver em modo de registo
                      <SignUp handleRegisterForm={handleRegisterForm} />
                    ) : (
                      // Se estiver em modo login
                      <Login handleRegisterForm={handleRegisterForm} />
                    )}
                    {/* <Button color="danger" onClick={signOut} className="mb-3">
              Sign Out
            </Button> */}
                  </Form>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
