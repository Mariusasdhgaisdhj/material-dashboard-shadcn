import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  Download, 
  TrendingUp,
  Calendar,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { useDynamicTable, TableColumn, TableFilter, TableAction } from '@/contexts/DynamicTableContext';
import { cn } from '@/lib/utils';
import { useDynamicIcon } from '@/contexts/NavigationContext';

// Dynamic Column Renderer
const ColumnRenderer: React.FC<{ column: TableColumn; row: any }> = ({ column, row }) => {
  const Icon = useDynamicIcon(column.label || 'Circle');
  
  const getValue = () => {
    if (column.accessor) {
      return typeof column.accessor === 'function' ? column.accessor(row) : row[column.accessor];
    }
    return row[column.id];
  };

  const value = getValue();

  if (column.render) {
    return <>{column.render(value, row)}</>;
  }

  switch (column.type) {
    case 'text':
      return <span className="text-sm text-gray-900 font-medium">{value}</span>;
    
    case 'number':
      return <span className="text-sm text-gray-900">{value}</span>;
    
    case 'date':
      return (
        <div className="flex items-center space-x-1">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {new Date(value).toLocaleDateString()}
          </span>
        </div>
      );
    
    case 'image':
      return value && value !== 'no_url' ? (
        <button
          onClick={() => {/* Handle image viewer */}}
          className="w-12 h-12 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-gray-400 cursor-zoom-in"
        >
          <img src={value} alt={row.name} className="w-12 h-12 object-cover" />
        </button>
      ) : (
        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
          <span className="text-gray-400 text-xs">No Image</span>
        </div>
      );
    
    case 'badge':
      return (
        <Badge variant={value === 0 ? "secondary" : "default"}>
          {value}
        </Badge>
      );
    
    case 'actions':
      return <ActionButtons row={row} />;
    
    default:
      return <span className="text-sm text-gray-900">{String(value || '')}</span>;
  }
};

// Dynamic Action Buttons
const ActionButtons: React.FC<{ row: any }> = ({ row }) => {
  const { config, executeAction } = useDynamicTable();
  
  if (!config) return null;

  const actions = config.actions.filter(action => 
    !action.requiresSelection && 
    (!action.visible || action.visible(row))
  );

  return (
    <div className="flex space-x-2">
      {actions.map(action => {
        const Icon = useDynamicIcon(action.icon || 'Circle');
        const isDisabled = action.disabled ? action.disabled(row) : false;
        
        return (
          <Button
            key={action.id}
            size="sm"
            variant={action.variant || 'outline'}
            onClick={() => executeAction(action.id, row)}
            disabled={isDisabled}
            className="h-8"
          >
            {Icon && <Icon className="w-4 h-4 mr-1" />}
            {action.label}
          </Button>
        );
      })}
    </div>
  );
};

