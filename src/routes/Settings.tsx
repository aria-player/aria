import React from "react";
import { selectTheme, setTheme } from "../features/config/configSlice";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { Themes } from "../app/themes";
import styles from "./Settings.module.css";

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector(selectTheme);

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTheme = event.target.value;
    dispatch(setTheme(selectedTheme));
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
    </div>
  );
}
