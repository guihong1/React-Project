/**
 * 数据处理WebWorker
 * 用于在后台线程中处理数据解析和异常值检测
 */

// 由于WebWorker中不能直接导入模块，我们需要在这里重新实现必要的函数
// 或者使用importScripts来加载外部脚本

// 定义数据点接口
interface DataPoint {
  id: string;
  name: string;
  value: number;
  category?: string;
  timestamp?: string;
}

// 异常值检测结果接口
interface OutlierDetectionResult {
  isOutlier: boolean;      // 是否为异常值
  score: number;           // 异常程度分数
  threshold: number;       // 判定阈值
  method: string;          // 使用的检测方法
  reason?: string;         // 异常原因说明
}

// 带有异常值标记的数据点
interface DataPointWithOutlier extends DataPoint {
  outlier?: OutlierDetectionResult;
}

// 异常值检测配置选项
interface OutlierDetectionOptions {
  method?: 'zscore' | 'iqr' | 'percentile' | 'auto'; // 检测方法
  threshold?: number;                               // 自定义阈值
  sensitivity?: number;                             // 灵敏度 (0-1)
}

// 使用Z-Score方法检测异常值
const detectOutliersWithZScore = (
  data: DataPoint[], 
  threshold: number = 2.5
): DataPointWithOutlier[] => {
  // 计算平均值
  const values = data.map(item => item.value);
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  // 计算标准差
  const stdDev = Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length
  );
  
  // 如果标准差接近0，说明数据几乎没有变化，返回原始数据
  if (stdDev < 0.0001) {
    return data.map(item => ({
      ...item,
      outlier: {
        isOutlier: false,
        score: 0,
        threshold,
        method: 'zscore'
      }
    }));
  }
  
  // 计算每个数据点的Z-Score并标记异常值
  return data.map(item => {
    const zScore = Math.abs((item.value - avg) / stdDev);
    const isOutlier = zScore > threshold;
    
    return {
      ...item,
      outlier: {
        isOutlier,
        score: zScore,
        threshold,
        method: 'zscore',
        reason: isOutlier ? `Z-Score (${zScore.toFixed(2)}) 超过阈值 ${threshold}` : undefined
      }
    };
  });
};

// 使用IQR方法(四分位距法)检测异常值
const detectOutliersWithIQR = (
  data: DataPoint[], 
  k: number = 1.5
): DataPointWithOutlier[] => {
  // 获取所有值并排序
  const sortedValues = [...data.map(item => item.value)].sort((a, b) => a - b);
  const len = sortedValues.length;
  
  // 计算四分位数
  const q1Index = Math.floor(len * 0.25);
  const q3Index = Math.floor(len * 0.75);
  const q1 = sortedValues[q1Index];
  const q3 = sortedValues[q3Index];
  const iqr = q3 - q1;
  
  // 计算上下界限
  const lowerBound = q1 - k * iqr;
  const upperBound = q3 + k * iqr;
  
  // 标记异常值
  return data.map(item => {
    const value = item.value;
    const isOutlier = value < lowerBound || value > upperBound;
    
    // 计算异常程度分数 - 与边界的距离除以IQR
    let score = 0;
    if (value < lowerBound) {
      score = Math.abs((lowerBound - value) / iqr);
    } else if (value > upperBound) {
      score = Math.abs((value - upperBound) / iqr);
    }
    
    return {
      ...item,
      outlier: {
        isOutlier,
        score,
        threshold: k,
        method: 'iqr',
        reason: isOutlier 
          ? value < lowerBound 
            ? `值 ${value} 小于下界 ${lowerBound.toFixed(2)}` 
            : `值 ${value} 大于上界 ${upperBound.toFixed(2)}`
          : undefined
      }
    };
  });
};

// 使用百分位法检测异常值
const detectOutliersWithPercentile = (
  data: DataPoint[], 
  lowerPercentile: number = 5, 
  upperPercentile: number = 95
): DataPointWithOutlier[] => {
  // 获取所有值并排序
  const sortedValues = [...data.map(item => item.value)].sort((a, b) => a - b);
  const len = sortedValues.length;
  
  // 计算百分位值
  const lowerIndex = Math.floor(len * lowerPercentile / 100);
  const upperIndex = Math.floor(len * upperPercentile / 100);
  const lowerBound = sortedValues[lowerIndex];
  const upperBound = sortedValues[upperIndex];
  const range = upperBound - lowerBound;
  
  // 标记异常值
  return data.map(item => {
    const value = item.value;
    const isOutlier = value < lowerBound || value > upperBound;
    
    // 计算异常程度分数
    let score = 0;
    if (range > 0) {
      if (value < lowerBound) {
        score = Math.abs((lowerBound - value) / range);
      } else if (value > upperBound) {
        score = Math.abs((value - upperBound) / range);
      }
    }
    
    return {
      ...item,
      outlier: {
        isOutlier,
        score,
        threshold: Math.max(lowerPercentile, 100 - upperPercentile) / 100,
        method: 'percentile',
        reason: isOutlier 
          ? value < lowerBound 
            ? `值 ${value} 低于第 ${lowerPercentile} 百分位 (${lowerBound.toFixed(2)})` 
            : `值 ${value} 高于第 ${upperPercentile} 百分位 (${upperBound.toFixed(2)})`
          : undefined
      }
    };
  });
};

