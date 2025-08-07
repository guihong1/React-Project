# AI配置功能开发文档

## 1. 功能概述

本文档详细描述了DataViz应用中AI配置功能的开发流程和实现方案。该功能允许用户选择预设的AI大模型或自定义添加AI大模型，以支持后续的AI数据分析功能。

## 2. 需求分析

### 2.1 功能需求

1. **AI模型选择**：用户可以从预设的AI模型列表中选择一个模型用于数据分析
2. **自定义AI模型**：用户可以添加自定义的AI大模型，包括模型名称、API端点和API密钥
3. **模型管理**：用户可以查看、编辑和删除已添加的自定义AI模型
4. **默认模型设置**：用户可以设置默认使用的AI模型
5. **模型测试**：用户可以测试AI模型的连接和响应

### 2.2 非功能需求

1. **安全性**：API密钥等敏感信息需要安全存储
2. **可用性**：界面简洁直观，操作流程清晰
3. **性能**：模型切换和配置应该快速响应
4. **兼容性**：支持多种主流AI大模型的API格式

## 3. 技术架构

### 3.1 前端架构

- **框架**：React + TypeScript
- **状态管理**：Zustand
- **路由**：React Router
- **UI组件**：自定义组件 + CSS Modules
- **数据持久化**：localStorage

### 3.2 数据模型

```typescript
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

// AI配置状态
export interface AIConfigState {
  models: AIModel[];           // 所有可用的AI模型
  selectedModelId: string;     // 当前选中的模型ID
  isTestingConnection: boolean;// 是否正在测试连接
  testResult: {
    success: boolean;          // 测试是否成功
    message: string;          // 测试结果消息
  } | null;
}
```

## 4. UI设计

### 4.1 页面布局

AI配置页面将包含以下主要部分：

1. **模型选择区域**：显示所有可用的AI模型，包括预设模型和自定义模型
2. **模型详情区域**：显示选中模型的详细信息
3. **操作区域**：包含添加、编辑、删除和测试模型的按钮
4. **表单区域**：用于添加或编辑模型信息的表单

### 4.2 交互流程

1. 用户进入AI配置页面，查看可用的AI模型列表
2. 用户可以选择一个模型作为当前使用的模型
3. 用户可以点击"添加模型"按钮，填写自定义模型信息并保存
4. 用户可以编辑或删除已添加的自定义模型
5. 用户可以测试模型连接，验证API密钥和端点是否有效
6. 用户可以设置默认模型，该设置将在应用重启后仍然生效

### 4.3 UI组件设计

#### 4.3.1 模型列表组件

```jsx
<div className={styles.modelList}>
  <h3>可用AI模型</h3>
  <ul>
    {models.map(model => (
      <li 
        key={model.id} 
        className={selectedModelId === model.id ? styles.selected : ''}
        onClick={() => selectModel(model.id)}
      >
        <div className={styles.modelInfo}>
          <span className={styles.modelName}>{model.name}</span>
          <span className={styles.modelProvider}>{model.provider}</span>
          {model.isDefault && <span className={styles.defaultBadge}>默认</span>}
        </div>
      </li>
    ))}
  </ul>
  <button className={styles.addButton} onClick={handleAddModel}>
    添加自定义模型
  </button>
</div>
```

#### 4.3.2 模型详情组件

```jsx
<div className={styles.modelDetails}>
  <h3>模型详情</h3>
  {selectedModel ? (
    <div>
      <div className={styles.detailItem}>
        <label>名称:</label>
        <span>{selectedModel.name}</span>
      </div>
      <div className={styles.detailItem}>
        <label>提供商:</label>
        <span>{selectedModel.provider}</span>
      </div>
      <div className={styles.detailItem}>
        <label>API端点:</label>
        <span>{selectedModel.apiEndpoint}</span>
      </div>
      <div className={styles.detailItem}>
        <label>API密钥:</label>
        <span>{'•'.repeat(10)}</span>
      </div>
      {selectedModel.apiVersion && (
        <div className={styles.detailItem}>
          <label>API版本:</label>
          <span>{selectedModel.apiVersion}</span>
        </div>
      )}
      <div className={styles.actions}>
        {selectedModel.isCustom && (
          <>
            <button onClick={() => handleEditModel(selectedModel.id)}>编辑</button>
            <button onClick={() => handleDeleteModel(selectedModel.id)}>删除</button>
          </>
        )}
        <button onClick={() => handleSetDefault(selectedModel.id)}>
          {selectedModel.isDefault ? '默认模型' : '设为默认'}
        </button>
        <button onClick={() => handleTestConnection(selectedModel.id)}>测试连接</button>
      </div>
    </div>
  ) : (
    <p>请选择一个AI模型查看详情</p>
  )}
</div>
```

