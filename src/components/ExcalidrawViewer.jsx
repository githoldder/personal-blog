import React, { useState, useEffect, useRef } from 'react';

export default function ExcalidrawViewer({ fileName }) {
  const [excalidrawFile, setExcalidrawFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef(null);

  // 1. 获取本地 previews 数据库数据
  useEffect(() => {
    fetch('/assets/excalidraw_previews.json')
      .then(res => res.json())
      .then(data => {
        const found = data.files?.find(f => f.name === fileName || f.file === fileName || f.file === `${fileName}.excalidraw.md`);
        if (found) {
          setExcalidrawFile(found);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load Excalidraw previews database:', err);
        setLoading(false);
      });
  }, [fileName]);

  // 2. 监听 iframe 握手通信并推送 JSON 数据
  useEffect(() => {
    if (!excalidrawFile) return;

    const handleMessage = (event) => {
      if (event.data && event.data.type === 'EXCALIDRAW_VIEWER_READY' && iframeRef.current) {
        // 向 iframe 独立运行沙箱传递高保真 Excalidraw JSON 数据
        iframeRef.current.contentWindow.postMessage({
          type: 'EXCALIDRAW_DATA',
          payload: excalidrawFile
        }, '*');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [excalidrawFile]);

  if (loading) {
    return (
      <div className="py-12 text-center text-xs font-mono text-slate-400 select-none">
        ⏳ 正在载入 Excalidraw 高保真绘图引擎...
      </div>
    );
  }

  if (!excalidrawFile) {
    return null;
  }

  return (
    <div className="space-y-3 my-4">
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 select-none px-1">
        <span>EXCALIDRAW HIGH-FIDELITY VIEWER</span>
        <span className="text-slate-400 font-bold truncate max-w-[48vw]">{excalidrawFile.file}</span>
      </div>
      <div className="w-full h-[78vh] min-h-[720px] border border-slate-200 rounded-md shadow-sm overflow-hidden bg-white">
        <iframe
          ref={iframeRef}
          src="/viewers/excalidraw.html"
          className="w-full h-full border-none block"
          title="Excalidraw Drawing Canvas"
        />
      </div>
    </div>
  );
}
