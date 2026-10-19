/** Longitude/latitude for cities and hub codes used in routes, so the maps can draw them. */
export const COORDS: Record<string, [number, number]> = {
  // Canada
  Montreal: [-73.57, 45.5], Toronto: [-79.38, 43.65], Vancouver: [-123.12, 49.28], Ottawa: [-75.7, 45.42],
  Calgary: [-114.07, 51.05], Halifax: [-63.57, 44.65],
  // Africa
  Lagos: [3.38, 6.52], Abuja: [7.49, 9.07], Accra: [-0.19, 5.6], Kumasi: [-1.62, 6.69], Nairobi: [36.82, -1.29],
  Mombasa: [39.67, -4.04], Dakar: [-17.45, 14.69], Johannesburg: [28.05, -26.2], "Cape Town": [18.42, -33.92],
  Kinshasa: [15.27, -4.44], Cairo: [31.24, 30.04], "Addis Ababa": [38.75, 9.03], Douala: [9.7, 4.05], Abidjan: [-4.01, 5.36],
  // Elsewhere
  "New York": [-74.0, 40.71], London: [-0.13, 51.51], Paris: [2.35, 48.86], Frankfurt: [8.68, 50.11],
  Amsterdam: [4.9, 52.37], Rotterdam: [4.48, 51.92], Dubai: [55.27, 25.2], Istanbul: [28.98, 41.01], Shanghai: [121.47, 31.23],
  // Hub codes
  YUL: [-73.74, 45.47], YYZ: [-79.63, 43.68], YVR: [-123.18, 49.19], HAL: [-63.57, 44.65], JFK: [-73.78, 40.64],
  ORD: [-87.9, 41.98], LHR: [-0.45, 51.47], CDG: [2.55, 49.01], FRA: [8.56, 50.04], AMS: [4.76, 52.31], RTM: [4.4, 51.95],
  DXB: [55.36, 25.25], IST: [28.81, 40.98], ADD: [38.8, 8.98], LOS: [3.32, 6.58], ACC: [-0.17, 5.6], TEM: [0.0, 5.63],
  NBO: [36.93, -1.32], MBA: [39.6, -4.03], JNB: [28.24, -26.14], DKR: [-17.07, 14.67], CAI: [31.41, 30.12],
};

export const coordOf = (place: string): [number, number] | undefined => COORDS[place] ?? COORDS[place.trim()];

/** Broad region of a country code, for "shipments by region" pins. */
export const REGION: Record<string, string> = {
  CA: "Canada", US: "USA", MX: "Americas", BR: "Americas",
  GB: "Europe", FR: "Europe", DE: "Europe", NL: "Europe",
  NG: "Africa", GH: "Africa", KE: "Africa", ZA: "Africa", SN: "Africa", ET: "Africa", EG: "Africa", CD: "Africa",
  AE: "Middle East", IN: "Asia", CN: "Asia",
};
export const REGION_COORDS: Record<string, [number, number]> = {
  Canada: [-100, 58], USA: [-98, 39], Americas: [-60, -12], Europe: [12, 50], Africa: [20, 4], "Middle East": [48, 26], Asia: [100, 32],
};
