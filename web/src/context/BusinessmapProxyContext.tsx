import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useApiCredentials } from '@/context/AuthContext';
import {
  listBoards,
  listColumns,
  listCustomFields,
  listLanes,
  searchCards as bmSearchCards,
  type BusinessmapCredentials,
} from '@/services/businessmapApi';
import type {
  BusinessmapBoard,
  BusinessmapColumn,
  BusinessmapCard,
  BusinessmapCustomField,
  BusinessmapLane,
  CardQuery,
} from '@/types/businessmap';

interface BusinessmapProxyContextValue {
  boards: BusinessmapBoard[];
  customFields: BusinessmapCustomField[];
  loadingBoards: boolean;
  loadingCustomFields: boolean;
  error: string | null;
  reloadCatalog: () => Promise<void>;
  loadBoards: () => Promise<BusinessmapBoard[]>;
  loadCustomFields: () => Promise<BusinessmapCustomField[]>;
  loadColumns: (boardId: number) => Promise<BusinessmapColumn[]>;
  loadLanes: (boardId: number) => Promise<BusinessmapLane[]>;
  searchCards: (query: CardQuery) => Promise<BusinessmapCard[]>;
}

const BusinessmapProxyContext = createContext<BusinessmapProxyContextValue | null>(null);

function useBusinessmapProxyState(credentials: BusinessmapCredentials | null): BusinessmapProxyContextValue {
  const [boards, setBoards] = useState<BusinessmapBoard[]>([]);
  const [customFields, setCustomFields] = useState<BusinessmapCustomField[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [loadingCustomFields, setLoadingCustomFields] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    if (!credentials) return { boards: [] as BusinessmapBoard[], customFields: [] as BusinessmapCustomField[] };

    setLoadingBoards(true);
    setLoadingCustomFields(true);
    setError(null);

    try {
      const [mappedBoards, mappedFields] = await Promise.all([
        listBoards(credentials),
        listCustomFields(credentials),
      ]);
      setBoards(mappedBoards);
      setCustomFields(mappedFields);
      return { boards: mappedBoards, customFields: mappedFields };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Businessmap data');
      return { boards: [], customFields: [] };
    } finally {
      setLoadingBoards(false);
      setLoadingCustomFields(false);
    }
  }, [credentials]);

  const reloadCatalog = useCallback(async () => {
    await loadCatalog();
  }, [loadCatalog]);

  const loadBoardsFn = useCallback(async () => {
    const result = await loadCatalog();
    return result.boards;
  }, [loadCatalog]);

  const loadCustomFieldsFn = useCallback(async () => {
    const result = await loadCatalog();
    return result.customFields;
  }, [loadCatalog]);

  const loadColumns = useCallback(
    async (boardId: number): Promise<BusinessmapColumn[]> => {
      if (!credentials) return [];
      return listColumns(credentials, boardId);
    },
    [credentials],
  );

  const loadLanes = useCallback(
    async (boardId: number): Promise<BusinessmapLane[]> => {
      if (!credentials) return [];
      return listLanes(credentials, boardId);
    },
    [credentials],
  );

  const searchCards = useCallback(
    async (query: CardQuery): Promise<BusinessmapCard[]> => {
      if (!credentials || !query.boardId) return [];
      return bmSearchCards(credentials, query);
    },
    [credentials],
  );

  useEffect(() => {
    if (!credentials) {
      setBoards([]);
      setCustomFields([]);
      setError(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      setLoadingBoards(true);
      setLoadingCustomFields(true);
      setError(null);
      try {
        const [mappedBoards, mappedFields] = await Promise.all([
          listBoards(credentials),
          listCustomFields(credentials),
        ]);
        if (cancelled) return;
        setBoards(mappedBoards);
        setCustomFields(mappedFields);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load Businessmap data');
      } finally {
        if (!cancelled) {
          setLoadingBoards(false);
          setLoadingCustomFields(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [credentials]);

  return useMemo(
    () => ({
      boards,
      customFields,
      loadingBoards,
      loadingCustomFields,
      error,
      reloadCatalog,
      loadBoards: loadBoardsFn,
      loadCustomFields: loadCustomFieldsFn,
      loadColumns,
      loadLanes,
      searchCards,
    }),
    [
      boards,
      customFields,
      loadingBoards,
      loadingCustomFields,
      error,
      reloadCatalog,
      loadBoardsFn,
      loadCustomFieldsFn,
      loadColumns,
      loadLanes,
      searchCards,
    ],
  );
}

export function BusinessmapProxyProvider({ children }: { children: ReactNode }) {
  const credentials = useApiCredentials();
  const value = useBusinessmapProxyState(credentials);

  return (
    <BusinessmapProxyContext.Provider value={value}>{children}</BusinessmapProxyContext.Provider>
  );
}

export function useBusinessmapProxy() {
  const ctx = useContext(BusinessmapProxyContext);
  if (!ctx) {
    throw new Error('useBusinessmapProxy must be used within BusinessmapProxyProvider');
  }
  return ctx;
}
