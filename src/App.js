import React, { useEffect, useState } from "react";
import "./App.css";
import { Auth } from "./components/auth";
import { AuthProvider } from "./components/AuthProvider";
import "bootstrap/dist/css/bootstrap.min.css";
import "../src/css/styles.css";
import Dashboard from "./components/Dashboard";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  BrowserRouter,
} from "react-router-dom";
import Favorites from "./components/Favorites";
import HeaderNav from "./components/HeaderNav";
import { Alert } from "reactstrap";

function App() {
  const [alert, setAlert] = useState({
    visible: false,
    message: "",
    color: "",
  });

  useEffect(() => {
    if (alert.visible) {
      const timer = setTimeout(() => {
        setAlert((prevAlert) => ({ ...prevAlert, visible: false }));
      }, 3000); // 3000ms = 3s

      return () => clearTimeout(timer); // limpar o timer
    }
  }, [alert.visible]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App gradient-custom w-100 h-100">
          <HeaderNav />
          <Alert
            color={alert.color}
            isOpen={alert.visible}
            toggle={() => setAlert({ ...alert, visible: false })}
            className="position-fixed top-0 start-50 translate-middle-x"
            style={{ zIndex: 9999 }}
            fade
          >
            {alert.message}
          </Alert>
          <Routes>
            <Route path="/" index element={<Dashboard setAlert={setAlert} />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/favorites" element={<Favorites />} />
          </Routes>
          {/* Linha abaixo serve para dar lock à app e apenas permitir acesso quando logged in */}
          {/* {isLoggedIn ? <h1>Logged in</h1> : <Auth />} */}
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
