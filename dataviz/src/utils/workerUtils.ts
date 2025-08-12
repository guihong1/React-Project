/**
 * WebWorker工具函数
 * 用于在React组件中方便地使用WebWorker
 */

/**
 * 创建一个WebWorker实例
 * @param workerFunction Worker函数或URL
 * @returns WebWorker实例
 */
export const createWorker = (workerFunction: (() => void) | string): Worker => {
  if (typeof workerFunction === 'function') {
    // 将函数转换为Blob URL
    const functionStr = workerFunction.toString();
    const blob = new Blob([`(${functionStr})()`], { type: 'application/javascript' });
    return new Worker(URL.createObjectURL(blob));
  } else if (typeof workerFunction === 'string') {
    // 直接使用URL创建Worker
    return new Worker(workerFunction);
  }
  
  throw new Error('无效的Worker函数或URL');
};

/**
 * 使用WebWorker解析数据文件
 * @param file 要解析的文件
 * @param format 文件格式
 * @param detectOutliers 是否检测异常值
 * @param outlierOptions 异常值检测选项
 * @returns Promise，解析成功后返回数据
 */
export const parseFileWithWorker = (file: File, format: 'json' | 'csv' | 'excel' | 'auto', detectOutliers: boolean = false, outlierOptions?: Record<string, unknown>): Promise<{ data: unknown[]; summary?: unknown }> => {
  return new Promise((resolve, reject) => {
    // 创建Worker
    const worker = new Worker(new URL('../workers/dataProcessingWorker.ts', import.meta.url));
    
    // 监听Worker消息
    worker.onmessage = (event) => {
      const { type, data, error, summary } = event.data;
      
      if (type === 'error') {
        reject(new Error(error));
        worker.terminate();
      } else if (type === 'parseResult') {
        resolve({ data, summary });
        worker.terminate();
      }
    };
    
    // 监听Worker错误
    worker.onerror = (error) => {
      reject(new Error(`Worker错误: ${error.message}`));
      worker.terminate();
    };
    
    // 添加超时处理
    const timeoutId = setTimeout(() => {
      reject(new Error('文件解析超时'));
      worker.terminate();
    }, 30000); // 30秒超时
    
    // 根据文件类型处理
    const fileReader = new FileReader();
    
    fileReader.onload = (e) => {
      clearTimeout(timeoutId);
      const result = e.target?.result;
      if (!result) {
        reject(new Error('文件读取失败'));
        worker.terminate();
        return;
      }
      
      // 确定文件类型
      let fileType = format;
      if (format === 'auto') {
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.json')) {
          fileType = 'json';
        } else if (fileName.endsWith('.csv')) {
          fileType = 'csv';
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
          fileType = 'excel';
        } else {
          reject(new Error('不支持的文件格式'));
          worker.terminate();
          return;
        }
      }
      
      // 发送数据到Worker进行处理
      if (fileType === 'json') {
        worker.postMessage({
          type: 'parseJson',
          data: result.toString(),
          options: { detectOutliers, outlierOptions }
        });
      } else if (fileType === 'csv') {
        worker.postMessage({
          type: 'parseCsv',
          data: result.toString(),
          options: { detectOutliers, outlierOptions }
        });
      } else if (fileType === 'excel') {
        // Excel文件需要特殊处理，目前Worker中不支持直接解析Excel
        // 可以考虑在主线程中解析后再发送到Worker进行异常值检测
        reject(new Error('Excel文件解析暂不支持，请转换为CSV格式'));
        worker.terminate();
        return;
      }
    };
    
    fileReader.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('文件读取失败'));
      worker.terminate();
    };
    
    // 根据文件类型选择读取方式
    try {
      if (format === 'excel' || (format === 'auto' && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')))) {
        fileReader.readAsArrayBuffer(file);
      } else {
        fileReader.readAsText(file);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      reject(new Error(`文件读取启动失败: ${error instanceof Error ? error.message : String(error)}`));
      worker.terminate();
    }
  });
};

/**
 * 使用WebWorker检测异常值
 * @param data 数据点数组
 * @param options 异常值检测选项
 * @returns Promise，检测完成后返回带有异常值标记的数据
 */
export const detectOutliersWithWorker = (data: unknown[], options?: Record<string, unknown>): Promise<{ data: unknown[]; summary?: unknown }> => {
  return new Promise((resolve, reject) => {
    // 创建Worker
    const worker = new Worker(new URL('../workers/dataProcessingWorker.ts', import.meta.url));
    
    // 监听Worker消息
    worker.onmessage = (event) => {
      const { type, data, error, summary } = event.data;
      
      if (type === 'error') {
        reject(new Error(error));
        worker.terminate();
      } else if (type === 'outlierResult') {
        resolve({ data, summary });
        worker.terminate();
      }
    };
    
    // 监听Worker错误
    worker.onerror = (error) => {
      reject(new Error(`Worker错误: ${error.message}`));
      worker.terminate();
    };
    
    // 发送数据到Worker进行处理
    worker.postMessage({
      type: 'detectOutliers',
      data,
      options
    });
  });
};