# soprano-ui

React components tailored for use in media playing applications

### Usage

1. Make sure you have `react` and `react-dom` installed in your project:

```bash
npm install react react-dom
```

2. Install this package:

```bash
npm install soprano-ui
```

### Components

This packages exports two components.

**MediaSlider** is a modified/styled version of the [Radix](https://github.com/radix-ui/primitives) Slider component. It accepts three new props:

#### `keyboardFocusOnly`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Prevents mouse clicks from focusing the slider when set to `true`. Note that the slider can still be focused using the Tab key and adjusted with the keyboard as usual.

#### `keyboardStepMultiplier`

- **Type**: `number`
- **Default**: `1`
- **Description**: Scales the amount that keyboard interactions will increment/decrement the slider value by. This would be useful for a media 'seek' slider, allowing precision control with a mouse but larger jumps (e.g. 5-10 seconds at a time) with a keyboard.

#### `thumbAlignment`

- **Type**: `"contain" | "center"`
- **Default**: `"contain"`
- **Description**: Determines how the slider 'thumb' position is calculated. If set to `"contain"`, the thumb will stay contained within the slider. If set to `"center"`, the thumb will extend beyond the slider track so that it can stay centered on the current value.

---

**SectionTree** is a modified/styled version of [react-arborist](https://github.com/brimdata/react-arborist) that allows the Tree component to be split into several 'sections'. Each section has a header, an empty state, and the ability to show or hide items in the section. As its implementation is quite rudimentary, the extended API and props of the SectionTree have not been documented yet.

### Building

You can view the component stories by cloning this repository and running:

```bash
npm install
npm run storybook
```

The component library can be built with the `build` command:

```bash
npm run build
```

### License

Distributed under the MIT License. See `LICENSE` file for more information.
