import { i18n } from "i18next";
import { useTranslation } from "react-i18next";
import styles from "./spotify.module.css";

export type LibraryItemSelection = {
  includeLikedSongs: boolean;
  includeSavedAlbums: boolean;
  fetchGenres: boolean;
};

export default function LibraryItemsConfig({
  selection,
  likedSongsCount,
  savedAlbumsCount,
  onChange,
  i18n: i18nInstance,
}: {
  selection: LibraryItemSelection;
  likedSongsCount?: number;
  savedAlbumsCount?: number;
  onChange: (next: LibraryItemSelection) => void;
  i18n: i18n;
}) {
  const { t } = useTranslation("spotify-player", { i18n: i18nInstance });

  return (
    <div>
      <table className={styles.libraryItemsConfig}>
        <tbody>
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
        </tbody>
      </table>
      <label
        className={`${styles.libraryItemLabel} ${styles.libraryExtraOptions}`}
      >
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
    </div>
  );
}
