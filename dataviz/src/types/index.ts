// 从chart.ts导入图表相关类型
import type { DataPoint, ChartType, ChartConfig } from './chart';

// 重新导出这些类型
export type { DataPoint, ChartType, ChartConfig };

// 仪表板配置
export interface Dashboard {
  id: string;
  title: string;
  charts: ChartConfig[];
}

// 添加一个运行时的空对象，确保Dashboard在运行时可用
export const Dashboard = {};

// 主题类型
export type Theme = 'light' | 'dark';

// 添加一个运行时的空对象，确保Theme在运行时可用
export const Theme = {};

// 导入的数据集
export interface ImportedDataset {
  id: string;
  name: string;
  data: DataPoint[];
  createdAt: number;
}

// 添加一个运行时的空对象，确保ImportedDataset在运行时可用
export const ImportedDataset = {};

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