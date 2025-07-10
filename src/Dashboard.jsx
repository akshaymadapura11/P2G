// src/Dashboard.jsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import "./App.css";

const COLORS = {
  farmland: "#FFD700",
  plantation: "#8B4513",
  orchard: "#7FFF00",
  vineyard: "#8B008B",
  greenhouse_horticulture: "#00CED1"
};

// Conversion constants
const TOTAL_URINE_L = 213070;        // liters of urine collected
const PRODUCTION_RATIO = 7 / 100;    // 7 L fertilizer per 100 L urine
const TOTAL_PRODUCTION_L = TOTAL_URINE_L * PRODUCTION_RATIO;  // L produced

const REQUIRED_KG_PER_HA = 160;      // 160 kg fertilizer needed per hectare

export default function Dashboard({
  radiusKm,
  onRadiusChange,
  landuseTypes,
  toggles,
  onToggle,
  features
}) {
  // 1) Compute total fertilizer production (liters)
  const totalProduction = TOTAL_PRODUCTION_L;

  // 2) Compute total requirement in kg, summing only toggled plots
  const totalRequirementKg = features
    .filter(f => toggles[f.properties.landuse])
    .reduce((sum, f) => {
      const areaHa = f.properties.area / 10000;          // m² → ha
      return sum + areaHa * REQUIRED_KG_PER_HA;           // kg
    }, 0);

  // 3) Total area for display
  const totalAreaKm2 = features.reduce((sum, f) => sum + f.properties.area, 0) / 1e6;

  // 4) Prepare pie‐chart data (area by type)
  const chartData = landuseTypes.map(type => {
    const area = features
      .filter(f => toggles[type] && f.properties.landuse === type)
      .reduce((s, f) => s + f.properties.area, 0);
    return { name: type.replace(/_/g, " "), value: area };
  });

  return (
    <div className="details-pane dashboard-pane">
      <h2>Land Use Dashboard</h2>

      {/* Radius Control */}
      <div className="card">
        <h3>Search Radius</h3>
        <div className="radius-input">
          <label>Radius (km):</label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={radiusKm}
            onChange={e => onRadiusChange(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="card">
        <h3>Summary</h3>
        <p><strong>Total Area:</strong> {totalAreaKm2.toFixed(2)} km²</p>
        <p><strong>Production:</strong> {totalProduction.toFixed(2)} L</p>
        <p><strong>Requirement:</strong> {totalRequirementKg.toFixed(0)} kg</p>
      </div>

      {/* Layer Toggles */}
      <div className="card">
        <h3>Show / Hide Layers</h3>
        <ul className="toggle-list">
          {landuseTypes.map(type => (
            <li key={type}>
              <input
                type="checkbox"
                id={`toggle-${type}`}
                checked={toggles[type]}
                onChange={() => onToggle(type)}
              />
              <label htmlFor={`toggle-${type}`}>
                <span
                  className="color-swatch"
                  style={{ background: COLORS[type] }}
                />
                {type.replace(/_/g, " ")}
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Area Distribution Chart */}
      <div className="card">
        <h3>Area Distribution</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={3}
                label={entry =>
                  `${entry.name}: ${(entry.value / 1e6).toFixed(2)} km²`
                }
              >
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={COLORS[entry.name.replace(/ /g, "_")]} />
                ))}
              </Pie>
              <Tooltip formatter={val => [(val / 1e6).toFixed(2) + " km²"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
