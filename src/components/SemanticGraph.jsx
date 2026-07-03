import React, { useState, useEffect, useRef } from 'react';

export default function SemanticGraph() {
  // 1. 状态管理 (低频交互)
  const [activeScope, setActiveScope] = useState('Projects');
  const [graphMode, setGraphMode] = useState('para'); // 'para' (大脑版图) or 'full' (全量细节)
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', '30d', '90d'
  
  // 物理参数配置
  const [kLink, setKLink] = useState(0.04);
  const [restLength, setRestLength] = useState(120);
  const [charge, setCharge] = useState(-1000);
  const [gravity, setGravity] = useState(0.02);
  const [friction, setFriction] = useState(0.85);

  // 节点和连线数据 (仅在初始化/合并时触发低频重绘)
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  
  // 2. Refs 机制 (高频物理运算隔离)
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const animFrameIdRef = useRef(null);
  const draggedNodeRef = useRef(null);
  const crossScopeIndexRef = useRef(null);
  const containerRef = useRef(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [isMobile, setIsMobile] = useState(false);

  // 移动端及视口检测
  useEffect(() => {
    const handleResize = () => {
      const w = containerRef.current ? containerRef.current.clientWidth : 800;
      const h = containerRef.current ? containerRef.current.clientHeight || 500 : 500;
      setDimensions({ width: w, height: h });
      
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsPaused(true);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 3. 获取 Cross-Scope 索引数据
  useEffect(() => {
    fetch('/assets/graphs/cross_scope_index.json')
      .then(res => res.json())
      .then(data => {
        crossScopeIndexRef.current = data;
      })
      .catch(err => console.warn('Failed to load cross-scope graph index:', err));
  }, []);

  // 4. 加载 Scoped / PARA 拓扑图
  useEffect(() => {
    let active = true;
    const fileUrl = graphMode === 'para'
      ? '/assets/graphs/para.json'
      : `/assets/graphs/${activeScope.toLowerCase()}.json`;

    fetch(fileUrl)
      .then(res => res.json())
      .then(data => {
        if (!active) return;
        
        const rawNodes = data.nodes || [];
        const rawEdges = data.edges || [];

        // 80 节点抽样逻辑：如果是 para 模式全量加载所有节点，细节子图模式只取前 80 高 Degree 节点
        const sortedNodes = [...rawNodes].sort((a, b) => {
          const degA = a.metadata?.degree || 0;
          const degB = b.metadata?.degree || 0;
          return degB - degA;
        });

        const sampledNodes = graphMode === 'para' ? rawNodes : sortedNodes.slice(0, 80);
        const sampledNodeIds = new Set(sampledNodes.map(n => n.id));

        const sampledEdges = rawEdges.filter(e => 
          sampledNodeIds.has(e.source) && sampledNodeIds.has(e.target)
        );

        // 初始化物理坐标
        const w = dimensions.width;
        const h = dimensions.height;
        
        const initializedNodes = sampledNodes.map(n => ({
          ...n,
          x: w / 2 + (Math.random() - 0.5) * 250,
          y: h / 2 + (Math.random() - 0.5) * 250,
          vx: 0,
          vy: 0
        }));

        const initializedLinks = sampledEdges.map(e => {
          const sourceNode = initializedNodes.find(n => n.id === e.source);
          const targetNode = initializedNodes.find(n => n.id === e.target);
          return {
            ...e,
            source: sourceNode,
            target: targetNode
          };
        }).filter(l => l.source && l.target);

        // 写入 Refs 及 States
        nodesRef.current = initializedNodes;
        linksRef.current = initializedLinks;
        setNodes(initializedNodes);
        setLinks(initializedLinks);

        if (initializedNodes.length > 0) {
          setSelectedNode(initializedNodes[0]);
        } else {
          setSelectedNode(null);
        }
      })
      .catch(err => {
        console.warn(`Failed to load graph database from [${fileUrl}]:`, err);
      });

    return () => {
      active = false;
    };
  }, [activeScope, dimensions.width]);

  // 5. 邻域动态扩展加载 (Neighborhood Expansion)
  const expandNeighborhood = async () => {
    if (!selectedNode || !crossScopeIndexRef.current) return;

    const index = crossScopeIndexRef.current;
    const neighbors = index.node_to_neighbors[selectedNode.id] || [];
    if (neighbors.length === 0) {
      alert('该节点在全局图谱中暂无关联的其他邻居。');
      return;
    }

    const currentIds = new Set(nodesRef.current.map(n => n.id));
    const targetIds = neighbors.filter(id => !currentIds.has(id));

    if (targetIds.length === 0) {
      alert('所有关联邻居已全部呈现在当前画布中。');
      return;
    }

    // 确定邻居所属的 scope，按 scope 聚合获取
    const scopeGroups = {};
    targetIds.forEach(id => {
      const scope = index.node_to_scope[id] || 'Archives';
      if (!scopeGroups[scope]) scopeGroups[scope] = [];
      scopeGroups[scope].push(id);
    });

    const newNodesToLoad = [];
    const newEdgesToLoad = [];

    // 并行拉取各 scoped 关系文件
    await Promise.all(
      Object.keys(scopeGroups).map(async (scope) => {
        try {
          const res = await fetch(`/assets/graphs/${scope.toLowerCase()}.json`);
          const data = await res.json();
          const targetSet = new Set(scopeGroups[scope]);
          
          (data.nodes || []).forEach(n => {
            if (targetSet.has(n.id)) newNodesToLoad.push(n);
          });
          (data.edges || []).forEach(e => {
            newEdgesToLoad.push(e);
          });
        } catch (e) {
          // ignore
        }
      })
    );

    if (newNodesToLoad.length === 0) return;

    // 初始化新节点坐标 (放在当前 focus 节点附近)
    const refX = selectedNode.x;
    const refY = selectedNode.y;

    const initializedNewNodes = newNodesToLoad.map(n => ({
      ...n,
      x: refX + (Math.random() - 0.5) * 100,
      y: refY + (Math.random() - 0.5) * 100,
      vx: 0,
      vy: 0
    }));

    const combinedNodes = [...nodesRef.current, ...initializedNewNodes];
    const combinedNodeIds = new Set(combinedNodes.map(n => n.id));

    // 合并 edges 并重新匹配引用
    const allUniqueEdges = [];
    const seenEdges = new Set();

    // 保留原边
    linksRef.current.forEach(l => {
      const key = `${l.source.id}&&${l.target.id}`;
      allUniqueEdges.push({ source: l.source.id, target: l.target.id, weight: l.weight, type: l.type });
      seenEdges.add(key);
    });

    // 注入新拉取的跨 scope 连边
    newEdgesToLoad.forEach(e => {
      const key1 = `${e.source}&&${e.target}`;
      const key2 = `${e.target}&&${e.source}`;
      if (combinedNodeIds.has(e.source) && combinedNodeIds.has(e.target) && !seenEdges.has(key1) && !seenEdges.has(key2)) {
        allUniqueEdges.push(e);
        seenEdges.add(key1);
      }
    });

    const combinedLinks = allUniqueEdges.map(e => {
      const sNode = combinedNodes.find(n => n.id === e.source);
      const tNode = combinedNodes.find(n => n.id === e.target);
      return {
        ...e,
        source: sNode,
        target: tNode
      };
    }).filter(l => l.source && l.target);

    // 更新 Refs
    nodesRef.current = combinedNodes;
    linksRef.current = combinedLinks;

    // 低频重绘 React elements 以挂载 DOM nodes
    setNodes(combinedNodes);
    setLinks(combinedLinks);
  };

  // 重置返回 Scope
  const resetScope = () => {
    setActiveScope(activeScope); // 触发重新加载
    // 强制触发重新加载
    const url = `/assets/graphs/${activeScope.toLowerCase()}.json`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const initializedNodes = (data.nodes || []).slice(0, 80).map(n => ({
          ...n,
          x: dimensions.width / 2 + (Math.random() - 0.5) * 200,
          y: dimensions.height / 2 + (Math.random() - 0.5) * 200,
          vx: 0,
          vy: 0
        }));
        const initializedLinks = (data.edges || []).map(e => {
          const s = initializedNodes.find(node => node.id === e.source);
          const t = initializedNodes.find(node => node.id === e.target);
          return { ...e, source: s, target: t };
        }).filter(l => l.source && l.target);

        nodesRef.current = initializedNodes;
        linksRef.current = initializedLinks;
        setNodes(initializedNodes);
        setLinks(initializedLinks);
        if (initializedNodes.length > 0) setSelectedNode(initializedNodes[0]);
      });
  };

  // 6. Verlet 坐标仿真步长 (免 setState，直接操作 SVG 属性)
  useEffect(() => {
    if (isPaused) {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      return;
    }

    const tick = () => {
      const currentNodes = nodesRef.current;
      const currentLinks = linksRef.current;
      if (currentNodes.length === 0) {
        animFrameIdRef.current = requestAnimationFrame(tick);
        return;
      }

      const cx = dimensions.width / 2;
      const cy = dimensions.height / 2;

      const fx = new Array(currentNodes.length).fill(0);
      const fy = new Array(currentNodes.length).fill(0);

      // A. 计算粒子斥力
      for (let i = 0; i < currentNodes.length; i++) {
        for (let j = i + 1; j < currentNodes.length; j++) {
          const nA = currentNodes[i];
          const nB = currentNodes[j];
          const dx = nB.x - nA.x;
          const dy = nB.y - nA.y;
          const distSq = dx * dx + dy * dy + 0.1;
          const dist = Math.sqrt(distSq);

          if (dist < 350) {
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

      // B. 计算弹簧拉力
      currentLinks.forEach(link => {
        const nA = link.source;
        const nB = link.target;
        const idxA = currentNodes.findIndex(n => n.id === nA.id);
        const idxB = currentNodes.findIndex(n => n.id === nB.id);

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

      // C. 更新物理位置与速度
      currentNodes.forEach((node, idx) => {
        if (draggedNodeRef.current && node.id === draggedNodeRef.current.id) {
          // 被拖拽节点由鼠标事件接管，不更新物理力学
          return;
        }

        const gravX = (cx - node.x) * gravity;
        const gravY = (cy - node.y) * gravity;

        const totalFx = fx[idx] + gravX;
        const totalFy = fy[idx] + gravY;

        node.vx = (node.vx + totalFx) * friction;
        node.vy = (node.vy + totalFy) * friction;

        node.x += node.vx;
        node.y += node.vy;

        // 边界吸附
        const margin = 20;
        if (node.x < margin) node.x = margin;
        if (node.x > dimensions.width - margin) node.x = dimensions.width - margin;
        if (node.y < margin) node.y = margin;
        if (node.y > dimensions.height - margin) node.y = dimensions.height - margin;
      });

      // D. 直接操作 DOM 元素坐标，极速渲染，不通过 React 重绘
      currentNodes.forEach(node => {
        const el = document.getElementById(`d3-node-${node.id}`);
        if (el) {
          el.setAttribute('transform', `translate(${node.x}, ${node.y})`);
        }
      });

      currentLinks.forEach((link, idx) => {
        const el = document.getElementById(`d3-link-${idx}`);
        if (el) {
          el.setAttribute('x1', String(link.source.x));
          el.setAttribute('y1', String(link.source.y));
          el.setAttribute('x2', String(link.target.x));
          el.setAttribute('y2', String(link.target.y));
        }
      });

      // 如果选中的是当前物理变化的节点，手动更新其瞬时速度坐标板
      if (selectedNode) {
        const currentSelected = currentNodes.find(n => n.id === selectedNode.id);
        if (currentSelected) {
          const vxVal = document.getElementById('sensor-vx');
          const vyVal = document.getElementById('sensor-vy');
          const xVal = document.getElementById('sensor-x');
          const yVal = document.getElementById('sensor-y');
          if (vxVal) vxVal.innerText = currentSelected.vx.toFixed(3);
          if (vyVal) vyVal.innerText = currentSelected.vy.toFixed(3);
          if (xVal) xVal.innerText = currentSelected.x.toFixed(1);
          if (yVal) yVal.innerText = currentSelected.y.toFixed(1);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    animFrameIdRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [kLink, restLength, charge, gravity, friction, isPaused, selectedNode]);

  // 7. 鼠标拖拽事件管理
  const handlePointerDown = (node, e) => {
    if (isPaused) return;
    draggedNodeRef.current = node;
    const svg = containerRef.current?.querySelector('svg');
    if (svg && typeof svg.setPointerCapture === 'function') {
      svg.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (!draggedNodeRef.current || !containerRef.current) return;
    
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const node = nodesRef.current.find(n => n.id === draggedNodeRef.current.id);
    if (node) {
      node.x = Math.max(20, Math.min(dimensions.width - 20, x));
      node.y = Math.max(20, Math.min(dimensions.height - 20, y));
      node.vx = 0;
      node.vy = 0;
    }
  };

  const handlePointerUp = () => {
    draggedNodeRef.current = null;
  };

  // 过滤显示节点 (供静态 SVG nodes render 初始化定位)
  const filteredNodes = nodes.filter(n => {
    const matchesSearch = n.label.toLowerCase().includes(searchQuery.toLowerCase()) || n.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // 时间线过滤 (基于 2026-07-02 预置基准)
    if (dateFilter !== 'all') {
      const nodeDateStr = n.metadata?.date;
      if (nodeDateStr) {
        try {
          const nodeTime = new Date(nodeDateStr).getTime();
          const baseTime = new Date('2026-07-02').getTime();
          const limitDays = dateFilter === '30d' ? 30 : 90;
          const diffDays = (baseTime - nodeTime) / (1000 * 60 * 60 * 24);
          if (diffDays > limitDays) return false;
        } catch (e) {
          // ignore
        }
      }
    }
    return true;
  });

  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredLinks = links.filter(l => 
    filteredNodeIds.has(l.source.id) && filteredNodeIds.has(l.target.id)
  );

  // 拓扑节点底色定义
  const getNodeColor = (type) => {
    switch (type) {
      case 'folder':
        return { fill: 'hsl(199, 89%, 95%)', stroke: 'hsl(199, 89%, 48%)', text: 'hsl(199, 89%, 28%)' };
      case 'book':
        return { fill: 'hsl(120, 40%, 96%)', stroke: 'hsl(120, 40%, 45%)', text: 'hsl(120, 40%, 25%)' };
      case 'project':
        return { fill: 'hsl(142, 60%, 96%)', stroke: 'hsl(142, 45%, 42%)', text: 'hsl(142, 45%, 26%)' };
      case 'deck':
        return { fill: 'hsl(217, 70%, 97%)', stroke: 'hsl(217, 60%, 55%)', text: 'hsl(217, 60%, 30%)' };
      case 'resume':
        return { fill: 'hsl(340, 100%, 97%)', stroke: 'hsl(340, 82%, 52%)', text: 'hsl(340, 82%, 35%)' };
      default: // note
        return { fill: 'hsl(35, 60%, 98%)', stroke: 'hsl(35, 30%, 45%)', text: 'hsl(35, 30%, 30%)' };
    }
  };

  // Fullscreen Shell Toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 全屏或常规布局的 Shell Classes
  const outerShellClasses = isFullscreen
    ? "fixed inset-0 z-50 bg-[#FCFAF7] p-6 flex flex-col gap-4 overflow-hidden"
    : "grid grid-cols-1 xl:grid-cols-12 gap-10 items-start";

  const canvasContainerClasses = isFullscreen
    ? "flex-grow relative overflow-hidden bg-white border border-slate-200 rounded-md shadow-inner"
    : "h-[540px] relative overflow-hidden bg-white cursor-grab active:cursor-grabbing select-none border border-slate-200 rounded-md shadow-inner";

  return (
    <div 
      className={outerShellClasses}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      id="graph-workbench"
    >
      {/* 1. Left Scope Rail (View Mode Switch & Aria list) */}
      <aside className={isFullscreen ? "flex flex-col gap-3 shrink-0 border-b xl:border-b-0 xl:border-r border-slate-200/60 pb-3 xl:pb-0 xl:pr-4" : "xl:col-span-3 space-y-4 select-none"}>
        
        {/* View Mode Switcher */}
        <div className="space-y-1.5">
          <div className="font-mono text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-1 hidden xl:block">View Selector</div>
          <div className="flex border border-slate-200/60 p-1 rounded-md bg-stone-50 gap-1 w-full">
            <button
              onClick={() => {
                setGraphMode('para');
                setIsPaused(false);
              }}
              className={`flex-1 py-1.5 text-center text-[10px] font-mono font-bold rounded transition-all ${
                graphMode === 'para'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              🧠 大脑版图
            </button>
            <button
              onClick={() => {
                setGraphMode('full');
                setIsPaused(false);
              }}
              className={`flex-1 py-1.5 text-center text-[10px] font-mono font-bold rounded transition-all ${
                graphMode === 'full'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              🔬 微观细节
            </button>
          </div>
        </div>

        {graphMode === 'para' ? (
          /* PARA Legend */
          <div className="bg-stone-50 border border-slate-200/60 p-3 rounded-md space-y-2.5 font-mono text-[10px] w-full">
            <div className="font-bold text-slate-400 border-b border-slate-200 pb-1 uppercase tracking-wider text-[9px]">Map Legend</div>
            <div className="space-y-2 text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'hsl(199, 89%, 48%)' }}></span>
                <span>📁 文件夹 (Areas)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'hsl(142, 45%, 42%)' }}></span>
                <span>💻 项目 (Projects)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'hsl(120, 40%, 45%)' }}></span>
                <span>📖 书籍 (Books)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'hsl(217, 60%, 55%)' }}></span>
                <span>🎴 幻灯片 (Decks)</span>
              </div>
            </div>
            <p className="text-[9px] text-slate-450 font-serif leading-relaxed mt-2 border-t border-slate-200/60 pt-2 select-text">
              大脑版图已将底层的千余篇复杂笔记，按物理二级目录折叠聚合展示，从而为您清晰呈现宏观知识结构体系。
            </p>
          </div>
        ) : (
          /* Full Scopes Rail */
          <div className="space-y-2 w-full">
            <div className="font-mono text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-1 hidden xl:block">Scope Rail</div>
            <div className="flex flex-wrap xl:flex-col gap-1.5 w-full">
              {['Projects', 'Areas', 'Resources-Books', 'Resources-Notes', 'Decks', 'Resume', 'Archives'].map(scope => (
                <button
                  key={scope}
                  onClick={() => setActiveScope(scope)}
                  className={`px-3 py-1.5 text-left text-xs font-mono font-bold rounded transition-all w-full flex items-center justify-between ${
                    activeScope === scope 
                      ? 'bg-rose-50 border border-rose-200/50 text-rose-800' 
                      : 'bg-white border border-slate-200/40 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{scope.replace('-', ' ')}</span>
                  <span className="text-[10px] opacity-50">➔</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* 2. Central Simulation Canvas (Grid visualizer) */}
      <div className={isFullscreen ? "flex-grow flex flex-col space-y-3 min-h-0" : "xl:col-span-7 space-y-4"}>
        
        {/* Controls Toolbar */}
        <div className="border border-slate-200/60 rounded-md p-3 bg-stone-50/50 flex flex-wrap items-center justify-between gap-3 text-xs font-mono select-none">
          <div className="relative w-full sm:w-56">
            <span className="absolute left-2.5 top-2 text-slate-400 font-mono">🔍</span>
            <input 
              type="text" 
              placeholder="检索图谱标签..."
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 bg-white hover:border-slate-350 rounded focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="px-2 py-1.5 border border-slate-200 bg-white rounded focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans font-bold text-slate-700"
            >
              <option value="all">📅 显示全部时区</option>
              <option value="30d">📅 最近30天笔记</option>
              <option value="90d">📅 最近90天笔记</option>
            </select>
          </div>

          <div className="flex gap-2 shrink-0">
            <button 
              onClick={() => setIsPaused(!isPaused)} 
              className={`px-3 py-1.5 border font-mono font-bold rounded transition-colors ${
                isPaused 
                  ? 'bg-rose-900 text-white border-rose-950 shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isPaused ? '▶ 启动物理模拟' : '⏸ 暂停物理仿真'}
            </button>

            <button
              onClick={toggleFullscreen}
              className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-800 font-mono font-bold rounded hover:bg-rose-100/60 transition-colors"
            >
              {isFullscreen ? '收回全屏 ↙' : '💻 全屏画布 ↗'}
            </button>
          </div>
        </div>

        {/* Visual Viewport */}
        <div 
          ref={containerRef}
          className={canvasContainerClasses}
          style={{ touchAction: 'none' }}
        >
          {/* Grid Background Pattern */}
          <div className="absolute inset-0 pointer-events-none grid-bg opacity-30"></div>

          {/* Real-time coordinates dashboard */}
          {selectedNode && (
            <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-slate-800 text-[#00ff66] p-3 rounded font-mono text-[9px] leading-relaxed shadow-lg select-none z-10 w-44">
              <div class="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
                <span class="font-bold text-white">⚡ SENSOR ACTIVE</span>
                <span class="animate-pulse">●</span>
              </div>
              <div class="flex justify-between">
                <span>NODE ID:</span>
                <span class="text-white truncate max-w-[80px]">{selectedNode.id}</span>
              </div>
              <div class="flex justify-between">
                <span>COORD X:</span>
                <span class="text-white" id="sensor-x">{selectedNode.x.toFixed(1)}</span>
              </div>
              <div class="flex justify-between">
                <span>COORD Y:</span>
                <span class="text-white" id="sensor-y">{selectedNode.y.toFixed(1)}</span>
              </div>
              <div class="flex justify-between">
                <span>VEL VX:</span>
                <span class="text-white" id="sensor-vx">{selectedNode.vx.toFixed(3)}</span>
              </div>
              <div class="flex justify-between">
                <span>VEL VY:</span>
                <span class="text-white" id="sensor-vy">{selectedNode.vy.toFixed(3)}</span>
              </div>
            </div>
          )}

          <svg 
            className="w-full h-full block" 
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          >
            {/* Draw Links */}
            <g className="links-group">
              {filteredLinks.map((link, idx) => (
                <line
                  key={`link-${idx}`}
                  id={`d3-link-${idx}`}
                  x1={link.source.x}
                  y1={link.source.y}
                  x2={link.target.x}
                  y2={link.target.y}
                  stroke={link.type === 'link' ? 'hsl(340, 60%, 88%)' : 'rgba(148, 163, 184, 0.15)'}
                  strokeWidth={link.type === 'link' ? 1.5 : 1}
                  strokeDasharray={link.type === 'tag_overlap' ? '3,3' : 'none'}
                />
              ))}
            </g>

            {/* Draw Nodes */}
            <g className="nodes-group">
              {filteredNodes.map((node) => {
                const color = getNodeColor(node.type);
                const isSelected = selectedNode && selectedNode.id === node.id;
                
                return (
                  <g
                    key={node.id}
                    id={`d3-node-${node.id}`}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-pointer select-none"
                    onClick={() => setSelectedNode(node)}
                    onPointerDown={(e) => handlePointerDown(node, e)}
                  >
                    {/* Outer glow ring for selection */}
                    <circle
                      r={isSelected ? 18 : 10}
                      fill="transparent"
                      stroke={isSelected ? 'var(--color-rose)' : 'transparent'}
                      strokeWidth={1.5}
                      className="transition-all duration-300"
                    />
                    
                    {/* Circle Node */}
                    <circle
                      r={node.type === 'folder' ? 10 : (node.type === 'project' ? 8 : 6)}
                      fill={color.fill}
                      stroke={isSelected ? 'var(--color-rose)' : color.stroke}
                      strokeWidth={isSelected ? 2 : 1.2}
                    />

                    {/* Text Label */}
                    <text
                      y={node.type === 'folder' ? -15 : (node.type === 'project' ? -13 : -10)}
                      textAnchor="middle"
                      className="text-[9px] font-sans font-bold"
                      fill={color.text}
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>

      {/* 3. Right Details Inspector */}
      <aside className={isFullscreen ? "w-full xl:w-72 shrink-0 border-t xl:border-t-0 xl:border-l border-slate-200/60 pt-3 xl:pt-0 xl:pl-4 flex flex-col justify-between" : "xl:col-span-3 space-y-4 select-none"}>
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-1 mb-2 font-mono text-[9px] font-bold text-slate-400 tracking-widest uppercase">
            <span>Sensor Inspector</span>
            <span>SELECTION</span>
          </div>
          {selectedNode ? (
            <div className="bg-stone-50 border border-slate-200/60 p-4 rounded-md space-y-4 font-mono text-[10px]">
              <div>
                <span className="text-slate-400 block mb-0.5">ASSET CLASS</span>
                <span className="text-slate-800 font-bold uppercase">{selectedNode.type}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">LABEL NAME</span>
                <span className="text-slate-900 font-bold text-xs font-serif">{selectedNode.label}</span>
              </div>
              {selectedNode.metadata?.date && (
                <div>
                  <span className="text-slate-400 block mb-0.5">PUBLISH TIME</span>
                  <span className="text-slate-800 font-bold">{selectedNode.metadata.date}</span>
                </div>
              )}
              {selectedNode.metadata?.stage && (
                <div>
                  <span className="text-slate-400 block mb-0.5">STAGE STABILITY</span>
                  <span className="text-slate-800 font-bold capitalize">{selectedNode.metadata.stage}</span>
                </div>
              )}
              
              <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-2">
                {/* 2阶邻域动态扩展 */}
                <button
                  onClick={expandNeighborhood}
                  className="py-1.5 px-3 bg-rose-50 border border-rose-200 text-rose-800 font-bold rounded text-center transition-colors w-full"
                >
                  🔗 扩展关联邻域
                </button>
                <button
                  onClick={resetScope}
                  className="py-1.5 px-3 bg-white border border-slate-200 text-slate-600 rounded text-center transition-colors w-full"
                >
                  ↩ 重置 Scope 视图
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 font-serif italic text-xs border border-dashed border-slate-200 rounded-md">
              未选中任何节点。请点击图谱上的圆点进行参数分析。
            </div>
          )}
        </div>

        {/* Action Link directly to document */}
        {selectedNode && (selectedNode.type === 'note' || selectedNode.type === 'book') && (
          <div className="pt-4 border-t border-slate-200/60 mt-4">
            <a
              href={`/notes/${selectedNode.id.replace('note:', '')}/`}
              className="py-2 px-4 bg-slate-900 text-white font-serif font-bold text-xs rounded text-center block w-full hover:bg-rose-900 transition-colors animate-fade-in"
            >
              📖 进入沉浸式阅读
            </a>
          </div>
        )}
        {selectedNode && selectedNode.type === 'project' && (
          <div className="pt-4 border-t border-slate-200/60 mt-4">
            <a
              href={`/projects/${selectedNode.id.replace('project:', '')}/`}
              className="py-2 px-4 bg-slate-900 text-white font-serif font-bold text-xs rounded text-center block w-full hover:bg-rose-900 transition-colors animate-fade-in"
            >
              💻 查看项目研发看板
            </a>
          </div>
        )}
      </aside>
    </div>
  );
}
