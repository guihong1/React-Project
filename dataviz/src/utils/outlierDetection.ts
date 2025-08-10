/**
 * 异常值检测工具函数
 * 提供多种方法来检测数据中的异常值
 */
import type { DataPoint } from '../types/chart';

/**
 * 异常值检测结果接口
 */
export interface OutlierDetectionResult {
  isOutlier: boolean;      // 是否为异常值
  score: number;           // 异常程度分数
  threshold: number;       // 判定阈值
  method: string;          // 使用的检测方法
  reason?: string;         // 异常原因说明
}

/**
 * 带有异常值标记的数据点
 * 注意：此接口已移至types/chart.ts文件中
 * 这里保留导入以保持向后兼容性
 */
import type { DataPointWithOutlier } from '../types/chart';

/**
 * 异常值检测配置选项
 */
export interface OutlierDetectionOptions {
  method?: 'zscore' | 'iqr' | 'percentile' | 'auto'; // 检测方法
  threshold?: number;                               // 自定义阈值
  sensitivity?: number;                             // 灵敏度 (0-1)
}

/**
 * 使用Z-Score方法检测异常值
 * Z-Score表示数据点偏离平均值的标准差数量
 * @param data 数据点数组
 * @param threshold Z-Score阈值，默认为2.5
 * @returns 带有异常值标记的数据点数组
 */
export const detectOutliersWithZScore = (
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

/**
 * 使用IQR方法(四分位距法)检测异常值
 * IQR = Q3 - Q1，异常值通常定义为小于(Q1 - k*IQR)或大于(Q3 + k*IQR)的值
 * @param data 数据点数组
 * @param k IQR乘数，默认为1.5
 * @returns 带有异常值标记的数据点数组
 */
export const detectOutliersWithIQR = (
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

/**
 * 使用百分位法检测异常值
 * 将超出指定百分位范围的值视为异常值
 * @param data 数据点数组
 * @param lowerPercentile 下百分位，默认为5
 * @param upperPercentile 上百分位，默认为95
 * @returns 带有异常值标记的数据点数组
 */
export const detectOutliersWithPercentile = (
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

/**
 * 自动选择最适合的异常值检测方法
 * 根据数据分布特征选择合适的检测方法
 * @param data 数据点数组
 * @param options 检测选项
 * @returns 带有异常值标记的数据点数组
 */
export const detectOutliers = (
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

/**
 * 获取数据集中的所有异常值
 * @param data 带有异常值标记的数据点数组
 * @returns 异常值数据点数组
 */
export const getOutliers = (data: DataPointWithOutlier[]): DataPointWithOutlier[] => {
  return data.filter(item => item.outlier?.isOutlier);
};

/**
 * 获取异常值的摘要信息
 * @param data 带有异常值标记的数据点数组
 * @returns 异常值摘要信息
 */
export const getOutliersSummary = (data: DataPointWithOutlier[]): {
  count: number;
  percentage: number;
  method: string;
  outliers: Array<{ name: string; value: number; reason?: string }>;
} => {
  const outliers = getOutliers(data);
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