#### 4.3.3 模型表单组件

```jsx
<div className={styles.modelForm}>
  <h3>{isEditing ? '编辑模型' : '添加模型'}</h3>
  <form onSubmit={handleSubmit}>
    <div className={styles.formGroup}>
      <label htmlFor="name">模型名称</label>
      <input 
        type="text" 
        id="name" 
        value={formData.name} 
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required 
      />
    </div>
    <div className={styles.formGroup}>
      <label htmlFor="provider">提供商</label>
      <input 
        type="text" 
        id="provider" 
        value={formData.provider} 
        onChange={(e) => setFormData({...formData, provider: e.target.value})}
        required 
      />
    </div>
    <div className={styles.formGroup}>
      <label htmlFor="apiEndpoint">API端点</label>
      <input 
        type="url" 
        id="apiEndpoint" 
        value={formData.apiEndpoint} 
        onChange={(e) => setFormData({...formData, apiEndpoint: e.target.value})}
        required 
      />
    </div>
    <div className={styles.formGroup}>
      <label htmlFor="apiKey">API密钥</label>
      <input 
        type="password" 
        id="apiKey" 
        value={formData.apiKey} 
        onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
        required 
      />
    </div>
    <div className={styles.formGroup}>
      <label htmlFor="apiVersion">API版本 (可选)</label>
      <input 
        type="text" 
        id="apiVersion" 
        value={formData.apiVersion || ''} 
        onChange={(e) => setFormData({...formData, apiVersion: e.target.value})}
      />
    </div>
    <div className={styles.formActions}>
      <button type="button" onClick={handleCancel}>取消</button>
      <button type="submit">{isEditing ? '保存' : '添加'}</button>
    </div>
  </form>
</div>
```

## 5. 状态管理

### 5.1 Zustand Store扩展

需要在现有的Zustand Store中添加AI配置相关的状态和操作：

```typescript
// 在store/index.ts中添加
import { v4 as uuidv4 } from 'uuid';
import type { AIModel } from '../types';

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
    
    let models = savedModels ? JSON.parse(savedModels) : presetAIModels;
    
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

const persistedAIConfig = loadAIModels();

// 扩展AppStore接口
interface AppStore extends AppState {
  // 现有的状态和操作...
  
  // AI配置相关
  aiModels: AIModel[];
  selectedAIModelId: string;
  isTestingConnection: boolean;
  testResult: { success: boolean; message: string } | null;
  
  // AI配置相关操作
  setSelectedAIModel: (modelId: string) => void;
  addAIModel: (model: Omit<AIModel, 'id' | 'isCustom' | 'isDefault'>) => void;
  updateAIModel: (modelId: string, updates: Partial<AIModel>) => void;
  deleteAIModel: (modelId: string) => void;
  setDefaultAIModel: (modelId: string) => void;
  testAIModelConnection: (modelId: string) => Promise<void>;
}

// 在useAppStore的创建中添加
export const useAppStore = create<AppStore>((set, get) => ({
  // 现有的状态和操作...
  
  // AI配置相关状态
  aiModels: persistedAIConfig.models,
  selectedAIModelId: persistedAIConfig.selectedModelId,
  isTestingConnection: false,
  testResult: null,
  
  // AI配置相关操作
  setSelectedAIModel: (modelId) => {
    localStorage.setItem('selectedAIModelId', modelId);
    set({ selectedAIModelId: modelId });
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
      // 这里是模拟API调用，实际项目中应该调用真实的API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟成功响应
      const success = model.apiKey.length > 0;
      
      set({ 
        isTestingConnection: false,
        testResult: { 
          success, 
          message: success ? '连接成功' : 'API密钥无效' 
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
  }
}));
```

