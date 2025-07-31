import { create } from 'zustand';
import type { ChartConfig } from '../types/chart.js';
import type { AppState, Dashboard, Theme, ImportedDataset } from '../types';

// 示例数据
const sampleData = [
  { id: '1', name: '一月', value: 400, category: 'sales' },
  { id: '2', name: '二月', value: 300, category: 'sales' },
  { id: '3', name: '三月', value: 600, category: 'sales' },
  { id: '4', name: '四月', value: 800, category: 'sales' },
  { id: '5', name: '五月', value: 500, category: 'sales' },
];

const sampleCharts: ChartConfig[] = [
  {
    id: 'chart-1',
    title: '月度销售数据',
    type: 'bar',
    data: sampleData,
    width: 600,
    height: 300,
  },
  {
    id: 'chart-2',
    title: '销售趋势',
    type: 'line',
    data: sampleData,
    width: 600,
    height: 300,
  },
  {
    id: 'chart-3',
    title: '销售分布',
    type: 'pie',
    data: sampleData,
    width: 400,
    height: 300,
  },
];

const sampleDashboard: Dashboard = {
  id: 'dashboard-1',
  title: '销售数据仪表板',
  charts: sampleCharts,
};

interface AppStore extends AppState {
  // Actions
  setTheme: (theme: Theme) => void;
  setCurrentDashboard: (dashboard: Dashboard | null) => void;
  addChart: (chart: ChartConfig) => void;
  removeChart: (chartId: string) => void;
  updateChart: (chartId: string, updates: Partial<ChartConfig>) => void;
  addImportedDataset: (dataset: ImportedDataset) => void;
  removeImportedDataset: (datasetId: string) => void;
  getImportedDatasetById: (datasetId: string) => ImportedDataset | undefined;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  theme: 'light',
  currentDashboard: sampleDashboard,
  charts: sampleCharts,
  importedDatasets: [],
  isLoading: false,
  error: null,

  // Actions
  setTheme: (theme) => set({ theme }),
  
  setCurrentDashboard: (dashboard) => set({ currentDashboard: dashboard }),
  
  addChart: (chart) => set((state) => ({
    charts: [...state.charts, chart],
  })),
  
  removeChart: (chartId) => set((state) => ({
    charts: state.charts.filter(chart => chart.id !== chartId),
  })),
  
  updateChart: (chartId, updates) => set((state) => {
    // 更新charts数组中的图表
    const updatedCharts = state.charts.map(chart => 
      chart.id === chartId ? { ...chart, ...updates } : chart
    );
    
    // 如果currentDashboard存在，同时更新其中的图表
    let updatedDashboard = state.currentDashboard;
    if (updatedDashboard) {
      const dashboardCharts = updatedDashboard.charts.map(chart =>
        chart.id === chartId ? { ...chart, ...updates } : chart
      );
      updatedDashboard = {
        ...updatedDashboard,
        charts: dashboardCharts
      };
    }
    
    return {
      charts: updatedCharts,
      currentDashboard: updatedDashboard
    };
  }),
  
  addImportedDataset: (dataset) => set((state) => ({
    importedDatasets: [...state.importedDatasets, dataset],
  })),
  
  removeImportedDataset: (datasetId) => set((state) => ({
    importedDatasets: state.importedDatasets.filter(dataset => dataset.id !== datasetId),
  })),
  
  getImportedDatasetById: (datasetId) => {
    return get().importedDatasets.find(dataset => dataset.id === datasetId);
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
}));