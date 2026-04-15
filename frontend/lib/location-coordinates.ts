export type CoordinatePair = [number, number];

export type LocationOption = {
  key: string;
  label: string;
  coordinates: CoordinatePair;
};

const LOCATION_COORDINATES: Record<string, CoordinatePair> = {
  downtown: [12.9716, 77.5946],
  airport: [13.1986, 77.7066],
  midtown: [12.9802, 77.6408],
  suburb: [12.9153, 77.5135],
  murkambathu_chittoor: [13.2175, 79.1008],
  murkambattu_chittoor: [13.2175, 79.1008],
  murakambattu_chittoor: [13.2175, 79.1008],
  chittoor: [13.2172, 79.1003],
  chittoor_town: [13.2172, 79.1003],
  chittoor_municipal_market: [13.2175, 79.1006],
  chittoor_old_town: [13.2164, 79.0998],
  chittoor_new_town: [13.219, 79.1011],
  chittoor_gandhi_road: [13.216, 79.1018],
  chittoor_trunk_road: [13.2204, 79.1026],
  chittoor_bangalore_road: [13.2148, 79.0967],
  chittoor_katpadi_road: [13.2179, 79.0988],
  chittoor_vellore_road: [13.2172, 79.1003],
  chittoor_satyanarayanapuram: [13.218, 79.1035],
  chittoor_kanipakam: [13.2057, 79.1141],
  chittoor_tirupati_central: [13.6288, 79.4192],
  chittoor_tirupati_renigunta: [13.6365, 79.5034],
  chittoor_tirupati_leela_mahal: [13.635, 79.423],
  chittoor_tirupati_alipiri: [13.6283, 79.4191],
  chittoor_tirupati_tuda: [13.6293, 79.4202],
  chittoor_tirupati_saptagiri: [13.6278, 79.4197],
  chittoor_palamaner: [13.2007, 78.7499],
  chittoor_piler: [13.6333, 78.9333],
  chittoor_madanapalle: [13.55, 78.5],
  chittoor_punganur: [13.3667, 78.5833],
  chittoor_nagari: [13.3227, 79.5856],
  chittoor_srikalahasti: [13.7498, 79.6986],
  chittoor_kuppam: [12.7448, 78.3491],
  chittoor_kuppam_bypass: [12.7457, 78.3505],
  chittoor_nagalapuram: [13.418, 79.646],
  chittoor_puttur: [13.4426, 79.5508],
  chittoor_thottambedu: [13.5132, 79.5665],
  chittoor_karvetinagaram: [13.2498, 79.4047],
  chittoor_chandragiri: [13.5884, 79.3141],
  kurnool: [15.8281, 78.0373],
  kurnool_city: [15.8281, 78.0373],
  kurnool_town: [15.8281, 78.0373],
  kurnool_district: [15.8281, 78.0373],
  kurnool_urban: [15.8281, 78.0373],
  kurnool_old_town: [15.8281, 78.0373],
  kurnool_new_town: [15.8292, 78.0391],
  kurnool_trunk_road: [15.8278, 78.0387],
  kurnool_raj_vihar: [15.8298, 78.0412],
  kurnool_nandyal_road: [15.8236, 78.0346],
  kurnool_municipal_complex: [15.829, 78.0379],
  kurnool_bellary_road: [15.8249, 78.0288],
  kurnool_kalpana_circle: [15.8287, 78.0369],
  kurnool_ngo_colony: [15.8314, 78.0428],
  kurnool_adoni_road: [15.8271, 78.0307],
  kurnool_aduoni_road: [15.8271, 78.0307],
  andhra_pradesh_srikakulam: [18.2969, 83.8956],
  andhra_pradesh_vizianagaram: [18.1067, 83.3956],
  andhra_pradesh_parvathipuram_manyam: [18.77, 83.42],
  andhra_pradesh_alluri_sitharama_raju: [17.666, 82.75],
  andhra_pradesh_ananthapuramu: [14.6819, 77.6006],
  andhra_pradesh_sri_sathya_sai: [14.17, 77.8],
  andhra_pradesh_kadapa: [14.4674, 78.8242],
  andhra_pradesh_ysr_kadapa: [14.4674, 78.8242],
  andhra_pradesh_nandyal: [15.4775, 78.4831],
  andhra_pradesh_kurnool: [15.8281, 78.0373],
  andhra_pradesh_prakasam: [15.5057, 80.0499],
  andhra_pradesh_guntur: [16.3067, 80.4365],
  andhra_pradesh_palnadu: [16.25, 79.75],
  andhra_pradesh_bapatla: [15.9044, 80.4675],
  andhra_pradesh_krishna: [16.5062, 80.648],
  andhra_pradesh_ntr: [16.5062, 80.648],
  andhra_pradesh_eluru: [16.7107, 81.107],
  andhra_pradesh_west_godavari: [16.9944, 81.7297],
  andhra_pradesh_east_godavari: [17.0005, 82.2475],
  andhra_pradesh_kakinada: [16.9891, 82.2475],
  andhra_pradesh_ambedkar_konaseema: [16.5833, 82.0167],
  andhra_pradesh_tirupati: [13.6288, 79.4192],
  andhra_pradesh_chittoor: [13.2172, 79.1003],
  andhra_pradesh_vijayawada: [16.5062, 80.648],
  andhra_pradesh_visakhapatnam: [17.6868, 83.2185],
  andhra_pradesh_amaravati: [16.5412, 80.5152],
};

