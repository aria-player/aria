const DISCORD_IMAGE_URL_MAX_LENGTH = 256;

const isExternalHttpUrl = (value: string): boolean => {
  const lower = value.toLowerCase();
  if (lower.includes("asset.localhost")) return false;
  return lower.startsWith("http://") || lower.startsWith("https://");
};

async function shortenUrl(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
    );
    if (response.ok) {
      const shortened = (await response.text()).trim();
      if (shortened.startsWith("https://tinyurl.com/")) {
        return shortened;
      }
    }
  } catch {
    console.error(
      "Failed to shorten image URL for Discord Rich Presence:",
      url
    );
  }
  return undefined;
}

export async function resolveArtworkUrl(
  artworkUrl?: string
): Promise<string | undefined> {
  if (!artworkUrl) return undefined;
  if (!isExternalHttpUrl(artworkUrl)) return undefined;
  if (artworkUrl.length <= DISCORD_IMAGE_URL_MAX_LENGTH) return artworkUrl;
  return await shortenUrl(artworkUrl);
}
