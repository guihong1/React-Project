import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import type { DataPoint } from '../types/chart';
import type { ImportedDataset } from '../types';
import styles from './DataImport.module.css';

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
    <div className={`${styles.container} ${styles[theme]}`}>
      {/* Loading 遮罩 */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
        </div>
      )}

      <div className={styles.header}>
        <h1>数据导入</h1>
        <p>上传您的数据文件，开始创建精美的图表</p>
      </div>
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`${styles.uploadArea} ${styles[theme]} ${isDragging ? styles.dragging : ''}`}
        onClick={handleButtonClick}
      >
        <div className={styles.uploadIcon}>📁</div>
        <div className={styles.uploadText}>
          {fileName ? `已导入: ${fileName}` : '拖拽JSON文件到此处或点击上传'}
        </div>
        <div className={styles.uploadSubtext}>
          支持 JSON 格式文件
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className={styles.fileInput}
        />
      </div>
      
      {/* 数据集名称输入 */}
      {parsedData && (
        <div className={`${styles.formSection} ${styles[theme]}`}>
          <div className={styles.formGroup}>
            <label htmlFor="dataset-name" className={styles.label}>
              数据集名称
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                id="dataset-name"
                type="text"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                className={`${styles.input} ${styles[theme]}`}
                placeholder="输入数据集名称"
              />
              <button
                onClick={saveDataset}
                className={`${styles.button} ${styles.primary}`}
              >
                保存数据集
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 已导入数据集列表 */}
      {importedDatasets.length > 0 && (
        <div className={styles.previewSection}>
          <h3 className={styles.previewTitle}>
            已导入的数据集
          </h3>
          <div className={`${styles.formSection} ${styles[theme]}`}>
            {importedDatasets.map(dataset => (
              <div 
                key={dataset.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid',
                  borderColor: theme === 'dark' ? '#444' : '#e0e0e0'
                }}
              >
                <div>
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                    {dataset.name}
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: '0.7' }}>
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
        <div className={`${styles.message} ${styles.error} ${styles[theme]}`}>
          {error}
        </div>
      )}

      {/* 成功提示 */}
      {successMessage && (
        <div className={`${styles.message} ${styles.success} ${styles[theme]}`}>
          {successMessage}
        </div>
      )}
      
      <div className={`${styles.formSection} ${styles[theme]}`}>
        <div className={styles.label}>支持的数据格式:</div>
        <pre className={`${styles.input} ${styles[theme]}`} style={{
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          whiteSpace: 'pre-wrap',
          overflowX: 'auto'
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