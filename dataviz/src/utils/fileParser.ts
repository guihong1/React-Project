import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { DataPoint } from '../types';

/**
 * 解析不同格式的数据文件
 * @param file 要解析的文件
 * @param format 指定的文件格式，如果为'auto'则自动检测
 * @returns 解析后的数据点数组
 */
export const parseDataFile = async (file: File, format: 'json' | 'csv' | 'excel' | 'auto' = 'auto'): Promise<DataPoint[]> => {
  // 如果指定了格式，则使用指定的格式
  const fileType = format === 'auto' ? getFileType(file) : format;
  
  switch (fileType) {
    case 'json':
      return parseJsonFile(file);
    case 'csv':
      return parseCsvFile(file);
    case 'excel':
      return parseExcelFile(file);
    default:
      throw new Error(`不支持的文件格式: ${file.name}`);
  }
};

/**
 * 获取文件类型
 * @param file 文件对象
 * @returns 文件类型
 */
const getFileType = (file: File): 'json' | 'csv' | 'excel' | 'unknown' => {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.json')) {
    return 'json';
  } else if (fileName.endsWith('.csv')) {
    return 'csv';
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return 'excel';
  }
  
  return 'unknown';
};

/**
 * 解析JSON文件
 * @param file JSON文件
 * @returns 解析后的数据点数组
 */
const parseJsonFile = async (file: File): Promise<DataPoint[]> => {
  const text = await file.text();
  const data = JSON.parse(text);
  
  if (!Array.isArray(data)) {
    throw new Error('导入的JSON数据必须是数组格式');
  }
  
  return validateAndTransformData(data);
};

/**
 * 解析CSV文件
 * @param file CSV文件
 * @returns 解析后的数据点数组
 */
const parseCsvFile = async (file: File): Promise<DataPoint[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        try {
          if (results.errors && results.errors.length > 0) {
            reject(new Error(`CSV解析错误: ${results.errors[0].message}`));
            return;
          }
          
          const data = results.data;
          resolve(validateAndTransformData(data));
        } catch (err) {
          reject(err);
        }
      },
      error: (error) => {
        reject(new Error(`CSV解析错误: ${error.message}`));
      }
    });
  });
};

/**
 * 解析Excel文件
 * @param file Excel文件
 * @returns 解析后的数据点数组
 */
const parseExcelFile = async (file: File): Promise<DataPoint[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('无法读取Excel文件'));
          return;
        }
        
        // 使用正确的类型处理Excel数据
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // 将Excel数据转换为JSON，启用表头
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });
        
        // 如果第一行是表头，则移除它
        if (jsonData.length > 0 && typeof jsonData[0] === 'object') {
          // 检查第一行是否包含字符串值（可能是表头）
          const firstRow = jsonData[0] as Record<string, any>;
          const hasHeaderRow = Object.values(firstRow).some(value => 
            typeof value === 'string' && isNaN(Number(value))
          );
          
          if (hasHeaderRow) {
            // 移除表头行，从第二行开始处理数据
            const dataWithoutHeader = jsonData.slice(1);
            resolve(validateAndTransformData(dataWithoutHeader));
            return;
          }
        }
        
        resolve(validateAndTransformData(jsonData));
      } catch (err) {
        reject(new Error(`Excel解析错误: ${err instanceof Error ? err.message : '未知错误'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('读取Excel文件时发生错误'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * 验证并转换数据为DataPoint格式
 * @param data 原始数据
 * @returns 验证并转换后的数据点数组
 */
const validateAndTransformData = (data: any[]): DataPoint[] => {
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

/**
 * 确定字段映射关系
 * @param item 数据项
 * @returns 字段映射
 */
const determineFieldMapping = (item: any) => {
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