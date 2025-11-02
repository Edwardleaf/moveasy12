const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const FALLBACK_UNKNOWN = 'Unknown';

const DEFAULT_LIMITS = {
  amenities: 3,
  transportation: 2,
  features: Infinity
};

function toTitleCase(value) {
  return value
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function normaliseList(rawList) {
  if (!Array.isArray(rawList)) {
    return [];
  }

  return rawList
    .map(item => (typeof item === 'string' ? item : item?.name))
    .filter(Boolean);
}

export function processAreaTags(areaTags = []) {
  return areaTags
    .filter(tag => tag && tag !== 'undefined' && tag !== 'null')
    .map(tag => {
      if (UUID_REGEX.test(tag)) {
        return FALLBACK_UNKNOWN;
      }
      return toTitleCase(tag);
    })
    .sort((a, b) => a.length - b.length);
}

export function prepareAreaDisplay(
  area = {},
  { limits = DEFAULT_LIMITS, includeRemaining = true } = {}
) {
  const amenities = normaliseList(area.amenities);
  const transportList = normaliseList(
    Array.isArray(area.transportation) ? area.transportation : area.transport
  );
  const features = processAreaTags(area.area_tags || []);

  const createEntry = (list, limit) => {
    const items = list.slice(0, limit);
    const overflow = list.slice(limit);
    const remaining = includeRemaining ? overflow.length : 0;
    return {
      items,
      remaining,
      overflow
    };
  };

  return {
    amenities: createEntry(amenities, limits.amenities),
    transportation: createEntry(transportList, limits.transportation),
    features: createEntry(features, limits.features)
  };
}

export default {
  processAreaTags,
  prepareAreaDisplay
};
