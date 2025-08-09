import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store';
import type { ChartConfig, ChartType, DataPoint } from '../types/chart';
import Chart from './Chart';
import styles from './ChartCreator.module.css';

interface ChartTypeOption {
  type: ChartType;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const ChartCreator: React.FC = () => {
  const { chartId } = useParams<{ chartId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, charts, addChart, updateChart, importedDatasets } = useAppStore();
  
  // 基础状态
  const [selectedChartType, setSelectedChartType] = useState<ChartType>(
    (searchParams.get('type') as ChartType) || 'bar'
  );
  const [title, setTitle] = useState('');
  const [data, setData] = useState<DataPoint[]>([]);
  const [dataSource, setDataSource] = useState<'sample' | 'imported' | string>('sample');
  // 固定宽度和高度
  const width = 600;
  const height = 400;
  
  // 样式状态
  const [backgroundColor, setBackgroundColor] = useState('');
  const [textColor, setTextColor] = useState('');
  const [barColor, setBarColor] = useState('#8884d8');
  const [lineColor, setLineColor] = useState('#8884d8');
  const [showLegend, setShowLegend] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  
  // 散点图特有状态
  const [xAxisName, setXAxisName] = useState('X轴');
  const [yAxisName, setYAxisName] = useState('Y轴');
  const [showBubble, setShowBubble] = useState(false);
  
  // 雷达图特有状态
  const [legendNames, setLegendNames] = useState<string[]>(['数据集1']);
  
  // 图表类型选项
  const chartTypeOptions: ChartTypeOption[] = [
    {
      type: 'bar',
      name: '柱状图',
      description: '用于比较不同类别的数据',
      icon: (
        <svg viewBox="0 0 24 24" className={styles.chartIcon}>
          <rect x="3" y="12" width="4" height="9" fill="currentColor" />
          <rect x="10" y="8" width="4" height="13" fill="currentColor" />
          <rect x="17" y="4" width="4" height="17" fill="currentColor" />
        </svg>
      )
    },
    {
      type: 'line',
      name: '折线图',
      description: '展示数据随时间的变化趋势',
      icon: (
        <svg viewBox="0 0 24 24" className={styles.chartIcon}>
          <polyline points="3,17 9,11 13,15 21,7" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="3" cy="17" r="2" fill="currentColor" />
          <circle cx="9" cy="11" r="2" fill="currentColor" />
          <circle cx="13" cy="15" r="2" fill="currentColor" />
          <circle cx="21" cy="7" r="2" fill="currentColor" />
        </svg>
      )
    },
    {
      type: 'pie',
      name: '饼图',
      description: '显示各部分占整体的比例',
      icon: (
        <svg viewBox="0 0 24 24" className={styles.chartIcon}>
          <path d="M12 2v10l8.66-5A10 10 0 0 0 12 2z" fill="currentColor" />
          <path d="M12 12v10a10 10 0 0 0 8.66-15L12 12z" fill="currentColor" opacity="0.7" />
          <path d="M12 12L3.34 7A10 10 0 0 0 12 22V12z" fill="currentColor" opacity="0.4" />
        </svg>
      )
    },
    {
      type: 'scatter',
      name: '散点图',
      description: '显示两个变量之间的关系',
      icon: (
        <svg viewBox="0 0 24 24" className={styles.chartIcon}>
          <circle cx="6" cy="18" r="2" fill="currentColor" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle cx="18" cy="6" r="2" fill="currentColor" />
          <circle cx="9" cy="8" r="1.5" fill="currentColor" opacity="0.7" />
          <circle cx="15" cy="16" r="1.5" fill="currentColor" opacity="0.7" />
        </svg>
      )
    },
    {
      type: 'radar',
      name: '雷达图',
      description: '多维数据的可视化展示',
      icon: (
        <svg viewBox="0 0 24 24" className={styles.chartIcon}>
          <polygon points="12,2 22,8.5 18,19 6,19 2,8.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <polygon points="12,6 18,10 16,16 8,16 6,10" fill="currentColor" opacity="0.3" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
        </svg>
      )
    }
  ];
  
  // 示例数据
  const sampleData: DataPoint[] = [
    { id: '1', name: '一月', value: 400, category: 'sales' },
    { id: '2', name: '二月', value: 300, category: 'sales' },
    { id: '3', name: '三月', value: 600, category: 'sales' },
    { id: '4', name: '四月', value: 800, category: 'sales' },
    { id: '5', name: '五月', value: 500, category: 'sales' },
  ];
  
  // 初始化时检查是否有选中的数据集ID
  useEffect(() => {
    // 只在初始化时执行一次，不在编辑模式下执行
    if (!chartId) {
      const selectedDatasetId = localStorage.getItem('selectedDatasetId');
      if (selectedDatasetId) {
        // 如果有选中的数据集ID，设置数据源为该数据集
        setDataSource(selectedDatasetId);
        // 清除选中的数据集ID，避免影响下次创建
        localStorage.removeItem('selectedDatasetId');
      }
    }
  }, [chartId]);

  // 加载数据
  useEffect(() => {
    if (dataSource === 'sample') {
      setData(sampleData);
    } else if (dataSource === 'imported') {
      const savedData = localStorage.getItem('importedData');
      if (savedData) {
        try {
          setData(JSON.parse(savedData));
        } catch (e) {
          console.error('Failed to parse imported data:', e);
          setData(sampleData);
        }
      } else {
        setData(sampleData);
      }
    } else {
      // 从数据集中加载
      const dataset = importedDatasets.find(d => d.id === dataSource);
      if (dataset) {
        setData(dataset.data);
      } else {
        setData(sampleData);
      }
    }
  }, [dataSource, importedDatasets]);
  
  // 加载现有图表数据（编辑模式）
  useEffect(() => {
    if (chartId) {
      const existingChart = charts.find(c => c.id === chartId);
      if (existingChart) {
        setTitle(existingChart.title);
        setSelectedChartType(existingChart.type);
        // 宽度和高度已固定，不再需要设置
        // 加载其他配置...
      }
    }
  }, [chartId, charts]);
  
  // 数据转换函数
  const convertToScatterData = (data: DataPoint[]) => {
    if (!Array.isArray(data) || data.length === 0) return [];
    if (data[0] && typeof data[0] === 'object' && 'x' in data[0] && 'y' in data[0]) {
      return data as any;
    }
    return data.map((item, index) => ({
      id: item.id,
      name: item.name,
      x: index + 1,
      y: item.value,
      z: showBubble ? Math.sqrt(item.value) * 5 : undefined
    }));
  };
  
  const convertToRadarData = (data: DataPoint[]) => {
    if (!Array.isArray(data) || data.length === 0) return [[]];
    if (Array.isArray(data[0]) || (data[0] && typeof data[0] === 'object' && 'subject' in data[0])) {
      return data as any;
    }
    const maxValue = Math.max(...data.map(d => d.value));
    return [data.map(item => ({
      subject: item.name,
      value: (item.value / maxValue) * 100,
      fullMark: 100
    }))];
  };
  
  // 保存图表
  const handleSave = () => {
    if (!title.trim()) {
      alert('请输入图表标题');
      return;
    }
    
    let chartConfig: ChartConfig;
    
    switch (selectedChartType) {
      case 'bar':
        chartConfig = {
          id: chartId || `chart-${Date.now()}`,
          type: 'bar',
          title,
          data,
          width,
          height,
          backgroundColor,
          textColor,
          barColor,
          showLegend,
          showGrid
        };
        break;
        
      case 'line':
        chartConfig = {
          id: chartId || `chart-${Date.now()}`,
          type: 'line',
          title,
          data,
          width,
          height,
          backgroundColor,
          textColor,
          lineColor,
          showLegend,
          showGrid
        };
        break;
        
      case 'pie':
        chartConfig = {
          id: chartId || `chart-${Date.now()}`,
          type: 'pie',
          title,
          data,
          width,
          height,
          backgroundColor,
          textColor,
          showLegend
        };
        break;
        
      case 'scatter':
        chartConfig = {
          id: chartId || `chart-${Date.now()}`,
          type: 'scatter',
          title,
          data: convertToScatterData(data),
          width,
          height,
          backgroundColor,
          textColor,
          xAxisName,
          yAxisName,
          showBubble,
          showLegend,
          showGrid
        };
        break;
        
      case 'radar':
        chartConfig = {
          id: chartId || `chart-${Date.now()}`,
          type: 'radar',
          title,
          data: convertToRadarData(data),
          width,
          height,
          backgroundColor,
          textColor,
          legendNames,
          showLegend
        };
        break;
        
      default:
        alert('不支持的图表类型');
        return;
    }
    
    if (chartId) {
      updateChart(chartId, chartConfig);
    } else {
      addChart(chartConfig);
    }
    
    navigate('/dashboard');
  };
  
  // 渲染图表预览
  const renderChartPreview = () => {
    let chartConfig: ChartConfig;
    
    switch (selectedChartType) {
      case 'bar':
        chartConfig = {
          id: 'preview',
          type: 'bar',
          title: title || '预览图表',
          data,
          width,
          height,
          backgroundColor,
          textColor,
          barColor,
          showLegend,
          showGrid
        };
        break;
        
      case 'line':
        chartConfig = {
          id: 'preview',
          type: 'line',
          title: title || '预览图表',
          data,
          width,
          height,
          backgroundColor,
          textColor,
          lineColor,
          showLegend,
          showGrid
        };
        break;
        
      case 'pie':
        chartConfig = {
          id: 'preview',
          type: 'pie',
          title: title || '预览图表',
          data,
          width,
          height,
          backgroundColor,
          textColor,
          showLegend
        };
        break;
        
      case 'scatter':
        chartConfig = {
          id: 'preview',
          type: 'scatter',
          title: title || '预览图表',
          data: convertToScatterData(data),
          width,
          height,
          backgroundColor,
          textColor,
          xAxisName,
          yAxisName,
          showBubble,
          showLegend,
          showGrid
        };
        break;
        
      case 'radar':
        chartConfig = {
          id: 'preview',
          type: 'radar',
          title: title || '预览图表',
          data: convertToRadarData(data),
          width,
          height,
          backgroundColor,
          textColor,
          legendNames,
          showLegend
        };
        break;
        
      default:
        return <div>请选择图表类型</div>;
    }
    
    return <Chart config={chartConfig} />;
  };
  
  return (
    <div className={`${styles.container} ${styles[theme]}`}>
      {/* 左侧图表类型选择面板 */}
      <div className={`${styles.chartTypePanel} ${styles[theme]}`}>
        <div className={styles.panelHeader}>
          <h2>选择图表类型</h2>
        </div>
        
        <div className={styles.chartTypeGrid}>
          {chartTypeOptions.map(option => (
            <div
              key={option.type}
              className={`${styles.chartTypeCard} ${
                selectedChartType === option.type ? styles.selected : ''
              }`}
              onClick={() => setSelectedChartType(option.type)}
            >
              <div className={styles.chartIconWrapper}>
                {option.icon}
              </div>
              <div className={styles.chartTypeInfo}>
                <h4>{option.name}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 中间编辑区域 */}
      <div className={`${styles.previewPanel} ${styles[theme]}`}>
        <div className={styles.previewHeader}>
          <h2>图表预览</h2>
          <div className={styles.previewActions}>
            <button
              onClick={handleSave}
              className={`${styles.button} ${styles.primaryButton}`}
            >
              保存图表
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className={`${styles.button} ${styles.secondaryButton} ${styles[theme]}`}
            >
              取消
            </button>
          </div>
        </div>
        
        <div className={`${styles.chartPreview} ${styles[theme]}`}>
          {renderChartPreview()}
        </div>
      </div>
      
      {/* 右侧配置面板 */}
      <div className={`${styles.configPanel} ${styles[theme]}`}>
        <div className={styles.panelHeader}>
          <h2>图表配置</h2>
        </div>
        
        <div className={styles.configContent}>
          {/* 基础配置 */}
          <div className={styles.configSection}>
            <h3>基础设置</h3>
            
            <div className={styles.formGroup}>
              <label>图表标题</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入图表标题"
                className={`${styles.input} ${styles[theme]}`}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>数据来源</label>
              <select
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value)}
                className={`${styles.select} ${styles[theme]}`}
              >
                <option value="sample">示例数据</option>
                <option value="imported" disabled={!localStorage.getItem('importedData')}>
                  导入的数据 {!localStorage.getItem('importedData') && '(无)'}
                </option>
                {importedDatasets.map(dataset => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name} ({dataset.data.length}条)
                  </option>
                ))}
              </select>
            </div>
            
