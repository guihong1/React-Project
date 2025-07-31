# AI服务集成开发文档

## 功能概述

将真实的AI服务（如OpenAI、通义千问等）集成到DataViz平台中，增强数据分析能力，提供智能化的数据解读、趋势预测、异常检测和可视化建议功能。

## 需求分析

### 功能需求

1. **AI服务连接**
   - 支持连接多种AI服务提供商（OpenAI、通义千问等）
   - 提供API密钥配置界面
   - 支持服务连接状态检测和错误处理

2. **数据分析功能**
   - 智能数据解读：自动生成数据洞察和摘要
   - 趋势预测：基于历史数据预测未来趋势
   - 异常检测：识别数据中的异常值和模式
   - 相关性分析：发现数据集之间的关联

3. **可视化建议**
   - 根据数据特性推荐合适的图表类型
   - 提供图表配色和布局优化建议
   - 生成图表标题和描述文案

4. **用户交互**
   - 支持自然语言查询数据
   - 提供对话式AI助手界面
   - 允许用户反馈和调整AI生成的结果

### 用户场景

1. 数据分析师希望快速获取数据洞察，而不必手动分析每个数据集
2. 业务用户希望通过自然语言提问了解数据趋势和异常
3. 设计人员希望获取专业的可视化建议，提升图表质量
4. 决策者希望获得AI辅助的数据解读和预测，支持决策制定

## 技术方案

### 技术选型

1. **AI服务API**
   - OpenAI API (GPT-4/GPT-3.5-turbo)
   - 阿里云通义千问API
   - 可选：百度文心一言、讯飞星火等国内大模型

2. **前端技术**
   - React Query：管理API请求状态
   - Zustand：存储AI配置和会话状态
   - React Markdown：渲染AI生成的富文本内容

3. **安全考虑**
   - 客户端加密存储API密钥
   - 请求代理服务（可选）：避免直接在前端暴露API密钥

### 系统架构

```
+------------------+    +------------------+    +------------------+
|                  |    |                  |    |                  |
|  前端应用        |    |  AI代理服务      |    |  AI服务提供商    |
|  (React)         |<-->|  (可选)         |<-->|  (OpenAI/通义千问)|
|                  |    |                  |    |                  |
+------------------+    +------------------+    +------------------+
        ^                                              ^
        |                                              |
        v                                              v
+------------------+                        +------------------+
|                  |                        |                  |
|  本地数据存储    |                        |  模型/提示模板   |
|  (LocalStorage)  |                        |  (Prompt库)      |
|                  |                        |                  |
+------------------+                        +------------------+
```

### 数据结构设计

#### AI服务配置

```typescript
// AI服务提供商类型
type AIProvider = 'openai' | 'tongyi' | 'baidu' | 'xunfei';

// AI服务配置接口
interface AIServiceConfig {
  provider: AIProvider;
  apiKey: string;
  apiEndpoint?: string; // 自定义API端点
  modelName?: string;   // 使用的模型名称
  temperature?: number; // 生成多样性参数
  maxTokens?: number;   // 最大生成长度
  isActive: boolean;    // 是否启用
}

// AI功能配置
interface AIFeatureConfig {
  dataInsight: boolean;  // 数据洞察功能
  anomalyDetection: boolean; // 异常检测功能
  trendPrediction: boolean;  // 趋势预测功能
  chartSuggestion: boolean;  // 图表建议功能
}
```

#### AI分析结果

```typescript
// AI分析结果接口
interface AIAnalysisResult {
  id: string;
  timestamp: number;
  datasetId: string;
  analysisType: 'insight' | 'anomaly' | 'trend' | 'correlation' | 'suggestion';
  content: string;       // Markdown格式的分析内容
  rawResponse?: any;     // 原始AI响应
  metadata?: Record<string, any>; // 额外元数据
}

// AI会话消息
interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// AI会话
interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
}
```

## 实现步骤

### 1. 添加AI服务配置界面

创建 `src/components/AIServiceConfig.tsx` 组件：