// 自动选择最适合的异常值检测方法
const detectOutliers = (
  data: DataPoint[], 
  options: OutlierDetectionOptions = {}
): DataPointWithOutlier[] => {
  const { method = 'auto', threshold, sensitivity = 0.7 } = options;
  
  // 数据量太少，不进行异常值检测
  if (data.length < 5) {
    return data.map(item => ({
      ...item,
      outlier: {
        isOutlier: false,
        score: 0,
        threshold: 0,
        method: 'none',
        reason: '数据量不足，无法进行异常值检测'
      }
    }));
  }
  
  // 根据指定方法检测异常值
  if (method === 'zscore') {
    // 调整Z-Score阈值，灵敏度越高，阈值越低
    const zScoreThreshold = threshold || (3 - sensitivity * 1.5);
    return detectOutliersWithZScore(data, zScoreThreshold);
  } else if (method === 'iqr') {
    // 调整IQR乘数，灵敏度越高，乘数越低
    const iqrMultiplier = threshold || (1.5 - sensitivity * 0.5);
    return detectOutliersWithIQR(data, iqrMultiplier);
  } else if (method === 'percentile') {
    // 调整百分位范围，灵敏度越高，范围越窄
    const lowerPercentile = 10 - sensitivity * 9;
    const upperPercentile = 90 + sensitivity * 9;
    return detectOutliersWithPercentile(data, lowerPercentile, upperPercentile);
  }
  
  // 自动选择方法
  // 计算数据的偏度来决定使用哪种方法
  const values = data.map(item => item.value);
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length
  );
  
  // 计算偏度
  const skewness = values.reduce((sum, val) => 
    sum + Math.pow((val - avg) / stdDev, 3), 0) / values.length;
  
  // 根据偏度选择方法
  // 高偏度（非正态分布）使用IQR方法
  // 低偏度（接近正态分布）使用Z-Score方法
  if (Math.abs(skewness) > 1) {
    const iqrMultiplier = threshold || (1.5 - sensitivity * 0.5);
    return detectOutliersWithIQR(data, iqrMultiplier);
  } else {
    const zScoreThreshold = threshold || (3 - sensitivity * 1.5);
    return detectOutliersWithZScore(data, zScoreThreshold);
  }
};

// 获取异常值的摘要信息
const getOutliersSummary = (data: DataPointWithOutlier[]): {
  count: number;
  percentage: number;
  method: string;
  outliers: Array<{ name: string; value: number; reason?: string }>;
} => {
  const outliers = data.filter(item => item.outlier?.isOutlier);
  const method = outliers.length > 0 ? outliers[0].outlier?.method || 'unknown' : 'none';
  
  return {
    count: outliers.length,
    percentage: data.length > 0 ? (outliers.length / data.length) * 100 : 0,
    method,
    outliers: outliers.map(item => ({
      name: item.name,
      value: item.value,
      reason: item.outlier?.reason
    }))
  };
};

// 验证并转换数据为DataPoint格式
const validateAndTransformData = (data: unknown[]): DataPoint[] => {
  // 首先检查数据是否为空
  if (!data || data.length === 0) {
    throw new Error('导入的数据为空');
  }
  
  // 检查第一条数据的结构，确定字段映射
  const firstItem = data[0];
  const fieldMap = determineFieldMapping(firstItem);
  
  // 转换数据
  const transformedData = data.map((item, index) => {
    const dataPoint: DataPoint = {
      id: String(item[fieldMap.id] || `item-${index + 1}`),
      name: String(item[fieldMap.name] || `项目${index + 1}`),
      value: Number(item[fieldMap.value] || 0)
    };
    
    // 添加可选字段
    if (fieldMap.category && item[fieldMap.category]) {
      dataPoint.category = String(item[fieldMap.category]);
    }
    
    if (fieldMap.timestamp && item[fieldMap.timestamp]) {
      dataPoint.timestamp = String(item[fieldMap.timestamp]);
    }
    
    return dataPoint;
  });
  
  // 验证转换后的数据
  const validData = transformedData.filter(item => {
    return (
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.value === 'number' && !isNaN(item.value)
    );
  });
  
  if (validData.length === 0) {
    throw new Error('导入的数据格式不正确，无法提取有效的id、name和value字段');
  }
  
  return validData;
};

