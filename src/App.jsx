import { useState } from "react";
import LandUseMap from "./LandUseMap";
import Dashboard from "./Dashboard";
import "./App.css";

export default function App() {
  const landuseTypes = [
    "farmland",
    "plantation",
    "orchard",
    "vineyard",
    "greenhouse_horticulture"
  ];

  // Lifted state
  const [radiusKm, setRadiusKm] = useState(5);
  const [toggles, setToggles] = useState(
    landuseTypes.reduce((o, t) => ({ ...o, [t]: true }), {})
  );
  const [features, setFeatures] = useState([]);

  // Callback from map when data fetched
  const handleDataUpdate = (allFeatures) => {
    setFeatures(allFeatures);
  };

  // Toggle handler
  const handleToggle = (type) =>
    setToggles((prev) => ({ ...prev, [type]: !prev[type] }));

  return (
    <div className="app-container">
      <div className="map-pane">
        <LandUseMap
          radiusKm={radiusKm}
          landuseToggles={toggles}
          features={features}
          onDataUpdate={handleDataUpdate}
        />
      </div>
      <div className="details-pane">
        <Dashboard
          radiusKm={radiusKm}
          onRadiusChange={setRadiusKm}
          landuseTypes={landuseTypes}
          toggles={toggles}
          onToggle={handleToggle}
          features={features}
        />
      </div>
    </div>
  );
}
