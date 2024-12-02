import { AttributionProps } from "../../features/plugins/pluginsTypes";
import SpotifyLogo from "./assets/spotify-brands-solid.svg?react";
import styles from "./spotify.module.css";

export default function Attribution(props: AttributionProps) {
  return (
    <button
      className={styles.attribution}
      onClick={() => {
        const spotifyUrl = `https://open.spotify.com/${
          (props.type == "album" ? "album/" : "") +
          props.id?.replace("spotify:", "").replace(":", "/")
        }`;
        window.open(spotifyUrl, "_blank");
      }}
    >
      <SpotifyLogo style={{ width: "21px", height: "21px" }} />
      {props.compact ? "" : "Play on Spotify"}
    </button>
  );
}
