import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import Chart from './Chart';
import styles from './Dashboard.module.css';

interface DashboardProps {
  onEditChart?: (chartId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onEditChart }) => {
  const { currentDashboard, theme } = useAppStore();
  const navigate = useNavigate();

  if (!currentDashboard) {
    return (
      <div className={`${styles.emptyState} ${theme === 'dark' ? styles.dark : styles.light}`}>
        <h2>暂无仪表板数据</h2>
        <p>请加载数据或创建新的仪表板</p>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${theme === 'dark' ? styles.dark : styles.light}`}>
      <div className={styles.dashboardHeader}>
        <h1 className={`${styles.title} ${theme === 'dark' ? styles.dark : styles.light}`}>
          {currentDashboard.title}
          <span className={styles.chartCount}>({currentDashboard.charts.length} 个图表)</span>
        </h1>
      </div>
      
      <div className={styles.grid}>
        {currentDashboard.charts.map((chart) => (
          <div 
            key={chart.id} 
            className={`${styles.chartCard} ${theme === 'dark' ? styles.dark : styles.light}`}
          >
            <Chart config={chart} />
            
            <button
              onClick={() => navigate(`/edit/${chart.id}`)}
              className={`${styles.editButton} ${theme === 'dark' ? styles.dark : styles.light}`}
              aria-label="编辑图表"
            >
              <span className={styles.editIcon}>✏️</span> 编辑
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;