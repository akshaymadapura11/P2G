// src/LandUseMap.jsx
import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Circle,
  Marker,
  Popup,
  useMapEvent
} from "react-leaflet";
import L from "leaflet";
import osmtogeojson from "osmtogeojson";
import area from "@turf/area";
import "leaflet/dist/leaflet.css";

// POI + math
const MARKER_COORD = [43.65063986776146, 11.463874101163523];
const CITY_CENTER = L.latLng(43.7696, 11.2558);
const RAW_LITERS = 213070;
const TOTAL_FERT = RAW_LITERS * 0.07;

// Colour map
const LANDUSE_COLORS = {
  farmland: "#FFD700",
  plantation: "#8B4513",
  orchard: "#7FFF00",
  vineyard: "#8B008B",
  greenhouse_horticulture: "#00CED1"
};

export default function LandUseMap({
  radiusKm,
  landuseToggles,
  features = [],
  onDataUpdate
}) {
  // Debounced fetch: waits 500ms after radius changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const radiusM = radiusKm * 1000;
      const [lat, lon] = MARKER_COORD;
      const tags = Object.keys(LANDUSE_COLORS).join("|");
      const query = `
        [out:json][timeout:25];
        way["landuse"~"${tags}"](around:${radiusM},${lat},${lon});
        out body geom;
      `;
      fetch("https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query))
        .then((r) => r.json())
        .then((osmData) => {
          const gj = osmtogeojson(osmData);
          let totalArea = 0;
          gj.features.forEach((f) => {
            f.properties.area = area(f);
            totalArea += f.properties.area;
          });
          gj.features.forEach((f) => {
            f.properties.fertilizer = (f.properties.area / totalArea) * TOTAL_FERT;
          });
          onDataUpdate(gj.features);
        })
        .catch(console.error);
    }, 500);

    return () => clearTimeout(timer);
  }, [radiusKm, onDataUpdate]);

  // Optional: measure distance on click
  function ClickDistance() {
    useMapEvent("click", (e) => {
      const d = CITY_CENTER.distanceTo(e.latlng) / 1000;
      console.log(`Distance: ${d.toFixed(2)} km`);
    });
    return null;
  }

  // Style for each polygon
  const stylePlot = (feature) => ({
    fillColor: LANDUSE_COLORS[feature.properties.landuse] || "#ccc",
    weight: 1,
    color: "#555",
    fillOpacity: 0.6
  });

  // Hover interactions
  const onEachFeature = (feature, layer) => {
    layer.on({
      mouseover: () => {
        layer.setStyle({ weight: 3, fillOpacity: 0.9 });
        layer.bindPopup(
          `Type: ${feature.properties.landuse}<br/>` +
          `Area: ${(feature.properties.area / 1e6).toFixed(2)} km²<br/>` +
          `Fertilizer: ${feature.properties.fertilizer.toFixed(2)} L`
        ).openPopup();
      },
      mouseout: () => {
        layer.setStyle(stylePlot(feature));
        layer.closePopup();
      }
    });
  };

  // Only show toggled features
  const visibleFeatures = features.filter(
    (f) => landuseToggles[f.properties.landuse]
  );

  return (
    <MapContainer
      center={MARKER_COORD}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      {/* Base map: OSM streets, grayscale via CSS */}
      <TileLayer
        className="base-map"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      {/* Search radius */}
      <Circle
        center={MARKER_COORD}
        radius={radiusKm * 1000}
        pathOptions={{ color: "#666", fillOpacity: 0.1 }}
      />

      {/* POI Marker */}
      <Marker position={MARKER_COORD}>
        <Popup>
          <strong>Arno Ovest</strong><br/>
          Raw material: {RAW_LITERS} L<br/>
          Total fertilizer: {TOTAL_FERT.toFixed(2)} L
        </Popup>
      </Marker>

      {/* Land‐use overlays */}
      {visibleFeatures.length > 0 && (
        <GeoJSON
          data={{ type: "FeatureCollection", features: visibleFeatures }}
          style={stylePlot}
          onEachFeature={onEachFeature}
        />
      )}

      <ClickDistance />
    </MapContainer>
  );
}
