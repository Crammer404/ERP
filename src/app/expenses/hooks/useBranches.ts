'use client';

import { useState, useEffect } from 'react';
import { branchService, Branch } from '../../../services';

// Global cache for branches data
let branchesCache: Branch[] | null = null;
let branchesCacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have valid cached data
      const now = Date.now();
      if (branchesCache && branchesCacheTimestamp && (now - branchesCacheTimestamp) < CACHE_DURATION) {
        console.log('Using cached branches data');
        setBranches(branchesCache || []);
        setLoading(false);
        return;
      }

      const response = await branchService.getAll();
      console.log('Fetch branches response:', response);

      // Cache the data
      branchesCache = response.branches;
      branchesCacheTimestamp = now;

      setBranches(response.branches);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  return {
    branches,
    loading,
    error,
    refetch: loadBranches,
  };
}