// Dynamic Filter Component
const FilterComponent: React.FC<{ filter: TableFilter }> = ({ filter }) => {
  const { state, setFilter } = useDynamicTable();
  const value = state.filters[filter.id] || '';

  const handleChange = (newValue: any) => {
    setFilter(filter.id, newValue);
  };

  switch (filter.type) {
    case 'text':
      return (
        <Input
          placeholder={filter.placeholder || `Filter by ${filter.label}...`}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full"
        />
      );
    
    case 'number':
      return (
        <Input
          type="number"
          placeholder={filter.placeholder || `Min ${filter.label}`}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full"
        />
      );
    
    case 'select':
      return (
        <Select value={value} onValueChange={handleChange}>
          <SelectTrigger>
            <SelectValue placeholder={filter.placeholder || `Select ${filter.label}`} />
          </SelectTrigger>
          <SelectContent>
            {filter.options?.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    
    case 'boolean':
      return (
        <Select value={value ? 'true' : 'false'} onValueChange={(val) => handleChange(val === 'true')}>
          <SelectTrigger>
            <SelectValue placeholder={filter.placeholder || `Filter ${filter.label}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      );
    
    default:
      return null;
  }
};

// Main Dynamic Table Component
export const DynamicTable: React.FC = () => {
  const {
    config,
    state,
    setSearchTerm,
    clearFilters,
    setSorting,
    setPagination,
    selectAll,
    deselectAll,
    toggleRowSelection,
    executeBulkAction,
    paginatedData,
    totalPages,
    hasSelection,
    isAllSelected
  } = useDynamicTable();

  if (!config) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">No table configuration provided</div>
        </CardContent>
      </Card>
    );
  }

  if (state.loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{config.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (state.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{config.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-red-500">Error: {state.error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Card className="border-green-200 bg-white shadow-lg">
          <CardHeader className="border-b border-green-200">
            <CardTitle className="flex items-center space-x-2 text-lg font-semibold text-slate-900">
              <TrendingUp className="w-5 h-5" />
              <span>{config.title} Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{state.data.length}</div>
                <div className="text-sm text-gray-600">Total Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{paginatedData.length}</div>
                <div className="text-sm text-gray-600">Filtered Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{hasSelection ? state.selectedRows.size : 0}</div>
                <div className="text-sm text-gray-600">Selected Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="border-gray-200 bg-white shadow-lg">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                {config.title} ({paginatedData.length})
              </CardTitle>
              <div className="flex items-center space-x-2">
                {config.actions.some(a => a.id === 'add') && (
                  <Button size="sm" onClick={() => executeBulkAction('add')}>
                    <Plus className="w-4 h-4 mr-2" /> Add {config.title.slice(0, -1)}
                  </Button>
                )}
                {config.export?.enabled && (
                  <Button variant="outline" size="sm" onClick={() => executeBulkAction('export')}>
                    <Download className="w-4 h-4 mr-2" /> Export
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Filters */}
            <div className="p-4 bg-gray-50 border-b">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {config.search?.enabled && (
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4" />
                    <Input
                      placeholder={config.search.placeholder || "Search..."}
                      value={state.searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                )}
                {config.filters.map(filter => (
                  <FilterComponent key={filter.id} filter={filter} />
                ))}
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            {hasSelection && config.bulkActions && (
              <div className="p-4 bg-red-50 border-b">
                <div className="flex justify-between items-center">
                  <span>{state.selectedRows.size} selected</span>
                  <div className="flex space-x-2">
                    {config.bulkActions.map(action => (
                      <Button
                        key={action.id}
                        variant={action.variant || 'destructive'}
                        size="sm"
                        onClick={() => executeBulkAction(action.id)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">
                      <Checkbox 
                        checked={isAllSelected} 
                        onCheckedChange={(checked) => {
                          if (checked) selectAll();
                          else deselectAll();
                        }} 
                      />
                    </th>
                    {config.columns.map(column => (
                      <th 
                        key={column.id}
                        className={cn(
                          "px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider",
                          column.align === 'center' && "text-center",
                          column.align === 'right' && "text-right"
                        )}
                        style={{ width: column.width }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{column.label}</span>
                          {column.sortable && config.sorting?.enabled && (
                            <div className="flex flex-col">
                              <button
                                onClick={() => setSorting(column.id, 'asc')}
                                className={cn(
                                  "h-3 w-3",
                                  state.sortBy === column.id && state.sortOrder === 'asc' 
                                    ? "text-blue-600" 
                                    : "text-gray-400 hover:text-gray-600"
                                )}
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => setSorting(column.id, 'desc')}
                                className={cn(
                                  "h-3 w-3",
                                  state.sortBy === column.id && state.sortOrder === 'desc' 
                                    ? "text-blue-600" 
                                    : "text-gray-400 hover:text-gray-600"
                                )}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={config.columns.length + 1} className="px-6 py-8 text-center text-gray-500">
                        No data found
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((row, idx) => {
                      const rowId = row._id || row.id;
                      return (
                        <motion.tr 
                          key={rowId || idx} 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4">
                            <Checkbox 
                              checked={state.selectedRows.has(rowId)} 
                              onCheckedChange={() => toggleRowSelection(rowId)} 
                            />
                          </td>
                          {config.columns.map(column => (
                            <td 
                              key={column.id}
                              className={cn(
                                "px-6 py-4 whitespace-nowrap",
                                column.align === 'center' && "text-center",
                                column.align === 'right' && "text-right"
                              )}
                            >
                              <ColumnRenderer column={column} row={row} />
                            </td>
                          ))}
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {config.pagination?.enabled && totalPages > 1 && (
              <div className="p-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((state.currentPage - 1) * state.itemsPerPage) + 1} to{' '}
                    {Math.min(state.currentPage * state.itemsPerPage, state.data.length)} of{' '}
                    {state.data.length} results
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(state.currentPage - 1)}
                      disabled={state.currentPage === 1}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={state.currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPagination(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(state.currentPage + 1)}
                      disabled={state.currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit Log */}
        {config.audit?.enabled && state.auditLog.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">Audit Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  {state.auditLog.slice(-5).reverse().map((log, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{log.action} {log.target}</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};
