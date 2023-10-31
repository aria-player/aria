import { appWindow } from "@tauri-apps/api/window";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { Themes } from "../../app/themes";
import { isTauri } from "../../app/utils";
import {
  selectTheme,
  selectWindowDecorations,
  setTheme,
  setWindowDecorations
} from "../../features/config/configSlice";
import styles from "./AppearancePage.module.css";
import { useContext } from "react";
import { Platform, PlatformContext } from "../../PlatformContext";

export function AppearancePage() {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector(selectTheme);
  const windowDecorations = useAppSelector(selectWindowDecorations);
  const { platform } = useContext(PlatformContext);

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setTheme(event.target.value));
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setWindowDecorations(event.target.checked));
    appWindow.setDecorations(event.target.checked);
  };

  return (
    <div>
      <h4 className={styles.header}>Theme</h4>
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
      {isTauri() && platform == Platform.Windows && (
        <div>
          <input
            className={styles.checkbox}
            type="checkbox"
            checked={windowDecorations}
            onChange={handleCheckboxChange}
          />
          Use system window controls
        </div>
      )}
    </div>
  );
}
