import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import type { ChartType } from '../types';
import styles from './HomePage.module.css';

interface ChartTypeOption {
  type: ChartType;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

const HomePage: React.FC = () => {
  const { theme } = useAppStore();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const chartTypes: ChartTypeOption[] = [
    {
      type: 'bar',
      name: '动态柱状图',
      description: '展示数据的对比关系',
      category: '柱状图',
      icon: (
        <svg viewBox="0 0 100 60" className={styles.chartIcon}>
          <rect x="10" y="30" width="15" height="25" fill="#4CAF50" />
          <rect x="30" y="20" width="15" height="35" fill="#2196F3" />
          <rect x="50" y="35" width="15" height="20" fill="#FF9800" />
          <rect x="70" y="15" width="15" height="40" fill="#9C27B0" />
        </svg>
      )
    },
    {
      type: 'line',
      name: '动态折线图',
      description: '展示数据的趋势变化',
      category: '折线图',
      icon: (
        <svg viewBox="0 0 100 60" className={styles.chartIcon}>
          <polyline
            points="10,45 30,25 50,35 70,15 90,30"
            fill="none"
            stroke="#2196F3"
            strokeWidth="3"
          />
          <circle cx="10" cy="45" r="3" fill="#2196F3" />
          <circle cx="30" cy="25" r="3" fill="#2196F3" />
          <circle cx="50" cy="35" r="3" fill="#2196F3" />
          <circle cx="70" cy="15" r="3" fill="#2196F3" />
          <circle cx="90" cy="30" r="3" fill="#2196F3" />
        </svg>
      )
    },
    {
      type: 'pie',
      name: '基础饼图',
      description: '展示数据的占比关系',
      category: '饼图',
      icon: (
        <svg viewBox="0 0 100 60" className={styles.chartIcon}>
          <circle cx="50" cy="30" r="25" fill="#4CAF50" />
          <path d="M 50 30 L 50 5 A 25 25 0 0 1 71.65 42.5 Z" fill="#2196F3" />
          <path d="M 50 30 L 71.65 42.5 A 25 25 0 0 1 28.35 42.5 Z" fill="#FF9800" />
          <path d="M 50 30 L 28.35 42.5 A 25 25 0 0 1 50 5 Z" fill="#9C27B0" />
        </svg>
      )
    },
    {
      type: 'scatter',
      name: '散点图',
      description: '展示数据的分布关系',
      category: '散点图',
      icon: (
        <svg viewBox="0 0 100 60" className={styles.chartIcon}>
          <circle cx="20" cy="40" r="4" fill="#4CAF50" />
          <circle cx="35" cy="25" r="4" fill="#2196F3" />
          <circle cx="50" cy="35" r="4" fill="#FF9800" />
          <circle cx="65" cy="20" r="4" fill="#9C27B0" />
          <circle cx="80" cy="45" r="4" fill="#F44336" />
          <circle cx="25" cy="15" r="4" fill="#00BCD4" />
          <circle cx="70" cy="40" r="4" fill="#8BC34A" />
        </svg>
      )
    },
    {
      type: 'radar',
      name: '雷达图',
      description: '展示多维数据对比',
      category: '雷达图',
      icon: (
        <svg viewBox="0 0 100 60" className={styles.chartIcon}>
          <polygon
            points="50,10 70,25 65,45 35,45 30,25"
            fill="rgba(33, 150, 243, 0.3)"
            stroke="#2196F3"
            strokeWidth="2"
          />
          <polygon
            points="50,5 75,20 70,50 30,50 25,20"
            fill="none"
            stroke="#ddd"
            strokeWidth="1"
          />
        </svg>
      )
    }
  ];

  const categories = ['all', '柱状图', '折线图', '饼图', '散点图', '雷达图'];

  const filteredCharts = selectedCategory === 'all' 
    ? chartTypes 
    : chartTypes.filter(chart => chart.category === selectedCategory);

  const handleChartSelect = (chartType: ChartType) => {
    navigate(`/create?type=${chartType}`);
  };

  return (
    <div className={`${styles.container} ${theme === 'dark' ? styles.dark : styles.light}`}>
      <div className={styles.header}>
        <h1>选择图表类型</h1>
        <p>从下方选择一个图表类型开始创建您的数据可视化</p>
      </div>

      {/* 分类筛选 */}
      <div className={styles.categoryFilter}>
        {categories.map(category => (
          <button
            key={category}
            className={`${styles.categoryButton} ${
              selectedCategory === category ? styles.active : ''
            } ${theme === 'dark' ? styles.dark : styles.light}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category === 'all' ? '全部' : category}
          </button>
        ))}
      </div>

      {/* 图表类型网格 */}
      <div className={styles.chartGrid}>
        {filteredCharts.map(chart => (
          <div
            key={chart.type}
            className={`${styles.chartCard} ${theme === 'dark' ? styles.dark : styles.light}`}
            onClick={() => handleChartSelect(chart.type)}
          >
            <div className={styles.chartIconContainer}>
              {chart.icon}
            </div>
            <div className={styles.chartInfo}>
              <h3>{chart.name}</h3>
              <p>{chart.description}</p>
            </div>
            <div className={styles.selectButton}>
              <span>选择</span>
            </div>
          </div>
        ))}
      </div>

      {/* 快速操作 */}
      <div className={styles.quickActions}>
        <button 
          className={`${styles.actionButton} ${theme === 'dark' ? styles.dark : styles.light}`}
          onClick={() => navigate('/import')}
        >
          <span className={styles.actionIcon}>📊</span>
          导入数据
        </button>
        <button 
          className={`${styles.actionButton} ${theme === 'dark' ? styles.dark : styles.light}`}
          onClick={() => navigate('/dashboard')}
        >
          <span className={styles.actionIcon}>📈</span>
          查看仪表板
        </button>
        <button 
          className={`${styles.actionButton} ${theme === 'dark' ? styles.dark : styles.light}`}
          onClick={() => navigate('/ai')}
        >
          <span className={styles.actionIcon}>🤖</span>
          AI分析
        </button>
      </div>

      {/* 功能提示 */}
      <div className={`${styles.featureTip} ${theme === 'dark' ? styles.dark : styles.light}`}>
        <div className={styles.tipIcon}>💡</div>
        <div className={styles.tipContent}>
          <h4>操作历史记录功能</h4>
          <p>撤销/重做和历史记录功能已集成到应用中！</p>
          <p>📍 <strong>在仪表板页面</strong>和<strong>图表创建页面</strong>的右上角可以找到历史记录控制按钮</p>
          <p>🔄 支持撤销、重做操作，以及查看完整的操作历史记录</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;