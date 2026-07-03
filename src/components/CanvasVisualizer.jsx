import React, { useState, useEffect, useRef } from 'react';

export default function CanvasVisualizer({ canvasData, excalidrawData }) {
  const [selectedItem, setSelectedItem] = useState(null); // { type: 'canvas'|'excalidraw', name: '...' }
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  
  const isDraggingRef = useRef(false);
  const startDragRef = useRef({ x: 0, y: 0 });
  const viewportRef = useRef(null);

  // 当选择不同白板时，自动重置平移缩放
  useEffect(() => {
    handleFitToView();
  }, [selectedItem]);

  // 获取当前激活渲染的数据源
  const getActiveObject = () => {
    if (!selectedItem) return null;
    if (selectedItem.type === 'canvas') {
      return (canvasData?.files || []).find(f => f.name === selectedItem.name);
    } else {
      return (excalidrawData?.files || []).find(f => f.name === selectedItem.name);
    }
  };

  const activeObj = getActiveObject();

  // 自适应视口 (Fit-to-view) 计算
  const handleFitToView = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);

    if (!activeObj) return;
    
    // 如果无报错，计算 bounding box
    if (!activeObj.error) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      
      if (selectedItem?.type === 'canvas') {
        const nodes = activeObj.nodes || [];
        if (nodes.length === 0) return;
        nodes.forEach(n => {
          minX = Math.min(minX, n.x);
          maxX = Math.max(maxX, n.x + n.width);
          minY = Math.min(minY, n.y);
          maxY = Math.max(maxY, n.y + n.height);
        });
      } else {
        const elements = activeObj.elements || [];
        if (elements.length === 0) return;
        elements.forEach(el => {
          minX = Math.min(minX, el.x);
          maxX = Math.max(maxX, el.x + el.width);
          minY = Math.min(minY, el.y);
          maxY = Math.max(maxY, el.y + el.height);
        });
      }

      if (minX === Infinity) return;

      const w = maxX - minX;
      const h = maxY - minY;
      const containerW = viewportRef.current ? viewportRef.current.clientWidth : 600;
      const containerH = viewportRef.current ? viewportRef.current.clientHeight : 450;

      // 缩放计算
      const scaleX = (containerW - 80) / w;
      const scaleY = (containerH - 80) / h;
      const fitScale = Math.max(0.15, Math.min(2.0, Math.min(scaleX, scaleY)));

      setZoom(fitScale);
      // 平移居中
      setPanX(containerW / 2 - (minX + w / 2) * fitScale);
      setPanY(containerH / 2 - (minY + h / 2) * fitScale);
    }
  };

  // 鼠标拖拽平移事件
  const handlePointerDown = (e) => {
    if (e.button !== 0) return; // 只响应左键
    isDraggingRef.current = true;
    startDragRef.current = { x: e.clientX - panX, y: e.clientY - panY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    setPanX(e.clientX - startDragRef.current.x);
    setPanY(e.clientY - startDragRef.current.y);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Canvas 节点底色映射 (Obsidian 标准卡片色)
  const getCanvasColor = (color) => {
    switch (String(color)) {
      case '1': return 'bg-[#FDF6E2] border-[#F5E1A4] text-[#785b00]';
      case '2': return 'bg-[#FDF0E2] border-[#F5CE9F] text-[#8a5d25]';
      case '3': return 'bg-[#E8F8F0] border-[#B2E6CC] text-[#216b43]';
      case '4': return 'bg-[#E6F3FB] border-[#A3D1F0] text-[#1c537d]';
      case '5': return 'bg-[#F5EDF9] border-[#D6BCED] text-[#5c2a8c]';
      case '6': return 'bg-[#FDECEB] border-[#F5B4B0] text-[#8a2620]';
      default: return 'bg-white border-slate-200 text-slate-700';
    }
  };

  // 合并列表以进行统一双栏呈现
  const canvasList = canvasData?.files || [];
  const excalidrawList = excalidrawData?.files || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      
      {/* Left Pane: Files Selection Rail (4/12 width) */}
      <div className="lg:col-span-4 space-y-6 select-none">
        
        {/* Canvas Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center border-b border-slate-200 pb-1 mb-2 font-mono text-[9px] font-bold text-slate-400 tracking-widest uppercase">
            <span>Obsidian Canvas Registry</span>
            <span>{canvasList.length} items</span>
          </div>
          <div className="space-y-2">
            {canvasList.map(item => (
              <button
                key={item.name}
                onClick={() => setSelectedItem({ type: 'canvas', name: item.name })}
                className={`w-full text-left p-3.5 border rounded-md transition-all flex flex-col justify-between gap-1.5 ${
                  selectedItem?.type === 'canvas' && selectedItem?.name === item.name
                    ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-300'
                    : 'bg-white border-slate-200/60 hover:border-slate-350'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 text-rose-800 bg-rose-50 border border-rose-200/50 rounded uppercase">
                    CANVAS
                  </span>
                  {item.error ? (
                    <span className="text-[8px] font-mono font-bold text-red-700 bg-red-50 px-1 py-0.2 rounded">❌ ERROR</span>
                  ) : (
                    <span className="text-[8px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">🟢 准入</span>
                  )}
                </div>
                <span className="font-serif font-bold text-sm text-slate-800">{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Excalidraw Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center border-b border-slate-200 pb-1 mb-2 font-mono text-[9px] font-bold text-slate-400 tracking-widest uppercase">
            <span>Excalidraw Vector Sketches</span>
            <span>{excalidrawList.length} items</span>
          </div>
          <div className="space-y-2">
            {excalidrawList.map(item => (
              <button
                key={item.name}
                onClick={() => setSelectedItem({ type: 'excalidraw', name: item.name })}
                className={`w-full text-left p-3.5 border rounded-md transition-all flex flex-col justify-between gap-1.5 ${
                  selectedItem?.type === 'excalidraw' && selectedItem?.name === item.name
                    ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-300'
                    : 'bg-white border-slate-200/60 hover:border-slate-350'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 text-emerald-800 bg-emerald-50 border border-emerald-200/50 rounded uppercase">
                    SKETCH
                  </span>
                  {item.error ? (
                    <span className="text-[8px] font-mono font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded">⚠ UNREADABLE</span>
                  ) : (
                    <span className="text-[8px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">🟢 准入</span>
                  )}
                </div>
                <span className="font-serif font-bold text-sm text-slate-800">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Pane: Visualizer Workspace (8/12 width) */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        
        {/* Title and Controls bar */}
        <div className="border border-slate-200/60 rounded-md p-3 bg-stone-50/50 flex items-center justify-between gap-3 text-xs font-mono select-none">
          <span className="font-bold text-slate-700 truncate max-w-sm">
            🖥️ {selectedItem ? `预览: ${selectedItem.name}` : '未选中任何白板文件'}
          </span>
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={() => setZoom(z => Math.max(0.1, z - 0.15))}
              className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 font-bold rounded"
              disabled={!selectedItem}
            >
              －
            </button>
            <span className="px-2 py-1 text-slate-500 min-w-14 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button 
              onClick={() => setZoom(z => Math.min(3, z + 0.15))}
              className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 font-bold rounded"
              disabled={!selectedItem}
            >
              ＋
            </button>
            <button 
              onClick={handleFitToView}
              className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-800 font-bold rounded hover:bg-rose-100/60"
              disabled={!selectedItem}
            >
              视口居中 ↺
            </button>
          </div>
        </div>

        {/* The Workspace Box */}
        <div 
          ref={viewportRef}
          className="h-[520px] relative border border-slate-200 rounded-md bg-stone-50 overflow-hidden cursor-grab active:cursor-grabbing select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ touchAction: 'none' }}
        >
          {/* Faint coordinates grid lines background */}
          <div className="absolute inset-0 pointer-events-none grid-bg opacity-30"></div>

          {!selectedItem ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 font-serif p-8 text-center bg-white/60">
              <span className="text-4xl mb-3">🎨</span>
              <p class="font-bold text-slate-700 text-sm">白板预览工作台</p>
              <p class="text-xs max-w-sm mt-1">请从左侧栏选择任何一个 GTD 看板 (.canvas) 或 Excalidraw 手稿 (.excalidraw.md) 进行几何向量还原预览。</p>
            </div>
          ) : activeObj?.error ? (
            // Error parser display card (P0 Compliant)
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-[#FFF8F8] text-center select-text">
              <span className="text-3xl mb-2">⚠️</span>
              <h4 className="font-serif font-bold text-red-800 text-sm">白板文件几何渲染失败</h4>
              <code className="text-[10px] font-mono text-red-600 border border-red-200 bg-red-50 p-3 rounded-md max-w-md mt-3 leading-relaxed text-left block overflow-x-auto">
                {activeObj.error}
              </code>
              <p className="text-[9px] text-slate-400 font-mono mt-4 uppercase">
                SOURCE: {selectedItem.type === 'canvas' ? '00-Projects/000_个人看板' : '02-Resources/Excalidraw'}/{selectedItem.name}
              </p>
            </div>
          ) : (
            // RENDER GRAPHICS VIEWPORT
            <div 
              className="absolute origin-top-left transition-transform duration-75 pointer-events-none"
              style={{
                transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
              }}
            >
              {selectedItem.type === 'canvas' ? (
                // 1. Obsidian Canvas Render (.canvas)
                <div className="relative">
                  {/* Render Edges */}
                  <svg className="absolute overflow-visible pointer-events-none z-0" style={{ left: 0, top: 0 }}>
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 2 L 10 5 L 0 8 z" fill="#94a3b8" />
                      </marker>
                    </defs>
                    {(activeObj.edges || []).map((edge, idx) => {
                      const fromNode = (activeObj.nodes || []).find(n => n.id === edge.fromNode);
                      const toNode = (activeObj.nodes || []).find(n => n.id === edge.toNode);
                      if (!fromNode || !toNode) return null;

                      // 计算起终点 (简化：从中心连接)
                      const x1 = fromNode.x + fromNode.width / 2;
                      const y1 = fromNode.y + fromNode.height / 2;
                      const x2 = toNode.x + toNode.width / 2;
                      const y2 = toNode.y + toNode.height / 2;

                      return (
                        <line
                          key={`canvas-edge-${idx}`}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#94a3b8"
                          strokeWidth="1.5"
                          markerEnd="url(#arrow)"
                          opacity="0.85"
                        />
                      );
                    })}
                  </svg>

                  {/* Render Nodes */}
                  {(activeObj.nodes || []).map((node) => {
                    const colorClass = getCanvasColor(node.color);
                    return (
                      <div
                        key={node.id}
                        className={`absolute border rounded p-4 overflow-hidden z-10 flex flex-col justify-start ${colorClass}`}
                        style={{
                          left: `${node.x}px`,
                          top: `${node.y}px`,
                          width: `${node.width}px`,
                          height: `${node.height}px`,
                        }}
                      >
                        {node.type === 'group' ? (
                          <div className="w-full h-full border-2 border-dashed border-slate-350 opacity-40 flex items-center justify-center text-[10px] font-mono uppercase">
                            Group Group
                          </div>
                        ) : (
                          <div className="text-[10px] font-serif leading-relaxed h-full overflow-y-auto whitespace-pre-wrap">
                            {node.text}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                // 2. Excalidraw Sketch Render (.excalidraw.md)
                <svg className="overflow-visible pointer-events-none">
                  {(activeObj.elements || []).map((el, idx) => {
                    if (el.type === 'rectangle') {
                      return (
                        <rect
                          key={`ex-rect-${idx}`}
                          x={el.x}
                          y={el.y}
                          width={el.width}
                          height={el.height}
                          stroke={el.strokeColor}
                          fill={el.backgroundColor !== 'transparent' ? el.backgroundColor : 'none'}
                          strokeWidth={el.strokeWidth}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          rx="4"
                        />
                      );
                    } else if (el.type === 'ellipse') {
                      return (
                        <ellipse
                          key={`ex-ell-${idx}`}
                          cx={el.x + el.width / 2}
                          cy={el.y + el.height / 2}
                          rx={el.width / 2}
                          ry={el.height / 2}
                          stroke={el.strokeColor}
                          fill={el.backgroundColor !== 'transparent' ? el.backgroundColor : 'none'}
                          strokeWidth={el.strokeWidth}
                        />
                      );
                    } else if (el.type === 'text') {
                      return (
                        <text
                          key={`ex-text-${idx}`}
                          x={el.x}
                          y={el.y + 14}
                          fill={el.strokeColor}
                          fontSize={Math.max(10, el.fontSize - 4)}
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {el.text}
                        </text>
                      );
                    } else if (el.type === 'line' || el.type === 'arrow' || el.type === 'draw') {
                      if (!el.points || el.points.length === 0) return null;
                      const pointsStr = el.points
                        .map(([px, py]) => `${el.x + px},${el.y + py}`)
                        .join(' ');
                      return (
                        <g key={`ex-line-group-${idx}`}>
                          <polyline
                            points={pointsStr}
                            stroke={el.strokeColor}
                            fill="none"
                            strokeWidth={el.strokeWidth}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {el.type === 'arrow' && el.points.length >= 2 && (
                            // 折线箭角简单画法 (取最后两点指向)
                            <circle
                              cx={el.x + el.points[el.points.length - 1][0]}
                              cy={el.y + el.points[el.points.length - 1][1]}
                              r="2.5"
                              fill={el.strokeColor}
                            />
                          )}
                        </g>
                      );
                    }
                    return null;
                  })}
                </svg>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
