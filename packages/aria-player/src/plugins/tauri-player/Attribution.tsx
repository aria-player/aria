import FolderIcon from "../../assets/folder-solid.svg?react";
import { AttributionProps } from "../../../../types/plugins";
import { useTranslation } from "react-i18next";
import { i18n } from "i18next";

export default function Attribution(
  props: AttributionProps & { i18n: i18n; showAttribution: boolean }
) {
  const { t } = useTranslation("tauri-player", { i18n: props.i18n });

  if (!props.showAttribution || props.type !== "track" || !props.compact) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        width: "21px",
        height: "21px",
      }}
      title={t("localFiles")}
    >
      <FolderIcon style={{ width: "17.5px", height: "17.5px" }} />
    </div>
  );
}
