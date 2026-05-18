import { i18n } from "i18next";
import { AttributionProps } from "../../../../types/plugins";
import SpotifyLogo from "./assets/spotify-brands-solid.svg?react";
import styles from "./spotify.module.css";
import { useTranslation } from "react-i18next";
import { LIKED_SONGS_PLAYLIST_ID } from "./createSpotifyPlayer";

function getSpotifyUrl(type: AttributionProps["type"], id?: string) {
  if (!id) return null;
  if (id === LIKED_SONGS_PLAYLIST_ID)
    return "https://open.spotify.com/collection/tracks";
  if (id.startsWith("spotify:")) {
    return `https://open.spotify.com/${id
      .replace("spotify:", "")
      .replace(":", "/")}`;
  }
  return `https://open.spotify.com/${type}/${id}`;
}

export default function Attribution(props: AttributionProps & { i18n: i18n }) {
  const { t } = useTranslation("spotify-player", { i18n: props.i18n });
  const spotifyUrl = getSpotifyUrl(props.type, props.id);
  if (!spotifyUrl) return null;

  return (
    <button
      className={styles.attribution}
      onClick={() => {
        window.open(spotifyUrl, "_blank");
      }}
    >
      <SpotifyLogo style={{ width: "21px", height: "21px" }} />
      {props.compact ? "" : t("playOnSpotify")}
    </button>
  );
}
