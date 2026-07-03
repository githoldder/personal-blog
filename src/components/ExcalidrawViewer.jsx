import React, { useState, useEffect } from 'react';

export default function ExcalidrawViewer({ fileName }) {
  const [excalidrawFile, setExcalidrawFile] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="py-8 text-center text-xs font-mono text-slate-400">
        正在载入 Excalidraw 绘图预览...
      </div>
    );
  }

  if (!excalidrawFile || !excalidrawFile.elements || excalidrawFile.elements.length === 0) {
    return null;
  }

  const { elements, file } = excalidrawFile;

  // 1. 计算所有图形元素的边界，自动剪裁 SVG viewBox
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach(el => {
    // 基础边界
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);

    // polyline 边界校准
    if (el.points && el.points.length > 0) {
      el.points.forEach(p => {
        const px = el.x + p[0];
        const py = el.y + p[1];
        minX = Math.min(minX, px);
        minY = Math.min(minY, py);
        maxX = Math.max(maxX, px);
        maxY = Math.max(maxY, py);
      });
    }
  });

  // 容错保护
  if (minX === Infinity || minY === Infinity) {
    minX = 0; minY = 0; maxX = 800; maxY = 500;
  }

  const padding = 40;
  const viewBoxX = minX - padding;
  const viewBoxY = minY - padding;
  const viewBoxW = Math.max(400, (maxX - minX) + padding * 2);
  const viewBoxH = Math.max(250, (maxY - minY) + padding * 2);

  // 判定是否太复杂，若节点数过多，启动半降级提示
  const isComplex = elements.length > 80;

  return (
    <div className="space-y-4 my-6">
      
      {/* 顶部标题头 */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 select-none">
        <span>🎨 EXCALIDRAW RENDER PREVIEW (MVP VECTORS)</span>
        <span className="text-slate-400 font-bold">{file}</span>
      </div>

      {/* SVG 画布层 */}
      <div className="w-full overflow-hidden border border-slate-200 bg-[#FCFAF8] rounded-lg shadow-sm p-4 relative flex items-center justify-center">
        <svg
          viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}`}
          className="w-full h-auto max-h-[550px] z-10"
        >
          {elements.map((el) => {
            const stroke = el.strokeColor || '#334155';
            const fill = el.backgroundColor === 'transparent' ? 'none' : el.backgroundColor;
            const strokeWidth = el.strokeWidth || 1.5;

            try {
              if (el.type === 'rectangle') {
                return (
                  <rect
                    key={el.id}
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    stroke={stroke}
                    fill={fill}
                    strokeWidth={strokeWidth}
                    rx="3"
                  />
                );
              }

              if (el.type === 'ellipse') {
                return (
                  <ellipse
                    key={el.id}
                    cx={el.x + el.width / 2}
                    cy={el.y + el.height / 2}
                    rx={el.width / 2}
                    ry={el.height / 2}
                    stroke={stroke}
                    fill={fill}
                    strokeWidth={strokeWidth}
                  />
                );
              }

              if (el.type === 'text') {
                // 处理文本换行
                const lines = el.text.split('\n');
                return (
                  <text
                    key={el.id}
                    x={el.x}
                    y={el.y}
                    fill={stroke}
                    fontSize={el.fontSize || 14}
                    fontFamily="var(--font-serif)"
                    textAnchor="start"
                    dominantBaseline="hanging"
                  >
                    {lines.map((line, idx) => (
                      <tspan key={idx} x={el.x} dy={idx === 0 ? 0 : (el.fontSize || 14) * 1.25}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                );
              }

              if ((el.type === 'line' || el.type === 'arrow' || el.type === 'freedraw') && el.points && el.points.length > 0) {
                const pointsStr = el.points
                  .map(p => `${el.x + p[0]},${el.y + p[1]}`)
                  .join(' ');
                
                return (
                  <polyline
                    key={el.id}
                    points={pointsStr}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              }
            } catch (err) {
              console.warn(`[ExcalidrawViewer] Failed to render shape ${el.id}:`, err);
            }

            return null;
          })}
        </svg>

        {/* 复杂手绘图的温和降级遮罩提醒 */}
        {isComplex && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-50 via-stone-50/90 to-transparent p-5 pt-16 flex flex-col items-center text-center z-20 select-none">
            <p className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
              🚧 COMPLEX HAND-DRAWN SCENE AHEAD
            </p>
            <p className="text-xs text-slate-650 font-serif mt-1 max-w-md">
              该手绘草图元素较多（{elements.length} 个图元）。当前网页会优先展示可读的基础向量线稿，复杂绑定和 rough 纹理会以简化形式呈现。
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
