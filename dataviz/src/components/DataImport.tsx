import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import type { DataPoint } from '../types/chart';
import type { ImportedDataset } from '../types';
import './DataImport.css';

interface DataImportProps {}

export const DataImport: React.FC<DataImportProps> = () => {
  const { theme, setError, setLoading, isLoading, error, importedDatasets, addImportedDataset } = useAppStore();
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');
  const [parsedData, setParsedData] = useState<DataPoint[] | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // 当文件名变化时，自动设置数据集名称为文件名（不含扩展名）
  useEffect(() => {
    if (fileName) {
      const nameWithoutExtension = fileName.replace(/\.json$/, '');
      setDatasetName(nameWithoutExtension);
    }
  }, [fileName]);

  const processFile = async (file: File) => {
    // 清除之前的错误和成功消息
    setError(null);
    setSuccessMessage(null);
    // 设置加载状态
    setLoading(true);
    
    try {
      // 模拟网络延迟，实际项目中可以删除这行
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const text = await file.text();
      const data = JSON.parse(text);
      
      // 验证数据格式
      if (!Array.isArray(data)) {
        throw new Error('导入的数据必须是数组格式');
      }
      
      // 验证数据结构
      const validData = data.filter((item): item is DataPoint => {
        return (
          typeof item === 'object' &&
          item !== null &&
          typeof item.id === 'string' &&
          typeof item.name === 'string' &&
          typeof item.value === 'number'
        );
      });
      
      if (validData.length === 0) {
        throw new Error('导入的数据格式不正确，请确保包含id、name和value字段');
      }
      
      // 更新文件名显示
      setFileName(file.name);
      
      // 保存解析后的数据到状态
      setParsedData(validData);
      
      // 显示成功消息
      setSuccessMessage(`成功解析 ${validData.length} 条数据，请输入数据集名称并保存`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '导入数据时发生错误';
      setError(errorMessage);
    } finally {
      // 无论成功还是失败，都关闭加载状态
      setLoading(false);
    }
  };
  
  const saveDataset = () => {
    if (!parsedData) {
      setError('没有可保存的数据');
      return;
    }
    
    if (!datasetName.trim()) {
      setError('请输入数据集名称');
      return;
    }
    
    // 创建新的数据集对象
    const newDataset: ImportedDataset = {
      id: `dataset-${Date.now()}`,
      name: datasetName.trim(),
      data: parsedData,
      createdAt: Date.now()
    };
    
    // 添加到全局状态
    addImportedDataset(newDataset);
    
    // 保存到localStorage（保持向后兼容）
    localStorage.setItem('importedData', JSON.stringify(parsedData));
    
    // 显示成功消息
     setSuccessMessage(`成功保存数据集 "${datasetName}"`);
    
     // 2秒后导航到创建图表页面
     setTimeout(() => {
       navigate('/create');
     }, 2000);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/json') {
        processFile(file);
      } else {
        setError('请上传JSON格式的文件');
        alert('请上传JSON格式的文件');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/json') {
        processFile(file);
      } else {
        setError('请上传JSON格式的文件');
        alert('请上传JSON格式的文件');
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      className={`import-container ${theme}`}
      style={{
        padding: '20px',
        backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f8f8f8',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: theme === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
        position: 'relative',
      }}
    >
      {/* Loading 遮罩 */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}

      <h2 style={{ color: theme === 'dark' ? '#fff' : '#333', marginBottom: '15px' }}>
        数据导入
      </h2>
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="drop-area"
        style={{
          border: `2px dashed ${isDragging ? '#646cff' : theme === 'dark' ? '#555' : '#ccc'}`,
          backgroundColor: isDragging ? (theme === 'dark' ? '#333' : '#f0f0f0') : 'transparent',
          marginBottom: '15px'
        }}
        onClick={handleButtonClick}
      >
        <p style={{ color: theme === 'dark' ? '#ddd' : '#666' }}>
          {fileName ? `已导入: ${fileName}` : '拖拽JSON文件到此处或点击上传'}
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          style={{ display: 'none' }}
        />
      </div>
      
      {/* 数据集名称输入 */}
      {parsedData && (
        <div style={{ marginBottom: '15px' }}>
          <label 
            htmlFor="dataset-name" 
            style={{ 
              display: 'block', 
              marginBottom: '5px',
              color: theme === 'dark' ? '#ddd' : '#555'
            }}
          >
            数据集名称
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              id="dataset-name"
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                backgroundColor: theme === 'dark' ? '#333' : '#fff',
                color: theme === 'dark' ? '#fff' : '#333',
              }}
              placeholder="输入数据集名称"
            />
            <button
              onClick={saveDataset}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#646cff',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              保存数据集
            </button>
          </div>
        </div>
      )}
      
      {/* 已导入数据集列表 */}
      {importedDatasets.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ color: theme === 'dark' ? '#ddd' : '#555', marginBottom: '10px' }}>
            已导入的数据集
          </h3>
          <div className={`dataset-list ${theme}`} style={{
            backgroundColor: theme === 'dark' ? '#333' : '#f5f5f5',
            padding: '10px',
          }}>
            {importedDatasets.map(dataset => (
              <div 
                key={dataset.id}
                className="dataset-item"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div className="dataset-name" style={{ color: theme === 'dark' ? '#fff' : '#333' }}>
                    {dataset.name}
                  </div>
                  <div className="dataset-meta" style={{ color: theme === 'dark' ? '#aaa' : '#777' }}>
                    {dataset.data.length} 条数据 · {new Date(dataset.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 错误提示 */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* 成功提示 */}
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}
      
      <div style={{ marginTop: '15px', fontSize: '14px', color: theme === 'dark' ? '#aaa' : '#777' }}>
        <p>支持的数据格式:</p>
        <pre style={{
          backgroundColor: theme === 'dark' ? '#333' : '#f5f5f5',
          padding: '10px',
          borderRadius: '4px',
          overflowX: 'auto',
          color: theme === 'dark' ? '#ddd' : '#333',
        }}>
          {`[
  { "id": "1", "name": "项目1", "value": 100 },
  { "id": "2", "name": "项目2", "value": 200 }
]`}
        </pre>
      </div>
    </div>
  );
};

export default DataImport;