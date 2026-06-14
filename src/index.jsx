import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// App.js já fornece o AuthProvider (dentro do Router), por isso aqui basta
// renderizar a App — evita um segundo contexto de autenticação redundante.
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
