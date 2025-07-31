import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ChartConfig } from '../types/chart';
import styles from './Chart.module.css';
import { useAppStore } from '../store';

interface ChartProps {
  config: ChartConfig;
}

// 饼图颜色配置
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const Chart: React.FC<ChartProps> = ({ config }) => {
  const { 
    type, 
    data, 
    width = 600, 
    height = 300, 
    title,
    backgroundColor,
    textColor,
    barColor = '#8884d8',
    lineColor = '#8884d8',
    pieColors = COLORS,
    showLegend = true,
    showGrid = true
  } = config;
  const { theme } = useAppStore();

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart 
              data={data}
              style={backgroundColor ? { backgroundColor } : undefined}
            >
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="name" stroke={textColor} />
              <YAxis stroke={textColor} />
              <Tooltip />
              {showLegend && <Legend />}
              <Bar dataKey="value" fill={barColor} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart 
              data={data}
              style={backgroundColor ? { backgroundColor } : undefined}
            >
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="name" stroke={textColor} />
              <YAxis stroke={textColor} />
              <Tooltip />
              {showLegend && <Legend />}
              <Line type="monotone" dataKey="value" stroke={lineColor} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart style={backgroundColor ? { backgroundColor } : undefined}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={pieColors[index % pieColors.length]} 
                  />
                ))}
              </Pie>
              <Tooltip />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <div className={`${styles.unsupportedType} ${theme === 'dark' ? styles.dark : styles.light}`}>不支持的图表类型</div>;
    }
  };

  return (
    <div className={styles.chartContainer}>
      <h3 className={`${styles.chartTitle} ${theme === 'dark' ? styles.dark : styles.light}`}>{title}</h3>
      {renderChart()}
    </div>
  );
};

export default Chart;