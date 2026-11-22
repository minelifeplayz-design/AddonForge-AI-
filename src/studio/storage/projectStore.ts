import type { StudioProject } from "../types";

const DATABASE_NAME = "bedrock-creator-studio";
const DATABASE_VERSION = 1;
const STORE_NAME = "projects";
const LEGACY_KEY = "bedrock-creator-studio.projects.v1";
let databasePromise: Promise<IDBDatabase> | undefined;
let writeQueue: Promise<void> = Promise.resolve();

function openDatabase(): Promise<IDBDatabase> {
  if (!("indexedDB" in window)) return Promise.reject(new Error("This device's browser storage is unavailable. Update Android System WebView and reopen the app."));
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error ?? new Error("Could not open the local project database."));
    request.onblocked = () => reject(new Error("Project database upgrade is blocked by another open Studio window. Close other Studio windows and retry."));
  });
  return databasePromise;
}

export async function loadProjects(): Promise<StudioProject[]> {
  const database = await openDatabase();
  const stored = await new Promise<StudioProject[]>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as StudioProject[]);
    request.onerror = () => reject(request.error ?? new Error("Could not read saved projects."));
  });
  if (stored.length > 0) return stored.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  // One-time migration from the first Studio prototype's localStorage store.
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (raw) {
      const legacy = JSON.parse(raw) as StudioProject[];
      if (Array.isArray(legacy)) {
        await persistProjects(legacy);
        localStorage.removeItem(LEGACY_KEY);
        return legacy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      }
    }
  } catch (error) {
    console.warn("Legacy project migration was skipped:", error);
  }
  return [];
}

export function persistProjects(projects: StudioProject[]): Promise<void> {
  const operation = writeQueue.then(async () => {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
      for (const project of projects) store.put(project);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not save project changes."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Project save was cancelled."));
    });
  });
  writeQueue = operation.catch(() => undefined);
  return operation;
}
