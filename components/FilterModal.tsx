'use client';

import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';

interface FilterModalProps {
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  currentFilters: FilterState;
}

export interface FilterState {
  generation: string;
  location: string;
  yearFrom: string;
  yearTo: string;
}

const FilterModal: React.FC<FilterModalProps> = ({ onClose, onApply, currentFilters }) => {
  const [filters, setFilters] = useState<FilterState>(currentFilters);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (filters.yearFrom && filters.yearTo) {
      const from = parseInt(filters.yearFrom);
      const to = parseInt(filters.yearTo);
      
      if (from > to) {
        newErrors.yearFrom = 'Start year must be before end year';
      }
      if (from < 1900 || from > new Date().getFullYear()) {
        newErrors.yearFrom = 'Enter a valid year';
      }
      if (to < 1900 || to > new Date().getFullYear()) {
        newErrors.yearTo = 'Enter a valid year';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApply = () => {
    if (validate()) {
      onApply(filters);
      onClose();
    }
  };

  const handleReset = () => {
    const resetFilters = { generation: '', location: '', yearFrom: '', yearTo: '' };
    setFilters(resetFilters);
    setErrors({});
  };

  return (
    <div 
      className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Filter size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Advanced Filters</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Generation Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Generation
            </label>
            <select 
              value={filters.generation}
              onChange={(e) => setFilters({ ...filters, generation: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="">All Generations</option>
              <option value="Grandfather">Grandparents</option>
              <option value="Father">Parents</option>
              <option value="Son">Children</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Location
            </label>
            <select 
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="">All Locations</option>
              <option value="London">London, UK</option>
              <option value="Yorkshire">Yorkshire, UK</option>
              <option value="Bristol">Bristol, UK</option>
              <option value="Edinburgh">Edinburgh, UK</option>
            </select>
          </div>

          {/* Birth Year Range */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Birth Year Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input 
                  type="number" 
                  placeholder="From"
                  value={filters.yearFrom}
                  onChange={(e) => setFilters({ ...filters, yearFrom: e.target.value })}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border ${errors.yearFrom ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                />
                {errors.yearFrom && (
                  <p className="text-xs text-rose-500 mt-1">{errors.yearFrom}</p>
                )}
              </div>
              <div>
                <input 
                  type="number" 
                  placeholder="To"
                  value={filters.yearTo}
                  onChange={(e) => setFilters({ ...filters, yearTo: e.target.value })}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border ${errors.yearTo ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                />
                {errors.yearTo && (
                  <p className="text-xs text-rose-500 mt-1">{errors.yearTo}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button 
            onClick={handleReset}
            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Reset
          </button>
          <button 
            onClick={handleApply}
            className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
