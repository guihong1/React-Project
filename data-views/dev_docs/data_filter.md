# 数据筛选和过滤功能开发文档

## 功能概述

为DataViz平台添加数据筛选和过滤功能，使用户能够根据特定条件筛选数据，实现更精确的数据可视化和分析。该功能将支持多种筛选方式，包括范围筛选、类别筛选、文本搜索和高级条件筛选等，提升用户对数据的控制能力和分析效率。

## 需求分析

### 功能需求

1. **基础筛选功能**
   - 数值范围筛选：支持设置最小值和最大值
   - 类别筛选：支持选择/取消选择特定类别
   - 文本搜索：支持按关键词搜索数据
   - 日期范围筛选：支持选择时间段

2. **高级筛选功能**
   - 多条件组合筛选：支持AND/OR逻辑组合多个筛选条件
   - 自定义筛选规则：支持用户定义复杂的筛选表达式
   - 排除筛选：支持定义排除特定数据的规则

3. **筛选管理**
   - 保存筛选方案：允许用户保存常用的筛选设置
   - 重置筛选：一键清除所有筛选条件
   - 筛选历史：记录最近使用的筛选条件

4. **用户体验**
   - 实时预览：筛选条件变化时实时更新图表
   - 筛选状态指示：清晰显示当前应用的筛选条件
   - 响应式设计：在不同设备上提供良好的筛选体验

### 用户场景

1. 数据分析师希望只查看特定时间段内的销售数据
2. 业务用户希望比较不同产品类别的性能指标
3. 管理者希望筛选出表现异常的数据点进行深入分析
4. 用户希望通过关键词快速定位相关数据

## 技术方案

### 数据结构设计

#### 筛选条件接口

```typescript
// 筛选操作符类型
type FilterOperator = 
  | 'equals' | 'notEquals' 
  | 'greaterThan' | 'lessThan' 
  | 'greaterThanOrEqual' | 'lessThanOrEqual'
  | 'contains' | 'notContains'
  | 'startsWith' | 'endsWith'
  | 'between' | 'in' | 'notIn';

// 基础筛选条件
interface FilterCondition {
  field: string;         // 字段名
  operator: FilterOperator; // 操作符
  value: any;            // 筛选值
  valueEnd?: any;        // 范围筛选的结束值（用于between操作符）
}

// 组合筛选条件
interface CompositeFilterCondition {
  logic: 'and' | 'or';   // 逻辑组合方式
  conditions: (FilterCondition | CompositeFilterCondition)[]; // 子条件
}

// 筛选方案
interface FilterPreset {
  id: string;            // 唯一标识
  name: string;          // 方案名称
  description?: string;  // 方案描述
  condition: FilterCondition | CompositeFilterCondition; // 筛选条件
  createdAt: number;     // 创建时间
  updatedAt: number;     // 更新时间
}

// 图表筛选状态
interface ChartFilterState {
  chartId: string;       // 图表ID
  activeCondition: FilterCondition | CompositeFilterCondition | null; // 当前激活的筛选条件
  presetId?: string;     // 使用的预设方案ID
}
```

### 实现步骤

#### 1. 更新类型定义

创建 `src/types/filter.ts` 文件，定义筛选相关的类型：

```typescript
// 筛选操作符类型
export type FilterOperator = 
  | 'equals' | 'notEquals' 
  | 'greaterThan' | 'lessThan' 
  | 'greaterThanOrEqual' | 'lessThanOrEqual'
  | 'contains' | 'notContains'
  | 'startsWith' | 'endsWith'
  | 'between' | 'in' | 'notIn';

// 基础筛选条件
export interface FilterCondition {
  field: string;         // 字段名
  operator: FilterOperator; // 操作符
  value: any;            // 筛选值
  valueEnd?: any;        // 范围筛选的结束值（用于between操作符）
}

// 组合筛选条件
export interface CompositeFilterCondition {
  logic: 'and' | 'or';   // 逻辑组合方式
  conditions: (FilterCondition | CompositeFilterCondition)[]; // 子条件
}

// 筛选方案
export interface FilterPreset {
  id: string;            // 唯一标识
  name: string;          // 方案名称
  description?: string;  // 方案描述
  condition: FilterCondition | CompositeFilterCondition; // 筛选条件
  createdAt: number;     // 创建时间
  updatedAt: number;     // 更新时间
}

// 图表筛选状态
export interface ChartFilterState {
  chartId: string;       // 图表ID
  activeCondition: FilterCondition | CompositeFilterCondition | null; // 当前激活的筛选条件
  presetId?: string;     // 使用的预设方案ID
}

// 字段元数据，用于构建筛选UI
export interface FieldMetadata {
  name: string;          // 字段名
  label: string;         // 显示标签
  type: 'string' | 'number' | 'date' | 'boolean'; // 数据类型
  values?: any[];        // 可能的值列表（用于枚举类型）
  min?: number;          // 最小值（用于数值类型）
  max?: number;          // 最大值（用于数值类型）
  format?: string;       // 格式化字符串
}
```

