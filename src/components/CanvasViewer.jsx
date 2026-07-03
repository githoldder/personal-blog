import React, { useState, useEffect } from 'react';

export default function CanvasViewer({ canvasName }) {
  const [canvasData, setCanvasData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="py-8 text-center text-xs font-mono text-slate-400">
        正在载入 Canvas 拓扑数据库...
      </div>
    );
  }

  if (!canvasData || !canvasData.nodes || canvasData.nodes.length === 0) {
    return (
      <div className="p-4 border border-dashed border-slate-200 rounded-md bg-stone-50 text-center text-xs text-slate-400 font-mono">
        ⚠️ 暂无该 Canvas 看板数据。请确认 Obsidian 原文件内容正确。
      </div>
    );
  }

  const { nodes, edges } = canvasData;

  // 计算节点的包围盒 (Bounding Box) 确定画幅大小
  const minX = Math.min(...nodes.map(n => n.x)) - 100;
  const minY = Math.min(...nodes.map(n => n.y)) - 100;
  const maxX = Math.max(...nodes.map(n => n.x + n.width)) + 100;
  const maxY = Math.max(...nodes.map(n => n.y + n.height)) + 100;

  const width = Math.max(800, maxX - minX);
  const height = Math.max(500, maxY - minY);

  // 坐标平移量，保证图形渲染在可视区正中央
  const offsetX = -minX;
  const offsetY = -minY;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 select-none">
        <span>🖼️ OBSIDIAN CANVAS TOPOLOGY PREVIEW</span>
        <span>画布尺寸: {Math.round(width)} x {Math.round(height)}</span>
      </div>

      <div className="w-full overflow-auto border border-slate-200 bg-stone-50 rounded-lg max-h-[580px] shadow-inner select-text relative">
        
        {/* SVG 连线背景层 */}
        <svg 
          style={{ width: width, height: height, position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          className="z-0"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 2 L 10 5 L 0 8 z" fill="#cbd5e1" />
            </marker>
          </defs>

          {edges.map((edge) => {
            const from = nodes.find(n => n.id === edge.fromNode);
            const to = nodes.find(n => n.id === edge.toNode);
            if (!from || !to) return null;

            // 粗略连线计算 (从起点卡片中心连向终点卡片中心)
            const x1 = from.x + from.width / 2 + offsetX;
            const y1 = from.y + from.height / 2 + offsetY;
            const x2 = to.x + to.width / 2 + offsetX;
            const y2 = to.y + to.height / 2 + offsetY;

            return (
              <line
                key={edge.id}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#cbd5e1"
                strokeWidth="1.5"
                strokeDasharray="4 2"
                markerEnd="url(#arrow)"
              />
            );
          })}
        </svg>

        {/* 绝对定位节点层 */}
        <div style={{ width: width, height: height, position: 'relative' }} className="z-10">
          {nodes.map((node) => {
            const nodeStyle = {
              position: 'absolute',
              left: node.x + offsetX,
              top: node.y + offsetY,
              width: node.width,
              height: node.height,
            };

            // 根据节点类型做卡片高光样式修饰
            const isFile = node.type === 'file';
            const cardBg = isFile 
              ? 'bg-rose-50/90 border-rose-200 text-rose-900 shadow-sm' 
              : 'bg-white/90 border-slate-200 text-slate-800 shadow-sm';

            return (
              <div 
                key={node.id} 
                style={nodeStyle} 
                className={`p-3 border rounded-md font-sans text-xs flex flex-col justify-between overflow-hidden ${cardBg}`}
              >
                <div className="font-serif leading-relaxed overflow-y-auto select-text break-words">
                  {isFile ? (
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-rose-500 font-bold uppercase tracking-wider block">📄 File Link</span>
                      <strong className="font-serif text-slate-800">{node.file || '关联文档'}</strong>
                    </div>
                  ) : (
                    node.text || '（空文本节点）'
                  )}
                </div>
                
                <span className="text-[8px] font-mono text-slate-350 block mt-2 text-right select-none">
                  {node.type?.toUpperCase()} CARD
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
