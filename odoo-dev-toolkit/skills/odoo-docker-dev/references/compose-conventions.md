# Docker Compose Conventions

The reference `docker-compose.yml` pattern used by this toolkit, based on the Elite project. Use this as the template when a project has no compose file yet, or as a reading guide when adapting to an existing one.

## Reference file (Elite project)

```yaml
services:
  web:
    container_name: elite-arena-web
    image: varyshop/sidonio:release-1.0.6
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "${WEB_HTTP_PORT:-8172}:8069"
      - "${WEB_LONGPOLL_PORT:-8173}:8072"
    environment:
      - HOST=db
      - USER=varyshop
      - PASSWORD=varyshop
    command: >
      python3 odoo-bin
      --addons-path="addons,varyshop,/app/elite_themes"
      --db_host=db
      --db_user=varyshop
      --db_password=varyshop
      --db-filter=^elite$
      --dev=xml,qweb,reload
      --log-level=info
    volumes:
      - ./:/app/elite_themes
      - odoo-web-data:/var/lib/odoo
    restart: unless-stopped

  db:
    container_name: elite-arena-db
    image: postgres:15
    environment:
      - POSTGRES_USER=varyshop
      - POSTGRES_PASSWORD=varyshop
      - POSTGRES_DB=postgres
    volumes:
      - odoo-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U varyshop"]
      interval: 5s
      timeout: 5s
      retries: 10
    restart: unless-stopped

volumes:
  odoo-web-data:
  odoo-db-data:
```

## Key patterns

### Service names

- **`web`** — the Odoo container. Always this name in the Elite toolkit — shell aliases and Makefile targets assume it.
- **`db`** — the PostgreSQL container.

If an existing project uses different names (e.g. `odoo`/`postgres`), read them from `docker-compose.yml` first and substitute in every command.

### Container names

The `container_name:` field gives a stable name independent of the Compose project prefix. Useful for `docker logs <name>` or connecting from other tools. Prefix with the brand: `elite-arena-web`, `elite-arena-db`.

### Image

Use a pinned tag, NEVER `latest`:

```yaml
image: varyshop/sidonio:release-1.0.6
```

`varyshop/sidonio` is the house Odoo 18 image. It includes the standard addons plus `varyshop/` custom modules mounted from the image. The `release-X.Y.Z` tag is immutable — upgrades go through a bumped tag, not `latest`.

### Addons path

```yaml
command: >
  python3 odoo-bin
  --addons-path="addons,varyshop,/app/elite_themes"
```

Three directories, searched in order:

1. **`addons`** — Odoo core modules baked into the image at `/app/addons`.
2. **`varyshop`** — custom shared modules baked into the image at `/app/varyshop`.
3. **`/app/elite_themes`** — the bind-mounted project root. This is where the user's custom themes and modules live. Anything you `git clone` or create at the host's project root is immediately visible here.

### The magic volume mount

```yaml
volumes:
  - ./:/app/elite_themes
```

The host's current directory (project root) is mounted into the container at `/app/elite_themes`, which is part of the addons path. Consequences:

- Any file you edit on the host is immediately visible in the container — no rebuild, no restart.
- Creating a new module folder at the host root makes it visible to Odoo on the next `-u <module>` or restart.
- Deleting a file on the host removes it inside the container.

This is the single most important convention. It means development workflow is: edit locally → upgrade module → reload browser. No image builds.

### Database filter

```yaml
--db-filter=^elite$
```

Restricts Odoo to serving exactly one database (`elite`). Without this, Odoo shows the database selector on login. With it, the selector is skipped and all requests go to the named database.

The filter is a regex — `^elite$` matches only "elite". For multi-database setups, use `^elite_.*$` to match "elite_dev", "elite_staging", etc.

### Dev flags

```yaml
--dev=xml,qweb,reload
```

Three dev-mode features enabled:

- **`xml`** — re-read XML view definitions on every request (no restart needed to see view changes)
- **`qweb`** — re-read QWeb template files on every request
- **`reload`** — auto-restart Odoo when Python files change (uses the `watchdog` package)

