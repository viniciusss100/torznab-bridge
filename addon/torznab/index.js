import express from 'express';
import { buildCapsXml, buildErrorXml, buildRssXml } from './xml.js';
import {
  buildMagnetUrl,
  parseReleaseGuid,
  getAdapterConfiguration,
  normalizeEpisodeNumber,
  normalizeImdbId,
  normalizeQueryLimit,
  parseCategories,
  toTorznabItem,
} from './release.js';
import {
  searchReleaseRows as searchReleaseRowsDb,
  closePool,
  getReleaseRowByGuid,
  checkDatabaseHealth,
} from './repository.js';
import { checkStremioHealth, getStremioReleaseRowByGuid, searchStremioReleaseRows } from './stremio.js';
import { checkBetorHealth, getBetorReleaseRowByGuid, searchBetorReleaseRows } from './betor.js';
import {
  getSourceMode,
  SOURCE_BETOR,
  SOURCE_DATABASE,
  SOURCE_STREMIO,
} from './source.js';
import { renderConfigurePage } from './configurePage.js';
import { getRuntimeConfigPath, saveRuntimeConfig } from './runtimeConfig.js';

const PORT = parseInt(process.env.PORT || process.env.TORZNAB_PORT || '9699', 10);
const BIND_ADDRESS = process.env.TORZNAB_BIND_ADDRESS || '0.0.0.0';
const PUBLIC_BASE_URL = process.env.TORZNAB_BASE_URL || `http://localhost:${PORT}`;
const API_KEY = process.env.TORZNAB_API_KEY;
const LOG_REQUESTS = process.env.TORZNAB_LOG_REQUESTS === '1';

const app = express();
app.disable('x-powered-by');
app.use(express.urlencoded({ extended: false }));

app.use((req, _, next) => {
  if (LOG_REQUESTS) {
    console.log(`${req.method} ${req.originalUrl}`);
  }
  next();
});

app.get('/', renderProviderUi);

app.get('/health', async (_, res) => {
  const sources = getActiveSources();
  const checks = await Promise.all(sources.map(checkSourceHealth));
  const failingChecks = checks.filter(check => !check.ok);

  if (!failingChecks.length) {
    res.json({
      ok: true,
      service: 'torznab-bridge',
      source: getSourceMode(),
      sources,
      configuration: process.env.TORZNAB_CONFIGURATION || 'brazuca',
      checks,
    });
    return;
  }

  res.status(503).json({
    ok: false,
    service: 'torznab-bridge',
    source: getSourceMode(),
    sources,
    error: 'one_or_more_sources_unreachable',
    checks,
  });
});

app.get('/download/:guid', async (req, res) => {
  try {
    const row = await getReleaseByGuid(req.params.guid);
    if (!row) {
      res.status(404).send('Release not found');
      return;
    }
    res.redirect(302, buildMagnetUrl(row));
  } catch (error) {
    console.error('Failed download redirect', error);
    res.status(500).send('Failed to build magnet link');
  }
});

app.get('/details/:guid', async (req, res) => {
  try {
    const row = await getReleaseByGuid(req.params.guid);
    if (!row) {
      res.status(404).send('Release not found');
      return;
    }
    res.type('text/plain').send([
      `Torrent: ${row.torrentTitle}`,
      `File: ${row.fileTitle}`,
      `Provider: ${row.provider}`,
      `InfoHash: ${row.infoHash}`,
      `IMDb: ${row.imdbId || ''}`,
      `Season: ${row.imdbSeason || ''}`,
      `Episode: ${row.imdbEpisode || ''}`,
      `Seeders: ${row.seeders || 0}`,
    ].join('\n'));
  } catch (error) {
    console.error('Failed details request', error);
    res.status(500).send('Failed to load release');
  }
});

app.get('/configure', renderProviderUi);

