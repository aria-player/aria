import { isTauri } from "../../app/utils";
import styles from "./AppearancePage.module.css";
import { useContext } from "react";
import { PlatformContext } from "../../PlatformContext";

export function GeneralPage() {
  const { minimiseToTray, setMinimiseToTray } = useContext(PlatformContext);

  const handleCheckboxChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setMinimiseToTray(event.target.checked);
  };

  return (
    <div>
      <h4 className={styles.header}>General</h4>
      {isTauri() ? (
        <div>
          <input
            className={styles.checkbox}
            type="checkbox"
            checked={minimiseToTray ?? false}
            onChange={handleCheckboxChange}
          />
          Close button minimizes app to system tray
        </div>
      ) : (
        <i>This section is currently empty.</i>
      )}
    </div>
  );
}
