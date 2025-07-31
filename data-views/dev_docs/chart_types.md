# 新增图表类型开发文档

## 功能概述

扩展 DataViz 平台的图表类型，增加散点图、雷达图等新的可视化图表类型，丰富数据展示形式，满足更多样化的数据可视化需求。

## 需求分析

### 功能需求

1. **新增散点图**
   - 支持X轴和Y轴数据映射
   - 支持气泡大小映射（可选）
   - 支持自定义点的颜色和形状
   - 支持缩放和平移交互

2. **新增雷达图**
   - 支持多维数据展示
   - 支持多组数据比较
   - 支持自定义轴标签和刻度
   - 支持填充区域颜色和透明度设置

3. **通用需求**
   - 与现有图表组件保持一致的API和使用方式
   - 支持响应式布局
   - 支持深色/浅色主题切换
   - 支持图例和提示框

### 用户场景

1. **散点图应用场景**
   - 分析两个变量之间的相关性
   - 展示分组数据的分布情况
   - 识别数据中的异常点和聚类

2. **雷达图应用场景**
   - 比较多个产品在多个维度上的表现
   - 展示个体在不同能力指标上的评分
   - 分析全面的性能指标

## 技术方案

### 技术选型

继续使用 Recharts 库作为图表实现的基础，该库已经提供了散点图和雷达图的基础组件：

- 散点图：`ScatterChart`, `Scatter`, `ZAxis`
- 雷达图：`RadarChart`, `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`, `Radar`

### 数据结构设计

#### 散点图数据结构

```typescript
interface ScatterDataPoint {
  id: string;
  x: number;  // X轴值
  y: number;  // Y轴值
  z?: number; // 气泡大小（可选）
  name?: string; // 数据点名称（可选）
}

interface ScatterChartConfig extends ChartConfig {
  type: 'scatter';
  data: ScatterDataPoint[];
  xAxisName?: string; // X轴名称
  yAxisName?: string; // Y轴名称
  showBubble?: boolean; // 是否显示气泡大小
}
```

#### 雷达图数据结构

```typescript
interface RadarDataPoint {
  subject: string; // 维度名称
  value: number;   // 该维度的值
  fullMark?: number; // 该维度的满分值（可选）
}

interface RadarChartConfig extends ChartConfig {
  type: 'radar';
  data: RadarDataPoint[][];
  legendNames?: string[]; // 多组数据的图例名称
}
```

## 实现步骤

### 1. 更新类型定义

1. 修改 `src/types/chart.ts`，添加新的图表类型和配置接口

```typescript
// 更新 ChartType 枚举
export enum ChartType {
  BAR = 'bar',
  LINE = 'line',
  PIE = 'pie',
  SCATTER = 'scatter', // 新增
  RADAR = 'radar'      // 新增
}

// 添加新的数据点接口
export interface ScatterDataPoint {
  // 如上定义
}

export interface RadarDataPoint {
  // 如上定义
}

// 更新 ChartConfig 类型
export type ChartConfig = BarChartConfig | LineChartConfig | PieChartConfig | 
  ScatterChartConfig | RadarChartConfig;
```

### 2. 实现散点图组件

在 `src/components/Chart.tsx` 中添加散点图渲染逻辑：

```typescript
// 散点图渲染函数
const renderScatterChart = (config: ScatterChartConfig) => {
  return (
    <ScatterChart
      width={config.width || 400}
      height={config.height || 300}
      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis 
        type="number" 
        dataKey="x" 
        name={config.xAxisName || 'X'} 
        unit="" 
      />
      <YAxis 
        type="number" 
        dataKey="y" 
        name={config.yAxisName || 'Y'} 
        unit="" 
      />
      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
      <Legend />
      {config.showBubble && <ZAxis type="number" dataKey="z" range={[50, 500]} />}
      <Scatter 
        name={config.title} 
        data={config.data} 
        fill={theme === 'dark' ? '#8884d8' : '#82ca9d'} 
      />
    </ScatterChart>
  );
};
```

### 3. 实现雷达图组件

在 `src/components/Chart.tsx` 中添加雷达图渲染逻辑：

```typescript
// 雷达图渲染函数
const renderRadarChart = (config: RadarChartConfig) => {
  const colors = theme === 'dark' 
    ? ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe']
    : ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];
    
  return (
    <RadarChart 
      width={config.width || 400} 
      height={config.height || 300}
      cx="50%" 
      cy="50%" 
      outerRadius="80%" 
      data={config.data[0]} // 使用第一组数据作为基础数据
    >
      <PolarGrid />
      <PolarAngleAxis dataKey="subject" />
      <PolarRadiusAxis />
      {config.data.map((dataSet, index) => (
        <Radar
          key={index}
          name={config.legendNames?.[index] || `数据集 ${index + 1}`}
          dataKey="value"
          stroke={colors[index % colors.length]}
          fill={colors[index % colors.length]}
          fillOpacity={0.6}
          data={dataSet}
        />
      ))}
      <Legend />
      <Tooltip />
    </RadarChart>
  );
};
```

### 4. 更新Chart组件的渲染逻辑

修改 `src/components/Chart.tsx` 中的主渲染函数，添加对新图表类型的支持：

```typescript
export const Chart: React.FC<ChartProps> = ({ config }) => {
  const { theme } = useAppStore();
  
  // 根据图表类型渲染不同的图表
  const renderChart = () => {
    switch (config.type) {
      case ChartType.BAR:
        return renderBarChart(config as BarChartConfig);
      case ChartType.LINE:
        return renderLineChart(config as LineChartConfig);
      case ChartType.PIE:
        return renderPieChart(config as PieChartConfig);
      case ChartType.SCATTER:
        return renderScatterChart(config as ScatterChartConfig);
      case ChartType.RADAR:
        return renderRadarChart(config as RadarChartConfig);
      default:
        return <div>不支持的图表类型</div>;
    }
  };
  
  // 其余代码保持不变...
};
```

