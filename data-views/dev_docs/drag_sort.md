# 图表拖拽排序功能开发文档

## 功能概述

实现仪表板中图表的拖拽排序功能，允许用户通过拖拽操作调整图表在仪表板中的位置和布局，提升用户体验和仪表板的可定制性。

## 需求分析

### 功能需求

1. **基础拖拽功能**
   - 支持图表卡片的拖拽移动
   - 拖拽过程中显示半透明预览效果
   - 拖拽结束后平滑过渡到新位置

2. **布局调整**
   - 支持自动调整其他图表的位置以适应拖拽后的布局
   - 支持网格对齐功能，确保图表排列整齐
   - 支持不同尺寸图表的合理布局

3. **用户体验**
   - 拖拽过程中提供视觉反馈
   - 支持拖拽取消操作（如按ESC键）
   - 拖拽完成后自动保存布局状态

4. **响应式设计**
   - 在不同屏幕尺寸下保持良好的拖拽体验
   - 移动设备上支持触摸拖拽

### 用户场景

1. 用户希望调整仪表板中图表的展示顺序，将重要的图表移到更显眼的位置
2. 用户希望根据数据的逻辑关系重新组织图表的布局
3. 用户希望优化仪表板的视觉效果，使相关的图表放置在一起

## 技术方案

### 技术选型

使用 `react-grid-layout` 库实现拖拽排序功能，该库提供了以下优势：

- 支持响应式网格布局
- 内置拖拽和调整大小功能
- 支持碰撞检测和自动布局调整
- 提供丰富的事件回调和自定义选项
- 与React组件系统完美集成

### 数据结构设计

需要扩展现有的仪表板和图表数据结构，添加位置和尺寸信息：

```typescript
// 扩展图表配置，添加布局信息
interface ChartLayoutInfo {
  x: number;      // 网格中的x坐标（列位置）
  y: number;      // 网格中的y坐标（行位置）
  w: number;      // 宽度（占用的列数）
  h: number;      // 高度（占用的行数）
  minW?: number;  // 最小宽度
  minH?: number;  // 最小高度
  maxW?: number;  // 最大宽度
  maxH?: number;  // 最大高度
  static?: boolean; // 是否禁止拖拽
}

// 更新图表配置接口
interface ChartConfig {
  // 现有字段...
  layout?: ChartLayoutInfo; // 添加布局信息
}

// 仪表板布局配置
interface DashboardLayout {
  cols: number;   // 网格列数
  rowHeight: number; // 行高
  containerPadding: [number, number]; // 容器内边距 [水平, 垂直]
  margin: [number, number]; // 项目间距 [水平, 垂直]
}

// 更新仪表板接口
interface Dashboard {
  // 现有字段...
  layout: DashboardLayout; // 添加布局配置
}
```

## 实现步骤

### 1. 安装依赖

```bash
npm install react-grid-layout @types/react-grid-layout
```

### 2. 更新类型定义

修改 `src/types/chart.ts` 和 `src/types/index.ts`，添加布局相关的接口定义。

### 3. 更新状态管理

修改 `src/store/index.ts`，添加布局相关的状态和操作：

```typescript
// 在 useAppStore 中添加布局相关状态和操作
const useAppStore = create<AppStore>((set, get) => ({
  // 现有状态...
  
  // 更新图表布局
  updateChartLayout: (dashboardId: string, chartId: string, layout: ChartLayoutInfo) => {
    set((state) => {
      const dashboards = [...state.dashboards];
      const dashboardIndex = dashboards.findIndex(d => d.id === dashboardId);
      
      if (dashboardIndex === -1) return state;
      
      const dashboard = { ...dashboards[dashboardIndex] };
      const chartIndex = dashboard.charts.findIndex(c => c.id === chartId);
      
      if (chartIndex === -1) return state;
      
      const charts = [...dashboard.charts];
      charts[chartIndex] = {
        ...charts[chartIndex],
        layout: layout
      };
      
      dashboard.charts = charts;
      dashboards[dashboardIndex] = dashboard;
      
      // 保存到localStorage
      localStorage.setItem('dashboards', JSON.stringify(dashboards));
      
      return { ...state, dashboards };
    });
  },
  
  // 更新整个仪表板布局
  updateDashboardLayout: (dashboardId: string, layouts: Record<string, ChartLayoutInfo>) => {
    set((state) => {
      const dashboards = [...state.dashboards];
      const dashboardIndex = dashboards.findIndex(d => d.id === dashboardId);
      
      if (dashboardIndex === -1) return state;
      
      const dashboard = { ...dashboards[dashboardIndex] };
      const charts = dashboard.charts.map(chart => ({
        ...chart,
        layout: layouts[chart.id] || chart.layout
      }));
      
      dashboard.charts = charts;
      dashboards[dashboardIndex] = dashboard;
      
      // 保存到localStorage
      localStorage.setItem('dashboards', JSON.stringify(dashboards));
      
      return { ...state, dashboards };
    });
  },
  
  // 更新仪表板布局配置
  updateDashboardLayoutConfig: (dashboardId: string, layoutConfig: DashboardLayout) => {
    set((state) => {
      const dashboards = [...state.dashboards];
      const dashboardIndex = dashboards.findIndex(d => d.id === dashboardId);
      
      if (dashboardIndex === -1) return state;
      
      dashboards[dashboardIndex] = {
        ...dashboards[dashboardIndex],
        layout: layoutConfig
      };
      
      // 保存到localStorage
      localStorage.setItem('dashboards', JSON.stringify(dashboards));
      
      return { ...state, dashboards };
    });
  }
}));
```

