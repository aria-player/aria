import { MD5 } from "crypto-js";
import { i18n } from "i18next";
import type { IntegrationCallbacks, Track } from "../../../../types";
import { isTauri } from "../../app/utils";
import { BASEPATH } from "../../app/constants";

export type LastfmData = {
  sessionKey?: string;
  username?: string;
};

const apiUrl = "https://ws.audioscrobbler.com/2.0/";
const apiKey = import.meta.env.VITE_LASTFM_API_KEY;
const apiSecret = import.meta.env.VITE_LASTFM_API_SECRET;

const getRedirectUri = () =>
  isTauri() ? "http://127.0.0.1:2742/" : window.location.origin + BASEPATH;

const formatArtist = (track: Track) =>
  Array.isArray(track.artist) ? track.artist.join("/") : track.artist;

function sign(params: Record<string, string>, secret: string) {
  const str =
    Object.keys(params)
      .sort()
      .map((k) => k + params[k])
      .join("") + secret;
  return MD5(str).toString();
}

async function post(params: Record<string, string>): Promise<unknown> {
  const body = new URLSearchParams({ ...params, format: "json" });
  const res = await fetch(apiUrl, { method: "POST", body });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function get(params: Record<string, string>): Promise<unknown> {
  const query = new URLSearchParams({ ...params, format: "json" });
  const res = await fetch(`${apiUrl}?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function trackRequest(
  method: string,
  track: Track,
  config: LastfmData,
  extra?: Record<string, string>
) {
  if (!config.sessionKey || !apiKey || !apiSecret) return;
  const artist = formatArtist(track);
  if (!artist || !track.title) return;

  const params: Record<string, string> = {
    method,
    artist,
    track: track.title,
    api_key: apiKey,
    sk: config.sessionKey,
    ...extra,
  };
  if (track.album) params.album = track.album;
  if (track.duration != null)
    params.duration = String(Math.round(track.duration / 1000));
  params.api_sig = sign(params, apiSecret);

  try {
    await post(params);
  } catch (e) {
    console.error(`Last.fm request failed:`, e);
  }
}

export function authenticate(
  getConfig: () => LastfmData,
  host: IntegrationCallbacks,
  i18n: i18n
) {
  if (!apiKey || !apiSecret) return;

  const authUrl = `https://www.last.fm/api/auth/?api_key=${encodeURIComponent(apiKey)}&cb=${encodeURIComponent(getRedirectUri())}`;
  host.openAuthenticationUrl(authUrl);

  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type !== "OAuthCode") return;
    const token = event.data.code;
    if (!token) return;
    window.removeEventListener("message", handleMessage);
    void (async () => {
      const sessionParams = {
        api_key: apiKey,
        method: "auth.getSession",
        token,
      };
      const sessionData = (await get({
        ...sessionParams,
        api_sig: sign(sessionParams, apiSecret),
      })) as {
        session?: { key: string; name: string };
        error?: number;
        message?: string;
      };

      host.updateData({
        ...getConfig(),
        sessionKey: sessionData.session?.key,
        username: sessionData.session?.name,
      });
      if (!sessionData.session) {
        host.showAlert({
          heading: i18n.t("lastfm:error.authFailed"),
          message: i18n.t("lastfm:error.authFailedMessage"),
          closeLabel: "OK",
        });
      }
    })();
  };
  window.addEventListener("message", handleMessage);
}

export function logout(host: IntegrationCallbacks) {
  host.updateData({ sessionKey: undefined, username: undefined });
}