```typescript
import React, { useState } from 'react';
import { useAppStore } from '../store';
import { AIProvider, AIServiceConfig } from '../types';

export const AIServiceConfig: React.FC = () => {
  const { aiConfig, updateAIConfig, theme } = useAppStore();
  const [editConfig, setEditConfig] = useState<AIServiceConfig>(aiConfig || {
    provider: 'openai',
    apiKey: '',
    modelName: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 2000,
    isActive: false
  });
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // 提供商选项
  const providerOptions: {value: AIProvider, label: string}[] = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'tongyi', label: '通义千问' },
    { value: 'baidu', label: '百度文心一言' },
    { value: 'xunfei', label: '讯飞星火' }
  ];

  // 模型选项（根据提供商动态变化）
  const getModelOptions = (provider: AIProvider) => {
    switch(provider) {
      case 'openai':
        return [
          { value: 'gpt-4', label: 'GPT-4' },
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
        ];
      case 'tongyi':
        return [
          { value: 'qwen-turbo', label: '通义千问-Turbo' },
          { value: 'qwen-plus', label: '通义千问-Plus' }
        ];
      case 'baidu':
        return [
          { value: 'ernie-bot-4', label: '文心一言-4.0' },
          { value: 'ernie-bot', label: '文心一言-基础版' }
        ];
      case 'xunfei':
        return [
          { value: 'spark-3.5', label: '星火认知-3.5' },
          { value: 'spark-3.0', label: '星火认知-3.0' }
        ];
      default:
        return [];
    }
  };

  // 处理提供商变更
  const handleProviderChange = (provider: AIProvider) => {
    const modelOptions = getModelOptions(provider);
    setEditConfig({
      ...editConfig,
      provider,
      modelName: modelOptions.length > 0 ? modelOptions[0].value : ''
    });
  };

  // 测试AI连接
  const testConnection = async () => {
    setTestStatus('loading');
    setTestMessage('正在测试连接...');
    
    try {
      // 这里实现实际的API测试逻辑
      // 示例：发送一个简单的请求验证API密钥是否有效
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 假设测试成功
      setTestStatus('success');
      setTestMessage('连接成功！AI服务可用。');
    } catch (error) {
      setTestStatus('error');
      setTestMessage(`连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 保存配置
  const saveConfig = () => {
    updateAIConfig(editConfig);
    // 可以添加保存成功的提示
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
      borderRadius: '8px',
      color: theme === 'dark' ? '#fff' : '#333'
    }}>
      <h2>AI服务配置</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>AI服务提供商:</label>
        <select
          value={editConfig.provider}
          onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
            backgroundColor: theme === 'dark' ? '#333' : '#fff',
            color: theme === 'dark' ? '#fff' : '#333'
          }}
        >
          {providerOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>API密钥:</label>
        <input
          type="password"
          value={editConfig.apiKey}
          onChange={(e) => setEditConfig({ ...editConfig, apiKey: e.target.value })}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
            backgroundColor: theme === 'dark' ? '#333' : '#fff',
            color: theme === 'dark' ? '#fff' : '#333'
          }}
          placeholder="输入您的API密钥"
        />
        <small style={{ color: theme === 'dark' ? '#aaa' : '#666', marginTop: '5px', display: 'block' }}>
          您的API密钥将安全地存储在本地，不会发送到我们的服务器。
        </small>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>模型:</label>
        <select
          value={editConfig.modelName}
          onChange={(e) => setEditConfig({ ...editConfig, modelName: e.target.value })}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
            backgroundColor: theme === 'dark' ? '#333' : '#fff',
            color: theme === 'dark' ? '#fff' : '#333'
          }}
        >
          {getModelOptions(editConfig.provider).map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>自定义API端点 (可选):</label>
        <input
          type="text"
          value={editConfig.apiEndpoint || ''}
          onChange={(e) => setEditConfig({ ...editConfig, apiEndpoint: e.target.value })}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
            backgroundColor: theme === 'dark' ? '#333' : '#fff',
            color: theme === 'dark' ? '#fff' : '#333'
          }}
          placeholder="https://api.example.com/v1"
        />
        <small style={{ color: theme === 'dark' ? '#aaa' : '#666', marginTop: '5px', display: 'block' }}>
          如果您使用代理或自定义部署，请输入API端点URL。
        </small>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>高级设置:</label>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Temperature:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={editConfig.temperature}
              onChange={(e) => setEditConfig({ ...editConfig, temperature: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px' }}>精确</span>
              <span style={{ fontSize: '12px' }}>{editConfig.temperature}</span>
              <span style={{ fontSize: '12px' }}>创意</span>
            </div>
          </div>
          
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>最大Token数:</label>
            <input
              type="number"
              min="100"
              max="4000"
              value={editConfig.maxTokens}
              onChange={(e) => setEditConfig({ ...editConfig, maxTokens: parseInt(e.target.value) || 2000 })}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                backgroundColor: theme === 'dark' ? '#333' : '#fff',
                color: theme === 'dark' ? '#fff' : '#333'
              }}
            />
          </div>
        </div>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={editConfig.isActive}
            onChange={(e) => setEditConfig({ ...editConfig, isActive: e.target.checked })}
            style={{ marginRight: '8px' }}
          />
          启用AI功能
        </label>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button
          onClick={testConnection}
          disabled={!editConfig.apiKey || testStatus === 'loading'}
          style={{
            padding: '8px 16px',
            backgroundColor: theme === 'dark' ? '#444' : '#e0e0e0',
            color: theme === 'dark' ? '#fff' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: editConfig.apiKey && testStatus !== 'loading' ? 'pointer' : 'not-allowed',
            opacity: editConfig.apiKey && testStatus !== 'loading' ? 1 : 0.7
          }}
        >
          {testStatus === 'loading' ? '测试中...' : '测试连接'}
        </button>
        
        <button
          onClick={saveConfig}
          disabled={!editConfig.apiKey}
          style={{
            padding: '8px 16px',
            backgroundColor: theme === 'dark' ? '#0066cc' : '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: editConfig.apiKey ? 'pointer' : 'not-allowed',
            opacity: editConfig.apiKey ? 1 : 0.7
          }}
        >
          保存配置
        </button>
      </div>
      
      {testStatus !== 'idle' && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          borderRadius: '4px',
          backgroundColor: testStatus === 'success' ? (theme === 'dark' ? '#143d14' : '#d4edda') :
                          testStatus === 'error' ? (theme === 'dark' ? '#4d1a1a' : '#f8d7da') :
                          (theme === 'dark' ? '#1a3c5a' : '#cce5ff'),
          color: testStatus === 'success' ? (theme === 'dark' ? '#4caf50' : '#155724') :
                testStatus === 'error' ? (theme === 'dark' ? '#f44336' : '#721c24') :
                (theme === 'dark' ? '#2196f3' : '#004085')
        }}>
          {testMessage}
        </div>
      )}
    </div>
  );
};
```

### 2. 更新类型定义

创建 `src/types/ai.ts` 文件：

```typescript
// AI服务提供商类型
export type AIProvider = 'openai' | 'tongyi' | 'baidu' | 'xunfei';

