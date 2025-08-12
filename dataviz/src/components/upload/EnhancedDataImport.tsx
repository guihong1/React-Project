import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';

import type { ImportedDataset } from '../../types';
import type { DataPointWithOutlier } from '../../types/chart';
import { getOutliersSummary } from '../../utils/outlierDetection';
import { parseFileWithWorker } from '../../utils/workerUtils';
import ChunkedUploader from './ChunkedUploader';
import VirtualizedTable from '../common/VirtualizedTable';
import styles from '../DataImport.module.css';
import uploadStyles from './EnhancedDataImport.module.css';

interface EnhancedDataImportProps {
  onImportSuccess?: () => void;
}

type FileFormat = 'json' | 'csv' | 'excel' | 'auto';

export const EnhancedDataImport: React.FC<EnhancedDataImportProps> = ({ onImportSuccess }) => {
  const { theme, setError, setLoading, isLoading, error, importedDatasets, addImportedDataset, removeImportedDataset } = useAppStore();
  const navigate = useNavigate();
  const [selectedFormat, setSelectedFormat] = useState<FileFormat>('auto');
  const [fileName, setFileName] = useState<string | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');
  const [parsedData, setParsedData] = useState<DataPointWithOutlier[] | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showChunkedUploader, setShowChunkedUploader] = useState<boolean>(false);
  const [, setIsLargeFile] = useState<boolean>(false);
  const [detectOutliers, setDetectOutliers] = useState<boolean>(true);
  const [outliersSummary, setOutliersSummary] = useState<ReturnType<typeof getOutliersSummary> | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 预览数据集相关状态
  const [previewDataset, setPreviewDataset] = useState<ImportedDataset | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // 当文件名变化时，自动设置数据集名称为文件名（不含扩展名）
  useEffect(() => {
    if (fileName) {
      const nameWithoutExtension = fileName.replace(/\.(json|csv|xlsx|xls)$/i, '');
      setDatasetName(nameWithoutExtension);
    }
  }, [fileName]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 处理文件上传完成后的解析
  const handleFileProcessed = async (file: File) => {
    // 清除之前的错误和成功消息
    setError(null);
    setSuccessMessage(null);
    setOutliersSummary(null);
    // 设置加载状态
    setLoading(true);
    
    try {
      // 使用WebWorker解析文件数据，并根据设置决定是否检测异常值
      const result = await parseFileWithWorker(file, selectedFormat, detectOutliers);
      const validData = result.data;
      
      // 更新文件名显示
      setFileName(file.name);
      
      // 保存解析后的数据到状态
      setParsedData(validData);
      
      // 如果启用了异常值检测，使用返回的摘要信息
      if (detectOutliers && result.summary) {
        setOutliersSummary(result.summary);
        
        // 显示成功消息，包含异常值信息
        if (result.summary.count > 0) {
          setSuccessMessage(
            `成功解析 ${validData.length} 条数据，检测到 ${result.summary.count} 个异常值 (${result.summary.percentage.toFixed(1)}%)。请输入数据集名称并保存。`
          );
        } else {
          setSuccessMessage(`成功解析 ${validData.length} 条数据，未检测到异常值。请输入数据集名称并保存。`);
        }
      } else {
        // 显示普通成功消息
        setSuccessMessage(`成功解析 ${validData.length} 条数据，请输入数据集名称并保存`);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '导入数据时发生错误';
      setError(errorMessage);
    } finally {
      // 无论成功还是失败，都关闭加载状态
      setLoading(false);
    }
  };
  
  // 处理上传完成回调
  const handleUploadComplete = (file: File) => {
    // 直接处理上传完成的文件
    handleFileProcessed(file);
  };
  
  // 处理上传错误
  const handleUploadError = (error: Error) => {
    setError(`文件上传失败: ${error.message}`);
  };
  
  // 保存数据集
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
    
    // 如果提供了导入成功回调，则调用它
    if (onImportSuccess) {
      timeoutRef.current = setTimeout(() => {
        onImportSuccess();
      }, 2000);
    } else {
      // 否则2秒后导航到创建图表页面
      timeoutRef.current = setTimeout(() => {
        navigate('/create');
      }, 2000);
    }
  };

  // 处理文件大小检测
  const handleFileSizeCheck = (file: File) => {
    // 如果文件大于10MB，使用分片上传
    const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB
    if (file.size > LARGE_FILE_THRESHOLD) {
      setIsLargeFile(true);
      setShowChunkedUploader(true);
      return true;
    }
    return false;
  };

  // 处理常规文件上传
  const handleRegularFileUpload = (file: File) => {
    const fileName = file.name.toLowerCase();
    
    // 根据选择的格式或文件扩展名验证文件
    if (selectedFormat !== 'auto') {
      // 如果用户指定了格式，直接处理文件
      handleFileProcessed(file);
    } else if (fileName.endsWith('.json') || fileName.endsWith('.csv') || 
               fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // 自动检测模式下，验证文件扩展名
      handleFileProcessed(file);
    } else {
      setError('请上传支持的文件格式（JSON、CSV、Excel）');
    }
  };
  
  // 处理预览数据集
  const handlePreviewDataset = (dataset: ImportedDataset) => {
    setPreviewDataset(dataset);
    setShowPreview(true);
  };
  
  // 处理创建图表
  const handleCreateChart = (dataset: ImportedDataset) => {
    // 将选中的数据集保存到localStorage（保持向后兼容）
    localStorage.setItem('importedData', JSON.stringify(dataset.data));
    // 保存当前选中的数据集ID，以便在图表创建页面使用
    localStorage.setItem('selectedDatasetId', dataset.id);
    // 导航到创建图表页面
    navigate('/create');
  };
  
  // 处理删除数据集
  const handleDeleteDataset = (datasetId: string) => {
    // 显示确认对话框
    if (window.confirm('确定要删除这个数据集吗？此操作不可撤销。')) {
      // 调用store中的删除函数
      removeImportedDataset(datasetId);
      // 显示成功消息
      setSuccessMessage('数据集已成功删除');
      // 2秒后清除成功消息
      timeoutRef.current = setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
    }
  };
  
  // 关闭预览
  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewDataset(null);
  };

  // 切换上传模式
  const toggleUploadMode = () => {
    setShowChunkedUploader(!showChunkedUploader);
  };

  return (
    <div className={`${styles.container} ${styles[theme]}`}>
      {/* Loading 遮罩 */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
        </div>
      )}
      
      {/* 数据集预览模态框 */}
      {showPreview && previewDataset && (
        <div className={styles.previewModal}>
          <div className={`${styles.previewModalContent} ${styles[theme]}`}>
            <div className={styles.previewModalHeader}>
              <h3>{previewDataset.name}</h3>
              <button 
                className={styles.closeButton}
                onClick={handleClosePreview}
              >
                ×
              </button>
            </div>
            <div className={styles.previewModalBody}>
              {/* 数据表格预览 - 使用虚拟滚动 */}
              <div className={styles.dataTableContainer}>
                <VirtualizedTable 
                  data={previewDataset.data} 
                  height={400} 
                  showOutliers={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.header}>
        <h1>数据导入</h1>
        <p>上传您的数据文件，开始创建精美的图表</p>
      </div>
      
      {/* 主内容区域 */}
      <div className={styles.mainContent}>
        {/* 左侧：上传区域 */}
        <div className={styles.uploadSection}>
          <div className={`${styles.card} ${styles[theme]}`}>
            <h2 className={styles.cardTitle}>选择文件格式</h2>
            <div className={styles.formatRadioGroup}>
            <label className={`${styles.formatOption} ${selectedFormat === 'auto' ? styles.selected : ''}`}>
              <input
                type="radio"
                name="fileFormat"
                value="auto"
                checked={selectedFormat === 'auto'}
                onChange={() => setSelectedFormat('auto')}
              />
              <span>自动检测</span>
            </label>
            <label className={`${styles.formatOption} ${selectedFormat === 'json' ? styles.selected : ''}`}>
              <input
                type="radio"
                name="fileFormat"
                value="json"
                checked={selectedFormat === 'json'}
                onChange={() => setSelectedFormat('json')}
              />
              <span>JSON</span>
            </label>
            <label className={`${styles.formatOption} ${selectedFormat === 'csv' ? styles.selected : ''}`}>
              <input
                type="radio"
                name="fileFormat"
                value="csv"
                checked={selectedFormat === 'csv'}
                onChange={() => setSelectedFormat('csv')}
              />
              <span>CSV</span>
            </label>
            <label className={`${styles.formatOption} ${selectedFormat === 'excel' ? styles.selected : ''}`}>
              <input
                type="radio"
                name="fileFormat"
                value="excel"
                checked={selectedFormat === 'excel'}
                onChange={() => setSelectedFormat('excel')}
              />
              <span>Excel</span>
            </label>
          </div>
          
          {/* 异常值检测选项 */}
          <div className={styles.outlierDetectionOption}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={detectOutliers}
                onChange={(e) => setDetectOutliers(e.target.checked)}
              />
              <span>自动检测异常值</span>
            </label>
            <div className={styles.formatHelp}>
              {detectOutliers 
                ? '导入时将自动检测并标记数据中的异常值，帮助避免生成误导性图表' 
                : '关闭异常值检测，所有数据点将被视为正常值'}
            </div>
          </div>
            <p className={styles.formatHelp}>
              {selectedFormat === 'auto' && '系统将自动根据文件扩展名检测格式'}
              {selectedFormat === 'json' && 'JSON格式适用于结构化数据，支持嵌套属性'}
              {selectedFormat === 'csv' && 'CSV格式适用于表格数据，每行代表一条记录'}
              {selectedFormat === 'excel' && 'Excel格式支持.xlsx和.xls文件，将使用第一个工作表'}
            </p>
            
            <div className={uploadStyles.uploadModeToggle}>
              <button 
                className={`${styles.button} ${styles.small} ${showChunkedUploader ? styles.secondary : styles.primary}`}
                onClick={toggleUploadMode}
              >
                {showChunkedUploader ? '切换到普通上传' : '切换到分片上传'}
              </button>
              <div className={uploadStyles.uploadModeHint}>
                {showChunkedUploader ? 
                  '分片上传适用于大文件，支持断点续传和进度显示' : 
                  '普通上传适用于小文件，简单快捷'}
              </div>
            </div>
          </div>
          
          {/* 根据上传模式显示不同的上传组件 */}
          {showChunkedUploader ? (
            <ChunkedUploader 
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              accept=".json,.csv,.xlsx,.xls"
              chunkConfig={{
                chunkSize: 2 * 1024 * 1024, // 2MB
                concurrentUploads: 3,
                retryTimes: 3,
                retryDelay: 1000,
              }}
            />
          ) : (
            <div className={`${styles.card} ${styles[theme]}`}>
              <h2 className={styles.cardTitle}>上传文件</h2>
              <p className={uploadStyles.uploadHint}>
                支持 JSON、CSV、Excel 格式文件，文件大小将自动检测，超过10MB的文件会自动切换到分片上传模式
              </p>
              <label className={uploadStyles.regularUploadButton}>
                <input 
                  type="file" 
                  accept=".json,.csv,.xlsx,.xls"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const file = e.target.files[0];
                      // 检查文件大小，如果是大文件则切换到分片上传
                      if (handleFileSizeCheck(file)) {
                        return;
                      }
                      handleRegularFileUpload(file);
                    }
                  }}
                  style={{ display: 'none' }}
                />
                选择文件
              </label>
            </div>
          )}
          
          {/* 数据集名称输入 */}
          {parsedData && (
            <div className={`${styles.card} ${styles[theme]}`}>
              <h2 className={styles.cardTitle}>数据集信息</h2>
              <div className={styles.formGroup}>
                <label htmlFor="dataset-name" className={styles.label}>
                  数据集名称
                </label>
                <div className={styles.inputWithButton}>
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
              
              {/* 异常值摘要信息 */}
              {outliersSummary && outliersSummary.count > 0 && (
                <div className={styles.outlierSummary}>
                  <h3 className={styles.outlierTitle}>异常值检测结果</h3>
                  <div className={styles.outlierInfo}>
                    <p>检测到 <span className={styles.outlierCount}>{outliersSummary.count}</span> 个异常值 
                      (<span className={styles.outlierPercentage}>{outliersSummary.percentage.toFixed(1)}%</span>)，
                      使用方法: <span className={styles.outlierMethod}>{outliersSummary.method}</span>
                    </p>
                    <div className={styles.outlierList}>
                      {outliersSummary.outliers.map((outlier, index) => (
                        <div key={index} className={styles.outlierItem}>
                          <span className={styles.outlierName}>{outlier.name}</span>: 
                          <span className={styles.outlierValue}>{outlier.value}</span>
                          {outlier.reason && (
                            <span className={styles.outlierReason}> - {outlier.reason}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* 错误和成功提示 */}
          {error && (
            <div className={`${styles.message} ${styles.error} ${styles[theme]}`}>
              {error}
            </div>
          )}

          {successMessage && (
            <div className={`${styles.message} ${styles.success} ${styles[theme]}`}>
              {successMessage}
            </div>
          )}
        </div>
        
        {/* 右侧：数据集列表和格式示例 */}
        <div className={styles.infoSection}>
          {/* 已导入数据集列表 */}
          <div className={`${styles.card} ${styles[theme]}`}>
            <h2 className={styles.cardTitle}>已导入的数据集</h2>
            <div className={styles.datasetList}>
              {importedDatasets.length === 0 ? (
                <div className={styles.noDatasets}>暂无导入的数据集</div>
              ) : (
                importedDatasets.map(dataset => (
                  <div 
                    key={dataset.id}
                    className={`${styles.datasetCard} ${styles[theme]}`}
                  >
                    <div className={styles.datasetInfo}>
                      <div className={styles.datasetName}>
                        {dataset.name}
                      </div>
                      <div className={styles.datasetMeta}>
                        {dataset.data.length} 条数据 · {new Date(dataset.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className={styles.datasetActions}>
                      <button 
                        className={`${styles.button} ${styles.small} ${styles.secondary}`}
                        onClick={() => handlePreviewDataset(dataset)}
                      >
                        预览
                      </button>
                      <button 
                        className={`${styles.button} ${styles.small} ${styles.primary}`}
                        onClick={() => handleCreateChart(dataset)}
                      >
                        创建图表
                      </button>
                      <button 
                        className={`${styles.button} ${styles.small} ${styles.danger}`}
                        onClick={() => handleDeleteDataset(dataset.id)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* 支持的数据格式示例 */}
          <div className={`${styles.card} ${styles[theme]} ${styles.formatExamplesSection}`}>
            <h2 className={styles.cardTitle}>支持的数据格式</h2>
            
            <div className={styles.formatExampleTabs}>
              <button 
                className={`${styles.formatExampleTab} ${selectedFormat === 'json' ? styles.active : ''}`}
                onClick={() => setSelectedFormat('json')}
              >
                JSON
              </button>
              <button 
                className={`${styles.formatExampleTab} ${selectedFormat === 'csv' ? styles.active : ''}`}
                onClick={() => setSelectedFormat('csv')}
              >
                CSV
              </button>
              <button 
                className={`${styles.formatExampleTab} ${selectedFormat === 'excel' ? styles.active : ''}`}
                onClick={() => setSelectedFormat('excel')}
              >
                Excel
              </button>
            </div>
            
            <div className={styles.formatExampleContent}>
              {selectedFormat === 'json' && (
                <pre className={`${styles.codeBlock} ${styles[theme]}`}>
                  {`[
  { "id": "1", "name": "项目1", "value": 100 },
  { "id": "2", "name": "项目2", "value": 200 }
]`}
                </pre>
              )}
              
              {selectedFormat === 'csv' && (
                <pre className={`${styles.codeBlock} ${styles[theme]}`}>
                  {`id,name,value
1,项目1,100
2,项目2,200`}
                </pre>
              )}
              
              {selectedFormat === 'excel' && (
                <div className={styles.excelExample}>
                  <p>Excel文件应包含以下列：</p>
                  <ul>
                    <li>id/编号 - 数据项的唯一标识</li>
                    <li>name/名称 - 数据项的名称</li>
                    <li>value/值 - 数据项的数值</li>
                    <li>category/分类 (可选) - 数据项的分类</li>
                    <li>timestamp/时间 (可选) - 数据项的时间戳</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDataImport;