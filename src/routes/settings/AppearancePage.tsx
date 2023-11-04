import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { Themes } from "../../app/themes";
import { isTauri } from "../../app/utils";
import { selectTheme, setTheme } from "../../features/config/configSlice";
import styles from "./AppearancePage.module.css";
import { useContext } from "react";
import { Platform, PlatformContext } from "../../contexts/PlatformContext";

export function AppearancePage() {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector(selectTheme);
  const { platform, decorations, setDecorations } = useContext(PlatformContext);

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setTheme(event.target.value));
  };

  const handleCheckboxChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDecorations(event.target.checked);
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
            checked={decorations ?? false}
            onChange={handleCheckboxChange}
          />
          Use system window controls
        </div>
      )}
    </div>
  );
}