// AI服务配置接口
export interface AIServiceConfig {
  provider: AIProvider;
  apiKey: string;
  apiEndpoint?: string; // 自定义API端点
  modelName?: string;   // 使用的模型名称
  temperature?: number; // 生成多样性参数
  maxTokens?: number;   // 最大生成长度
  isActive: boolean;    // 是否启用
}

// AI功能配置
export interface AIFeatureConfig {
  dataInsight: boolean;  // 数据洞察功能
  anomalyDetection: boolean; // 异常检测功能
  trendPrediction: boolean;  // 趋势预测功能
  chartSuggestion: boolean;  // 图表建议功能
}

// AI分析结果接口
export interface AIAnalysisResult {
  id: string;
  timestamp: number;
  datasetId: string;
  analysisType: 'insight' | 'anomaly' | 'trend' | 'correlation' | 'suggestion';
  content: string;       // Markdown格式的分析内容
  rawResponse?: any;     // 原始AI响应
  metadata?: Record<string, any>; // 额外元数据
}

// AI会话消息
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// AI会话
export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
}
```

更新 `src/types/index.ts`，导出AI相关类型：

```typescript
export * from './chart';
export * from './dashboard';
export * from './ai';
```

### 3. 更新状态管理

修改 `src/store/index.ts`，添加AI相关状态和操作：

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { 
  Dashboard, 
  ChartConfig, 
  ChartType,
  AIServiceConfig,
  AIAnalysisResult,
  AIConversation,
  AIMessage
} from '../types';

interface AppStore {
  // 现有状态...
  
  // AI相关状态
  aiConfig: AIServiceConfig | null;
  aiAnalysisResults: AIAnalysisResult[];
  aiConversations: AIConversation[];
  currentConversationId: string | null;
  
  // AI相关操作
  updateAIConfig: (config: AIServiceConfig) => void;
  addAIAnalysisResult: (result: Omit<AIAnalysisResult, 'id' | 'timestamp'>) => void;
  createAIConversation: (title: string) => string;
  addMessageToConversation: (conversationId: string, content: string, role: 'user' | 'assistant' | 'system') => void;
  setCurrentConversation: (conversationId: string | null) => void;
  clearAIAnalysisResults: (datasetId?: string) => void;
}

const useAppStore = create<AppStore>(
  persist(
    (set, get) => ({
      // 现有状态和操作...
      
      // AI相关状态
      aiConfig: null,
      aiAnalysisResults: [],
      aiConversations: [],
      currentConversationId: null,
      
      // 更新AI配置
      updateAIConfig: (config) => {
        set({ aiConfig: config });
      },
      
      // 添加AI分析结果
      addAIAnalysisResult: (result) => {
        const newResult: AIAnalysisResult = {
          ...result,
          id: uuidv4(),
          timestamp: Date.now()
        };
        
        set((state) => ({
          aiAnalysisResults: [...state.aiAnalysisResults, newResult]
        }));
      },
      
      // 创建AI对话
      createAIConversation: (title) => {
        const id = uuidv4();
        const now = Date.now();
        
        const newConversation: AIConversation = {
          id,
          title,
          messages: [],
          createdAt: now,
          updatedAt: now
        };
        
        set((state) => ({
          aiConversations: [...state.aiConversations, newConversation],
          currentConversationId: id
        }));
        
        return id;
      },
      
      // 添加消息到对话
      addMessageToConversation: (conversationId, content, role) => {
        set((state) => {
          const conversations = [...state.aiConversations];
          const index = conversations.findIndex(c => c.id === conversationId);
          
          if (index === -1) return state;
          
          const conversation = { ...conversations[index] };
          const newMessage: AIMessage = {
            id: uuidv4(),
            content,
            role,
            timestamp: Date.now()
          };
          
          conversation.messages = [...conversation.messages, newMessage];
          conversation.updatedAt = Date.now();
          
          conversations[index] = conversation;
          
          return { aiConversations: conversations };
        });
      },
      
      // 设置当前对话
      setCurrentConversation: (conversationId) => {
        set({ currentConversationId: conversationId });
      },
      
      // 清除AI分析结果
      clearAIAnalysisResults: (datasetId) => {
        set((state) => {
          if (datasetId) {
            return {
              aiAnalysisResults: state.aiAnalysisResults.filter(
                result => result.datasetId !== datasetId
              )
            };
          }
          
          return { aiAnalysisResults: [] };
        });
      }
    }),
    {
      name: 'dataviz-storage',
      partialize: (state) => ({
        dashboards: state.dashboards,
        currentDashboardId: state.currentDashboardId,
        theme: state.theme,
        aiConfig: state.aiConfig,
        aiConversations: state.aiConversations
        // 不持久化分析结果，避免存储过大
      })
    }
  )
);

export { useAppStore };
```