## 6. 实现步骤

### 6.1 类型定义

1. 在`src/types/index.ts`中添加AI模型相关的类型定义：

```typescript
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
```

### 6.2 状态管理扩展

1. 按照5.1节中的代码，扩展`src/store/index.ts`文件，添加AI配置相关的状态和操作

### 6.3 创建AI配置页面

1. 创建`src/pages/AIConfig.tsx`文件，实现AI配置页面

```typescript
import React, { useState } from 'react';
import { useAppStore } from '../store';
import type { AIModel } from '../types';
import styles from './AIConfig.module.css';

const AIConfig: React.FC = () => {
  const { 
    theme, 
    aiModels, 
    selectedAIModelId, 
    isTestingConnection,
    testResult,
    setSelectedAIModel,
    addAIModel,
    updateAIModel,
    deleteAIModel,
    setDefaultAIModel,
    testAIModelConnection
  } = useAppStore();

  const [isAddingModel, setIsAddingModel] = useState(false);
  const [isEditingModel, setIsEditingModel] = useState(false);
  const [formData, setFormData] = useState<Omit<AIModel, 'id' | 'isCustom' | 'isDefault'>>({ 
    name: '', 
    provider: '', 
    apiEndpoint: '', 
    apiKey: '',
    apiVersion: ''
  });
  const [editingModelId, setEditingModelId] = useState<string | null>(null);

  const selectedModel = aiModels.find(model => model.id === selectedAIModelId);

  // 处理选择模型
  const handleSelectModel = (modelId: string) => {
    setSelectedAIModel(modelId);
  };

  // 处理添加模型
  const handleAddModel = () => {
    setFormData({ 
      name: '', 
      provider: '', 
      apiEndpoint: '', 
      apiKey: '',
      apiVersion: ''
    });
    setIsAddingModel(true);
    setIsEditingModel(false);
    setEditingModelId(null);
  };

  // 处理编辑模型
  const handleEditModel = (modelId: string) => {
    const model = aiModels.find(m => m.id === modelId);
    if (model) {
      setFormData({
        name: model.name,
        provider: model.provider,
        apiEndpoint: model.apiEndpoint,
        apiKey: model.apiKey,
        apiVersion: model.apiVersion || ''
      });
      setIsEditingModel(true);
      setIsAddingModel(false);
      setEditingModelId(modelId);
    }
  };

  // 处理删除模型
  const handleDeleteModel = (modelId: string) => {
    if (window.confirm('确定要删除这个模型吗？')) {
      deleteAIModel(modelId);
    }
  };

  // 处理设置默认模型
  const handleSetDefault = (modelId: string) => {
    setDefaultAIModel(modelId);
  };

  // 处理测试连接
  const handleTestConnection = (modelId: string) => {
    testAIModelConnection(modelId);
  };

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditingModel && editingModelId) {
      updateAIModel(editingModelId, formData);
    } else if (isAddingModel) {
      addAIModel(formData);
    }
    
    setIsAddingModel(false);
    setIsEditingModel(false);
    setEditingModelId(null);
  };

  // 处理取消
  const handleCancel = () => {
    setIsAddingModel(false);
    setIsEditingModel(false);
    setEditingModelId(null);
  };

  return (
    <div className={`${styles.container} ${theme === 'dark' ? styles.dark : styles.light}`}>
      <h1 className={styles.title}>AI配置</h1>
      
      <div className={styles.content}>
        {/* 模型列表 */}
        <div className={styles.modelList}>
          <h3>可用AI模型</h3>
          <ul>
            {aiModels.map(model => (
              <li 
                key={model.id} 
                className={`${styles.modelItem} ${selectedAIModelId === model.id ? styles.selected : ''}`}
                onClick={() => handleSelectModel(model.id)}
              >
                <div className={styles.modelInfo}>
                  <span className={styles.modelName}>{model.name}</span>
                  <span className={styles.modelProvider}>{model.provider}</span>
                  {model.isDefault && <span className={styles.defaultBadge}>默认</span>}
                </div>
              </li>
            ))}
          </ul>
          <button className={styles.addButton} onClick={handleAddModel}>
            添加自定义模型
          </button>
        </div>

        {/* 模型详情 */}
        {!isAddingModel && !isEditingModel && (
          <div className={styles.modelDetails}>
            <h3>模型详情</h3>
            {selectedModel ? (
              <div>
                <div className={styles.detailItem}>
                  <label>名称:</label>
                  <span>{selectedModel.name}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>提供商:</label>
                  <span>{selectedModel.provider}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>API端点:</label>
                  <span>{selectedModel.apiEndpoint}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>API密钥:</label>
                  <span>{'•'.repeat(10)}</span>
                </div>
                {selectedModel.apiVersion && (
                  <div className={styles.detailItem}>
                    <label>API版本:</label>
                    <span>{selectedModel.apiVersion}</span>
                  </div>
                )}
                
                {/* 测试结果 */}
                {testResult && selectedAIModelId === selectedModel.id && (
                  <div className={`${styles.testResult} ${testResult.success ? styles.success : styles.error}`}>
                    {testResult.message}
                  </div>
                )}
                
                <div className={styles.actions}>
                  {selectedModel.isCustom && (
                    <>
                      <button 
                        className={styles.editButton} 
                        onClick={() => handleEditModel(selectedModel.id)}
                      >
                        编辑
                      </button>
                      <button 
                        className={styles.deleteButton} 
                        onClick={() => handleDeleteModel(selectedModel.id)}
                      >
                        删除
                      </button>
                    </>
                  )}
                  <button 
                    className={`${styles.defaultButton} ${selectedModel.isDefault ? styles.isDefault : ''}`} 
                    onClick={() => handleSetDefault(selectedModel.id)}
                    disabled={selectedModel.isDefault}
                  >
                    {selectedModel.isDefault ? '默认模型' : '设为默认'}
                  </button>
                  <button 
                    className={styles.testButton} 
                    onClick={() => handleTestConnection(selectedModel.id)}
                    disabled={isTestingConnection}
                  >
                    {isTestingConnection && selectedAIModelId === selectedModel.id ? '测试中...' : '测试连接'}
                  </button>
                </div>
              </div>
            ) : (
              <p>请选择一个AI模型查看详情</p>
            )}
          </div>
        )}

        {/* 添加/编辑模型表单 */}
        {(isAddingModel || isEditingModel) && (
          <div className={styles.modelForm}>
            <h3>{isEditingModel ? '编辑模型' : '添加模型'}</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="name">模型名称</label>
                <input 
                  type="text" 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="provider">提供商</label>
                <input 
                  type="text" 
                  id="provider" 
                  value={formData.provider} 
                  onChange={(e) => setFormData({...formData, provider: e.target.value})}
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="apiEndpoint">API端点</label>
                <input 
                  type="url" 
                  id="apiEndpoint" 
                  value={formData.apiEndpoint} 
                  onChange={(e) => setFormData({...formData, apiEndpoint: e.target.value})}
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="apiKey">API密钥</label>
                <input 
                  type="password" 
                  id="apiKey" 
                  value={formData.apiKey} 
                  onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="apiVersion">API版本 (可选)</label>
                <input 
                  type="text" 
                  id="apiVersion" 
                  value={formData.apiVersion || ''} 
                  onChange={(e) => setFormData({...formData, apiVersion: e.target.value})}
                />
              </div>
              <div className={styles.formActions}>
                <button type="button" onClick={handleCancel}>取消</button>
                <button type="submit">{isEditingModel ? '保存' : '添加'}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIConfig;
```

