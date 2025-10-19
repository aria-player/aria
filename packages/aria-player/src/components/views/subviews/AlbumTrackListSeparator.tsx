import { ICellRendererParams } from "@ag-grid-community/core";
import styles from "./AlbumTrackListSeparator.module.css";
import { AlbumArt } from "./AlbumArt";
import { getSourceHandle } from "../../../features/plugins/pluginsSlice";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { push } from "redux-first-history";
import { BASEPATH } from "../../../app/constants";
import { normalizeArtists } from "../../../app/utils";
import { selectArtistDelimiter } from "../../../features/config/configSlice";

export default function AlbumTrackListSeparator(props: ICellRendererParams) {
  const dispatch = useAppDispatch();
  const delimiter = useAppSelector(selectArtistDelimiter);

  function goToArtist(id: string) {
    dispatch(push(BASEPATH + `artist/${encodeURIComponent(id)}`));
  }

  if (props.node.data.album) {
    const pluginHandle = getSourceHandle(props.node.data.source);
    const artists = normalizeArtists(
      props.node.data.artist,
      props.node.data.artistUri,
      props.node.data.source,
      delimiter
    );

    return (
      <>
        <div className={`album-track-list-art ${styles.artwork}`}>
          <AlbumArt track={props.node.data} />
        </div>
        <h2
          className={`album-track-list-title ${styles.albumTitle} ${styles.albumText}`}
        >
          {props.node.data.album}
          {pluginHandle?.Attribution && (
            <pluginHandle.Attribution
              type="album"
              id={props.node.data.albumId}
              compact={false}
            />
          )}
        </h2>
        <h3
          className={`album-track-list-subtitle ${styles.albumDetails} ${styles.albumText}`}
        >
          <div className={styles.artistButtons}>
            {artists.map((artist, index) => (
              <span key={index} className={styles.artistButtonContainer}>
                <button
                  className={styles.artist}
                  onClick={() => goToArtist(artist.id)}
                >
                  {artists[index].name}
                </button>
                {index < artists.length - 1 && "/"}
              </span>
            ))}
          </div>
          {props.node.data.year && ` - ${props.node.data.year}`}
        </h3>
      </>
    );
  } else {
    return (
      <div
        className={`album-track-list-disc-separator ${styles.textSeparator}`}
      >
        {props.node.data.title}
      </div>
    );
  }
}
