import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import type { Dashboard, ChartConfig } from '../types';

interface DashboardManagerProps {}

export const DashboardManager: React.FC<DashboardManagerProps> = () => {
  const { theme, currentDashboard, setCurrentDashboard, charts } = useAppStore();
  const navigate = useNavigate();
  const [dashboards, setDashboards] = useState<Dashboard[]>(() => {
    // 从localStorage加载仪表板
    const savedDashboards = localStorage.getItem('dashboards');
    if (savedDashboards) {
      try {
        return JSON.parse(savedDashboards);
      } catch (e) {
        console.error('Failed to parse dashboards:', e);
      }
    }
    // 如果没有保存的仪表板，使用当前仪表板（如果有）
    return currentDashboard ? [currentDashboard] : [];
  });
  
  const [newDashboardTitle, setNewDashboardTitle] = useState('');
  const [editingDashboardId, setEditingDashboardId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // 保存仪表板到localStorage
  const saveDashboards = (updatedDashboards: Dashboard[]) => {
    localStorage.setItem('dashboards', JSON.stringify(updatedDashboards));
    setDashboards(updatedDashboards);
  };

  // 创建新仪表板
  const handleCreateDashboard = () => {
    if (!newDashboardTitle.trim()) {
      alert('请输入仪表板标题');
      return;
    }

    const newDashboard: Dashboard = {
      id: `dashboard-${Date.now()}`,
      title: newDashboardTitle,
      charts: [],
    };

    const updatedDashboards = [...dashboards, newDashboard];
    saveDashboards(updatedDashboards);
    setNewDashboardTitle('');
  };

  // 选择仪表板
  const handleSelectDashboard = (dashboard: Dashboard) => {
    setCurrentDashboard(dashboard);
    navigate('/dashboard');
  };

  // 删除仪表板
  const handleDeleteDashboard = (dashboardId: string) => {
    if (confirm('确定要删除这个仪表板吗？')) {
      const updatedDashboards = dashboards.filter(d => d.id !== dashboardId);
      saveDashboards(updatedDashboards);
      
      // 如果删除的是当前仪表板，则设置为null或第一个可用的仪表板
      if (currentDashboard && currentDashboard.id === dashboardId) {
        setCurrentDashboard(updatedDashboards.length > 0 ? updatedDashboards[0] : null);
      }
    }
  };

  // 开始编辑仪表板标题
  const handleStartEdit = (dashboard: Dashboard) => {
    setEditingDashboardId(dashboard.id);
    setEditingTitle(dashboard.title);
  };

  // 保存编辑后的仪表板标题
  const handleSaveEdit = () => {
    if (!editingTitle.trim()) {
      alert('请输入仪表板标题');
      return;
    }

    const updatedDashboards = dashboards.map(dashboard => {
      if (dashboard.id === editingDashboardId) {
        return { ...dashboard, title: editingTitle };
      }
      return dashboard;
    });

    saveDashboards(updatedDashboards);
    
    // 如果编辑的是当前仪表板，也更新当前仪表板
    if (currentDashboard && currentDashboard.id === editingDashboardId) {
      setCurrentDashboard({ ...currentDashboard, title: editingTitle });
    }
    
    setEditingDashboardId(null);
    setEditingTitle('');
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingDashboardId(null);
    setEditingTitle('');
  };

  // 添加图表到仪表板
  const handleAddChartToDashboard = (dashboardId: string, chartId: string) => {
    const chart = charts.find(c => c.id === chartId);
    if (!chart) return;

    const updatedDashboards = dashboards.map(dashboard => {
      if (dashboard.id === dashboardId) {
        // 检查图表是否已经在仪表板中
        const chartExists = dashboard.charts.some(c => c.id === chartId);
        if (chartExists) {
          alert('该图表已在仪表板中');
          return dashboard;
        }
        return { 
          ...dashboard, 
          charts: [...dashboard.charts, chart] 
        };
      }
      return dashboard;
    });

    saveDashboards(updatedDashboards);
    
    // 如果添加到当前仪表板，也更新当前仪表板
    if (currentDashboard && currentDashboard.id === dashboardId) {
      setCurrentDashboard(updatedDashboards.find(d => d.id === dashboardId) || currentDashboard);
    }
  };

  // 从仪表板移除图表
  const handleRemoveChartFromDashboard = (dashboardId: string, chartId: string) => {
    const updatedDashboards = dashboards.map(dashboard => {
      if (dashboard.id === dashboardId) {
        return { 
          ...dashboard, 
          charts: dashboard.charts.filter(chart => chart.id !== chartId) 
        };
      }
      return dashboard;
    });

    saveDashboards(updatedDashboards);
    
    // 如果从当前仪表板移除，也更新当前仪表板
    if (currentDashboard && currentDashboard.id === dashboardId) {
      setCurrentDashboard(updatedDashboards.find(d => d.id === dashboardId) || currentDashboard);
    }
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f8f8f8',
      borderRadius: '8px',
      boxShadow: theme === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
      maxWidth: '800px',
      margin: '0 auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: theme === 'dark' ? '#fff' : '#333', margin: 0 }}>
          仪表板管理
        </h2>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: theme === 'dark' ? '#aaa' : '#666',
          }}
        >
          ×
        </button>
      </div>

      {/* 创建新仪表板 */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: theme === 'dark' ? '#333' : '#fff',
        borderRadius: '4px',
      }}>
        <h3 style={{ color: theme === 'dark' ? '#ddd' : '#444', marginTop: 0 }}>
          创建新仪表板
        </h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newDashboardTitle}
            onChange={(e) => setNewDashboardTitle(e.target.value)}
            placeholder="输入仪表板标题"
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '4px',
              border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
              backgroundColor: theme === 'dark' ? '#444' : '#fff',
              color: theme === 'dark' ? '#fff' : '#333',
            }}
          />
          <button
            onClick={handleCreateDashboard}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#646cff',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            创建
          </button>
        </div>
      </div>

      {/* 仪表板列表 */}
      <div>
        <h3 style={{ color: theme === 'dark' ? '#ddd' : '#444' }}>
          我的仪表板
        </h3>
        
        {dashboards.length === 0 ? (
          <p style={{ color: theme === 'dark' ? '#aaa' : '#666', textAlign: 'center' }}>
            暂无仪表板，请创建新的仪表板
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {dashboards.map(dashboard => (
              <div 
                key={dashboard.id}
                style={{
                  padding: '15px',
                  backgroundColor: theme === 'dark' ? '#333' : '#fff',
                  borderRadius: '4px',
                  borderLeft: dashboard.id === currentDashboard?.id 
                    ? '4px solid #646cff' 
                    : `4px solid ${theme === 'dark' ? '#333' : '#fff'}`,
                }}
              >
                {editingDashboardId === dashboard.id ? (
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '4px',
                        border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                        backgroundColor: theme === 'dark' ? '#444' : '#fff',
                        color: theme === 'dark' ? '#fff' : '#333',
                      }}
                    />
                    <button
                      onClick={handleSaveEdit}
                      style={{
                        padding: '8px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: '#4caf50',
                        color: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      保存
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        padding: '8px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: theme === 'dark' ? '#555' : '#e0e0e0',
                        color: theme === 'dark' ? '#fff' : '#333',
                        cursor: 'pointer',
                      }}
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ color: theme === 'dark' ? '#fff' : '#333', margin: 0 }}>
                      {dashboard.title}
                    </h4>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={() => handleStartEdit(dashboard)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: theme === 'dark' ? '#444' : '#f0f0f0',
                          color: theme === 'dark' ? '#ddd' : '#555',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteDashboard(dashboard.id)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: '#ff4d4f',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        删除
                      </button>
                      <button
                        onClick={() => handleSelectDashboard(dashboard)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: '#646cff',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        查看
                      </button>
                    </div>
                  </div>
                )}
                
                {/* 图表列表 */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '5px',
                    borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#eee'}`,
                    paddingBottom: '5px'
                  }}>
                    <span style={{ color: theme === 'dark' ? '#bbb' : '#666', fontSize: '14px' }}>
                      图表 ({dashboard.charts.length})
                    </span>
                    <div>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddChartToDashboard(dashboard.id, e.target.value);
                            e.target.value = ''; // 重置选择
                          }
                        }}
                        style={{
                          padding: '5px',
                          borderRadius: '4px',
                          border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                          backgroundColor: theme === 'dark' ? '#444' : '#fff',
                          color: theme === 'dark' ? '#fff' : '#333',
                          fontSize: '12px',
                        }}
                        value=""
                      >
                        <option value="">添加图表...</option>
                        {charts.map(chart => (
                          <option key={chart.id} value={chart.id}>
                            {chart.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {dashboard.charts.length === 0 ? (
                    <p style={{ color: theme === 'dark' ? '#aaa' : '#888', fontSize: '14px', textAlign: 'center' }}>
                      暂无图表，请添加图表
                    </p>
                  ) : (
                    <ul style={{ 
                      listStyle: 'none', 
                      padding: 0, 
                      margin: 0,
                      maxHeight: '150px',
                      overflowY: 'auto',
                    }}>
                      {dashboard.charts.map(chart => (
                        <li 
                          key={chart.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 5px',
                            borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#f0f0f0'}`,
                            fontSize: '14px',
                          }}
                        >
                          <span style={{ color: theme === 'dark' ? '#ddd' : '#333' }}>
                            {chart.title} ({chart.type})
                          </span>
                          <button
                            onClick={() => handleRemoveChartFromDashboard(dashboard.id, chart.id)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              border: 'none',
                              backgroundColor: theme === 'dark' ? '#555' : '#f0f0f0',
                              color: theme === 'dark' ? '#ddd' : '#666',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            移除
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardManager;