// Punto de entrada: renderiza la app React en el elemento #root del HTML
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css"; // Estilos globales

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