const INDIA_FALLBACK_ANCHORS: CoordinatePair[] = [
  [28.6315, 77.2167],
  [19.0764, 72.8777],
  [22.5728, 88.3639],
  [13.0604, 80.2496],
  [17.4435, 78.3772],
  [12.9719, 77.6412],
  [23.0301, 72.5801],
  [26.9128, 75.7873],
  [26.8501, 80.9462],
  [25.6113, 85.1416],
  [21.1469, 79.0849],
  [23.2599, 77.4126],
  [22.3079, 73.1812],
  [30.7338, 76.7794],
  [11.0176, 76.9558],
  [24.5859, 73.7125],
  [31.1048, 77.1734],
  [32.7278, 74.857],
  [17.6868, 83.2185],
  [20.2961, 85.8245],
];

export const LOCATION_OPTIONS: LocationOption[] = Object.entries(LOCATION_COORDINATES).map(([key, coordinates]) => ({
  key,
  label: formatLocationLabel(key),
  coordinates,
}));

export function normalizeLocationKey(location: string): string {
  return location
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function hashKey(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function formatLocationLabel(location: string): string {
  return normalizeLocationKey(location)
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function findLocationMatches(query: string, limit = 8): LocationOption[] {
  const normalizedQuery = normalizeLocationKey(query);
  if (!normalizedQuery) {
    return LOCATION_OPTIONS.slice(0, limit);
  }

  return LOCATION_OPTIONS
    .map((option) => {
      const key = normalizeLocationKey(option.key);
      const label = normalizeLocationKey(option.label);
      const exact = key === normalizedQuery;
      const keyStartsWith = key.startsWith(normalizedQuery);
      const labelStartsWith = label.startsWith(normalizedQuery);
      const keyIncludes = key.includes(normalizedQuery);
      const labelIncludes = label.includes(normalizedQuery);

      let score = 0;
      if (exact) score = 100;
      else if (keyStartsWith) score = 90;
      else if (labelStartsWith) score = 85;
      else if (keyIncludes) score = 70;
      else if (labelIncludes) score = 60;

      return { option, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.option.label.localeCompare(right.option.label))
    .slice(0, limit)
    .map((item) => item.option);
}

export function resolveLocationCoordinates(location: string): CoordinatePair | null {
  const key = normalizeLocationKey(location);
  if (!key) {
    return null;
  }

  if (LOCATION_COORDINATES[key]) {
    return LOCATION_COORDINATES[key];
  }

  if (key.includes("murkambath") || key.includes("murkambatt") || key.includes("morkambat")) {
    return LOCATION_COORDINATES.murkambathu_chittoor;
  }

  if (key.includes("kurnool")) {
    return LOCATION_COORDINATES.kurnool;
  }

  if (key.includes("chittoor")) {
    return LOCATION_COORDINATES.chittoor;
  }

  if (key.includes("tirupati")) {
    return LOCATION_COORDINATES.chittoor_tirupati_central;
  }

  if (key.includes("andhra") || key.includes("ap_")) {
    return LOCATION_COORDINATES.andhra_pradesh_vijayawada;
  }

  return null;
}

export function getStableFallbackCoordinates(location: string): CoordinatePair {
  const key = normalizeLocationKey(location) || "kapido";
  const index = hashKey(key) % INDIA_FALLBACK_ANCHORS.length;
  return INDIA_FALLBACK_ANCHORS[index];
}

export function getLocationCoordinates(location: string): CoordinatePair {
  return resolveLocationCoordinates(location) ?? getStableFallbackCoordinates(location);
}
