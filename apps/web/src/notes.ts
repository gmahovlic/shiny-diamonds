import { signal } from "@preact/signals";

/** Private per-hex marks: 0 none, 1 "impossível", 2 "dúvida". Stored only on this device. */
export type Note = 0 | 1 | 2;
export const notes = signal<Record<number, Note>>({});
export const notesMode = signal(false);

let key = "";

export function loadNotes(code: string, memberId: string): void {
  key = `sd:notes:${code}:${memberId}`;
  try {
    notes.value = JSON.parse(localStorage.getItem(key) ?? "{}") as Record<number, Note>;
  } catch {
    notes.value = {};
  }
}

export function cycleNote(cell: number): void {
  const cur = notes.value[cell] ?? 0;
  const next = ((cur + 1) % 3) as Note;
  const copy = { ...notes.value };
  if (next === 0) delete copy[cell];
  else copy[cell] = next;
  notes.value = copy;
  try {
    localStorage.setItem(key, JSON.stringify(copy));
  } catch {
    // ignore
  }
}

export function clearNotes(): void {
  notes.value = {};
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
