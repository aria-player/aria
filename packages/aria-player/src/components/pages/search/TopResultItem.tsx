import { push } from "redux-first-history";
import { BASEPATH } from "../../../app/constants";
import { useAppDispatch } from "../../../app/hooks";
import { AlbumDetails } from "../../../features/tracks/tracksTypes";
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
import { getSourceHandle } from "../../../features/plugins/pluginsSlice";
import { formatStringArray } from "../../../app/utils";
import { ArtistArt } from "../../views/subviews/ArtistArt";
import { ArtistDetails } from "../../../features/artists/artistsTypes";

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
            push(BASEPATH + `album/${encodeURIComponent(track.albumId)}`, {
              focusItemId: track.trackId
            })
          );
        }
        break;
      }
      case "artist": {
        const artist = result.item as ArtistDetails;
        dispatch(
          push(BASEPATH + `artist/${encodeURIComponent(artist.artistId)}`)
        );
        break;
      }
      case "album":
        {
          const album = result.item as AlbumDetails;
          dispatch(
            push(BASEPATH + `album/${encodeURIComponent(album.albumId)}`)
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
          id: track.trackId,
          title: track.title,
          subtitle: Array.isArray(track.artist)
            ? track.artist.join("/")
            : track.artist,
          label: t("search.categories.songs.one"),
          attributionId: track.uri
        };
      }
      case "artist": {
        const artist = result.item as ArtistDetails;
        return {
          id: artist.artistId,
          title: artist.name,
          label: t("search.categories.artists.one"),
          attributionId: artist.uri
        };
      }
      case "album": {
        const album = result.item as AlbumDetails;
        return {
          id: album.albumId,
          title: album.album,
          subtitle: formatStringArray(album.artist),
          label: t("search.categories.albums.one"),
          attributionId: album.albumId
        };
      }
      default:
        return null;
    }
  };

  const itemData = getItemData();
  if (!itemData) return null;
  const pluginHandle = getSourceHandle(result.item.source);

  return (
    <div className={styles.topResultItem}>
      <button
        className={styles.topResultButton}
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
        {result.type === "artist" ? (
          <div className={`${styles.artwork} ${styles.artist}`}>
            <ArtistArt artist={result.item as ArtistDetails} />
          </div>
        ) : result.type === "album" ? (
          <div className={styles.artwork}>
            <AlbumArt album={result.item as AlbumDetails} />
          </div>
        ) : (
          <div className={styles.artwork}>
            <AlbumArt track={result.item as Track} />
          </div>
        )}
        <div className={styles.info}>
          <div className={styles.title}>{itemData.title}</div>
          {itemData.subtitle && (
            <div className={styles.subtitle}>{itemData.subtitle}</div>
          )}
          <div className={styles.type}>{itemData.label}</div>
        </div>
      </button>
      {pluginHandle?.Attribution && (
        <div className={styles.attribution}>
          <pluginHandle.Attribution
            type={result.type}
            id={itemData.attributionId}
            compact={true}
          />
        </div>
      )}
    </div>
  );
}
