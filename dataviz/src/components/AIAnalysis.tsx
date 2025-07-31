import React, { useState } from 'react';
import { useAppStore } from '../store';
import type { DataPoint } from '../types/chart.js';

interface AIAnalysisProps {
  data?: DataPoint[];
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ data }) => {
  const { theme, dashboards } = useAppStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<string>('current');
  const [availableDataSources, setAvailableDataSources] = useState<{id: string, name: string, data: DataPoint[]}[]>([]);
  
  // 初始化可用数据源
  React.useEffect(() => {
    const sources: {id: string, name: string, data: DataPoint[]}[] = [];
    
    // 添加当前数据（如果有）
    if (data && data.length > 0) {
      sources.push({
        id: 'current',
        name: '当前数据',
        data: data
      });
    }
    
    // 添加所有仪表板中的图表数据
    dashboards?.forEach(dashboard => {
      dashboard.charts?.forEach(chart => {
        if (chart.data && chart.data.length > 0) {
          sources.push({
            id: `${dashboard.id}-${chart.id}`,
            name: `${dashboard.title} - ${chart.title}`,
            data: chart.data
          });
        }
      });
    });
    
    setAvailableDataSources(sources);
    
    // 如果没有当前数据但有其他数据源，默认选择第一个
    if ((!data || data.length === 0) && sources.length > 0) {
      setSelectedDataSource(sources[0].id);
    }
  }, [data, dashboards]);

  // 模拟AI分析过程
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

    // 模拟API调用延迟
    setTimeout(() => {
      // 获取选中的数据源
      const selectedSource = availableDataSources.find(source => source.id === selectedDataSource);
      const dataToAnalyze = selectedSource?.data;
      
      // 简单的数据分析逻辑
      const totalValue = dataToAnalyze.reduce((sum, item) => sum + item.value, 0);
      const avgValue = totalValue / dataToAnalyze.length;
      const maxValue = Math.max(...dataToAnalyze.map(item => item.value));
      const minValue = Math.min(...dataToAnalyze.map(item => item.value));
      const maxItem = dataToAnalyze.find(item => item.value === maxValue);
      const minItem = dataToAnalyze.find(item => item.value === minValue);

      // 生成洞察
      const generatedInsights = [
        `数据总数: ${dataToAnalyze.length} 条`,
        `总值: ${totalValue}`,
        `平均值: ${avgValue.toFixed(2)}`,
        `最大值: ${maxValue} (${maxItem?.name})`,
        `最小值: ${minValue} (${minItem?.name})`,
      ];

      // 添加趋势分析（简化版）
      if (dataToAnalyze.length > 2) {
        const firstValue = dataToAnalyze[0].value;
        const lastValue = dataToAnalyze[dataToAnalyze.length - 1].value;
        const change = ((lastValue - firstValue) / firstValue) * 100;
        
        if (change > 0) {
          generatedInsights.push(`从 ${dataToAnalyze[0].name} 到 ${dataToAnalyze[dataToAnalyze.length - 1].name} 增长了 ${change.toFixed(2)}%`);
        } else if (change < 0) {
          generatedInsights.push(`从 ${dataToAnalyze[0].name} 到 ${dataToAnalyze[dataToAnalyze.length - 1].name} 下降了 ${Math.abs(change).toFixed(2)}%`);
        } else {
          generatedInsights.push(`从 ${dataToAnalyze[0].name} 到 ${dataToAnalyze[dataToAnalyze.length - 1].name} 没有变化`);
        }
      }

      // 检测异常值（简化版）
      const stdDev = Math.sqrt(
        dataToAnalyze.reduce((sum, item) => sum + Math.pow(item.value - avgValue, 2), 0) / dataToAnalyze.length
      );
      
      const outliers = dataToAnalyze.filter(item => 
        Math.abs(item.value - avgValue) > stdDev * 2
      );
      
      if (outliers.length > 0) {
        generatedInsights.push(
          `检测到 ${outliers.length} 个异常值: ${outliers.map(item => `${item.name} (${item.value})`).join(', ')}`
        );
      }

      setInsights(generatedInsights);
      setIsAnalyzing(false);
    }, 1500); // 模拟分析延迟
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f8f8f8',
      borderRadius: '8px',
      marginBottom: '20px',
      boxShadow: theme === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: theme === 'dark' ? '#fff' : '#333', margin: 0 }}>
          AI 数据洞察
        </h2>
        
        <div style={{ marginTop: '15px', marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: theme === 'dark' ? '#ddd' : '#555' }}>
            选择数据源:
          </label>
          <select
            value={selectedDataSource}
            onChange={(e) => setSelectedDataSource(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              backgroundColor: theme === 'dark' ? '#333' : '#fff',
              color: theme === 'dark' ? '#fff' : '#333',
              border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
            }}
          >
            {availableDataSources.length === 0 ? (
              <option value="">没有可用的数据源</option>
            ) : (
              availableDataSources.map(source => (
                <option key={source.id} value={source.id}>
                  {source.name} ({source.data.length}条数据)
                </option>
              ))
            )}
          </select>
        </div>
        <button
          onClick={analyzeData}
          disabled={isAnalyzing || !data || data.length === 0}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: '#646cff',
            color: '#fff',
            cursor: isAnalyzing || !data || data.length === 0 ? 'not-allowed' : 'pointer',
            opacity: isAnalyzing || !data || data.length === 0 ? 0.7 : 1,
          }}
        >
          {isAnalyzing ? '分析中...' : '分析数据'}
        </button>
      </div>

      {availableDataSources.length === 0 ? (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          color: theme === 'dark' ? '#aaa' : '#666',
          backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0',
          borderRadius: '4px',
        }}>
          <p>暂无数据可分析</p>
          <p>请先导入数据或选择图表</p>
        </div>
      ) : insights.length > 0 ? (
        <div style={{ 
          backgroundColor: theme === 'dark' ? '#333' : '#fff',
          borderRadius: '4px',
          padding: '15px',
        }}>
          <h3 style={{ 
            color: theme === 'dark' ? '#ddd' : '#444',
            borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#eee'}`,
            paddingBottom: '10px',
            marginTop: 0,
          }}>
            分析结果
          </h3>
          <ul style={{ 
            listStyleType: 'none',
            padding: 0,
            margin: 0,
          }}>
            {insights.map((insight, index) => (
              <li 
                key={index}
                style={{
                  padding: '10px',
                  borderBottom: index < insights.length - 1 ? `1px solid ${theme === 'dark' ? '#444' : '#f0f0f0'}` : 'none',
                  color: theme === 'dark' ? '#ddd' : '#333',
                }}
              >
                {insight}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div style={{ 
          padding: '30px', 
          textAlign: 'center',
          color: theme === 'dark' ? '#aaa' : '#666',
          backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0',
          borderRadius: '4px',
        }}>
          <p>点击"分析数据"按钮开始AI分析</p>
        </div>
      )}

      <div style={{ 
        marginTop: '15px',
        fontSize: '12px',
        color: theme === 'dark' ? '#888' : '#999',
        textAlign: 'center',
      }}>
        注: 当前为模拟AI分析，实际项目中可集成OpenAI、通义千问或文心一言API
      </div>
    </div>
  );
};

export default AIAnalysis;