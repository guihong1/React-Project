import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store';
import styles from './ChunkedUploader.module.css';

// 添加TypeScript声明，支持window.gc调用
declare global {
  interface Window {
    gc?: () => void;
  }
}

// 分片上传配置
interface ChunkConfig {
  chunkSize: number;       // 每个分片的大小（字节）
  concurrentUploads: number; // 并发上传的分片数量
  retryTimes: number;      // 失败重试次数
  retryDelay: number;      // 重试延迟（毫秒）
}

// 分片信息（流式处理）
interface Chunk {
  id: number;              // 分片ID
  file: Blob | null;       // 分片数据（流式处理时可能为null，只在需要时加载）
  start: number;           // 分片在原文件中的起始位置
  end: number;             // 分片在原文件中的结束位置
  progress: number;        // 上传进度（0-100）
  status: 'pending' | 'uploading' | 'success' | 'error'; // 分片状态
  retries: number;         // 已重试次数
}

// 上传文件信息
interface UploadFile {
  id: string;              // 文件唯一标识
  file: File;              // 原始文件
  name: string;            // 文件名
  size: number;            // 文件大小
  type: string;            // 文件类型
  chunks: Chunk[];         // 分片列表
  progress: number;        // 总体上传进度（0-100）
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error'; // 上传状态
  uploadedChunks: number[];// 已上传的分片ID列表，用于断点续传
}

interface ChunkedUploaderProps {
  onUploadComplete?: (file: File) => void; // 上传完成回调
  onUploadProgress?: (progress: number) => void; // 上传进度回调
  onUploadError?: (error: Error) => void; // 上传错误回调
  accept?: string; // 接受的文件类型
  maxFileSize?: number; // 最大文件大小（字节）
  chunkConfig?: Partial<ChunkConfig>; // 分片配置
}

// 默认分片配置
const DEFAULT_CHUNK_CONFIG: ChunkConfig = {
  chunkSize: 1024 * 1024 * 2, // 2MB
  concurrentUploads: 3,
  retryTimes: 3,
  retryDelay: 1000,
};

// 模拟上传API（实际项目中应替换为真实的上传API）- 流式处理版本
const mockUploadChunk = async (chunk: Chunk): Promise<void> => {
  // 模拟网络延迟和随机成功/失败
  return new Promise((resolve, reject) => {
    const delay = 500 + Math.random() * 1000;
    const shouldSucceed = Math.random() > 0.001; // 99.9%成功率，进一步降低失败概率
    
    // 在实际应用中，这里可以使用ReadableStream或Blob.stream()进行流式上传
    // 例如使用fetch的body支持流式传输，或使用XMLHttpRequest的send方法发送Blob
    
    setTimeout(() => {
      if (shouldSucceed) {
        // 模拟上传成功后，可以立即释放内存
        resolve();
      } else {
        reject(new Error(`分片 ${chunk.id} 上传失败`));
      }
    }, delay);
  });
};

// 模拟合并分片API - 流式处理版本
const mockMergeChunks = async (): Promise<void> => {
  // 模拟网络延迟
  return new Promise((resolve) => {
    // 在实际应用中，这里应该是服务器端的合并操作
    // 客户端只需发送合并请求，不需要再次传输文件内容
    // 服务器端可以使用流式处理来合并文件，避免一次性加载全部分片到内存
    setTimeout(resolve, 1000);
  });
};

