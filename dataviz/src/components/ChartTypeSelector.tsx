import React from 'react';
import { useAppStore } from '../store';
import type { ChartType } from '../types';
import styles from './ChartTypeSelector.module.css';

interface ChartTypeOption {
  type: ChartType;
  name: string;
  description: string;
  icon: string;
  preview: React.ReactNode;
}

interface ChartTypeSelectorProps {
  onSelectChartType: (chartType: ChartType) => void;
}

export const ChartTypeSelector: React.FC<ChartTypeSelectorProps> = ({ onSelectChartType }) => {
  const { theme } = useAppStore();

  const chartTypes: ChartTypeOption[] = [
    {
      type: 'bar',
      name: '柱状图',
      description: '适用于比较不同类别的数据',
      icon: '📊',
      preview: (
        <svg width="60" height="40" viewBox="0 0 60 40">
          <rect x="5" y="20" width="8" height="15" fill="#0088FE" />
          <rect x="18" y="10" width="8" height="25" fill="#00C49F" />
          <rect x="31" y="15" width="8" height="20" fill="#FFBB28" />
          <rect x="44" y="5" width="8" height="30" fill="#FF8042" />
        </svg>
      )
    },
    {
      type: 'line',
      name: '折线图',
      description: '适用于显示数据随时间的变化趋势',
      icon: '📈',
      preview: (
        <svg width="60" height="40" viewBox="0 0 60 40">
          <polyline
            points="5,30 15,20 25,25 35,15 45,10 55,20"
            fill="none"
            stroke="#0088FE"
            strokeWidth="2"
          />
          <circle cx="5" cy="30" r="2" fill="#0088FE" />
          <circle cx="15" cy="20" r="2" fill="#0088FE" />
          <circle cx="25" cy="25" r="2" fill="#0088FE" />
          <circle cx="35" cy="15" r="2" fill="#0088FE" />
          <circle cx="45" cy="10" r="2" fill="#0088FE" />
          <circle cx="55" cy="20" r="2" fill="#0088FE" />
        </svg>
      )
    },
    {
      type: 'pie',
      name: '饼图',
      description: '适用于显示各部分占整体的比例',
      icon: '🥧',
      preview: (
        <svg width="60" height="40" viewBox="0 0 60 40">
          <circle cx="30" cy="20" r="15" fill="#0088FE" />
          <path
            d="M 30 20 L 30 5 A 15 15 0 0 1 42 12 Z"
            fill="#00C49F"
          />
          <path
            d="M 30 20 L 42 12 A 15 15 0 0 1 38 32 Z"
            fill="#FFBB28"
          />
          <path
            d="M 30 20 L 38 32 A 15 15 0 0 1 30 5 Z"
            fill="#FF8042"
          />
        </svg>
      )
    },
    {
      type: 'scatter',
      name: '散点图',
      description: '适用于显示两个变量之间的关系',
      icon: '⚪',
      preview: (
        <svg width="60" height="40" viewBox="0 0 60 40">
          <circle cx="10" cy="25" r="2" fill="#0088FE" />
          <circle cx="20" cy="15" r="2" fill="#00C49F" />
          <circle cx="30" cy="30" r="2" fill="#FFBB28" />
          <circle cx="40" cy="10" r="2" fill="#FF8042" />
          <circle cx="50" cy="20" r="2" fill="#8884D8" />
          <circle cx="15" cy="35" r="2" fill="#82CA9D" />
          <circle cx="35" cy="5" r="2" fill="#FFC658" />
          <circle cx="45" cy="28" r="2" fill="#FF7C7C" />
        </svg>
      )
    },
    {
      type: 'radar',
      name: '雷达图',
      description: '适用于多维数据的对比分析',
      icon: '🎯',
      preview: (
        <svg width="60" height="40" viewBox="0 0 60 40">
          <polygon
            points="30,5 45,15 40,30 20,30 15,15"
            fill="none"
            stroke="#ddd"
            strokeWidth="1"
          />
          <polygon
            points="30,10 40,18 35,25 25,25 20,18"
            fill="rgba(0,136,254,0.3)"
            stroke="#0088FE"
            strokeWidth="2"
          />
          <circle cx="30" cy="10" r="1.5" fill="#0088FE" />
          <circle cx="40" cy="18" r="1.5" fill="#0088FE" />
          <circle cx="35" cy="25" r="1.5" fill="#0088FE" />
          <circle cx="25" cy="25" r="1.5" fill="#0088FE" />
          <circle cx="20" cy="18" r="1.5" fill="#0088FE" />
        </svg>
      )
    }
  ];

  return (
    <div className={`${styles.container} ${theme === 'dark' ? styles.dark : styles.light}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>选择图表类型</h2>
        <p className={styles.subtitle}>选择最适合您数据的图表类型</p>
      </div>
      
      <div className={styles.chartGrid}>
        {chartTypes.map((chartType) => (
          <div
            key={chartType.type}
            className={`${styles.chartCard} ${theme === 'dark' ? styles.dark : styles.light}`}
            onClick={() => onSelectChartType(chartType.type)}
          >
            <div className={styles.cardHeader}>
              <span className={styles.icon}>{chartType.icon}</span>
              <h3 className={styles.chartName}>{chartType.name}</h3>
            </div>
            
            <div className={styles.previewContainer}>
              {chartType.preview}
            </div>
            
            <p className={styles.description}>{chartType.description}</p>
            
            <div className={styles.selectButton}>
              <span>选择此图表</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartTypeSelector;