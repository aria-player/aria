import styles from "./ThemePreview.module.css";

export default function ThemePreview(props: { stylesheet: string }) {
  const getCSSVariable = (variable: string) => {
    const regex = new RegExp(`--${variable}:\\s*(.*?);`);
    const match = props.stylesheet?.match(regex);
    return match ? match[1].trim() : undefined;
  };

  const accentColor = getCSSVariable("accent-color");
  const primaryText = getCSSVariable("primary-text");
  const primaryBackground = getCSSVariable("primary-background");
  const primaryBorder = `1px solid ${getCSSVariable("primary-border")}`;
  const secondaryText = getCSSVariable("secondary-text");
  const searchBackground = getCSSVariable("search-background");
  const tracklistOddRowBackground = getCSSVariable(
    "tracklist-odd-row-background"
  );
  const footerBackground = getCSSVariable("footer-background");
  const footerControls = getCSSVariable("footer-controls");

  return (
    <div
      className={styles.themePreview}
      style={{ background: primaryBackground, border: primaryBorder }}
    >
      <div className={styles.main}>
        <div className={styles.sidebar} style={{ borderRight: primaryBorder }}>
          <div
            className={styles.search}
            style={{ background: searchBackground }}
          ></div>
          <div
            className={styles.sidebarItem}
            style={{
              background: accentColor ?? primaryText,
              opacity: accentColor ? 1.0 : 0.25
            }}
          ></div>
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className={styles.sidebarItem}
              style={{ background: primaryText }}
            ></div>
          ))}
        </div>
        <div className={styles.tracks}>
          <div
            className={styles.tracksHeader}
            style={{ borderBottom: primaryBorder }}
          >
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className={styles.tracksHeaderColumn}
                style={{ background: secondaryText }}
              ></div>
            ))}
          </div>
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className={styles.tracksRow}
              style={{ background: tracklistOddRowBackground }}
            ></div>
          ))}
        </div>
      </div>
      <div
        className={styles.footer}
        style={{ background: footerBackground, borderTop: primaryBorder }}
      >
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className={styles.footerItem}
            style={{ background: footerControls }}
          ></div>
        ))}
      </div>
    </div>
  );
}
