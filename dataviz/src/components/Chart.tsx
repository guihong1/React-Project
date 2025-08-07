import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ChartConfig, BarChartConfig, LineChartConfig, PieChartConfig, ScatterChartConfig, RadarChartConfig } from '../types/chart';
import styles from './Chart.module.css';
import { useAppStore } from '../store';

interface ChartProps {
  config: ChartConfig;
}

// 饼图颜色配置
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const Chart: React.FC<ChartProps> = ({ config }) => {
  const { theme } = useAppStore();

  // 柱状图渲染函数
  const renderBarChart = (config: BarChartConfig) => {
    const { data, width = 600, height = 300, backgroundColor, textColor, barColor = '#8884d8', showLegend = true, showGrid = true } = config;
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
  };

  // 折线图渲染函数
  const renderLineChart = (config: LineChartConfig) => {
    const { data, width = 600, height = 300, backgroundColor, textColor, lineColor = '#8884d8', showLegend = true, showGrid = true } = config;
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
  };

  // 饼图渲染函数
  const renderPieChart = (config: PieChartConfig) => {
    const { data, width = 600, height = 300, backgroundColor, pieColors = COLORS, showLegend = true } = config;
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
  };

  // 散点图渲染函数
  const renderScatterChart = (config: ScatterChartConfig) => {
    const { data, width = 600, height = 300, backgroundColor, textColor, xAxisName = 'X', yAxisName = 'Y', showBubble = false, showLegend = true, showGrid = true } = config;
    const scatterColor = theme === 'dark' ? '#8884d8' : '#82ca9d';
    
    // 数据验证
    if (!data || !Array.isArray(data) || data.length === 0) {
      return (
        <div style={{ 
          width: '100%', 
          height: height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: theme === 'dark' ? '#fff' : '#333'
        }}>
          暂无数据
        </div>
      );
    }
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart
          data={data}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis 
            type="number" 
            dataKey="x" 
            name={xAxisName}
            stroke={textColor}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name={yAxisName}
            stroke={textColor}
          />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          {showLegend && <Legend />}
          {showBubble && <ZAxis type="number" dataKey="z" range={[50, 500]} />}
          <Scatter 
            name={config.title} 
            data={data} 
            fill={scatterColor} 
          />
        </ScatterChart>
      </ResponsiveContainer>
    );
  };

  // 雷达图渲染函数
  const renderRadarChart = (config: RadarChartConfig) => {
    const { data, width = 600, height = 300, backgroundColor, legendNames = [], showLegend = true } = config;
    const colors = theme === 'dark' 
      ? ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe']
      : ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];
    
    // 数据验证和处理
    if (!data || !Array.isArray(data) || data.length === 0) {
      return (
        <div style={{ 
          width: '100%', 
          height: height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: theme === 'dark' ? '#fff' : '#333'
        }}>
          暂无数据
        </div>
      );
    }
    
    // 确保数据格式正确
    const validData = data.filter(dataSet => Array.isArray(dataSet) && dataSet.length > 0);
    if (validData.length === 0) {
      return (
        <div style={{ 
          width: '100%', 
          height: height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: theme === 'dark' ? '#fff' : '#333'
        }}>
          数据格式错误
        </div>
      );
    }
    
    // 合并所有数据集的维度，创建完整的雷达图数据结构
    const allSubjects = Array.from(new Set(validData.flat().map(item => item.subject).filter(Boolean)));
    const radarData = allSubjects.map(subject => {
      const dataPoint: any = { subject };
      validData.forEach((dataSet, index) => {
        const item = dataSet.find(d => d.subject === subject);
        const seriesName = legendNames[index] || `数据集${index + 1}`;
        dataPoint[seriesName] = item ? item.value : 0;
      });
      return dataPoint;
    });
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart 
          cx="50%" 
          cy="50%" 
          outerRadius="80%" 
          data={radarData}
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis />
          {validData.map((dataSet, index) => {
            const seriesName = legendNames[index] || `数据集${index + 1}`;
            return (
              <Radar
                key={index}
                name={seriesName}
                dataKey={seriesName}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.6}
              />
            );
          })}
          {showLegend && <Legend />}
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    );
  };

  const renderChart = () => {
    switch (config.type) {
      case 'bar':
        return renderBarChart(config as BarChartConfig);
      case 'line':
        return renderLineChart(config as LineChartConfig);
      case 'pie':
        return renderPieChart(config as PieChartConfig);
      case 'scatter':
        return renderScatterChart(config as ScatterChartConfig);
      case 'radar':
        return renderRadarChart(config as RadarChartConfig);
      default:
        return <div className={`${styles.unsupportedType} ${theme === 'dark' ? styles.dark : styles.light}`}>不支持的图表类型</div>;
    }
  };

  return (
    <div className={styles.chartContainer}>
      <h3 className={`${styles.chartTitle} ${theme === 'dark' ? styles.dark : styles.light}`}>{config.title}</h3>
      {renderChart()}
    </div>
  );
};

export default Chart;