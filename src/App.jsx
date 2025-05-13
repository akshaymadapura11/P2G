// src/App.jsx
import { useState } from "react";
import LandUseMap from "./LandUseMap";

export default function App() {
  const [showMap, setShowMap] = useState(false);

  if (!showMap) {
    return (
      <div className="splash" onClick={() => setShowMap(true)}>
        <img
          src="/logo.png"
          alt="P2Green Logo"
          className="splash-logo"
        />
      </div>
    );
  }

  return (
    <div className="map-container">
      <LandUseMap />
    </div>
  );
}