### 6.4 创建样式文件

1. 创建`src/pages/AIConfig.module.css`文件，实现AI配置页面的样式

```css
.container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.dark {
  color: #f0f0f0;
  background-color: #1a1a1a;
}

.light {
  color: #333;
  background-color: #f8f8f8;
}

.title {
  font-size: 2rem;
  margin-bottom: 20px;
  background: linear-gradient(90deg, #646cff, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

.content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
}

@media (max-width: 768px) {
  .content {
    grid-template-columns: 1fr;
  }
}

/* 模型列表样式 */
.modelList {
  background-color: var(--bg-secondary);
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dark .modelList {
  background-color: #2a2a2a;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.modelList h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.2rem;
}

.modelList ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.modelItem {
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dark .modelItem {
  background-color: #333;
}

.light .modelItem {
  background-color: #fff;
}

.modelItem:hover {
  background-color: rgba(100, 108, 255, 0.1);
}

.modelItem.selected {
  background-color: rgba(100, 108, 255, 0.2);
  border-left: 3px solid #646cff;
}

.modelInfo {
  display: flex;
  flex-direction: column;
}

.modelName {
  font-weight: 500;
  margin-bottom: 4px;
}

.modelProvider {
  font-size: 0.85rem;
  color: #888;
}

.dark .modelProvider {
  color: #aaa;
}

.defaultBadge {
  display: inline-block;
  background-color: #646cff;
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 10px;
  margin-top: 5px;
  align-self: flex-start;
}

.addButton {
  width: 100%;
  padding: 10px;
  margin-top: 15px;
  background-color: #646cff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.addButton:hover {
  background-color: #535bf2;
}

/* 模型详情样式 */
.modelDetails {
  background-color: var(--bg-secondary);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dark .modelDetails {
  background-color: #2a2a2a;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.modelDetails h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.2rem;
}

.detailItem {
  display: flex;
  margin-bottom: 15px;
}

.detailItem label {
  width: 100px;
  font-weight: 500;
  color: #666;
}

.dark .detailItem label {
  color: #aaa;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.actions button {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.editButton {
  background-color: #4caf50;
  color: white;
}

.editButton:hover {
  background-color: #43a047;
}

.deleteButton {
  background-color: #f44336;
  color: white;
}

.deleteButton:hover {
  background-color: #e53935;
}

.defaultButton {
  background-color: #ff9800;
  color: white;
}

.defaultButton:hover {
  background-color: #fb8c00;
}

.defaultButton.isDefault {
  background-color: #ffc107;
  cursor: default;
}

.testButton {
  background-color: #2196f3;
  color: white;
}

.testButton:hover {
  background-color: #1e88e5;
}

.testButton:disabled {
  background-color: #90caf9;
  cursor: not-allowed;
}

.testResult {
  margin: 15px 0;
  padding: 10px;
  border-radius: 4px;
}

.testResult.success {
  background-color: rgba(76, 175, 80, 0.1);
  border-left: 3px solid #4caf50;
  color: #4caf50;
}

.dark .testResult.success {
  background-color: rgba(76, 175, 80, 0.2);
  color: #81c784;
}

.testResult.error {
  background-color: rgba(244, 67, 54, 0.1);
  border-left: 3px solid #f44336;
  color: #f44336;
}

.dark .testResult.error {
  background-color: rgba(244, 67, 54, 0.2);
  color: #e57373;
}

/* 表单样式 */
.modelForm {
  background-color: var(--bg-secondary);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dark .modelForm {
  background-color: #2a2a2a;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.modelForm h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.2rem;
}

.formGroup {
  margin-bottom: 15px;
}

.formGroup label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #666;
}

.dark .formGroup label {
  color: #aaa;
}

.formGroup input {
  width: 100%;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background-color: #fff;
  color: #333;
}

.dark .formGroup input {
  background-color: #333;
  border-color: #555;
  color: #f0f0f0;
}

.formActions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.formActions button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.formActions button[type="button"] {
  background-color: #9e9e9e;
  color: white;
}

.formActions button[type="button"]:hover {
  background-color: #757575;
}

.formActions button[type="submit"] {
  background-color: #646cff;
  color: white;
}

.formActions button[type="submit"]:hover {
  background-color: #535bf2;
}
```

