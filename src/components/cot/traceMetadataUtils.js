function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function firstText(...values) {
  for (const value of values) {
    const text = String(value || '').trim();
    if (text) return text;
  }
  return '';
}

export function sourceTitle(source) {
  if (typeof source === 'string') return source;
  return firstText(source?.title, source?.name, source?.page_title, source?.label, 'Nguồn tham khảo');
}

export function sourceUrl(source) {
  if (!source || typeof source === 'string') return '';
  return firstText(source.url, source.fullurl, source.link, source.page_url, source.metadata?.url);
}

export function sourceContent(source) {
  if (!source || typeof source === 'string') return '';
  return firstText(
    source.extract,
    source.content,
    source.full_content,
    source.markdown,
    source.text,
    source.summary,
    source.snippet,
    source.description,
    source.metadata?.extract,
    source.metadata?.content,
  );
}

export function sourceKey(source) {
  return `${sourceUrl(source)}::${sourceTitle(source)}`;
}

export function collectMetadataSources(metadata = {}) {
  const sources = [
    ...asArray(metadata.sources),
    ...asArray(metadata.wikipedia_sources),
    ...asArray(metadata.external_sources),
    ...asArray(metadata.wiki_sources),
  ].filter(Boolean);

  const seen = new Set();
  return sources.filter((source) => {
    const key = sourceKey(source);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizeImage(image) {
  if (!image) return null;
  if (typeof image === 'string') return { url: image, prompt: '' };
  const url = firstText(image.url, image.imageUrl, image.image_url, image.src, image.thumbnail, image.previewURL);
  if (!url) return null;
  return {
    ...image,
    url,
    prompt: firstText(image.prompt, image.prompt_or_query, image.brief, image.title, image.alt),
  };
}

export function collectMetadataImages(metadata = {}) {
  const images = [
    ...asArray(metadata.images),
    ...asArray(metadata.image_urls),
    ...asArray(metadata.image_url),
  ]
    .map(normalizeImage)
    .filter(Boolean);

  const seen = new Set();
  return images.filter((image) => {
    if (seen.has(image.url)) return false;
    seen.add(image.url);
    return true;
  });
}

export function normalizeTraceStatus(status, { isLive = false } = {}) {
  const raw = String(status || '').toLowerCase();
  let normalized = 'running';
  if (['done', 'success', 'succeeded', 'complete', 'completed', 'finished', 'outline_ready'].includes(raw)) {
    normalized = 'success';
  } else if (['error', 'failed', 'failure'].includes(raw)) {
    normalized = 'error';
  } else if (['warning', 'warn'].includes(raw)) {
    normalized = 'warning';
  }

  return normalized === 'running' && !isLive ? 'success' : normalized;
}
