import { i18n } from "i18next";
import { useTranslation } from "react-i18next";
import { AttributionProps } from "../../../../types/plugins";
import AppleMusicLogo from "./assets/apple-music-icon.svg?react";
import ICloudLogo from "./assets/icloud-icon.svg?react";
import styles from "./applemusic.module.css";

function getAppleMusicUrl(
  type: AttributionProps["type"],
  id?: string,
  storefrontId?: string
) {
  if (!id || id.startsWith("i.") || id.startsWith("l.")) return;
  return `https://music.apple.com/${storefrontId || "us"}/${type == "track" ? "song" : type}/${id}`;
}

export default function Attribution(
  props: AttributionProps & { i18n: i18n; storefrontId?: string }
) {
  const { t } = useTranslation("apple-music-player", { i18n: props.i18n });
  const appleMusicUrl = getAppleMusicUrl(
    props.type,
    props.id,
    props.storefrontId
  );

  if (!props.compact && props.type == "track" && !appleMusicUrl) return null;

  return appleMusicUrl ? (
    <button
      className={styles.attribution}
      onClick={() => {
        window.open(appleMusicUrl, "_blank");
      }}
      title={t("listenOnAppleMusic")}
    >
      <AppleMusicLogo style={{ width: "21px", height: "21px" }} />
      {props.compact ? "" : t("listenOnAppleMusic")}
    </button>
  ) : (
    <div className={styles.attribution} title={t("icloudLabel")}>
      <ICloudLogo style={{ width: "21px", height: "21px" }} />
      {props.compact ? "" : t("icloudLabel")}
    </div>
  );
}
