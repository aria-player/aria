import { ICellRendererParams } from "@ag-grid-community/core";
import styles from "./AlbumTrackListSeparator.module.css";
import { AlbumArt } from "./AlbumArt";

export default function AlbumTrackListSeparator(props: ICellRendererParams) {
  if (props.node.data.album) {
    return (
      <>
        <div className={styles.artwork}>
          <AlbumArt track={props.node.data} />
        </div>
        <h1>{props.node.data.album}</h1>
        <h2>
          {props.node.data.artist} - {props.node.data.year}
        </h2>
      </>
    );
  } else {
    return <div className={styles.textSeparator}>{props.node.data.title}</div>;
  }
}
