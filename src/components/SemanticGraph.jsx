import React, { useState, useEffect, useRef } from 'react';

export default function SemanticGraph() {
  // 1. 核心状态管理 (保留选中、检索高亮状态)
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredGroup, setHoveredGroup] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Canvas Transform (平移与缩放) - 初始值设为较小比例，能尽收眼底
  const [zoom, setZoom] = useState({ x: 180, y: 90, k: 0.52 });
  
  // 节点和群组数据
  const [groups, setGroups] = useState([]);
  const [nodes, setNodes] = useState([]);
  
  // Refs
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const [dimensions, setDimensions] = useState({ width: 950, height: 600 });

  // 视口尺寸监听
  useEffect(() => {
    const handleResize = () => {
      const w = containerRef.current ? containerRef.current.clientWidth : 950;
      const h = containerRef.current ? containerRef.current.clientHeight || 600 : 600;
      setDimensions({ width: w, height: h });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Concentric 极坐标同心环平铺算法
  const layoutChildrenInCircle = (cx, cy, childrenList) => {
    if (!childrenList || childrenList.length === 0) return [];
    
    const arranged = [];
    let ring = 0;
    let countPlaced = 0;
    
    while (countPlaced < childrenList.length) {
      if (ring === 0) {
        const node = { ...childrenList[countPlaced] };
        node.x = cx;
        node.y = cy;
        arranged.push(node);
        countPlaced++;
        ring++;
        continue;
      }
      
      const ringRadius = ring * 16; // 环间距 16px
      const maxOnRing = ring * 6;
      const toPlace = Math.min(maxOnRing, childrenList.length - countPlaced);
      
      for (let i = 0; i < toPlace; i++) {
        const angle = (i / toPlace) * 2 * Math.PI + (ring * 0.12);
        const node = { ...childrenList[countPlaced] };
        node.x = cx + ringRadius * Math.cos(angle);
        node.y = cy + ringRadius * Math.sin(angle);
        arranged.push(node);
        countPlaced++;
      }
      
      ring++;
    }
    
    return arranged;
  };

  // 纯 JS 大气泡力学排开碰撞算法 (Verlet)
  const layoutGroups = (groupList, width, height) => {
    const cx = width / 2;
    const cy = height / 2;

    groupList.forEach((g, idx) => {
      const angle = (idx / groupList.length) * 2 * Math.PI;
      const r = 100 + Math.random() * 80;
      g.x = cx + r * Math.cos(angle);
      g.y = cy + r * Math.sin(angle);
      g.vx = 0;
      g.vy = 0;
    });

    const iterations = 200;
    const gravity = 0.015;
    const friction = 0.82;

    for (let step = 0; step < iterations; step++) {
      const fx = new Array(groupList.length).fill(0);
      const fy = new Array(groupList.length).fill(0);

      for (let i = 0; i < groupList.length; i++) {
        for (let j = i + 1; j < groupList.length; j++) {
          const gA = groupList[i];
          const gB = groupList[j];
          const dx = gB.x - gA.x;
          const dy = gB.y - gA.y;
          const distSq = dx * dx + dy * dy + 0.1;
          const dist = Math.sqrt(distSq);

          const minDist = gA.R + gB.R + 32; // 安全间隙
          if (dist < minDist) {
            const overlap = minDist - dist;
            const force = -0.55 * overlap;
            const forceX = (dx / dist) * force;
            const forceY = (dy / dist) * force;

            fx[i] += forceX;
            fy[i] += forceY;
            fx[j] -= forceX;
            fy[j] -= forceY;
          } else {
            const force = -1500 / distSq;
            const forceX = (dx / dist) * force;
            const forceY = (dy / dist) * force;
            fx[i] += forceX;
            fy[i] += forceY;
            fx[j] -= forceX;
            fy[j] -= forceY;
          }
        }
      }

      groupList.forEach((g, idx) => {
        const gravX = (cx - g.x) * gravity;
        const gravY = (cy - g.y) * gravity;

        g.vx = (g.vx + fx[idx] + gravX) * friction;
        g.vy = (g.vy + fy[idx] + gravY) * friction;

        g.x += g.vx;
        g.y += g.vy;
      });
    }
  };

  // 自适应分流逻辑：按照真实业务标签聚集成圈，排除“技术性”容器级标签
  const getSubGroupForNode = (node) => {
    // 1. 优先提取真正的业务标签，强制滤除 'obsidian'、'excalidraw'、'canvas'
    if (node.metadata?.tags && node.metadata.tags.length > 0) {
      const validTags = node.metadata.tags.filter(t => {
        const lower = t.toLowerCase();
        return lower !== 'obsidian' && lower !== 'excalidraw' && lower !== 'canvas';
      });
      if (validTags.length > 0) {
        const cleanTag = validTags[0].replace(/^\d+_/, '');
        return `专题: ${cleanTag}`;
      }
    }
    
    // 2. 无有效业务标签时，按首字符类型进行分流
    const label = node.label || '';
    if (!label) return '其他随想';
    
    const char = label.trim().charAt(0);
    if (/[a-zA-Z]/.test(char)) {
      const upper = char.toUpperCase();
      if (upper >= 'A' && upper <= 'M') return '文档 (A-M)';
      return '文档 (N-Z)';
    }
    
    // 3. 中文按照首字 Hash 分流到 5 个具有中文美学色彩的虚拟大圆里
    const charCode = char.charCodeAt(0);
    const bucket = charCode % 5;
    const bucketNames = ['自学技术累积', '个人成长探索', '方法论与实践', '信息获取沉淀', '随想与思考碎片'];
    return bucketNames[bucket];
  };

  // 全量载入与聚类排布
  useEffect(() => {
    let active = true;

    Promise.all([
      fetch('/assets/search-index.json').then(res => res.json().catch(() => [])),
      fetch('/assets/graphs/cross_scope_index.json').then(res => res.json().catch(() => ({ node_to_scope: {} })))
    ])
      .then(([searchIndex, indexData]) => {
        if (!active) return;

        const allDocs = Array.isArray(searchIndex) ? searchIndex : [];
        const groupsMap = new Map();

        allDocs.forEach(doc => {
          const rawId = doc.id;
          const id = rawId.startsWith('note:') || rawId.startsWith('book:') || rawId.startsWith('project:') ? rawId : `note:${rawId}`;
          
          let scope = indexData.node_to_scope[id] || 'Archives';
          const cleanScopeName = scope.replace('Resources-', '');

          // 基于过滤后的有效业务标签进行分类聚集成圈
          let bucketName = cleanScopeName;
          if (cleanScopeName === 'Notes' || cleanScopeName === 'Archives' || cleanScopeName === 'Root' || cleanScopeName === 'Decks') {
            bucketName = getSubGroupForNode({ id, label: doc.title, metadata: { tags: doc.tags } });
          }

          if (!groupsMap.has(bucketName)) {
            groupsMap.set(bucketName, {
              id: bucketName,
              label: bucketName,
              rawChildren: []
            });
          }
          groupsMap.get(bucketName).rawChildren.push({
            id,
            label: doc.title || id,
            type: id.split(':')[0],
            metadata: { date: doc.date }
          });
        });

        // 构造 Parent Groups 并计算大圆半径
        const initializedGroups = [];
        groupsMap.forEach((g) => {
          const size = g.rawChildren.length;
          if (size === 0) return;
          
          const rings = Math.max(1, Math.ceil(Math.sqrt(size / 3.2)));
          const R = rings * 16 + 18;

          initializedGroups.push({
            ...g,
            size,
            R,
            children: []
          });
        });

        // 大圆极速碰撞定位
        layoutGroups(initializedGroups, dimensions.width, dimensions.height);

        // 星盘内同心极坐标平铺小粒子
        let allArrangedNodes = [];
        initializedGroups.forEach(g => {
          const arrangedChildren = layoutChildrenInCircle(g.x, g.y, g.rawChildren);
          g.children = arrangedChildren;
          allArrangedNodes = allArrangedNodes.concat(arrangedChildren);
        });

        setGroups(initializedGroups);
        setNodes(allArrangedNodes);
      })
      .catch(err => {
        console.warn('Failed to layout clustered semantic graph:', err);
      });

    return () => {
      active = false;
    };
  }, [dimensions.width]);

  // 检索聚焦
  useEffect(() => {
    if (!searchQuery || filteredNodes.length === 0) return;
    
    const target = filteredNodes[0];
    if (target) {
      const nextK = 1.1;
      const nextX = dimensions.width / 2 - target.x * nextK;
      const nextY = dimensions.height / 2 - target.y * nextK;
      
      setZoom({ x: nextX, y: nextY, k: nextK });
      setSelectedNode(target);
    }
  }, [searchQuery]);

  // 2D 缩放与平移
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomIntensity = 0.08;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const nextK = Math.max(0.12, Math.min(4.0, zoom.k - e.deltaY * zoomIntensity * 0.005 * zoom.k));
    const nextX = mouseX - (mouseX - zoom.x) * (nextK / zoom.k);
    const nextY = mouseY - (mouseY - zoom.y) * (nextK / zoom.k);
    
    setZoom({ x: nextX, y: nextY, k: nextK });
  };

  const handleCanvasPointerDown = (e) => {
    e.preventDefault();
    isPanningRef.current = true;
    panStartRef.current = {
      x: e.clientX - zoom.x,
      y: e.clientY - zoom.y
    };
    const svg = e.currentTarget;
    if (typeof svg.setPointerCapture === 'function') {
      svg.setPointerCapture(e.pointerId);
    }
  };

  const handleCanvasPointerMove = (e) => {
    if (isPanningRef.current) {
      setZoom({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
        k: zoom.k
      });
    }
  };

  const handleCanvasPointerUp = () => {
    isPanningRef.current = false;
  };

  // 检索过滤
  const filteredNodes = nodes.filter(n => {
    return n.label.toLowerCase().includes(searchQuery.toLowerCase()) || n.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getNodeColor = (type, isSearched, isSelected) => {
    if (isSelected) return { fill: '#f43f5e', stroke: '#f43f5e' };
    if (isSearched && searchQuery) return { fill: '#fbbf24', stroke: '#d97706' };
    
    switch (type) {
      case 'book': return { fill: 'rgba(99, 102, 241, 0.95)', stroke: 'rgba(99, 102, 241, 0.95)' };
      case 'project': return { fill: 'rgba(245, 158, 11, 0.95)', stroke: 'rgba(245, 158, 11, 0.95)' };
      case 'deck': return { fill: 'rgba(56, 189, 248, 0.95)', stroke: 'rgba(56, 189, 248, 0.95)' };
      default: return { fill: 'rgba(129, 140, 248, 0.45)', stroke: 'rgba(99, 102, 241, 0.25)' };
    }
  };

  const getTargetUrl = (node) => {
    if (!node) return '#';
    const id = node.id;
    if (id.startsWith('note:')) return `/notes/${id.replace('note:', '')}/`;
    if (id.startsWith('book:')) return `/notes/${id.replace('book:', '')}/`;
    if (id.startsWith('project:')) return `/projects/${id.replace('project:', '')}/`;
    if (id.startsWith('deck:')) return '/decks/';
    return '#';
  };

  const popoverPosition = selectedNode ? {
    left: selectedNode.x * zoom.k + zoom.x,
    top: selectedNode.y * zoom.k + zoom.y - 12
  } : null;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[620px] bg-[#fafafa] border border-slate-200 rounded-lg shadow-inner overflow-hidden select-none"
      id="graph-workbench"
      style={{ touchAction: 'none' }}
    >
      {/* 1. 浮动搜索框 (Floating Search Widget - Left Top) */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-md px-3 py-2 rounded-lg flex items-center gap-2 max-w-sm select-none z-20">
        <span className="text-slate-400 font-mono text-xs">🔍</span>
        <input 
          type="text" 
          placeholder="全局检索知识图谱..."
          className="w-48 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-sans"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="text-slate-400 hover:text-slate-600 text-[10px]"
          >
            ✕
          </button>
        )}
      </div>

      {/* 2. 浮动控制按钮 (Floating Zoom Controller - Right Bottom) */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-md p-1.5 rounded-lg select-none z-20">
        <button 
          onClick={() => setZoom(prev => ({ ...prev, k: Math.min(4.0, prev.k + 0.15) }))}
          className="w-7 h-7 flex items-center justify-center font-bold text-slate-650 hover:bg-slate-100 rounded text-sm transition-colors"
          title="放大"
        >
          ＋
        </button>
        <button 
          onClick={() => setZoom(prev => ({ ...prev, k: Math.max(0.12, prev.k - 0.15) }))}
          className="w-7 h-7 flex items-center justify-center font-bold text-slate-650 hover:bg-slate-100 rounded text-sm transition-colors"
          title="缩小"
        >
          －
        </button>
        <button 
          onClick={() => setZoom({ x: dimensions.width * 0.22, y: dimensions.height * 0.18, k: 0.52 })}
          className="w-7 h-7 flex items-center justify-center text-slate-650 hover:bg-slate-100 rounded text-xs transition-colors"
          title="重置"
        >
          ⟲
        </button>
      </div>

      {/* 3. 浮动图例 (Floating Legend - Left Bottom) */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-md px-3 py-2 rounded-lg text-[9px] font-mono text-slate-500 flex items-center gap-3 select-none z-20">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: 'rgba(245, 158, 11, 0.95)' }}></span>
          <span>💻 项目</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: 'rgba(99, 102, 241, 0.95)' }}></span>
          <span>📖 书籍</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: 'rgba(129, 140, 248, 0.7)' }}></span>
          <span>📄 笔记</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: 'rgba(56, 189, 248, 0.95)' }}></span>
          <span>🎴 幻灯片</span>
        </div>
      </div>

      {/* 4. 画布内浮动跳转气泡 (Popover Jump Card) */}
      {selectedNode && popoverPosition && getTargetUrl(selectedNode) !== '#' && (
        <div 
          className="absolute pointer-events-auto bg-slate-950 text-white p-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-slate-800 z-20 animate-scale-up"
          style={{
            left: `${popoverPosition.left}px`,
            top: `${popoverPosition.top}px`,
            transform: 'translate(-50%, -100%)',
            transition: 'left 0.1s ease-out, top 0.1s ease-out'
          }}
        >
          <div className="text-[10px] leading-tight select-text">
            <div className="font-bold font-serif truncate max-w-[140px]">{selectedNode.label}</div>
            <div className="text-[8px] text-slate-400 capitalize">{selectedNode.type}</div>
          </div>
          <a 
            href={getTargetUrl(selectedNode)}
            className="px-2.5 py-1 bg-rose-800 hover:bg-rose-900 text-white text-[9px] font-bold rounded flex items-center gap-0.5 transition-colors whitespace-nowrap"
          >
            打开笔记 ➔
          </a>
        </div>
      )}

      {/* Grid Background Pattern */}
      <div className="absolute inset-0 pointer-events-none grid-bg opacity-30"></div>

      {/* 5. SVG 矢量画布 */}
      <svg 
        className="w-full h-full block" 
        onWheel={handleWheel}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerLeave={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
      >
        <g transform={`translate(${zoom.x}, ${zoom.y}) scale(${zoom.k})`}>
          
          {/* A. 渲染 Parent Group 大气泡 */}
          <g className="groups-container">
            {groups.map((g) => {
              const isHovered = hoveredGroup === g.id;
              return (
                <g 
                  key={g.id}
                  onMouseEnter={() => setHoveredGroup(g.id)}
                  onMouseLeave={() => setHoveredGroup(null)}
                >
                  <circle
                    cx={g.x}
                    cy={g.y}
                    r={g.R}
                    fill={isHovered ? "rgba(99, 102, 241, 0.08)" : "rgba(99, 102, 241, 0.03)"}
                    stroke={isHovered ? "rgba(245, 158, 11, 0.7)" : "rgba(99, 102, 241, 0.12)"}
                    strokeWidth={isHovered ? 2 : 1.2}
                    strokeDasharray={isHovered ? "none" : "3,3"}
                    className="transition-all duration-300"
                  />
                  <text
                    x={g.x}
                    y={g.y - g.R - 8}
                    textAnchor="middle"
                    className={`text-[10px] font-mono font-bold tracking-wider transition-all duration-300 ${
                      isHovered ? "fill-amber-600 scale-[1.03]" : "fill-slate-400"
                    }`}
                  >
                    {g.label} ({g.size})
                  </text>
                </g>
              );
            })}
          </g>

          {/* B. 渲染 Child Nodes */}
          <g className="nodes-container">
            {filteredNodes.map((node) => {
              const isSelected = selectedNode && selectedNode.id === node.id;
              const isHovered = hoveredNode && hoveredNode.id === node.id;
              const isSearched = searchQuery && node.label.toLowerCase().includes(searchQuery.toLowerCase());
              
              const color = getNodeColor(node.type, isSearched, isSelected);
              const radius = isSelected ? 8 : (node.type === 'project' ? 5.5 : 4);

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(node);
                  }}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <circle
                    r={radius}
                    fill={color.fill}
                    stroke={isHovered || isSelected ? color.stroke : "transparent"}
                    strokeWidth={1.5}
                    className="transition-all duration-200"
                  />

                  {/* Tooltip */}
                  {(isHovered || isSelected || isSearched) && (
                    <g transform="translate(0, -9)" className="pointer-events-none">
                      <rect
                        x={-Math.min(90, node.label.length * 3.5 + 8)}
                        y={-10}
                        width={Math.min(180, node.label.length * 7 + 16)}
                        height={14}
                        rx={4}
                        fill="#1e293b"
                        className="shadow-md"
                      />
                      <text
                        textAnchor="middle"
                        y={0}
                        className="text-[7.5px] font-sans font-bold fill-white"
                      >
                        {node.label.length > 24 ? node.label.slice(0, 22) + "..." : node.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

        </g>
      </svg>
    </div>
  );
}