### 6.5 更新路由配置

1. 在`src/routes/index.tsx`中添加AI配置页面的路由

```typescript
import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import HomePage from '../components/HomePage';
import { 
  Dashboard, 
  ChartEditor, 
  DataImport, 
  DashboardManager,
  AIAnalysis,
  NotFound 
} from '../components';
import ChartCreator from '../components/ChartCreator';
import AIConfig from '../pages/AIConfig'; // 导入AI配置页面

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <Navigate to="/home" replace />
      },
      {
        path: 'home',
        element: <HomePage />
      },
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      {
        path: 'import',
        element: <DataImport />
      },
      {
        path: 'create',
        element: <ChartCreator />
      },
      {
        path: 'edit/:chartId',
        element: <ChartCreator />
      },
      {
        path: 'manage',
        element: <DashboardManager />
      },
      {
        path: 'ai',
        element: <AIAnalysis />
      },
      {
        path: 'ai-config',
        element: <AIConfig />
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
]);

export default router;
```

### 6.6 更新AIAnalysis组件

1. 修改`src/components/AIAnalysis.tsx`，使其使用配置的AI模型进行分析

```typescript
// 在AIAnalysis.tsx中添加

// 导入AI模型相关的状态
const { 
  theme, 
  dashboards, 
  aiModels,
  selectedAIModelId
} = useAppStore();

// 获取当前选中的AI模型
const selectedModel = aiModels.find(model => model.id === selectedAIModelId);

// 在analyzeData函数中添加
const analyzeData = () => {
  // 获取选中的数据源
  const selectedSource = availableDataSources.find(source => source.id === selectedDataSource);
  const dataToAnalyze = selectedSource?.data;
  
  if (!dataToAnalyze || dataToAnalyze.length === 0) {
    alert('没有可分析的数据');
    return;
  }

  setIsAnalyzing(true);
  setInsights([]);

  // 显示当前使用的AI模型
  console.log(`使用模型: ${selectedModel?.name || '未选择模型'}`);
  
  // 这里是模拟API调用，实际项目中应该调用真实的AI模型API
  // 根据selectedModel的配置调用相应的API
  
  // 模拟API调用延迟
  setTimeout(() => {
    // 现有的分析逻辑...
  }, 1500);
};

// 在UI中添加当前使用的AI模型信息
return (
  <div style={{/* 现有样式 */}}>
    <div style={{/* 现有样式 */}}>
      <h2 style={{/* 现有样式 */}}>
        AI 数据洞察
      </h2>
      
      {/* 添加当前使用的AI模型信息 */}
      <div style={{ 
        fontSize: '0.9rem', 
        color: theme === 'dark' ? '#aaa' : '#666',
        marginBottom: '10px'
      }}>
        当前使用模型: {selectedModel?.name || '未选择模型'}
        <a 
          href="/ai-config" 
          style={{ 
            marginLeft: '10px', 
            color: '#646cff',
            textDecoration: 'none'
          }}
        >
          更改
        </a>
      </div>
      
      {/* 现有的UI组件... */}
    </div>
    {/* 现有的UI组件... */}
  </div>
);
```