更新 `src/types/index.ts`，导出筛选相关类型：

```typescript
export * from './chart';
export * from './dashboard';
export * from './filter';
// 其他导出...
```

#### 2. 更新状态管理

修改 `src/store/index.ts`，添加筛选相关状态和操作：

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { 
  Dashboard, 
  ChartConfig,
  FilterPreset,
  ChartFilterState,
  FilterCondition,
  CompositeFilterCondition
} from '../types';

interface AppStore {
  // 现有状态...
  
  // 筛选相关状态
  filterPresets: FilterPreset[];
  chartFilterStates: ChartFilterState[];
  
  // 筛选相关操作
  createFilterPreset: (name: string, condition: FilterCondition | CompositeFilterCondition, description?: string) => string;
  updateFilterPreset: (id: string, updates: Partial<Omit<FilterPreset, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteFilterPreset: (id: string) => void;
  
  setChartFilter: (chartId: string, condition: FilterCondition | CompositeFilterCondition | null, presetId?: string) => void;
  clearChartFilter: (chartId: string) => void;
  getChartFilter: (chartId: string) => ChartFilterState | undefined;
}

const useAppStore = create<AppStore>(
  persist(
    (set, get) => ({
      // 现有状态和操作...
      
      // 筛选相关状态
      filterPresets: [],
      chartFilterStates: [],
      
      // 创建筛选方案
      createFilterPreset: (name, condition, description) => {
        const id = uuidv4();
        const now = Date.now();
        
        const newPreset: FilterPreset = {
          id,
          name,
          description,
          condition,
          createdAt: now,
          updatedAt: now
        };
        
        set((state) => ({
          filterPresets: [...state.filterPresets, newPreset]
        }));
        
        return id;
      },
      
      // 更新筛选方案
      updateFilterPreset: (id, updates) => {
        set((state) => {
          const presets = [...state.filterPresets];
          const index = presets.findIndex(p => p.id === id);
          
          if (index === -1) return state;
          
          presets[index] = {
            ...presets[index],
            ...updates,
            updatedAt: Date.now()
          };
          
          return { filterPresets: presets };
        });
      },
      
      // 删除筛选方案
      deleteFilterPreset: (id) => {
        set((state) => ({
          filterPresets: state.filterPresets.filter(p => p.id !== id),
          // 同时清除使用该方案的图表筛选状态
          chartFilterStates: state.chartFilterStates.map(s => 
            s.presetId === id ? { ...s, activeCondition: null, presetId: undefined } : s
          )
        }));
      },
      
      // 设置图表筛选
      setChartFilter: (chartId, condition, presetId) => {
        set((state) => {
          const filterStates = [...state.chartFilterStates];
          const index = filterStates.findIndex(s => s.chartId === chartId);
          
          if (index === -1) {
            // 创建新的筛选状态
            return {
              chartFilterStates: [
                ...filterStates,
                { chartId, activeCondition: condition, presetId }
              ]
            };
          } else {
            // 更新现有筛选状态
            filterStates[index] = {
              ...filterStates[index],
              activeCondition: condition,
              presetId
            };
            
            return { chartFilterStates: filterStates };
          }
        });
      },
      
      // 清除图表筛选
      clearChartFilter: (chartId) => {
        set((state) => {
          const filterStates = [...state.chartFilterStates];
          const index = filterStates.findIndex(s => s.chartId === chartId);
          
          if (index === -1) return state;
          
          filterStates[index] = {
            ...filterStates[index],
            activeCondition: null,
            presetId: undefined
          };
          
          return { chartFilterStates: filterStates };
        });
      },
      
      // 获取图表筛选
      getChartFilter: (chartId) => {
        return get().chartFilterStates.find(s => s.chartId === chartId);
      }
    }),
    {
      name: 'dataviz-storage',
      partialize: (state) => ({
        // 现有持久化状态...
        filterPresets: state.filterPresets,
        chartFilterStates: state.chartFilterStates
      })
    }
  )
);

export { useAppStore };
```

#### 3. 创建筛选工具类

创建 `src/utils/filter.ts` 文件，实现筛选逻辑：

```typescript
import { FilterCondition, CompositeFilterCondition, FilterOperator } from '../types';

// 应用筛选条件到数据
export const applyFilter = (data: any[], condition: FilterCondition | CompositeFilterCondition | null): any[] => {
  if (!condition) return data;
  
  return data.filter(item => evaluateCondition(item, condition));
};

// 评估单个数据项是否满足筛选条件
const evaluateCondition = (item: any, condition: FilterCondition | CompositeFilterCondition): boolean => {
  // 处理组合条件
  if ('logic' in condition) {
    if (condition.logic === 'and') {
      return condition.conditions.every(subCondition => evaluateCondition(item, subCondition));
    } else { // 'or'
      return condition.conditions.some(subCondition => evaluateCondition(item, subCondition));
    }
  }
  
  // 处理基础条件
  const { field, operator, value, valueEnd } = condition;
  const itemValue = item[field];
  
  switch (operator) {
    case 'equals':
      return itemValue === value;
      
    case 'notEquals':
      return itemValue !== value;
      
    case 'greaterThan':
      return itemValue > value;
      
    case 'lessThan':
      return itemValue < value;
      
    case 'greaterThanOrEqual':
      return itemValue >= value;
      
    case 'lessThanOrEqual':
      return itemValue <= value;
      
    case 'contains':
      return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
      
    case 'notContains':
      return !String(itemValue).toLowerCase().includes(String(value).toLowerCase());
      
    case 'startsWith':
      return String(itemValue).toLowerCase().startsWith(String(value).toLowerCase());
      
    case 'endsWith':
      return String(itemValue).toLowerCase().endsWith(String(value).toLowerCase());
      
    case 'between':
      return itemValue >= value && itemValue <= valueEnd;
      
    case 'in':
      return Array.isArray(value) && value.includes(itemValue);
      
    case 'notIn':
      return Array.isArray(value) && !value.includes(itemValue);
      
    default:
      return false;
  }
};

// 从数据中提取字段元数据
export const extractFieldMetadata = (data: any[]) => {
  if (data.length === 0) return [];
  
  const sample = data[0];
  const fields = Object.keys(sample);
  
  return fields.map(field => {
    const values = data.map(item => item[field]);
    const uniqueValues = [...new Set(values)];
    const type = inferFieldType(values);
    
    let metadata: any = {
      name: field,
      label: field.charAt(0).toUpperCase() + field.slice(1),
      type
    };
    
    // 对于枚举类型，添加可能的值列表
    if (uniqueValues.length <= 20) {
      metadata.values = uniqueValues;
    }
    
    // 对于数值类型，添加最小值和最大值
    if (type === 'number') {
      metadata.min = Math.min(...values.filter(v => typeof v === 'number'));
      metadata.max = Math.max(...values.filter(v => typeof v === 'number'));
    }
    
    return metadata;
  });
};

// 推断字段类型
const inferFieldType = (values: any[]): 'string' | 'number' | 'date' | 'boolean' => {
  // 过滤掉null和undefined
  const nonNullValues = values.filter(v => v !== null && v !== undefined);
  if (nonNullValues.length === 0) return 'string';
  
  // 检查第一个非空值的类型
  const firstValue = nonNullValues[0];
  
  if (typeof firstValue === 'number') return 'number';
  if (typeof firstValue === 'boolean') return 'boolean';
  
  // 尝试解析为日期
  if (typeof firstValue === 'string') {
    const dateValue = new Date(firstValue);
    if (!isNaN(dateValue.getTime()) && firstValue.length > 5) {
      // 检查是否所有值都是有效日期
      const allDates = nonNullValues.every(v => {
        const d = new Date(v);
        return !isNaN(d.getTime());
      });
      
      if (allDates) return 'date';
    }
  }
  
  return 'string';
};

// 获取操作符显示名称
export const getOperatorLabel = (operator: FilterOperator): string => {
  const operatorLabels: Record<FilterOperator, string> = {
    equals: '等于',
    notEquals: '不等于',
    greaterThan: '大于',
    lessThan: '小于',
    greaterThanOrEqual: '大于等于',
    lessThanOrEqual: '小于等于',
    contains: '包含',
    notContains: '不包含',
    startsWith: '开头是',
    endsWith: '结尾是',
    between: '介于',
    in: '在列表中',
    notIn: '不在列表中'
  };
  
  return operatorLabels[operator] || operator;
};

// 根据字段类型获取可用的操作符
export const getAvailableOperators = (fieldType: 'string' | 'number' | 'date' | 'boolean'): FilterOperator[] => {
  switch (fieldType) {
    case 'string':
      return ['equals', 'notEquals', 'contains', 'notContains', 'startsWith', 'endsWith', 'in', 'notIn'];
      
    case 'number':
      return ['equals', 'notEquals', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual', 'between', 'in', 'notIn'];
      
    case 'date':
      return ['equals', 'notEquals', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual', 'between'];
      
    case 'boolean':
      return ['equals', 'notEquals'];
      
    default:
      return ['equals', 'notEquals'];
  }
};
```

#### 4. 创建基础筛选组件

创建 `src/components/filter/FilterConditionEditor.tsx` 组件：

```typescript
import React, { useState, useEffect } from 'react';
import { FilterCondition, FieldMetadata, FilterOperator } from '../../types';
import { getAvailableOperators, getOperatorLabel } from '../../utils/filter';

interface FilterConditionEditorProps {
  condition: FilterCondition;
  fields: FieldMetadata[];
  onChange: (condition: FilterCondition) => void;
  onRemove?: () => void;
  theme: 'light' | 'dark';
}

export const FilterConditionEditor: React.FC<FilterConditionEditorProps> = ({
  condition,
  fields,
  onChange,
  onRemove,
  theme
}) => {
  const [field, setField] = useState(condition.field);
  const [operator, setOperator] = useState(condition.operator);
  const [value, setValue] = useState(condition.value);
  const [valueEnd, setValueEnd] = useState(condition.valueEnd);
  
  // 获取当前字段的元数据
  const fieldMeta = fields.find(f => f.name === field) || fields[0];
  
  // 获取当前字段类型可用的操作符
  const availableOperators = getAvailableOperators(fieldMeta?.type || 'string');
  
  // 当字段变化时，重置操作符和值
  useEffect(() => {
    if (field !== condition.field) {
      const newFieldMeta = fields.find(f => f.name === field);
      if (newFieldMeta) {
        const newOperators = getAvailableOperators(newFieldMeta.type);
        if (!newOperators.includes(operator)) {
          setOperator(newOperators[0]);
        }
        
        // 重置值
        setValue(null);
        setValueEnd(null);
      }
    }
  }, [field, fields, operator, condition.field]);
  
  // 当任何值变化时，更新条件
  useEffect(() => {
    const updatedCondition: FilterCondition = {
      field,
      operator,
      value,
      ...(operator === 'between' ? { valueEnd } : {})
    };
    
    onChange(updatedCondition);
  }, [field, operator, value, valueEnd, onChange]);
  
  // 渲染值输入控件
  const renderValueInput = () => {
    if (!fieldMeta) return null;
    
    // 对于'in'和'notIn'操作符，渲染多选控件
    if (operator === 'in' || operator === 'notIn') {
      return (
        <select
          multiple
          value={Array.isArray(value) ? value : []}
          onChange={(e) => {
            const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
            setValue(selectedValues);
          }}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
            backgroundColor: theme === 'dark' ? '#333' : '#fff',
            color: theme === 'dark' ? '#fff' : '#333'
          }}
        >
          {fieldMeta.values?.map(val => (
            <option key={val} value={val}>{val}</option>
          ))}
        </select>
      );
    }
    
    // 对于'between'操作符，渲染范围输入
    if (operator === 'between') {
      return (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {renderSingleValueInput(value, setValue, 'from')}
          <span>到</span>
          {renderSingleValueInput(valueEnd, setValueEnd, 'to')}
        </div>
      );
    }
    
    // 对于其他操作符，渲染单值输入
    return renderSingleValueInput(value, setValue);
  };
  
  // 渲染单个值输入控件
  const renderSingleValueInput = (val: any, setVal: (val: any) => void, placeholder?: string) => {
    if (!fieldMeta) return null;
    
    switch (fieldMeta.type) {
      case 'number':
        return (
          <input
            type="number"
            value={val || ''}
            onChange={(e) => setVal(parseFloat(e.target.value))}
            placeholder={placeholder}
            min={fieldMeta.min}
            max={fieldMeta.max}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
              backgroundColor: theme === 'dark' ? '#333' : '#fff',
              color: theme === 'dark' ? '#fff' : '#333'
            }}
          />
        );
        
      case 'date':
        return (
          <input
            type="date"
            value={val || ''}
            onChange={(e) => setVal(e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
              backgroundColor: theme === 'dark' ? '#333' : '#fff',
              color: theme === 'dark' ? '#fff' : '#333'
            }}
          />
        );
        
      case 'boolean':
        return (
          <select
            value={val === true ? 'true' : val === false ? 'false' : ''}
            onChange={(e) => setVal(e.target.value === 'true' ? true : e.target.value === 'false' ? false : null)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
              backgroundColor: theme === 'dark' ? '#333' : '#fff',
              color: theme === 'dark' ? '#fff' : '#333'
            }}
          >
            <option value="">选择...</option>
            <option value="true">是</option>
            <option value="false">否</option>
          </select>
        );
        
