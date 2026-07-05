import React, { useState, useEffect, useRef } from 'react';

export default function CanvasViewer({ canvasName }) {
  const [canvasData, setCanvasData] = useState(null);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef(null);

  // 1. 获取 Canvas 缓存数据
  useEffect(() => {
    fetch('/assets/canvas_previews.json')
      .then(res => res.json())
      .then(data => {
        const found = data.files?.find(f => f.name === canvasName || f.name.replace('.canvas', '') === canvasName);
        if (found) {
          setCanvasData(found);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load canvas previews database:', err);
        setLoading(false);
      });
  }, [canvasName]);

  // 2. 监听并推送 Canvas 数据至 iframe
  useEffect(() => {
    if (!canvasData) return;

    const handleMessage = (event) => {
      if (event.data && event.data.type === 'CANVAS_VIEWER_READY' && iframeRef.current) {
        // 推送 Canvas 拓扑结构 JSON 数据
        iframeRef.current.contentWindow.postMessage({
          type: 'CANVAS_DATA',
          payload: canvasData
        }, '*');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [canvasData]);

  if (loading) {
    return (
      <div className="py-12 text-center text-xs font-mono text-slate-400 select-none">
        ⏳ 正在载入 Canvas 拓扑星网...
      </div>
    );
  }

  if (!canvasData) {
    return (
      <div className="p-4 border border-dashed border-slate-200 rounded-md bg-stone-50 text-center text-xs text-slate-450 font-mono">
        ⚠️ 暂无该 Canvas 看板数据。请确认 Obsidian 物理文件存在。
      </div>
    );
  }

  return (
    <div className="space-y-3 my-4">
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 select-none px-1">
        <span>OBSIDIAN CANVAS HIGH-FIDELITY VIEWER</span>
        <span>节点数: {canvasData.nodes?.length || 0} | 连线数: {canvasData.edges?.length || 0}</span>
      </div>
      <div className="w-full h-[78vh] min-h-[720px] border border-slate-200 rounded-md shadow-sm overflow-hidden bg-slate-50">
        <iframe
          ref={iframeRef}
          src="/viewers/canvas.html"
          className="w-full h-full border-none block"
          title="Obsidian Canvas Board"
        />
      </div>
    </div>
  );
}
