import styles from "./Error.module.css";

export default function ErrorPage() {
  return (
    <div className={styles.error}>
      <h2>Error</h2>
      <p>Page not found</p>
    </div>
  );
}
