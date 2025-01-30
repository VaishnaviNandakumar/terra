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
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get session ID from URL parameters
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
      // Apply search
      const matchesSearch = Object.values(transaction).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Apply filters
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tag');
    }
  };

  const handleFilterChange = (column: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
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
      <div className="mb-8 space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Transaction Dashboard</h1>
        
        {/* Search and Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="pl-4 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={filters[column] || ''}
                onChange={(e) => handleFilterChange(column, e.target.value)}
              />
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Date', 'Narration', 'Product', 'Amount', 'Tag', 'Mode', 'Actions'].map(header => (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTransactions.map(transaction => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(transaction.date), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{transaction.narration}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{transaction.product}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ₹{transaction.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingId === transaction.id ? (
                    <input
                      type="text"
                      className="border rounded px-2 py-1 text-sm"
                      value={editedTag}
                      onChange={(e) => setEditedTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleEditTag(editingId!, editedTag, false);
                        }
                      }}
                    />
                  ) : (
                    transaction.tag
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.mode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingId === transaction.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          handleEditTag(editingId!, editedTag, false);
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(transaction.id);
                        setEditedTag(transaction.tag);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
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