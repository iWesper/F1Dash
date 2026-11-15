import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Migrated from Create React App: env vars keep the REACT_APP_ prefix so
  // existing .env files keep working.
  envPrefix: ["VITE_", "REACT_APP_"],
  // Treat .geojson files as assets (importing one yields its URL).
  assetsInclude: ["**/*.geojson"],
  server: { port: 3000, open: true },
});
