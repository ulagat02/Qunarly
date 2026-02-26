import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

type ParsedRow = {
  regionName: string;
  districtName: string;
  settlementName: string;
};

const regionKeys = ['облыс', 'облысы', 'аймақ', 'регион', 'region'];
const districtKeys = ['аудан', 'район', 'district'];
const settlementKeys = [
  'елді мекен',
  'елдімекен',
  'елді-мекен',
  'ауыл',
  'қала',
  'кент',
  'поселок',
  'населенный пункт',
  'settlement',
];
const normalizeName = (value: unknown) =>
  String(value ?? '')
    .replace(/"/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeKey = (value: unknown) =>
  normalizeName(value).toLowerCase();

const findHeaderIndex = (rows: any[][]) => {
  for (let i = 0; i < Math.min(rows.length, 80); i += 1) {
    const row = rows[i] || [];
    const normalized = row.map((cell) => normalizeKey(cell));
    const hasRegion = normalized.some((cell) => regionKeys.some((key) => cell.includes(key)));
    const hasDistrict = normalized.some((cell) => districtKeys.some((key) => cell.includes(key)));
    const hasSettlement = normalized.some((cell) =>
      settlementKeys.some((key) => cell.includes(key)),
    );
    if (hasRegion && hasDistrict && hasSettlement) {
      return i;
    }
  }
  return -1;
};

const mapHeader = (header: any[]) => {
  const normalized = header.map((cell) => normalizeKey(cell));
  const findIndex = (keys: string[]) =>
    normalized.findIndex((cell) => keys.some((key) => cell.includes(key)));
  return {
    regionIdx: findIndex(regionKeys),
    districtIdx: findIndex(districtKeys),
    settlementIdx: findIndex(settlementKeys),
  };
};

export const loadAdminUnits = (filePath: string): ParsedRow[] => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const workbook = XLSX.readFile(filePath, { cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
  const headerIndex = findHeaderIndex(rows);
  if (headerIndex < 0) {
    throw new Error('Header not found. Ensure columns include region/district/settlement.');
  }
  const header = rows[headerIndex] || [];
  const { regionIdx, districtIdx, settlementIdx } = mapHeader(header);
  if (regionIdx < 0 || districtIdx < 0 || settlementIdx < 0) {
    throw new Error('Required columns not found in header.');
  }

  const parsed: ParsedRow[] = [];
  for (let i = headerIndex + 1; i < rows.length; i += 1) {
    const row = rows[i] || [];
    const regionName = normalizeName(row[regionIdx]);
    const districtName = normalizeName(row[districtIdx]);
    const settlementName = normalizeName(row[settlementIdx]);
    if (!regionName || !districtName || !settlementName) {
      continue;
    }
    parsed.push({
      regionName,
      districtName,
      settlementName,
    });
  }
  return parsed;
};

export const importAdminUnits = async (prisma: PrismaClient, filePath: string) => {
  const rows = loadAdminUnits(filePath);
  const seen = new Set<string>();
  const deduped = rows.filter((row) => {
    const key = [
      normalizeKey(row.regionName),
      normalizeKey(row.districtName),
      normalizeKey(row.settlementName),
    ].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const regionCache = new Map<string, string>();
  const districtCache = new Map<string, string>();
  for (const row of deduped) {
    const regionKey = normalizeKey(row.regionName);
    let regionId = regionCache.get(regionKey);
    if (!regionId) {
      const existingRegion = await prisma.region.findFirst({
        where: { name: row.regionName, parentId: null },
      });
      const region =
        existingRegion ??
        (await prisma.region.create({
          data: { name: row.regionName, parentId: null },
        }));
      regionId = region.id;
      regionCache.set(regionKey, regionId);
    }

    const districtKey = `${regionId}:${normalizeKey(row.districtName)}`;
    let districtId: string | null = districtCache.get(districtKey) ?? null;
    if (!districtId) {
      await prisma.region.upsert({
        where: { name_parentId: { name: row.districtName, parentId: regionId } },
        update: {},
        create: { name: row.districtName, parentId: regionId },
      });
      const district = await prisma.district.upsert({
        where: { name_regionId: { name: row.districtName, regionId } },
        update: {},
        create: { name: row.districtName, regionId },
      });
      districtId = district.id;
      districtCache.set(districtKey, districtId);
    }
    if (!districtId) {
      continue;
    }
    await prisma.settlement.upsert({
      where: { name_districtId: { name: row.settlementName, districtId } },
      update: {},
      create: {
        name: row.settlementName,
        districtId,
      },
    });
  }
};

export const resolveAdminUnitsFile = (baseDir: string) => {
  const envPath = process.env.ADMIN_UNITS_FILE?.trim();
  if (envPath) {
    return path.isAbsolute(envPath) ? envPath : path.resolve(baseDir, envPath);
  }
  const dataDir = path.resolve(baseDir, 'data');
  if (!fs.existsSync(dataDir)) {
    const rootCandidates = fs
      .readdirSync(baseDir)
      .filter((file) => /\.(csv|xlsx)$/i.test(file))
      .filter((file) => /(әкімшілік|administrative|admin[_-]?units)/i.test(file))
      .map((file) => path.join(baseDir, file))
      .sort();
    return rootCandidates[0] ?? null;
  }
  const candidates = fs
    .readdirSync(dataDir)
    .filter((file) => /\.(csv|xlsx)$/i.test(file))
    .map((file) => path.join(dataDir, file))
    .sort();
  return candidates[0] ?? null;
};