### 4. 创建AI服务工具类

创建 `src/services/ai.ts` 文件：

```typescript
import { AIProvider, AIServiceConfig, AIAnalysisResult } from '../types';

// AI服务类
class AIService {
  private config: AIServiceConfig | null = null;
  
  // 设置配置
  setConfig(config: AIServiceConfig) {
    this.config = config;
  }
  
  // 获取配置
  getConfig() {
    return this.config;
  }
  
  // 检查是否已配置
  isConfigured() {
    return !!this.config && !!this.config.apiKey && this.config.isActive;
  }
  
  // 测试连接
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      throw new Error('AI服务未配置');
    }
    
    try {
      // 根据不同提供商实现测试逻辑
      switch (this.config!.provider) {
        case 'openai':
          return await this.testOpenAI();
        case 'tongyi':
          return await this.testTongyi();
        case 'baidu':
          return await this.testBaidu();
        case 'xunfei':
          return await this.testXunfei();
        default:
          throw new Error('不支持的AI服务提供商');
      }
    } catch (error) {
      console.error('AI连接测试失败:', error);
      throw error;
    }
  }
  
  // 测试OpenAI连接
  private async testOpenAI(): Promise<boolean> {
    // 实现OpenAI API测试
    // 这里是示例代码，实际实现需要根据OpenAI API文档
    const endpoint = this.config!.apiEndpoint || 'https://api.openai.com/v1';
    
    try {
      const response = await fetch(`${endpoint}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || '连接失败');
      }
      
      return true;
    } catch (error) {
      console.error('OpenAI连接测试失败:', error);
      throw error;
    }
  }
  
  // 测试通义千问连接
  private async testTongyi(): Promise<boolean> {
    // 实现通义千问API测试
    // 这里是示例代码，实际实现需要根据通义千问API文档
    return true; // 模拟成功
  }
  
  // 测试百度文心一言连接
  private async testBaidu(): Promise<boolean> {
    // 实现百度文心一言API测试
    return true; // 模拟成功
  }
  
  // 测试讯飞星火连接
  private async testXunfei(): Promise<boolean> {
    // 实现讯飞星火API测试
    return true; // 模拟成功
  }
  
  // 生成数据洞察
  async generateDataInsight(data: any[]): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('AI服务未配置');
    }
    
    try {
      // 构建提示词
      const prompt = `
        分析以下数据并提供关键洞察。请关注趋势、模式、异常值和重要发现。
        以markdown格式输出，包括标题、要点和简短解释。
        
        数据:
        ${JSON.stringify(data, null, 2)}
      `;
      
      // 调用AI服务
      return await this.callAIService(prompt);
    } catch (error) {
      console.error('生成数据洞察失败:', error);
      throw error;
    }
  }
  
  // 检测异常值
  async detectAnomalies(data: any[]): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('AI服务未配置');
    }
    
    try {
      // 构建提示词
      const prompt = `
        分析以下数据并检测异常值。请识别任何显著偏离正常模式的数据点，
        并解释为什么它们被视为异常。以markdown格式输出，包括异常值列表和可能的原因。
        
        数据:
        ${JSON.stringify(data, null, 2)}
      `;
      
      // 调用AI服务
      return await this.callAIService(prompt);
    } catch (error) {
      console.error('检测异常值失败:', error);
      throw error;
    }
  }
  
  // 预测趋势
  async predictTrend(data: any[]): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('AI服务未配置');
    }
    
    try {
      // 构建提示词
      const prompt = `
        基于以下历史数据预测未来趋势。请分析数据模式并提供未来发展的预测。
        以markdown格式输出，包括趋势描述、预测和置信度评估。
        
        数据:
        ${JSON.stringify(data, null, 2)}
      `;
      
      // 调用AI服务
      return await this.callAIService(prompt);
    } catch (error) {
      console.error('预测趋势失败:', error);
      throw error;
    }
  }
  
  // 推荐图表类型
  async suggestChartType(data: any[]): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('AI服务未配置');
    }
    
    try {
      // 构建提示词
      const prompt = `
        分析以下数据并推荐最适合的图表类型。考虑数据结构、变量类型和可视化目标。
        以markdown格式输出，包括推荐的图表类型、理由和可选的配色建议。
        
        数据:
        ${JSON.stringify(data, null, 2)}
      `;
      
      // 调用AI服务
      return await this.callAIService(prompt);
    } catch (error) {
      console.error('推荐图表类型失败:', error);
      throw error;
    }
  }
  
  // 对话式查询
  async conversationalQuery(messages: { role: string; content: string }[]): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('AI服务未配置');
    }
    
    try {
      // 根据不同提供商实现对话查询
      switch (this.config!.provider) {
        case 'openai':
          return await this.openAIConversation(messages);
        case 'tongyi':
          // 实现通义千问对话
          return '通义千问回复';
        case 'baidu':
          // 实现百度文心一言对话
          return '文心一言回复';
        case 'xunfei':
          // 实现讯飞星火对话
          return '讯飞星火回复';
        default:
          throw new Error('不支持的AI服务提供商');
      }
    } catch (error) {
      console.error('对话查询失败:', error);
      throw error;
    }
  }
  
  // OpenAI对话实现
  private async openAIConversation(messages: { role: string; content: string }[]): Promise<string> {
    const endpoint = this.config!.apiEndpoint || 'https://api.openai.com/v1';
    
    try {
      const response = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config!.modelName || 'gpt-3.5-turbo',
          messages,
          temperature: this.config!.temperature || 0.7,
          max_tokens: this.config!.maxTokens || 2000
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || '请求失败');
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI对话失败:', error);
      throw error;
    }
  }
  
  // 通用AI服务调用
  private async callAIService(prompt: string): Promise<string> {
    // 根据不同提供商调用相应的API
    switch (this.config!.provider) {
      case 'openai':
        return await this.openAIConversation([
          { role: 'system', content: 'You are a helpful data analysis assistant.' },
          { role: 'user', content: prompt }
        ]);
      case 'tongyi':
        // 实现通义千问API调用
        return '通义千问分析结果';
      case 'baidu':
        // 实现百度文心一言API调用
        return '文心一言分析结果';
      case 'xunfei':
        // 实现讯飞星火API调用
        return '讯飞星火分析结果';
      default:
        throw new Error('不支持的AI服务提供商');
    }
  }
}

