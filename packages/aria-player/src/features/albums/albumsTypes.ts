import { Album } from "../../../../types";

export interface AlbumDetails extends Partial<Album> {
  albumId: string;
  name: string;
  source: string;
}
