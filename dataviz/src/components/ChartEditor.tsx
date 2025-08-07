import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import type { ChartConfig, ChartType, DataPoint } from '../types/chart';
import styles from './ChartEditor.module.css';

interface ChartEditorProps {
  chartId?: string;
  initialChartType?: ChartType;
  onSave?: () => void;
  onCancel?: () => void;
}

export const ChartEditor: React.FC<ChartEditorProps> = ({ 
  chartId: propChartId,
  initialChartType,
  onSave, 
  onCancel 
}) => {
  const { chartId: paramChartId } = useParams<{ chartId: string }>();
  const chartId = propChartId || paramChartId;
  const navigate = useNavigate();
  const { theme, charts, addChart, updateChart } = useAppStore();
  const [title, setTitle] = useState('');
  const [chartType, setChartType] = useState<ChartType>(initialChartType || 'bar');
  const [data, setData] = useState<DataPoint[]>([]);
  const [dataSource, setDataSource] = useState<'sample' | 'imported' | string>('sample');
  const { importedDatasets } = useAppStore();
  // 固定宽度和高度
  const width = 600;
  const height = 300;
  
  // 样式相关状态
  const [backgroundColor, setBackgroundColor] = useState('');
  const [textColor, setTextColor] = useState('');
  const [barColor, setBarColor] = useState('#8884d8');
  const [lineColor, setLineColor] = useState('#8884d8');
  const [showLegend, setShowLegend] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  
  // 散点图特有状态
  const [xAxisName, setXAxisName] = useState('X');
  const [yAxisName, setYAxisName] = useState('Y');
  const [showBubble, setShowBubble] = useState(false);
  
  // 雷达图特有状态
  const [legendNames, setLegendNames] = useState<string[]>(['数据集1']);
  
  // 从localStorage加载导入的数据
  const loadImportedData = (): DataPoint[] => {
    const savedData = localStorage.getItem('importedData');
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error('Failed to parse imported data:', e);
      }
    }
    return [];
  };

  // 示例数据
  const sampleData: DataPoint[] = [
    { id: '1', name: '一月', value: 400, category: 'sales' },
    { id: '2', name: '二月', value: 300, category: 'sales' },
    { id: '3', name: '三月', value: 600, category: 'sales' },
    { id: '4', name: '四月', value: 800, category: 'sales' },
    { id: '5', name: '五月', value: 500, category: 'sales' },
  ];

  // 转换为散点图数据
  const convertToScatterData = (data: DataPoint[]) => {
    // 确保数据是DataPoint[]格式
    if (!Array.isArray(data) || data.length === 0) return [];
    
    // 检查是否已经是散点图数据格式
    if (data[0] && typeof data[0] === 'object' && 'x' in data[0] && 'y' in data[0]) {
      return data as any; // 已经是散点图格式，直接返回
    }
    
    return data.map((item, index) => ({
      id: item.id,
      name: item.name,
      x: index + 1, // 使用索引作为X轴
      y: item.value, // 使用值作为Y轴
      z: showBubble ? Math.sqrt(item.value) * 5 : undefined // 可选的气泡大小
    }));
  };

  // 转换为雷达图数据
  const convertToRadarData = (data: DataPoint[]) => {
    // 确保数据是DataPoint[]格式
    if (!Array.isArray(data) || data.length === 0) return [[]];
    
    // 检查是否已经是雷达图数据格式
    if (Array.isArray(data[0]) || (data[0] && typeof data[0] === 'object' && 'subject' in data[0])) {
      return data as any; // 已经是雷达图格式，直接返回
    }
    
    const maxValue = Math.max(...data.map(d => d.value));
    return [data.map(item => ({
      subject: item.name,
      value: item.value,
      fullMark: maxValue * 1.2 // 设置一个略高于最大值的满分值
    }))];
  };

  // 如果是编辑模式，加载现有图表数据
  useEffect(() => {
    if (chartId) {
      const chartToEdit = charts.find(chart => chart.id === chartId);
      if (chartToEdit) {
        setTitle(chartToEdit.title);
        setChartType(chartToEdit.type);
        
        // 对于雷达图和散点图，需要从原始数据源重新加载，而不是使用转换后的数据
        if (chartToEdit.type === 'radar' || chartToEdit.type === 'scatter') {
          // 尝试从导入数据或示例数据中恢复原始数据
          const importedData = loadImportedData();
          if (importedData.length > 0) {
            setData(importedData);
            setDataSource('imported');
          } else {
            setData(loadSampleData());
            setDataSource('sample');
          }
        } else {
          setData(chartToEdit.data);
          // 判断数据来源
          const importedData = loadImportedData();
          if (importedData.length > 0 && 
              JSON.stringify(chartToEdit.data) === JSON.stringify(importedData)) {
            setDataSource('imported');
          } else {
            setDataSource('sample');
          }
        }
        
        // 宽度和高度已固定，不再需要设置
        
        // 加载样式设置
        if (chartToEdit.backgroundColor) setBackgroundColor(chartToEdit.backgroundColor);
        if (chartToEdit.textColor) setTextColor(chartToEdit.textColor);
        if (chartToEdit.barColor) setBarColor(chartToEdit.barColor);
        if (chartToEdit.lineColor) setLineColor(chartToEdit.lineColor);
        if (chartToEdit.showLegend !== undefined) setShowLegend(chartToEdit.showLegend);
        if (chartToEdit.showGrid !== undefined) setShowGrid(chartToEdit.showGrid);
        
        // 加载散点图特有设置
        if (chartToEdit.type === 'scatter') {
          const scatterConfig = chartToEdit as any;
          if (scatterConfig.xAxisName) setXAxisName(scatterConfig.xAxisName);
          if (scatterConfig.yAxisName) setYAxisName(scatterConfig.yAxisName);
          if (scatterConfig.showBubble !== undefined) setShowBubble(scatterConfig.showBubble);
        }
        
        // 加载雷达图特有设置
        if (chartToEdit.type === 'radar') {
          const radarConfig = chartToEdit as any;
          if (radarConfig.legendNames) setLegendNames(radarConfig.legendNames);
        }
      }
    }
  }, [chartId, charts]);

  // 当数据源改变时更新数据
  useEffect(() => {
    if (dataSource === 'sample') {
      setData(sampleData);
    } else if (dataSource === 'imported') {
      // 向后兼容：从localStorage加载数据
      const importedData = loadImportedData();
      if (importedData.length > 0) {
        setData(importedData);
      }
    } else if (dataSource.startsWith('dataset-')) {
      // 从特定数据集加载数据
      const dataset = importedDatasets.find(ds => ds.id === dataSource);
      if (dataset) {
        setData(dataset.data);
      }
    }
  }, [dataSource, importedDatasets]);

  const handleSave = () => {
    // 验证表单
    if (!title.trim()) {
      alert('请输入图表标题');
      return;
    }

    let chartConfig: ChartConfig;
    
    switch (chartType) {
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
      // 编辑现有图表
      updateChart(chartId, chartConfig);
    } else {
      // 创建新图表
      addChart(chartConfig);
    }

    // 保存后导航到仪表板页面
    navigate('/dashboard');
  };

  return (
    <div className={`${styles.container} ${styles[theme]}`}>
      <div className={styles.header}>
        <h1>{chartId ? '编辑图表' : '创建新图表'}</h1>
        <p>配置您的图表参数，创建精美的数据可视化</p>
      </div>
      
      <div className={`${styles.formSection} ${styles[theme]}`}>
        <div className={styles.formGroup}>
          <label htmlFor="chart-title" className={styles.label}>
            图表标题
          </label>
          <input
            id="chart-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`${styles.input} ${styles[theme]}`}
            placeholder="输入图表标题"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="chart-type" className={styles.label}>
            图表类型
          </label>
          <select
            id="chart-type"
            value={chartType}
            onChange={(e) => setChartType(e.target.value as ChartType)}
            className={`${styles.select} ${styles[theme]}`}
        >
          <option value="bar">柱状图</option>
          <option value="line">折线图</option>
          <option value="pie">饼图</option>
          <option value="scatter">散点图</option>
          <option value="radar">雷达图</option>
        </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="data-source" className={styles.label}>
            数据来源
          </label>
          <select
            id="data-source"
            value={dataSource}
            onChange={(e) => setDataSource(e.target.value)}
            className={`${styles.select} ${styles[theme]}`}
          >
            <option value="sample">示例数据</option>
            
            {/* 向后兼容：显示localStorage中的导入数据 */}
            <option value="imported" disabled={!loadImportedData().length}>
              最近导入的数据 {!loadImportedData().length && '(未导入)'}
            </option>
            
            {/* 显示所有导入的数据集 */}
            {importedDatasets.length > 0 && (
              <optgroup label="已保存的数据集">
                {importedDatasets.map(dataset => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name} ({dataset.data.length}条数据)
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* 宽度和高度已固定，不再提供调整功能 */}
      </div>

      {/* 散点图特定配置 */}
      {chartType === 'scatter' && (
        <div className={`${styles.formSection} ${styles[theme]}`}>
          <h3 className={styles.sectionTitle}>散点图配置</h3>
          
          <div className={styles.flexRow}>
            <div className={styles.flexCol}>
              <label className={styles.label}>
                X轴名称:
              </label>
              <input
                type="text"
                value={xAxisName}
                onChange={(e) => setXAxisName(e.target.value)}
                className={`${styles.input} ${styles[theme]}`}
              />
            </div>
            <div className={styles.flexCol}>
              <label className={styles.label}>
                Y轴名称:
              </label>
              <input
                  type="text"
                  value={yAxisName}
                  onChange={(e) => setYAxisName(e.target.value)}
                  className={`${styles.input} ${styles[theme]}`}
               />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showBubble}
                onChange={(e) => setShowBubble(e.target.checked)}
                className={styles.checkbox}
              />
              显示气泡大小
            </label>
          </div>
        </div>
      )}

      {/* 雷达图特定配置 */}
      {chartType === 'radar' && (
        <div className={`${styles.formSection} ${styles[theme]}`}>
          <h3 className={styles.sectionTitle}>雷达图配置</h3>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>
              数据集名称 (用逗号分隔):
            </label>
            <input
              type="text"
              value={legendNames.join(',')}
              onChange={(e) => setLegendNames(e.target.value.split(',').map(name => name.trim()).filter(name => name))}
              className={`${styles.input} ${styles[theme]}`}
              placeholder="数据集1,数据集2,数据集3"
            />
          </div>
        </div>
      )}

      {/* 样式设置部分 */}
      <div className={`${styles.formSection} ${styles[theme]}`}>
        <h3 className={styles.sectionTitle}>图表样式设置</h3>
        
        <div className={styles.flexRow}>
          <div className={styles.flexCol}>
            <label 
              htmlFor="background-color" 
              className={styles.label}
            >
              背景颜色
            </label>
            <input
              id="background-color"
              type="color"
              value={backgroundColor || '#ffffff'}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className={`${styles.colorInput} ${styles[theme]}`}
            />
          </div>
          <div className={styles.flexCol}>
            <label 
              htmlFor="text-color" 
              className={styles.label}
            >
              文字颜色
            </label>
            <input
              id="text-color"
              type="color"
              value={textColor || '#000000'}
              onChange={(e) => setTextColor(e.target.value)}
              className={`${styles.colorInput} ${styles[theme]}`}
            />
          </div>
        </div>
        
        {chartType === 'bar' && (
          <div className={styles.formGroup}>
            <label 
              htmlFor="bar-color" 
              className={styles.label}
            >
              柱状图颜色
            </label>
            <input
              id="bar-color"
              type="color"
              value={barColor}
              onChange={(e) => setBarColor(e.target.value)}
              className={`${styles.colorInput} ${styles[theme]}`}
            />
          </div>
        )}
        
        {chartType === 'line' && (
          <div className={styles.formGroup}>
            <label 
              htmlFor="line-color" 
              className={styles.label}
            >
              折线图颜色
            </label>
            <input
              id="line-color"
              type="color"
              value={lineColor}
              onChange={(e) => setLineColor(e.target.value)}
              className={`${styles.colorInput} ${styles[theme]}`}
            />
          </div>
        )}
        
        <div className={styles.flexRow}>
          <div className={styles.flexCol}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showLegend}
                onChange={(e) => setShowLegend(e.target.checked)}
                className={styles.checkbox}
              />
              显示图例
            </label>
          </div>
          <div className={styles.flexCol}>
             <label className={styles.checkboxLabel}>
               <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className={styles.checkbox}
              />
              显示网格
            </label>
          </div>
        </div>
      </div>

      <div className={styles.buttonGroup}>
        {onCancel && (
          <button
            onClick={onCancel}
            className={`${styles.button} ${styles.cancelButton} ${styles[theme]}`}
          >
            取消
          </button>
        )}
        <button
          onClick={handleSave}
          className={`${styles.button} ${styles.saveButton}`}
        >
          保存
        </button>
      </div>
    </div>
  );
};

export default ChartEditor;