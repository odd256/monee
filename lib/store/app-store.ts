import {
  createBookWithMeta,
  listBooks,
  upsertBook,
} from "@/lib/db/books-repo";
import { getMeta, saveMeta as saveMetaRecord } from "@/lib/db/meta-repo";
import { getSetting, removeSetting, setSetting } from "@/lib/db/settings-repo";
import { DEFAULT_BOOK_ID, SETTING_KEYS } from "@/lib/config";
import { createBookMeta } from "@/lib/domain/defaults";
import type { BookMeta, BookRecord, GithubConfig } from "@/lib/domain/types";
import { newId } from "@/lib/utils/id";
import { create } from "zustand";
import { scheduleSync } from "@/lib/sync/scheduler";

interface AppState {
  ready: boolean;
  onboarded: boolean;
  books: BookRecord[];
  currentBookId?: string;
  meta?: BookMeta;
  github?: GithubConfig;
  init: () => Promise<void>;
  completeOnboarding: (input: {
    bookName: string;
    currency: string;
    github?: GithubConfig;
  }) => Promise<void>;
  addBook: (name: string) => Promise<string>;
  switchBook: (id: string) => Promise<void>;
  refreshBooks: () => Promise<void>;
  refreshMeta: () => Promise<void>;
  saveMeta: (updater: (meta: BookMeta) => BookMeta) => Promise<void>;
  setGithub: (config: GithubConfig | undefined) => Promise<void>;
}

let initPromise: Promise<void> | undefined;

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  onboarded: false,
  books: [],

  init: async () => {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const onboarded = (await getSetting<boolean>(SETTING_KEYS.onboarded)) ?? false;
      let books = await listBooks();
      const lastBookId = await getSetting<string>(SETTING_KEYS.lastBookId);
      const github = await getSetting<GithubConfig>(SETTING_KEYS.github);

      // A device can lose IndexedDB while keeping settings; re-create the
      // default book instead of leaving the app in a broken state.
      if (onboarded && books.length === 0) {
        const meta = createBookMeta(DEFAULT_BOOK_ID, "我的账本");
        await createBookWithMeta(meta);
        books = await listBooks();
        await setSetting(SETTING_KEYS.lastBookId, meta.id);
      }

      const currentBookId =
        (lastBookId && books.some((book) => book.id === lastBookId)
          ? lastBookId
          : books[0]?.id) ?? undefined;
      const meta = currentBookId ? await getMeta(currentBookId) : undefined;

      set({
        ready: true,
        onboarded,
        books,
        currentBookId,
        meta,
        github,
      });
    })().catch((error) => {
      console.error("Failed to initialize Monee", error);
      set({ ready: true });
    });
    return initPromise;
  },

  completeOnboarding: async ({ bookName, currency, github }) => {
    const bookId = get().books.length === 0 ? DEFAULT_BOOK_ID : newId();
    const meta = createBookMeta(bookId, bookName.trim() || "我的账本", currency);
    await createBookWithMeta(meta);
    if (github) {
      await setSetting(SETTING_KEYS.github, github);
    }
    await setSetting(SETTING_KEYS.onboarded, true);
    await setSetting(SETTING_KEYS.lastBookId, bookId);
    const books = await listBooks();
    set({
      onboarded: true,
      books,
      currentBookId: bookId,
      meta,
      github: github ?? get().github,
    });
    scheduleSync(300);
  },

  addBook: async (name) => {
    const bookId = newId();
    const meta = createBookMeta(bookId, name.trim() || "新账本");
    await createBookWithMeta(meta);
    const books = await listBooks();
    set({ books });
    return bookId;
  },

  switchBook: async (id) => {
    const meta = await getMeta(id);
    if (!meta) return;
    await setSetting(SETTING_KEYS.lastBookId, id);
    set({ currentBookId: id, meta });
    scheduleSync(300);
  },

  refreshBooks: async () => {
    set({ books: await listBooks() });
  },

  refreshMeta: async () => {
    const id = get().currentBookId;
    if (!id) return;
    const meta = await getMeta(id);
    if (meta) set({ meta });
    set({ books: await listBooks() });
  },

  saveMeta: async (updater) => {
    const current = get().meta;
    if (!current) return;
    const next = updater(current);
    const meta: BookMeta = {
      ...next,
      id: current.id,
      updatedAt: Date.now(),
    };
    await saveMetaRecord(meta);
    const book = get().books.find((item) => item.id === meta.id);
    if (book) {
      await upsertBook({ ...book, name: meta.name, updatedAt: meta.updatedAt });
    }
    set({ meta, books: await listBooks() });
    scheduleSync();
  },

  setGithub: async (config) => {
    if (config) {
      await setSetting(SETTING_KEYS.github, config);
    } else {
      await removeSetting(SETTING_KEYS.github);
    }
    set({ github: config });
    scheduleSync(300);
  },
}));
