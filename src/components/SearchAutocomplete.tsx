import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { trpc } from '@/utils/trpc';

interface SearchAutocompleteProps {
  onCompanySelect?: (cif: string, name: string) => void;
}

interface CompanyResult {
  id: string;
  cif: string;
  name: string;
  city?: string;
}

export function SearchAutocomplete({ onCompanySelect }: SearchAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch autocomplete results
  const { data: results, isLoading } = trpc.companies.search.useQuery(
    {
      query: debouncedQuery,
      limit: 10,
      offset: 0,
    },
    {
      enabled: debouncedQuery.length > 1,
    }
  );

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (cif: string, name: string) => {
    setQuery('');
    setIsOpen(false);
    onCompanySelect?.(cif, name);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.length > 1);
          }}
          onFocus={() => query.length > 1 && setIsOpen(true)}
          placeholder="Caută după CIF sau nume de companie..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {isLoading && debouncedQuery && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin h-5 w-5 border-b-2 border-blue-600 rounded-full"></div>
          </div>
        )}
      </div>

      {isOpen && debouncedQuery && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-600">Căutare...</div>
          ) : results && results.companies.length > 0 ? (
            <ul className="divide-y">
              {results.companies.map((company: CompanyResult) => (
                <li key={company.id}>
                  <button
                    onClick={() => handleSelect(company.cif, company.name)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{company.name}</p>
                      <p className="text-xs text-gray-500">CIF: {company.cif}</p>
                      {company.city && (
                        <p className="text-xs text-gray-500">{company.city}</p>
                      )}
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-600">
              Nu s-au găsit companii pentru "{debouncedQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