            {/* 宽度和高度已固定，不再提供调整功能 */}
          </div>
          
          {/* 样式配置 */}
          <div className={styles.configSection}>
            <h3>样式设置</h3>
            
            <div className={styles.colorGroup}>
              <div className={styles.formGroup}>
                <label>背景颜色</label>
                <input
                  type="color"
                  value={backgroundColor || '#ffffff'}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className={styles.colorInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>文字颜色</label>
                <input
                  type="color"
                  value={textColor || '#000000'}
                  onChange={(e) => setTextColor(e.target.value)}
                  className={styles.colorInput}
                />
              </div>
            </div>
            
            {selectedChartType === 'bar' && (
              <div className={styles.formGroup}>
                <label>柱状图颜色</label>
                <input
                  type="color"
                  value={barColor}
                  onChange={(e) => setBarColor(e.target.value)}
                  className={styles.colorInput}
                />
              </div>
            )}
            
            {selectedChartType === 'line' && (
              <div className={styles.formGroup}>
                <label>折线颜色</label>
                <input
                  type="color"
                  value={lineColor}
                  onChange={(e) => setLineColor(e.target.value)}
                  className={styles.colorInput}
                />
              </div>
            )}
            
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={showLegend}
                  onChange={(e) => setShowLegend(e.target.checked)}
                />
                显示图例
              </label>
              
              {['bar', 'line', 'scatter'].includes(selectedChartType) && (
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                  />
                  显示网格
                </label>
              )}
            </div>
          </div>
          
          {/* 散点图特殊配置 */}
          {selectedChartType === 'scatter' && (
            <div className={styles.configSection}>
              <h3>散点图设置</h3>
              
              <div className={styles.axisGroup}>
                <div className={styles.formGroup}>
                  <label>X轴名称</label>
                  <input
                    type="text"
                    value={xAxisName}
                    onChange={(e) => setXAxisName(e.target.value)}
                    className={`${styles.input} ${styles[theme]}`}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Y轴名称</label>
                  <input
                    type="text"
                    value={yAxisName}
                    onChange={(e) => setYAxisName(e.target.value)}
                    className={`${styles.input} ${styles[theme]}`}
                  />
                </div>
              </div>
              
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={showBubble}
                  onChange={(e) => setShowBubble(e.target.checked)}
                />
                显示气泡大小
              </label>
            </div>
          )}
          
          {/* 雷达图特殊配置 */}
          {selectedChartType === 'radar' && (
            <div className={styles.configSection}>
              <h3>雷达图设置</h3>
              
              <div className={styles.formGroup}>
                <label>数据集名称 (逗号分隔)</label>
                <input
                  type="text"
                  value={legendNames.join(',')}
                  onChange={(e) => setLegendNames(
                    e.target.value.split(',').map(name => name.trim()).filter(name => name)
                  )}
                  placeholder="数据集1,数据集2"
                  className={`${styles.input} ${styles[theme]}`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartCreator;