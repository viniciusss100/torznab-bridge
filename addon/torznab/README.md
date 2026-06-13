# Torznab Bridge Runtime

Este diretorio contem o runtime atual do adapter/bridge Torznab.

## Modos de fonte

- `TORZNAB_SOURCES=stremio,betor`
- `TORZNAB_SOURCES=database`
- fallback legado: `TORZNAB_SOURCE`

## Variaveis principais

- `TORZNAB_BASE_URL`
- `TORZNAB_CONFIGURATION`
- `TORZNAB_STREMIO_URL`
- `TORZNAB_BETOR_URL`
- `TORZNAB_API_KEY`
- `DATABASE_URI`

## Observacao

O bridge adapta metadados de fontes configuradas; ele nao implementa scraping proprio de todos os trackers.
