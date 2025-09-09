import { push } from "redux-first-history";
import { BASEPATH } from "../../../app/constants";
import { useAppDispatch } from "../../../app/hooks";
import { LibraryView } from "../../../app/view";
import { updateLibrarySplitState } from "../../../features/library/librarySlice";
import {
  ArtistDetails,
  AlbumDetails
} from "../../../features/tracks/tracksTypes";
import { Track } from "../../../../../types/tracks";
import {
  addToSearchHistory,
  selectSearch
} from "../../../features/search/searchSlice";
import { useAppSelector } from "../../../app/hooks";
import { AlbumArt } from "../../views/subviews/AlbumArt";
import styles from "./TopResultItem.module.css";
import { TriggerEvent, useContextMenu } from "react-contexify";
import { useContext } from "react";
import { MenuContext } from "../../../contexts/MenuContext";
import { SearchResult } from "../../../app/search";
import { useTranslation } from "react-i18next";

interface TopResultItemProps {
  result: SearchResult;
}

export default function TopResultItem({ result }: TopResultItemProps) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const search = useAppSelector(selectSearch);
  const { setMenuData } = useContext(MenuContext);
  const { show: showTrackContextMenu } = useContextMenu({
    id: "track"
  });

  const handleClick = () => {
    dispatch(addToSearchHistory(search));
    switch (result.type) {
      case "track": {
        const track = result.item as Track;
        if (track.albumId) {
          dispatch(
            push(BASEPATH + `albums/${encodeURIComponent(track.albumId)}`)
          );
        }
        break;
      }
      case "artist": {
        const artist = result.item as ArtistDetails;
        dispatch(
          updateLibrarySplitState({
            view: LibraryView.Artists,
            splitState: { selectedGroup: artist.artist }
          })
        );
        dispatch(push(BASEPATH + "artists"));
        break;
      }
      case "album":
        {
          const album = result.item as AlbumDetails;
          dispatch(
            push(BASEPATH + `albums/${encodeURIComponent(album.albumId)}`)
          );
        }
        break;
      default:
        break;
    }
  };

  const getItemData = () => {
    switch (result.type) {
      case "track": {
        const track = result.item as Track;
        return {
          track,
          title: track.title,
          subtitle: Array.isArray(track.artist)
            ? track.artist.join("/")
            : track.artist,
          label: t("search.resultLabels.song"),
          artworkClass: styles.artwork
        };
      }
      case "artist": {
        const artist = result.item as ArtistDetails;
        return {
          track: artist.firstTrack,
          title: artist.artist,
          label: t("search.resultLabels.artist"),
          artworkClass: `${styles.artwork} ${styles.artist}`,
          artworkAltText: artist.artist
        };
      }
      case "album": {
        const album = result.item as AlbumDetails;
        return {
          track: album.firstTrack,
          title: album.album,
          subtitle: album.artist,
          label: t("search.resultLabels.album"),
          artworkClass: styles.artwork,
          artworkAltText: album.album
        };
      }
      default:
        return null;
    }
  };

  const itemData = getItemData();
  if (!itemData) return null;

  return (
    <button
      className={styles.topResultItem}
      onClick={handleClick}
      onContextMenu={(event) => {
        if (result.type !== "track") return;
        const track = result.item as Track;
        setMenuData({
          itemId: track.trackId,
          itemSource: undefined,
          itemIndex: undefined,
          metadata: track,
          type: "track"
        });
        showTrackContextMenu({ event: event as TriggerEvent });
      }}
    >
      <div className={itemData.artworkClass}>
        <AlbumArt track={itemData.track} altText={itemData.artworkAltText} />
      </div>
      <div className={styles.info}>
        <div className={styles.title}>{itemData.title}</div>
        {itemData.subtitle && (
          <div className={styles.subtitle}>{itemData.subtitle}</div>
        )}
        <div className={styles.type}>{itemData.label}</div>
      </div>
    </button>
  );
}