app.post('/configure', (req, res) => {
  const providers = normalizeProviderSelection(req.body?.providers);
  const sources = normalizeProviderSelection(req.body?.sources);
  saveRuntimeConfig({ providers, sources });
  res.redirect(303, '/configure?saved=1');
});

app.get('/api', handleApiRequest);
app.get('/api/', handleApiRequest);

const server = app.listen(PORT, BIND_ADDRESS, () => {
  console.log(`Started Torrentio Torznab adapter at: ${PUBLIC_BASE_URL}`);
});

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

async function handleApiRequest(req, res) {
  if (!isAuthorized(req)) {
    res.status(401).type('application/xml').send(buildErrorXml(100, 'Missing or invalid API key'));
    return;
  }

  const action = `${req.query.t || ''}`.toLowerCase();
  const baseUrl = getRequestBaseUrl(req);

  try {
    if (action === 'caps') {
      res.type('application/xml').send(buildCapsXml(baseUrl));
      return;
    }

    if (!['search', 'tvsearch', 'movie'].includes(action)) {
      res.status(400).type('application/xml').send(buildErrorXml(200, `Unsupported action: ${action || 'empty'}`));
      return;
    }

    const rows = await searchReleaseRows(buildSearchOptions(action, req.query));
    const items = rows.map(row => toTorznabItem(row, baseUrl));
    const channelTitle = buildChannelTitle(action, req.query);
    res.type('application/xml').send(buildRssXml(channelTitle, items));
  } catch (error) {
    console.error('Torznab request failed', error);
    res.status(500).type('application/xml').send(buildErrorXml(500, 'Internal adapter error'));
  }
}

async function shutdown() {
  server.close(async () => {
    await closePool().catch(error => console.error('Failed closing pool', error));
    process.exit(0);
  });
}

function isAuthorized(req) {
  if (!API_KEY) {
    return true;
  }
  return req.query.apikey === API_KEY || req.headers['x-api-key'] === API_KEY;
}

function getRequestBaseUrl(req) {
  if (process.env.TORZNAB_BASE_URL) {
    return process.env.TORZNAB_BASE_URL;
  }
  return `${req.protocol}://${req.get('host')}`;
}

function buildSearchOptions(action, query) {
  const adapterConfig = getAdapterConfiguration();
  const providers = (adapterConfig.providers || []).map(provider => provider.toLowerCase());
  const imdbId = normalizeImdbId(query.imdbid);
  const season = normalizeEpisodeNumber(query.season);
  const episode = normalizeEpisodeNumber(query.ep);
  const categories = parseCategories(query.cat);
  const types = action === 'tvsearch' ? ['series', 'anime'] : [];

  return {
    type: action === 'movie' ? 'movie' : undefined,
    types,
    imdbId,
    query: normalizeTextQuery(action, query),
    season,
    episode,
    categories,
    providers,
    limit: normalizeQueryLimit(query.limit),
  };
}

async function searchReleaseRows(options) {
  const limit = options.limit || 100;
  const sourceRows = await Promise.all(getActiveSources().map(async source => {
    try {
      return await searchSourceRows(source, options);
    } catch (error) {
      console.error(`Failed searching source ${source}`, error);
      return [];
    }
  }));

  const mergedRows = [];
  const seenKeys = new Set();
  for (const row of sourceRows.flat()) {
    const dedupeKey = `${row.infoHash}:${row.fileIndex || 0}`;
    if (seenKeys.has(dedupeKey)) {
      continue;
    }
    seenKeys.add(dedupeKey);
    mergedRows.push(row);
    if (mergedRows.length >= limit) {
      break;
    }
  }
  return mergedRows;
}

function normalizeTextQuery(action, query) {
  if (action === 'movie' || action === 'search') {
    return `${query.q || ''}`.trim() || undefined;
  }

  const parts = [`${query.q || ''}`.trim()];
  if (query.season) {
    const season = `${query.season}`.padStart(2, '0');
    if (query.ep) {
      const episode = `${query.ep}`.padStart(2, '0');
      parts.push(`S${season}E${episode}`);
    } else {
      parts.push(`S${season}`);
    }
  }
  return parts.filter(Boolean).join(' ').trim() || undefined;
}

