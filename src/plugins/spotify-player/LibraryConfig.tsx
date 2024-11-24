import { useState, ChangeEvent } from "react";
import { SpotifyConfig } from "./createSpotifyPlayer";
import { SourceCallbacks } from "../../features/plugins/pluginsTypes";
import SpotifyLogo from "./assets/spotify-brands-solid.svg?react";
import styles from "./spotify.module.css";

export default function LibraryConfig(props: {
  host: SourceCallbacks;
  config: SpotifyConfig;
  authenticate: () => void;
  logout: () => void;
}) {
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [clientId, setClientId] = useState(props.config.clientId);
  const [redirectUri, setRedirectUri] = useState(props.config.redirectUri);

  function updateClientId(event: ChangeEvent<HTMLInputElement>) {
    setClientId(event.target.value);
    props.config = { ...props.config, clientId: event.target.value };
    props.host.updateData(props.config);
  }

  function updateRedirectUri(event: ChangeEvent<HTMLInputElement>) {
    setRedirectUri(event.target.value);
    props.config = { ...props.config, redirectUri: event.target.value };
    props.host.updateData(props.config);
  }

  return (
    <div>
      <h4>Spotify settings</h4>
      {props.config.accessToken ? (
        <button onClick={props.logout}>Log out from Spotify</button>
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
