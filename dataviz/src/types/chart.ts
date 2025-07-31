// 数据类型定义
export interface DataPoint {
  id: string;
  name: string;
  value: number;
  category?: string;
  timestamp?: string;
}

// 图表类型
export type ChartType = 'bar' | 'line' | 'pie';

// 图表配置
export interface ChartConfig {
  id: string;
  title: string;
  type: ChartType;
  data: DataPoint[];
  width?: number;
  height?: number;
  // 样式相关属性
  backgroundColor?: string;
  textColor?: string;
  barColor?: string;
  lineColor?: string;
  pieColors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
}