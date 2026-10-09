// Helpers for the Create tab's "several at once" entries: names added with the
// "Add more?" button that are all committed together when Save is pressed.
//
// Added entries aren't saved yet, so each one gets a temporary id and can be
// picked (it carries the rest of the chain) before anything is persisted.
// Kept free of React Native imports on purpose so the rules below can be
// unit-tested directly.

export type BatchLevel = "field" | "subject" | "lesson" | "word";
export type AddedEntry = { title: string; content?: string };

const PENDING_PREFIX = "__new_";

export const pendingId = (level: BatchLevel, index: number) => `${PENDING_PREFIX}${level}_${index}`;
export const isPendingId = (id: string | null | undefined) => !!id && id.startsWith(PENDING_PREFIX);
/** The list position a draft id points at, so removals can re-point it. */
export const pendingIndex = (id: string) => Number(id.slice(id.lastIndexOf("_") + 1));

/**
 * Re-points a selection after its entry was removed: the picked entry goes
 * away with it, later entries shift up one slot, earlier ones are untouched.
 * Real (already saved) ids pass straight through.
 */
export function shiftPendingSelection(selected: string | null, level: BatchLevel, removedIndex: number): string | null {
  if (!selected || !isPendingId(selected)) return selected;
  const index = pendingIndex(selected);
  if (index === removedIndex) return null;
  return index > removedIndex ? pendingId(level, index - 1) : selected;
}

// A picked draft resolves to its real id once the batch is committed; a stale
// draft (its entry was removed) resolves to null instead of leaking a fake id.
export function resolveId(id: string | null, made: Map<string, string>): string | null {
  if (!id) return null;
  const created = made.get(id);
  if (created) return created;
  return isPendingId(id) ? null : id;
}

export function firstMade(made: Map<string, string>): string | null {
  return made.size > 0 ? [...made.values()][0] : null;
}
