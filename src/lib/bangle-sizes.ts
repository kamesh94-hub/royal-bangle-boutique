export const BANGLE_SIZES = ["2.2", "2.4", "2.6", "2.8", "2.10"] as const;

export type BangleSize = (typeof BANGLE_SIZES)[number];

export const BANGLE_SIZE_GUIDE: Array<{
  size: BangleSize;
  diameterMm: number;
  diameterInches: string;
}> = [
  { size: "2.2", diameterMm: 54, diameterInches: "2.13”" },
  { size: "2.4", diameterMm: 57, diameterInches: "2.25”" },
  { size: "2.6", diameterMm: 60, diameterInches: "2.38”" },
  { size: "2.8", diameterMm: 64, diameterInches: "2.50”" },
  { size: "2.10", diameterMm: 67, diameterInches: "2.63”" },
];

export function getSizeOptionName(options: Array<{ name: string; values: string[] }>): string | null {
  return options.find((option) => /size|bangle/i.test(option.name))?.name ?? null;
}