### 4. 实现拖拽布局组件

创建 `src/components/DraggableDashboard.tsx` 组件：

```typescript
import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useAppStore } from '../store';
import { Chart } from './Chart';
import { ChartLayoutInfo } from '../types';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DraggableDashboardProps {
  dashboardId: string;
  onEditChart?: (chartId: string) => void;
  isEditMode?: boolean;
}

export const DraggableDashboard: React.FC<DraggableDashboardProps> = ({
  dashboardId,
  onEditChart,
  isEditMode = false
}) => {
  const { dashboards, updateDashboardLayout, theme } = useAppStore();
  const dashboard = dashboards.find(d => d.id === dashboardId);
  
  // 如果找不到仪表板，显示错误信息
  if (!dashboard) {
    return <div>仪表板不存在</div>;
  }
  
  // 默认布局配置
  const defaultLayoutConfig = {
    cols: 12,
    rowHeight: 30,
    containerPadding: [10, 10] as [number, number],
    margin: [10, 10] as [number, number]
  };
  
  // 使用仪表板中的布局配置或默认配置
  const layoutConfig = dashboard.layout || defaultLayoutConfig;
  
  // 生成布局数据
  const generateLayouts = () => {
    const layouts: Record<string, any> = {};
    
    // 为每个断点创建布局
    ['lg', 'md', 'sm', 'xs', 'xxs'].forEach(breakpoint => {
      layouts[breakpoint] = dashboard.charts.map((chart, index) => {
        // 如果图表已有布局信息，使用它
        if (chart.layout) {
          return {
            i: chart.id,
            ...chart.layout,
            static: !isEditMode // 非编辑模式下禁止拖拽
          };
        }
        
        // 否则生成默认布局
        // 默认每行放置2个图表
        const cols = breakpoint === 'lg' ? 2 : 
                    breakpoint === 'md' ? 2 : 
                    breakpoint === 'sm' ? 1 : 1;
        
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        return {
          i: chart.id,
          x: col * (12 / cols),
          y: row * 10,
          w: 12 / cols,
          h: 10,
          minW: 3,
          minH: 3,
          static: !isEditMode // 非编辑模式下禁止拖拽
        };
      });
    });
    
    return layouts;
  };
  
  const [layouts, setLayouts] = useState(generateLayouts());
  
  // 当仪表板或编辑模式变化时重新生成布局
  useEffect(() => {
    setLayouts(generateLayouts());
  }, [dashboard, isEditMode]);
  
  // 处理布局变化
  const handleLayoutChange = (currentLayout: any, allLayouts: any) => {
    setLayouts(allLayouts);
    
    // 更新布局到store
    const layoutUpdates: Record<string, ChartLayoutInfo> = {};
    currentLayout.forEach((item: any) => {
      layoutUpdates[item.i] = {
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: item.minW,
        minH: item.minH,
        static: !isEditMode
      };
    });
    
    updateDashboardLayout(dashboardId, layoutUpdates);
  };
  
  return (
    <div style={{ 
      width: '100%', 
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
      padding: '10px',
      borderRadius: '8px',
      transition: 'all 0.3s ease'
    }}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: layoutConfig.cols, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={layoutConfig.rowHeight}
        containerPadding={layoutConfig.containerPadding}
        margin={layoutConfig.margin}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        draggableHandle=".chart-drag-handle"
      >
        {dashboard.charts.map(chart => (
          <div key={chart.id} style={{ 
            backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {isEditMode && (
              <div className="chart-drag-handle" style={{
                padding: '8px',
                cursor: 'move',
                backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0',
                borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#e0e0e0'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{chart.title}</span>
                {onEditChart && (
                  <button
                    onClick={() => onEditChart(chart.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: theme === 'dark' ? '#aaa' : '#666'
                    }}
                  >
                    编辑
                  </button>
                )}
              </div>
            )}
            <div style={{ flex: 1, padding: '10px' }}>
              <Chart config={chart} />
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};
```

### 5. 更新Dashboard组件

修改 `src/components/Dashboard.tsx`，使用新的拖拽布局组件：