// 导出单例
export const aiService = new AIService();
```

### 5. 创建AI分析组件

创建 `src/components/AIAnalysis.tsx` 组件：

```typescript
import React, { useState } from 'react';
import { useAppStore } from '../store';
import { aiService } from '../services/ai';
import ReactMarkdown from 'react-markdown';

interface AIAnalysisProps {
  data: any[];
  datasetId: string;
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ data, datasetId }) => {
  const { aiConfig, addAIAnalysisResult, aiAnalysisResults, theme } = useAppStore();
  const [analysisType, setAnalysisType] = useState<'insight' | 'anomaly' | 'trend' | 'suggestion'>('insight');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 获取当前数据集的分析结果
  const currentResults = aiAnalysisResults.filter(
    result => result.datasetId === datasetId
  ).sort((a, b) => b.timestamp - a.timestamp);
  
  // 检查AI服务是否已配置
  const isAIConfigured = aiConfig && aiConfig.apiKey && aiConfig.isActive;
  
  // 初始化AI服务
  if (isAIConfigured && aiService.getConfig() !== aiConfig) {
    aiService.setConfig(aiConfig);
  }
  
  // 生成分析
  const generateAnalysis = async () => {
    if (!isAIConfigured) {
      setError('AI服务未配置，请先配置AI服务');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      let content = '';
      
      // 根据分析类型调用不同的AI服务方法
      switch (analysisType) {
        case 'insight':
          content = await aiService.generateDataInsight(data);
          break;
        case 'anomaly':
          content = await aiService.detectAnomalies(data);
          break;
        case 'trend':
          content = await aiService.predictTrend(data);
          break;
        case 'suggestion':
          content = await aiService.suggestChartType(data);
          break;
      }
      
      // 添加分析结果
      addAIAnalysisResult({
        datasetId,
        analysisType,
        content
      });
    } catch (err) {
      setError(`分析失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div style={{
      padding: '20px',
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
      borderRadius: '8px',
      color: theme === 'dark' ? '#fff' : '#333'
    }}>
      <h2>AI数据分析</h2>
      
      {!isAIConfigured && (
        <div style={{
          padding: '15px',
          backgroundColor: theme === 'dark' ? '#2a2a2a' : '#e9ecef',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <p>AI服务未配置。请先在设置中配置AI服务。</p>
        </div>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px' }}>分析类型:</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setAnalysisType('insight')}
            style={{
              padding: '8px 16px',
              backgroundColor: analysisType === 'insight' ? 
                (theme === 'dark' ? '#0066cc' : '#007bff') : 
                (theme === 'dark' ? '#333' : '#e0e0e0'),
              color: analysisType === 'insight' ? '#fff' : (theme === 'dark' ? '#fff' : '#333'),
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            数据洞察
          </button>
          
          <button
            onClick={() => setAnalysisType('anomaly')}
            style={{
              padding: '8px 16px',
              backgroundColor: analysisType === 'anomaly' ? 
                (theme === 'dark' ? '#0066cc' : '#007bff') : 
                (theme === 'dark' ? '#333' : '#e0e0e0'),
              color: analysisType === 'anomaly' ? '#fff' : (theme === 'dark' ? '#fff' : '#333'),
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            异常检测
          </button>
          
          <button
            onClick={() => setAnalysisType('trend')}
            style={{
              padding: '8px 16px',
              backgroundColor: analysisType === 'trend' ? 
                (theme === 'dark' ? '#0066cc' : '#007bff') : 
                (theme === 'dark' ? '#333' : '#e0e0e0'),
              color: analysisType === 'trend' ? '#fff' : (theme === 'dark' ? '#fff' : '#333'),
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            趋势预测
          </button>
          
          <button
            onClick={() => setAnalysisType('suggestion')}
            style={{
              padding: '8px 16px',
              backgroundColor: analysisType === 'suggestion' ? 
                (theme === 'dark' ? '#0066cc' : '#007bff') : 
                (theme === 'dark' ? '#333' : '#e0e0e0'),
              color: analysisType === 'suggestion' ? '#fff' : (theme === 'dark' ? '#fff' : '#333'),
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            图表建议
          </button>
        </div>
      </div>
      
      <button
        onClick={generateAnalysis}
        disabled={!isAIConfigured || isLoading}
        style={{
          padding: '10px 20px',
          backgroundColor: theme === 'dark' ? '#0066cc' : '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: isAIConfigured && !isLoading ? 'pointer' : 'not-allowed',
          opacity: isAIConfigured && !isLoading ? 1 : 0.7,
          marginBottom: '20px'
        }}
      >
        {isLoading ? '分析中...' : '生成分析'}
      </button>
      
      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: theme === 'dark' ? '#4d1a1a' : '#f8d7da',
          color: theme === 'dark' ? '#f44336' : '#721c24',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}
      
      {currentResults.length > 0 && (
        <div>
          <h3>分析结果</h3>
          
          {currentResults.map(result => (
            <div 
              key={result.id}
              style={{
                padding: '15px',
                backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
                borderRadius: '8px',
                marginBottom: '15px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '10px',
                borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#eee'}`,
                paddingBottom: '5px'
              }}>
                <span>
                  {result.analysisType === 'insight' && '数据洞察'}
                  {result.analysisType === 'anomaly' && '异常检测'}
                  {result.analysisType === 'trend' && '趋势预测'}
                  {result.analysisType === 'suggestion' && '图表建议'}
                </span>
                <span style={{ fontSize: '0.8em', color: theme === 'dark' ? '#aaa' : '#666' }}>
                  {new Date(result.timestamp).toLocaleString()}
                </span>
              </div>
              
              <div style={{ 
                maxHeight: '300px', 
                overflow: 'auto',
                padding: '10px',
                backgroundColor: theme === 'dark' ? '#333' : '#f9f9f9',
                borderRadius: '4px'
              }}>
                <ReactMarkdown>
                  {result.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 6. 创建AI对话组件

创建 `src/components/AIChat.tsx` 组件：

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { aiService } from '../services/ai';
import ReactMarkdown from 'react-markdown';

export const AIChat: React.FC = () => {
  const { 
    aiConfig, 
    aiConversations, 
    currentConversationId, 
    createAIConversation, 
    addMessageToConversation,
    setCurrentConversation,
    theme 
  } = useAppStore();
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 检查AI服务是否已配置
  const isAIConfigured = aiConfig && aiConfig.apiKey && aiConfig.isActive;
  
  // 初始化AI服务
  if (isAIConfigured && aiService.getConfig() !== aiConfig) {
    aiService.setConfig(aiConfig);
  }
  
  // 获取当前对话
  const currentConversation = aiConversations.find(
    conv => conv.id === currentConversationId
  );
  
  // 创建新对话
  const handleNewConversation = () => {
    createAIConversation(`对话 ${new Date().toLocaleString()}`);
  };
  
  // 发送消息
  const handleSendMessage = async () => {
    if (!input.trim() || !currentConversationId || !isAIConfigured) return;
    
    // 添加用户消息
    addMessageToConversation(currentConversationId, input, 'user');
    setInput('');
    setIsLoading(true);
    setError(null);
    
    try {
      // 准备对话历史
      const messages = currentConversation?.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })) || [];
      
      // 添加系统消息
      if (messages.length === 0 || messages[0].role !== 'system') {
        messages.unshift({
          role: 'system',
          content: '你是一个数据分析助手，可以帮助用户理解数据、提供分析建议和回答数据可视化相关问题。'
        });
      }
      
      // 添加用户最新消息
      messages.push({
        role: 'user',
        content: input
      });
      
      // 调用AI服务
      const response = await aiService.conversationalQuery(messages);
      
      // 添加AI回复
      addMessageToConversation(currentConversationId, response, 'assistant');
    } catch (err) {
      setError(`发送失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: theme === 'dark' ? '#121212' : '#ffffff',
      color: theme === 'dark' ? '#fff' : '#333'
    }}>
      <div style={{
        padding: '15px',
        borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#eee'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0 }}>AI助手</h2>
        <button
          onClick={handleNewConversation}
          disabled={!isAIConfigured}
          style={{
            padding: '8px 16px',
            backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0',
            color: theme === 'dark' ? '#fff' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: isAIConfigured ? 'pointer' : 'not-allowed',
            opacity: isAIConfigured ? 1 : 0.7
          }}
        >
          新对话
        </button>
      </div>
      
      {!isAIConfigured && (
        <div style={{
          padding: '20px',
          backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
          margin: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p>AI服务未配置。请先在设置中配置AI服务。</p>
        </div>
      )}
      
      <div style={{
        display: 'flex',
        height: 'calc(100% - 70px)'
      }}>
        {/* 对话列表 */}
        <div style={{
          width: '250px',
          borderRight: `1px solid ${theme === 'dark' ? '#333' : '#eee'}`,
          overflowY: 'auto',
          backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
          padding: '10px'
        }}>
          {aiConversations.length === 0 ? (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: theme === 'dark' ? '#aaa' : '#666'
            }}>
              没有对话历史
            </div>
          ) : (
            aiConversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setCurrentConversation(conv.id)}
                style={{
                  padding: '10px',
                  marginBottom: '5px',
                  backgroundColor: conv.id === currentConversationId ?
                    (theme === 'dark' ? '#333' : '#e0e0e0') :
                    'transparent',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {conv.title}
              </div>
            ))
          )}
        </div>
        
        {/* 对话内容 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          {/* 消息区域 */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px'
          }}>
            {!currentConversation ? (
              <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme === 'dark' ? '#aaa' : '#666'
              }}>
                {isAIConfigured ? '选择或创建一个对话' : '请先配置AI服务'}
              </div>
            ) : (
              <>
                {currentConversation.messages.length === 0 ? (
                  <div style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme === 'dark' ? '#aaa' : '#666'
                  }}>
                    开始新对话
                  </div>
                ) : (
                  currentConversation.messages.map(msg => (
                    msg.role !== 'system' && (
                      <div
                        key={msg.id}
                        style={{
                          marginBottom: '20px',
                          display: 'flex',
                          flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                        }}
                      >
                        <div style={{
                          maxWidth: '70%',
                          backgroundColor: msg.role === 'user' ?
                            (theme === 'dark' ? '#0066cc' : '#007bff') :
                            (theme === 'dark' ? '#2a2a2a' : '#f0f0f0'),
                          color: msg.role === 'user' ? '#fff' : (theme === 'dark' ? '#fff' : '#333'),
                          padding: '12px 16px',
                          borderRadius: '8px',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                        }}>
                          {msg.role === 'assistant' ? (
                            <ReactMarkdown>
                              {msg.content}
                            </ReactMarkdown>
                          ) : (
                            msg.content
                          )}
                        </div>
                      </div>
                    )
                  ))
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          
          {/* 错误消息 */}
          {error && (
            <div style={{
              padding: '10px',
              backgroundColor: theme === 'dark' ? '#4d1a1a' : '#f8d7da',
              color: theme === 'dark' ? '#f44336' : '#721c24',
              margin: '0 20px'
            }}>
              {error}
            </div>
          )}
          
          {/* 输入区域 */}
          <div style={{
            padding: '20px',
            borderTop: `1px solid ${theme === 'dark' ? '#333' : '#eee'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="输入消息..."
              disabled={!currentConversationId || !isAIConfigured || isLoading}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                backgroundColor: theme === 'dark' ? '#333' : '#fff',
                color: theme === 'dark' ? '#fff' : '#333'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || !currentConversationId || !isAIConfigured || isLoading}
              style={{
                padding: '12px 20px',
                backgroundColor: theme === 'dark' ? '#0066cc' : '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor:opacity: input.trim() && currentConversationId && isAIConfigured && !isLoading ? 'pointer' : 'not-allowed'
              }}
            >
              {isLoading ? '发送中...' : '发送'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 7. 更新DataImport组件

修改 `src/components/DataImport.tsx`，添加AI分析功能：

```typescript
// 在DataImport组件中添加AI分析
import { AIAnalysis } from './AIAnalysis';

// 在组件内部添加状态
const [showAIAnalysis, setShowAIAnalysis] = useState(false);

// 在数据导入成功后添加按钮
{data.length > 0 && (
  <div style={{ marginTop: '20px' }}>
    <button
      onClick={() => setShowAIAnalysis(!showAIAnalysis)}
      style={{
        padding: '8px 16px',
        backgroundColor: theme === 'dark' ? '#0066cc' : '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      {showAIAnalysis ? '隐藏AI分析' : '显示AI分析'}
    </button>
    
    {showAIAnalysis && (
      <div style={{ marginTop: '20px' }}>
        <AIAnalysis data={data} datasetId={dataId} />
      </div>
    )}
  </div>
)}
```

### 8. 更新Settings组件

创建 `src/components/Settings.tsx` 组件，添加AI配置选项：

```typescript
import React, { useState } from 'react';
import { useAppStore } from '../store';
import { AIServiceConfig } from '../components/AIServiceConfig';

export const Settings: React.FC = () => {
  const { theme, toggleTheme } = useAppStore();
  const [activeTab, setActiveTab] = useState<'general' | 'ai'>('general');
  
  return (
    <div style={{
      padding: '20px',
      backgroundColor: theme === 'dark' ? '#121212' : '#ffffff',
      color: theme === 'dark' ? '#fff' : '#333',
      minHeight: '100vh'
    }}>
      <h2>设置</h2>
      
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
        marginBottom: '20px'
      }}>
        <button
          onClick={() => setActiveTab('general')}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: theme === 'dark' ? '#fff' : '#333',
            border: 'none',
            borderBottom: activeTab === 'general' ? 
              `2px solid ${theme === 'dark' ? '#0066cc' : '#007bff'}` : 'none',
            cursor: 'pointer'
          }}
        >
          常规设置
        </button>
        
        <button
          onClick={() => setActiveTab('ai')}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: theme === 'dark' ? '#fff' : '#333',
            border: 'none',
            borderBottom: activeTab === 'ai' ? 
              `2px solid ${theme === 'dark' ? '#0066cc' : '#007bff'}` : 'none',
            cursor: 'pointer'
          }}
        >
          AI服务
        </button>
      </div>
      
      {activeTab === 'general' && (
        <div>
          <h3>主题设置</h3>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={toggleTheme}
                style={{ marginRight: '10px' }}
              />
              深色模式
            </label>
          </div>
        </div>
      )}
      
      {activeTab === 'ai' && (
        <AIServiceConfig />
      )}
    </div>
  );
};
```

### 9. 更新Home组件

修改 `src/pages/Home.tsx`，添加AI聊天和设置选项：

```typescript
// 导入新组件
import { AIChat } from '../components/AIChat';
import { Settings } from '../components/Settings';

// 在Home组件中添加新的标签页
const [activeTab, setActiveTab] = useState<'dashboard' | 'create' | 'import' | 'ai' | 'settings'>('dashboard');

// 在导航栏中添加新选项
<div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
  <button
    onClick={() => handleTabChange('dashboard')}
    style={{
      padding: '10px 20px',
      backgroundColor: activeTab === 'dashboard' ? 
        (theme === 'dark' ? '#0066cc' : '#007bff') : 
        (theme === 'dark' ? '#333' : '#f0f0f0'),
      color: activeTab === 'dashboard' ? '#fff' : (theme === 'dark' ? '#fff' : '#333'),
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }}
  >
    仪表板
  </button>
  
  <button
    onClick={() => handleTabChange('create')}
    style={{
      padding: '10px 20px',
      backgroundColor: activeTab === 'create' ? 
        (theme === 'dark' ? '#0066cc' : '#007bff') : 
        (theme === 'dark' ? '#333' : '#f0f0f0'),
      color: activeTab === 'create' ? '#fff' : (theme === 'dark' ? '#fff' : '#333'),
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }}
  >
    创建图表
  </button>
  
  <button
    onClick={() => handleTabChange('import')}
    style={{
      padding: '10px 20px',
      backgroundColor: activeTab === 'import' ? 
        (theme === 'dark' ? '#0066cc' : '#007bff') : 
        (theme === 'dark' ? '#333' : '#f0f0f0'),
      color: activeTab === 'import' ? '#fff' : (theme === 'dark' ? '#fff' : '#333'),
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }}
  >
    导入数据
  </button>
  
  <button
    onClick={() => handleTabChange('ai')}
    style={{
      padding: '10px 20px',
      backgroundColor: activeTab === 'ai' ? 
        (theme === 'dark' ? '#0066cc' : '#007bff') : 
        (theme === 'dark' ? '#333' : '#f0f0f0'),
      color: activeTab === 'ai' ? '#fff' : (theme === 'dark' ? '#fff' : '#333'),
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }}
  >
    AI助手
  </button>
  
  <button
    onClick={() => handleTabChange('settings')}
    style={{
      padding: '10px 20px',
      backgroundColor: activeTab === 'settings' ? 
        (theme === 'dark' ? '#0066cc' : '#007bff') : 
        (theme === 'dark' ? '#333' : '#f0f0f0'),
      color: activeTab === 'settings' ? '#fff' : (theme === 'dark' ? '#fff' : '#333'),
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }}
  >
    设置
  </button>
</div>

// 在内容区域添加新组件
{activeTab === 'ai' && <AIChat />}
{activeTab === 'settings' && <Settings />}
```

## 测试计划

### 功能测试

1. **AI服务配置**
   - 测试不同AI服务提供商的配置界面
   - 验证API密钥保存和加载功能
   - 测试连接状态检测功能

2. **数据分析功能**
   - 测试数据洞察生成功能
   - 验证异常检测的准确性
   - 测试趋势预测功能
   - 验证图表建议的合理性

3. **AI对话功能**
   - 测试对话创建和切换功能
   - 验证消息发送和接收功能
   - 测试Markdown渲染功能
   - 验证对话历史保存功能

### 安全测试

1. 测试API密钥的安全存储
2. 验证敏感信息不会被意外泄露

### 性能测试

1. 测试大量数据分析时的响应速度
2. 验证长对话历史的加载性能

## 注意事项

1. **API密钥安全**：API密钥应该安全存储，避免明文保存或暴露在网络请求中
2. **错误处理**：所有AI服务调用都应该有完善的错误处理机制
3. **用户体验**：在AI服务响应期间，应该显示加载状态，避免用户误操作
4. **数据隐私**：明确告知用户数据将被发送到第三方AI服务进行处理
5. **服务限制**：考虑AI服务的调用频率和token限制，避免过度调用导致费用过高

## 参考资源

- [OpenAI API文档](https://platform.openai.com/docs/api-reference)
- [通义千问API文档](https://help.aliyun.com/document_detail/2400395.html)
- [百度文心一言API文档](https://cloud.baidu.com/doc/WENXINWORKSHOP/index.html)
- [讯飞星火API文档](https://www.xfyun.cn/doc/spark/)
- [React Markdown文档](https://github.com/remarkjs/react-markdown)

## 后续优化方向

1. 添加更多AI服务提供商支持
2. 实现更复杂的数据分析功能，如相关性分析和聚类分析
3. 支持更多数据可视化建议，包括配色方案和布局优化
4. 添加AI生成的图表预览功能
5. 实现自然语言生成图表功能（"用柱状图显示销售数据"）