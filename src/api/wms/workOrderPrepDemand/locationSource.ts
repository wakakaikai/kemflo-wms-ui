import type { PrepDemandLocationSource } from './types';

/** 备料库位明细-用户选择 */
export const PREP_LOCATION_REC_USER_SELECTED = 'USER_SELECTED' as const;

/** 备料库位明细-系统推荐 */
export const PREP_LOCATION_REC_SYSTEM_RECOMMENDED = 'SYSTEM_RECOMMENDED' as const;

export type PrepLocationRecommendationSource = typeof PREP_LOCATION_REC_USER_SELECTED | typeof PREP_LOCATION_REC_SYSTEM_RECOMMENDED;

export function normalizeRecommendationSource(source?: PrepLocationRecommendationSource | PrepDemandLocationSource | string): PrepLocationRecommendationSource | undefined {
  const value = String(source ?? '')
    .trim()
    .toUpperCase();
  if (!value) return undefined;
  if (value === 'MANUAL' || value === PREP_LOCATION_REC_USER_SELECTED) {
    return PREP_LOCATION_REC_USER_SELECTED;
  }
  if (value === 'SYSTEM' || value === PREP_LOCATION_REC_SYSTEM_RECOMMENDED || value === 'FIFO' || value === 'RECOMMENDED') {
    return PREP_LOCATION_REC_SYSTEM_RECOMMENDED;
  }
  return undefined;
}

export function mapLocationSourceToRecommendationSource(source?: PrepDemandLocationSource | PrepLocationRecommendationSource | string): PrepLocationRecommendationSource {
  return normalizeRecommendationSource(source) ?? PREP_LOCATION_REC_SYSTEM_RECOMMENDED;
}

export function mapRecommendationSourceToLocationSource(source?: PrepLocationRecommendationSource | PrepDemandLocationSource | string): PrepDemandLocationSource {
  const value = normalizeRecommendationSource(source);
  if (value === PREP_LOCATION_REC_USER_SELECTED) return 'MANUAL';
  return 'SYSTEM';
}

export function isPrepLocationUserSelected(source?: PrepLocationRecommendationSource | PrepDemandLocationSource | string): boolean {
  return normalizeRecommendationSource(source) === PREP_LOCATION_REC_USER_SELECTED;
}

export function isPrepLocationSystemRecommended(source?: PrepLocationRecommendationSource | PrepDemandLocationSource | string): boolean {
  return normalizeRecommendationSource(source) === PREP_LOCATION_REC_SYSTEM_RECOMMENDED;
}

export type PrepLocationSourceRow = {
  recommendationSource?: PrepLocationRecommendationSource | PrepDemandLocationSource | string;
  locationSource?: PrepDemandLocationSource | string;
  locationRemark?: string;
  remark?: string;
};

export function resolvePrepLocationRecommendationSource(row: PrepLocationSourceRow): PrepLocationRecommendationSource | undefined {
  return normalizeRecommendationSource(row.recommendationSource ?? row.locationSource);
}

export function hasPrepRowUserSelectedLocation(rows: PrepLocationSourceRow[]): boolean {
  return rows.some((row) => isPrepLocationUserSelected(resolvePrepLocationRecommendationSource(row)));
}
