import { useState, ChangeEvent } from "react";
import { SpotifyConfig } from "./createSpotifyPlayer";
import { SourceCallbacks } from "../../features/plugins/pluginsTypes";
import SpotifyLogo from "./assets/spotify-brands-solid.svg?react";
import styles from "./spotify.module.css";

export default function LibraryConfig(props: {
  data: object;
  host: SourceCallbacks;
  authenticate: () => void;
  logout: () => void;
}) {
  const config = props.data as SpotifyConfig;
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [clientId, setClientId] = useState(config.clientId ?? "");
  const [redirectUri, setRedirectUri] = useState(config.redirectUri ?? "");

  function updateClientId(event: ChangeEvent<HTMLInputElement>) {
    setClientId(event.target.value);
    props.host.updateData({ ...config, clientId: event.target.value });
  }

  function updateRedirectUri(event: ChangeEvent<HTMLInputElement>) {
    setRedirectUri(event.target.value);
    props.host.updateData({ ...config, redirectUri: event.target.value });
  }

  return (
    <div>
      <h4 className="settings-heading">Spotify settings</h4>
      {config.accessToken ? (
        <button className="settings-button" onClick={props.logout}>
          Log out from Spotify
        </button>
      ) : (
        <button className={styles.loginButton} onClick={props.authenticate}>
          <SpotifyLogo className={styles.spotifyLogo} />
          Log in with Spotify
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
        <>
          <p>
            Client ID
            <br />
            <input
              type="text"
              value={clientId}
              onChange={updateClientId}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </p>
          <p>
            Redirect URI
            <br />
            <input
              type="text"
              value={redirectUri}
              onChange={updateRedirectUri}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </p>
        </>
      )}
    </div>
  );
}
