export type Region = "hk_island" | "kowloon" | "new_territories";

export const REGIONS: { id: Region; zh: string; en: string; districts: { zh: string; en: string }[] }[] = [
  {
    id: "hk_island",
    zh: "香港島",
    en: "Hong Kong Island",
    districts: [
      { zh: "中西區", en: "Central & Western" },
      { zh: "灣仔區", en: "Wan Chai" },
      { zh: "東區", en: "Eastern" },
      { zh: "南區", en: "Southern" },
    ],
  },
  {
    id: "kowloon",
    zh: "九龍",
    en: "Kowloon",
    districts: [
      { zh: "油尖旺區", en: "Yau Tsim Mong" },
      { zh: "深水埗區", en: "Sham Shui Po" },
      { zh: "九龍城區", en: "Kowloon City" },
      { zh: "黃大仙區", en: "Wong Tai Sin" },
      { zh: "觀塘區", en: "Kwun Tong" },
    ],
  },
  {
    id: "new_territories",
    zh: "新界",
    en: "New Territories",
    districts: [
      { zh: "荃灣區", en: "Tsuen Wan" },
      { zh: "葵青區", en: "Kwai Tsing" },
      { zh: "沙田區", en: "Sha Tin" },
      { zh: "西貢區", en: "Sai Kung" },
      { zh: "大埔區", en: "Tai Po" },
      { zh: "北區", en: "North" },
      { zh: "元朗區", en: "Yuen Long" },
      { zh: "屯門區", en: "Tuen Mun" },
      { zh: "離島區", en: "Islands" },
    ],
  },
];

/** Stored value format: "<region>/<district zh>", e.g. "kowloon/觀塘區". */
export const DISTRICT_VALUES = REGIONS.flatMap((r) => r.districts.map((d) => `${r.id}/${d.zh}`));

export function isDistrictValue(v: string): boolean {
  return DISTRICT_VALUES.includes(v);
}

export function districtLabel(value: string | null | undefined, locale: string): string {
  if (!value) return "—";
  const [regionId, districtZh] = value.split("/");
  const region = REGIONS.find((r) => r.id === regionId);
  const district = region?.districts.find((d) => d.zh === districtZh);
  if (!region || !district) return value;
  return locale === "en" ? `${district.en}, ${region.en}` : `${region.zh} · ${district.zh}`;
}

export function regionOf(value: string | null | undefined): Region | null {
  const id = value?.split("/")[0];
  return REGIONS.some((r) => r.id === id) ? (id as Region) : null;
}
