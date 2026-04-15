const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, 'ride_data.csv');
const EXTRA_ROWS = 10000;

const andhraPradeshDistricts = [
  { location: 'andhra_pradesh_srikakulam', latitude: 18.2969, longitude: 83.8956, weight: 0.84 },
  { location: 'andhra_pradesh_vizianagaram', latitude: 18.1067, longitude: 83.3956, weight: 0.86 },
  { location: 'andhra_pradesh_parvathipuram_manyam', latitude: 18.7700, longitude: 83.4200, weight: 0.79 },
  { location: 'andhra_pradesh_alluri_sitharama_raju', latitude: 17.6660, longitude: 82.7500, weight: 0.77 },
  { location: 'andhra_pradesh_ananthapuramu', latitude: 14.6819, longitude: 77.6006, weight: 0.91 },
  { location: 'andhra_pradesh_sri_sathya_sai', latitude: 14.1700, longitude: 77.8000, weight: 0.83 },
  { location: 'andhra_pradesh_kadapa', latitude: 14.4674, longitude: 78.8242, weight: 0.88 },
  { location: 'andhra_pradesh_ysr_kadapa', latitude: 14.4674, longitude: 78.8242, weight: 0.88 },
  { location: 'andhra_pradesh_nandyal', latitude: 15.4775, longitude: 78.4831, weight: 0.87 },
  { location: 'andhra_pradesh_kurnool', latitude: 15.8281, longitude: 78.0373, weight: 0.92 },
  { location: 'andhra_pradesh_nandyal_kurnool_region', latitude: 15.4775, longitude: 78.4831, weight: 0.85 },
  { location: 'andhra_pradesh_prakasam', latitude: 15.5057, longitude: 80.0499, weight: 0.9 },
  { location: 'andhra_pradesh_guntur', latitude: 16.3067, longitude: 80.4365, weight: 1.05 },
  { location: 'andhra_pradesh_palnadu', latitude: 16.2500, longitude: 79.7500, weight: 0.88 },
  { location: 'andhra_pradesh_bapatla', latitude: 15.9044, longitude: 80.4675, weight: 0.9 },
  { location: 'andhra_pradesh_krishna', latitude: 16.5062, longitude: 80.6480, weight: 1.0 },
  { location: 'andhra_pradesh_ntr', latitude: 16.5062, longitude: 80.6480, weight: 1.04 },
  { location: 'andhra_pradesh_eluru', latitude: 16.7107, longitude: 81.1070, weight: 0.98 },
  { location: 'andhra_pradesh_west_godavari', latitude: 16.9944, longitude: 81.7297, weight: 0.95 },
  { location: 'andhra_pradesh_east_godavari', latitude: 17.0005, longitude: 82.2475, weight: 0.98 },
  { location: 'andhra_pradesh_kakinada', latitude: 16.9891, longitude: 82.2475, weight: 1.04 },
  { location: 'andhra_pradesh_ambedkar_konaseema', latitude: 16.5833, longitude: 82.0167, weight: 0.9 },
  { location: 'andhra_pradesh_ananthapur', latitude: 14.6819, longitude: 77.6006, weight: 0.9 },
  { location: 'andhra_pradesh_tirupati', latitude: 13.6288, longitude: 79.4192, weight: 1.12 },
  { location: 'andhra_pradesh_chittoor', latitude: 13.2172, longitude: 79.1003, weight: 1.0 },
  { location: 'andhra_pradesh_srikakulam_district', latitude: 18.2969, longitude: 83.8956, weight: 0.83 },
  { location: 'andhra_pradesh_vijayawada', latitude: 16.5062, longitude: 80.6480, weight: 1.18 },
  { location: 'andhra_pradesh_visakhapatnam', latitude: 17.6868, longitude: 83.2185, weight: 1.2 },
  { location: 'andhra_pradesh_amaravati', latitude: 16.5412, longitude: 80.5152, weight: 1.08 },
];

