// 从outlierDetection.ts导入的接口
import type { OutlierDetectionResult } from '../utils/outlierDetection';

// 数据类型定义
export interface DataPoint {
  id: string;
  name: string;
  value: number;
  category?: string;
  timestamp?: string;
}

// 带有异常值标记的数据点
export interface DataPointWithOutlier extends DataPoint {
  outlier?: OutlierDetectionResult;
}

// 图表类型
export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'radar';

// 散点图数据点
export interface ScatterDataPoint {
  id: string;
  x: number;  // X轴值
  y: number;  // Y轴值
  z?: number; // 气泡大小（可选）
  name?: string; // 数据点名称（可选）
}

// 雷达图数据点
export interface RadarDataPoint {
  subject: string; // 维度名称
  value: number;   // 该维度的值
  fullMark?: number; // 该维度的满分值（可选）
}

// 基础图表配置
export interface BaseChartConfig {
  id: string;
  title: string;
  width?: number;
  height?: number;
  // 样式相关属性
  backgroundColor?: string;
  textColor?: string;
  showLegend?: boolean;
  showGrid?: boolean;
}

// 柱状图配置
export interface BarChartConfig extends BaseChartConfig {
  type: 'bar';
  data: DataPoint[];
  barColor?: string;
}

// 折线图配置
export interface LineChartConfig extends BaseChartConfig {
  type: 'line';
  data: DataPoint[];
  lineColor?: string;
}

// 饼图配置
export interface PieChartConfig extends BaseChartConfig {
  type: 'pie';
  data: DataPoint[];
  pieColors?: string[];
}

// 散点图配置
export interface ScatterChartConfig extends BaseChartConfig {
  type: 'scatter';
  data: ScatterDataPoint[];
  xAxisName?: string; // X轴名称
  yAxisName?: string; // Y轴名称
  showBubble?: boolean; // 是否显示气泡大小
}

// 雷达图配置
export interface RadarChartConfig extends BaseChartConfig {
  type: 'radar';
  data: RadarDataPoint[][];
  legendNames?: string[]; // 多组数据的图例名称
}

// 图表配置联合类型
export type ChartConfig = BarChartConfig | LineChartConfig | PieChartConfig | ScatterChartConfig | RadarChartConfig;

// 添加一个运行时的空对象，确保ChartConfig在运行时可用
export const ChartConfig = {};