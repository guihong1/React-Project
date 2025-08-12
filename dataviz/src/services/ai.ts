import type { AIModel, DataPoint } from '../types';
import { 
  basicAnalysisPrompt, 
  advancedAnalysisPrompt, 
  businessInsightPrompt,
  predictionAnalysisPrompt,
  anomalyDetectionPrompt,
  correlationAnalysisPrompt,
  clusteringAnalysisPrompt,
  createPrompt
} from './prompts';

/**
 * AI服务类 - 处理与AI模型的通信
 */
class AIService {
  private readonly DEFAULT_TIMEOUT = 30000; // 30秒超时
  private readonly MAX_RETRIES = 3; // 最大重试次数

  /**
   * 创建带超时的fetch请求
   */
  private async fetchWithTimeout(url: string, options: RequestInit, timeout: number = this.DEFAULT_TIMEOUT): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求超时');
      }
      throw error;
    }
  }

  /**
   * 带重试的请求方法
   */
  private async fetchWithRetry(url: string, options: RequestInit, retries: number = this.MAX_RETRIES): Promise<Response> {
    let lastError: Error;
    
    for (let i = 0; i <= retries; i++) {
      try {
        return await this.fetchWithTimeout(url, options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (i === retries) {
          throw lastError;
        }
        
        // 指数退避延迟
        const delay = Math.min(1000 * Math.pow(2, i), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
  /**
   * 测试AI模型连接
   * @param model AI模型配置
   * @returns 包含测试结果的Promise
   */
  async testConnection(model: AIModel): Promise<{ success: boolean; message: string; latency?: number }> {
    if (!model || !model.apiEndpoint || !model.apiKey) {
      return { success: false, message: 'API配置不完整' };
    }

    const startTime = Date.now();
    
    try {
      // 根据不同提供商实现测试逻辑
      let result;
      switch (model.provider.toLowerCase()) {
        case 'openai':
          result = await this.testOpenAI(model);
          break;
        case '百度':
          result = await this.testBaidu(model);
          break;
        case '阿里云':
          result = await this.testAliyun(model);
          break;
        default:
          result = await this.testGeneric(model);
      }

      const latency = Date.now() - startTime;
      return { ...result, latency };
    } catch (error) {
      console.error('AI连接测试失败:', error);
      return { 
        success: false, 
        message: `连接失败: ${error instanceof Error ? error.message : String(error)}`,
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * 测试OpenAI连接
   */
  private async testOpenAI(model: AIModel): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.fetchWithRetry(`${model.apiEndpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${model.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: '这是一个测试请求，请回复"连接成功"' }
          ],
          max_tokens: 20
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || '连接失败');
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      return { 
        success: true, 
        message: `连接成功: ${content.substring(0, 30)}` 
      };
    } catch (error) {
      console.error('OpenAI连接测试失败:', error);
      throw error;
    }
  }

  /**
   * 测试百度文心一言连接
   */
  private async testBaidu(model: AIModel): Promise<{ success: boolean; message: string }> {
    try {
      // 获取访问令牌
      const accessToken = await this.getBaiduAccessToken(model);
      
      const response = await this.fetchWithRetry(model.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: '这是一个测试请求，请回复"连接成功"' }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error_msg || '连接失败');
      }

      const data = await response.json();
      const content = data.result || '';
      
      return { 
        success: true, 
        message: `连接成功: ${content.substring(0, 30)}` 
      };
    } catch (error) {
      console.error('百度文心一言连接测试失败:', error);
      throw error;
    }
  }

  /**
   * 获取百度API访问令牌
   */
  private async getBaiduAccessToken(model: AIModel): Promise<string> {
    // 这里应该实现获取百度API访问令牌的逻辑
    // 实际项目中需要根据百度API文档实现
    // 这里简化处理，直接返回API密钥
    return model.apiKey;
  }

  /**
   * 测试阿里云通义千问连接
   */
  private async testAliyun(model: AIModel): Promise<{ success: boolean; message: string }> {
    try {
      // 使用代理URL替代直接访问阿里云API
      const proxyUrl = '/api/qwen';
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${model.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen-turbo',
          input: {
            messages: [
              { role: 'system', content: 'You are a helpful assistant.' },
              { role: 'user', content: '这是一个测试请求，请回复"连接成功"' }
            ]
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '连接失败');
      }

      const data = await response.json();
      const content = data.output?.text || '';
      
      return { 
        success: true, 
        message: `连接成功: ${content.substring(0, 30)}` 
      };
    } catch (error) {
      console.error('阿里云通义千问连接测试失败:', error);
      throw error;
    }
  }

  /**
   * 通用API测试方法
   */
  private async testGeneric(model: AIModel): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(model.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${model.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: '这是一个测试请求，请回复"连接成功"',
          max_tokens: 20
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      return { success: true, message: '连接成功' };
    } catch (error) {
      console.error('API连接测试失败:', error);
      throw error;
    }
  }

  /**
   * 使用AI分析数据
   * @param model AI模型配置
   * @param data 要分析的数据
   * @param analysisType 分析类型
   * @returns 包含分析结果的Promise
   */
  async analyzeData(model: AIModel, data: DataPoint[], analysisType: string = 'basic'): Promise<string[]> {
    if (!model || !model.apiEndpoint || !model.apiKey) {
      throw new Error('API配置不完整');
    }

    try {
      // 根据不同提供商实现分析逻辑
      switch (model.provider.toLowerCase()) {
        case 'openai':
          return await this.analyzeWithOpenAI(model, data, analysisType);
        case '百度':
          return await this.analyzeWithBaidu(model, data, analysisType);
        case '阿里云':
          return await this.analyzeWithAliyun(model, data, analysisType);
        default:
          return await this.analyzeWithGeneric(model, data, analysisType);
      }
    } catch (error) {
      console.error('AI数据分析失败:', error);
      throw error;
    }
  }

  /**
   * 使用OpenAI分析数据
   */
  private async analyzeWithOpenAI(model: AIModel, data: DataPoint[], analysisType: string = 'basic'): Promise<string[]> {
    try {
      const prompt = this.createAnalysisPrompt(data, analysisType);
      
      const response = await fetch(`${model.apiEndpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${model.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: '你是一位专业的数据分析师，请提供清晰、有见解的数据分析结果。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || '分析失败');
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      // 将返回的内容按行分割并过滤空行
      return this.parseAnalysisResult(content);
    } catch (error) {
      console.error('OpenAI数据分析失败:', error);
      throw error;
    }
  }

  /**
   * 使用百度文心一言分析数据
   */
  private async analyzeWithBaidu(model: AIModel, data: DataPoint[], analysisType: string = 'basic'): Promise<string[]> {
    try {
      // 获取访问令牌
      const accessToken = await this.getBaiduAccessToken(model);
      const prompt = this.createAnalysisPrompt(data, analysisType);
      
      const response = await fetch(model.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: prompt }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error_msg || '分析失败');
      }

      const responseData = await response.json();
      const content = responseData.result || '';
      
      return this.parseAnalysisResult(content);
    } catch (error) {
      console.error('百度文心一言数据分析失败:', error);
      throw error;
    }
  }

  /**
   * 使用阿里云通义千问分析数据
   */
  private async analyzeWithAliyun(model: AIModel, data: DataPoint[], analysisType: string = 'basic'): Promise<string[]> {
    try {
      const prompt = this.createAnalysisPrompt(data, analysisType);
      
      // 使用代理URL替代直接访问阿里云API
      const proxyUrl = '/api/qwen';
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${model.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen-turbo',
          input: {
            messages: [
              { role: 'system', content: '你是一位专业的数据分析师，请提供清晰、有见解的数据分析结果。' },
              { role: 'user', content: prompt }
            ]
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '分析失败');
      }

      const responseData = await response.json();
      const content = responseData.output?.text || '';
      
      return this.parseAnalysisResult(content);
    } catch (error) {
      console.error('阿里云通义千问数据分析失败:', error);
      throw error;
    }
  }

  /**
   * 使用通用方法分析数据
   */
  private async analyzeWithGeneric(model: AIModel, data: DataPoint[], analysisType: string = 'basic'): Promise<string[]> {
    try {
      const prompt = this.createAnalysisPrompt(data, analysisType);
      
      const response = await fetch(model.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${model.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      const responseData = await response.json();
      const content = responseData.text || responseData.content || responseData.result || '';
      
      return this.parseAnalysisResult(content);
    } catch (error) {
      console.error('通用API数据分析失败:', error);
      throw error;
    }
  }

  /**
   * 创建数据分析提示词
   * @param data 要分析的数据
   * @param analysisType 分析类型
   * @returns 填充了数据的提示词
   */
  private createAnalysisPrompt(data: DataPoint[], analysisType: string = 'basic'): string {
    // 根据分析类型选择不同的提示词模板
    let template;
    switch (analysisType) {
      case 'advanced':
        template = advancedAnalysisPrompt;
        break;
      case 'business':
        template = businessInsightPrompt;
        break;
      case 'prediction':
        template = predictionAnalysisPrompt;
        break;
      case 'anomaly':
        template = anomalyDetectionPrompt;
        break;
      case 'correlation':
        template = correlationAnalysisPrompt;
        break;
      case 'clustering':
        template = clusteringAnalysisPrompt;
        break;
      case 'basic':
      default:
        template = basicAnalysisPrompt;
    }
    
    // 使用提示词工具创建最终提示词
    return createPrompt(data, template);
  }

  /**
   * 解析分析结果
   */
  private parseAnalysisResult(content: string): string[] {
    // 将返回的内容按行分割并过滤空行
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    // 保留Markdown格式，只进行基本处理
    const insights = lines.map(line => {
      // 保留Markdown标记，只处理可能的前导空格
      return line.trim();
    });
    
    return insights;
  }
}

// 导出单例
export const aiService = new AIService();