const chittoorAreas = [
  { location: 'chittoor_vellore_road', latitude: 13.2172, longitude: 79.1003, weight: 1.02 },
  { location: 'chittoor_katpadi_road', latitude: 13.2179, longitude: 79.0988, weight: 0.98 },
  { location: 'chittoor_bangalore_road', latitude: 13.2148, longitude: 79.0967, weight: 1.0 },
  { location: 'chittoor_trunk_road', latitude: 13.2204, longitude: 79.1026, weight: 1.05 },
  { location: 'chittoor_gandhi_road', latitude: 13.2160, longitude: 79.1018, weight: 1.04 },
  { location: 'chittoor_kanipakam', latitude: 13.2057, longitude: 79.1141, weight: 1.08 },
  { location: 'chittoor_palamaner', latitude: 13.2007, longitude: 78.7499, weight: 0.94 },
  { location: 'chittoor_piler', latitude: 13.6333, longitude: 78.9333, weight: 0.92 },
  { location: 'chittoor_madanapalle', latitude: 13.5500, longitude: 78.5000, weight: 0.96 },
  { location: 'chittoor_punganur', latitude: 13.3667, longitude: 78.5833, weight: 0.9 },
  { location: 'chittoor_nagari', latitude: 13.3227, longitude: 79.5856, weight: 0.95 },
  { location: 'chittoor_srikalahasti', latitude: 13.7498, longitude: 79.6986, weight: 1.03 },
  { location: 'chittoor_tirupati_central', latitude: 13.6288, longitude: 79.4192, weight: 1.18 },
  { location: 'chittoor_tirupati_renigunta', latitude: 13.6365, longitude: 79.5034, weight: 1.12 },
  { location: 'chittoor_tirupati_leela_mahal', latitude: 13.6350, longitude: 79.4230, weight: 1.15 },
  { location: 'chittoor_tirupati_alipiri', latitude: 13.6283, longitude: 79.4191, weight: 1.09 },
  { location: 'chittoor_tirupati_tuda', latitude: 13.6293, longitude: 79.4202, weight: 1.11 },
  { location: 'chittoor_tirupati_saptagiri', latitude: 13.6278, longitude: 79.4197, weight: 1.1 },
  { location: 'chittoor_kuppam', latitude: 12.7448, longitude: 78.3491, weight: 0.86 },
  { location: 'chittoor_kuppam_bypass', latitude: 12.7457, longitude: 78.3505, weight: 0.84 },
  { location: 'chittoor_satyanarayanapuram', latitude: 13.2180, longitude: 79.1035, weight: 1.01 },
  { location: 'chittoor_nagalapuram', latitude: 13.4180, longitude: 79.6460, weight: 0.88 },
  { location: 'chittoor_puttur', latitude: 13.4426, longitude: 79.5508, weight: 0.9 },
  { location: 'chittoor_thottambedu', latitude: 13.5132, longitude: 79.5665, weight: 0.87 },
  { location: 'chittoor_karvetinagaram', latitude: 13.2498, longitude: 79.4047, weight: 0.85 },
  { location: 'chittoor_chandragiri', latitude: 13.5884, longitude: 79.3141, weight: 0.93 },
  { location: 'chittoor_municipal_market', latitude: 13.2175, longitude: 79.1006, weight: 1.07 },
  { location: 'chittoor_old_town', latitude: 13.2164, longitude: 79.0998, weight: 1.03 },
  { location: 'chittoor_new_town', latitude: 13.2190, longitude: 79.1011, weight: 1.04 },
];

