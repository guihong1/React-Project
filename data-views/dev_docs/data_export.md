# 数据导出功能开发文档

## 功能概述

为DataViz平台添加数据导出功能，使用户能够将可视化图表和原始数据导出为多种格式，包括CSV、Excel、PDF和图片格式。该功能将提升数据共享和报告生成能力，使用户能够在其他应用程序中使用和分享数据可视化结果。

## 需求分析

### 功能需求

1. **导出格式支持**
   - CSV格式：导出原始数据
   - Excel格式：导出带格式的数据表格
   - PDF格式：导出图表和数据报告
   - PNG/JPG图片：导出图表图像
   - SVG矢量图：导出高质量可缩放图表

2. **导出内容选项**
   - 单个图表导出
   - 多图表批量导出
   - 完整仪表板导出
   - 仅数据导出（无图表）
   - 仅图表导出（无原始数据）

3. **导出配置选项**
   - 自定义文件名
   - 选择导出字段
   - 设置图表尺寸和分辨率
   - 添加页眉/页脚（PDF）
   - 设置导出主题（亮色/暗色）

4. **用户体验**
   - 导出进度指示
   - 导出历史记录
   - 批量导出队列
   - 导出预览

### 用户场景

1. 数据分析师需要将分析结果导出为Excel进行进一步处理
2. 业务用户需要将图表导出为PNG图片插入到演示文稿中
3. 管理者需要生成包含多个图表的PDF报告
4. 开发人员需要导出SVG格式的图表用于网站集成

## 技术方案

### 技术选型

