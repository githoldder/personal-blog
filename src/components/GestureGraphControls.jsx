import React, { useState } from 'react';

export default function GestureGraphControls() {
  const [enabled, setEnabled] = useState(false);

  return (
    <section className="rounded border border-slate-700 bg-slate-900 p-4">
      <h2 className="text-sm font-bold text-white">Gesture Controls</h2>
      <p className="mt-2 text-xs leading-5 text-slate-400">Camera gesture navigation is opt-in. This prototype keeps pointer and keyboard controls primary.</p>
      <button
        className="mt-4 rounded border border-blue-300 px-3 py-2 text-xs font-bold text-blue-100"
        onClick={() => setEnabled(!enabled)}
      >
        {enabled ? 'Disable Gesture Mode' : 'Enable Gesture Mode'}
      </button>
    </section>
  );
}
