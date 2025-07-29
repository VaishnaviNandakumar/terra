import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { apiService } from '../services/api';  // <-- Import our service
import { Button } from './ui/Button';
import { ArrowLeft, ArrowRight, Upload, Sparkles, FileText, Download, Plus } from 'lucide-react';
import { ProductTagMapping, VisualizationConfig } from '../types';


interface Transaction {
  id: string;
  date: string;
  narration: string;
  product: string;
  debit_amount: number;
  credit_amount: number;
  tag: string;
  mode: string;
}

interface SortConfig {
  key: keyof Transaction | null;
  direction: 'asc' | 'desc';
}

interface FilterState {
  [key: string]: string;
}

interface EditDashboardViewProps {
  onBack: () => void;
  onProceed: () => void;
}

export const EditDashboardView: React.FC<EditDashboardViewProps> = ({
  onBack,
  onProceed
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTag, setEditedTag] = useState('');
  const [editedProduct, setEditedProduct] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'product' | 'tag' | null>(null);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [pendingProductUpdate, setPendingProductUpdate] = useState<{
    transactionId: string;
    newProduct: string;
  } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  useEffect(() => {
    fetchTransactions();
  }, []); 
  
  const fetchTransactions = async () => {
    try {
      const response = await apiService.getTransactions();
      if (!response.success || !response.data) throw new Error('Failed to fetch transactions');
      setTransactions(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: keyof Transaction) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedTransactions = useMemo(() => {
    if (!sortConfig.key) return transactions;
    return [...transactions].sort((a, b) => {
      if (a[sortConfig.key!] < b[sortConfig.key!]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key!] > b[sortConfig.key!]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [transactions, sortConfig]);

  const filteredTransactions = useMemo(() => {
    return sortedTransactions.filter(transaction => {
      const matchesSearch = Object.values(transaction).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesFilters = Object.entries(filters).every(([key, value]) =>
        String(transaction[key as keyof Transaction]).toLowerCase().includes(value.toLowerCase())
      );
      return matchesSearch && matchesFilters;
    });
  }, [sortedTransactions, searchTerm, filters]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };


  const handleEditTag = async (transactionId: string, newTag: string, applyToAll: boolean) => {
    try {
      const product = transactions.find(t => t.id === transactionId)?.product || '';
      const response = await apiService.updateTag(transactionId, newTag, applyToAll, product);
      if (!response.success) throw new Error('Failed to update tag');
      await fetchTransactions();
      setEditingId(null);
      setEditMode(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tag');
    }
  };
  
  const handleEditProduct = async (transactionId: string, newProduct: string, replaceAll: boolean) => {
    try {
      const currentTransaction = transactions.find(t => t.id === transactionId);
      const response = await apiService.updateProduct(
        transactionId,
        currentTransaction?.product || '',
        newProduct,
        replaceAll,
        currentTransaction?.tag || ''
      );
      if (!response.success) throw new Error('Failed to update product');
      await fetchTransactions();
      setEditingId(null);
      setEditMode(null);
      setShowReplaceDialog(false);
      setPendingProductUpdate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    }
  };

  const handleFilterChange = (column: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const startEditing = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditedTag(transaction.tag);
    setEditedProduct(transaction.product);
    setEditMode('product');
  };

  const handleSave = (transactionId: string) => {
    if (editMode === 'tag') {
      handleEditTag(transactionId, editedTag, false);
    } else if (editMode === 'product') {
      setPendingProductUpdate({ transactionId, newProduct: editedProduct });
      setShowReplaceDialog(true);
    }
  };


  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Replace All Dialog */}
      {showReplaceDialog && pendingProductUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-green-500">Update Product</h3>
            <p className="mb-6 text-black">Would you like to replace all occurrences of this product or just this record?</p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => handleEditProduct(pendingProductUpdate.transactionId, pendingProductUpdate.newProduct, false)}
              >
                Just This Record
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                onClick={() => handleEditProduct(pendingProductUpdate.transactionId, pendingProductUpdate.newProduct, true)}
              >
                Replace All
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 space-y-4">
        <h1 className="text-3xl font-bold text-green-500">Transaction Dashboard</h1>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-black"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {['mode', 'tag'].map(column => (
            <div key={column} className="relative">
              <input
                type="text"
                placeholder={`Filter ${column}...`}
                className="pl-4 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 text-black"
                value={filters[column] || ''}
                onChange={(e) => handleFilterChange(column, e.target.value)}
              />
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable & Responsive Table */}
      <div className="overflow-x-auto rounded-lg shadow border border-[#222]">
        <table className="min-w-full divide-y divide-[#222]">
          <thead className="bg-black/50">
            <tr>
              {['Date', 'Narration', 'Product', 'Debit Amount', 'Credit Amount', 'Tag', 'Mode', 'Actions'].map(header => (
                <th
                  key={header}
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer  ${
                    header === 'Actions' ? 'w-32' : 'min-w-[120px]'
                  }`}
                  onClick={() => header !== 'Actions' && handleSort(header.toLowerCase() as keyof Transaction)}
                >
                  <div className="flex items-center gap-2">
                    {header}
                    {sortConfig.key === header.toLowerCase() && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-transparent divide-y divide-[#222]">
            {currentTransactions.map(transaction => (
              <tr key={transaction.id} className="hover:bg-black/30">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black-300">
                  {format(new Date(transaction.date), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 text-sm text-black-300">{transaction.narration}</td>
                <td className="px-6 py-4 text-sm text-black-300 max-w-[200px]">
                  {editingId === transaction.id ? (
                    <input
                      type="text"
                      className="w-full max-w-[200px] border border-[#333] rounded px-2 py-1 text-sm bg-gray-100 text-black focus:border-green-500 focus:ring-green-500"
                      value={editedProduct}
                      onChange={(e) => setEditedProduct(e.target.value)}
                      disabled={editMode === 'tag'}
                      onClick={() => setEditMode('product')}
                    />
                  ) : (
                    transaction.product
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black-300">
                  ₹{transaction.debit_amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black-300">
                  ₹{transaction.credit_amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-black-300 max-w-[200px]">
                  {editingId === transaction.id ? (
                    <input
                      type="text"
                      className="w-full max-w-[200px] border border-[#333] rounded px-2 py-1 text-sm bg-gray-100 text-black focus:border-green-500 focus:ring-green-500"
                      value={editedTag}
                      onChange={(e) => setEditedTag(e.target.value)}
                      disabled={editMode === 'product'}
                      onClick={() => setEditMode('tag')}
                    />
                  ) : (
                    transaction.tag
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-black-300">{transaction.mode}</td>
                <td className="px-6 py-4 text-sm font-medium w-32">
                  {editingId === transaction.id ? (
                    <div className="flex gap-2">
                      <Check
                        className="w-5 h-5 text-green-500 cursor-pointer hover:text-green-400"
                        onClick={() => handleSave(transaction.id)}
                      />
                      <X
                        className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-400"
                        onClick={() => {
                          setEditingId(null);
                          setEditMode(null);
                        }}
                      />
                    </div>
                  ) : (
                    <Edit2
                      className="w-5 h-5 text-green-500 cursor-pointer hover:text-green-400"
                      onClick={() => startEditing(transaction)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <button
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
      <div className="py-4 border-t border-gray-200 flex justify-between">
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Mapping
          </Button>
          
          <Button 
            onClick={() => onProceed()}
          >
            Proceed to Visualization
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
      </div>
    </div>
  );
}

export default EditDashboardView;
