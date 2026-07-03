import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useApiCredentials } from '@/context/AuthContext';
import { useBusinessmapProxy } from '@/context/BusinessmapProxyContext';
import { DEFAULT_SESSION_SETTINGS } from '@/mocks/config';
import { createRoom } from '@/services/api';
import { RoomSettingsFields } from './RoomSettingsFields';
import {
  Card,
  FormField,
  inputClass,
  selectClass,
  PrimaryButton,
  SecondaryButton,
} from '@/components/ui/FormPrimitives';
import type { BusinessmapCard, BusinessmapColumn, BusinessmapLane } from '@/types/businessmap';
import type { QueuedCard, SessionSettings } from '@/types/planning';
import { isEstimationTargetReady } from '@/types/planning';
import { toApiQueueCard } from '@/types/api';

interface QueryDraft {
  id: string;
  label: string;
  boardId: number | '';
  columnId: number | '';
  laneId: number | '';
  tagFilter: string;
  textSearch: string;
  columns: BusinessmapColumn[];
  lanes: BusinessmapLane[];
  results: BusinessmapCard[];
  selectedIds: number[];
  searched: boolean;
  loading: boolean;
  error: string | null;
}

function createEmptyQuery(label: string): QueryDraft {
  return {
    id: `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    label,
    boardId: '',
    columnId: '',
    laneId: '',
    tagFilter: '',
    textSearch: '',
    columns: [],
    lanes: [],
    results: [],
    selectedIds: [],
    searched: false,
    loading: false,
    error: null,
  };
}

function cardToQueued(card: BusinessmapCard, position: number): QueuedCard {
  return {
    cardId: card.cardId,
    customId: card.customId,
    title: card.title,
    description: card.description,
    color: card.color,
    position,
  };
}

export function CardQuerySection() {
  const navigate = useNavigate();
  const { workspace, profile } = useAuth();
  const credentials = useApiCredentials();
  const { boards, loadingBoards, loadColumns, loadLanes, searchCards } = useBusinessmapProxy();

  const [roomName, setRoomName] = useState('');
  const [sessionSettings, setSessionSettings] = useState<SessionSettings>(DEFAULT_SESSION_SETTINGS);
  const [queries, setQueries] = useState<QueryDraft[]>(() => [createEmptyQuery('Squad 1')]);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const hasCredentials = Boolean(credentials);

  const updateQuery = useCallback((id: string, patch: Partial<QueryDraft>) => {
    setQueries((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }, []);

  useEffect(() => {
    if (boards.length === 0) return;
    setQueries((prev) =>
      prev.map((q) => (q.boardId === '' ? { ...q, boardId: boards[0].boardId } : q)),
    );
  }, [boards]);

  const loadBoardMeta = useCallback(
    async (queryId: string, boardId: number) => {
      if (!credentials) return;
      try {
        const [columns, lanes] = await Promise.all([
          loadColumns(boardId),
          loadLanes(boardId),
        ]);
        updateQuery(queryId, { columns, lanes });
      } catch {
        updateQuery(queryId, { columns: [], lanes: [] });
      }
    },
    [credentials, loadColumns, loadLanes, updateQuery],
  );

  useEffect(() => {
    for (const query of queries) {
      if (query.boardId && query.columns.length === 0 && credentials) {
        void loadBoardMeta(query.id, Number(query.boardId));
      }
    }
  }, [queries, credentials, loadBoardMeta]);

  const handleBoardChange = (queryId: string, boardId: number) => {
    updateQuery(queryId, {
      boardId,
      columnId: '',
      laneId: '',
      columns: [],
      lanes: [],
    });
    void loadBoardMeta(queryId, boardId);
  };

  const handleSearch = async (queryId: string) => {
    const query = queries.find((q) => q.id === queryId);
    if (!query?.boardId) return;

    updateQuery(queryId, { loading: true, error: null });

    try {
      const filtered = await searchCards({
        boardId: Number(query.boardId),
        columnIds: query.columnId ? [Number(query.columnId)] : [],
        laneIds: query.laneId ? [Number(query.laneId)] : [],
        textSearch: query.textSearch,
        tagFilter: query.tagFilter,
      });

      updateQuery(queryId, {
        results: filtered,
        selectedIds: filtered.map((c) => c.cardId),
        searched: true,
        loading: false,
      });
    } catch (err) {
      updateQuery(queryId, {
        results: [],
        selectedIds: [],
        searched: true,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to search tasks',
      });
    }
  };

  const toggleCard = (queryId: string, cardId: number) => {
    setQueries((prev) =>
      prev.map((q) => {
        if (q.id !== queryId) return q;
        const selected = new Set(q.selectedIds);
        if (selected.has(cardId)) selected.delete(cardId);
        else selected.add(cardId);
        return { ...q, selectedIds: Array.from(selected) };
      }),
    );
  };

  const toggleAll = (queryId: string) => {
    setQueries((prev) =>
      prev.map((q) => {
        if (q.id !== queryId) return q;
        const allSelected = q.selectedIds.length === q.results.length && q.results.length > 0;
        return {
          ...q,
          selectedIds: allSelected ? [] : q.results.map((c) => c.cardId),
        };
      }),
    );
  };

  const addQuery = () => {
    const nextIndex = queries.length + 1;
    const next = createEmptyQuery(`Squad ${nextIndex}`);
    if (boards.length > 0) next.boardId = boards[0].boardId;
    setQueries((prev) => [...prev, next]);
  };

  const removeQuery = (queryId: string) => {
    setQueries((prev) => (prev.length <= 1 ? prev : prev.filter((q) => q.id !== queryId)));
  };

  const selectedCards = useMemo(() => {
    const seen = new Set<number>();
    const cards: BusinessmapCard[] = [];
    for (const query of queries) {
      for (const card of query.results) {
        if (query.selectedIds.includes(card.cardId) && !seen.has(card.cardId)) {
          seen.add(card.cardId);
          cards.push(card);
        }
      }
    }
    return cards;
  }, [queries]);

  const activeQueries = queries.filter((q) => q.selectedIds.length > 0);
  const canCreate = selectedCards.length > 0 && isEstimationTargetReady(workspace);

  const handleCreateRoom = async () => {
    const queue = selectedCards.map(cardToQueued);
    if (!queue.length) return;
    const defaultName =
      activeQueries.length > 0
        ? `Planning — ${activeQueries.map((q) => q.label).join(', ')}`
        : 'Planning session';

    setCreatingRoom(true);
    setCreateError(null);

    try {
      const response = await createRoom({
        name: roomName.trim() || defaultName,
        mode: 'live',
        queue: queue.map(toApiQueueCard),
        config: {
          subdomain: workspace.subdomain,
          facilitator_name: profile.displayName.trim() || 'Facilitator',
          facilitator_role: profile.facilitatorRole,
          deck: {
            type: sessionSettings.deck.type,
            values: sessionSettings.deck.values,
            allow_pass: sessionSettings.deck.allowPass,
            allow_break: sessionSettings.deck.allowBreak,
          },
          consensus_algorithm: sessionSettings.consensusAlgorithm,
          sync_value_source: sessionSettings.syncValueSource,
        },
      });
      navigate(`/room/${response.id}?facilitator=1`, { state: { asFacilitator: true } });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setCreatingRoom(false);
    }
  };

  const patchSessionSettings = (partial: Partial<SessionSettings>) => {
    setSessionSettings((prev) => ({ ...prev, ...partial }));
  };

  return (
    <Card title="Create planning room">
      {!hasCredentials && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Set your profile API key and workspace subdomain to search real tasks from Businessmap.
        </p>
      )}

      <FormField label="Room name" hint="Optional — auto-generated from squad labels if empty">
        <input
          type="text"
          className={inputClass}
          placeholder="Sprint 24 — Multi-squad planning"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
      </FormField>

      <div className="border border-bm-border rounded-md overflow-hidden">
        <div className="px-4 py-3 bg-bm-board border-b border-bm-border">
          <h3 className="text-sm font-semibold text-bm-textDark">Room settings</h3>
          <p className="text-xs text-bm-textMuted mt-0.5">
            Deck and consensus rules for this planning session
          </p>
        </div>
        <div className="p-4">
          <RoomSettingsFields settings={sessionSettings} onChange={patchSessionSettings} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-bm-textDark">Task queries</h3>
            <p className="text-xs text-bm-textMuted mt-0.5">
              One query per squad or board — selected tasks merge into a single queue
            </p>
          </div>
          <SecondaryButton onClick={addQuery} className="shrink-0 text-xs px-3 py-1.5">
            + Add query
          </SecondaryButton>
        </div>

        {queries.map((query, index) => (
          <div
            key={query.id}
            className="border border-bm-border rounded-md overflow-hidden bg-bm-surface"
          >
            <div className="flex items-center gap-2 px-3 py-2.5 bg-bm-board border-b border-bm-border">
              <input
                type="text"
                value={query.label}
                onChange={(e) => updateQuery(query.id, { label: e.target.value })}
                className="flex-1 min-w-0 px-2 py-1 text-sm font-medium bg-bm-surface border border-bm-border rounded-md"
                placeholder={`Squad ${index + 1}`}
              />
              {queries.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuery(query.id)}
                  className="text-xs text-bm-textMuted hover:text-red-600 px-2 py-1"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="p-4 space-y-4">
              {query.error && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {query.error}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Board">
                  <select
                    className={selectClass}
                    value={query.boardId}
                    disabled={loadingBoards || boards.length === 0}
                    onChange={(e) => handleBoardChange(query.id, Number(e.target.value))}
                  >
                    {boards.length === 0 ? (
                      <option value="">
                        {loadingBoards ? 'Loading boards…' : 'No boards available'}
                      </option>
                    ) : (
                      boards.map((b) => (
                        <option key={b.boardId} value={b.boardId}>
                          {b.name}
                        </option>
                      ))
                    )}
                  </select>
                </FormField>

                <FormField label="Column">
                  <select
                    className={selectClass}
                    value={query.columnId}
                    onChange={(e) =>
                      updateQuery(query.id, {
                        columnId: e.target.value ? Number(e.target.value) : '',
                      })
                    }
                  >
                    <option value="">All columns</option>
                    {query.columns.map((c) => (
                      <option key={c.columnId} value={c.columnId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Lane">
                  <select
                    className={selectClass}
                    value={query.laneId}
                    onChange={(e) =>
                      updateQuery(query.id, {
                        laneId: e.target.value ? Number(e.target.value) : '',
                      })
                    }
                  >
                    <option value="">All lanes</option>
                    {query.lanes.map((l) => (
                      <option key={l.laneId} value={l.laneId}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Tags">
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="backend, frontend, bug…"
                    value={query.tagFilter}
                    onChange={(e) => updateQuery(query.id, { tagFilter: e.target.value })}
                  />
                </FormField>
              </div>

              <FormField label="Search by title or ID">
                <input
                  type="text"
                  className={inputClass}
                  placeholder="US-142, authentication, dashboard…"
                  value={query.textSearch}
                  onChange={(e) => updateQuery(query.id, { textSearch: e.target.value })}
                />
              </FormField>

              <div className="flex items-center gap-3">
                <PrimaryButton
                  onClick={() => handleSearch(query.id)}
                  disabled={query.loading || !hasCredentials || !query.boardId}
                >
                  {query.loading ? 'Searching…' : 'Search tasks'}
                </PrimaryButton>
                {query.searched && (
                  <span className="text-sm text-bm-textMuted">
                    {query.results.length} found · {query.selectedIds.length} selected
                  </span>
                )}
              </div>

              {query.searched && query.results.length > 0 && (
                <div className="border border-bm-border rounded-md overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-bm-board border-b border-bm-border">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          query.selectedIds.length === query.results.length &&
                          query.results.length > 0
                        }
                        onChange={() => toggleAll(query.id)}
                        className="rounded border-bm-border text-bm-blue focus:ring-bm-blue"
                      />
                      Select all ({query.selectedIds.length}/{query.results.length})
                    </label>
                  </div>
                  <ul className="divide-y divide-bm-border max-h-48 overflow-y-auto">
                    {query.results.map((card) => (
                      <li
                        key={card.cardId}
                        className="flex items-start gap-3 px-3 py-2.5 hover:bg-bm-board/50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={query.selectedIds.includes(card.cardId)}
                          onChange={() => toggleCard(query.id, card.cardId)}
                          className="mt-1 rounded border-bm-border text-bm-blue focus:ring-bm-blue"
                        />
                        <div
                          className="w-1 self-stretch rounded-full shrink-0"
                          style={{ backgroundColor: `#${card.color.replace(/^#/, '')}` }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-bm-textMuted">
                              #{card.cardId}
                            </span>
                            {card.customId && (
                              <span className="text-xs text-bm-blue font-medium">
                                {card.customId}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-bm-textDark truncate">
                            {card.title}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {query.searched && query.results.length === 0 && (
                <p className="text-sm text-bm-textMuted text-center py-4">
                  No tasks found with the selected filters.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedCards.length > 0 && !isEstimationTargetReady(workspace) && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Select a custom field or choose native Size before creating a room.
        </p>
      )}

      {canCreate && (
        <div className="pt-3 border-t border-bm-border space-y-2">
          {createError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {createError}
            </p>
          )}
          <p className="text-sm text-bm-textMuted">
            {selectedCards.length} task{selectedCards.length !== 1 ? 's' : ''} selected across{' '}
            {activeQueries.length} quer{activeQueries.length !== 1 ? 'ies' : 'y'}
          </p>
          <PrimaryButton
            onClick={() => void handleCreateRoom()}
            disabled={creatingRoom}
            className="w-full sm:w-auto"
          >
            {creatingRoom
              ? 'Creating room...'
              : `Create planning room (${selectedCards.length} tasks)`}
          </PrimaryButton>
        </div>
      )}
    </Card>
  );
}
