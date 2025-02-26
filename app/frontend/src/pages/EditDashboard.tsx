import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  date: string;
  narration: string;
  product: string;
  amount: number;
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

export function EditDashboard() {
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

  const sessionId = new URLSearchParams(window.location.search).get('sessionId');

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }
    fetchTransactions();
  }, [sessionId]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/edit?sessionId=${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data);
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
      if (a[sortConfig.key!] < b[sortConfig.key!]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key!] > b[sortConfig.key!]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
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

  const handleEditTag = async (transactionId: string, newTag: string, applyToAll: boolean) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/update-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          transactionId,
          newTag,
          applyToAll,
          product: transactions.find(t => t.id === transactionId)?.product
        })
      });

      if (!response.ok) throw new Error('Failed to update tag');
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
      const response = await fetch('http://127.0.0.1:5000/update-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          transactionId,
          oldProduct: currentTransaction?.product,
          newProduct,
          replaceAll,
          tag: currentTransaction?.tag
        })
      });

      if (!response.ok) throw new Error('Failed to update product');
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
  };

  const handleSave = (transactionId: string) => {
    if (editMode === 'tag') {
      handleEditTag(transactionId, editedTag, false);
    } else if (editMode === 'product') {
      setPendingProductUpdate({ transactionId, newProduct: editedProduct });
      setShowReplaceDialog(true);
    }
  };

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 p-4">No session ID provided. Please return to the main page.</div>
      </div>
    );
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Replace All Dialog */}
      {showReplaceDialog && pendingProductUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Update Product</h3>
            <p className="mb-6">Would you like to replace all occurrences of this product or just this record?</p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => {
                  handleEditProduct(pendingProductUpdate.transactionId, pendingProductUpdate.newProduct, false);
                }}
              >
                Just This Record
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                onClick={() => {
                  handleEditProduct(pendingProductUpdate.transactionId, pendingProductUpdate.newProduct, true);
                }}
              >
                Replace All
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 space-y-4">
        <h1 className="text-3xl font-bold text-green-500">Transaction Dashboard</h1>

        {/* Search and Filters */}
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

          {/* Column Filters */}
          {['date', 'mode', 'tag'].map(column => (
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

      {/* Transactions Table */}
      <div className="overflow-x-auto bg-[#111111] rounded-lg shadow border border-[#222222]">
        <table className="min-w-full divide-y divide-[#222222]">
          <thead className="bg-black/50">
            <tr>
              {['Date', 'Narration', 'Product', 'Amount', 'Tag', 'Mode', 'Actions'].map(header => (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-[#111111]"
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
          <tbody className="bg-transparent divide-y divide-[#222222]">
            {filteredTransactions.map(transaction => (
              <tr key={transaction.id} className="hover:bg-black/30">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {format(new Date(transaction.date), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">{transaction.narration}</td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {editingId === transaction.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="border border-[#333333] rounded px-2 py-1 text-sm bg-gray-100 text-black focus:border-green-500 focus:ring-green-500"
                        value={editedProduct}
                        onChange={(e) => setEditedProduct(e.target.value)}
                        disabled={editMode === 'tag'}
                        onClick={() => setEditMode('product')}
                        placeholder="Click to edit product"
                      />
                    </div>
                  ) : (
                    transaction.product
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  ₹{transaction.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {editingId === transaction.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="border border-[#333333] rounded px-2 py-1 text-sm bg-gray-100 text-black focus:border-green-500 focus:ring-green-500"
                        value={editedTag}
                        onChange={(e) => setEditedTag(e.target.value)}
                        disabled={editMode === 'product'}
                        onClick={() => setEditMode('tag')}
                        placeholder="Click to edit tag"
                      />
                    </div>
                  ) : (
                    transaction.tag
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">{transaction.mode}</td>
                <td className="px-6 py-4 text-sm font-medium">
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
    </div>
  );
}

export default EditDashboard;