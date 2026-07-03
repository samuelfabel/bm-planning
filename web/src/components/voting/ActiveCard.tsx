import { useEffect, useState } from 'react';
import type { QueuedCard } from '@/types/planning';
import { inputClass } from '@/components/ui/FormPrimitives';
import { RichHtmlContent } from '@/components/ui/RichHtmlContent';
import { HtmlTextEditor } from '@/components/ui/HtmlTextEditor';
interface ActiveCardProps {
  card: QueuedCard;
  showSubtasks?: boolean;
  canEditDescription?: boolean;
  canManageSubtasks?: boolean;
  onDescriptionChange?: (description: string) => void;
  onAddSubtask?: (title: string) => void;
  onUpdateSubtask?: (id: string, title: string) => void;
  onToggleSubtask?: (id: string) => void;
  onRemoveSubtask?: (id: string) => void;
  canToggleExcludedFromVoting?: boolean;
  onToggleExcludedFromVoting?: () => void;
}

function cardColor(hex: string) {
  return `#${hex.replace(/^#/, '')}`;
}

function PencilIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function TrashIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

const iconBtnClass =
  'p-1 rounded text-bm-textMuted hover:bg-bm-surface transition-colors';

export function ActiveCard({
  card,
  showSubtasks = false,
  canEditDescription = false,
  canManageSubtasks = false,
  onDescriptionChange,
  onAddSubtask,
  onUpdateSubtask,
  onToggleSubtask,
  onRemoveSubtask,
  canToggleExcludedFromVoting = false,
  onToggleExcludedFromVoting,
}: ActiveCardProps) {
  const [editingDescription, setEditingDescription] = useState(false);
  const [draftDescription, setDraftDescription] = useState(card.description ?? '');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [draftSubtaskTitle, setDraftSubtaskTitle] = useState('');

  useEffect(() => {
    if (!editingDescription) {
      setDraftDescription(card.description ?? '');
    }
  }, [card.description, editingDescription]);

  const subtasks = card.subtasks ?? [];
  const doneCount = subtasks.filter((s) => s.done).length;

  const saveDescription = () => {
    onDescriptionChange?.(draftDescription.trim());
    setEditingDescription(false);
  };

  const cancelDescriptionEdit = () => {
    setDraftDescription(card.description ?? '');
    setEditingDescription(false);
  };

  const handleAddSubtask = () => {
    const title = newSubtaskTitle.trim();
    if (!title) return;
    onAddSubtask?.(title);
    setNewSubtaskTitle('');
  };

  const startEditSubtask = (id: string, title: string) => {
    setEditingSubtaskId(id);
    setDraftSubtaskTitle(title);
  };

  const saveSubtaskEdit = () => {
    if (!editingSubtaskId) return;
    const title = draftSubtaskTitle.trim();
    if (!title) return;
    onUpdateSubtask?.(editingSubtaskId, title);
    setEditingSubtaskId(null);
    setDraftSubtaskTitle('');
  };

  const cancelSubtaskEdit = () => {
    setEditingSubtaskId(null);
    setDraftSubtaskTitle('');
  };

  return (
    <div className="bg-bm-surface border border-bm-border rounded-md shadow-sm overflow-hidden">
      <div className="flex">
        <div className="w-1.5 shrink-0" style={{ backgroundColor: cardColor(card.color) }} />
        <div className="flex-1 p-4 sm:p-5 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-3 min-w-0 flex-wrap">
              <span className="text-sm font-mono text-bm-textMuted">#{card.cardId}</span>
              {card.customId && (
                <span className="text-sm font-semibold text-bm-blue">{card.customId}</span>
              )}
              {card.excludedFromVoting && (
                <span className="text-[10px] font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 px-1.5 py-0.5 rounded">
                  Deferred — hidden from participants
                </span>
              )}
            </div>
            {canToggleExcludedFromVoting && (
              <button
                type="button"
                onClick={onToggleExcludedFromVoting}
                className="shrink-0 text-xs font-medium text-bm-textMuted hover:text-bm-textDark whitespace-nowrap"
              >
                {card.excludedFromVoting ? 'Include in voting' : 'Exclude from voting'}
              </button>
            )}
          </div>

          <h2 className={`text-lg font-semibold text-bm-textDark leading-snug ${card.excludedFromVoting ? 'line-through opacity-80' : ''}`}>
            {card.title}
          </h2>

          <div className="mt-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-bm-textMuted">
                Description
              </h3>
              {canEditDescription && !editingDescription && (
                <button
                  type="button"
                  onClick={() => setEditingDescription(true)}
                  className={`${iconBtnClass} text-bm-blue hover:text-blue-700`}
                  aria-label="Edit description"
                >
                  <PencilIcon />
                </button>
              )}
            </div>

            {canEditDescription && editingDescription ? (
              <div className="space-y-2">
                <HtmlTextEditor
                  value={draftDescription}
                  onChange={setDraftDescription}
                  placeholder="Add context for the team before estimating…"
                />
                <div className="flex gap-2">                  <button
                    type="button"
                    onClick={saveDescription}
                    className="text-xs font-medium text-white bg-bm-blue hover:bg-blue-700 px-3 py-1.5 rounded-md"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelDescriptionEdit}
                    className="text-xs font-medium text-bm-textMuted hover:text-bm-textDark px-3 py-1.5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : card.description ? (
              <RichHtmlContent html={card.description} />
            ) : (              <p className="text-sm text-bm-textMuted italic">
                {canEditDescription ? 'No description yet. Use the pencil icon to add one.' : 'No description.'}
              </p>
            )}
          </div>

          {showSubtasks && (subtasks.length > 0 || canManageSubtasks) && (
            <div className="mt-5 pt-4 border-t border-bm-border">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-bm-textMuted">
                  Subtasks
                </h3>
                {subtasks.length > 0 && (
                  <span className="text-xs text-bm-textMuted tabular-nums">
                    {doneCount}/{subtasks.length} done
                  </span>
                )}
              </div>

              {subtasks.length > 0 && (
                <ul className="space-y-2 mb-3">
                  {subtasks.map((subtask) => (
                    <li
                      key={subtask.id}
                      className="flex items-start gap-2 rounded-md border border-bm-border bg-bm-bg/60 px-2.5 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={subtask.done}
                        onChange={() => onToggleSubtask?.(subtask.id)}
                        disabled={!canManageSubtasks}
                        className="mt-0.5 h-4 w-4 rounded border-bm-border text-bm-blue focus:ring-bm-blue/30 disabled:opacity-60"
                      />

                      {canManageSubtasks && editingSubtaskId === subtask.id ? (
                        <div className="flex-1 flex flex-col gap-2 min-w-0">
                          <HtmlTextEditor
                            value={draftSubtaskTitle}
                            onChange={setDraftSubtaskTitle}
                            placeholder="Subtask title"
                            rows={3}
                          />
                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={saveSubtaskEdit}
                              className="text-xs font-medium text-bm-blue hover:text-blue-700 px-2 py-1"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelSubtaskEdit}
                              className="text-xs font-medium text-bm-textMuted hover:text-bm-textDark px-2 py-1"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div
                            className={`flex-1 min-w-0 ${subtask.done ? 'opacity-70 line-through' : ''}`}
                          >
                            <RichHtmlContent html={subtask.title} className="!text-bm-textDark" />
                          </div>
                          {canManageSubtasks && (
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEditSubtask(subtask.id, subtask.title)}
                                className={`${iconBtnClass} hover:text-bm-blue`}
                                aria-label="Edit subtask"
                              >
                                <PencilIcon />
                              </button>
                              <button
                                type="button"
                                onClick={() => onRemoveSubtask?.(subtask.id)}
                                className={`${iconBtnClass} hover:text-red-600`}
                                aria-label="Remove subtask"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {canManageSubtasks && (
                <div className="flex gap-2">
                  <input
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    className={inputClass}
                    placeholder="Add a subtask… (HTML supported)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSubtask();
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim()}
                    aria-label="Add subtask"
                    className="shrink-0 flex items-center justify-center w-9 h-9 rounded-md border border-bm-blue/30 text-bm-blue hover:bg-bm-accentSoft disabled:opacity-40 disabled:cursor-not-allowed text-lg font-medium leading-none"
                  >
                    +
                  </button>
                </div>
              )}

              {!canManageSubtasks && subtasks.length === 0 && (
                <p className="text-sm text-bm-textMuted italic">No subtasks.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
