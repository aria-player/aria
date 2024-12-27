import styles from "./SyncProgress.module.css";

export const SyncProgress = (props: { percentage: number }) => {
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = ((100 - props.percentage) * circumference) / 100;

  return (
    <div className={styles.syncProgress}>
      <svg width={50} height={50}>
        <g transform={`rotate(-90 100 100)`}>
          <circle
            r={radius}
            cx={175}
            cy={25}
            fill="transparent"
            stroke="var(--footer-slider-background)"
            strokeWidth="0.3rem"
          ></circle>
          <circle
            className={styles.percentage}
            r={radius}
            cx={175}
            cy={25}
            fill="transparent"
            stroke="var(--accent-color)"
            strokeWidth="0.3rem"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
          ></circle>
        </g>
      </svg>
    </div>
  );
};
