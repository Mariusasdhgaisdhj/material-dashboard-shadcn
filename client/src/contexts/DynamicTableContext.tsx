import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

// Dynamic Table Column Definition
export interface TableColumn {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'image' | 'badge' | 'actions' | 'custom';
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
  accessor?: string | ((row: any) => any);
  formatter?: (value: any) => string;
  badgeVariant?: (row: any) => 'default' | 'destructive' | 'outline' | 'secondary';
}

// Dynamic Filter Definition
export interface TableFilter {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean';
  options?: { label: string; value: any }[];
  placeholder?: string;
  accessor?: string | ((row: any) => any);
}

// Dynamic Action Definition
export interface TableAction {
  id: string;
  label: string;
  icon?: LucideIcon | string;
  type: 'button' | 'dropdown' | 'bulk';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onClick: (row?: any, selectedRows?: any[]) => void | Promise<void>;
  visible?: (row?: any, selectedRows?: any[]) => boolean;
  disabled?: (row?: any, selectedRows?: any[]) => boolean;
  requiresSelection?: boolean;
  requiresAdmin?: boolean;
}

// Dynamic Table Configuration
export interface TableConfig {
  id: string;
  title: string;
  description?: string;
  apiEndpoint: string;
  columns: TableColumn[];
  filters: TableFilter[];
  actions: TableAction[];
  bulkActions?: TableAction[];
  pagination?: {
    enabled: boolean;
    itemsPerPage: number;
    itemsPerPageOptions?: number[];
  };
  sorting?: {
    enabled: boolean;
    defaultSort?: { column: string; direction: 'asc' | 'desc' };
  };
  search?: {
    enabled: boolean;
    placeholder?: string;
    searchFields?: (string | ((row: any) => any))[];
  };
  export?: {
    enabled: boolean;
    formats?: ('csv' | 'excel' | 'pdf')[];
  };
  audit?: {
    enabled: boolean;
    trackActions?: boolean;
  };
  permissions?: {
    create?: string[];
    read?: string[];
    update?: string[];
    delete?: string[];
  };
}

// Table State Interface
export interface TableState {
  data: any[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  filters: Record<string, any>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  currentPage: number;
  itemsPerPage: number;
  selectedRows: Set<string>;
  auditLog: any[];
}

// Context Interface
interface DynamicTableContextType {
  // State
  config: TableConfig | null;
  state: TableState;
  
  // Configuration Management
  setConfig: (config: TableConfig) => void;
  updateConfig: (updates: Partial<TableConfig>) => void;
  
  // Data Management
  setData: (data: any[]) => void;
  addRow: (row: any) => void;
  updateRow: (id: string, updates: any) => void;
  deleteRow: (id: string) => void;
  refreshData: () => Promise<void>;
  
  // State Management
  setSearchTerm: (term: string) => void;
  setFilter: (filterId: string, value: any) => void;
  clearFilters: () => void;
  setSorting: (column: string, direction: 'asc' | 'desc') => void;
  setPagination: (page: number, itemsPerPage?: number) => void;
  
  // Selection Management
  selectRow: (id: string) => void;
  deselectRow: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  toggleRowSelection: (id: string) => void;
  
  // Actions
  executeAction: (actionId: string, row?: any) => Promise<void>;
  executeBulkAction: (actionId: string) => Promise<void>;
  