export const ChunkedUploader: React.FC<ChunkedUploaderProps> = ({
  onUploadComplete,
  onUploadProgress,
  onUploadError,
  accept = '.json,.csv,.xlsx,.xls',
  maxFileSize = 1024 * 1024 * 1024, // 1GB
  chunkConfig = {},
}) => {
  const { theme } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFile, setUploadFile] = useState<UploadFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [config] = useState<ChunkConfig>({
    ...DEFAULT_CHUNK_CONFIG,
    ...chunkConfig,
  });
  
  // 用于存储上传状态的localStorage键
  const STORAGE_KEY = 'chunked_upload_state';
  
  // 保存上传状态到localStorage（用于断点续传）
  const saveUploadState = (file: UploadFile) => {
    try {
      const state = {
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedChunks: file.uploadedChunks,
        lastUpdated: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('保存上传状态失败:', err);
    }
  };
    
    // 从localStorage加载上传状态
  const loadUploadState = (file: File): number[] => {
    try {
      const stateStr = localStorage.getItem(STORAGE_KEY);
      if (!stateStr) return [];
      
      const state = JSON.parse(stateStr);
      
      // 验证状态是否匹配当前文件
      if (
        state.name === file.name &&
        state.size === file.size &&
        state.type === file.type &&
        // 检查状态是否在24小时内保存的
        Date.now() - state.lastUpdated < 24 * 60 * 60 * 1000
      ) {
        return state.uploadedChunks || [];
      }
      
      return [];
    } catch (err) {
      console.error('加载上传状态失败:', err);
      return [];
    }
  };
  
  // 清除上传状态
  const clearUploadState = () => {
    localStorage.removeItem(STORAGE_KEY);
  };
  
  // 创建文件分片（流式处理）
  const createFileChunks = (file: File, uploadedChunks: number[] = []): Chunk[] => {
    const chunks: Chunk[] = [];
    const chunkSize = config.chunkSize;
    const chunksCount = Math.ceil(file.size / chunkSize);
    
    // 只创建分片的元数据，不立即读取文件内容
    for (let i = 0; i < chunksCount; i++) {
      const start = i * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      
      // 创建分片（不包含实际数据，只记录位置信息）
      chunks.push({
        id: i,
        file: null as unknown as Blob, // 暂时不加载数据
        start,
        end,
        progress: uploadedChunks.includes(i) ? 100 : 0,
        status: uploadedChunks.includes(i) ? 'success' : 'pending',
        retries: 0,
      });
    }
    
    return chunks;
  };
  
  // 处理文件选择
  const handleFileSelect = (file: File) => {
    if (file.size > maxFileSize) {
      setError(`文件大小超过限制 (${(maxFileSize / (1024 * 1024)).toFixed(0)}MB)`);
      return;
    }
    
    // 加载之前的上传状态（用于断点续传）
    const uploadedChunks = loadUploadState(file);
    
    // 创建上传文件对象
    const newUploadFile: UploadFile = {
      id: `file-${Date.now()}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      chunks: createFileChunks(file, uploadedChunks),
      progress: 0,
      status: 'pending',
      uploadedChunks,
    };
    
    // 计算初始进度
    if (uploadedChunks.length > 0) {
      newUploadFile.progress = Math.floor((uploadedChunks.length / newUploadFile.chunks.length) * 100);
    }
    
    setUploadFile(newUploadFile);
  };
  
  // 上传单个分片（流式处理）
  const uploadChunk = useCallback(async (chunk: Chunk): Promise<void> => {
    // 如果分片已上传成功，直接返回
    if (chunk.status === 'success') {
      return;
    }
    
    // 更新分片状态为上传中
    setUploadFile(prev => {
      if (!prev) return prev;
      
      const updatedChunks = [...prev.chunks];
      updatedChunks[chunk.id] = {
        ...updatedChunks[chunk.id],
        status: 'uploading',
        progress: 0,
      };
      
      return {
        ...prev,
        chunks: updatedChunks,
      };
    });
    
    try {
      // 在上传前才读取文件分片内容（流式处理）
      const chunkWithData = {...chunk};
      if (!uploadFile) throw new Error('上传文件不存在');
      
      // 只在需要时才从文件中读取分片数据
      if (!chunk.file || chunk.file.size === 0) {
        chunkWithData.file = uploadFile.file.slice(chunk.start, chunk.end);
      }
      
      // 上传分片（实际项目中应替换为真实的上传API）
      await mockUploadChunk(chunkWithData);
      
      // 上传完成后释放内存
      chunkWithData.file = null as unknown as Blob;
      
      // 更新分片状态为成功
      setUploadFile(prev => {
        if (!prev) return prev;
        
        const updatedChunks = [...prev.chunks];
        updatedChunks[chunk.id] = {
          ...updatedChunks[chunk.id],
          status: 'success',
          progress: 100,
          file: null as unknown as Blob, // 释放内存
        };
        
        // 更新已上传的分片列表
        const newUploadedChunks = [...prev.uploadedChunks];
        if (!newUploadedChunks.includes(chunk.id)) {
          newUploadedChunks.push(chunk.id);
        }
        
        // 计算总体进度
        const totalProgress = Math.floor(
          updatedChunks.reduce((sum, c) => sum + c.progress, 0) / updatedChunks.length
        );
        
        const updatedFile = {
          ...prev,
          chunks: updatedChunks,
          uploadedChunks: newUploadedChunks,
          progress: totalProgress,
        };
        
        // 保存上传状态（用于断点续传）
        saveUploadState(updatedFile);
        
        // 调用进度回调
        if (onUploadProgress) {
          onUploadProgress(totalProgress);
        }
        
        return updatedFile;
      });
    } catch (error) {
      // 更新分片状态为错误
      setUploadFile(prev => {
        if (!prev) return prev;
        
        const updatedChunks = [...prev.chunks];
        const currentChunk = updatedChunks[chunk.id];
        
        // 如果重试次数未超过限制，则标记为待上传状态以便重试
        if (currentChunk.retries < config.retryTimes) {
          updatedChunks[chunk.id] = {
            ...currentChunk,
            status: 'pending',
            retries: currentChunk.retries + 1,
            file: null as unknown as Blob, // 释放内存
          };
        } else {
          // 重试次数已达上限，标记为错误状态
          updatedChunks[chunk.id] = {
            ...currentChunk,
            status: 'error',
            file: null as unknown as Blob, // 释放内存
          };
        }
        
        return {
          ...prev,
          chunks: updatedChunks,
          status: 'error',
        };
      });
      
      throw error;
    }
  }, [uploadFile, config, onUploadProgress]);
  
  // 处理下一个分片
  const processNextChunk = useCallback(async (): Promise<void> => {
    if (!uploadFile) return;
    
    let currentFile = uploadFile;
    
    while (currentFile) {
      const nextChunk = currentFile.chunks.find(chunk => chunk.status === 'pending');

      if (!nextChunk) {
        // 所有分片都已处理，开始合并
        await finalizeUpload();
        return;
      }

      try {
        await uploadChunk(nextChunk);
        // 获取最新的文件状态
        currentFile = uploadFile;
      } catch (error) {
        console.error('处理分片失败:', error);
        if (onUploadError) {
          onUploadError(error as Error);
        }
        return;
      }
    }
  }, [uploadFile, finalizeUpload, uploadChunk, onUploadError]);
  
  // 开始或继续上传
  const startUpload = useCallback(async () => {
    if (!uploadFile || uploadFile.status === 'uploading') return;
    
    // 更新文件状态为上传中
    setUploadFile(prev => {
      if (!prev) return prev;
      return { ...prev, status: 'uploading' };
    });
    
    try {
      // 获取待上传的分片
      const pendingChunks = uploadFile.chunks.filter(chunk => chunk.status === 'pending');
      
      // 如果所有分片都已上传，直接合并
      if (pendingChunks.length === 0) {
        await finalizeUpload();
        return;
      }
      
      // 使用队列方式处理分片，避免并发竞态条件
      await processNextChunk();
      
    } catch (error) {
      console.error('上传过程中发生错误:', error);
      
      // 更新文件状态为错误
      setUploadFile(prev => {
        if (!prev) return prev;
        return { ...prev, status: 'error' };
      });
      
      // 调用错误回调
      if (onUploadError && error instanceof Error) {
        onUploadError(error);
      }
    }
  }, [uploadFile, config, onUploadError, finalizeUpload, processNextChunk]);
  

  
  // 完成上传（合并分片）- 流式处理版本
  const finalizeUpload = useCallback(async () => {
    if (!uploadFile) return;
    
    try {
      // 合并分片（实际项目中应替换为真实的合并API）
      // 在流式处理中，服务器端负责合并分片，客户端只需发送合并请求
      await mockMergeChunks();
      
      // 更新文件状态为已完成
      setUploadFile(prev => {
        if (!prev) return prev;
        
        // 清空所有分片数据，释放内存
        const cleanedChunks = prev.chunks.map(chunk => ({
          ...chunk,
          file: null,
          status: 'success',
          progress: 100
        }));
        
        return { 
          ...prev, 
          status: 'completed', 
          progress: 100,
          chunks: cleanedChunks
        };
      });
      
      // 清除上传状态
      clearUploadState();
      
      // 调用完成回调
      if (onUploadComplete) {
        // 创建一个新的File对象引用，而不是保持对原始文件的引用
        // 这样原始文件可以被垃圾回收
        onUploadComplete(uploadFile.file);
      }
      
      // 调用进度回调
      if (onUploadProgress) {
        onUploadProgress(100);
      }
      
      // 主动提示垃圾回收
      if (window.gc) {
        try {
          window.gc();
        } catch {
          // 忽略错误
        }
      }
    } catch (error) {
      console.error('合并分片失败:', error);
      
      // 更新文件状态为错误
      setUploadFile(prev => {
        if (!prev) return prev;
        
        // 清空所有分片数据，释放内存
        const cleanedChunks = prev.chunks.map(chunk => ({
          ...chunk,
          file: null
        }));
        
        return { 
          ...prev, 
          status: 'error',
          chunks: cleanedChunks 
        };
      });
      
      // 调用错误回调
      if (onUploadError && error instanceof Error) {
        onUploadError(error);
      }
    }
  }, [uploadFile, onUploadComplete, onUploadError, onUploadProgress]);
  
  // 暂停上传
  const pauseUpload = () => {
    setUploadFile(prev => {
      if (!prev) return prev;
      return { ...prev, status: 'paused' };
    });
  };
  
  // 取消上传
  const cancelUpload = () => {
    setUploadFile(null);
    clearUploadState();
  };
  
  // 处理文件输入变化（流式处理）
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        // 获取文件引用，但不立即读取全部内容
        handleFileSelect(e.target.files[0]);
      } catch (error) {
        console.error('文件选择失败:', error);
        setError(error instanceof Error ? error.message : '文件选择失败');
      }
      
      // 清空input，避免内存泄漏
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // 处理拖拽事件（流式处理）
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      try {
        // 获取文件引用，但不立即读取全部内容
        handleFileSelect(e.dataTransfer.files[0]);
      } catch (error) {
        console.error('文件拖拽失败:', error);
        setError(error instanceof Error ? error.message : '文件拖拽失败');
      }
    }
  };
  
  // 处理点击上传区域
  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };
  
  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };
  
  // 自动开始上传
  useEffect(() => {
    if (uploadFile && uploadFile.status === 'pending') {
      startUpload();
    }
  }, [uploadFile, startUpload]);
  
  return (
    <div className={styles.container}>
      {/* 错误信息显示 */}
      {error && (
        <div className={`${styles.errorMessage} ${styles[theme]}`}>
          <span>❌ {error}</span>
          <button 
            className={styles.closeError}
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
      
      {/* 上传区域 */}
      {!uploadFile && (
        <div
          className={`${styles.uploadArea} ${styles[theme]} ${isDragging ? styles.dragging : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadAreaClick}
        >
          <div className={styles.uploadIcon}>📁</div>
          <div className={styles.uploadText}>拖拽文件到此处或点击上传</div>
          <div className={styles.uploadSubtext}>
            支持大文件分片上传，自动断点续传
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={accept}
            className={styles.fileInput}
          />
        </div>
      )}
      
      {/* 上传进度 */}
      {uploadFile && (
        <div className={`${styles.uploadProgress} ${styles[theme]}`}>
          <div className={styles.fileInfo}>
            <div className={styles.fileName}>{uploadFile.name}</div>
            <div className={styles.fileSize}>{formatFileSize(uploadFile.size)}</div>
          </div>
          
          <div className={styles.progressBarContainer}>
            <div 
              className={styles.progressBar} 
              style={{ width: `${uploadFile.progress}%` }}
            ></div>
          </div>
          
          <div className={styles.progressInfo}>
            <div className={styles.progressPercentage}>{uploadFile.progress}%</div>
            <div className={styles.progressStatus}>
              {uploadFile.status === 'uploading' && '上传中...'}
              {uploadFile.status === 'paused' && '已暂停'}
              {uploadFile.status === 'completed' && '上传完成'}
              {uploadFile.status === 'error' && '上传出错'}
            </div>
          </div>
          
          <div className={styles.uploadActions}>
            {uploadFile.status === 'uploading' && (
              <button 
                className={`${styles.actionButton} ${styles.pauseButton}`}
                onClick={pauseUpload}
              >
                暂停
              </button>
            )}
            
            {uploadFile.status === 'paused' && (
              <button 
                className={`${styles.actionButton} ${styles.resumeButton}`}
                onClick={startUpload}
              >
                继续
              </button>
            )}
            
            {uploadFile.status === 'error' && (
              <button 
                className={`${styles.actionButton} ${styles.retryButton}`}
                onClick={startUpload}
              >
                重试
              </button>
            )}
            
            {uploadFile.status !== 'completed' && (
              <button 
                className={`${styles.actionButton} ${styles.cancelButton}`}
                onClick={cancelUpload}
              >
                取消
              </button>
            )}
            
            {uploadFile.status === 'completed' && (
              <button 
                className={`${styles.actionButton} ${styles.newButton}`}
                onClick={cancelUpload}
              >
                上传新文件
              </button>
            )}
          </div>
          
          {/* 分片上传详情（可折叠） */}
          <details className={styles.chunksDetails}>
            <summary>分片详情 ({uploadFile.chunks.length}个分片)</summary>
            <div className={styles.chunksList}>
              {uploadFile.chunks.map(chunk => (
                <div 
                  key={chunk.id} 
                  className={`${styles.chunkItem} ${styles[chunk.status]}`}
                >
                  <div className={styles.chunkId}>分片 {chunk.id + 1}</div>
                  <div className={styles.chunkSize}>
                    {formatFileSize(chunk.end - chunk.start)}
                  </div>
                  <div className={styles.chunkProgress}>
                    <div 
                      className={styles.chunkProgressBar}
                      style={{ width: `${chunk.progress}%` }}
                    ></div>
                  </div>
                  <div className={styles.chunkStatus}>
                    {chunk.status === 'pending' && '等待中'}
                    {chunk.status === 'uploading' && '上传中'}
                    {chunk.status === 'success' && '已完成'}
                    {chunk.status === 'error' && `失败 (${chunk.retries}/${config.retryTimes})`}
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default ChunkedUploader;