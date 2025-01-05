import { i18n } from "i18next";
import { AttributionProps } from "../../features/plugins/pluginsTypes";
import SpotifyLogo from "./assets/spotify-brands-solid.svg?react";
import styles from "./spotify.module.css";
import { useTranslation } from "react-i18next";

export default function Attribution(props: AttributionProps & { i18n: i18n }) {
  const { t } = useTranslation("spotify-player", { i18n: props.i18n });

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
      {props.compact ? "" : t("playOnSpotify")}
    </button>
  );
}
