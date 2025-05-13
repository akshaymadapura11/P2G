// src/LandUseMap.jsx
import { useEffect, useState } from "react";
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
import area from "@turf/area";
import circleTurf from "@turf/circle";
import osmtogeojson from "osmtogeojson";
import "leaflet/dist/leaflet.css";

// Point of interest
const MARKER_COORD = [43.65063986776146, 11.463874101163523];
// City center for distance tool
const CITY_CENTER = L.latLng(43.7696, 11.2558);
// Fertilizer math
const RAW_MATERIAL_LITERS = 213070;
const FERTILIZER_TOTAL = RAW_MATERIAL_LITERS * 0.07;

export default function LandUseMap() {
  const [radiusKm, setRadiusKm] = useState(5);
  const [geojson, setGeojson] = useState(null);
  const [distance, setDistance] = useState(null);

  // Fetch and compute whenever radiusKm changes
  useEffect(() => {
    const radiusM = radiusKm * 1000;
    const [lat, lon] = MARKER_COORD;

    // Overpass query for farmland & plantation around the marker
    const query = `
      [out:json][timeout:25];
      (
        way["landuse"="farmland"](around:${radiusM},${lat},${lon});
        way["landuse"="plantation"](around:${radiusM},${lat},${lon});
      );
      out body geom;
    `;
    fetch("https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query))
      .then(r => r.json())
      .then(osmData => {
        const gj = osmtogeojson(osmData);
        // calculate area & fertilizer share
        let totalArea = 0;
        gj.features.forEach(f => {
          f.properties.area = area(f); // in m²
          totalArea += f.properties.area;
        });
        gj.features.forEach(f => {
          f.properties.fertilizer = (f.properties.area / totalArea) * FERTILIZER_TOTAL;
        });
        setGeojson(gj);
      })
      .catch(console.error);
  }, [radiusKm]);

  // distance on map click
  function ClickDistance() {
    useMapEvent("click", e => {
      const d = CITY_CENTER.distanceTo(e.latlng) / 1000;
      setDistance(d);
    });
    return null;
  }

  // style for plots
  const stylePlot = feature => ({
    fillColor: feature.properties.landuse === "farmland" ? "#FFD700" : "#8B4513",
    weight: 1,
    color: "#000",
    fillOpacity: 0.5
  });

  // hover interactions
  const onEachFeature = (feature, layer) => {
    layer.on({
      mouseover: () => {
        layer.setStyle({ weight: 3, fillOpacity: 0.8 });
        layer.bindPopup(
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

  return (
    <>
      {/* Radius input */}
      <div style={{
        position: "absolute", top: 10, left: 10, zIndex: 1000,
        background: "#fff", padding: 8, borderRadius: 4,
        boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
      }}>
        <label>
          Radius (km):{" "}
          <input
            type="number"
            min="0"
            step="0.5"
            value={radiusKm}
            onChange={e => setRadiusKm(Number(e.target.value))}
            onKeyDown={e => e.key === "Enter" && e.target.blur()}
            style={{ width: "4em" }}
          />
        </label>
      </div>

      {/* Legend */}
      <div style={{
        position: "absolute", bottom: 10, left: 10, zIndex: 1000,
        background: "#fff", padding: 8, borderRadius: 4,
        boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
      }}>
        <div>
          <span style={{
            display: "inline-block",
            width: 12, height: 12,
            background: "#FFD700",
            marginRight: 6
          }}/>Farmland
        </div>
        <div>
          <span style={{
            display: "inline-block",
            width: 12, height: 12,
            background: "#8B4513",
            marginRight: 6
          }}/>Plantation
        </div>
      </div>

      {/* Distance display */}
      <div style={{
        position: "absolute", bottom: 10, right: 10, zIndex: 1000,
        background: "#fff", padding: 8, borderRadius: 4,
        boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
      }}>
        {distance != null
          ? `Distance from center: ${distance.toFixed(2)} km`
          : "Click map to measure"}
      </div>

      <MapContainer
        center={MARKER_COORD}
        zoom={13}
        style={{ height: "100vh", width: "100%" }}
      >
        {/* OSM tiles */}
        <TileLayer
          attribution='© OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Search circle */}
        <Circle
          center={MARKER_COORD}
          radius={radiusKm * 1000}
          pathOptions={{ color: "blue", fillOpacity: 0.1 }}
        />

        {/* Marker */}
        <Marker position={MARKER_COORD}>
          <Popup>
            <strong>Arno Ovest</strong><br/>
            Fertilizer plant<br/>
            Raw material: {RAW_MATERIAL_LITERS} L<br/>
            Total fertilizer: {FERTILIZER_TOTAL.toFixed(2)} L
          </Popup>
        </Marker>

        {/* Land-use plots */}
        {geojson && (
          <GeoJSON
            key={radiusKm}
            data={geojson}
            style={stylePlot}
            onEachFeature={onEachFeature}
          />
        )}

        <ClickDistance />
      </MapContainer>
    </>
  );
}
