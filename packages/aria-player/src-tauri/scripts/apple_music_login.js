(() => {
  try {
    if (!window.location.hostname.endsWith("authorize.music.apple.com")) {
      return;
    }

    window.sessionStorage?.setItem("ac", `__MAIN_WINDOW_ORIGIN__/`);

    window.opener = {
      postMessage: (data, origin) => {
        try {
          const serialized =
            typeof data === "string" ? data : JSON.stringify(data);
          window.__TAURI_INTERNALS__?.invoke?.("post_message_to_main_window", {
            data: serialized,
            origin:
              typeof origin === "string" ? origin : window.location.origin,
          });
        } catch (error) {
          console.error("Failed to post message to main window", error);
        }
      },
    };

    window.__receiveAuthWindowMessage = (serialized, origin) => {
      try {
        const parsed =
          typeof serialized === "string" ? JSON.parse(serialized) : serialized;
        window.dispatchEvent(
          new MessageEvent("message", {
            data: parsed,
            origin:
              typeof origin === "string" ? origin : window.location.origin,
          })
        );
      } catch (error) {
        console.error("Failed to parse message", error);
      }
    };
  } catch (error) {
    console.error("Failed to configure Apple Music auth window", error);
  }
})();
