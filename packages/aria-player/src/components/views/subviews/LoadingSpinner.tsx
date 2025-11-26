import styles from "./LoadingSpinner.module.css";

export default function LoadingSpinner() {
  return (
    <div className={styles.container}>
      <div className={styles.spinner}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={styles.blade}
            style={{ "--blade-index": i } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
