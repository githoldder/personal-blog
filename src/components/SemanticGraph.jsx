import React, { useState, useEffect, useRef } from 'react';

export default function SemanticGraph({ initialData }) {
  const containerRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // 记录选中的关联节点和边
  const activeNeighbors = selectedNode
    ? new Set(
        links
          .filter(l => l.source.id === selectedNode.id || l.target.id === selectedNode.id)
          .flatMap(l => [l.source.id, l.target.id])
      )
    : new Set();

  // 1. 初始化数据，预测物理分布
  useEffect(() => {
    if (!initialData || !initialData.nodes) return;

    const w = containerRef.current ? containerRef.current.clientWidth : 800;
    const h = 500;
    setDimensions({ width: w, height: h });

    const initialNodes = initialData.nodes.map(n => ({
      ...n,
      x: w / 2 + (Math.random() - 0.5) * 150,
      y: h / 2 + (Math.random() - 0.5) * 150,
      vx: 0,
      vy: 0
    }));

    const initialLinks = initialData.edges.map(e => {
      const sourceNode = initialNodes.find(n => n.id === e.source);
      const targetNode = initialNodes.find(n => n.id === e.target);
      return {
        ...e,
        source: sourceNode,
        target: targetNode
      };
    }).filter(l => l.source && l.target);

    setNodes(initialNodes);
    setLinks(initialLinks);

    if (initialNodes.length > 0) {
      setSelectedNode(initialNodes[0]);
    }
  }, [initialData]);

  // 2. 简易力导向仿真核心
  useEffect(() => {
    if (nodes.length === 0) return;

    let animFrameId;
    const kLink = 0.04;      
    const restLength = 120;  
    const charge = -1200;    
    const gravity = 0.015;   
    const friction = 0.85;   

    const step = () => {
      const cx = dimensions.width / 2;
      const cy = dimensions.height / 2;

      const fx = new Array(nodes.length).fill(0);
      const fy = new Array(nodes.length).fill(0);

      // 计算斥力
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nA = nodes[i];
          const nB = nodes[j];
          const dx = nB.x - nA.x;
          const dy = nB.y - nA.y;
          const distSq = dx * dx + dy * dy + 0.1;
          const dist = Math.sqrt(distSq);

          if (dist < 400) {
            const force = charge / distSq;
            const forceX = (dx / dist) * force;
            const forceY = (dy / dist) * force;

            fx[i] += forceX;
            fy[i] += forceY;
            fx[j] -= forceX;
            fy[j] -= forceY;
          }
        }
      }

      // 计算弹簧引力
      links.forEach(link => {
        const nA = link.source;
        const nB = link.target;
        const idxA = nodes.indexOf(nA);
        const idxB = nodes.indexOf(nB);

        if (idxA !== -1 && idxB !== -1) {
          const dx = nB.x - nA.x;
          const dy = nB.y - nA.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
          
          const force = kLink * link.weight * (dist - restLength);
          const forceX = (dx / dist) * force;
          const forceY = (dy / dist) * force;

          fx[idxA] += forceX;
          fy[idxA] += forceY;
          fx[idxB] -= forceX;
          fy[idxB] -= forceY;
        }
      });

      // 更新物理量
      const updatedNodes = nodes.map((node, idx) => {
        if (draggedNode && node.id === draggedNode.id) {
          return node;
        }

        const gravX = (cx - node.x) * gravity;
        const gravY = (cy - node.y) * gravity;

        const totalFx = fx[idx] + gravX;
        const totalFy = fy[idx] + gravY;

        const vx = (node.vx + totalFx) * friction;
        const vy = (node.vy + totalFy) * friction;

        let nextX = node.x + vx;
        let nextY = node.y + vy;
        const margin = 20;

        if (nextX < margin) nextX = margin;
        if (nextX > dimensions.width - margin) nextX = dimensions.width - margin;
        if (nextY < margin) nextY = margin;
        if (nextY > dimensions.height - margin) nextY = dimensions.height - margin;

        return {
          ...node,
          x: nextX,
          y: nextY,
          vx,
          vy
        };
      });

      links.forEach(link => {
        link.source = updatedNodes.find(n => n.id === link.source.id);
        link.target = updatedNodes.find(n => n.id === link.target.id);
      });

      setNodes(updatedNodes);
      
      if (selectedNode) {
        const freshSelected = updatedNodes.find(n => n.id === selectedNode.id);
        if (freshSelected) {
          setSelectedNode(freshSelected);
        }
      }

      animFrameId = requestAnimationFrame(step);
    };

    animFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrameId);
  }, [nodes, links, draggedNode, dimensions]);

  const handleMouseDown = (node, e) => {
    e.preventDefault();
    setDraggedNode(node);
  };

  const handleMouseMove = e => {
    if (!draggedNode || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setNodes(prev =>
      prev.map(n =>
        n.id === draggedNode.id
          ? { ...n, x: mouseX, y: mouseY, vx: 0, vy: 0 }
          : n
      )
    );
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const getNodeColor = type => {
    switch (type) {
      case 'resume':
        return {
          fill: '#fef3c7',
          stroke: '#d97706',
          text: '#92400e'
        };
      case 'project':
        return {
          fill: '#dcfce7',
          stroke: '#16a34a',
          text: '#166534'
        };
      case 'deck':
        return {
          fill: '#f3e8ff',
          stroke: '#9333ea',
          text: '#6b21a8'
        };
      case 'note':
      default:
        return {
          fill: '#dbeafe',
          stroke: '#2563eb',
          text: '#1e40af'
        };
    }
  };

  return (
    <div 
      className="grid grid-cols-1 lg:grid-cols-4 gap-6"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        ref={containerRef}
        className="lg:col-span-3 workspace-card p-0 h-[500px] relative overflow-hidden bg-surface-50 cursor-grab active:cursor-grabbing select-none"
      >
        <svg className="w-full h-full">
          <g>
            {links.map((link, idx) => {
              const isSelected = selectedNode && (link.source.id === selectedNode.id || link.target.id === selectedNode.id);
              return (
                <line
                  key={`link-${idx}`}
                  x1={link.source.x}
                  y1={link.source.y}
                  x2={link.target.x}
                  y2={link.target.y}
                  stroke={isSelected ? '#2563eb' : '#d4d4d4'}
                  strokeWidth={isSelected ? 2 : 1}
                  strokeDasharray={link.type === 'tag_overlap' ? '4 4' : '0'}
                  opacity={selectedNode ? (isSelected ? 1.0 : 0.25) : 0.6}
                />
              );
            })}
          </g>

          <g>
            {nodes.map((node) => {
              const color = getNodeColor(node.type);
              const isSelected = selectedNode && node.id === selectedNode.id;
              const isActiveNeighbor = activeNeighbors.has(node.id);
              const radius = node.type === 'resume' ? 24 : 18;

              let opacity = 1.0;
              if (selectedNode) {
                opacity = (isSelected || isActiveNeighbor) ? 1.0 : 0.3;
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  onClick={() => setSelectedNode(node)}
                  onMouseDown={(e) => handleMouseDown(node, e)}
                  style={{ opacity, transition: 'opacity 0.2s' }}
                >
                  <circle
                    r={radius}
                    fill={color.fill}
                    stroke={isSelected ? '#2563eb' : color.stroke}
                    strokeWidth={isSelected ? 3 : 1.5}
                    className="transition-all duration-150 hover:scale-105"
                  />
                  <text
                    dy=".3em"
                    textAnchor="middle"
                    className="font-mono font-bold text-xs select-none pointer-events-none"
                    fill={color.text}
                  >
                    {node.type.slice(0, 2).toUpperCase()}
                  </text>
                  <text
                    y={radius + 15}
                    textAnchor="middle"
                    className="text-[10px] font-medium select-none pointer-events-none fill-surface-700"
                  >
                    {node.label.length > 10 ? `${node.label.slice(0, 9)}...` : node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 text-[10px] font-mono pointer-events-none bg-white/80 backdrop-blur-sm p-2 rounded border border-surface-200">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-100 border border-amber-600 block"></span>
            <span>简历 (RE)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-100 border border-blue-600 block"></span>
            <span>笔记 (NO)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-100 border border-green-600 block"></span>
            <span>项目 (PR)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-100 border border-purple-600 block"></span>
            <span>文稿 (DE)</span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1 workspace-card flex flex-col justify-between h-[500px]">
        {selectedNode ? (
          <div className="space-y-4 overflow-y-auto">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-accent bg-blue-50 px-2 py-0.5 rounded">
                {selectedNode.type}
              </span>
              <h2 className="text-lg font-bold text-surface-900 mt-2">{selectedNode.label}</h2>
              <p className="text-xs text-surface-400 font-mono mt-1 break-all">ID: {selectedNode.id}</p>
            </div>

            {selectedNode.metadata && selectedNode.metadata.summary && (
              <div className="border-t border-surface-100 pt-3">
                <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">简介/概述</h4>
                <p className="text-xs text-surface-600 leading-relaxed">{selectedNode.metadata.summary}</p>
              </div>
            )}

            {selectedNode.metadata && selectedNode.metadata.file && (
              <div className="border-t border-surface-100 pt-3">
                <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">数据源物理路径</h4>
                <code className="text-[10px] text-surface-500 block break-all">{selectedNode.metadata.file}</code>
              </div>
            )}

            <div className="border-t border-surface-100 pt-3">
              <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">关联资产关系网</h4>
              {links.filter(l => l.source.id === selectedNode.id || l.target.id === selectedNode.id).length === 0 ? (
                <p className="text-xs text-surface-400 italic">该资产目前为孤立节点，无直接关系</p>
              ) : (
                <ul className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {links
                    .filter(l => l.source.id === selectedNode.id || l.target.id === selectedNode.id)
                    .map((link, idx) => {
                      const relationNode = link.source.id === selectedNode.id ? link.target : link.source;
                      return (
                        <li 
                          key={`rel-${idx}`}
                          onClick={() => setSelectedNode(relationNode)}
                          className="flex items-center justify-between p-1.5 rounded text-xs bg-surface-50 hover:bg-surface-100 cursor-pointer transition-colors"
                        >
                          <span className="font-medium text-surface-700 truncate max-w-[120px]">{relationNode.label}</span>
                          <span className="text-[9px] font-mono text-surface-400 font-medium px-1 bg-white border border-surface-200 rounded uppercase">
                            {link.type === 'link' ? '双链' : link.type === 'owner' ? '所有' : '标签碰撞'}
                          </span>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center p-4">
            <p className="text-xs text-surface-400 italic">在左侧画布上选择一个节点，以调阅其知识资产契约和关联关系</p>
          </div>
        )}

        {selectedNode && (
          <div className="border-t border-surface-100 pt-4 mt-auto">
            {selectedNode.type === 'resume' && (
              <a href="/resume" className="w-full text-center block text-xs font-medium text-white bg-accent hover:bg-accent-dark py-2 px-3 rounded transition-colors">
                调阅完整简历页面 <span>→</span>
              </a>
            )}
            {selectedNode.type === 'deck' && (
              <a href="/decks" className="w-full text-center block text-xs font-medium text-white bg-accent hover:bg-accent-dark py-2 px-3 rounded transition-colors">
                调阅演示文稿页面 <span>→</span>
              </a>
            )}
            {selectedNode.type === 'note' && (
              <a href="/notes" className="w-full text-center block text-xs font-medium text-white bg-accent hover:bg-accent-dark py-2 px-3 rounded transition-colors">
                调阅个人笔记中心 <span>→</span>
              </a>
            )}
            {selectedNode.type === 'project' && (
              <a href="/projects" className="w-full text-center block text-xs font-medium text-white bg-accent hover:bg-accent-dark py-2 px-3 rounded transition-colors">
                调阅核心项目详情 <span>→</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
