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
    // 如果当前有未保存的API配置变更，提示用户
    if (isApiEdited && selectedModel) {
      if (window.confirm('您有未保存的API配置更改，是否保存？')) {
        updateAIModel(selectedModel.id, tempApiChanges);
      }
    }
    
    setSelectedAIModel(modelId);
    // 重置临时API更改状态
    setIsApiEdited(false);
    setTempApiChanges({});
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
    // 如果当前有未保存的API配置变更，先保存
    if (isApiEdited && selectedModel && selectedModel.id === modelId) {
      updateAIModel(modelId, tempApiChanges);
      setIsApiEdited(false);
      setTempApiChanges({});
    }
    
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

  // 处理API配置的直接更新
  const [isApiEdited, setIsApiEdited] = useState(false);
  const [tempApiChanges, setTempApiChanges] = useState<{
    apiEndpoint?: string;
    apiKey?: string;
    apiVersion?: string;
  }>({});
  
  // 控制API密钥显示/隐藏
  const [showApiKey, setShowApiKey] = useState(false);

  // 处理API配置的变更
  const handleApiConfigChange = (field: string, value: string) => {
    setTempApiChanges(prev => ({
      ...prev,
      [field]: value
    }));
    setIsApiEdited(true);
  };

  // 保存API配置变更
  const handleSaveApiChanges = () => {
    if (selectedModel && isApiEdited) {
      // 验证API端点URL格式（如果有更改）
      if (tempApiChanges.apiEndpoint && !isValidUrl(tempApiChanges.apiEndpoint)) {
        alert('请输入有效的API端点URL');
        return;
      }
      
      // 验证API密钥不为空（如果有更改）
      if (tempApiChanges.apiKey !== undefined && !tempApiChanges.apiKey.trim()) {
        alert('API密钥不能为空');
        return;
      }
      
      updateAIModel(selectedModel.id, tempApiChanges);
      setIsApiEdited(false);
      setTempApiChanges({});
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
    // 如果有未保存的API配置变更，先保存再测试
    if (isApiEdited && selectedModel && selectedModel.id === modelId) {
      updateAIModel(modelId, tempApiChanges);
      setIsApiEdited(false);
      setTempApiChanges({});
      // 短暂延迟后测试连接，确保更新已应用
      setTimeout(() => {
        testAIModelConnection(modelId);
      }, 100);
    } else {
      testAIModelConnection(modelId);
    }
  };

  // 验证URL格式
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证API端点URL格式
    if (!isValidUrl(formData.apiEndpoint)) {
      alert('请输入有效的API端点URL');
      return;
    }
    
    // 验证必填字段
    if (!formData.name.trim() || !formData.provider.trim() || !formData.apiKey.trim()) {
      alert('请填写所有必填字段');
      return;
    }
    
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
    // 如果是编辑模式且有未保存的API配置变更，提示用户
    if (isEditingModel && isApiEdited && selectedModel) {
      if (window.confirm('您有未保存的API配置更改，是否保存？')) {
        updateAIModel(selectedModel.id, tempApiChanges);
      }
      setIsApiEdited(false);
      setTempApiChanges({});
    }
    
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

        {/* 模型详情或表单 */}
        <div className={styles.modelDetails}>
          {isAddingModel || isEditingModel ? (
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
                  <div className={styles.passwordInputContainer}>
                    <input 
                      type={showApiKey ? "text" : "password"} 
                      id="apiKey" 
                      value={formData.apiKey} 
                      onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                      required 
                    />
                    <button 
                      type="button"
                      className={styles.togglePasswordButton}
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? "隐藏" : "显示"}
                    </button>
                  </div>
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
          ) : (
            <>
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
                    <div className={styles.apiKeyContainer}>
                      <input 
                        type="url" 
                        className={styles.apiKeyInput}
                        value={tempApiChanges.apiEndpoint !== undefined ? tempApiChanges.apiEndpoint : selectedModel.apiEndpoint} 
                        onChange={(e) => {
                          handleApiConfigChange('apiEndpoint', e.target.value);
                        }}
                        placeholder="输入API端点URL"
                      />
                    </div>
                  </div>
                  <div className={styles.detailItem}>
                    <label>API密钥:</label>
                    <div className={styles.apiKeyContainer}>
                      <div className={styles.passwordInputContainer}>
                        <input 
                          type={showApiKey ? "text" : "password"} 
                          className={styles.apiKeyInput}
                          value={tempApiChanges.apiKey !== undefined ? tempApiChanges.apiKey : selectedModel.apiKey} 
                          onChange={(e) => {
                            handleApiConfigChange('apiKey', e.target.value);
                          }}
                          placeholder="输入API密钥"
                        />
                        <button 
                          type="button"
                          className={styles.togglePasswordButton}
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? "隐藏" : "显示"}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className={styles.detailItem}>
                    <label>API版本:</label>
                    <div className={styles.apiKeyContainer}>
                      <input 
                        type="text" 
                        className={styles.apiKeyInput}
                        value={tempApiChanges.apiVersion !== undefined ? tempApiChanges.apiVersion : (selectedModel.apiVersion || '')} 
                        onChange={(e) => {
                          handleApiConfigChange('apiVersion', e.target.value);
                        }}
                        placeholder="输入API版本（可选）"
                      />
                    </div>
                  </div>
                  
                  {isApiEdited && (
                    <div className={styles.apiSaveContainer}>
                      <button 
                        className={styles.saveApiButton}
                        onClick={handleSaveApiChanges}
                      >
                        保存API配置
                      </button>
                    </div>
                  )}
                  
                  {/* 测试结果 */}
                  {testResult && selectedAIModelId === selectedModel.id && (
                    <div className={`${styles.testResult} ${testResult.success ? styles.success : styles.error}`}>
                      {testResult.message}
                    </div>
                  )}
                  
                  <div className={styles.actions}>
                    {selectedModel.isCustom ? (
                      <>
                        <button 
                          className={styles.editButton} 
                          onClick={() => handleEditModel(selectedModel.id)}
                        >
                          编辑全部
                        </button>
                        <button 
                          className={styles.deleteButton} 
                          onClick={() => handleDeleteModel(selectedModel.id)}
                        >
                          删除
                        </button>
                      </>
                    ) : (
                      <button 
                        className={styles.editButton} 
                        onClick={() => handleEditModel(selectedModel.id)}
                      >
                        编辑全部
                      </button>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIConfig;