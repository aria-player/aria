import { i18n } from "i18next";
import { useTranslation } from "react-i18next";
import styles from "./spotify.module.css";

export type LibraryItemSelection = {
  includeLikedSongs: boolean;
  includeSavedAlbums: boolean;
  fetchGenres: boolean;
  includeOwnPlaylists: boolean;
  includeFollowedPlaylists: boolean;
};

export default function LibraryItemsConfig({
  selection,
  likedSongsCount,
  savedAlbumsCount,
  ownPlaylistsCount,
  followedPlaylistsCount,
  onChange,
  i18n: i18nInstance,
}: {
  selection: LibraryItemSelection;
  likedSongsCount?: number;
  savedAlbumsCount?: number;
  ownPlaylistsCount?: number;
  followedPlaylistsCount?: number;
  onChange: (next: LibraryItemSelection) => void;
  i18n: i18n;
}) {
  const { t } = useTranslation("spotify-player", { i18n: i18nInstance });

  return (
    <div>
      <table className={styles.libraryItemsConfig}>
        <tbody>
          <tr className={styles.libraryItemSeparatorRow}>
            <td colSpan={2}>{t("librarySetup.libraryHeading")}</td>
          </tr>
          <tr>
            <td>
              <label className={styles.libraryItemLabel}>
                <input
                  type="checkbox"
                  checked={selection.includeLikedSongs}
                  onChange={(e) =>
                    onChange({
                      ...selection,
                      includeLikedSongs: e.target.checked,
                    })
                  }
                />
                {t("librarySetup.includeLikedSongs")}
              </label>
            </td>
            <td className={styles.libraryItemCount}>
              {likedSongsCount !== undefined
                ? t("librarySetup.songCount", { count: likedSongsCount })
                : ""}
            </td>
          </tr>
          <tr>
            <td>
              <label className={styles.libraryItemLabel}>
                <input
                  type="checkbox"
                  checked={selection.includeSavedAlbums}
                  onChange={(e) =>
                    onChange({
                      ...selection,
                      includeSavedAlbums: e.target.checked,
                    })
                  }
                />
                {t("librarySetup.includeSavedAlbums")}
              </label>
            </td>
            <td className={styles.libraryItemCount}>
              {savedAlbumsCount !== undefined
                ? t("librarySetup.albumCount", { count: savedAlbumsCount })
                : ""}
            </td>
          </tr>
          <tr className={styles.libraryItemSeparatorRow}>
            <td colSpan={2}>{t("librarySetup.playlistsHeading")}</td>
          </tr>
          <tr>
            <td>
              <label className={styles.libraryItemLabel}>
                <input
                  type="checkbox"
                  checked={selection.includeOwnPlaylists}
                  onChange={(e) =>
                    onChange({
                      ...selection,
                      includeOwnPlaylists: e.target.checked,
                    })
                  }
                />
                {t("librarySetup.includeOwnPlaylists")}
              </label>
            </td>
            <td className={styles.libraryItemCount}>
              {ownPlaylistsCount !== undefined
                ? t("librarySetup.playlistCount", { count: ownPlaylistsCount })
                : ""}
            </td>
          </tr>
          <tr>
            <td>
              <label className={styles.libraryItemLabel}>
                <input
                  type="checkbox"
                  checked={selection.includeFollowedPlaylists}
                  onChange={(e) =>
                    onChange({
                      ...selection,
                      includeFollowedPlaylists: e.target.checked,
                    })
                  }
                />
                {t("librarySetup.includeFollowedPlaylists")}
              </label>
            </td>
            <td className={styles.libraryItemCount}>
              {followedPlaylistsCount !== undefined
                ? t("librarySetup.playlistCount", {
                    count: followedPlaylistsCount,
                  })
                : ""}
            </td>
          </tr>
          <tr className={styles.libraryItemSeparatorRow}>
            <td colSpan={2}>{t("librarySetup.metadataHeading")}</td>
          </tr>
          <tr>
            <td colSpan={2}>
              <label className={styles.libraryItemLabel}>
                <input
                  type="checkbox"
                  checked={selection.fetchGenres}
                  onChange={(e) =>
                    onChange({
                      ...selection,
                      fetchGenres: e.target.checked,
                    })
                  }
                />
                {t("librarySetup.fetchGenres")}
              </label>
            </td>
          </tr>
          <tr>
            <td colSpan={2} className={styles.libraryFootnote}>
              {t("librarySetup.libraryFootnote")}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
