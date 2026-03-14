import { Track } from "../../../../types/tracks";
import { invoke } from "@tauri-apps/api/core";

const APP_ICON_URL =
  "https://raw.githubusercontent.com/aria-player/aria/main/packages/aria-player/app-icon.png";

function getSmallText(sourceDisplayName: string | undefined): string {
  return sourceDisplayName
    ? `Listening to ${sourceDisplayName} on Aria`
    : "Listening on Aria";
}

// Discord Rich Presence requires string fields to be at least 2 characters
const padForDiscord = (value: string): string =>
  value.length < 2 ? value.padEnd(2, "\u200B") : value;

export function buildActivityPayload(
  track: Track,
  position: number,
  artworkUrl: string | undefined,
  sourceDisplayName: string | undefined
) {
  const title = padForDiscord(track.title ?? "");
  const artist = padForDiscord(
    Array.isArray(track.artist)
      ? track.artist.join("/")
      : (track.artist ?? "Unknown Artist")
  );
  const name = padForDiscord(artist || title);

  const duration =
    typeof track.duration === "number"
      ? Math.max(0, Math.round(track.duration))
      : undefined;
  const startTimestamp = Math.floor(
    (Date.now() - Math.max(0, Math.round(position))) / 1000
  );
  const endTimestamp =
    duration != null ? startTimestamp + Math.floor(duration / 1000) : undefined;

  return {
    state: artist,
    details: title,
    name,
    largeImage: artworkUrl ?? APP_ICON_URL,
    largeText: artworkUrl ? track.album : undefined,
    smallImage: artworkUrl ? APP_ICON_URL : undefined,
    smallText: artworkUrl ? getSmallText(sourceDisplayName) : undefined,
    startTimestamp,
    endTimestamp,
    buttonLabel: "Get Aria",
    buttonUrl: "https://github.com/aria-player/aria",
  };
}

export async function connect(clientId: string) {
  if (!clientId.trim()) return;
  try {
    await invoke("connect_discord_rich_presence", { clientId });
  } catch (error) {
    console.error("Failed to connect to Discord Rich Presence:", error);
  }
}

export async function setActivity(
  track: Track,
  position: number,
  artworkUrl: string | undefined,
  sourceName: string | undefined
) {
  const activity = buildActivityPayload(
    track,
    position,
    artworkUrl,
    sourceName
  );
  try {
    await invoke("set_discord_activity", { activity });
  } catch (error) {
    console.error("Failed to set Discord activity:", error);
  }
}

export async function clearActivity() {
  try {
    await invoke("clear_discord_activity", {});
  } catch (error) {
    console.error("Failed to clear Discord activity:", error);
  }
}
