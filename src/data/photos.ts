export type Photo = {
  id: string;
  alt: string;
  width: number;
  height: number;
  span: "4" | "6" | "8";
  tall?: boolean;
  wide?: boolean;
  photographer?: string;
  campaign?: string;
  /**
   * Full-resolution CDN URL after upload.
   * Leave empty to render a layout placeholder.
   */
  src?: string;
};

/** Replace these with real shots; keep width/height accurate for CLS. */
export const photos: Photo[] = [
  {
    id: "01",
    alt: "Editorial portrait",
    width: 2400,
    height: 3000,
    span: "8",
    tall: true,
    campaign: "Campaign",
  },
  {
    id: "02",
    alt: "Studio portrait",
    width: 1600,
    height: 2000,
    span: "4",
    tall: true,
  },
  {
    id: "03",
    alt: "Lookbook frame",
    width: 2400,
    height: 1600,
    span: "6",
    wide: true,
  },
  {
    id: "04",
    alt: "Runway detail",
    width: 1600,
    height: 2000,
    span: "6",
    tall: true,
  },
  {
    id: "05",
    alt: "Magazine cover story",
    width: 2000,
    height: 2500,
    span: "4",
    tall: true,
  },
  {
    id: "06",
    alt: "Campaign still",
    width: 2000,
    height: 2500,
    span: "4",
    tall: true,
  },
  {
    id: "07",
    alt: "Street editorial",
    width: 2000,
    height: 2500,
    span: "4",
    tall: true,
  },
  {
    id: "08",
    alt: "Wide editorial",
    width: 3000,
    height: 2000,
    span: "8",
    wide: true,
  },
  {
    id: "09",
    alt: "Close portrait",
    width: 1600,
    height: 2000,
    span: "4",
    tall: true,
  },
];
