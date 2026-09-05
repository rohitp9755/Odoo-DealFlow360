import React from 'react';

export default function RiskBadge({ band }) {
  const cls = {
    LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', VERY_HIGH: 'badge-very_high'
  }[band] || 'badge-low';
  const label = { LOW: 'Low Risk', MEDIUM: 'Medium Risk', HIGH: 'High Risk', VERY_HIGH: 'Very High Risk' }[band] || band;
  return <span className={`badge ${cls}`}>{label}</span>;
}
