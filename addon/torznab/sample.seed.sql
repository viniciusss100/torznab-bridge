CREATE TABLE IF NOT EXISTS torrents (
  "infoHash" text PRIMARY KEY,
  provider text NOT NULL,
  "torrentId" text,
  title text NOT NULL,
  size bigint,
  type text NOT NULL,
  "uploadDate" timestamptz DEFAULT NOW(),
  seeders integer DEFAULT 0,
  trackers text,
  languages text,
  resolution text
);

CREATE TABLE IF NOT EXISTS files (
  id serial PRIMARY KEY,
  "infoHash" text NOT NULL REFERENCES torrents("infoHash") ON DELETE CASCADE,
  "fileIndex" integer DEFAULT 0,
  title text NOT NULL,
  size bigint,
  "imdbId" text,
  "imdbSeason" integer,
  "imdbEpisode" integer,
  "kitsuId" integer,
  "kitsuEpisode" integer
);

TRUNCATE TABLE files RESTART IDENTITY CASCADE;
TRUNCATE TABLE torrents CASCADE;

INSERT INTO torrents ("infoHash", provider, "torrentId", title, size, type, "uploadDate", seeders, trackers, languages, resolution)
VALUES
  ('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'yts', 'movie-1', 'The Matrix 1999 1080p BluRay x264 YTS', 2147483648, 'movie', NOW() - INTERVAL '5 days', 150, 'udp://tracker.opentrackr.org:1337/announce,udp://open.stealth.si:80/announce', '["english"]', '1080p'),
  ('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'comando', 'series-1', 'Game of Thrones S01E01 1080p WEB-DL Dublado', 1610612736, 'series', NOW() - INTERVAL '3 days', 87, 'udp://tracker.opentrackr.org:1337/announce,udp://open.stealth.si:80/announce', '["portuguese","english"]', '1080p'),
  ('cccccccccccccccccccccccccccccccccccccccc', '1337x', 'series-2', 'Game of Thrones S01E01 720p WEB-DL x265', 1073741824, 'series', NOW() - INTERVAL '2 days', 42, 'udp://tracker.opentrackr.org:1337/announce', '["english"]', '720p');

INSERT INTO files ("infoHash", "fileIndex", title, size, "imdbId", "imdbSeason", "imdbEpisode", "kitsuId", "kitsuEpisode")
VALUES
  ('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 0, 'The Matrix 1999 1080p BluRay x264 YTS', 2147483648, 'tt0133093', NULL, NULL, NULL, NULL),
  ('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 0, 'Game of Thrones S01E01 1080p WEB-DL Dublado', 1610612736, 'tt0944947', 1, 1, NULL, NULL),
  ('cccccccccccccccccccccccccccccccccccccccc', 0, 'Game of Thrones S01E01 720p WEB-DL x265', 1073741824, 'tt0944947', 1, 1, NULL, NULL);
