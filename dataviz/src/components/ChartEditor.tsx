import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import type { ChartConfig, ChartType, DataPoint } from '../types/chart';

interface ChartEditorProps {
  onSave?: () => void;
  onCancel?: () => void;
}

export const ChartEditor: React.FC<ChartEditorProps> = ({ 
  onSave, 
  onCancel 
}) => {
  const { chartId } = useParams<{ chartId: string }>();
  const navigate = useNavigate();
  const { theme, charts, addChart, updateChart } = useAppStore();
  const [title, setTitle] = useState('');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [data, setData] = useState<DataPoint[]>([]);
  const [dataSource, setDataSource] = useState<'sample' | 'imported' | string>('sample');
  const { importedDatasets } = useAppStore();
  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(300);
  
  // 样式相关状态
  const [backgroundColor, setBackgroundColor] = useState('');
  const [textColor, setTextColor] = useState('');
  const [barColor, setBarColor] = useState('#8884d8');
  const [lineColor, setLineColor] = useState('#8884d8');
  const [showLegend, setShowLegend] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  
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

  // 如果是编辑模式，加载现有图表数据
  useEffect(() => {
    if (chartId) {
      const chartToEdit = charts.find(chart => chart.id === chartId);
      if (chartToEdit) {
        setTitle(chartToEdit.title);
        setChartType(chartToEdit.type);
        setData(chartToEdit.data);
        setWidth(chartToEdit.width || 600);
        setHeight(chartToEdit.height || 300);
        
        // 加载样式设置
        if (chartToEdit.backgroundColor) setBackgroundColor(chartToEdit.backgroundColor);
        if (chartToEdit.textColor) setTextColor(chartToEdit.textColor);
        if (chartToEdit.barColor) setBarColor(chartToEdit.barColor);
        if (chartToEdit.lineColor) setLineColor(chartToEdit.lineColor);
        if (chartToEdit.showLegend !== undefined) setShowLegend(chartToEdit.showLegend);
        if (chartToEdit.showGrid !== undefined) setShowGrid(chartToEdit.showGrid);
        
        // 判断数据来源
        const importedData = loadImportedData();
        if (importedData.length > 0 && 
            JSON.stringify(chartToEdit.data) === JSON.stringify(importedData)) {
          setDataSource('imported');
        } else {
          setDataSource('sample');
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

    const chartConfig: ChartConfig = {
      id: chartId || `chart-${Date.now()}`,
      title,
      type: chartType,
      data,
      width,
      height,
      // 样式属性
      backgroundColor,
      textColor,
      barColor: chartType === 'bar' ? barColor : undefined,
      lineColor: chartType === 'line' ? lineColor : undefined,
      showLegend,
      showGrid
    };

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
    <div style={{
      padding: '20px',
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f8f8f8',
      borderRadius: '8px',
      marginBottom: '20px',
      boxShadow: theme === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
    }}>
      <h2 style={{ color: theme === 'dark' ? '#fff' : '#333', marginBottom: '15px' }}>
        {chartId ? '编辑图表' : '创建新图表'}
      </h2>
      
      <div style={{ marginBottom: '15px' }}>
        <label 
          htmlFor="chart-title" 
          style={{ 
            display: 'block', 
            marginBottom: '5px',
            color: theme === 'dark' ? '#ddd' : '#555'
          }}
        >
          图表标题
        </label>
        <input
          id="chart-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
            backgroundColor: theme === 'dark' ? '#333' : '#fff',
            color: theme === 'dark' ? '#fff' : '#333',
          }}
          placeholder="输入图表标题"
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label 
          htmlFor="chart-type" 
          style={{ 
            display: 'block', 
            marginBottom: '5px',
            color: theme === 'dark' ? '#ddd' : '#555'
          }}
        >
          图表类型
        </label>
        <select
          id="chart-type"
          value={chartType}
          onChange={(e) => setChartType(e.target.value as ChartType)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
            backgroundColor: theme === 'dark' ? '#333' : '#fff',
            color: theme === 'dark' ? '#fff' : '#333',
          }}
        >
          <option value="bar">柱状图</option>
          <option value="line">折线图</option>
          <option value="pie">饼图</option>
        </select>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label 
          htmlFor="data-source" 
          style={{ 
            display: 'block', 
            marginBottom: '5px',
            color: theme === 'dark' ? '#ddd' : '#555'
          }}
        >
          数据来源
        </label>
        <select
          id="data-source"
          value={dataSource}
          onChange={(e) => setDataSource(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
            backgroundColor: theme === 'dark' ? '#333' : '#fff',
            color: theme === 'dark' ? '#fff' : '#333',
          }}
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

      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <div style={{ flex: 1 }}>
          <label 
            htmlFor="chart-width" 
            style={{ 
              display: 'block', 
              marginBottom: '5px',
              color: theme === 'dark' ? '#ddd' : '#555'
            }}
          >
            宽度
          </label>
          <input
            id="chart-width"
            type="number"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
              backgroundColor: theme === 'dark' ? '#333' : '#fff',
              color: theme === 'dark' ? '#fff' : '#333',
            }}
            min="200"
            max="1200"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label 
            htmlFor="chart-height" 
            style={{ 
              display: 'block', 
              marginBottom: '5px',
              color: theme === 'dark' ? '#ddd' : '#555'
            }}
          >
            高度
          </label>
          <input
            id="chart-height"
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
              backgroundColor: theme === 'dark' ? '#333' : '#fff',
              color: theme === 'dark' ? '#fff' : '#333',
            }}
            min="200"
            max="800"
          />
        </div>
      </div>

      {/* 样式设置部分 */}
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ color: theme === 'dark' ? '#ddd' : '#555', marginBottom: '10px' }}>图表样式设置</h3>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <div style={{ flex: 1 }}>
            <label 
              htmlFor="background-color" 
              style={{ 
                display: 'block', 
                marginBottom: '5px',
                color: theme === 'dark' ? '#ddd' : '#555'
              }}
            >
              背景颜色
            </label>
            <input
              id="background-color"
              type="color"
              value={backgroundColor || '#ffffff'}
              onChange={(e) => setBackgroundColor(e.target.value)}
              style={{
                width: '100%',
                padding: '2px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                backgroundColor: theme === 'dark' ? '#333' : '#fff',
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label 
              htmlFor="text-color" 
              style={{ 
                display: 'block', 
                marginBottom: '5px',
                color: theme === 'dark' ? '#ddd' : '#555'
              }}
            >
              文字颜色
            </label>
            <input
              id="text-color"
              type="color"
              value={textColor || '#000000'}
              onChange={(e) => setTextColor(e.target.value)}
              style={{
                width: '100%',
                padding: '2px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                backgroundColor: theme === 'dark' ? '#333' : '#fff',
              }}
            />
          </div>
        </div>
        
        {chartType === 'bar' && (
          <div style={{ marginBottom: '10px' }}>
            <label 
              htmlFor="bar-color" 
              style={{ 
                display: 'block', 
                marginBottom: '5px',
                color: theme === 'dark' ? '#ddd' : '#555'
              }}
            >
              柱状图颜色
            </label>
            <input
              id="bar-color"
              type="color"
              value={barColor}
              onChange={(e) => setBarColor(e.target.value)}
              style={{
                width: '100%',
                padding: '2px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                backgroundColor: theme === 'dark' ? '#333' : '#fff',
              }}
            />
          </div>
        )}
        
        {chartType === 'line' && (
          <div style={{ marginBottom: '10px' }}>
            <label 
              htmlFor="line-color" 
              style={{ 
                display: 'block', 
                marginBottom: '5px',
                color: theme === 'dark' ? '#ddd' : '#555'
              }}
            >
              折线图颜色
            </label>
            <input
              id="line-color"
              type="color"
              value={lineColor}
              onChange={(e) => setLineColor(e.target.value)}
              style={{
                width: '100%',
                padding: '2px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                backgroundColor: theme === 'dark' ? '#333' : '#fff',
              }}
            />
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center',
              color: theme === 'dark' ? '#ddd' : '#555'
            }}>
              <input
                type="checkbox"
                checked={showLegend}
                onChange={(e) => setShowLegend(e.target.checked)}
                style={{ marginRight: '5px' }}
              />
              显示图例
            </label>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center',
              color: theme === 'dark' ? '#ddd' : '#555'
            }}>
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                style={{ marginRight: '5px' }}
              />
              显示网格
            </label>
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '20px'
      }}>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: theme === 'dark' ? '#555' : '#e0e0e0',
              color: theme === 'dark' ? '#fff' : '#333',
              cursor: 'pointer',
            }}
          >
            取消
          </button>
        )}
        <button
          onClick={handleSave}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: '#646cff',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          保存
        </button>
      </div>
    </div>
  );
};

export default ChartEditor;