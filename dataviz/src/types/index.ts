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
}

// 仪表板配置
export interface Dashboard {
  id: string;
  title: string;
  charts: ChartConfig[];
}

// 主题类型
export type Theme = 'light' | 'dark';

// 导入的数据集
export interface ImportedDataset {
  id: string;
  name: string;
  data: DataPoint[];
  createdAt: number;
}

// 应用状态
export interface AppState {
  theme: Theme;
  currentDashboard: Dashboard | null;
  charts: ChartConfig[];
  importedDatasets: ImportedDataset[];
  isLoading: boolean;
  error: string | null;
}