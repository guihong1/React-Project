import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ChartConfig } from '../types/chart';
import type { AppState, Dashboard, Theme, ImportedDataset, AIModel } from '../types';
import { aiService } from '../services/ai';

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
  

  
  // AI配置相关操作
  setSelectedAIModel: (modelId: string) => void;
  addAIModel: (model: Omit<AIModel, 'id' | 'isCustom' | 'isDefault'>) => void;
  updateAIModel: (modelId: string, updates: Partial<AIModel>) => void;
  deleteAIModel: (modelId: string) => void;
  setDefaultAIModel: (modelId: string) => void;
  testAIModelConnection: (modelId: string) => Promise<void>;
  

}

// 预设的AI模型
const presetAIModels: AIModel[] = [
  {
    id: 'openai-gpt4',
    name: 'GPT-4',
    provider: 'OpenAI',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    apiVersion: 'v1',
    isCustom: false,
    isDefault: true
  },
  {
    id: 'openai-gpt35',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    apiVersion: 'v1',
    isCustom: false,
    isDefault: false
  },
  {
    id: 'baidu-ernie',
    name: '文心一言',
    provider: '百度',
    apiEndpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
    apiKey: '',
    apiVersion: 'v1',
    isCustom: false,
    isDefault: false
  },
  {
    id: 'ali-qwen',
    name: '通义千问',
    provider: '阿里云',
    apiEndpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    apiKey: '',
    apiVersion: 'v1',
    isCustom: false,
    isDefault: false
  }
];

// 从localStorage加载AI模型配置
const loadAIModels = () => {
  try {
    const savedModels = localStorage.getItem('aiModels');
    const savedSelectedModelId = localStorage.getItem('selectedAIModelId');
    
    const models = savedModels ? JSON.parse(savedModels) : presetAIModels;
    
    // 确保至少有一个默认模型
    if (!models.some(model => model.isDefault)) {
      models[0].isDefault = true;
    }
    
    return {
      models,
      selectedModelId: savedSelectedModelId || models.find(model => model.isDefault)?.id || models[0].id
    };
  } catch (e) {
    console.error('Failed to load AI models:', e);
    return {
      models: presetAIModels,
      selectedModelId: presetAIModels[0].id
    };
  }
};

// 从localStorage加载持久化数据
const loadPersistedData = () => {
  try {
    const savedCurrentDashboard = localStorage.getItem('currentDashboard');
    const savedCharts = localStorage.getItem('charts');
    const savedImportedDatasets = localStorage.getItem('importedDatasets');
    const savedTheme = localStorage.getItem('theme');
    
    return {
      theme: (savedTheme as Theme) || 'light',
      currentDashboard: savedCurrentDashboard ? JSON.parse(savedCurrentDashboard) : sampleDashboard,
      charts: savedCharts ? JSON.parse(savedCharts) : sampleCharts,
      importedDatasets: savedImportedDatasets ? JSON.parse(savedImportedDatasets) : [],
    };
  } catch (e) {
    console.error('Failed to load persisted data:', e);
    return {
      theme: 'light' as Theme,
      currentDashboard: sampleDashboard,
      charts: sampleCharts,
      importedDatasets: [],
    };
  }
};

