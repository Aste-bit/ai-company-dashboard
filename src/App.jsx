import React, { useState, useEffect, useRef, useMemo } from 'react';

// ============================================================================
// CONFIGURATION
// ============================================================================
const API_URL = 'https://script.google.com/macros/d/YOUR_SCRIPT_ID/useweb?action=getData';
const USE_MOCK_DATA = true; // Set to false when GAS API is ready

// ============================================================================
// MOCK DATA
// ============================================================================
const MOCK_DATA = {
  tasks: [
    // CEO
    { id: 'ceo-briefing', name: 'CEO Briefing', dept: 'CEO', schedule: '07:45', status: 'active', lastRun: '2026-03-27T07:45:00', nextRun: '2026-03-28T07:45:00' },
    // CTO
    { id: 'cortex-autonomous', name: 'Cortex Autonomous', dept: 'CTO', schedule: '24h', status: 'healthy', lastRun: '2026-03-27T21:30:00', nextRun: '2026-03-28T21:30:00' },
    // COO
    { id: 'weekly-optimizer', name: '週間最適化', dept: 'COO', schedule: '月/水/金', status: 'healthy', lastRun: '2026-03-26T06:00:00', nextRun: '2026-03-31T06:00:00' },
    { id: 'todo-morning-picker', name: 'TODO朝選別', dept: 'COO', schedule: '07:00', status: 'active', lastRun: '2026-03-27T07:00:00', nextRun: '2026-03-28T07:00:00' },
    { id: 'coconala-optimizer', name: 'ココナラ最適化', dept: 'COO', schedule: '20:00', status: 'healthy', lastRun: '2026-03-27T20:00:00', nextRun: '2026-03-28T20:00:00' },
    { id: 'skill-demand-analyzer', name: 'スキル需要分析', dept: 'COO', schedule: '18:00', status: 'healthy', lastRun: '2026-03-27T18:00:00', nextRun: '2026-03-28T18:00:00' },
    { id: 'job-scanner', name: 'Job Scanner', dept: 'COO', schedule: '09:00', status: 'warning', lastRun: '2026-03-27T09:00:00', nextRun: '2026-03-28T09:00:00' },
    { id: 'market-monitor', name: '市場モニター', dept: 'COO', schedule: '12:00', status: 'healthy', lastRun: '2026-03-27T12:00:00', nextRun: '2026-03-28T12:00:00' },
    { id: 'job-scanner-evening', name: 'Job Scanner夜間', dept: 'COO', schedule: '21:00', status: 'warning', lastRun: '2026-03-27T21:00:00', nextRun: '2026-03-28T21:00:00' },
    { id: 'proposal-tracker', name: 'Proposal Tracker', dept: 'COO', schedule: '15:00', status: 'healthy', lastRun: '2026-03-27T15:00:00', nextRun: '2026-03-28T15:00:00' },
    { id: 'knowledge-gardener', name: 'Knowledge Gardener', dept: 'COO', schedule: '19:00', status: 'healthy', lastRun: '2026-03-27T19:00:00', nextRun: '2026-03-28T19:00:00' },
    { id: 'post-delivery', name: 'Post Delivery', dept: 'COO', schedule: '16:00', status: 'healthy', lastRun: '2026-03-27T16:00:00', nextRun: '2026-03-28T16:00:00' },
    // CMO
    { id: 'sns-morning-post', name: 'SNS朝投稿', dept: 'CMO', schedule: '07:30', status: 'warning', lastRun: '2026-03-26T07:30:00', nextRun: '2026-03-28T07:30:00' },
    { id: 'sns-engagement', name: 'SNS engagement', dept: 'CMO', schedule: '14:00', status: 'healthy', lastRun: '2026-03-27T14:00:00', nextRun: '2026-03-28T14:00:00' },
    { id: 'tech-trend-scout', name: 'Tech Trend Scout', dept: 'CMO', schedule: '13:00', status: 'healthy', lastRun: '2026-03-27T13:00:00', nextRun: '2026-03-28T13:00:00' },
    { id: 'sns-afternoon-post', name: 'SNS午後投稿', dept: 'CMO', schedule: '15:30', status: 'warning', lastRun: '2026-03-26T15:30:00', nextRun: '2026-03-28T15:30:00' },
    { id: 'sns-nightly-collect', name: 'SNS夜間収集', dept: 'CMO', schedule: '21:30', status: 'healthy', lastRun: '2026-03-27T21:30:00', nextRun: '2026-03-28T21:30:00' },
    { id: 'inbound-content', name: 'Inbound Content', dept: 'CMO', schedule: '10:00', status: 'healthy', lastRun: '2026-03-27T10:00:00', nextRun: '2026-03-28T10:00:00' },
    // CFO & CSO (external/minimal)
    { id: 'cso-strategy', name: 'CSO Strategy', dept: 'CSO', schedule: 'weekly', status: 'healthy', lastRun: '2026-03-26T00:00:00', nextRun: '2026-04-02T00:00:00' },
  ],
  departments: {
    CEO: { color: '#f59e0b', health: 'green', lastUpdate: '2026-03-27T09:00:00', metrics: { briefs: 1, status: 'On' } },
    CTO: { color: '#2563eb', health: 'green', lastUpdate: '2026-03-27T21:30:00', metrics: { projects: 3, deploys: 1 } },
    COO: { color: '#16a34a', health: 'yellow', lastUpdate: '2026-03-27T20:00:00', metrics: { tasksHealthy: 9, warnings: 2 } },
    CMO: { color: '#ec4899', health: 'yellow', lastUpdate: '2026-03-27T21:30:00', metrics: { postsToday: 2, engagement: 0 } },
    CFO: { color: '#d97706', health: 'yellow', lastUpdate: '2026-03-26T00:00:00', metrics: { openInvoices: 0, balance: 418903599 } },
    CSO: { color: '#7c3aed', health: 'green', lastUpdate: '2026-03-26T00:00:00', metrics: { strategy: 'Active', focus: 'Growth' } },
  },
  kpi: { activeTasks: 19, totalTasks: 20, revenue: 0, revenueTarget: 50000, pipeline: 0, alerts: 3 },
  alerts: [
    { type: 'warning', message: 'X API キー未設定 — CMO部門のSNS投稿が待機中', time: '2026-03-27', dept: 'CMO' },
    { type: 'warning', message: 'CrowdWorks 未登録 — COO部門のjob-scannerが待機中', time: '2026-03-27', dept: 'COO' },
    { type: 'warning', message: 'ランサーズ 未登録 — 巡回対象に追加待ち', time: '2026-03-27', dept: 'COO' },
  ]
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [data, setData] = useState(MOCK_DATA);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load data from GAS API if configured
  useEffect(() => {
    if (!USE_MOCK_DATA && API_URL !== 'https://script.google.com/macros/d/YOUR_SCRIPT_ID/useweb?action=getData') {
      fetch(API_URL)
        .then(res => res.json())
        .then(apiData => setData(apiData))
        .catch(err => {
          console.error('Failed to load data:', err);
          setData(MOCK_DATA);
        });
    }
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getHealthBadge = (health) => {
    const colors = { green: '#10b981', yellow: '#f59e0b', red: '#ef4444' };
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors[health] || '#ccc' }} />
        <span style={{ fontSize: '12px', color: '#666' }}>{health.toUpperCase()}</span>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <style>{cssStyles}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>AI Company Dashboard</h1>
            <p style={styles.subtitle}>Chairman View — リアルタイム稼働状況</p>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.clock}>{formatTime(currentTime)}</div>
            <div style={styles.systemHealth}>
              {getHealthBadge(data.departments.CEO.health)}
            </div>
          </div>
        </div>
      </header>

      {/* KPI Bar */}
      <section style={styles.kpiSection}>
        <KPICard
          icon="▶"
          label="稼働タスク"
          value={`${data.kpi.activeTasks}/${data.kpi.totalTasks}`}
          subtext="実行中"
          color="#2563eb"
        />
        <KPICard
          icon="¥"
          label="今月売上"
          value={`¥${data.kpi.revenue.toLocaleString()}`}
          subtext={`/ ¥${data.kpi.revenueTarget.toLocaleString()}目標`}
          color="#10b981"
        />
        <KPICard
          icon="📊"
          label="パイプライン"
          value={`${data.kpi.pipeline}件`}
          subtext="新規提案"
          color="#f59e0b"
        />
        <KPICard
          icon="⚠️"
          label="アラート"
          value={`${data.kpi.alerts}件`}
          subtext="要対応"
          color="#ef4444"
        />
      </section>

      {/* Node Graph - THE HERO SECTION */}
      <section style={styles.nodeGraphSection}>
        <h2 style={styles.sectionTitle}>組織体系と稼働状況</h2>
        <NodeGraph data={data} hoveredNode={hoveredNode} setHoveredNode={setHoveredNode} />
      </section>

      {/* Timeline */}
      <section style={styles.timelineSection}>
        <h2 style={styles.sectionTitle}>タスクスケジュール</h2>
        <Timeline tasks={data.tasks} currentTime={currentTime} />
      </section>

      {/* Pipeline Kanban */}
      <section style={styles.pipelineSection}>
        <h2 style={styles.sectionTitle}>パイプライン</h2>
        <div style={styles.kanbanContainer}>
          <KanbanColumn title="ドラフト" count="0" color="#9ca3af" />
          <KanbanColumn title="承認待ち" count="0" color="#f59e0b" />
          <KanbanColumn title="送信済み" count="0" color="#3b82f6" />
          <KanbanColumn title="受注" count="0" color="#10b981" />
        </div>
      </section>

      {/* Alerts Feed */}
      <section style={styles.alertSection}>
        <h2 style={styles.sectionTitle}>アラート</h2>
        <div style={styles.alertFeed}>
          {data.alerts.map((alert, idx) => (
            <AlertItem key={idx} alert={alert} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>AI Company v3.1 — CEO + 5部門 / 20タスク</p>
        <p>Powered by Cowork + Cortex</p>
      </footer>
    </div>
  );
}

// ============================================================================
// NODE GRAPH COMPONENT
// ============================================================================
function NodeGraph({ data, hoveredNode, setHoveredNode }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [nodePositions, setNodePositions] = useState({});

  // Calculate node positions based on layout
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.offsetWidth;
    const height = 500;
    const deptNames = ['CTO', 'COO', 'CMO', 'CFO', 'CSO'];

    const positions = {
      CEO: { x: width / 2, y: 80 },
      Chairman: { x: width / 2, y: 0 },
    };

    // Position departments in a line below CEO
    const deptSpacing = (width - 100) / (deptNames.length + 1);
    deptNames.forEach((dept, idx) => {
      positions[dept] = { x: 60 + (idx + 1) * deptSpacing, y: 250 };
    });

    // Position tasks below departments
    const tasksPerDept = {
      CTO: ['cortex-autonomous'],
      COO: ['weekly-optimizer', 'todo-morning-picker', 'coconala-optimizer', 'skill-demand-analyzer', 'job-scanner', 'market-monitor', 'job-scanner-evening', 'proposal-tracker', 'knowledge-gardener', 'post-delivery'],
      CMO: ['sns-morning-post', 'sns-engagement', 'tech-trend-scout', 'sns-afternoon-post', 'sns-nightly-collect', 'inbound-content'],
      CFO: [],
      CSO: ['cso-strategy'],
      CEO: ['ceo-briefing'],
    };

    Object.entries(tasksPerDept).forEach(([dept, tasks]) => {
      const deptPos = positions[dept];
      tasks.forEach((taskId, idx) => {
        const offset = (tasks.length - 1) * 25 / 2;
        positions[taskId] = {
          x: deptPos.x - offset + idx * 25,
          y: deptPos.y + 120,
        };
      });
    });

    setNodePositions(positions);
  }, []);

  // Draw SVG connections
  useEffect(() => {
    if (!svgRef.current || Object.keys(nodePositions).length === 0) return;

    const svg = svgRef.current;
    svg.innerHTML = '';

    const connections = [
      // Chairman to CEO
      { from: 'Chairman', to: 'CEO', style: 'solid' },
      // CEO to departments
      { from: 'CEO', to: 'CTO', style: 'solid' },
      { from: 'CEO', to: 'COO', style: 'solid' },
      { from: 'CEO', to: 'CMO', style: 'solid' },
      { from: 'CEO', to: 'CFO', style: 'solid' },
      { from: 'CEO', to: 'CSO', style: 'solid' },
      // Departments to tasks
      ...Object.keys(nodePositions)
        .filter(k => !['CEO', 'Chairman', 'CTO', 'COO', 'CMO', 'CFO', 'CSO'].includes(k))
        .map(taskId => {
          const dept = data.tasks.find(t => t.id === taskId)?.dept || 'CEO';
          return { from: dept, to: taskId, style: 'dashed' };
        }),
    ];

    connections.forEach((conn, idx) => {
      const fromPos = nodePositions[conn.from];
      const toPos = nodePositions[conn.to];
      if (!fromPos || !toPos) return;

      // Draw line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      const deptColor = data.departments[conn.from]?.color || '#999';
      line.setAttribute('x1', fromPos.x);
      line.setAttribute('y1', fromPos.y + 25);
      line.setAttribute('x2', toPos.x);
      line.setAttribute('y2', toPos.y - 20);
      line.setAttribute('stroke', deptColor);
      line.setAttribute('stroke-width', '2');
      line.setAttribute('stroke-dasharray', conn.style === 'dashed' ? '5,5' : '0');
      line.setAttribute('opacity', '0.7');
      svg.appendChild(line);

      // Add animated dots (only for solid lines)
      if (conn.style === 'solid') {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', deptColor);
        circle.setAttribute('opacity', '0.8');
        circle.style.animation = `flowDot 2s linear infinite`;
        circle.style.animationDelay = `${idx * 0.2}s`;

        // Manual path animation
        const animateCircle = () => {
          const duration = 2000;
          const start = performance.now();
          const animate = (now) => {
            const progress = ((now - start) % duration) / duration;
            const x = fromPos.x + (toPos.x - fromPos.x) * progress;
            const y = (fromPos.y + 25) + (toPos.y - 20 - (fromPos.y + 25)) * progress;
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        };
        animateCircle();
        svg.appendChild(circle);
      }
    });
  }, [nodePositions, data]);

  return (
    <div style={styles.nodeGraphContainer} ref={containerRef}>
      <svg ref={svgRef} style={styles.svg} />
      <div style={styles.nodesContainer}>
        {/* Chairman Node */}
        <NodeBox
          name="自分"
          subtitle="Chairman"
          pos={nodePositions.Chairman}
          health="green"
          icon="👑"
          isChairman
          hoveredNode={hoveredNode}
          setHoveredNode={setHoveredNode}
        />

        {/* CEO Node */}
        <NodeBox
          name="CEO"
          subtitle="統括"
          pos={nodePositions.CEO}
          health={data.departments.CEO?.health || 'green'}
          icon="🎯"
          hoveredNode={hoveredNode}
          setHoveredNode={setHoveredNode}
          details={data.departments.CEO?.metrics}
        />

        {/* Department Nodes */}
        {['CTO', 'COO', 'CMO', 'CFO', 'CSO'].map(dept => (
          <NodeBox
            key={dept}
            name={dept}
            subtitle="部門"
            pos={nodePositions[dept]}
            health={data.departments[dept]?.health || 'yellow'}
            color={data.departments[dept]?.color}
            icon={deptIcons[dept]}
            hoveredNode={hoveredNode}
            setHoveredNode={setHoveredNode}
            details={data.departments[dept]?.metrics}
            taskCount={data.tasks.filter(t => t.dept === dept).length}
          />
        ))}

        {/* Task Nodes */}
        {data.tasks.map(task => (
          <NodeBox
            key={task.id}
            name={task.name}
            subtitle={task.schedule}
            pos={nodePositions[task.id]}
            health={task.status}
            isTask
            color={data.departments[task.dept]?.color}
            hoveredNode={hoveredNode}
            setHoveredNode={setHoveredNode}
            details={{ lastRun: new Date(task.lastRun).toLocaleTimeString('ja-JP'), status: task.status }}
          />
        ))}
      </div>
    </div>
  );
}

const deptIcons = {
  CTO: '🔧',
  COO: '⚙️',
  CMO: '📱',
  CFO: '💰',
  CSO: '🎓',
};

// ============================================================================
// NODE BOX COMPONENT
// ============================================================================
function NodeBox({ name, subtitle, pos, health, icon, isChairman, isTask, color, hoveredNode, setHoveredNode, details, taskCount }) {
  if (!pos) return null;

  const isHovered = hoveredNode === name;
  const healthColors = { green: '#10b981', yellow: '#f59e0b', red: '#ef4444', active: '#2563eb', healthy: '#10b981', warning: '#f59e0b' };
  const borderColor = isChairman ? '#fbbf24' : (isTask ? 'transparent' : (color || '#999'));
  const bgColor = isTask ? '#f3f4f6' : (isChairman ? '#fef3c7' : '#f8fafc');

  return (
    <div
      style={{
        position: 'absolute',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        zIndex: isHovered ? 50 : 10,
      }}
      onMouseEnter={() => setHoveredNode(name)}
      onMouseLeave={() => setHoveredNode(null)}
    >
      <div
        style={{
          ...styles.nodeBox,
          backgroundColor: bgColor,
          borderColor: borderColor,
          borderWidth: isChairman ? '3px' : '2px',
          boxShadow: isHovered ? `0 0 20px ${color || '#999'}` : 'none',
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={styles.nodeIcon}>{icon || '📦'}</div>
        <div style={styles.nodeName}>{name}</div>
        <div style={styles.nodeSubtitle}>{subtitle}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: healthColors[health] || '#ccc' }} />
          <span style={{ fontSize: '11px', color: '#666' }}>{health}</span>
        </div>

        {isHovered && details && (
          <div style={styles.nodePopup}>
            <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>詳細</div>
            {Object.entries(details).map(([key, val]) => (
              <div key={key} style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>
                <span style={{ color: '#999' }}>{key}:</span> {String(val).slice(0, 30)}
              </div>
            ))}
            {taskCount && <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: '500', color: color }}>タスク: {taskCount}件</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// KPI CARD COMPONENT
// ============================================================================
function KPICard({ icon, label, value, subtext, color }) {
  return (
    <div style={styles.kpiCard}>
      <div style={{ ...styles.kpiIcon, color }}>{icon}</div>
      <div style={styles.kpiContent}>
        <div style={styles.kpiLabel}>{label}</div>
        <div style={{ ...styles.kpiValue, color }}>{value}</div>
        <div style={styles.kpiSubtext}>{subtext}</div>
      </div>
    </div>
  );
}

// ============================================================================
// TIMELINE COMPONENT
// ============================================================================
function Timeline({ tasks, currentTime }) {
  const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 07:00 to 22:00
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  const parseScheduleTime = (schedule) => {
    const match = schedule.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      return { hour: parseInt(match[1]), minute: parseInt(match[2]) };
    }
    return null;
  };

  const getTaskStatus = (task) => {
    const taskTime = parseScheduleTime(task.schedule);
    if (!taskTime) return 'future';
    if (taskTime.hour < currentHour || (taskTime.hour === currentHour && taskTime.minute < currentMinute)) {
      return 'past';
    } else if (taskTime.hour === currentHour && Math.abs(taskTime.minute - currentMinute) < 30) {
      return 'current';
    }
    return 'future';
  };

  return (
    <div style={styles.timelineWrapper}>
      <div style={styles.timelineBar}>
        {hours.map((hour) => (
          <div key={hour} style={styles.timelineHour}>
            <div style={styles.timelineLabel}>{hour.toString().padStart(2, '0')}:00</div>
            <div style={styles.timelineGridLine} />
          </div>
        ))}

        {/* NOW indicator */}
        <div
          style={{
            position: 'absolute',
            left: `${((currentHour - 7 + currentMinute / 60) / 16) * 100}%`,
            top: 0,
            height: '100%',
            width: '2px',
            backgroundColor: '#2563eb',
            animation: 'pulse 2s infinite',
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563eb', marginTop: '24px', marginLeft: '-10px', whiteSpace: 'nowrap' }}>NOW</div>
        </div>

        {/* Task markers */}
        {tasks.map((task) => {
          const taskTime = parseScheduleTime(task.schedule);
          if (!taskTime) return null;
          const status = getTaskStatus(task);
          const colors = { past: '#10b981', current: '#2563eb', future: '#d1d5db' };

          return (
            <div
              key={task.id}
              style={{
                position: 'absolute',
                left: `${((taskTime.hour - 7 + taskTime.minute / 60) / 16) * 100}%`,
                top: '35px',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: status === 'current' ? 20 : 5,
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: colors[status],
                  boxShadow: status === 'current' ? `0 0 10px ${colors[status]}` : 'none',
                  animation: status === 'current' ? 'pulse 1s infinite' : 'none',
                }}
              />
              <div style={{ fontSize: '10px', marginTop: '4px', color: '#666', whiteSpace: 'nowrap', maxWidth: '50px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {task.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// KANBAN COLUMN COMPONENT
// ============================================================================
function KanbanColumn({ title, count, color }) {
  return (
    <div style={styles.kanbanColumn}>
      <div style={{ ...styles.kanbanHeader, borderTopColor: color }}>
        <h3 style={styles.kanbanTitle}>{title}</h3>
        <span style={{ fontSize: '14px', fontWeight: 'bold', color }}>{count}</span>
      </div>
      <div style={styles.kanbanBody}>
        <div style={styles.emptyState}>データなし</div>
      </div>
    </div>
  );
}

// ============================================================================
// ALERT ITEM COMPONENT
// ============================================================================
function AlertItem({ alert }) {
  const icons = { warning: '⚠️', error: '❌', info: 'ℹ️' };
  const colors = { warning: '#f59e0b', error: '#ef4444', info: '#3b82f6' };

  return (
    <div style={{ ...styles.alertItem, borderLeftColor: colors[alert.type] }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
        <span style={{ fontSize: '16px' }}>{icons[alert.type]}</span>
        <div style={{ flex: 1 }}>
          <div style={styles.alertMessage}>{alert.message}</div>
          <div style={styles.alertTime}>{alert.time}</div>
        </div>
      </div>
      {alert.dept && <span style={styles.alertBadge}>{alert.dept}</span>}
    </div>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: '#1f2937',
    lineHeight: '1.6',
  },
  header: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    padding: '24px',
    stickyTop: 0,
    zIndex: 100,
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },
  clock: {
    fontSize: '24px',
    fontWeight: 'bold',
    fontFamily: 'Monaco, monospace',
    color: '#2563eb',
  },
  systemHealth: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    backgroundColor: '#ecfdf5',
    borderRadius: '6px',
    border: '1px solid #d1fae5',
  },
  kpiSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    '@media (max-width: 768px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
      padding: '16px',
    },
  },
  kpiCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    ':hover': {
      borderColor: '#cbd5e1',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    },
  },
  kpiIcon: {
    fontSize: '28px',
  },
  kpiContent: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: '12px',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '2px',
  },
  kpiValue: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '2px',
  },
  kpiSubtext: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  nodeGraphSection: {
    padding: '32px 24px',
    maxWidth: '1400px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
  },
  nodeGraphContainer: {
    position: 'relative',
    width: '100%',
    height: '600px',
    backgroundColor: '#fafbfc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    marginTop: '16px',
  },
  svg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  nodesContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  nodeBox: {
    width: '90px',
    padding: '10px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '2px solid #e2e8f0',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    transition: 'all 0.2s ease',
  },
  nodeIcon: {
    fontSize: '24px',
    marginBottom: '4px',
  },
  nodeName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#000',
    marginBottom: '2px',
  },
  nodeSubtitle: {
    fontSize: '11px',
    color: '#64748b',
  },
  nodePopup: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: '8px',
    backgroundColor: '#1f2937',
    color: '#f3f4f6',
    padding: '8px',
    borderRadius: '6px',
    fontSize: '11px',
    whiteSpace: 'nowrap',
    zIndex: 100,
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#000',
    margin: '0 0 16px 0',
  },
  timelineSection: {
    padding: '32px 24px',
    maxWidth: '1400px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e2e8f0',
  },
  timelineWrapper: {
    position: 'relative',
    overflow: 'auto',
    marginTop: '16px',
  },
  timelineBar: {
    position: 'relative',
    height: '120px',
    backgroundColor: '#fafbfc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0',
    minWidth: '1200px',
  },
  timelineHour: {
    flex: 1,
    position: 'relative',
    borderRight: '1px solid #e2e8f0',
  },
  timelineLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#64748b',
    padding: '4px 0',
    textAlign: 'center',
  },
  timelineGridLine: {
    width: '1px',
    height: '60px',
    backgroundColor: '#f1f5f9',
    margin: '0 auto',
  },
  pipelineSection: {
    padding: '32px 24px',
    maxWidth: '1400px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e2e8f0',
  },
  kanbanContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
    marginTop: '16px',
  },
  kanbanColumn: {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '300px',
  },
  kanbanHeader: {
    padding: '12px 16px',
    borderTopWidth: '4px',
    borderTop: 'solid',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
  },
  kanbanTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: '#000',
  },
  kanbanBody: {
    flex: 1,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#94a3b8',
    fontSize: '13px',
  },
  alertSection: {
    padding: '32px 24px',
    maxWidth: '1400px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e2e8f0',
  },
  alertFeed: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  alertItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    borderLeft: '4px solid #f59e0b',
    border: '1px solid #e2e8f0',
  },
  alertMessage: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#000',
    marginBottom: '2px',
  },
  alertTime: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  alertBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 6px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '3px',
    whiteSpace: 'nowrap',
  },
  footer: {
    padding: '24px',
    textAlign: 'center',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    color: '#64748b',
    fontSize: '12px',
    margin: '0',
  },
};

// ============================================================================
// CSS STYLES (Global)
// ============================================================================
const cssStyles = `
  * {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes flowDot {
    0% {
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  @keyframes slideInFromBottom {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .kpi-card:hover {
    border-color: #cbd5e1;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f5f9;
  }

  ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;