  // Computed Values
  filteredData: any[];
  paginatedData: any[];
  totalPages: number;
  hasSelection: boolean;
  isAllSelected: boolean;
}

// Create context
const DynamicTableContext = createContext<DynamicTableContextType | undefined>(undefined);

// Provider component
export const DynamicTableProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfigState] = useState<TableConfig | null>(null);
  const [state, setState] = useState<TableState>({
    data: [],
    loading: false,
    error: null,
    searchTerm: '',
    filters: {},
    sortBy: '',
    sortOrder: 'asc',
    currentPage: 1,
    itemsPerPage: 10,
    selectedRows: new Set(),
    auditLog: [],
  });

  // Configuration Management
  const setConfig = useCallback((newConfig: TableConfig) => {
    setConfigState(newConfig);
    setState(prev => ({
      ...prev,
      sortBy: newConfig.sorting?.defaultSort?.column || '',
      sortOrder: newConfig.sorting?.defaultSort?.direction || 'asc',
      itemsPerPage: newConfig.pagination?.itemsPerPage || 10,
    }));
  }, []);

  const updateConfig = useCallback((updates: Partial<TableConfig>) => {
    setConfigState(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // Data Management
  const setData = useCallback((data: any[]) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  const addRow = useCallback((row: any) => {
    setState(prev => ({ ...prev, data: [...prev.data, row] }));
  }, []);

  const updateRow = useCallback((id: string, updates: any) => {
    setState(prev => ({
      ...prev,
      data: prev.data.map(row => 
        (row._id || row.id) === id ? { ...row, ...updates } : row
      )
    }));
  }, []);

  const deleteRow = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      data: prev.data.filter(row => (row._id || row.id) !== id),
      selectedRows: new Set(Array.from(prev.selectedRows).filter(rowId => rowId !== id))
    }));
  }, []);

  const refreshData = useCallback(async () => {
    if (!config) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // This would typically make an API call
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [config]);

  // State Management
  const setSearchTerm = useCallback((term: string) => {
    setState(prev => ({ ...prev, searchTerm: term, currentPage: 1 }));
  }, []);

  const setFilter = useCallback((filterId: string, value: any) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [filterId]: value },
      currentPage: 1
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchTerm: '',
      filters: {},
      currentPage: 1
    }));
  }, []);

  const setSorting = useCallback((column: string, direction: 'asc' | 'desc') => {
    setState(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: direction,
      currentPage: 1
    }));
  }, []);

  const setPagination = useCallback((page: number, itemsPerPage?: number) => {
    setState(prev => ({
      ...prev,
      currentPage: page,
      itemsPerPage: itemsPerPage || prev.itemsPerPage
    }));
  }, []);

  // Selection Management
  const selectRow = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      selectedRows: new Set([...Array.from(prev.selectedRows), id])
    }));
  }, []);

  const deselectRow = useCallback((id: string) => {
    setState(prev => {
      const newSet = new Set(Array.from(prev.selectedRows));
      newSet.delete(id);
      return { ...prev, selectedRows: newSet };
    });
  }, []);

  const selectAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedRows: new Set(prev.data.map(row => row._id || row.id))
    }));
  }, []);

  const deselectAll = useCallback(() => {
    setState(prev => ({ ...prev, selectedRows: new Set() }));
  }, []);

  const toggleRowSelection = useCallback((id: string) => {
    setState(prev => {
      const newSet = new Set(prev.selectedRows);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { ...prev, selectedRows: newSet };
    });
  }, []);

  // Actions
  const executeAction = useCallback(async (actionId: string, row?: any) => {
    if (!config) return;
    
    const action = config.actions.find(a => a.id === actionId);
    if (!action) return;

    try {
      await action.onClick(row);
      
      // Add to audit log if enabled
      if (config.audit?.enabled) {
        setState(prev => ({
          ...prev,
          auditLog: [...prev.auditLog, {
            action: action.label,
            target: row ? (row._id || row.id) : 'bulk',
            timestamp: new Date().toISOString()
          }]
        }));
      }
    } catch (error) {
      console.error('Action execution failed:', error);
    }
  }, [config]);

  const executeBulkAction = useCallback(async (actionId: string) => {
    if (!config) return;
    
    const action = config.bulkActions?.find(a => a.id === actionId);
    if (!action) return;

    const selectedData = state.data.filter(row => 
      state.selectedRows.has(row._id || row.id)
    );

    try {
      await action.onClick(undefined, selectedData);
      
      // Add to audit log if enabled
      if (config.audit?.enabled) {
        setState(prev => ({
          ...prev,
          auditLog: [...prev.auditLog, {
            action: action.label,
            target: `bulk (${selectedData.length} items)`,
            timestamp: new Date().toISOString()
          }]
        }));
      }
    } catch (error) {
      console.error('Bulk action execution failed:', error);
    }
  }, [config, state.data, state.selectedRows]);

  // Computed Values
  const filteredData = React.useMemo(() => {
    if (!config) return state.data;

    let filtered = state.data;

    // Apply search
    if (state.searchTerm && config.search?.enabled) {
      const searchFields = config.search.searchFields || ['name'];
      filtered = filtered.filter(row =>
        searchFields.some(field => {
          const value = typeof field === 'function' ? field(row) : row[field as string];
          return String(value).toLowerCase().includes(state.searchTerm.toLowerCase());
        })
      );
    }

    // Apply filters
    Object.entries(state.filters).forEach(([filterId, value]) => {
      if (value === null || value === undefined || value === '') return;
      
      const filter = config.filters.find(f => f.id === filterId);
      if (!filter) return;

      filtered = filtered.filter(row => {
        const rowValue = filter.accessor 
          ? (typeof filter.accessor === 'function' ? filter.accessor(row) : row[filter.accessor])
          : row[filterId];
        
        if (filter.type === 'text') {
          return String(rowValue).toLowerCase().includes(String(value).toLowerCase());
        } else if (filter.type === 'number') {
          return Number(rowValue) >= Number(value);
        } else if (filter.type === 'select') {
          return rowValue === value;
        } else if (filter.type === 'boolean') {
          return Boolean(rowValue) === Boolean(value);
        }
        return true;
      });
    });

    // Apply sorting
    if (state.sortBy && config.sorting?.enabled) {
      const column = config.columns.find(c => c.id === state.sortBy);
      if (column) {
        filtered.sort((a, b) => {
          let aVal = column.accessor 
            ? (typeof column.accessor === 'function' ? column.accessor(a) : a[column.accessor])
            : a[column.id];
          let bVal = column.accessor 
            ? (typeof column.accessor === 'function' ? column.accessor(b) : b[column.accessor])
            : b[column.id];

          if (column.type === 'date') {
            aVal = new Date(aVal).getTime();
            bVal = new Date(bVal).getTime();
          } else if (column.type === 'number') {
            aVal = Number(aVal);
            bVal = Number(bVal);
          }

          if (aVal < bVal) return state.sortOrder === 'asc' ? -1 : 1;
          if (aVal > bVal) return state.sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      }
    }

    return filtered;
  }, [state.data, state.searchTerm, state.filters, state.sortBy, state.sortOrder, config]);

  const paginatedData = React.useMemo(() => {
    if (!config?.pagination?.enabled) return filteredData;
    
    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    return filteredData.slice(start, end);
  }, [filteredData, state.currentPage, state.itemsPerPage, config]);

  const totalPages = React.useMemo(() => {
    if (!config?.pagination?.enabled) return 1;
    return Math.ceil(filteredData.length / state.itemsPerPage);
  }, [filteredData.length, state.itemsPerPage, config]);

  const hasSelection = state.selectedRows.size > 0;
  const isAllSelected = state.selectedRows.size === paginatedData.length && paginatedData.length > 0;

  const value: DynamicTableContextType = {
    // State
    config,
    state,
    
    // Configuration Management
    setConfig,
    updateConfig,
    
    // Data Management
    setData,
    addRow,
    updateRow,
    deleteRow,
    refreshData,
    
    // State Management
    setSearchTerm,
    setFilter,
    clearFilters,
    setSorting,
    setPagination,
    
    // Selection Management
    selectRow,
    deselectRow,
    selectAll,
    deselectAll,
    toggleRowSelection,
    
    // Actions
    executeAction,
    executeBulkAction,
    
    // Computed Values
    filteredData,
    paginatedData,
    totalPages,
    hasSelection,
    isAllSelected,
  };

  return (
    <DynamicTableContext.Provider value={value}>
      {children}
    </DynamicTableContext.Provider>
  );
};

// Hook to use dynamic table context
export const useDynamicTable = (): DynamicTableContextType => {
  const context = useContext(DynamicTableContext);
  if (!context) {
    throw new Error('useDynamicTable must be used within a DynamicTableProvider');
  }
  return context;
};
