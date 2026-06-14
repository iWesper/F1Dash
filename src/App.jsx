import React, { useEffect, useState } from "react";
import "./App.css";
import { Auth } from "./components/auth";
import { AuthProvider } from "./components/AuthProvider";
import "bootstrap/dist/css/bootstrap.min.css";
import "../src/css/styles.css";
import Dashboard from "./components/Dashboard";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Favorites from "./components/Favorites";
import Calendar from "./components/Calendar";
import DriverPage from "./components/DriverPage";
import HeaderNav from "./components/HeaderNav";
import ErrorBoundary from "./components/ErrorBoundary";

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
      return () => clearTimeout(timer);
    }
  }, [alert.visible]);

  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Dark aurora backdrop (fixed, behind everything) */}
        <div className="aurora" aria-hidden="true">
          <span className="aurora__blob aurora__blob--1" />
          <span className="aurora__blob aurora__blob--2" />
          <span className="aurora__blob aurora__blob--3" />
        </div>

        <div className="app-shell App">
          <HeaderNav />

          {alert.visible && (
            <div
              className={`toast glass toast--${alert.color}`}
              role="status"
              onClick={() => setAlert({ ...alert, visible: false })}
            >
              {alert.message}
            </div>
          )}

          <ErrorBoundary label="this page">
            <Routes>
              <Route path="/" index element={<Dashboard setAlert={setAlert} />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/driver/:driverId" element={<DriverPage />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