      default: // string
        // 如果有预定义值列表且不超过20个选项，使用下拉列表
        if (fieldMeta.values && fieldMeta.values.length <= 20) {
          return (
            <select
              value={val || ''}
              onChange={(e) => setVal(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                backgroundColor: theme === 'dark' ? '#333' : '#fff',
                color: theme === 'dark' ? '#fff' : '#333'
              }}
            >
              <option value="">选择...</option>
              {fieldMeta.values.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          );
        }
        
        // 否则使用文本输入
        return (
          <input
            type="text"
            value={val || ''}
            onChange={(e) => setVal(e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
              backgroundColor: theme === 'dark' ? '#333' : '#fff',
              color: theme === 'dark' ? '#fff' : '#333'
            }}
          />
        );
    }
  };
  
  return (
    <div style={{
      padding: '15px',
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
      borderRadius: '8px',
      marginBottom: '10px'
    }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        {/* 字段选择 */}
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>字段</label>
          <select
            value={field}
            onChange={(e) => setField(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
              backgroundColor: theme === 'dark' ? '#333' : '#fff',
              color: theme === 'dark' ? '#fff' : '#333'
            }}
          >
            {fields.map(f => (
              <option key={f.name} value={f.name}>{f.label}</option>
            ))}
          </select>
        </div>
        
        {/* 操作符选择 */}
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>操作符</label>
          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value as FilterOperator)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
              backgroundColor: theme === 'dark' ? '#333' : '#fff',
              color: theme === 'dark' ? '#fff' : '#333'
            }}
          >
            {availableOperators.map(op => (
              <option key={op} value={op}>{getOperatorLabel(op)}</option>
            ))}
          </select>
        </div>
        
        {/* 删除按钮 */}
        {onRemove && (
          <button
            onClick={onRemove}
            style={{
              backgroundColor: theme === 'dark' ? '#d32f2f' : '#f44336',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '0 10px',
              cursor: 'pointer',
              alignSelf: 'flex-end',
              height: '38px',
              marginBottom: '1px'
            }}
          >
            删除
          </button>
        )}
      </div>
      
      {/* 值输入 */}
      <div>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>值</label>
        {renderValueInput()}
      </div>
    </div>
  );
};
```

#### 5. 创建复合筛选组件

创建 `src/components/filter/CompositeFilterEditor.tsx` 组件：

```typescript
import React from 'react';
import { FilterCondition, CompositeFilterCondition, FieldMetadata } from '../../types';
import { FilterConditionEditor } from './FilterConditionEditor';

