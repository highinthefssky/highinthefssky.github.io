import React from 'react';
import { BarChart3 } from 'lucide-react';
import { HARDWARE_METRICS, COMPARISON_TABLE } from '../../data/msfsHistory';

export default function HardwareChartsAndTable() {
  // Log-scale height calculation for RAM (8 MB -> 16,384 MB)
  const getRamHeightPct = (ramMB) => {
    const minLog = Math.log2(4); // 2
    const maxLog = Math.log2(16384); // 14
    const valLog = Math.log2(ramMB);
    return Math.round(((valLog - minLog) / (maxLog - minLog)) * 100);
  };

  // Linear-scale height calculation for local storage (0 -> 150 GB)
  const getStorageHeightPct = (gb) => {
    if (gb < 2) return Math.max(4, Math.round((gb / 150) * 100) + 3);
    return Math.round((gb / 150) * 100);
  };

  return (
    <section id="hardware-specs" tabIndex={-1} className="section-container">
      <div className="section-header">
        <div className="section-eyebrow">
          <BarChart3 size={14} />
          <span>04 · Comparative Data &amp; Hardware Evolution</span>
        </div>
        <h2 className="section-title">
          RAM Climbed 2,048× Since 1997, While Thin-Client Streaming Cut Storage by Two-Thirds
        </h2>
        <p className="section-subtitle">
          Minimum PC memory expanded from 8 MB in FS98 to 16 GB in MSFS 2024 (with 64 GB
          recommended for ideal setups), whereas local storage peaked at 150 GB in MSFS 2020 before
          MSFS 2024’s cloud architecture reduced the base footprint back to 50 GB.
        </p>
      </div>

      <div className="charts-grid">
        {/* RAM Chart (Log Scale) */}
        <div className="chart-card">
          <div className="chart-card-head">
            <div>
              <h3>Minimum System RAM (Log Scale, MB)</h3>
              <p className="chart-card-sub">Windows 95/XP baselines (FSX: 256 MB XP / 512 MB Vista)</p>
            </div>
            <span className="chart-highlight-badge">2,048× Increase</span>
          </div>

          <div className="bar-chart-stage" role="img" aria-label="Minimum System RAM log-scale chart from 8 MB in FS98 to 16 GB in MSFS 2024">
            {HARDWARE_METRICS.map((m) => (
              <div key={`ram-${m.version}`} className="bar-col">
                <span className="bar-value">{m.ramLabel}</span>
                <div
                  className={`bar-fill tier-${m.tier}`}
                  style={{ height: `${getRamHeightPct(m.ramMB)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="bar-labels">
            {HARDWARE_METRICS.map((m) => (
              <div key={`ram-lbl-${m.version}`}>
                <div className="bar-label-name">{m.version}</div>
                <div className="bar-label-year">{m.year}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Storage Chart (Linear Scale) */}
        <div className="chart-card">
          <div className="chart-card-head">
            <div>
              <h3>Minimum Local Storage Space (Linear, GB)</h3>
              <p className="chart-card-sub">Peaked at 150 GB locally before thin-client streaming</p>
            </div>
            <span className="chart-highlight-badge">−67% Thin-Client Drop</span>
          </div>

          <div className="bar-chart-stage" role="img" aria-label="Minimum Local Storage chart peaking at 150 GB in MSFS 2020 and dropping to 50 GB in MSFS 2024">
            {HARDWARE_METRICS.map((m) => (
              <div key={`hdd-${m.version}`} className="bar-col">
                <span className="bar-value">{m.storageLabel}</span>
                <div
                  className={`bar-fill tier-${m.tier}`}
                  style={{ height: `${getStorageHeightPct(m.storageGB)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="bar-labels">
            {HARDWARE_METRICS.map((m) => (
              <div key={`hdd-lbl-${m.version}`}>
                <div className="bar-label-name">{m.version}</div>
                <div className="bar-label-year">{m.year}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Complete Evolution Comparison Table */}
      <div className="section-header" style={{ marginBottom: '1.25rem' }}>
        <div className="section-eyebrow">
          <span>Complete Specification Comparison Matrix (1982–2026)</span>
        </div>
        <p className="section-subtitle" style={{ fontSize: '0.92rem' }}>
          Note: Official minimum RAM and storage figures for early DOS floppy-disk releases (MSFS
          1.0, 3.0, and 5.0) are not verified in archived specification records and are labeled
          accordingly rather than extrapolated.
        </p>
      </div>

      <div className="table-scroll-wrap" tabIndex={0} role="region" aria-label="Scrollable hardware comparison">
        <table className="spec-table">
          <caption>Microsoft Flight Simulator hardware and feature comparison</caption>
          <thead>
            <tr>
              <th>Version</th>
              <th>Release Year</th>
              <th>Minimum RAM / Storage</th>
              <th>Graphics Tech</th>
              <th>World Coverage</th>
              <th>Multiplayer / Live Features</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_TABLE.map((row) => (
              <tr key={row.version}>
                <td>{row.version}</td>
                <td>{row.year}</td>
                <td>{row.ramStorage}</td>
                <td>{row.graphics}</td>
                <td>{row.coverage}</td>
                <td>{row.multiplayer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
