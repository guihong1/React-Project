// 数据类型定义
export interface DataPoint {
  id: string;
  name: string;
  value: number;
  category?: string;
  timestamp?: string;
}

// 图表类型
export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'radar';

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

// AI模型类型
export interface AIModel {
  id: string;          // 模型唯一标识
  name: string;        // 模型名称
  provider: string;    // 提供商（如OpenAI、百度、阿里等）
  apiEndpoint: string; // API端点URL
  apiKey: string;      // API密钥
  apiVersion?: string; // API版本
  isCustom: boolean;   // 是否为自定义模型
  isDefault: boolean;  // 是否为默认模型
}

// 应用状态
export interface AppState {
  theme: Theme;
  currentDashboard: Dashboard | null;
  charts: ChartConfig[];
  importedDatasets: ImportedDataset[];
  isLoading: boolean;
  error: string | null;
  // AI配置相关
  aiModels: AIModel[];
  selectedAIModelId: string;
  isTestingConnection: boolean;
  testResult: { success: boolean; message: string } | null;
}