# Torznab Bridge

O **Torznab Bridge** transforma resultados de fontes compatíveis em uma API Torznab que pode ser adicionada ao **Prowlarr**, **Sonarr** e **Radarr**.

A configuração é feita por uma Web UI simples, onde você escolhe os **indexadores** e os **providers** que deseja utilizar.

## Instalação

Escolha apenas uma das opções abaixo:

### CasaOS

1. Abra o CasaOS.
2. Clique no botão `+`.
3. Clique em `Adicionar um aplicativo personalizado`.
4. Selecione `Importar`.
5. Cole o conteúdo de [deploy/casaos/docker-compose.yml](/home/matheus/torrentio-torznab-repo/deploy/casaos/docker-compose.yml).
6. Clique em `Instalar`.

### Portainer

1. Abra o Portainer.
2. Acesse `Stacks`.
3. Clique em `Add stack`.
4. Use o nome `torznab-bridge`.
5. Cole o conteúdo de [deploy/portainer/docker-compose.yml](/home/matheus/torrentio-torznab-repo/deploy/portainer/docker-compose.yml).
6. Clique em `Deploy the stack`.

### Docker Compose

```bash
cd /home/matheus/torrentio-torznab-repo
cp .env.example .env
docker compose pull
docker compose up -d
```

## Configuração inicial

1. Abra `http://IP_DO_SERVIDOR:9699/`.
2. Selecione os indexadores desejados.
3. Ajuste os providers do Stremio/Torrentio.
4. Clique em `Salvar configuração`.

## Adicionar ao Prowlarr

1. Abra o Prowlarr.
2. Vá em `Indexers`.
3. Clique em `Add Indexer`.
4. Procure por `Generic Torznab`.
5. Preencha:

| Campo | Valor |
|---|---|
| Name | `Torznab Bridge` |
| Base URL | `http://IP_DO_SERVIDOR:9699` |
| API Path | `/api` |
| API Key | deixe vazio, exceto se você configurou uma chave |

6. Clique em `Save`.

## O que melhorou nesta versão

- o status do **Stremio** e do **BeTor** é monitorado separadamente
- falhas temporárias do **BeTor** não derrubam o serviço inteiro
- o bridge continua entregando resultados do **Stremio** mesmo com BeTor indisponível
- a Web UI agora mostra o estado de cada indexador e os 10 eventos mais recentes
- a imagem Docker passa a ser publicada no **GHCR**

## Aviso legal

Este projeto apenas adapta e reexpõe metadados fornecidos pelas fontes configuradas pelo usuário.

O usuário é responsável por verificar as licenças, os termos de uso e a legislação aplicável às fontes, aos indexadores e aos conteúdos acessados.

Este projeto não hospeda arquivos, não armazena conteúdos protegidos e não controla os resultados fornecidos por serviços de terceiros.

Consulte também:

- [Licença do projeto](/home/matheus/torrentio-torznab-repo/LICENSE)
- [Avisos e atribuições de terceiros](/home/matheus/torrentio-torznab-repo/THIRD_PARTY_NOTICES.md)
