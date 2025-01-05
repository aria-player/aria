# Creating plugins

This tutorial describes how to create, package, and install Aria plugins. As an example, we'll create a simple plugin that logs the player state to the console.

> ⚠️ This tutorial uses JavaScript rather than TypeScript for simplicity, as the plugin installation system expects a plain ES Module as an entry point. If you'd like to write your plugin in TypeScript, you can access the relevant types via the `@aria-player/types` npm package.

## Plugin structure

Plugins consist of two files in a zip archive:

1. **Manifest:** A JSON file called `plugin.json` which contains information about the plugin.
2. **Entry point:** A JavaScript file containing a function that returns a plugin object.

## Step 1: Create the plugin manifest

Create a file called `plugin.json` that defines the plugin information. Since our example plugin will require access to the player state, the `integration` capability needs to be specified.

```json
{
  "id": "log-plugin",
  "name": "Log Plugin",
  "needsTauri": false,
  "main": "createLogPlugin.js",
  "capabilities": ["integration"]
}
```

Plugins can use multiple capabilities at once. The following capabilities are available:

- `integration`: Allows the plugin to control playback and monitor changes to the player state.
- `source`: Allows the plugin to provide an audio backend for the player and manage tracks in the user's music library.

The full plugin manifest specification is available as `PluginInfo` in `packages/types/plugins.d.ts`.

## Step 2: Create the plugin entry point

Create a JavaScript file with the name previously specified in the plugin manifest, e.g. `createLogPlugin.js`.

```js
export default function createLogPlugin() {
  console.log("Plugin created!");

  return {
    dispose() {
      console.log("Plugin disposed!");
    }
  };
}
```

This is technically already a complete plugin. If both files are compressed into a .zip file together, the plugin can now be installed via the "Install from file..." button in the plugin settings page. However, it doesn't do much at the moment, so the next section will explore ways of adding functionality.

## Step 3: Implement plugin functionality

Player-to-plugin communication is enabled through the implementation of named methods in the plugin object. Plugins can also communicate back to the player by calling methods on a `host` object passed to each plugin.

### Handling playback state changes

To monitor the playback state, implement `IntegrationHandle` methods in your plugin object:

```js
export default function createLogPlugin() {
  // ...
  return {
    onPlay(metadata) {
      console.log("Now playing:", metadata);
    },
    onPause() {
      console.log("Paused playback");
    },
    onResume() {
      console.log("Resumed playback");
    },
    onStop() {
      console.log("Stopped playback");
    }
    // ...
  };
}
```

The plugin now logs information about the currently playing track and player state to the console. Skip to **Step 4** to see how to package and install the plugin or read on for information about adding additional plugin functionality.

### Providing React components

Plugins can also specify React components to add configuration UI to the plugin settings page.

> ⚠️ If you'd like to use JSX syntax, you'll need to transpile your plugin code using a bundler like Webpack and point to the output as your `"main"` file. This example uses `React.createElement` to keep the JavaScript plain, but the actual built-in plugins are written with JSX.

The following will display a button in the plugin settings page while the plugin is enabled:

```js
export default function createLogPlugin() {
  // ...
  return {
    Config: () =>
      React.createElement(
        "button",
        {
          className: "settings-button",
          onClick: () => {
            console.log("Button clicked!");
          }
        },
        "Example button"
      ),
    // ...
  };
}
```

`React` is defined as a global for plugins to use, so you don't need to worry about importing it.

### Controlling the player

Sometimes plugins need to invoke certain player functionality or get up-to-date data. To facilitate this, two objects are passed to each plugin creation function:

1. `host`: contains callbacks depending on the plugin capabilities.
2. `i18n`: an [i18next](https://www.i18next.com/) instance that allows your plugin to access localized text resources and attach additional resources to the app.

In the example plugin, adding the `host` parameter allows us to call methods from `BaseCallbacks` and `IntegrationCallbacks` on the host object. We can update the React example to include an additional `host` parameter and call `host.next()`:

```js
export default function createLogPlugin(host) {
  // ...
  return {
    Config: () =>
      React.createElement(
        "button",
        {
          className: "settings-button",
          onClick: () => {
            console.log("Button clicked, skipping to next track");
            host.next();
          }
        },
        "Example button"
      ),
    // ...
  };
}
```

The player will now skip to the next track whenever the config button is clicked.

For plugins with the `source` capability, methods from `SourceCallbacks` can be used in a similar fashion to add/remove library tracks.

## Step 4: Package and install the plugin

Finally, to run your plugin in Aria, package it into a .zip file and install it via the app.

### Packaging the plugin

1. Ensure that your plugin manifest and entry point are in the same directory. The manifest must be named `plugin.json` and the entry point filename must match the name specified in the manifest.
2. Compress both files together into a .zip file with an archiving tool. The file structure should look like this:

```
log-plugin.zip
  |-- plugin.json
  |-- createLogPlugin.js
```

### Installing the plugin

1. Open the plugin settings page in Aria by going to the menu bar/button and choosing "File" -> "Settings...", then switching to the "Plugins" tab.
2. Click "Install from file..." and locate the plugin .zip file.
3. If the installation was successful, your plugin should appear in the list of available plugins. If not, you can check your browser developer tools for any errors that occurred while parsing the files.

By checking/unchecking the plugin in the list of "Available plugins", you can test your plugin initialization/disposal logic without having to uninstall and reinstall it. Newly installed plugins enable automatically, so if you open your browser developer tools after completing these steps, the example plugin code should log "Plugin created!" to the console.

## Current limitations

- While the `needsTauri` flag exists for plugins to indicate that they require the desktop version of the app, there is currently no way for plugins to include custom Rust code for the Tauri backend. This limits the potential for external integrations since only browser-based APIs can be used.
- `import` statements in your plugin entry point won't work since other files in the plugin archive are not scanned. If your code depends on external libraries or is split across multiple files, you'll need to use a bundler to combine your code into a single file. This also means that additional assets like images/audio can't be included in plugin archives at the moment.
