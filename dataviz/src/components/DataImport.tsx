import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import type { DataPoint } from '../types/chart';
import type { ImportedDataset } from '../types';
import { parseFileWithWorker } from '../utils/workerUtils';
import Chart from './Chart';
import VirtualizedTable from './common/VirtualizedTable';
import styles from './DataImport.module.css';

interface DataImportProps {
  onImportSuccess?: () => void;
}

type FileFormat = 'json' | 'csv' | 'excel' | 'auto';

export const DataImport: React.FC<DataImportProps> = ({ onImportSuccess }) => {
  const { theme, setError, setLoading, isLoading, error, importedDatasets, addImportedDataset } = useAppStore();
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');
  const [parsedData, setParsedData] = useState<DataPoint[] | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<FileFormat>('auto');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 预览数据集相关状态
  const [previewDataset, setPreviewDataset] = useState<ImportedDataset | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const processFile = async (file: File) => {
    // 清除之前的错误和成功消息
    setError(null);
    setSuccessMessage(null);
    // 设置加载状态
    setLoading(true);
    
    try {
      // 使用WebWorker解析文件数据
      const result = await parseFileWithWorker(file, selectedFormat);
      const validData = result.data;
      
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const fileName = file.name.toLowerCase();
      
      // 根据选择的格式或文件扩展名验证文件
      if (selectedFormat !== 'auto') {
        // 如果用户指定了格式，直接处理文件
        processFile(file);
      } else if (fileName.endsWith('.json') || fileName.endsWith('.csv') || 
                 fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // 自动检测模式下，验证文件扩展名
        processFile(file);
      } else {
        setError('请上传支持的文件格式（JSON、CSV、Excel）');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fileName = file.name.toLowerCase();
      
      // 根据选择的格式或文件扩展名验证文件
      if (selectedFormat !== 'auto') {
        // 如果用户指定了格式，直接处理文件
        processFile(file);
      } else if (fileName.endsWith('.json') || fileName.endsWith('.csv') || 
                 fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // 自动检测模式下，验证文件扩展名
        processFile(file);
      } else {
        setError('请上传支持的文件格式（JSON、CSV、Excel）');
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
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
  
  // 关闭预览
  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewDataset(null);
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
                />
              </div>
              
              {/* 图表预览 */}
              <div className={styles.chartPreview}>
                <h4>图表预览</h4>
                <Chart 
                  config={{
                    id: 'preview-chart',
                    title: previewDataset.name,
                    type: 'bar',
                    data: previewDataset.data.slice(0, 10),
                    width: 500,
                    height: 300
                  }}
                />
              </div>
              
              <div className={styles.previewActions}>
                <button 
                  className={`${styles.button} ${styles.primary}`}
                  onClick={() => {
                    handleClosePreview();
                    // 确保使用当前预览的数据集创建图表
                    handleCreateChart(previewDataset);
                  }}
                >
                  使用此数据集创建图表
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>数据导入</h1>
          <p>上传您的数据文件，开始创建精美的图表</p>
        </div>
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
            <p className={styles.formatHelp}>
              {selectedFormat === 'auto' && '系统将自动根据文件扩展名检测格式'}
              {selectedFormat === 'json' && 'JSON格式适用于结构化数据，支持嵌套属性'}
              {selectedFormat === 'csv' && 'CSV格式适用于表格数据，每行代表一条记录'}
              {selectedFormat === 'excel' && 'Excel格式支持.xlsx和.xls文件，将使用第一个工作表'}
            </p>
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
              {fileName ? `已导入: ${fileName}` : '拖拽文件到此处或点击上传'}
            </div>
            <div className={styles.uploadSubtext}>
              支持 JSON、CSV、Excel 格式文件
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,.csv,.xlsx,.xls"
              className={styles.fileInput}
            />
          </div>
          
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

export default DataImport;