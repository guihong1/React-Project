import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store';
import type { DataPoint } from '../types/chart.js';
import type { AIModel, ImportedDataset } from '../types';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';


// 分析类型定义
type AnalysisType = 'basic' | 'advanced' | 'business' | 'prediction' | 'anomaly' | 'correlation' | 'clustering';

// 分析类型选项
const analysisTypeOptions = [
  { value: 'basic', label: '基础分析' },
  { value: 'advanced', label: '高级分析' },
  { value: 'business', label: '业务洞察' },
  { value: 'prediction', label: '预测分析' },
  { value: 'anomaly', label: '异常检测' },
  { value: 'correlation', label: '相关性分析' },
  { value: 'clustering', label: '分类聚类' },
];

interface AIAnalysisProps {
  data?: DataPoint[];
}

// 定义CSS动画样式
const fadeInKeyframes = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ data }) => {
  const { theme, dashboards, aiModels, selectedAIModelId, importedDatasets } = useAppStore();
  
  // 创建一个ref用于导出PDF
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // 创建一个唯一的存储键，基于当前页面路径
  const storageKeyPrefix = 'aiAnalysis';
  const getStorageKey = (suffix: string) => `${storageKeyPrefix}_${suffix}`;
  
  // 使用useState并从localStorage初始化状态
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(() => {
    const saved = localStorage.getItem(getStorageKey('isAnalyzing'));
    return saved ? JSON.parse(saved) : false;
  });
  const [insights, setInsights] = useState<string[]>(() => {
    const saved = localStorage.getItem(getStorageKey('insights'));
    return saved ? JSON.parse(saved) : [];
  });
  const [error, setError] = useState<string | null>(() => {
    const saved = localStorage.getItem(getStorageKey('error'));
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedDataSource, setSelectedDataSource] = useState<string>(() => {
    const saved = localStorage.getItem(getStorageKey('selectedDataSource'));
    return saved ? JSON.parse(saved) : 'current';
  });
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<AnalysisType>(() => {
    const saved = localStorage.getItem(getStorageKey('selectedAnalysisType'));
    return saved ? JSON.parse(saved) : 'basic';
  });
  const [availableDataSources, setAvailableDataSources] = useState<{id: string, name: string, data: DataPoint[]}[]>([]);
  const [progress, setProgress] = useState<number>(() => {
    const saved = localStorage.getItem(getStorageKey('progress'));
    return saved ? JSON.parse(saved) : 0;
  });
  const [estimatedTime, setEstimatedTime] = useState<number>(() => {
    const saved = localStorage.getItem(getStorageKey('estimatedTime'));
    return saved ? JSON.parse(saved) : 0;
  });
  const [analysisStartTime, setAnalysisStartTime] = useState<number | null>(() => {
    const saved = localStorage.getItem(getStorageKey('analysisStartTime'));
    return saved ? JSON.parse(saved) : null;
  });
  const [analysisTime, setAnalysisTime] = useState<number | null>(() => {
    const saved = localStorage.getItem(getStorageKey('analysisTime'));
    return saved ? JSON.parse(saved) : null;
  });
  const [showSuccess, setShowSuccess] = useState<boolean>(() => {
    const saved = localStorage.getItem(getStorageKey('showSuccess'));
    return saved ? JSON.parse(saved) : false;
  });
  
  // 创建一个函数来保存状态到localStorage
  const saveStateToStorage = (key: string, value: any) => {
    localStorage.setItem(getStorageKey(key), JSON.stringify(value));
  };
  
  // 使用自定义的setState函数，同时更新localStorage
  const setIsAnalyzingWithStorage = (value: boolean | ((prevState: boolean) => boolean)) => {
    setIsAnalyzing(prevState => {
      const newValue = typeof value === 'function' ? value(prevState) : value;
      saveStateToStorage('isAnalyzing', newValue);
      return newValue;
    });
  };
  
  const setInsightsWithStorage = (value: string[] | ((prevState: string[]) => string[])) => {
    setInsights(prevState => {
      const newValue = typeof value === 'function' ? value(prevState) : value;
      saveStateToStorage('insights', newValue);
      return newValue;
    });
  };
  
  const setErrorWithStorage = (value: string | null | ((prevState: string | null) => string | null)) => {
    setError(prevState => {
      const newValue = typeof value === 'function' ? value(prevState) : value;
      saveStateToStorage('error', newValue);
      return newValue;
    });
  };
  
  const setSelectedDataSourceWithStorage = (value: string | ((prevState: string) => string)) => {
    setSelectedDataSource(prevState => {
      const newValue = typeof value === 'function' ? value(prevState) : value;
      saveStateToStorage('selectedDataSource', newValue);
      return newValue;
    });
  };
  
  const setSelectedAnalysisTypeWithStorage = (value: AnalysisType | ((prevState: AnalysisType) => AnalysisType)) => {
    setSelectedAnalysisType(prevState => {
      const newValue = typeof value === 'function' ? value(prevState) : value;
      saveStateToStorage('selectedAnalysisType', newValue);
      return newValue;
    });
  };
  
  const setProgressWithStorage = (value: number | ((prevState: number) => number)) => {
    setProgress(prevState => {
      const newValue = typeof value === 'function' ? value(prevState) : value;
      saveStateToStorage('progress', newValue);
      return newValue;
    });
  };
  
  const setEstimatedTimeWithStorage = (value: number | ((prevState: number) => number)) => {
    setEstimatedTime(prevState => {
      const newValue = typeof value === 'function' ? value(prevState) : value;
      saveStateToStorage('estimatedTime', newValue);
      return newValue;
    });
  };
  
  const setAnalysisStartTimeWithStorage = (value: number | null | ((prevState: number | null) => number | null)) => {
    setAnalysisStartTime(prevState => {
      const newValue = typeof value === 'function' ? value(prevState) : value;
      saveStateToStorage('analysisStartTime', newValue);
      return newValue;
    });
  };
  
  const setAnalysisTimeWithStorage = (value: number | null | ((prevState: number | null) => number | null)) => {
    setAnalysisTime(prevState => {
      const newValue = typeof value === 'function' ? value(prevState) : value;
      saveStateToStorage('analysisTime', newValue);
      return newValue;
    });
  };
  
  const setShowSuccessWithStorage = (value: boolean | ((prevState: boolean) => boolean)) => {
    setShowSuccess(prevState => {
      const newValue = typeof value === 'function' ? value(prevState) : value;
      saveStateToStorage('showSuccess', newValue);
      return newValue;
    });
  };
  
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
    
    // 添加导入的数据集
    importedDatasets.forEach(dataset => {
      if (dataset.data && dataset.data.length > 0) {
        sources.push({
          id: `dataset-${dataset.id}`,
          name: `数据集: ${dataset.name}`,
          data: dataset.data
        });
      }
    });
    
    setAvailableDataSources(sources);
    
    // 如果没有当前数据但有其他数据源，默认选择第一个
    if ((!data || data.length === 0) && sources.length > 0) {
      setSelectedDataSource(sources[0].id);
    }
  }, [data, dashboards, importedDatasets]);
  
  // 进度模拟效果
  useEffect(() => {
    let progressInterval: number | null = null;
    let timeInterval: number | null = null;
    let timeoutCheck: number | null = null;
    
    if (isAnalyzing) {
      // 如果已经有进度，说明是从localStorage恢复的状态，不需要重置
      if (progress === 0) {
        setProgressWithStorage(0);
        setEstimatedTimeWithStorage(15); // 初始估计时间15秒
        setAnalysisStartTimeWithStorage(Date.now());
      }
      
      // 添加超时检测，如果分析时间超过60秒，自动中断
      timeoutCheck = window.setTimeout(() => {
        if (isAnalyzing && progress < 100) {
          // 分析超时，自动中断
          setIsAnalyzingWithStorage(false);
          setErrorWithStorage('分析超时，请重试或选择其他数据源');
          setProgressWithStorage(0);
          setEstimatedTimeWithStorage(0);
        }
      }, 60000); // 60秒超时
      
      // 模拟进度增长
      progressInterval = window.setInterval(() => {
        setProgressWithStorage(prevProgress => {
          // 非线性进度增长，开始快，接近100%时变慢
          if (prevProgress < 30) return prevProgress + 2;
          if (prevProgress < 60) return prevProgress + 1;
          if (prevProgress < 85) return prevProgress + 0.5;
          if (prevProgress < 95) return prevProgress + 0.2;
          if (prevProgress < 99) return prevProgress + 0.1; // 确保进度能够继续增长
          return prevProgress;
        });
      }, 300);
      
      // 更新剩余时间
      timeInterval = window.setInterval(() => {
        setEstimatedTimeWithStorage(prevTime => {
          if (prevTime <= 1) return 1;
          return prevTime - 1;
        });
      }, 1000);
    } else {
      // 只有在明确结束分析时才重置这些值
      if (progress !== 100) { // 如果进度不是100%，说明不是正常完成的分析
        setProgressWithStorage(0);
        setEstimatedTimeWithStorage(0);
        setAnalysisStartTimeWithStorage(null);
      }
    }
    
    return () => {
      if (progressInterval) window.clearInterval(progressInterval);
      if (timeInterval) window.clearInterval(timeInterval);
      if (timeoutCheck) window.clearTimeout(timeoutCheck);
    };
  }, [isAnalyzing, progress, setProgressWithStorage, setEstimatedTimeWithStorage, setErrorWithStorage]);

  // 获取当前选中的AI模型
  const selectedModel = aiModels.find(model => model.id === selectedAIModelId);

  // 验证AI模型配置
  const validateAIModel = () => {
    if (!selectedModel) {
      setErrorWithStorage('请先选择一个AI模型');
      return false;
    }
    
    if (!selectedModel.apiKey) {
      setErrorWithStorage(`请先为 ${selectedModel.name} 配置API密钥`);
      return false;
    }
    
    return true;
  };

  // AI分析过程
  const analyzeData = async () => {
    // 获取选中的数据源
    const selectedSource = availableDataSources.find(source => source.id === selectedDataSource);
    const dataToAnalyze = selectedSource?.data;
    
    if (!dataToAnalyze || dataToAnalyze.length === 0) {
      setErrorWithStorage('没有可分析的数据');
      return;
    }

    // 验证AI模型配置
    if (!validateAIModel()) {
      return;
    }

    // 保存分析配置到localStorage，以便在页面刷新后恢复
    saveStateToStorage('selectedDataSourceData', dataToAnalyze);
    
    // 重置状态
    setIsAnalyzingWithStorage(true);
    setInsightsWithStorage([]);
    setErrorWithStorage(null); // 清除之前的错误信息
    setProgressWithStorage(0); // 确保从0开始
    setEstimatedTimeWithStorage(15); // 重置估计时间

    try {
      // 检查localStorage中是否已有此数据源和分析类型的分析结果
      const cacheKey = `${selectedDataSource}_${selectedAnalysisType}_results`;
      const cachedResults = localStorage.getItem(getStorageKey(cacheKey));
      
      if (cachedResults) {
        // 如果有缓存的结果，使用缓存结果但模拟分析过程
        const parsedResults = JSON.parse(cachedResults);
        
        // 模拟分析完成
        setTimeout(() => {
          // 计算分析耗时（使用缓存的时间或模拟时间）
          const cachedTime = localStorage.getItem(getStorageKey(`${cacheKey}_time`));
          const time = cachedTime ? JSON.parse(cachedTime) : 3; // 默认3秒
          
          setAnalysisTimeWithStorage(time);
          setProgressWithStorage(100);
          
          // 短暂延迟后显示结果
          setTimeout(() => {
            setInsightsWithStorage(parsedResults);
            setIsAnalyzingWithStorage(false);
            setShowSuccessWithStorage(true);
            
            // 5秒后自动隐藏成功提示
            setTimeout(() => {
              setShowSuccessWithStorage(false);
            }, 5000);
          }, 500);
        }, 2000); // 模拟2秒的分析时间
        
        return;
      }
      
      // 如果没有缓存结果，执行实际分析
      // 导入AI服务
      const { aiService } = await import('../services/ai');
      
      // 使用AI服务分析数据，传入选择的分析类型
      const generatedInsights = await aiService.analyzeData(selectedModel!, dataToAnalyze, selectedAnalysisType);
      
      // 如果AI分析失败或返回空结果，使用备用分析方法
      if (!generatedInsights || generatedInsights.length === 0) {
        const fallbackInsights = fallbackAnalysis(dataToAnalyze);
        setInsightsWithStorage(fallbackInsights);
        setErrorWithStorage('AI分析未返回结果，已使用备用分析方法');
        return;
      }
      
      // 计算分析耗时
      let time = 3; // 默认值
      if (analysisStartTime) {
        time = Math.round((Date.now() - analysisStartTime) / 1000);
        setAnalysisTimeWithStorage(time);
        console.log(`分析完成，耗时 ${time} 秒`);
      }
      
      // 缓存分析结果和耗时
      saveStateToStorage(`${selectedDataSource}_${selectedAnalysisType}_results`, generatedInsights);
      saveStateToStorage(`${selectedDataSource}_${selectedAnalysisType}_results_time`, time);
      
      // 设置进度为100%，表示完成
      setProgressWithStorage(100);
      
      // 短暂延迟后显示结果，让用户看到100%的进度
      setTimeout(() => {
        setInsightsWithStorage(generatedInsights);
        setIsAnalyzingWithStorage(false);
        setShowSuccessWithStorage(true);
        
        // 5秒后自动隐藏成功提示
        setTimeout(() => {
          setShowSuccessWithStorage(false);
        }, 5000);
      }, 500);
    } catch (error) {
      console.error('AI分析失败:', error);
      setErrorWithStorage(`AI分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
      
      // 使用备用分析方法
      const fallbackInsights = fallbackAnalysis(dataToAnalyze);
      setInsightsWithStorage(fallbackInsights);
      setIsAnalyzingWithStorage(false);
      
      // 确保重置进度和时间
      setProgressWithStorage(0);
      setEstimatedTimeWithStorage(0);
    }
  };
  
  // 清除分析缓存
  const clearAnalysisCache = () => {
    // 立即停止分析过程
    setIsAnalyzingWithStorage(false);
    
    // 清除所有分析相关的localStorage数据
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(storageKeyPrefix)) {
        localStorage.removeItem(key);
      }
    });
    
    // 重置所有状态
    setInsightsWithStorage([]);
    setErrorWithStorage(null);
    setProgressWithStorage(0);
    setEstimatedTimeWithStorage(0);
    setAnalysisStartTimeWithStorage(null);
    setAnalysisTimeWithStorage(null);
    setShowSuccessWithStorage(false);
    
    // 短暂延迟后显示提示信息
    setTimeout(() => {
      setErrorWithStorage('分析已取消，可以重新开始分析');
      // 3秒后自动清除提示
      setTimeout(() => {
        setErrorWithStorage(null);
      }, 3000);
    }, 100);
  };
  
  // 备用分析方法（当AI分析失败时使用）
  const fallbackAnalysis = (dataToAnalyze: DataPoint[]): string[] => {
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

    return generatedInsights;
  };

  // 导出为PDF格式
  const exportToPDF = async () => {
    if (!resultsRef.current || insights.length === 0) return;
    
    try {
      // 显示加载状态
      setErrorWithStorage('正在生成PDF，请稍候...');
      
      const content = resultsRef.current;
      const canvas = await html2canvas(content, {
        scale: 2, // 提高清晰度
        useCORS: true,
        logging: false,
        backgroundColor: theme === 'dark' ? '#333' : '#fff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // 计算宽高比
      const imgWidth = 210; // A4宽度(mm)
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      // 添加标题 - 使用图片方式渲染标题以避免中文乱码
      const titleImg = createTextImage('AI数据分析报告', 400, 40, 24, true);
      pdf.addImage(titleImg, 'PNG', 55, 10, 100, 10);
      
      // 添加数据源和分析类型信息 - 同样使用图片方式渲染
      const selectedSource = availableDataSources.find(source => source.id === selectedDataSource);
      const analysisTypeLabel = analysisTypeOptions.find(option => option.value === selectedAnalysisType)?.label;
      
      // 创建信息区域画布
      const infoCanvas = document.createElement('canvas');
      infoCanvas.width = 400;
      infoCanvas.height = 80;
      const infoCtx = infoCanvas.getContext('2d');
      if (infoCtx) {
        infoCtx.fillStyle = theme === 'dark' ? '#333' : '#fff';
        infoCtx.fillRect(0, 0, infoCanvas.width, infoCanvas.height);
        infoCtx.font = '14px Arial, SimSun, sans-serif';
        infoCtx.fillStyle = theme === 'dark' ? '#fff' : '#000';
        infoCtx.textAlign = 'left';
        infoCtx.fillText(`数据源: ${selectedSource?.name || '未知'}`, 10, 20);
        infoCtx.fillText(`分析类型: ${analysisTypeLabel || '未知'}`, 10, 40);
        infoCtx.fillText(`分析时间: ${new Date().toLocaleString()}`, 10, 60);
        const infoImg = infoCanvas.toDataURL('image/png');
        pdf.addImage(infoImg, 'PNG', 15, 25, 180, 20);
      }
      
      // 添加内容
      pdf.addImage(imgData, 'PNG', 0, 50, imgWidth, imgHeight);
      
      // 添加页脚 - 使用图片方式渲染
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        const footerImg = createTextImage(`第 ${i} 页，共 ${totalPages} 页`, 200, 20, 10);
        pdf.addImage(footerImg, 'PNG', 80, 285, 50, 5);
      }
      
      // 保存文件
      const fileName = `AI分析报告_${selectedAnalysisType}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);
      
      // 显示成功消息
      setErrorWithStorage('PDF导出成功！');
      setTimeout(() => setErrorWithStorage(null), 3000);
    } catch (error) {
      console.error('PDF导出失败:', error);
      setErrorWithStorage(`PDF导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setTimeout(() => setErrorWithStorage(null), 3000);
    }
  };
  
  // 辅助函数：创建带有中文文本的图片
  const createTextImage = (text: string, width: number, height: number, fontSize: number, isBold: boolean = false, align: string = 'center') => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    ctx.fillStyle = theme === 'dark' ? '#333' : '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.font = `${isBold ? 'bold ' : ''}${fontSize}px Arial, SimSun, sans-serif`;
    ctx.fillStyle = theme === 'dark' ? '#fff' : '#000';
    ctx.textAlign = align as CanvasTextAlign;
    
    const textX = align === 'center' ? width / 2 : align === 'right' ? width - 10 : 10;
    ctx.fillText(text, textX, height / 2 + fontSize / 3);
    
    return canvas.toDataURL('image/png');
  };
  
  // 导出为CSV格式
  const exportToCSV = () => {
    if (insights.length === 0) return;
    
    try {
      // 准备CSV内容
      let csvContent = '序号,分析结果\n';
      
      insights.forEach((insight, index) => {
        // 移除Markdown语法并处理CSV特殊字符
        const cleanedInsight = insight
          .replace(/[#*_`]/g, '') // 移除Markdown标记
          .replace(/\n/g, ' ') // 将换行替换为空格
          .replace(/"/g, '""'); // 处理CSV中的引号
        
        csvContent += `${index + 1},"${cleanedInsight}"\n`;
      });
      
      // 创建Blob并下载
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const fileName = `AI分析报告_${selectedAnalysisType}_${new Date().getTime()}.csv`;
      saveAs(blob, fileName);
      
      // 显示成功消息
      setErrorWithStorage('CSV导出成功！');
      setTimeout(() => setErrorWithStorage(null), 3000);
    } catch (error) {
      console.error('CSV导出失败:', error);
      setErrorWithStorage(`CSV导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setTimeout(() => setErrorWithStorage(null), 3000);
    }
  };
  
  // 导出为JSON格式
  const exportToJSON = () => {
    if (insights.length === 0) return;
    
    try {
      // 准备JSON内容
      const jsonData = {
        analysisType: selectedAnalysisType,
        analysisTime: analysisTime,
        timestamp: new Date().toISOString(),
        dataSource: availableDataSources.find(source => source.id === selectedDataSource)?.name || '未知',
        insights: insights
      };
      
      // 创建Blob并下载
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const fileName = `AI分析报告_${selectedAnalysisType}_${new Date().getTime()}.json`;
      saveAs(blob, fileName);
      
      // 显示成功消息
      setErrorWithStorage('JSON导出成功！');
      setTimeout(() => setErrorWithStorage(null), 3000);
    } catch (error) {
      console.error('JSON导出失败:', error);
      setErrorWithStorage(`JSON导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setTimeout(() => setErrorWithStorage(null), 3000);
    }
  };
  
  return (
    <>
      <style>{fadeInKeyframes}</style>
      <div style={{
      padding: '20px',
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f8f8f8',
      borderRadius: '8px',
      marginBottom: '20px',
      boxShadow: theme === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2 style={{ color: theme === 'dark' ? '#fff' : '#333', margin: 0 }}>
            AI 数据洞察
          </h2>

          {selectedModel && (
            <div style={{ 
              fontSize: '14px', 
              color: theme === 'dark' ? '#aaa' : '#666',
              marginTop: '5px'
            }}>
              使用模型: {selectedModel.name} ({selectedModel.provider})
              <Link 
                to="/ai-config" 
                style={{ 
                  marginLeft: '10px', 
                  color: '#646cff',
                  textDecoration: 'none'
                }}
              >
                配置
              </Link>
            </div>
          )}
          {error && (
            <div style={{
              marginTop: '10px',
              padding: '8px 12px',
              backgroundColor: theme === 'dark' ? '#3a2222' : '#fff8f8',
              color: theme === 'dark' ? '#ff9999' : '#d32f2f',
              borderRadius: '4px',
              fontSize: '14px',
              borderLeft: '4px solid #d32f2f'
            }}>
              {error}
            </div>
          )}
        </div>
        
        <div style={{ marginTop: '15px', marginBottom: '15px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: theme === 'dark' ? '#ddd' : '#555' }}>
              选择数据源:
            </label>
            <select
              value={selectedDataSource}
              onChange={(e) => setSelectedDataSourceWithStorage(e.target.value)}
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
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: theme === 'dark' ? '#ddd' : '#555' }}>
              分析类型:
            </label>
            <select
              value={selectedAnalysisType}
              onChange={(e) => setSelectedAnalysisTypeWithStorage(e.target.value as AnalysisType)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                backgroundColor: theme === 'dark' ? '#333' : '#fff',
                color: theme === 'dark' ? '#fff' : '#333',
                border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
              }}
            >
              {analysisTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={analyzeData}
            disabled={isAnalyzing || availableDataSources.length === 0}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#646cff',
              color: '#fff',
              cursor: isAnalyzing || availableDataSources.length === 0 ? 'not-allowed' : 'pointer',
              opacity: isAnalyzing || availableDataSources.length === 0 ? 0.7 : 1,
              minWidth: '120px',
              transition: 'all 0.3s ease',
            }}
          >
            {isAnalyzing ? `分析中 ${Math.round(progress)}%` : '分析数据'}
          </button>
          
          {insights.length > 0 && (
            <button
              onClick={clearAnalysisCache}
              disabled={isAnalyzing}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid #646cff',
                backgroundColor: 'transparent',
                color: theme === 'dark' ? '#fff' : '#646cff',
                cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                opacity: isAnalyzing ? 0.7 : 1,
                minWidth: '120px',
                transition: 'all 0.3s ease',
              }}
            >
              重新分析
            </button>
          )}
        </div>
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
      ) : isAnalyzing ? (
        <div style={{ 
          padding: '30px', 
          textAlign: 'center',
          color: theme === 'dark' ? '#ddd' : '#333',
          backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0',
          borderRadius: '4px',
        }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold',
              marginBottom: '15px',
              color: theme === 'dark' ? '#ddd' : '#333',
            }}>
              AI正在分析您的数据...
            </div>
            
            <div style={{ 
              width: '100%', 
              height: '8px', 
              backgroundColor: theme === 'dark' ? '#444' : '#e0e0e0',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '10px',
            }}>
              <div style={{ 
                width: `${progress}%`, 
                height: '100%', 
                backgroundColor: '#646cff',
                borderRadius: '4px',
                transition: 'width 0.3s ease-in-out',
              }} />
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              fontSize: '14px',
              color: theme === 'dark' ? '#aaa' : '#666',
            }}>
              <span>进度: {Math.round(progress)}%</span>
            </div>
          </div>
          
          <div style={{ 
            marginTop: '20px',
            fontSize: '14px',
            color: theme === 'dark' ? '#aaa' : '#666',
          }}>
            <p>AI正在思考中，请稍候...</p>
            <p style={{ fontSize: '13px', marginTop: '10px' }}>
              {[
                '正在分析数据趋势...',
                '正在识别数据模式...',
                '正在检测异常值...',
                '正在生成洞察...',
                '正在优化分析结果...',
              ][Math.floor((progress / 100) * 5) % 5]}
            </p>
          </div>
          
          <button
            onClick={clearAnalysisCache}
            style={{
              marginTop: '20px',
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #d32f2f',
              backgroundColor: 'transparent',
              color: theme === 'dark' ? '#ff9999' : '#d32f2f',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            取消分析
          </button>
        </div>
      ) : insights.length > 0 ? (
        <div 
          ref={resultsRef}
          style={{ 
            backgroundColor: theme === 'dark' ? '#333' : '#fff',
            borderRadius: '4px',
            padding: '15px',
          }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#eee'}`,
            paddingBottom: '10px',
            marginTop: 0,
          }}>
            <h3 style={{ 
              color: theme === 'dark' ? '#ddd' : '#444',
              margin: 0,
            }}>
              分析结果
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={exportToPDF}
                style={{
                  padding: '5px 10px',
                  borderRadius: '4px',
                  border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                  backgroundColor: theme === 'dark' ? '#444' : '#f5f5f5',
                  color: theme === 'dark' ? '#ddd' : '#333',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="导出为PDF"
              >
                <span style={{ fontSize: '14px' }}>📄</span> PDF
              </button>
              <button
                onClick={exportToCSV}
                style={{
                  padding: '5px 10px',
                  borderRadius: '4px',
                  border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                  backgroundColor: theme === 'dark' ? '#444' : '#f5f5f5',
                  color: theme === 'dark' ? '#ddd' : '#333',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="导出为CSV"
              >
                <span style={{ fontSize: '14px' }}>📊</span> CSV
              </button>
              <button
                onClick={exportToJSON}
                style={{
                  padding: '5px 10px',
                  borderRadius: '4px',
                  border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                  backgroundColor: theme === 'dark' ? '#444' : '#f5f5f5',
                  color: theme === 'dark' ? '#ddd' : '#333',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="导出为JSON"
              >
                <span style={{ fontSize: '14px' }}>{ }</span> JSON
              </button>
            </div>
          </div>
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
                <ReactMarkdown>
                  {insight}
                </ReactMarkdown>
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

      {showSuccess && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: theme === 'dark' ? '#2e7d32' : '#e8f5e9',
          color: theme === 'dark' ? '#fff' : '#2e7d32',
          padding: '12px 20px',
          borderRadius: '4px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          <div style={{ marginRight: '10px', fontSize: '18px' }}>✓</div>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>分析完成</div>
            <div style={{ fontSize: '13px' }}>
              {analysisTime !== null && `耗时 ${analysisTime} 秒`}
            </div>
          </div>
        </div>
      )}
      
      <div style={{ 
        marginTop: '15px',
        fontSize: '12px',
        color: theme === 'dark' ? '#888' : '#999',
        textAlign: 'center',
      }}>
        {selectedModel ? 
          `使用 ${selectedModel.name} 进行分析` : 
          '请在AI配置页面选择或配置AI模型'}
        {analysisTime !== null && !isAnalyzing && insights.length > 0 && 
          ` · 分析耗时 ${analysisTime} 秒`}
      </div>
    </div>
    </>
  );
};

export default AIAnalysis;