export interface TrendMetadata {
  title?: string;
  image_url?: string;
  supplier_price?: number;
  competitor_min?: number;
  source?: string;
}

export function parseTrendMetadata(raw: string | null | undefined): TrendMetadata {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as TrendMetadata;
  } catch {
    return {};
  }
}
