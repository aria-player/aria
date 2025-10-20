import { Artist } from "../../../../types";

export interface ArtistDetails extends Partial<Artist> {
  artistId: string;
  name: string;
  source: string;
  firstTrackArtworkUri?: string;
}

export enum ArtistDelimiterType {
  None = "",
  Slash = "/",
  Semicolon = ";",
  Comma = ",",
  Ampersand = "&",
  SpacedSlash = " / ",
  Custom = "custom"
}