### 5. 更新图表编辑器

修改 `src/components/ChartEditor.tsx`，添加对新图表类型的支持：

```typescript
// 在图表类型选择部分添加新选项
<select
  value={chartType}
  onChange={(e) => setChartType(e.target.value as ChartType)}
  // 样式保持不变...
>
  <option value={ChartType.BAR}>柱状图</option>
  <option value={ChartType.LINE}>折线图</option>
  <option value={ChartType.PIE}>饼图</option>
  <option value={ChartType.SCATTER}>散点图</option>
  <option value={ChartType.RADAR}>雷达图</option>
</select>
```

### 6. 添加图表类型特定的配置选项

为散点图和雷达图添加特定的配置选项：

```typescript
// 散点图特定配置
{chartType === ChartType.SCATTER && (
  <div>
    <div style={{ marginBottom: '10px' }}>
      <label style={{ display: 'block', marginBottom: '5px' }}>X轴名称:</label>
      <input
        type="text"
        value={xAxisName}
        onChange={(e) => setXAxisName(e.target.value)}
        // 样式保持不变...
      />
    </div>
    <div style={{ marginBottom: '10px' }}>
      <label style={{ display: 'block', marginBottom: '5px' }}>Y轴名称:</label>
      <input
        type="text"
        value={yAxisName}
        onChange={(e) => setYAxisName(e.target.value)}
        // 样式保持不变...
      />
    </div>
    <div style={{ marginBottom: '10px' }}>
      <label style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={showBubble}
          onChange={(e) => setShowBubble(e.target.checked)}
          style={{ marginRight: '5px' }}
        />
        显示气泡大小
      </label>
    </div>
  </div>
)}

// 雷达图特定配置
{chartType === ChartType.RADAR && (
  <div>
    <div style={{ marginBottom: '10px' }}>
      <label style={{ display: 'block', marginBottom: '5px' }}>数据集名称 (用逗号分隔):</label>
      <input
        type="text"
        value={legendNames.join(',')}
        onChange={(e) => setLegendNames(e.target.value.split(','))}
        // 样式保持不变...
      />
    </div>
  </div>
)}
```

### 7. 更新数据转换逻辑

为新的图表类型添加数据转换逻辑，将标准数据格式转换为散点图和雷达图所需的格式：

```typescript
// 转换为散点图数据
const convertToScatterData = (data: DataPoint[]): ScatterDataPoint[] => {
  return data.map((item, index) => ({
    id: item.id,
    name: item.name,
    // 这里使用索引作为X轴，值作为Y轴，实际应用中可能需要更复杂的映射
    x: index + 1,
    y: item.value,
    // 可选的气泡大小，这里使用值的平方根作为示例
    z: Math.sqrt(item.value) * 5
  }));
};

// 转换为雷达图数据
const convertToRadarData = (data: DataPoint[]): RadarDataPoint[] => {
  return data.map(item => ({
    subject: item.name,
    value: item.value,
    fullMark: Math.max(...data.map(d => d.value)) * 1.2 // 设置一个略高于最大值的满分值
  }));
};
```

### 8. 更新保存图表逻辑

修改保存图表的逻辑，处理新图表类型的特殊配置：

```typescript
const handleSave = () => {
  let chartConfig: ChartConfig;
  
  switch (chartType) {
    // 现有图表类型处理...
    
    case ChartType.SCATTER:
      chartConfig = {
        id: editingChartId || generateId(),
        type: ChartType.SCATTER,
        title: chartTitle,
        data: convertToScatterData(selectedData),
        width: chartWidth,
        height: chartHeight,
        xAxisName,
        yAxisName,
        showBubble
      };
      break;
      
    case ChartType.RADAR:
      // 对于雷达图，我们需要将数据分组
      // 这里简化处理，只创建一个数据组
      chartConfig = {
        id: editingChartId || generateId(),
        type: ChartType.RADAR,
        title: chartTitle,
        data: [convertToRadarData(selectedData)],
        width: chartWidth,
        height: chartHeight,
        legendNames
      };
      break;
      
    default:
      return;
  }
  
  // 保存逻辑保持不变...
};
```

## 测试计划

### 单元测试

1. 测试新增的数据转换函数
2. 测试图表配置的验证逻辑

### 功能测试

1. **散点图测试**
   - 验证散点图正确显示X和Y轴数据
   - 测试气泡大小功能的开启和关闭
   - 验证主题切换时散点图样式正确变化
   - 测试图例和提示框功能

2. **雷达图测试**
   - 验证雷达图正确显示多维数据
   - 测试多组数据的显示
   - 验证主题切换时雷达图样式正确变化
   - 测试图例和提示框功能

### 兼容性测试

1. 测试在不同浏览器中的显示效果
2. 测试在不同屏幕尺寸下的响应式布局

## 注意事项

1. 散点图和雷达图的数据结构与现有的数据结构有较大差异，需要设计合理的数据转换逻辑
2. 雷达图适合展示多维数据，但维度过多会影响可读性，建议限制在5-8个维度
3. 散点图的数据点过多可能影响性能，需要考虑数据量较大时的优化策略

## 参考资源

- [Recharts 散点图文档](http://recharts.org/en-US/api/ScatterChart)
- [Recharts 雷达图文档](http://recharts.org/en-US/api/RadarChart)
- [散点图设计最佳实践](https://datavizcatalogue.com/methods/scatterplot.html)
- [雷达图设计最佳实践](https://datavizcatalogue.com/methods/radar_chart.html)