function buildChannelTitle(action, query) {
  if (action === 'tvsearch') {
    return `Torrentio Torznab TV Search: ${query.q || query.imdbid || 'all'}`;
  }
  if (action === 'movie') {
    return `Torrentio Torznab Movie Search: ${query.q || query.imdbid || 'all'}`;
  }
  return `Torrentio Torznab Search: ${query.q || query.imdbid || 'all'}`;
}

async function getReleaseByGuid(guid) {
  const parsedGuid = parseReleaseGuid(guid);
  const row = await getReleaseBySourceGuid(parsedGuid);
  const allowedProviders = new Set((getAdapterConfiguration().providers || []).map(provider => provider.toLowerCase()));
  if (!row) {
    return undefined;
  }
  if (allowedProviders.size && !allowedProviders.has(`${row.provider}`.toLowerCase())) {
    return undefined;
  }
  return row;
}

async function getDatabaseReleaseByGuid(guid) {
  const { infoHash, fileIndex } = parseReleaseGuid(guid);
  return getReleaseRowByGuid(infoHash, fileIndex);
}

function normalizeProviderSelection(rawProviders) {
  if (Array.isArray(rawProviders)) {
    return rawProviders;
  }
  if (typeof rawProviders === 'string' && rawProviders.length > 0) {
    return [rawProviders];
  }
  return [];
}

function renderProviderUi(req, res) {
  const adapterConfig = getAdapterConfiguration();
  res.type('html').send(renderConfigurePage({
    selectedProviders: adapterConfig.providers || [],
    selectedSources: adapterConfig.sources || [],
    baseUrl: PUBLIC_BASE_URL.replace(/\/$/, ''),
    saved: req.query.saved === '1',
    configPath: getRuntimeConfigPath(),
  }));
}

function getActiveSources() {
  const configuredSources = getAdapterConfiguration().sources || [];
  return configuredSources.length ? configuredSources : [getSourceMode()];
}

async function searchSourceRows(source, options) {
  if (source === SOURCE_STREMIO) {
    return searchStremioReleaseRows(options);
  }
  if (source === SOURCE_BETOR) {
    return searchBetorReleaseRows(options);
  }
  if (source === SOURCE_DATABASE) {
    const rows = await searchReleaseRowsDb(options);
    return rows.map(row => ({ ...row, _source: SOURCE_DATABASE }));
  }
  return [];
}

async function getReleaseBySourceGuid(parsedGuid) {
  const normalizedGuid = parsedGuid.source === SOURCE_DATABASE
    ? `${parsedGuid.infoHash}:${parsedGuid.fileIndex}`
    : `${parsedGuid.source}:${parsedGuid.infoHash}:${parsedGuid.fileIndex}`;

  if (parsedGuid.source === SOURCE_STREMIO) {
    return getStremioReleaseRowByGuid(normalizedGuid);
  }
  if (parsedGuid.source === SOURCE_BETOR) {
    return getBetorReleaseRowByGuid(normalizedGuid);
  }
  if (parsedGuid.source === SOURCE_DATABASE) {
    return getDatabaseReleaseByGuid(normalizedGuid);
  }
  return undefined;
}

async function checkSourceHealth(source) {
  try {
    if (source === SOURCE_STREMIO) {
      await checkStremioHealth();
    } else if (source === SOURCE_BETOR) {
      await checkBetorHealth();
    } else if (source === SOURCE_DATABASE) {
      await checkDatabaseHealth();
    }

    return { source, ok: true };
  } catch (error) {
    console.error(`Health check failed for source ${source}`, error);
    return { source, ok: false, error: error.message };
  }
}
