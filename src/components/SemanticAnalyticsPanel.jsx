import React from 'react';

export default function SemanticAnalyticsPanel() {
  const metrics = [
    ['Chunks', 'deterministic'],
    ['Vectors', 'hash-v1'],
    ['Clusters', 'type taxonomy'],
    ['WebGPU', 'feature gated']
  ];

  return (
    <section className="rounded border border-slate-700 bg-slate-900 p-4">
      <h2 className="text-sm font-bold text-white">Semantic Analytics</h2>
      <div className="mt-3 grid gap-2">
        {metrics.map(([label, value]) => (
          <div className="flex items-center justify-between rounded border border-slate-800 bg-slate-950 px-3 py-2 text-xs" key={label}>
            <span className="text-slate-400">{label}</span>
            <span className="font-mono text-blue-200">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