const indiaCoreLocations = [
  { location: 'downtown', latitude: 12.9716, longitude: 77.5946, weight: 1.15 },
  { location: 'airport', latitude: 13.1986, longitude: 77.7066, weight: 1.25 },
  { location: 'midtown', latitude: 12.9802, longitude: 77.6408, weight: 1.0 },
  { location: 'suburb', latitude: 12.9153, longitude: 77.5135, weight: 0.78 },
  { location: 'connaught_place', latitude: 28.6315, longitude: 77.2167, weight: 1.2 },
  { location: 'india_gate', latitude: 28.6129, longitude: 77.2295, weight: 1.1 },
  { location: 'gurugram_cyber_city', latitude: 28.4949, longitude: 77.0887, weight: 1.18 },
  { location: 'noida_sector_62', latitude: 28.6176, longitude: 77.3721, weight: 1.0 },
  { location: 'mumbai_bandra', latitude: 19.0596, longitude: 72.8295, weight: 1.22 },
  { location: 'mumbai_andheri', latitude: 19.1197, longitude: 72.8468, weight: 1.15 },
  { location: 'pune_hinjewadi', latitude: 18.5917, longitude: 73.7389, weight: 1.05 },
  { location: 'chennai_t_nagar', latitude: 13.0418, longitude: 80.2337, weight: 1.12 },
  { location: 'chennai_omr', latitude: 12.8407, longitude: 80.2244, weight: 0.96 },
  { location: 'hyderabad_hitech_city', latitude: 17.4435, longitude: 78.3772, weight: 1.18 },
  { location: 'hyderabad_secunderabad', latitude: 17.4399, longitude: 78.4983, weight: 1.0 },
  { location: 'kolkata_esplanade', latitude: 22.5728, longitude: 88.3639, weight: 1.08 },
  { location: 'kolkata_salt_lake', latitude: 22.5862, longitude: 88.4143, weight: 0.92 },
  { location: 'ahmedabad_cg_road', latitude: 23.0225, longitude: 72.5714, weight: 1.04 },
  { location: 'jaipur_mi_road', latitude: 26.9128, longitude: 75.7873, weight: 1.0 },
  { location: 'lucknow_hazratganj', latitude: 26.8467, longitude: 80.9462, weight: 0.98 },
  { location: 'bengaluru_indiranagar', latitude: 12.9784, longitude: 77.6408, weight: 1.2 },
  { location: 'bengaluru_whitefield', latitude: 12.9698, longitude: 77.7500, weight: 1.08 },
  { location: 'kochi_mg_road', latitude: 9.9312, longitude: 76.2673, weight: 0.9 },
  { location: 'bhubaneswar_janpath', latitude: 20.2961, longitude: 85.8245, weight: 0.92 },
  { location: 'chandigarh_sector_17', latitude: 30.7333, longitude: 76.7794, weight: 0.96 },
  { location: 'nagpur_sitabuildi', latitude: 21.1458, longitude: 79.0882, weight: 0.88 },
  { location: 'indore_vijay_nagar', latitude: 22.7196, longitude: 75.8577, weight: 0.9 },
  { location: 'bhopal_mp_nagar', latitude: 23.2599, longitude: 77.4126, weight: 0.88 },
  { location: 'surat_adajan', latitude: 21.1702, longitude: 72.8311, weight: 0.86 },
  { location: 'vadodara_alkapuri', latitude: 22.3072, longitude: 73.1812, weight: 0.84 },
  { location: 'visakhapatnam_beach_road', latitude: 17.6868, longitude: 83.2185, weight: 0.88 },
  { location: 'coimbatore_race_course', latitude: 11.0168, longitude: 76.9558, weight: 0.86 },
  { location: 'mysuru_jayalakshmipuram', latitude: 12.2958, longitude: 76.6394, weight: 0.82 },
  { location: 'thiruvananthapuram_palayam', latitude: 8.5241, longitude: 76.9366, weight: 0.82 },
  { location: 'guwahati_paltan_bazaar', latitude: 26.1445, longitude: 91.7362, weight: 0.8 },
  { location: 'srinagar_lal_chowk', latitude: 34.0837, longitude: 74.7973, weight: 0.78 },
  { location: 'jaipur_sitapura', latitude: 26.7997, longitude: 75.8351, weight: 0.88 },
  { location: 'gurugram_sohna_road', latitude: 28.4089, longitude: 77.0383, weight: 1.02 },
  { location: 'noida_greater_noida', latitude: 28.4744, longitude: 77.5031, weight: 0.95 },
];

const locations = [
  ...indiaCoreLocations,
  ...andhraPradeshDistricts,
  ...chittoorAreas,
];

const apLocations = [
  ...andhraPradeshDistricts,
  ...chittoorAreas,
];

const peakHours = new Set([7, 8, 9, 10, 17, 18, 19, 20, 21]);

function seedRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function sample(arr, rand) {
  return arr[Math.floor(rand() * arr.length)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function demandBase(hour) {
  if (peakHours.has(hour)) return 1.55;
  if (hour >= 22 || hour <= 5) return 0.62;
  if (hour >= 12 && hour <= 15) return 0.88;
  return 1.0;
}

function cityDemandBoost(location) {
  if (location.includes('airport')) return 1.28;
  if (location.includes('downtown') || location.includes('connaught') || location.includes('bandra') || location.includes('hitech') || location.includes('indiranagar')) return 1.22;
  if (location.includes('suburb') || location.includes('whitefield') || location.includes('greater_noida') || location.includes('sitapura')) return 0.86;
  return 1.0;
}

function citySupplyBoost(location) {
  if (location.includes('airport')) return 1.0;
  if (location.includes('downtown') || location.includes('bandra') || location.includes('hitech')) return 0.92;
  if (location.includes('suburb') || location.includes('whitefield') || location.includes('greater_noida')) return 1.12;
  return 1.0;
}

function generateRow(rand, index) {
  const useAndhraSample = rand() < 0.52;
  const city = sample(useAndhraSample ? apLocations : locations, rand);
  const hour = Math.floor(rand() * 24);
  const dayOfWeek = Math.floor(rand() * 7);
  const weekend = dayOfWeek >= 5;
  const hourFactor = demandBase(hour);
  const weekdayFactor = weekend ? 0.96 : 1.06;
  const randomDemandNoise = 0.86 + rand() * 0.35;
  const randomSupplyNoise = 0.88 + rand() * 0.28;
  const cityDemand = cityDemandBoost(city.location);
  const citySupply = citySupplyBoost(city.location);

  const baseDemand = 34 + city.weight * 58;
  const baseSupply = 30 + city.weight * 50;

  const demand = Math.round(baseDemand * hourFactor * weekdayFactor * cityDemand * randomDemandNoise);
  let supply = Math.round(baseSupply * (1.08 - (peakHours.has(hour) ? 0.15 : 0.02)) * citySupply * randomSupplyNoise);

  if (weekend) {
    supply = Math.round(supply * 0.96);
  }

  const demandAdjusted = demand + Math.round((index % 7) * 0.35);
  const supplyAdjusted = clamp(supply - Math.round((index % 5) * 0.25), 12, 260);

  return [
    hour,
    dayOfWeek,
    city.location,
    city.latitude.toFixed(4),
    city.longitude.toFixed(4),
    Math.max(demandAdjusted, 0),
    Math.max(supplyAdjusted, 0),
  ].join(',');
}

function main() {
  const existing = fs.readFileSync(OUTPUT_PATH, 'utf8').trim().split(/\r?\n/);
  const header = existing[0];
  const rows = existing.slice(1);
  const rand = seedRandom(20260408);

  const generated = [];
  for (let index = 0; index < EXTRA_ROWS; index += 1) {
    generated.push(generateRow(rand, index));
  }

  const apDistrictRows = [];
  for (let districtIndex = 0; districtIndex < andhraPradeshDistricts.length; districtIndex += 1) {
    const district = andhraPradeshDistricts[districtIndex];
    for (let hour = 0; hour < 24; hour += 1) {
      for (let day = 0; day < 7; day += 1) {
        const weekend = day >= 5;
        const peak = peakHours.has(hour);
        const demand = Math.round((42 + district.weight * 54) * demandBase(hour) * (weekend ? 0.95 : 1.04) * (peak ? 1.12 : 0.97));
        const supply = Math.round((36 + district.weight * 48) * (peak ? 0.86 : 1.03) * (weekend ? 0.97 : 1.0));
        apDistrictRows.push([
          hour,
          day,
          district.location,
          district.latitude.toFixed(4),
          district.longitude.toFixed(4),
          Math.max(demand, 0),
          Math.max(clamp(supply, 10, 280), 0),
        ].join(','));
      }
    }
  }

  const chittoorAreaRows = [];
  for (let areaIndex = 0; areaIndex < chittoorAreas.length; areaIndex += 1) {
    const area = chittoorAreas[areaIndex];
    for (let hour = 0; hour < 24; hour += 1) {
      for (let day = 0; day < 7; day += 1) {
        const weekend = day >= 5;
        const peak = peakHours.has(hour);
        const hourLift = peak ? 1.22 : hour >= 0 && hour <= 5 ? 0.72 : 1.0;
        const demand = Math.round((38 + area.weight * 60) * hourLift * (weekend ? 0.97 : 1.03) * (1 + (areaIndex % 4) * 0.02));
        const supply = Math.round((34 + area.weight * 49) * (peak ? 0.84 : 1.04) * (weekend ? 0.95 : 1.0) * (1 - (areaIndex % 3) * 0.015));
        chittoorAreaRows.push([
          hour,
          day,
          area.location,
          area.latitude.toFixed(4),
          area.longitude.toFixed(4),
          Math.max(demand, 0),
          Math.max(clamp(supply, 10, 260), 0),
        ].join(','));
      }
    }
  }

  const output = [header, ...rows, ...generated, ...apDistrictRows, ...chittoorAreaRows].join('\n') + '\n';
  fs.writeFileSync(OUTPUT_PATH, output, 'utf8');

  console.log(`Expanded dataset to ${rows.length + generated.length + apDistrictRows.length + chittoorAreaRows.length} rows at ${OUTPUT_PATH}`);
}

main();
