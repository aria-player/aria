import { useState, ChangeEvent } from "react";
import type { SpotifyConfig } from "./createSpotifyPlayer";
import { SourceCallbacks } from "../../../../types/plugins";
import SpotifyLogo from "./assets/spotify-brands-solid.svg?react";
import styles from "./spotify.module.css";
import { useTranslation } from "react-i18next";
import { i18n } from "i18next";
import SpotifySetupDialog from "./SpotifySetupDialog";
import LibraryItemsConfig, { LibraryItemSelection } from "./LibraryItemsConfig";
import LibrarySetupDialog from "./LibrarySetupDialog";

export function showLibrarySetupDialog({
  host,
  config,
  i18n: i18nInstance,
  onSubmit,
}: {
  host: SourceCallbacks;
  config: SpotifyConfig;
  i18n: i18n;
  onSubmit: (includeLikedSongs: boolean, includeSavedAlbums: boolean, fetchGenres: boolean) => void;
}) {
  let state: LibraryItemSelection = {
    includeLikedSongs: config.includeLikedSongs !== false,
    includeSavedAlbums: config.includeSavedAlbums !== false,
    fetchGenres: config.fetchGenres !== false,
  };
  const { likedSongsCount, savedAlbumsCount } = config;

  host.showAlert({
    heading: i18nInstance.t("spotify-player:librarySetup.heading"),
    message: () => (
      <LibrarySetupDialog
        initialSelection={state}
        likedSongsCount={likedSongsCount}
        savedAlbumsCount={savedAlbumsCount}
        onChange={(next) => {
          state = next;
        }}
        i18n={i18nInstance}
      />
    ),
    closeLabel: i18nInstance.t("spotify-player:librarySetup.continue"),
    onClose: () => onSubmit(state.includeLikedSongs, state.includeSavedAlbums, state.fetchGenres),
  });
}

export default function LibraryConfig(props: {
  data: object;
  host: SourceCallbacks;
  authenticate: (showLibrarySetupDialog?: boolean) => void;
  logout: () => void;
  redirectUri: string;
  startLibraryLoad: () => void;
  refreshLibrary: (configOverride?: Partial<SpotifyConfig>) => void;
  i18n: i18n;
}) {
  const config = props.data as SpotifyConfig;
  const { t } = useTranslation("spotify-player", { i18n: props.i18n });
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [redirectUri, setRedirectUri] = useState(config.redirectUri ?? "");
  const [showSetupDialog, setShowSetupDialog] = useState(false);

  function updateRedirectUri(event: ChangeEvent<HTMLInputElement>) {
    setRedirectUri(event.target.value);
    props.host.updateData({ ...config, redirectUri: event.target.value });
  }

  function handleSetupSubmit(clientId: string) {
    props.host.updateData({ ...config, clientId });
    setShowSetupDialog(false);
    props.authenticate(false);
  }

  function handleLibrarySettingChange(newSelection: LibraryItemSelection) {
    props.host.updateData({
      ...config,
      ...newSelection,
      librarySetupPending: false,
    });
    props.refreshLibrary(newSelection);
  }

  return (
    <div>
      {showSetupDialog && (
        <SpotifySetupDialog
          redirectUri={props.redirectUri}
          initialClientId={config.clientId ?? ""}
          onSubmit={handleSetupSubmit}
          onClose={() => setShowSetupDialog(false)}
          i18n={props.i18n}
        />
      )}
      <h4 className="settings-heading">{t("settings.heading")}</h4>
      {config.accessToken && (
        <LibraryItemsConfig
          selection={{
            includeLikedSongs: config.includeLikedSongs !== false,
            includeSavedAlbums: config.includeSavedAlbums !== false,
            fetchGenres: config.fetchGenres !== false,
          }}
          likedSongsCount={config.likedSongsCount}
          savedAlbumsCount={config.savedAlbumsCount}
          onChange={handleLibrarySettingChange}
          i18n={props.i18n}
        />
      )}
      {config.accessToken ? (
        <button className="settings-button" onClick={props.logout}>
          {t("settings.logOutFromSpotify")}
        </button>
      ) : (
        <button
          className={styles.loginButton}
          onClick={() => setShowSetupDialog(true)}
        >
          <SpotifyLogo className={styles.spotifyLogo} />
          {t("settings.logInWithSpotify")}
        </button>
      )}
      {import.meta.env.DEV && (
        <p>
          <button
            className={styles.advancedSettingsButton}
            onClick={() => {
              setShowAdvancedSettings(!showAdvancedSettings);
            }}
          >
            {t("settings.toggleAdvancedSettings")}
          </button>
        </p>
      )}
      {import.meta.env.DEV && showAdvancedSettings && (
        <p>
          {t("settings.redirectUri")}
          <br />
          <input
            type="text"
            value={redirectUri}
            onChange={updateRedirectUri}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </p>
      )}
    </div>
  );
}
