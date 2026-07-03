import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_BOARDS, MOCK_COLUMNS, MOCK_LANES } from '@/mocks/config';
import { MOCK_CARDS } from '@/mocks/cards';
import { usePlanning } from '@/context/PlanningContext';
import { useAuth } from '@/context/AuthContext';
import { Card, FormField, inputClass, selectClass, PrimaryButton } from '@/components/ui/FormPrimitives';
import type { BusinessmapCard } from '@/types/businessmap';
import type { QueuedCard } from '@/types/planning';

export function CardQuerySection() {
  const navigate = useNavigate();
  const { createSession } = usePlanning();
  const { config } = useAuth();

  const [boardId, setBoardId] = useState<number | ''>(10);
  const [columnId, setColumnId] = useState<number | ''>('');
  const [laneId, setLaneId] = useState<number | ''>('');
  const [tagFilter, setTagFilter] = useState('');
  const [textSearch, setTextSearch] = useState('');
  const [results, setResults] = useState<BusinessmapCard[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const columns = boardId ? MOCK_COLUMNS[boardId] ?? [] : [];
  const lanes = boardId ? MOCK_LANES[boardId] ?? [] : [];

  const handleSearch = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    let filtered = MOCK_CARDS.filter((c) => c.boardId === boardId);
    if (columnId) filtered = filtered.filter((c) => c.columnId === columnId);
    if (laneId) filtered = filtered.filter((c) => c.laneId === laneId);
    if (tagFilter) {
      const tag = tagFilter.toLowerCase();
      filtered = filtered.filter((c) => c.tags?.some((t) => t.includes(tag)));
    }
    if (textSearch) {
      const q = textSearch.toLowerCase();
      filtered = filtered.filter(
        (c) => c.title.toLowerCase().includes(q) || c.customId?.toLowerCase().includes(q),
      );
    }

    setResults(filtered);
    setSelected(new Set(filtered.map((c) => c.cardId)));
    setSearched(true);
    setLoading(false);
  };

  const toggleCard = (cardId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map((c) => c.cardId)));
    }
  };

  const canCreate = selected.size > 0 && config?.customFieldMapping;

  const handleCreateRoom = () => {
    const queue: QueuedCard[] = results
      .filter((c) => selected.has(c.cardId))
      .map((c, i) => ({
        cardId: c.cardId,
        customId: c.customId,
        title: c.title,
        description: c.description,
        color: c.color,
        position: i,
      }));

    createSession(`Planning — ${MOCK_BOARDS.find((b) => b.boardId === boardId)?.name ?? 'Sprint'}`, queue);
    navigate('/room/demo');
  };

  const resultLabel = useMemo(() => {
    if (!searched) return null;
    return `${results.length} tarefa${results.length !== 1 ? 's' : ''} encontrada${results.length !== 1 ? 's' : ''}`;
  }, [searched, results.length]);

  return (
    <Card title="Query de Tarefas">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Quadro (Board)">
          <select
            className={selectClass}
            value={boardId}
            onChange={(e) => {
              setBoardId(Number(e.target.value));
              setColumnId('');
              setLaneId('');
            }}
          >
            {MOCK_BOARDS.map((b) => (
              <option key={b.boardId} value={b.boardId}>{b.name}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Coluna">
          <select
            className={selectClass}
            value={columnId}
            onChange={(e) => setColumnId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Todas as colunas</option>
            {columns.map((c) => (
              <option key={c.columnId} value={c.columnId}>{c.name}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Raia (Lane)">
          <select
            className={selectClass}
            value={laneId}
            onChange={(e) => setLaneId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Todas as raias</option>
            {lanes.map((l) => (
              <option key={l.laneId} value={l.laneId}>{l.name}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Tags">
          <input
            type="text"
            className={inputClass}
            placeholder="backend, frontend, bug…"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Busca por título ou ID">
        <input
          type="text"
          className={inputClass}
          placeholder="US-142, autenticação, dashboard…"
          value={textSearch}
          onChange={(e) => setTextSearch(e.target.value)}
        />
      </FormField>

      <div className="flex items-center gap-3 pt-1">
        <PrimaryButton onClick={handleSearch} disabled={loading}>
          {loading ? 'Buscando…' : 'Buscar Tarefas'}
        </PrimaryButton>
        {resultLabel && (
          <span className="text-sm text-bm-textMuted">{resultLabel}</span>
        )}
      </div>

      {searched && results.length > 0 && (
        <div className="mt-2 border border-bm-border rounded-md overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-bm-board border-b border-bm-border">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selected.size === results.length && results.length > 0}
                onChange={toggleAll}
                className="rounded border-bm-border text-bm-blue focus:ring-bm-blue"
              />
              Selecionar todos ({selected.size}/{results.length})
            </label>
          </div>
          <ul className="divide-y divide-bm-border max-h-64 overflow-y-auto">
            {results.map((card) => (
              <li key={card.cardId} className="flex items-start gap-3 px-3 py-2.5 hover:bg-bm-board/50 transition-colors">
                <input
                  type="checkbox"
                  checked={selected.has(card.cardId)}
                  onChange={() => toggleCard(card.cardId)}
                  className="mt-1 rounded border-bm-border text-bm-blue focus:ring-bm-blue"
                />
                <div
                  className="w-1 self-stretch rounded-full shrink-0"
                  style={{ backgroundColor: `#${card.color}` }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-bm-textMuted">#{card.cardId}</span>
                    {card.customId && (
                      <span className="text-xs text-bm-blue font-medium">{card.customId}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-bm-textDark truncate">{card.title}</p>
                  {card.tags && (
                    <div className="flex gap-1 mt-1">
                      {card.tags.map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-bm-textMuted rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {searched && results.length === 0 && (
        <p className="text-sm text-bm-textMuted text-center py-6">
          Nenhuma tarefa encontrada com os filtros selecionados.
        </p>
      )}

      {canCreate && (
        <div className="pt-3 border-t border-bm-border">
          <PrimaryButton onClick={handleCreateRoom} className="w-full sm:w-auto">
            Criar Sala de Planning ({selected.size} tarefas)
          </PrimaryButton>
        </div>
      )}
    </Card>
  );
}