const persistedData = loadPersistedData();
const persistedAIConfig = loadAIModels();

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  theme: persistedData.theme,
  currentDashboard: persistedData.currentDashboard,
  charts: persistedData.charts,
  importedDatasets: persistedData.importedDatasets,
  isLoading: false,
  error: null,
  
  // AI配置相关状态
  aiModels: persistedAIConfig.models,
  selectedAIModelId: persistedAIConfig.selectedModelId,
  isTestingConnection: false,
  testResult: null,
  


  // Actions
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },
  
  setCurrentDashboard: (dashboard) => {
    if (dashboard) {
      localStorage.setItem('currentDashboard', JSON.stringify(dashboard));
    } else {
      localStorage.removeItem('currentDashboard');
    }
    set({ currentDashboard: dashboard });
  },
  
  addChart: (chart) => set((state) => {
    const newCharts = [...state.charts, chart];
    localStorage.setItem('charts', JSON.stringify(newCharts));
    
    return { 
      charts: newCharts
    };
  }),
  
  removeChart: (chartId) => set((state) => {
    const newCharts = state.charts.filter(chart => chart.id !== chartId);
    localStorage.setItem('charts', JSON.stringify(newCharts));
    
    return { 
      charts: newCharts
    };
  }),
  
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
    
    localStorage.setItem('charts', JSON.stringify(updatedCharts));
    if (updatedDashboard) {
      localStorage.setItem('currentDashboard', JSON.stringify(updatedDashboard));
    }
    
    return { 
      charts: updatedCharts,
      currentDashboard: updatedDashboard
    };
  }),
  
  addImportedDataset: (dataset) => set((state) => {
    const newDatasets = [...state.importedDatasets, dataset];
    localStorage.setItem('importedDatasets', JSON.stringify(newDatasets));
    
    return { importedDatasets: newDatasets };
  }),
  
  removeImportedDataset: (datasetId) => set((state) => {
    const newDatasets = state.importedDatasets.filter(dataset => dataset.id !== datasetId);
    localStorage.setItem('importedDatasets', JSON.stringify(newDatasets));
    
    return { importedDatasets: newDatasets };
  }),
  
  getImportedDatasetById: (datasetId) => {
    return get().importedDatasets.find(dataset => dataset.id === datasetId);
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  // AI配置相关操作
  setSelectedAIModel: (modelId) => {
    localStorage.setItem('selectedAIModelId', modelId);
    set({ selectedAIModelId: modelId, testResult: null });
  },
  
  addAIModel: (modelData) => set((state) => {
    const newModel: AIModel = {
      ...modelData,
      id: uuidv4(),
      isCustom: true,
      isDefault: false
    };
    
    const newModels = [...state.aiModels, newModel];
    localStorage.setItem('aiModels', JSON.stringify(newModels));
    
    return { aiModels: newModels };
  }),
  
  updateAIModel: (modelId, updates) => set((state) => {
    const newModels = state.aiModels.map(model =>
      model.id === modelId ? { ...model, ...updates } : model
    );
    
    localStorage.setItem('aiModels', JSON.stringify(newModels));
    
    return { aiModels: newModels };
  }),
  
  deleteAIModel: (modelId) => set((state) => {
    // 只允许删除自定义模型
    const modelToDelete = state.aiModels.find(model => model.id === modelId);
    if (!modelToDelete || !modelToDelete.isCustom) {
      return state;
    }
    
    const newModels = state.aiModels.filter(model => model.id !== modelId);
    
    // 如果删除的是默认模型，则设置第一个模型为默认
    if (modelToDelete.isDefault && newModels.length > 0) {
      newModels[0].isDefault = true;
    }
    
    // 如果删除的是当前选中的模型，则选择默认模型
    let newSelectedModelId = state.selectedAIModelId;
    if (modelId === state.selectedAIModelId) {
      const defaultModel = newModels.find(model => model.isDefault);
      newSelectedModelId = defaultModel ? defaultModel.id : (newModels.length > 0 ? newModels[0].id : '');
      localStorage.setItem('selectedAIModelId', newSelectedModelId);
    }
    
    localStorage.setItem('aiModels', JSON.stringify(newModels));
    
    return { 
      aiModels: newModels,
      selectedAIModelId: newSelectedModelId
    };
  }),
  
  setDefaultAIModel: (modelId) => set((state) => {
    const newModels = state.aiModels.map(model => ({
      ...model,
      isDefault: model.id === modelId
    }));
    
    localStorage.setItem('aiModels', JSON.stringify(newModels));
    
    return { aiModels: newModels };
  }),
  
  testAIModelConnection: async (modelId) => {
    const { aiModels } = get();
    const model = aiModels.find(m => m.id === modelId);
    
    if (!model) {
      set({ 
        testResult: { 
          success: false, 
          message: '模型不存在' 
        } 
      });
      return;
    }
    
    set({ isTestingConnection: true, testResult: null });
    
    try {
      // 使用AI服务进行真实的API连接测试
      const result = await aiService.testConnection(model);
      
      set({ 
        isTestingConnection: false,
        testResult: { 
          success: result.success, 
          message: result.latency ? `${result.message} (延迟: ${result.latency}ms)` : result.message
        }
      });
    } catch (error) {
      set({ 
        isTestingConnection: false,
        testResult: { 
          success: false, 
          message: `连接失败: ${error instanceof Error ? error.message : String(error)}` 
        }
      });
    }
  },
  

  

  })
);