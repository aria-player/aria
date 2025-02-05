# Creating themes

This tutorial describes how to create, package, and install Aria themes.

## Theme structure

Themes consist of two files in a zip archive:

1. **Manifest:** A JSON file called `theme.json` which contains information about the theme.
2. **Stylesheet:** A CSS file containing the theme's variables and styles.

## Step 1: Create the theme manifest

Create a file called `theme.json` that defines the theme information.

```json
{
  "id": "my-theme",
  "name": "My Theme",
  "base": "light",
  "stylesheet": "theme.css"
}
```

If you're planning on providing separate styles for light/dark mode using media queries, you can omit the `base` property. 

The full theme manifest specification is available as `Theme` in `src/themes/themes.ts`.

## Step 2: Create the theme stylesheet

Create a CSS file with the name previously specified in the plugin manifest, e.g. `theme.css`. The easiest way to create a stylesheet is to copy one of the existing themes in `src/themes/` and modify the variable values to your liking. To ensure the colors apply everywhere, use the `:root` selector:

```css
:root {
  --primary-text: #1f1f1f;
  --primary-background: #fff;
  --primary-border: #d2d7da;
  /* ... */
}
```

### Styling components

For customizations outside of setting app colors, several app components include additional class names intended for use in themes. For example, you can change the size of the footer buttons like so:

```css
:root {
  /* ... */

  .footer-button {
    scale: 0.8;
  }
}
```

### Overriding the accent color

If you find that the app's built-in accent color options clash with your theme, you can also add `"disableAccentPicker": true` to your theme manifest. This disables the accent color picker while your theme is active. You should then define a theme-specific accent color and contrasting text color in the stylesheet:

```css
:root {
  /* ... */

  --accent-color: #8ace00;
  --button-text-selected: #000;
}
```

## Step 3: Package and install the theme

To use your theme in Aria, package it into a .zip file and install it via the app.


### Packaging the theme

1. Ensure that your theme manifest and stylesheet are in the same directory. The manifest must be named `theme.json` and the stylesheet filename must match the name specified in the manifest.
2. Compress both files together into a .zip file with an archiving tool. The file structure should look like this:

```
my-theme.zip
  |-- theme.json
  |-- theme.css
```

### Installing the theme

1. Open the theme settings page in Aria by going to the menu bar/button and choosing "File" -> "Settings...", then switching to the "Appearance" tab.
2. Click "Install from file..." and locate the plugin .zip file.
3. If the installation was successful, your theme should appear in the list of themes. You can click the theme preview to apply it.


## Current limitations

- There are no default fallbacks for theme variables, so if you don't include all of the variables that the built-in themes include, there may be unstyled content in the app.
- Relative URLs in your stylesheet won't work since other files in the theme archive are not scanned at the moment. Linking to external assets hosted on the web will work but might lead to an unreliable experience due to requiring an internet connection.
