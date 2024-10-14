import { ICellRendererParams } from "@ag-grid-community/core";
import styles from "./AlbumTrackListSeparator.module.css";
import { AlbumArt } from "./AlbumArt";

export default function AlbumTrackListSeparator(props: ICellRendererParams) {
  if (props.node.data.album) {
    return (
      <>
        <div className={`album-track-list-art ${styles.artwork}`}>
          <AlbumArt track={props.node.data} />
        </div>
        <h2 className={`album-track-list-title ${styles.albumTitle}`}>
          {props.node.data.album}
        </h2>
        <h3 className={`album-track-list-subtitle ${styles.albumDetails}`}>
          {props.node.data.artist}
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
