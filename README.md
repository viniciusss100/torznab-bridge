# Torznab Bridge

`Torznab Bridge` converte metadados e links magnet de fontes configuradas para uma API compativel com Torznab.

O projeto nao faz scraping proprio do zero. Ele atua como adaptador entre fontes ja existentes, como:

- `Torrentio` via Stremio
- `BeTor`
- um banco compativel com o schema `torrents/files` do Torrentio

## Status

- licenca raiz: `Apache-2.0`
- atribuicoes de terceiros preservadas em [THIRD_PARTY_NOTICES.md](/home/matheus/torrentio-torznab-repo/THIRD_PARTY_NOTICES.md)
- commit-base registrado do Torrentio: `TheBeastLT/torrentio-scraper@e99fedb`

## Como funciona

1. O bridge consulta uma ou mais fontes habilitadas.
2. Normaliza os resultados em um modelo comum.
3. Filtra os providers Torrentio configurados.
4. Exponhe `/api` em formato Torznab para Prowlarr, Sonarr e Radarr.

## Fontes suportadas

- `stremio`: consulta um addon Torrentio remoto ou local.
- `betor`: consulta `catalogo.betor.top` e converte os itens publicados.
- `database`: le um PostgreSQL com tabelas `torrents` e `files`.

## Inicio rapido

```bash
cp .env.example .env
docker compose up -d --build
```

Depois abra:

- UI: `http://192.168.1.100:9699/`
- Caps: `http://192.168.1.100:9699/api?t=caps`

## Estrutura

- [addon/torznab](/home/matheus/torrentio-torznab-repo/addon/torznab): codigo atual do bridge
- [compose.yml](/home/matheus/torrentio-torznab-repo/compose.yml): stack Docker principal
- [deploy](/home/matheus/torrentio-torznab-repo/deploy): artefatos de deploy por plataforma
- [docs](/home/matheus/torrentio-torznab-repo/docs): instalacao e integracao

## Documentacao

- [INSTALL_DOCKER.md](/home/matheus/torrentio-torznab-repo/docs/INSTALL_DOCKER.md)
- [INSTALL_CASAOS.md](/home/matheus/torrentio-torznab-repo/docs/INSTALL_CASAOS.md)
- [INSTALL_PORTAINER.md](/home/matheus/torrentio-torznab-repo/docs/INSTALL_PORTAINER.md)
- [PROWLARR.md](/home/matheus/torrentio-torznab-repo/docs/PROWLARR.md)

## Aviso legal

Este projeto so adapta e reexpõe metadados de fontes configuradas pelo operador. O operador e responsavel por validar licencas, termos de uso e conformidade das fontes conectadas.