## 7. 测试和部署

### 7.1 测试计划

1. **功能测试**：
   - 验证预设AI模型的显示和选择
   - 测试添加、编辑和删除自定义AI模型
   - 验证设置默认模型功能
   - 测试模型连接功能

2. **兼容性测试**：
   - 在不同浏览器中测试
   - 测试响应式布局在不同设备上的表现

3. **集成测试**：
   - 验证AI配置与AI分析功能的集成
   - 测试配置的模型是否正确用于数据分析

### 7.2 部署步骤

1. 构建生产版本：
   ```bash
   npm run build
   ```

2. 将构建产物部署到Web服务器

3. 配置服务器环境变量（如需要）

## 8. 后续优化

1. **安全性增强**：
   - 实现API密钥的加密存储
   - 添加访问控制和权限管理

2. **功能扩展**：
   - 支持更多AI模型和提供商
   - 添加模型参数配置（如温度、最大令牌数等）
   - 实现模型性能监控和使用统计

3. **用户体验优化**：
   - 添加更详细的模型说明和使用指南
   - 实现模型推荐功能
   - 提供模型使用示例

## 9. 总结

本文档详细描述了DataViz应用中AI配置功能的开发流程和实现方案。通过实现这一功能，用户可以灵活选择和配置AI大模型，为后续的AI数据分析功能提供支持。该功能的实现将显著提升应用的灵活性和可扩展性，使用户能够根据自己的需求和偏好选择合适的AI模型进行数据分析。