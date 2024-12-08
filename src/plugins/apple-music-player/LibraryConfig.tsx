import { useState, ChangeEvent } from "react";
import { SourceCallbacks } from "../../features/plugins/pluginsTypes";
import { AppleMusicConfig } from "./createAppleMusicPlayer";
import styles from "./applemusic.module.css";

export default function LibraryConfig(props: {
  data: object;
  host: SourceCallbacks;
  authenticate: () => void;
  logout: () => void;
}) {
  const config = props.data as AppleMusicConfig;

  const [developerToken, setDeveloperToken] = useState(
    config.developerToken ?? ""
  );
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  function updateDeveloperToken(event: ChangeEvent<HTMLInputElement>) {
    setDeveloperToken(event.target.value);
    props.host.updateData({ ...config, clientId: event.target.value });
  }

  return (
    <div>
      <h3 className="settings-heading">Apple Music settings</h3>
      {!config.loggedIn ? (
        <button className={styles.loginButton} onClick={props.authenticate}>
          Log in with Apple Music
        </button>
      ) : (
        <button className="settings-button" onClick={props.logout}>
          Log out from Apple Music
        </button>
      )}
      <p>
        <button
          className={styles.advancedSettingsButton}
          onClick={() => {
            setShowAdvancedSettings(!showAdvancedSettings);
          }}
        >
          Toggle advanced settings
        </button>
      </p>
      {showAdvancedSettings && (
        <p>
          Developer Token
          <br />
          <input
            type="text"
            value={developerToken}
            onChange={updateDeveloperToken}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </p>
      )}
    </div>
  );
}
