import { useState } from "react";
import { i18n } from "i18next";
import { useTranslation } from "react-i18next";
import styles from "./spotify.module.css";
import LibraryItemsConfig, { LibraryItemSelection } from "./LibraryItemsConfig";

export default function LibrarySetupDialog({
  initialSelection,
  likedSongsCount,
  savedAlbumsCount,
  ownPlaylistsCount,
  followedPlaylistsCount,
  onChange,
  i18n: i18nInstance,
}: {
  initialSelection: LibraryItemSelection;
  likedSongsCount?: number;
  savedAlbumsCount?: number;
  ownPlaylistsCount?: number;
  followedPlaylistsCount?: number;
  onChange: (next: LibraryItemSelection) => void;
  i18n: i18n;
}) {
  const [selection, setSelection] = useState(initialSelection);
  const { t } = useTranslation("spotify-player", { i18n: i18nInstance });

  return (
    <>
      <p className={styles.setupDescription}>{t("librarySetup.description")}</p>
      <LibraryItemsConfig
        selection={selection}
        likedSongsCount={likedSongsCount}
        savedAlbumsCount={savedAlbumsCount}
        ownPlaylistsCount={ownPlaylistsCount}
        followedPlaylistsCount={followedPlaylistsCount}
        onChange={(next) => {
          setSelection(next);
          onChange(next);
        }}
        i18n={i18nInstance}
      />
    </>
  );
}
