import React from "react";
import {
  selectTheme,
  selectWindowDecorations,
  setTheme,
  setWindowDecorations
} from "../features/config/configSlice";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { appWindow } from "@tauri-apps/api/window";
import { Themes } from "../app/themes";
import styles from "./Settings.module.css";
import { isTauri } from "../app/utils";

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector(selectTheme);
  const windowDecorations = useAppSelector(selectWindowDecorations);

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setTheme(event.target.value));
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setWindowDecorations(event.target.checked));
    appWindow.setDecorations(event.target.checked);
  };

  return (
    <div className={styles.settings}>
      <h2>Settings</h2>
      <div>
        Theme:
        <select
          className={styles.select}
          value={currentTheme}
          onChange={handleThemeChange}
        >
          {Object.values(Themes).map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.label}
            </option>
          ))}
        </select>
      </div>
      {isTauri() && (
        <div>
          Use system window controls:
          <input
            type="checkbox"
            checked={windowDecorations}
            onChange={handleCheckboxChange}
          />
        </div>
      )}
    </div>
  );
}
