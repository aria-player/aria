import styles from "./CloseToastButton.module.css";
import CloseIcon from "../../assets/xmark-solid.svg?react";

export default function CloseToastButton(close: () => void) {
  return (
    <button className={styles.close} onClick={close}>
      <CloseIcon />
    </button>
  );
}