```typescript
import React, { useState } from 'react';
import { useAppStore } from '../store';
import { DraggableDashboard } from './DraggableDashboard';

interface DashboardProps {
  onEditChart?: (chartId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onEditChart }) => {
  const { currentDashboard, theme } = useAppStore();
  const [isEditMode, setIsEditMode] = useState(false);
  
  if (!currentDashboard) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        color: theme === 'dark' ? '#fff' : '#333'
      }}>
        请选择或创建一个仪表板
      </div>
    );
  }
  
  return (
    <div style={{ 
      padding: '20px',
      backgroundColor: theme === 'dark' ? '#121212' : '#ffffff',
      color: theme === 'dark' ? '#fff' : '#333',
      minHeight: '100vh',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2>{currentDashboard.title}</h2>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          style={{
            padding: '8px 16px',
            backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0',
            color: theme === 'dark' ? '#fff' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          {isEditMode ? '完成编辑' : '编辑布局'}
        </button>
      </div>
      
      {currentDashboard.charts.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
          borderRadius: '8px'
        }}>
          当前仪表板没有图表，请添加图表
        </div>
      ) : (
        <DraggableDashboard 
          dashboardId={currentDashboard.id} 
          onEditChart={onEditChart}
          isEditMode={isEditMode}
        />
      )}
    </div>
  );
};
```

### 6. 更新Home组件

修改 `src/pages/Home.tsx`，传递编辑图表的回调函数：

```typescript
// 在Home组件中
{activeTab === 'dashboard' && (
  <Dashboard 
    onEditChart={(chartId) => {
      setEditingChartId(chartId);
      setIsEditing(true);
      handleTabChange('create');
    }}
  />
)}
```

### 7. 添加布局配置到仪表板管理

在 `src/components/DashboardManager.tsx` 中添加布局配置选项：

```typescript
// 在编辑仪表板部分添加布局配置
{editingDashboard && (
  <div style={{ marginTop: '20px' }}>
    <h3>布局配置</h3>
    <div style={{ marginBottom: '10px' }}>
      <label style={{ display: 'block', marginBottom: '5px' }}>网格列数:</label>
      <input
        type="number"
        min="1"
        max="24"
        value={layoutConfig.cols}
        onChange={(e) => setLayoutConfig({
          ...layoutConfig,
          cols: parseInt(e.target.value) || 12
        })}
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
    <div style={{ marginBottom: '10px' }}>
      <label style={{ display: 'block', marginBottom: '5px' }}>行高(px):</label>
      <input
        type="number"
        min="10"
        max="100"
        value={layoutConfig.rowHeight}
        onChange={(e) => setLayoutConfig({
          ...layoutConfig,
          rowHeight: parseInt(e.target.value) || 30
        })}
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
    <div style={{ marginBottom: '10px' }}>
      <label style={{ display: 'block', marginBottom: '5px' }}>图表间距(水平,垂直):</label>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="number"
          min="0"
          max="50"
          value={layoutConfig.margin[0]}
          onChange={(e) => setLayoutConfig({
            ...layoutConfig,
            margin: [parseInt(e.target.value) || 10, layoutConfig.margin[1]]
          })}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '4px',
            border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
            backgroundColor: theme === 'dark' ? '#333' : '#fff',
            color: theme === 'dark' ? '#fff' : '#333'
          }}
        />
        <input
          type="number"
          min="0"
          max="50"
          value={layoutConfig.margin[1]}
          onChange={(e) => setLayoutConfig({
            ...layoutConfig,
            margin: [layoutConfig.margin[0], parseInt(e.target.value) || 10]
          })}
          style={{
            flex: 1,
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
```

## 测试计划

### 功能测试

1. **基础拖拽功能**
   - 测试图表拖拽移动是否正常
   - 验证拖拽过程中的视觉反馈
   - 测试拖拽结束后的位置保存

2. **布局调整**
   - 测试不同尺寸图表的布局效果
   - 验证网格对齐功能
   - 测试图表碰撞时的自动调整

3. **响应式布局**
   - 测试在不同屏幕尺寸下的布局适应
   - 验证移动设备上的触摸拖拽功能

### 兼容性测试

1. 测试在不同浏览器中的拖拽功能
2. 测试在不同设备（桌面、平板、手机）上的使用体验

### 性能测试

1. 测试大量图表时的拖拽性能
2. 测试频繁拖拽操作时的响应速度

## 注意事项

1. `react-grid-layout` 库的样式文件需要正确导入，否则拖拽功能可能无法正常工作
2. 移动设备上的触摸拖拽需要特别注意用户体验，可能需要调整拖拽手柄的大小和位置
3. 布局数据会增加存储空间占用，需要考虑localStorage的容量限制
4. 编辑模式和查看模式的切换需要明确的视觉区分，避免用户误操作

## 参考资源

- [react-grid-layout 文档](https://github.com/react-grid-layout/react-grid-layout)
- [响应式布局最佳实践](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [拖拽交互设计指南](https://www.nngroup.com/articles/drag-drop/)