Turn these OFF in production — they are significant performance penalties and they expose internal state.

### Ports

```yaml
ports:
  - "${WEB_HTTP_PORT:-8172}:8069"
  - "${WEB_LONGPOLL_PORT:-8173}:8072"
```

- **8069** — Odoo HTTP port (the web UI). Mapped to host `8172` so it doesn't collide with other Odoo instances on port 8069.
- **8072** — Odoo longpolling port (for Discuss / bus notifications). Mapped to host `8173`.

The `${VAR:-default}` syntax reads from `.env` if set, otherwise uses the default. This makes it easy to run multiple Elite-based projects side by side by giving each one a different port in its own `.env`.

### Environment variables

```yaml
environment:
  - HOST=db
  - USER=varyshop
  - PASSWORD=varyshop
```

These are the defaults the Odoo image looks for. They're also overridden by the `--db_*` command-line args, which take precedence. Keeping both is belt-and-suspenders and makes it easy to shell into the container and use psql without re-typing credentials.

### Health check on db

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U varyshop"]
  interval: 5s
  timeout: 5s
  retries: 10
```

Combined with `depends_on: { db: { condition: service_healthy } }`, this prevents the web container from starting until Postgres actually accepts connections. Without the health check, web races postgres on first startup and crashes with connection errors.

### Volumes

```yaml
volumes:
  - odoo-web-data:/var/lib/odoo       # filestore (attachments, user uploads)
  - odoo-db-data:/var/lib/postgresql/data   # postgres data
```

Two named volumes persist across `docker compose down` / `up`:

- **`odoo-web-data`** — filestore for `ir.attachment` binary data, uploaded images, exported reports
- **`odoo-db-data`** — Postgres's data directory

To reset everything (throw away the database AND the filestore):

```bash
docker compose down -v
```

The `-v` removes named volumes. Without it, volumes survive and the next `up` restores state.

## .env file

Alongside `docker-compose.yml`, keep a `.env` for overrideable values:

```bash
# .env
WEB_HTTP_PORT=8172
WEB_LONGPOLL_PORT=8173
COMPOSE_PROJECT_NAME=elite-arena
```

`COMPOSE_PROJECT_NAME` prefixes container and volume names so multiple projects don't collide. Without it, Compose uses the current directory name.

**Never commit `.env`** — add it to `.gitignore`. Commit `.env.example` with placeholder values instead.

## Reading an existing compose file

When the project already has `docker-compose.yml`, extract these values before running any command:

```bash
cat docker-compose.yml
```

Look for:

| What | Where | Used in commands |
|---|---|---|
| Service name for Odoo | `services:` top key (usually `web`) | `docker compose exec <service>` |
| Service name for Postgres | `services:` top key (usually `db`) | `docker compose exec <db_service>` |
| Addons path | `command:` → `--addons-path=...` | Where to place custom modules |
| Mounted project dir | `volumes:` → `./:/app/...` | Where the host root appears inside the container |
| Database name | `--db-filter=...` or a `-d` argument | Every `odoo -u/-i/-d` command |
| Postgres user | `POSTGRES_USER=...` or `--db_user=...` | `psql -U <user>` |
| HTTP port mapping | `ports:` first mapping | Browser URL |

Save the extracted values to a scratch file or paste them into your mental model before issuing commands. Misreading the db name or service name will cause confusing errors (module appears to install, but the UI still shows the old state — because you upgraded a different database).

## When the project has NO compose file

If the user is starting fresh, copy the reference file above, adjust:

1. `container_name:` — prefix with project name (`<brand>-web`, `<brand>-db`)
2. `image:` — confirm it's the right Odoo version tag
3. `--db-filter=^<dbname>$` — pick a database name
4. `ports:` — pick a free host port
5. `volumes: ./:/app/<brand>_themes` — rename the mount path if you prefer

Commit the file, create `.env` with the port overrides, run `docker compose up -d`, and the stack is live.
