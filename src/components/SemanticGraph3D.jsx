import React, { useMemo, useState } from 'react';

export default function SemanticGraph3D() {
  const [selected, setSelected] = useState('Personal Knowledge Asset OS');
  const nodes = useMemo(() => [
    ['Personal Knowledge Asset OS', 48, 42, 0],
    ['Resume Studio', 66, 30, 1],
    ['Semantic Lab', 58, 62, 2],
    ['Obsidian Source', 34, 58, 3],
    ['Public Projection', 76, 54, 4],
    ['PRD System', 42, 24, 5]
  ], []);

  return (
    <section className="relative min-h-[620px] overflow-hidden rounded border border-slate-700 bg-[radial-gradient(circle_at_center,#1f3b63,#08111f_68%)]">
      <div className="absolute left-5 top-5 z-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-200">3D Prototype</p>
        <h1 className="mt-1 text-2xl font-bold">Knowledge Graph Lab</h1>
        <p className="mt-2 max-w-md text-sm text-slate-300">Opt-in 3D interaction surface. The stable 2D graph remains the default public experience.</p>
      </div>
      <div className="absolute inset-0 perspective-[900px]">
        <div className="absolute inset-14 rotate-x-[58deg] rounded-full border border-blue-300/20" />
        {nodes.map(([label, x, y, depth]) => (
          <button
            key={label}
            className="absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-100/80 bg-white/90 text-[10px] font-bold leading-tight text-slate-900 shadow-[0_0_30px_rgba(96,165,250,0.45)] transition hover:scale-110"
            style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) translateZ(${depth * 10}px)` }}
            onClick={() => setSelected(label)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="absolute bottom-5 left-5 rounded border border-slate-600 bg-slate-950/70 p-3 font-mono text-xs text-blue-100">
        Selected: {selected}
      </div>
    </section>
  );
}
