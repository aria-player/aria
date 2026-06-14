import localforage from "localforage";
import { t } from "i18next";
import { showConfirmation } from "./dialogs";
import { showToast } from "./toasts";
import { persistor } from "./store";

const PERSIST_KEY_PREFIX = "persist:";
const DATA_FORMAT_VERSION = 1;

type AriaDataExport = {
  formatVersion: number;
  appVersion: string;
  exportedAt: string;
  store: Record<string, string>;
};

export async function exportAppData() {
  const keys = await localforage.keys();
  const store: Record<string, string> = {};
  for (const key of keys) {
    if (!key.startsWith(PERSIST_KEY_PREFIX)) continue;
    const value = await localforage.getItem<string>(key);
    if (value != null) store[key] = value;
  }

  const payload: AriaDataExport = {
    formatVersion: DATA_FORMAT_VERSION,
    appVersion: import.meta.env.PACKAGE_VERSION,
    exportedAt: new Date().toISOString(),
    store,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `aria-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function isAriaDataExport(value: unknown): value is AriaDataExport {
  if (typeof value !== "object" || value == null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.store === "object" && candidate.store != null;
}

export async function importAppData(file: File) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    parsed = null;
  }

  if (!isAriaDataExport(parsed)) {
    showToast(t("settings.about.importError"));
    return;
  }

  const confirmed = await showConfirmation(t("settings.about.confirmImport"), {
    confirmLabel: t("settings.about.import"),
  });
  if (!confirmed) return;
  persistor.pause();
  await localforage.clear();
  for (const [key, value] of Object.entries(parsed.store)) {
    await localforage.setItem(key, value);
  }
  window.location.reload();
}