// 确定字段映射关系
const determineFieldMapping = (item: Record<string, unknown>) => {
  const fieldMap: {
    id: string;
    name: string;
    value: string;
    category?: string;
    timestamp?: string;
  } = {
    id: '',
    name: '',
    value: ''
  };
  
  // 尝试匹配字段
  const keys = Object.keys(item);
  
  // ID字段匹配
  const idField = keys.find(key => 
    /^(id|ID|编号|序号)$/.test(key)
  );
  fieldMap.id = idField || keys[0]; // 如果没找到，使用第一个字段
  
  // 名称字段匹配
  const nameField = keys.find(key => 
    /^(name|名称|标题|项目|项目名称|label)$/.test(key)
  );
  fieldMap.name = nameField || (keys.length > 1 ? keys[1] : keys[0]); // 如果没找到，使用第二个字段或第一个字段
  
  // 值字段匹配
  const valueField = keys.find(key => 
    /^(value|值|数值|数量|金额|count|amount)$/.test(key)
  );
  fieldMap.value = valueField || keys.find(key => typeof item[key] === 'number') || (keys.length > 2 ? keys[2] : keys[0]);
  
  // 分类字段匹配（可选）
  const categoryField = keys.find(key => 
    /^(category|分类|类别|type|类型)$/.test(key)
  );
  if (categoryField) {
    fieldMap.category = categoryField;
  }
  
  // 时间戳字段匹配（可选）
  const timestampField = keys.find(key => 
    /^(timestamp|时间戳|日期|date|time|时间)$/.test(key)
  );
  if (timestampField) {
    fieldMap.timestamp = timestampField;
  }
  
  return fieldMap;
};

// 解析JSON文件
const parseJsonData = (jsonString: string): DataPoint[] => {
  try {
    const data: unknown = JSON.parse(jsonString);
    
    if (!Array.isArray(data)) {
      throw new Error('导入的JSON数据必须是数组格式');
    }
    
    return validateAndTransformData(data);
  } catch (err) {
    throw new Error(`JSON解析错误: ${err instanceof Error ? err.message : '未知错误'}`);
  }
};

// 解析CSV数据
const parseCsvData = (csvString: string): DataPoint[] => {
  try {
    // 简单的CSV解析实现
    const lines = csvString.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // 跳过空行
      
      const values = lines[i].split(',');
      const item: Record<string, unknown> = {};
      
      for (let j = 0; j < headers.length; j++) {
        const value = values[j]?.trim() || '';
        // 尝试将数值字符串转换为数字
        item[headers[j]] = isNaN(Number(value)) ? value : Number(value);
      }
      
      data.push(item);
    }
    
    return validateAndTransformData(data);
  } catch (err) {
    throw new Error(`CSV解析错误: ${err instanceof Error ? err.message : '未知错误'}`);
  }
};

// 监听主线程消息
self.addEventListener('message', (event) => {
  try {
    const { type, data, options } = event.data;
    
    switch (type) {
      case 'parseJson': {
        const jsonData = parseJsonData(data);
        if (options?.detectOutliers) {
          const dataWithOutliers = detectOutliers(jsonData, options.outlierOptions);
          const summary = getOutliersSummary(dataWithOutliers);
          self.postMessage({ type: 'parseResult', data: dataWithOutliers, summary });
        } else {
          self.postMessage({ type: 'parseResult', data: jsonData });
        }
        break;
      }
        
      case 'parseCsv': {
        const csvData = parseCsvData(data);
        if (options?.detectOutliers) {
          const dataWithOutliers = detectOutliers(csvData, options.outlierOptions);
          const summary = getOutliersSummary(dataWithOutliers);
          self.postMessage({ type: 'parseResult', data: dataWithOutliers, summary });
        } else {
          self.postMessage({ type: 'parseResult', data: csvData });
        }
        break;
      }
        
      case 'detectOutliers': {
        const dataWithOutliers = detectOutliers(data, options);
        const summary = getOutliersSummary(dataWithOutliers);
        self.postMessage({ type: 'outlierResult', data: dataWithOutliers, summary });
        break;
      }
        
      default:
        throw new Error(`未知的操作类型: ${type}`);
    }
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : '未知错误' 
    });
  }
});

// 通知主线程worker已准备就绪
self.postMessage({ type: 'ready' });