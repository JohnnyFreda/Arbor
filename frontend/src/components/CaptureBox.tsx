import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckIcon } from '@heroicons/react/24/outline';
import {
  capturesApi,
  Capture,
  CaptureCreate,
  detectSource,
  newClientToken,
} from '../api/captures';

const DRAFT_KEY = 'captureDraft';
const MAX_LENGTH = 20000;
const COUNTER_APPEARS_AT = 19000;

interface Draft {
  content: string;
  token: string;
}

/**
 * The draft survives a refresh, a crash, and a closed tab.
 *
 * The token is stored with it deliberately: if a submit succeeded but the
 * response never arrived, resubmitting the restored draft carries the same
 * idempotency key and resolves to the capture that already exists rather than
 * creating a duplicate.
 */
function readDraft(): Draft {
  try {
    const stored = localStorage.getItem(DRAFT_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<Draft>;
      if (typeof parsed.content === 'string' && typeof parsed.token === 'string') {
        return { content: parsed.content, token: parsed.token };
      }
    }
  } catch {
    // Private browsing, cleared storage, or malformed JSON. An empty box is
    // the right fallback -- never let this throw and take the form down.
  }
  return { content: '', token: newClientToken() };
}

function writeDraft(draft: Draft): void {
  try {
    if (draft.content) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } else {
      localStorage.removeItem(DRAFT_KEY);
    }
  } catch {
    // Storage unavailable. The capture still works; only crash-recovery is lost.
  }
}

interface CaptureBoxProps {
  autoFocus?: boolean;
  onCaptured?: (capture: Capture) => void;
}

export default function CaptureBox({ autoFocus = false, onCaptured }: CaptureBoxProps) {
  const [draft, setDraft] = useState<Draft>(readDraft);
  const [justSaved, setJustSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const savedTimer = useRef<number>();
  const queryClient = useQueryClient();

  useEffect(() => () => window.clearTimeout(savedTimer.current), []);

  const setContent = useCallback((content: string) => {
    setDraft((prev) => {
      const next = { content, token: prev.token };
      writeDraft(next);
      return next;
    });
  }, []);

  const createMutation = useMutation({
    mutationFn: (payload: CaptureCreate) => capturesApi.create(payload),
    onSuccess: (capture) => {
      // Clear only after the server has the thought. A new token starts the
      // next draft so it can't dedupe against the one just saved.
      const fresh = { content: '', token: newClientToken() };
      setDraft(fresh);
      writeDraft(fresh);

      queryClient.invalidateQueries({ queryKey: ['captures'] });

      setJustSaved(true);
      window.clearTimeout(savedTimer.current);
      savedTimer.current = window.setTimeout(() => setJustSaved(false), 2200);

      textareaRef.current?.focus();
      onCaptured?.(capture);
    },
    // No onError reset: the draft stays exactly as typed so a failed request
    // never costs the user their words.
  });

  const trimmed = draft.content.trim();
  const canSubmit = trimmed.length > 0 && !createMutation.isPending;

  const submit = () => {
    if (!canSubmit) return;
    createMutation.mutate({
      content: draft.content,
      source: detectSource(),
      client_token: draft.token,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  const overLimit = draft.content.length > MAX_LENGTH;
  const showCounter = draft.content.length >= COUNTER_APPEARS_AT;

  return (
    <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 ring-1 ring-gray-200/50 dark:ring-white/5 p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Capture</h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Sorted out later
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <label htmlFor="capture-content" className="sr-only">
          What are you thinking?
        </label>
        <textarea
          id="capture-content"
          ref={textareaRef}
          value={draft.content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          rows={4}
          placeholder="A bug hypothesis, a blocker, something to remember tomorrow…"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-y focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        />

        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="text-sm min-h-[1.25rem]" aria-live="polite">
            {createMutation.isError && (
              <span className="text-red-600 dark:text-red-400">
                Couldn't save — your text is safe here. Try again.
              </span>
            )}
            {!createMutation.isError && justSaved && (
              <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckIcon className="h-4 w-4" />
                Captured
              </span>
            )}
            {!createMutation.isError && !justSaved && showCounter && (
              <span
                className={
                  overLimit
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-gray-400'
                }
              >
                {draft.content.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <kbd className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400">
              ⌘↵
            </kbd>
            <button
              type="submit"
              disabled={!canSubmit || overLimit}
              className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 text-white font-medium py-2 px-5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              {createMutation.isPending ? 'Saving…' : 'Capture'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
