import { InterpretationType } from '../api/captures';

/**
 * Badge colours for interpretation types.
 *
 * Lived duplicated in InboxCard and CapturePage, which meant the accent
 * appeared in two places that had to be kept in step by hand.
 *
 * `task` is the only entry carrying the brand accent; the rest are status
 * colours and are deliberately not part of the moss palette.
 */
export const TYPE_STYLES: Record<InterpretationType, string> = {
  task: 'bg-moss-100 text-moss-700 dark:bg-moss-500/15 dark:text-moss-300',
  blocker: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  idea: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  note: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  thought: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

/**
 * Badge style for a type that may not be a known InterpretationType -- the
 * interpretation comes from the API, so an unrecognised value falls back to
 * `thought` rather than rendering an unstyled badge.
 */
export const typeStyle = (type: string): string =>
  TYPE_STYLES[type as InterpretationType] ?? TYPE_STYLES.thought;
