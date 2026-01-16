'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { StatusConfig, CustomStatus, StatusCategory } from '@/types/status';
import { STATUS_CATEGORY_ORDER } from '@/types/status';
import { getStatusConfig } from '@/lib/services/statusConfig';

interface StatusContextType {
  config: StatusConfig | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  getStatusById: (id: string) => CustomStatus | undefined;
  getStatusesByCategory: (category: StatusCategory) => CustomStatus[];
  getAllStatuses: () => CustomStatus[];
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

export function StatusProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<StatusConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadConfig = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getStatusConfig();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load status config'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const getStatusById = (id: string): CustomStatus | undefined => {
    return config?.statuses.find((s) => s.id === id);
  };

  const getStatusesByCategory = (category: StatusCategory): CustomStatus[] => {
    if (!config) return [];
    return config.statuses
      .filter((s) => s.category === category)
      .sort((a, b) => a.order - b.order);
  };

  const getAllStatuses = (): CustomStatus[] => {
    if (!config) return [];
    // Return statuses sorted by category order, then by order within category
    return [...config.statuses].sort((a, b) => {
      const catOrderA = STATUS_CATEGORY_ORDER.indexOf(a.category);
      const catOrderB = STATUS_CATEGORY_ORDER.indexOf(b.category);
      if (catOrderA !== catOrderB) return catOrderA - catOrderB;
      return a.order - b.order;
    });
  };

  return (
    <StatusContext.Provider
      value={{
        config,
        isLoading,
        error,
        refresh: loadConfig,
        getStatusById,
        getStatusesByCategory,
        getAllStatuses,
      }}
    >
      {children}
    </StatusContext.Provider>
  );
}

export function useStatusConfig() {
  const context = useContext(StatusContext);
  if (context === undefined) {
    throw new Error('useStatusConfig must be used within a StatusProvider');
  }
  return context;
}
