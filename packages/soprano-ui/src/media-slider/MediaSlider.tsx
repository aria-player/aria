import React from "react";
import * as RadixSlider from "./Slider";
import { SliderProps } from "./Slider";
import styles from "./MediaSlider.module.css";

export const MediaSlider = React.forwardRef<HTMLDivElement, SliderProps>(
  (props, forwardedRef) => {
    return (
      <RadixSlider.Root className={styles.slider} {...props} ref={forwardedRef}>
        <RadixSlider.Track className={styles.track}>
          <RadixSlider.Range className={styles.range} />
        </RadixSlider.Track>
        <RadixSlider.Thumb className={styles.thumb} />
      </RadixSlider.Root>
    );
  }
);
