import { check } from "@tauri-apps/plugin-updater";
import { ask, message } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { t } from "i18next";

export async function checkForUpdates({ silent = false } = {}) {
  const update = await check();
  if (update === null) {
    if (!silent) {
      await message(t("upToDateDialog.message"), {
        title: t("upToDateDialog.title"),
        kind: "info",
      });
    }
    return;
  }
  const confirmed = await ask(
    t("updateDialog.message", {
      newVersion: update.version,
      currentVersion: import.meta.env.PACKAGE_VERSION,
      releaseNotes: update.body,
    }),
    {
      title: t("updateDialog.title"),
      kind: "info",
      okLabel: t("updateDialog.yes"),
      cancelLabel: t("updateDialog.no"),
    }
  );
  if (confirmed) {
    await update.downloadAndInstall();
    await invoke("graceful_restart");
  }
}
