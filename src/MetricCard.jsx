// src/MetricCard.jsx

import './Dashboard.css';

export default function MetricCard({ title, value, isLoading }) {
  return (
    <div className="metric-card">
      <p className="metric-title">{title}</p>
      {isLoading ? (
        <p className="metric-value loading">--</p>
      ) : (
        <p className="metric-value">{value}</p>
      )}
    </div>
  );
}