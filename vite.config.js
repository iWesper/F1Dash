import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  // O projeto foi migrado de Create React App: as variáveis de ambiente
  // mantêm o prefixo REACT_APP_ para não obrigar a renomear o ficheiro .env.
  envPrefix: ["VITE_", "REACT_APP_"],
  // Tratar ficheiros .geojson como assets (import devolve o URL).
  assetsInclude: ["**/*.geojson"],
  server: { port: 3000, open: true },
});
