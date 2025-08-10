import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import type { Dashboard } from '../types';
import type { ChartConfig } from '../types/chart';
import styles from './DashboardManager.module.css';

interface DashboardManagerProps {}

export const DashboardManager: React.FC<DashboardManagerProps> = () => {
  const { theme, currentDashboard, setCurrentDashboard, charts, removeChart } = useAppStore();
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
  const [showChartDropdown, setShowChartDropdown] = useState<string | null>(null);

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

  // 删除图表
  const handleDeleteChart = (chartId: string) => {
    if (confirm('确定要删除这个图表吗？删除后将从所有仪表板中移除。')) {
      // 从所有仪表板中移除该图表
      const updatedDashboards = dashboards.map(dashboard => ({
        ...dashboard,
        charts: dashboard.charts.filter(chart => chart.id !== chartId)
      }));
      saveDashboards(updatedDashboards);
      
      // 更新当前仪表板
      if (currentDashboard) {
        const updatedCurrentDashboard = updatedDashboards.find(d => d.id === currentDashboard.id);
        if (updatedCurrentDashboard) {
          setCurrentDashboard(updatedCurrentDashboard);
        }
      }
      
      // 从全局图表列表中删除
      removeChart(chartId);
      
      // 关闭下拉框
      setShowChartDropdown(null);
    }
  };

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showChartDropdown) {
        const target = event.target as Element;
        if (!target.closest('[data-dropdown]')) {
          setShowChartDropdown(null);
        }
      }
    };

    // 使用捕获阶段以确保在冒泡之前处理
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [showChartDropdown]);

  return (
    <div className={`${styles.container} ${styles[theme]}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.titleIcon}>📊</span>
          仪表板管理
        </h2>
        <button
          onClick={() => navigate('/dashboard')}
          className={styles.closeButton}
          aria-label="关闭"
        >
          ×
        </button>
      </div>

      {/* 创建新仪表板 */}
      <div className={styles.createSection}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>✨</span>
          创建新仪表板
        </h3>
        <div className={styles.createForm}>
          <input
            type="text"
            value={newDashboardTitle}
            onChange={(e) => setNewDashboardTitle(e.target.value)}
            placeholder="输入仪表板标题"
            className={styles.input}
            maxLength={50}
          />
          <button
            onClick={handleCreateDashboard}
            className={`${styles.button} ${styles.primaryButton}`}
            disabled={!newDashboardTitle.trim()}
          >
            创建
          </button>
        </div>
      </div>

      {/* 仪表板列表 */}
      <div className={styles.dashboardsSection}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📋</span>
          我的仪表板
        </h3>
        
        {dashboards.length === 0 ? (
          <div className={styles.emptyDashboards}>
            <p className={styles.emptyMessage}>
              暂无仪表板，请创建新的仪表板
            </p>
          </div>
        ) : (
          <div className={styles.dashboardList}>
            {dashboards.map(dashboard => (
              <div 
                key={dashboard.id} 
                className={`${styles.dashboardCard} ${currentDashboard && currentDashboard.id === dashboard.id ? styles.active : ''}`}
              >
                {editingDashboardId === dashboard.id ? (
                  <div className={styles.editForm}>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className={styles.input}
                      placeholder="仪表板标题"
                      autoFocus
                    />
                    <div className={styles.actionButtons}>
                      <button
                        onClick={handleSaveEdit}
                        className={`${styles.button} ${styles.primaryButton}`}
                        disabled={!editingTitle.trim()}
                      >
                        保存
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className={`${styles.button} ${styles.secondaryButton}`}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.dashboardInfo}>
                    <h3 className={styles.dashboardTitle}>
                      {dashboard.title}
                    </h3>
                    <div className={styles.dashboardActions}>
                      <button
                        onClick={() => handleSelectDashboard(dashboard)}
                        className={`${styles.button} ${styles.primaryButton}`}
                      >
                        查看
                      </button>
                      <button
                        onClick={() => handleStartEdit(dashboard)}
                        className={`${styles.button} ${styles.secondaryButton}`}
                        aria-label="编辑仪表板"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteDashboard(dashboard.id)}
                        className={`${styles.button} ${styles.dangerButton}`}
                        aria-label="删除仪表板"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                )}
                
                {/* 图表列表 */}
                <div className={styles.chartSection}>
                  <div className={styles.chartHeader}>
                    <span className={styles.chartCount}>
                      图表 ({dashboard.charts.length})
                    </span>
                    <div className={styles.dropdown} data-dropdown>
                      <button
                        onClick={() => setShowChartDropdown(showChartDropdown === dashboard.id ? null : dashboard.id)}
                        className={styles.dropdownButton}
                        aria-label="添加图表"
                      >
                        添加图表
                        <span className={styles.dropdownArrow}>▼</span>
                      </button>
                      
                      {showChartDropdown === dashboard.id && (
                        <div className={styles.dropdownMenu}>
                          {charts.length === 0 ? (
                            <div className={styles.emptyDropdownMessage}>
                              暂无可添加的图表
                            </div>
                          ) : (
                            charts.map(chart => (
                              <div
                                key={chart.id}
                                className={styles.dropdownItem}
                              >
                                <span
                                  onClick={() => {
                                    handleAddChartToDashboard(dashboard.id, chart.id);
                                    setShowChartDropdown(null);
                                  }}
                                  className={styles.dropdownItemText}
                                >
                                  {chart.title} ({chart.type})
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleDeleteChart(chart.id);
                                  }}
                                  className={`${styles.button} ${styles.dangerButton} ${styles.miniButton}`}
                                  aria-label="删除图表"
                                >
                                  删除
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {dashboard.charts.length === 0 ? (
                    <div className={styles.emptyCharts}>
                      <p className={styles.emptyChartMessage}>
                        暂无图表，请添加图表
                      </p>
                    </div>
                  ) : (
                    <ul className={styles.chartList}>
                      {dashboard.charts.map(chart => (
                        <li 
                          key={chart.id}
                          className={styles.chartItem}
                        >
                          <span className={styles.chartItemText}>
                            {chart.title} ({chart.type})
                          </span>
                          <button
                            onClick={() => handleRemoveChartFromDashboard(dashboard.id, chart.id)}
                            className={`${styles.button} ${styles.secondaryButton} ${styles.smallButton}`}
                            aria-label="从仪表板移除图表"
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