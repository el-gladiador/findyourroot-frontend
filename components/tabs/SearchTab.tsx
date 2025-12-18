import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronRight, MapPin, Calendar, User, Filter as FilterIcon, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ApiClient } from '@/lib/api';
import PersonModal from '@/components/PersonModal';
import FilterModal, { FilterState } from '@/components/FilterModal';
import { Person } from '@/lib/types';
import { useDebounce } from '@/lib/swipe-hooks';

const SearchTab = () => {
  const [searchInput, setSearchInput] = useState("");
  const searchTerm = useDebounce(searchInput, 300);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    generation: '',
    location: '',
    yearFrom: '',
    yearTo: ''
  });
  
  // Server-side search state
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Perform server-side search
  const performSearch = useCallback(async () => {
    setIsSearching(true);
    try {
      const response = await ApiClient.searchPeople({
        q: searchTerm,
        location: filters.location,
        role: filters.generation, // 'generation' filter maps to role
        yearFrom: filters.yearFrom,
        yearTo: filters.yearTo,
        page,
        pageSize: 20,
      });

      if (response.data) {
        // Normalize data to ensure children is always an array
        const normalizedData = response.data.data.map((person: any) => ({
          ...person,
          children: person.children || []
        }));
        setSearchResults(normalizedData);
        setTotalResults(response.data.total);
        setTotalPages(response.data.total_pages);
      }
    } catch (error) {
      console.error('[Search] Error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, filters, page]);

  // Trigger search when filters or search term changes
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filters]);

  const hasActiveFilters = filters.generation || filters.location || filters.yearFrom || filters.yearTo;

  return (
    <div className="pb-32 pt-4 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen">
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            dir="auto"
            placeholder="Search family member..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all outline-none shadow-sm"
          />
        </div>
        <button 
          onClick={() => setShowFilters(true)}
          className={`px-4 py-3 rounded-xl transition-all ${hasActiveFilters ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
        >
          <FilterIcon size={18} />
        </button>
      </div>

      <div className="space-y-3">
        {/* Loading state */}
        {isSearching && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        )}

        {/* Results count */}
        {!isSearching && totalResults > 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            Showing {searchResults.length} of {totalResults} results
          </p>
        )}

        {!isSearching && searchResults.map(person => (
          <div 
            key={person.id} 
            className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-start gap-4 hover:shadow-md transition-all cursor-pointer group"
            onClick={() => setSelectedPerson(person)}
          >
             <img src={person.avatar} alt={person.name} className="w-14 h-14 rounded-full bg-slate-50 object-cover group-hover:scale-105 transition-transform" />
             <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{person.name}</h3>
                    <p className="text-xs font-medium text-indigo-500 mb-1">{person.role}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {person.location}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> {person.birth}</span>
                </div>
             </div>
          </div>
        ))}
        
        {/* Pagination */}
        {!isSearching && totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-slate-600 dark:text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
        
        {!isSearching && searchResults.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <User size={48} className="mx-auto mb-4 opacity-50" />
            <p>No family members found.</p>
          </div>
        )}
      </div>

      {/* Person Modal */}
      {selectedPerson && (
        <PersonModal person={selectedPerson} onClose={() => setSelectedPerson(null)} />
      )}

      {/* Filter Modal */}
      {showFilters && (
        <FilterModal 
          onClose={() => setShowFilters(false)}
          onApply={setFilters}
          currentFilters={filters}
        />
      )}
    </div>
  );
};

export default SearchTab;