1. **CSV/Excel导出**
   - [SheetJS (xlsx)](https://github.com/SheetJS/sheetjs)：处理Excel文件格式
   - [csv-stringify](https://github.com/adaltas/node-csv/tree/master/packages/csv-stringify)：生成CSV格式数据

2. **PDF导出**
   - [jsPDF](https://github.com/MrRio/jsPDF)：生成PDF文档
   - [html2canvas](https://github.com/niklasvh/html2canvas)：将HTML元素转换为canvas

3. **图片导出**
   - [html2canvas](https://github.com/niklasvh/html2canvas)：将图表转换为canvas
   - [FileSaver.js](https://github.com/eligrey/FileSaver.js)：客户端文件保存

4. **SVG导出**
   - 使用Recharts内置的SVG导出功能
   - [svg-crowbar](https://github.com/NYTimes/svg-crowbar)：提取和下载SVG

### 数据结构设计

```typescript
// 导出格式类型
type ExportFormat = 'csv' | 'excel' | 'pdf' | 'png' | 'jpg' | 'svg';

// 导出配置接口
interface ExportConfig {
  format: ExportFormat;           // 导出格式
  fileName?: string;             // 自定义文件名
  includeData?: boolean;         // 是否包含原始数据
  includeChart?: boolean;        // 是否包含图表
  selectedFields?: string[];     // 选择导出的字段
  chartSize?: {                  // 图表尺寸
    width: number;
    height: number;
  };
  theme?: 'light' | 'dark';      // 导出主题
  quality?: number;              // 图片质量 (0-1)
  pdfOptions?: {                 // PDF特定选项
    pageSize?: 'A4' | 'A3' | 'letter' | 'legal';
    orientation?: 'portrait' | 'landscape';
    header?: string;             // 页眉内容
    footer?: string;             // 页脚内容
    margins?: {                  // 页边距
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
}

// 导出历史记录
interface ExportHistory {
  id: string;                    // 唯一标识
  timestamp: number;             // 导出时间
  format: ExportFormat;          // 导出格式
  fileName: string;              // 文件名
  chartIds: string[];            // 导出的图表ID
  config: ExportConfig;          // 导出配置
  status: 'success' | 'failed';  // 导出状态
  error?: string;                // 错误信息
}

// 导出任务
interface ExportTask {
  id: string;                    // 任务ID
  chartIds: string[];            // 图表ID列表
  dashboardId?: string;          // 仪表板ID
  config: ExportConfig;          // 导出配置
  status: 'pending' | 'processing' | 'completed' | 'failed'; // 任务状态
  progress: number;              // 进度 (0-100)
  result?: Blob;                 // 导出结果
  error?: string;                // 错误信息
  createdAt: number;             // 创建时间
  completedAt?: number;          // 完成时间
}
```

### 实现步骤

#### 1. 更新类型定义

创建 `src/types/export.ts` 文件，定义导出相关的类型：

```typescript
// 导出格式类型
export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'png' | 'jpg' | 'svg';

// 导出配置接口
export interface ExportConfig {
  format: ExportFormat;           // 导出格式
  fileName?: string;             // 自定义文件名
  includeData?: boolean;         // 是否包含原始数据
  includeChart?: boolean;        // 是否包含图表
  selectedFields?: string[];     // 选择导出的字段
  chartSize?: {                  // 图表尺寸
    width: number;
    height: number;
  };
  theme?: 'light' | 'dark';      // 导出主题
  quality?: number;              // 图片质量 (0-1)
  pdfOptions?: {                 // PDF特定选项
    pageSize?: 'A4' | 'A3' | 'letter' | 'legal';
    orientation?: 'portrait' | 'landscape';
    header?: string;             // 页眉内容
    footer?: string;             // 页脚内容
    margins?: {                  // 页边距
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
}

// 导出历史记录
export interface ExportHistory {
  id: string;                    // 唯一标识
  timestamp: number;             // 导出时间
  format: ExportFormat;          // 导出格式
  fileName: string;              // 文件名
  chartIds: string[];            // 导出的图表ID
  config: ExportConfig;          // 导出配置
  status: 'success' | 'failed';  // 导出状态
  error?: string;                // 错误信息
}

// 导出任务
export interface ExportTask {
  id: string;                    // 任务ID
  chartIds: string[];            // 图表ID列表
  dashboardId?: string;          // 仪表板ID
  config: ExportConfig;          // 导出配置
  status: 'pending' | 'processing' | 'completed' | 'failed'; // 任务状态
  progress: number;              // 进度 (0-100)
  result?: Blob;                 // 导出结果
  error?: string;                // 错误信息
  createdAt: number;             // 创建时间
  completedAt?: number;          // 完成时间
}
```

更新 `src/types/index.ts`，导出导出相关类型：

```typescript
export * from './chart';
export * from './dashboard';
export * from './filter';
export * from './export';
// 其他导出...
```

#### 2. 安装依赖库

```bash
npm install xlsx jspdf html2canvas file-saver
npm install @types/file-saver -D
```

#### 3. 创建导出工具类

创建 `src/utils/export.ts` 文件，实现各种格式的导出功能：

```typescript
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { ExportConfig, ExportFormat } from '../types';

// 生成默认文件名
export const generateFileName = (format: ExportFormat, chartName?: string): string => {
  const date = new Date();
  const timestamp = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
  
  const baseName = chartName ? `${chartName}_${timestamp}` : `dataviz_export_${timestamp}`;
  
  switch (format) {
    case 'csv':
      return `${baseName}.csv`;
    case 'excel':
      return `${baseName}.xlsx`;
    case 'pdf':
      return `${baseName}.pdf`;
    case 'png':
      return `${baseName}.png`;
    case 'jpg':
      return `${baseName}.jpg`;
    case 'svg':
      return `${baseName}.svg`;
    default:
      return `${baseName}`;
  }
};

// 导出为CSV
export const exportToCSV = async (data: any[], config: ExportConfig): Promise<Blob> => {
  // 筛选字段
  const filteredData = config.selectedFields && config.selectedFields.length > 0
    ? data.map(item => {
        const filtered: Record<string, any> = {};
        config.selectedFields!.forEach(field => {
          filtered[field] = item[field];
        });
        return filtered;
      })
    : data;
  
  // 转换为工作表
  const worksheet = XLSX.utils.json_to_sheet(filteredData);
  
  // 创建工作簿
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  // 生成CSV
  const csvOutput = XLSX.write(workbook, { bookType: 'csv', type: 'array' });
  
  // 返回Blob
  return new Blob([csvOutput], { type: 'text/csv;charset=utf-8' });
};

// 导出为Excel
export const exportToExcel = async (data: any[], config: ExportConfig): Promise<Blob> => {
  // 筛选字段
  const filteredData = config.selectedFields && config.selectedFields.length > 0
    ? data.map(item => {
        const filtered: Record<string, any> = {};
        config.selectedFields!.forEach(field => {
          filtered[field] = item[field];
        });
        return filtered;
      })
    : data;
  
  // 转换为工作表
  const worksheet = XLSX.utils.json_to_sheet(filteredData);
  
  // 创建工作簿
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  // 生成Excel
  const excelOutput = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  // 返回Blob
  return new Blob([excelOutput], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

// 导出为PNG/JPG
export const exportToImage = async (chartElement: HTMLElement, config: ExportConfig): Promise<Blob> => {
  // 设置图表尺寸
  const originalWidth = chartElement.style.width;
  const originalHeight = chartElement.style.height;
  
  if (config.chartSize) {
    chartElement.style.width = `${config.chartSize.width}px`;
    chartElement.style.height = `${config.chartSize.height}px`;
  }
  
  // 转换为canvas
  const canvas = await html2canvas(chartElement, {
    scale: 2, // 提高分辨率
    useCORS: true, // 允许跨域图片
    backgroundColor: config.theme === 'dark' ? '#1a1a1a' : '#ffffff'
  });
  
  // 恢复原始尺寸
  chartElement.style.width = originalWidth;
  chartElement.style.height = originalHeight;
  
  // 转换为Blob
  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob!),
      config.format === 'png' ? 'image/png' : 'image/jpeg',
      config.quality || 0.95
    );
  });
};

// 导出为SVG
export const exportToSVG = (chartElement: HTMLElement): Blob => {
  // 获取SVG元素
  const svgElement = chartElement.querySelector('svg');
  
  if (!svgElement) {
    throw new Error('No SVG element found in the chart');
  }
  
  // 克隆SVG以避免修改原始元素
  const clonedSvg = svgElement.cloneNode(true) as SVGElement;
  
  // 添加XML命名空间
  if (!clonedSvg.getAttribute('xmlns')) {
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }
  
  // 序列化SVG
  const svgData = new XMLSerializer().serializeToString(clonedSvg);
  
  // 返回Blob
  return new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
};

// 导出为PDF
export const exportToPDF = async (chartElements: HTMLElement[], data: any[], config: ExportConfig): Promise<Blob> => {
  // 创建PDF文档
  const { pageSize = 'A4', orientation = 'portrait', margins = { top: 10, right: 10, bottom: 10, left: 10 } } = config.pdfOptions || {};
  
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize
  });
  
  // 设置页边距
  const { top, right, bottom, left } = margins;
  
  // 添加页眉
  if (config.pdfOptions?.header) {
    pdf.setFontSize(12);
    pdf.text(config.pdfOptions.header, pdf.internal.pageSize.getWidth() / 2, top, { align: 'center' });
  }
  
  let yPosition = top + 10;
  
  // 添加图表
  if (config.includeChart !== false && chartElements.length > 0) {
    for (let i = 0; i < chartElements.length; i++) {
      // 如果不是第一个图表且空间不足，添加新页
      if (i > 0 && yPosition > pdf.internal.pageSize.getHeight() - bottom - 60) {
        pdf.addPage();
        yPosition = top + 10;
        
        // 在新页添加页眉
        if (config.pdfOptions?.header) {
          pdf.setFontSize(12);
          pdf.text(config.pdfOptions.header, pdf.internal.pageSize.getWidth() / 2, top, { align: 'center' });
        }
      }
      
      // 转换图表为canvas
      const canvas = await html2canvas(chartElements[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: config.theme === 'dark' ? '#1a1a1a' : '#ffffff'
      });
      
      // 计算图表尺寸，保持宽高比
      const pageWidth = pdf.internal.pageSize.getWidth() - left - right;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // 添加图表到PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', left, yPosition, imgWidth, imgHeight);
      
      // 更新Y位置
      yPosition += imgHeight + 10;
    }
  }
  
  // 添加数据表格
  if (config.includeData !== false && data.length > 0) {
    // 如果空间不足，添加新页
    if (yPosition > pdf.internal.pageSize.getHeight() - bottom - 60) {
      pdf.addPage();
      yPosition = top + 10;
      
      // 在新页添加页眉
      if (config.pdfOptions?.header) {
        pdf.setFontSize(12);
        pdf.text(config.pdfOptions.header, pdf.internal.pageSize.getWidth() / 2, top, { align: 'center' });
      }
    }
    
    // 筛选字段
    const fields = config.selectedFields && config.selectedFields.length > 0
      ? config.selectedFields
      : Object.keys(data[0]);
    
    // 创建表头
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    const cellWidth = (pdf.internal.pageSize.getWidth() - left - right) / fields.length;
    const cellHeight = 8;
    
    // 绘制表头
    pdf.setFillColor(220, 220, 220);
    pdf.rect(left, yPosition, cellWidth * fields.length, cellHeight, 'F');
    
    fields.forEach((field, index) => {
      pdf.text(field, left + cellWidth * index + cellWidth / 2, yPosition + cellHeight / 2, { align: 'center' });
    });
    
    yPosition += cellHeight;
    
    // 绘制数据行
    const maxRowsPerPage = Math.floor((pdf.internal.pageSize.getHeight() - yPosition - bottom) / cellHeight);
    let rowCount = 0;
    
    for (let i = 0; i < Math.min(data.length, 100); i++) { // 限制最多100行
      // 如果达到页面限制，添加新页
      if (rowCount >= maxRowsPerPage) {
        pdf.addPage();
        yPosition = top + 10;
        rowCount = 0;
        
        // 在新页添加页眉
        if (config.pdfOptions?.header) {
          pdf.setFontSize(12);
          pdf.text(config.pdfOptions.header, pdf.internal.pageSize.getWidth() / 2, top, { align: 'center' });
        }
        
        // 重绘表头
        pdf.setFontSize(10);
        pdf.setFillColor(220, 220, 220);
        pdf.rect(left, yPosition, cellWidth * fields.length, cellHeight, 'F');
        
        fields.forEach((field, index) => {
          pdf.text(field, left + cellWidth * index + cellWidth / 2, yPosition + cellHeight / 2, { align: 'center' });
        });
        
        yPosition += cellHeight;
      }
      
      // 绘制数据行
      pdf.setFillColor(i % 2 === 0 ? 255 : 245, i % 2 === 0 ? 255 : 245, i % 2 === 0 ? 255 : 245);
      pdf.rect(left, yPosition, cellWidth * fields.length, cellHeight, 'F');
      
      fields.forEach((field, index) => {
        const value = data[i][field];
        const text = value !== null && value !== undefined ? String(value) : '';
        pdf.text(text.substring(0, 20) + (text.length > 20 ? '...' : ''), left + cellWidth * index + cellWidth / 2, yPosition + cellHeight / 2, { align: 'center' });
      });
      
      yPosition += cellHeight;
      rowCount++;
    }
  }
  
  // 添加页脚
  if (config.pdfOptions?.footer) {
    const pageCount = pdf.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.text(
        config.pdfOptions.footer,
        pdf.internal.pageSize.getWidth() / 2,
        pdf.internal.pageSize.getHeight() - bottom / 2,
        { align: 'center' }
      );
    }
  }
  
  // 返回Blob
  return pdf.output('blob');
};

// 主导出函数
export const exportData = async (
  chartElements: HTMLElement[],
  data: any[],
  config: ExportConfig
): Promise<Blob> => {
  switch (config.format) {
    case 'csv':
      return exportToCSV(data, config);
      
    case 'excel':
      return exportToExcel(data, config);
      
    case 'pdf':
      return exportToPDF(chartElements, data, config);
      
    case 'png':
    case 'jpg':
      if (chartElements.length === 0) {
        throw new Error('No chart element provided for image export');
      }
      return exportToImage(chartElements[0], config);
      
    case 'svg':
      if (chartElements.length === 0) {
        throw new Error('No chart element provided for SVG export');
      }
      return exportToSVG(chartElements[0]);
      
    default:
      throw new Error(`Unsupported export format: ${config.format}`);
  }
};

// 保存导出文件
export const saveExportFile = (blob: Blob, fileName: string): void => {
  saveAs(blob, fileName);
};
```

#### 4. 更新状态管理

修改 `src/store/index.ts`，添加导出相关状态和操作：

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { 
  Dashboard, 
  ChartConfig,
  ExportHistory,
  ExportTask,
  ExportConfig
} from '../types';

interface AppStore {
  // 现有状态...
  
  // 导出相关状态
  exportHistory: ExportHistory[];
  exportTasks: ExportTask[];
  
  // 导出相关操作
  addExportHistory: (history: Omit<ExportHistory, 'id'>) => string;
  clearExportHistory: () => void;
  
  createExportTask: (chartIds: string[], config: ExportConfig, dashboardId?: string) => string;
  updateExportTask: (id: string, updates: Partial<Omit<ExportTask, 'id' | 'createdAt'>>) => void;
  removeExportTask: (id: string) => void;
  clearCompletedExportTasks: () => void;
}

const useAppStore = create<AppStore>(
  persist(
    (set, get) => ({
      // 现有状态和操作...
      
      // 导出相关状态
      exportHistory: [],
      exportTasks: [],
      
      // 添加导出历史
      addExportHistory: (history) => {
        const id = uuidv4();
        
        set((state) => ({
          exportHistory: [
            {
              ...history,
              id
            },
            ...state.exportHistory
          ].slice(0, 50) // 限制历史记录数量
        }));
        
        return id;
      },
      
      // 清除导出历史
      clearExportHistory: () => {
        set({ exportHistory: [] });
      },
      
      // 创建导出任务
      createExportTask: (chartIds, config, dashboardId) => {
        const id = uuidv4();
        
        const newTask: ExportTask = {
          id,
          chartIds,
          dashboardId,
          config,
          status: 'pending',
          progress: 0,
          createdAt: Date.now()
        };
        
        set((state) => ({
          exportTasks: [...state.exportTasks, newTask]
        }));
        
        return id;
      },
      
      // 更新导出任务
      updateExportTask: (id, updates) => {
        set((state) => {
          const tasks = [...state.exportTasks];
          const index = tasks.findIndex(t => t.id === id);
          
          if (index === -1) return state;
          
          tasks[index] = {
            ...tasks[index],
            ...updates
          };
          
          return { exportTasks: tasks };
        });
      },
      
      // 移除导出任务
      removeExportTask: (id) => {
        set((state) => ({
          exportTasks: state.exportTasks.filter(t => t.id !== id)
        }));
      },
      
      // 清除已完成的导出任务
      clearCompletedExportTasks: () => {
        set((state) => ({
          exportTasks: state.exportTasks.filter(t => t.status !== 'completed' && t.status !== 'failed')
        }));
      }
    }),
    {
      name: 'dataviz-storage',
      partialize: (state) => ({
        // 现有持久化状态...
        exportHistory: state.exportHistory
        // 注意：不持久化exportTasks，因为它们包含Blob对象
      })
    }
  )
);

export { useAppStore };
```

#### 5. 创建导出配置组件

创建 `src/components/export/ExportConfigPanel.tsx` 组件：

```typescript
import React, { useState, useEffect } from 'react';
import { ExportConfig, ExportFormat } from '../../types';
import { generateFileName } from '../../utils/export';

interface ExportConfigPanelProps {
  initialConfig?: Partial<ExportConfig>;
  onConfigChange: (config: ExportConfig) => void;
  availableFields: string[];
  chartName?: string;
  theme: 'light' | 'dark';
}

export const ExportConfigPanel: React.FC<ExportConfigPanelProps> = ({
  initialConfig,
  onConfigChange,
  availableFields,
  chartName,
  theme
}) => {
  // 默认配置
  const defaultConfig: ExportConfig = {
    format: 'png',
    includeData: true,
    includeChart: true,
    selectedFields: [],
    chartSize: { width: 800, height: 600 },
    theme: theme,
    quality: 0.9,
    pdfOptions: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 10, right: 10, bottom: 10, left: 10 }
    }
  };
  
  // 合并初始配置
  const mergedConfig: ExportConfig = {
    ...defaultConfig,
    ...initialConfig
  };
  
  // 状态
  const [format, setFormat] = useState<ExportFormat>(mergedConfig.format);
  const [fileName, setFileName] = useState(mergedConfig.fileName || generateFileName(mergedConfig.format, chartName));
  const [includeData, setIncludeData] = useState(mergedConfig.includeData);
  const [includeChart, setIncludeChart] = useState(mergedConfig.includeChart);
  const [selectedFields, setSelectedFields] = useState<string[]>(mergedConfig.selectedFields || []);
  const [chartWidth, setChartWidth] = useState(mergedConfig.chartSize?.width || 800);
  const [chartHeight, setChartHeight] = useState(mergedConfig.chartSize?.height || 600);
  const [exportTheme, setExportTheme] = useState(mergedConfig.theme || theme);
  const [quality, setQuality] = useState(mergedConfig.quality || 0.9);
  const [pageSize, setPageSize] = useState(mergedConfig.pdfOptions?.pageSize || 'A4');
  const [orientation, setOrientation] = useState(mergedConfig.pdfOptions?.orientation || 'portrait');
  const [header, setHeader] = useState(mergedConfig.pdfOptions?.header || '');
  const [footer, setFooter] = useState(mergedConfig.pdfOptions?.footer || '');
  
  // 当配置变化时，通知父组件
  useEffect(() => {
    const updatedConfig: ExportConfig = {
      format,
      fileName,
      includeData,
      includeChart,
      selectedFields: selectedFields.length > 0 ? selectedFields : undefined,
      chartSize: { width: chartWidth, height: chartHeight },
      theme: exportTheme,
      quality,
      pdfOptions: {
        pageSize: pageSize as 'A4' | 'A3' | 'letter' | 'legal',
        orientation: orientation as 'portrait' | 'landscape',
        header: header || undefined,
        footer: footer || undefined,
        margins: { top: 10, right: 10, bottom: 10, left: 10 }
      }
    };
    
    onConfigChange(updatedConfig);
  }, [
    format, fileName, includeData, includeChart, selectedFields,
    chartWidth, chartHeight, exportTheme, quality,
    pageSize, orientation, header, footer,
    onConfigChange
  ]);
  
  // 当格式变化时，更新文件名
  useEffect(() => {
    setFileName(generateFileName(format, chartName));
  }, [format, chartName]);
  
  // 全选/取消全选字段
  const toggleAllFields = (select: boolean) => {
    setSelectedFields(select ? [...availableFields] : []);
  };
  
  // 切换字段选择
  const toggleField = (field: string) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };
  
  return (
    <div style={{
      padding: '20px',
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
      borderRadius: '8px'
    }}>
      <h3 style={{ marginTop: 0 }}>导出配置</h3>
      
      {/* 格式选择 */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>导出格式</label>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as ExportFormat)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
            backgroundColor: theme === 'dark' ? '#333' : '#fff',
            color: theme === 'dark' ? '#fff' : '#333'
          }}
        >
          <option value="csv">CSV (原始数据)</option>
          <option value="excel">Excel (数据表格)</option>
          <option value="pdf">PDF (报告)</option>
          <option value="png">PNG (图片)</option>
          <option value="jpg">JPG (图片)</option>
          <option value="svg">SVG (矢量图)</option>
        </select>
      </div>
      
      {/* 文件名 */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>文件名</label>
        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
            backgroundColor: theme === 'dark' ? '#333' : '#fff',
            color: theme === 'dark' ? '#fff' : '#333'
          }}
        />
      </div>
      
      {/* 内容选项 */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>导出内容</label>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={includeChart}
              onChange={(e) => setIncludeChart(e.target.checked)}
              style={{ marginRight: '5px' }}
              disabled={format === 'csv' || format === 'excel'}
            />
            包含图表
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={includeData}
              onChange={(e) => setIncludeData(e.target.checked)}
              style={{ marginRight: '5px' }}
              disabled={format === 'png' || format === 'jpg' || format === 'svg'}
            />
            包含数据
          </label>
        </div>
      </div>
      
      {/* 字段选择（仅当包含数据时显示） */}
      {includeData && (format === 'csv' || format === 'excel' || format === 'pdf') && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <label>选择字段</label>
            <div>
              <button
                onClick={() => toggleAllFields(true)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: theme === 'dark' ? '#0066cc' : '#007bff',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                全选
              </button>
              <button
                onClick={() => toggleAllFields(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: theme === 'dark' ? '#0066cc' : '#007bff',
                  cursor: 'pointer'
                }}
              >
                取消全选
              </button>
            </div>
          </div>
          
          <div style={{
            maxHeight: '150px',
            overflowY: 'auto',
            padding: '10px',
            backgroundColor: theme === 'dark' ? '#333' : '#fff',
            borderRadius: '4px',
            border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`
          }}>
            {availableFields.map(field => (
              <div key={field} style={{ marginBottom: '5px' }}>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(field)}
                    onChange={() => toggleField(field)}
                    style={{ marginRight: '5px' }}
                  />
                  {field}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 图表尺寸（仅当包含图表时显示） */}
      {includeChart && (format === 'png' || format === 'jpg' || format === 'svg' || format === 'pdf') && (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>图表尺寸</label>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '3px' }}>宽度 (px)</label>
              <input
                type="number"
                value={chartWidth}
                onChange={(e) => setChartWidth(parseInt(e.target.value) || 800)}
                min={100}
                max={3000}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                  backgroundColor: theme === 'dark' ? '#333' : '#fff',
                  color: theme === 'dark' ? '#fff' : '#333'
                }}
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '3px' }}>高度 (px)</label>
              <input
                type="number"
                value={chartHeight}
                onChange={(e) => setChartHeight(parseInt(e.target.value) || 600)}
                min={100}
                max={3000}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                  backgroundColor: theme === 'dark' ? '#333' : '#fff',
                  color: theme === 'dark' ? '#fff' : '#333'
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* 图片质量（仅对JPG格式） */}
      {format === 'jpg' && (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>图片质量 ({Math.round(quality * 100)}%)</label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={quality}
            onChange={(e) => setQuality(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      )}
      
      {/* 主题选择 */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>导出主题</label>
        <select
          value={exportTheme}
          onChange={(e) => setExportTheme(e.target.value as 'light' | 'dark')}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
            backgroundColor: theme === 'dark' ? '#333' : '#fff',
            color: theme === 'dark' ? '#fff' : '#333'
          }}
        >
          <option value="light">浅色</option>
          <option value="dark">深色</option>
        </select>
      </div>
      
      {/* PDF特定选项 */}
      {format === 'pdf' && (
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ marginBottom: '10px' }}>PDF选项</h4>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>页面大小</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                  backgroundColor: theme === 'dark' ? '#333' : '#fff',
                  color: theme === 'dark' ? '#fff' : '#333'
                }}
              >
                <option value="A4">A4</option>
                <option value="A3">A3</option>
                <option value="letter">Letter</option>
                <option value="legal">Legal</option>
              </select>
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>方向</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                  backgroundColor: theme === 'dark' ? '#333' : '#fff',
                  color: theme === 'dark' ? '#fff' : '#333'
                }}
              >
                <option value="portrait">纵向</option>
                <option value="landscape">横向</option>
              </select>
            </div>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>页眉</label>
            <input
              type="text"
              value={header}
              onChange={(e) => setHeader(e.target.value)}
              placeholder="页眉内容（可选）"
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                backgroundColor: theme === 'dark' ? '#333' : '#fff',
                color: theme === 'dark' ? '#fff' : '#333'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>页脚</label>
            <input
              type="text"
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              placeholder="页脚内容（可选）"
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                backgroundColor: theme === 'dark' ? '#333' : '#fff',
                color: theme === 'dark' ? '#fff' : '#333'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
```

#### 6. 创建导出对话框组件

创建 `src/components/export/ExportDialog.tsx` 组件：

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store';
import { ExportConfig, ExportFormat } from '../../types';
import { ExportConfigPanel } from './ExportConfigPanel';
import { exportData, saveExportFile, generateFileName } from '../../utils/export';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chartId: string;
  chartName?: string;
  data: any[];
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  chartId,
  chartName,
  data
}) => {
  const { theme, addExportHistory } = useAppStore();
  
  // 导出配置
  const [config, setConfig] = useState<ExportConfig>({
    format: 'png',
    includeData: true,
    includeChart: true,
    theme: theme
  });
  
  // 导出状态
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  
  // 图表元素引用
  const chartRef = useRef<HTMLDivElement>(null);
  
  // 获取可用字段
  const availableFields = data.length > 0 ? Object.keys(data[0]) : [];
  
  // 处理导出
  const handleExport = async () => {
    if (!chartRef.current) return;
    
    setIsExporting(true);
    setExportError(null);
    
    try {
      // 执行导出
      const blob = await exportData(
        [chartRef.current],
        data,
        config
      );
      
      // 保存文件
      const fileName = config.fileName || generateFileName(config.format, chartName);
      saveExportFile(blob, fileName);
      
      // 添加到导出历史
      addExportHistory({
        timestamp: Date.now(),
        format: config.format,
        fileName,
        chartIds: [chartId],
        config,
        status: 'success'
      });
      
      // 关闭对话框
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      setExportError(error instanceof Error ? error.message : '导出失败');
      
      // 添加到导出历史
      addExportHistory({
        timestamp: Date.now(),
        format: config.format,
        fileName: config.fileName || generateFileName(config.format, chartName),
        chartIds: [chartId],
        config,
        status: 'failed',
        error: error instanceof Error ? error.message : '导出失败'
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // 如果对话框关闭，重置状态
  useEffect(() => {
    if (!isOpen) {
      setExportError(null);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: theme === 'dark' ? '#222' : '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>导出 {chartName || '图表'}</h2>
          
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: theme === 'dark' ? '#aaa' : '#666'
            }}
          >
            ×
          </button>
        </div>
        
        {/* 导出配置面板 */}
        <ExportConfigPanel
          initialConfig={config}
          onConfigChange={setConfig}
          availableFields={availableFields}
          chartName={chartName}
          theme={theme}
        />
        
        {/* 错误信息 */}
        {exportError && (
          <div style={{
            padding: '10px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            marginTop: '15px',
            marginBottom: '15px'
          }}>
            {exportError}
          </div>
        )}
        
        {/* 操作按钮 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              color: theme === 'dark' ? '#fff' : '#333'
            }}
          >
            取消
          </button>
          
          <button
            onClick={handleExport}
            disabled={isExporting}
            style={{
              padding: '8px 16px',
              backgroundColor: theme === 'dark' ? '#0066cc' : '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              opacity: isExporting ? 0.7 : 1
            }}
          >
            {isExporting ? '导出中...' : '导出'}
          </button>
        </div>
        
        {/* 隐藏的图表容器（用于导出） */}
        <div style={{ display: 'none' }}>
          <div ref={chartRef} id={`export-chart-${chartId}`}>
            {/* 图表将在导出时被克隆到这里 */}
          </div>
        </div>
      </div>
    </div>
  );
};
```

#### 7. 创建导出历史组件

创建 `src/components/export/ExportHistory.tsx` 组件：

```typescript
import React from 'react';
import { useAppStore } from '../../store';
import { ExportHistory as ExportHistoryType } from '../../types';

interface ExportHistoryProps {
  onClose: () => void;
}

export const ExportHistory: React.FC<ExportHistoryProps> = ({ onClose }) => {
  const { theme, exportHistory, clearExportHistory } = useAppStore();
  
  // 格式化时间
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };
  
  // 获取格式显示名称
  const getFormatDisplayName = (format: string): string => {
    switch (format) {
      case 'csv': return 'CSV';
      case 'excel': return 'Excel';
      case 'pdf': return 'PDF';
      case 'png': return 'PNG';
      case 'jpg': return 'JPG';
      case 'svg': return 'SVG';
      default: return format.toUpperCase();
    }
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: theme === 'dark' ? '#222' : '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>导出历史</h2>
          
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: theme === 'dark' ? '#aaa' : '#666'
            }}
          >
            ×
          </button>
        </div>
        
        {exportHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <p>暂无导出历史记录</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '15px', textAlign: 'right' }}>
              <button
                onClick={clearExportHistory}
                style={{
                  padding: '6px 12px',
                  backgroundColor: theme === 'dark' ? '#d32f2f' : '#f44336',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                清除历史
              </button>
            </div>
            
            <div style={{
              backgroundColor: theme === 'dark' ? '#333' : '#f5f5f5',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: theme === 'dark' ? '#444' : '#e0e0e0',
                    textAlign: 'left'
                  }}>
                    <th style={{ padding: '12px 15px' }}>时间</th>
                    <th style={{ padding: '12px 15px' }}>文件名</th>
                    <th style={{ padding: '12px 15px' }}>格式</th>
                    <th style={{ padding: '12px 15px' }}>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {exportHistory.map((history: ExportHistoryType) => (
                    <tr 
                      key={history.id}
                      style={{
                        borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                        backgroundColor: history.status === 'failed' ? 
                          (theme === 'dark' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.05)') : 
                          'transparent'
                      }}
                    >
                      <td style={{ padding: '12px 15px' }}>{formatDate(history.timestamp)}</td>
                      <td style={{ padding: '12px 15px' }}>{history.fileName}</td>
                      <td style={{ padding: '12px 15px' }}>{getFormatDisplayName(history.format)}</td>
                      <td style={{ padding: '12px 15px' }}>
                        <span style={{
                          color: history.status === 'success' ? 
                            (theme === 'dark' ? '#4caf50' : '#2e7d32') : 
                            (theme === 'dark' ? '#f44336' : '#d32f2f')
                        }}>
                          {history.status === 'success' ? '成功' : '失败'}
                        </span>
                        {history.error && (
                          <span style={{ marginLeft: '5px', fontSize: '12px', color: theme === 'dark' ? '#f44336' : '#d32f2f' }}>
                            ({history.error})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
```

#### 8. 更新Chart组件

修改 `src/components/Chart.tsx`，添加导出按钮：

```typescript
// 在Chart组件中添加导出功能
import { useState } from 'react';
import { ExportDialog } from './export/ExportDialog';

// 在组件内部添加状态
const [showExportDialog, setShowExportDialog] = useState(false);

// 在图表工具栏中添加导出按钮
<div className="chart-toolbar">
  {/* 现有按钮... */}
  
  <button
    onClick={() => setShowExportDialog(true)}
    title="导出"
    className="chart-toolbar-button"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  </button>
</div>

{/* 导出对话框 */}
{showExportDialog && (
  <ExportDialog
    isOpen={showExportDialog}
    onClose={() => setShowExportDialog(false)}
    chartId={config.id}
    chartName={config.title}
    data={data}
  />
)}
```

#### 9. 添加批量导出功能

创建 `src/components/export/BatchExport.tsx` 组件：

```typescript
import React, { useState } from 'react';
import { useAppStore } from '../../store';
import { ExportConfig, ChartConfig } from '../../types';
import { ExportConfigPanel } from './ExportConfigPanel';
import { exportData, saveExportFile, generateFileName } from '../../utils/export';

interface BatchExportProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BatchExport: React.FC<BatchExportProps> = ({
  isOpen,
  onClose
}) => {
  const { theme, charts, dashboards, addExportHistory } = useAppStore();
  
  // 选中的图表
  const [selectedChartIds, setSelectedChartIds] = useState<string[]>([]);
  
  // 导出配置
  const [config, setConfig] = useState<ExportConfig>({
    format: 'pdf',
    includeData: true,
    includeChart: true,
    theme: theme,
    fileName: `dataviz_batch_export_${new Date().toISOString().split('T')[0]}`
  });
  
  // 导出状态
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  
  // 获取所有图表
  const allCharts = charts.map(chart => ({
    id: chart.id,
    title: chart.title,
    dashboardId: dashboards.find(d => d.charts.includes(chart.id))?.id
  }));
  
  // 切换选择所有图表
  const toggleSelectAll = (select: boolean) => {
    setSelectedChartIds(select ? allCharts.map(c => c.id) : []);
  };
  
  // 切换选择单个图表
  const toggleSelectChart = (chartId: string) => {
    if (selectedChartIds.includes(chartId)) {
      setSelectedChartIds(selectedChartIds.filter(id => id !== chartId));
    } else {
      setSelectedChartIds([...selectedChartIds, chartId]);
    }
  };
  
  // 处理批量导出
  const handleBatchExport = async () => {
    if (selectedChartIds.length === 0) return;
    
    setIsExporting(true);
    setExportProgress(0);
    setExportError(null);
    
    try {
      // 如果是PDF格式，合并为一个PDF
      if (config.format === 'pdf') {
        // 实现PDF合并导出...
        // 这里需要更复杂的实现，可能需要使用jsPDF的addPage功能
      } else {
        // 逐个导出其他格式
        for (let i = 0; i < selectedChartIds.length; i++) {
          const chartId = selectedChartIds[i];
          const chart = charts.find(c => c.id === chartId);
          
          if (chart) {
            // 获取图表元素
            const chartElement = document.getElementById(`chart-${chartId}`);
            
            if (chartElement) {
              // 执行导出
              const blob = await exportData(
                [chartElement],
                chart.data || [],
                config
              );
              
              // 保存文件
              const fileName = generateFileName(config.format, chart.title);
              saveExportFile(blob, fileName);
              
              // 添加到导出历史
              addExportHistory({
                timestamp: Date.now(),
                format: config.format,
                fileName,
                chartIds: [chartId],
                config,
                status: 'success'
              });
            }
          }
          
          // 更新进度
          setExportProgress(Math.round(((i + 1) / selectedChartIds.length) * 100));
        }
      }
      
      // 关闭对话框
      onClose();
    } catch (error) {
      console.error('Batch export error:', error);
      setExportError(error instanceof Error ? error.message : '批量导出失败');
      
      // 添加到导出历史
      addExportHistory({
        timestamp: Date.now(),
        format: config.format,
        fileName: config.fileName || `batch_export_${new Date().toISOString().split('T')[0]}`,
        chartIds: selectedChartIds,
        config,
        status: 'failed',
        error: error instanceof Error ? error.message : '批量导出失败'
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: theme === 'dark' ? '#222' : '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>批量导出</h2>
          
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: theme === 'dark' ? '#aaa' : '#666'
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* 图表选择 */}
          <div style={{ flex: 1 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '10px' 
            }}>
              <h3 style={{ margin: 0 }}>选择图表</h3>
              
              <div>
                <button
                  onClick={() => toggleSelectAll(true)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: theme === 'dark' ? '#0066cc' : '#007bff',
                    cursor: 'pointer',
                    marginRight: '10px'
                  }}
                >
                  全选
                </button>
                <button
                  onClick={() => toggleSelectAll(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: theme === 'dark' ? '#0066cc' : '#007bff',
                    cursor: 'pointer'
                  }}
                >
                  取消全选
                </button>
              </div>
            </div>
            
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              padding: '10px',
              backgroundColor: theme === 'dark' ? '#333' : '#f5f5f5',
              borderRadius: '4px'
            }}>
              {allCharts.length === 0 ? (
                <p style={{ textAlign: 'center' }}>暂无图表</p>
              ) : (
                allCharts.map(chart => (
                  <div 
                    key={chart.id}
                    style={{ 
                      marginBottom: '8px',
                      padding: '8px',
                      backgroundColor: selectedChartIds.includes(chart.id) ? 
                        (theme === 'dark' ? '#0066cc' : '#e6f7ff') : 
                        (theme === 'dark' ? '#444' : '#fff'),
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleSelectChart(chart.id)}
                  >
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      cursor: 'pointer',
                      color: selectedChartIds.includes(chart.id) && theme === 'dark' ? '#fff' : 'inherit'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedChartIds.includes(chart.id)}
                        onChange={() => toggleSelectChart(chart.id)}
                        style={{ marginRight: '8px' }}
                      />
                      {chart.title || `图表 ${chart.id.substring(0, 8)}`}
                    </label>
                  </div>
                ))
              )}
            </div>
            
            <div style={{ marginTop: '10px' }}>
              <p>已选择 {selectedChartIds.length} 个图表</p>
            </div>
          </div>
          
          {/* 导出配置 */}
          <div style={{ flex: 1 }}>
            <ExportConfigPanel
              initialConfig={config}
              onConfigChange={setConfig}
              availableFields={[]}
              theme={theme}
            />
          </div>
        </div>
        
        {/* 导出进度 */}
        {isExporting && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ marginBottom: '5px' }}>
              <span>导出进度: {exportProgress}%</span>
            </div>
            <div style={{
              height: '8px',
              backgroundColor: theme === 'dark' ? '#444' : '#e0e0e0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${exportProgress}%`,
                backgroundColor: theme === 'dark' ? '#0066cc' : '#007bff',
                transition: 'width 0.3s'
              }}></div>
            </div>
          </div>
        )}
        
        {/* 错误信息 */}
        {exportError && (
          <div style={{
            padding: '10px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            marginTop: '15px'
          }}>
            {exportError}
          </div>
        )}
        
        {/* 操作按钮 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              color: theme === 'dark' ? '#fff' : '#333'
            }}
          >
            取消
          </button>
          
          <button
            onClick={handleBatchExport}
            disabled={isExporting || selectedChartIds.length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: theme === 'dark' ? '#0066cc' : '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: (isExporting || selectedChartIds.length === 0) ? 'not-allowed' : 'pointer',
              opacity: (isExporting || selectedChartIds.length === 0) ? 0.7 : 1
            }}
          >
            {isExporting ? '导出中...' : '开始导出'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

## 测试计划

### 功能测试

1. **基础导出功能**
   - 测试CSV格式导出的数据完整性
   - 验证Excel格式导出的格式和样式
   - 测试PDF格式导出的图表和数据展示
   - 验证PNG/JPG/SVG图片导出的质量和尺寸

2. **导出配置选项**
   - 测试自定义文件名功能
   - 验证字段选择功能
   - 测试图表尺寸和分辨率设置
   - 验证PDF页眉/页脚设置
   - 测试导出主题切换

3. **批量导出**
   - 测试多图表选择功能
   - 验证批量导出进度指示
   - 测试不同格式的批量导出

4. **导出历史**
   - 测试导出历史记录的添加
   - 验证导出历史的清除功能
   - 测试导出失败的错误信息显示

### 兼容性测试

1. 测试在不同浏览器中的导出功能（Chrome、Firefox、Safari、Edge）
2. 验证在不同设备上的导出体验（桌面、平板、移动设备）
3. 测试导出文件在不同应用程序中的打开和使用（Microsoft Office、Google Docs、Adobe Reader等）

### 性能测试

1. 测试大数据集（1000+条记录）的导出性能
2. 验证高分辨率图表导出的内存使用情况
3. 测试批量导出多个图表的性能和稳定性

## 实现时间表

| 阶段 | 任务 | 预计时间 |
|------|------|----------|
| 1 | 设计数据结构和状态管理 | 1天 |
| 2 | 实现基础导出工具类 | 3天 |
| 3 | 实现导出配置组件 | 2天 |
| 4 | 实现单图表导出功能 | 2天 |
| 5 | 实现批量导出功能 | 2天 |
| 6 | 实现导出历史管理 | 1天 |
| 7 | 测试和优化 | 3天 |
| **总计** | | **14天** |

## 注意事项

1. **浏览器兼容性**：不同浏览器对Canvas和SVG的支持有差异，需要进行充分测试
2. **内存管理**：导出大型图表或批量导出时，需要注意内存使用情况
3. **安全考虑**：确保导出的数据不包含敏感信息
4. **用户体验**：提供清晰的导出进度指示和错误处理
5. **文件大小**：优化导出文件的大小，特别是图片和PDF格式

## 参考资源

1. [SheetJS (xlsx) 文档](https://github.com/SheetJS/sheetjs)
2. [jsPDF 文档](https://github.com/MrRio/jsPDF)
3. [html2canvas 文档](https://github.com/niklasvh/html2canvas)
4. [FileSaver.js 文档](https://github.com/eligrey/FileSaver.js)
5. [Recharts 导出指南](https://recharts.org/en-US/examples/SaveAsImage)