interface CompositeFilterEditorProps {
  condition: CompositeFilterCondition;
  fields: FieldMetadata[];
  onChange: (condition: CompositeFilterCondition) => void;
  onRemove?: () => void;
  theme: 'light' | 'dark';
}

export const CompositeFilterEditor: React.FC<CompositeFilterEditorProps> = ({
  condition,
  fields,
  onChange,
  onRemove,
  theme
}) => {
  // 处理逻辑操作符变化
  const handleLogicChange = (logic: 'and' | 'or') => {
    onChange({
      ...condition,
      logic
    });
  };
  
  // 处理子条件变化
  const handleConditionChange = (index: number, updatedCondition: FilterCondition | CompositeFilterCondition) => {
    const newConditions = [...condition.conditions];
    newConditions[index] = updatedCondition;
    
    onChange({
      ...condition,
      conditions: newConditions
    });
  };
  
  // 添加新的基础条件
  const addCondition = () => {
    const defaultField = fields[0]?.name || '';
    const defaultOperator = 'equals';
    
    const newCondition: FilterCondition = {
      field: defaultField,
      operator: defaultOperator,
      value: null
    };
    
    onChange({
      ...condition,
      conditions: [...condition.conditions, newCondition]
    });
  };
  
  // 添加新的组合条件
  const addGroup = () => {
    const newGroup: CompositeFilterCondition = {
      logic: 'and',
      conditions: []
    };
    
    onChange({
      ...condition,
      conditions: [...condition.conditions, newGroup]
    });
  };
  
  // 移除子条件
  const removeCondition = (index: number) => {
    const newConditions = condition.conditions.filter((_, i) => i !== index);
    
    onChange({
      ...condition,
      conditions: newConditions
    });
  };
  
  return (
    <div style={{
      padding: '15px',
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f0f0f0',
      borderRadius: '8px',
      marginBottom: '10px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <div>
          <label style={{ marginRight: '10px' }}>匹配方式:</label>
          <select
            value={condition.logic}
            onChange={(e) => handleLogicChange(e.target.value as 'and' | 'or')}
            style={{
              padding: '5px',
              borderRadius: '4px',
              border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
              backgroundColor: theme === 'dark' ? '#333' : '#fff',
              color: theme === 'dark' ? '#fff' : '#333'
            }}
          >
            <option value="and">满足所有条件 (AND)</option>
            <option value="or">满足任一条件 (OR)</option>
          </select>
        </div>
        
        {onRemove && (
          <button
            onClick={onRemove}
            style={{
              backgroundColor: theme === 'dark' ? '#d32f2f' : '#f44336',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '5px 10px',
              cursor: 'pointer'
            }}
          >
            删除组
          </button>
        )}
      </div>
      
      {/* 子条件列表 */}
      {condition.conditions.map((subCondition, index) => (
        <div key={index} style={{ marginBottom: '10px' }}>
          {'logic' in subCondition ? (
            <CompositeFilterEditor
              condition={subCondition as CompositeFilterCondition}
              fields={fields}
              onChange={(updated) => handleConditionChange(index, updated)}
              onRemove={() => removeCondition(index)}
              theme={theme}
            />
          ) : (
            <FilterConditionEditor
              condition={subCondition as FilterCondition}
              fields={fields}
              onChange={(updated) => handleConditionChange(index, updated)}
              onRemove={() => removeCondition(index)}
              theme={theme}
            />
          )}
        </div>
      ))}
      
      {/* 添加条件按钮 */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <button
          onClick={addCondition}
          style={{
            backgroundColor: theme === 'dark' ? '#333' : '#e0e0e0',
            color: theme === 'dark' ? '#fff' : '#333',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            cursor: 'pointer'
          }}
        >
          添加条件
        </button>
        
        <button
          onClick={addGroup}
          style={{
            backgroundColor: theme === 'dark' ? '#333' : '#e0e0e0',
            color: theme === 'dark' ? '#fff' : '#333',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            cursor: 'pointer'
          }}
        >
          添加条件组
        </button>
      </div>
    </div>
  );
};
```

#### 6. 创建筛选管理组件

创建 `src/components/filter/FilterManager.tsx` 组件：

```typescript
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { FilterCondition, CompositeFilterCondition, FieldMetadata } from '../../types';
import { CompositeFilterEditor } from './CompositeFilterEditor';
import { extractFieldMetadata } from '../../utils/filter';

interface FilterManagerProps {
  chartId: string;
  data: any[];
  onFilterChange: (filteredData: any[]) => void;
}

export const FilterManager: React.FC<FilterManagerProps> = ({
  chartId,
  data,
  onFilterChange
}) => {
  const { 
    theme, 
    filterPresets, 
    getChartFilter, 
    setChartFilter, 
    clearChartFilter,
    createFilterPreset,
    deleteFilterPreset
  } = useAppStore();
  
  // 获取当前图表的筛选状态
  const filterState = getChartFilter(chartId);
  
  // 字段元数据
  const [fields, setFields] = useState<FieldMetadata[]>([]);
  
  // 当前编辑的筛选条件
  const [editingCondition, setEditingCondition] = useState<CompositeFilterCondition>(
    (filterState?.activeCondition as CompositeFilterCondition) || {
      logic: 'and',
      conditions: []
    }
  );
  
  // 是否显示筛选编辑器
  const [showEditor, setShowEditor] = useState(false);
  
  // 新预设名称
  const [presetName, setPresetName] = useState('');
  
  // 从数据中提取字段元数据
  useEffect(() => {
    if (data.length > 0) {
      const metadata = extractFieldMetadata(data);
      setFields(metadata);
    }
  }, [data]);
  
  // 应用筛选条件
  const applyFilter = () => {
    // 如果没有条件，清除筛选
    if (editingCondition.conditions.length === 0) {
      clearChartFilter(chartId);
      onFilterChange(data);
      setShowEditor(false);
      return;
    }
    
    // 设置筛选条件
    setChartFilter(chartId, editingCondition);
    
    // 应用筛选并更新图表
    const filteredData = data.filter(item => evaluateCondition(item, editingCondition));
    onFilterChange(filteredData);
    
    setShowEditor(false);
  };
  
  // 评估条件
  const evaluateCondition = (item: any, condition: FilterCondition | CompositeFilterCondition): boolean => {
    // 处理组合条件
    if ('logic' in condition) {
      if (condition.logic === 'and') {
        return condition.conditions.every(subCondition => evaluateCondition(item, subCondition));
      } else { // 'or'
        return condition.conditions.some(subCondition => evaluateCondition(item, subCondition));
      }
    }
    
    // 处理基础条件
    const { field, operator, value, valueEnd } = condition;
    const itemValue = item[field];
    
    switch (operator) {
      case 'equals':
        return itemValue === value;
        
      case 'notEquals':
        return itemValue !== value;
        
      case 'greaterThan':
        return itemValue > value;
        
      case 'lessThan':
        return itemValue < value;
        
      case 'greaterThanOrEqual':
        return itemValue >= value;
        
      case 'lessThanOrEqual':
        return itemValue <= value;
        
      case 'contains':
        return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
        
      case 'notContains':
        return !String(itemValue).toLowerCase().includes(String(value).toLowerCase());
        
      case 'startsWith':
        return String(itemValue).toLowerCase().startsWith(String(value).toLowerCase());
        
      case 'endsWith':
        return String(itemValue).toLowerCase().endsWith(String(value).toLowerCase());
        
      case 'between':
        return itemValue >= value && itemValue <= valueEnd;
        
      case 'in':
        return Array.isArray(value) && value.includes(itemValue);
        
      case 'notIn':
        return Array.isArray(value) && !value.includes(itemValue);
        
      default:
        return false;
    }
  };
  
  // 重置筛选
  const resetFilter = () => {
    clearChartFilter(chartId);
    onFilterChange(data);
    setEditingCondition({
      logic: 'and',
      conditions: []
    });
    setShowEditor(false);
  };
  
  // 保存为预设
  const saveAsPreset = () => {
    if (!presetName.trim() || editingCondition.conditions.length === 0) return;
    
    createFilterPreset(presetName, editingCondition);
    setPresetName('');
  };
  
  // 加载预设
  const loadPreset = (presetId: string) => {
    const preset = filterPresets.find(p => p.id === presetId);
    if (!preset) return;
    
    setEditingCondition(preset.condition as CompositeFilterCondition);
    setChartFilter(chartId, preset.condition, preset.id);
    
    // 应用筛选并更新图表
    const filteredData = data.filter(item => evaluateCondition(item, preset.condition));
    onFilterChange(filteredData);
  };
  
  // 删除预设
  const handleDeletePreset = (presetId: string) => {
    deleteFilterPreset(presetId);
    
    // 如果当前图表正在使用该预设，清除筛选
    if (filterState?.presetId === presetId) {
      clearChartFilter(chartId);
      onFilterChange(data);
    }
  };
  
  return (
    <div style={{
      padding: '15px',
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3 style={{ margin: 0 }}>数据筛选</h3>
        
        <div>
          <button
            onClick={() => setShowEditor(!showEditor)}
            style={{
              backgroundColor: theme === 'dark' ? '#333' : '#e0e0e0',
              color: theme === 'dark' ? '#fff' : '#333',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              marginRight: '10px',
              cursor: 'pointer'
            }}
          >
            {showEditor ? '隐藏编辑器' : '编辑筛选'}
          </button>
          
          <button
            onClick={resetFilter}
            style={{
              backgroundColor: theme === 'dark' ? '#d32f2f' : '#f44336',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            重置筛选
          </button>
        </div>
      </div>
      
      {/* 筛选状态指示 */}
      {filterState?.activeCondition && (
        <div style={{
          padding: '10px',
          backgroundColor: theme === 'dark' ? '#2a2a2a' : '#e0e0e0',
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          <p style={{ margin: 0 }}>
            <strong>当前筛选:</strong> 
            {filterState.presetId ? 
              `使用预设 "${filterPresets.find(p => p.id === filterState.presetId)?.name || '未知'}"` : 
              `自定义筛选 (${('logic' in filterState.activeCondition) ? 
                `${filterState.activeCondition.conditions.length} 个条件` : '1 个条件'})`
            }
          </p>
        </div>
      )}
      
      {/* 筛选编辑器 */}
      {showEditor && (
        <div>
          <CompositeFilterEditor
            condition={editingCondition}
            fields={fields}
            onChange={setEditingCondition}
            theme={theme}
          />
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '15px',
            gap: '10px'
          }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="预设名称"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                  backgroundColor: theme === 'dark' ? '#333' : '#fff',
                  color: theme === 'dark' ? '#fff' : '#333',
                  marginRight: '10px'
                }}
              />
            </div>
            
            <button
              onClick={saveAsPreset}
              disabled={!presetName.trim() || editingCondition.conditions.length === 0}
              style={{
                backgroundColor: theme === 'dark' ? '#333' : '#e0e0e0',
                color: theme === 'dark' ? '#fff' : '#333',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: presetName.trim() && editingCondition.conditions.length > 0 ? 'pointer' : 'not-allowed',
                opacity: presetName.trim() && editingCondition.conditions.length > 0 ? 1 : 0.7
              }}
            >
              保存为预设
            </button>
            
            <button
              onClick={applyFilter}
              style={{
                backgroundColor: theme === 'dark' ? '#0066cc' : '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer'
              }}
            >
              应用筛选
            </button>
          </div>
        </div>
      )}
      
      {/* 预设列表 */}
      {filterPresets.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4>筛选预设</h4>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '10px'
          }}>
            {filterPresets.map(preset => (
              <div 
                key={preset.id}
                style={{
                  padding: '10px',
                  backgroundColor: filterState?.presetId === preset.id ? 
                    (theme === 'dark' ? '#0066cc' : '#007bff') : 
                    (theme === 'dark' ? '#333' : '#e0e0e0'),
                  color: filterState?.presetId === preset.id ? 
                    '#fff' : 
                    (theme === 'dark' ? '#fff' : '#333'),
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span 
                  onClick={() => loadPreset(preset.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {preset.name}
                </span>
                
                <button
                  onClick={() => handleDeletePreset(preset.id)}
                  style={{
                    backgroundColor: 'transparent',
                    color: filterState?.presetId === preset.id ? 
                      'rgba(255, 255, 255, 0.7)' : 
                      (theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0',
                    fontSize: '16px',
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

#### 7. 更新Chart组件

修改 `src/components/Chart.tsx`，集成筛选功能：

```typescript
// 在Chart组件中添加筛选功能
import { useState, useEffect } from 'react';
import { FilterManager } from './filter/FilterManager';
import { applyFilter } from '../utils/filter';

// 在组件内部添加状态
const [filteredData, setFilteredData] = useState(data);

// 在useEffect中应用筛选
useEffect(() => {
  // 获取当前图表的筛选状态
  const filterState = getChartFilter(config.id);
  
  if (filterState?.activeCondition) {
    // 应用筛选
    const filtered = applyFilter(data, filterState.activeCondition);
    setFilteredData(filtered);
  } else {
    // 无筛选条件，使用原始数据
    setFilteredData(data);
  }
}, [data, config.id, getChartFilter]);

// 在渲染图表前添加筛选管理器
<>
  <FilterManager
    chartId={config.id}
    data={data}
    onFilterChange={setFilteredData}
  />
  
  {/* 使用filteredData渲染图表 */}
  {renderChart(filteredData)}
</>
```

#### 8. 添加快速搜索组件

创建 `src/components/filter/QuickSearch.tsx` 组件：

```typescript
import React, { useState, useEffect } from 'react';

interface QuickSearchProps {
  data: any[];
  onFilterChange: (filteredData: any[]) => void;
  searchFields?: string[];
  placeholder?: string;
  theme: 'light' | 'dark';
}

export const QuickSearch: React.FC<QuickSearchProps> = ({
  data,
  onFilterChange,
  searchFields,
  placeholder = '搜索...',
  theme
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // 当搜索词变化时，过滤数据
  useEffect(() => {
    if (!searchTerm.trim()) {
      onFilterChange(data);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    
    const filtered = data.filter(item => {
      // 如果指定了搜索字段，只在这些字段中搜索
      if (searchFields && searchFields.length > 0) {
        return searchFields.some(field => {
          const value = item[field];
          return value !== undefined && 
                 value !== null && 
                 String(value).toLowerCase().includes(term);
        });
      }
      
      // 否则，在所有字段中搜索
      return Object.values(item).some(value => 
        value !== undefined && 
        value !== null && 
        String(value).toLowerCase().includes(term)
      );
    });
    
    onFilterChange(filtered);
  }, [searchTerm, data, onFilterChange, searchFields]);
  
  return (
    <div style={{ marginBottom: '15px' }}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '4px',
          border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
          backgroundColor: theme === 'dark' ? '#333' : '#fff',
          color: theme === 'dark' ? '#fff' : '#333',
          fontSize: '16px'
        }}
      />
      
      {searchTerm && (
        <div style={{ 
          marginTop: '5px', 
          fontSize: '14px',
          color: theme === 'dark' ? '#aaa' : '#666'
        }}>
          显示 {data.length} 条数据中的 {data.filter(item => {
            if (searchFields && searchFields.length > 0) {
              return searchFields.some(field => {
                const value = item[field];
                return value !== undefined && 
                       value !== null && 
                       String(value).toLowerCase().includes(searchTerm.toLowerCase());
              });
            }
            
            return Object.values(item).some(value => 
              value !== undefined && 
              value !== null && 
              String(value).toLowerCase().includes(searchTerm.toLowerCase())
            );
          }).length} 条
        </div>
      )}
    </div>
  );
};
```

## 测试计划

### 功能测试

1. **基础筛选功能**
   - 测试数值范围筛选的准确性
   - 验证类别筛选的选择/取消选择功能
   - 测试文本搜索的匹配效果
   - 验证日期范围筛选的准确性

2. **高级筛选功能**
   - 测试多条件AND/OR组合筛选
   - 验证嵌套条件组的筛选效果
   - 测试不同数据类型的筛选操作符

3. **筛选管理**
   - 测试保存和加载筛选预设
   - 验证重置筛选功能
   - 测试筛选状态指示的准确性

4. **用户体验**
   - 测试筛选条件变化时的实时预览
   - 验证在不同屏幕尺寸下的响应式设计
   - 测试筛选UI的可用性和直观性

### 性能测试

1. 测试大数据集（1000+条记录）的筛选性能
2. 验证复杂筛选条件（多层嵌套）的执行效率
3. 测试频繁切换筛选条件时的响应速度

## 注意事项

1. **性能考虑**：对于大型数据集，应考虑优化筛选算法，可能需要实现延迟评估或分页筛选
2. **用户体验**：确保筛选UI直观易用，提供足够的视觉反馈
3. **数据类型处理**：正确处理不同数据类型（字符串、数字、日期、布尔值）的筛选逻辑
4. **空值处理**：妥善处理数据中的null、undefined或空字符串
5. **本地化**：考虑支持多语言环境下的筛选操作符和UI文本

## 实现时间表

| 阶段 | 任务 | 预计时间 |
|------|------|----------|
| 1 | 设计数据结构和状态管理 | 2天 |
| 2 | 实现基础筛选组件 | 3天 |
| 3 | 实现高级筛选组件 | 3天 |
| 4 | 集成到图表组件 | 2天 |
| 5 | 实现筛选预设管理 | 2天 |
| 6 | 测试和优化 | 3天 |
| **总计** | | **15天** |

## 参考资源

1. React状态管理：[Zustand文档](https://github.com/pmndrs/zustand)
2. UI组件参考：[Ant Design筛选组件](https://ant.design/components/table/#components-table-demo-filter-in-tree)
3. 数据处理：[Lodash文档](https://lodash.com/docs)