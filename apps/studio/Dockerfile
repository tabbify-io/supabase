# To be run in the root of the turbo monorepo
# NOTE: It's highly recommended to use the new builder, Buildkit. https://docs.docker.com/build/buildkit/
## USAGE:
# Build:        docker build . -f apps/studio/Dockerfile --target production -t studio:latest
# Run:          docker run -p 3000:3000 supabase/studio
# Deploy:       docker push supabase/studio:latest
# Clean build:
#    docker builder prune
#    docker build . -f apps/studio/Dockerfile --target production -t studio:latest --no-cache

FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Fixes issues with Sentry CLI and SSL certificates during build
# TODO: Git is added because it's needed to build libpg, remove it once they publish a binary on the S3 bucket
RUN apt-get update -qq && \
  apt-get install -y --no-install-recommends \
  git \
  python3 \ 
  ca-certificates \
  build-essential && \ 
  rm -rf /var/lib/apt/lists/* && \
  update-ca-certificates

RUN npm install -g pnpm@9.15.5

WORKDIR /app

# Prune unneeded dependencies with turbo (from apps/ for example)
FROM base AS turbo
COPY . .

RUN pnpm dlx turbo@2.3.3 prune studio --docker

# Install dev dependencies (only if needed)
FROM base AS deps
COPY --from=turbo /app/out/json ./
COPY --from=turbo /app/out/pnpm-lock.yaml ./

# No need to clean cache because production uses standalone build
RUN pnpm install --frozen-lockfile

# dev contains dependencies and source code not compiled
FROM deps AS dev
COPY --from=turbo /app/out/full ./
ENTRYPOINT ["docker-entrypoint.sh"]
EXPOSE 8082
CMD ["pnpm", "dev:studio"]

# Compile Next.js
FROM dev AS builder

# next build inlines the base path into the bundle, so the value must reach the stage
# that runs the build. Setting it on the final image is too late.
ARG NEXT_PUBLIC_BASE_PATH=""
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH

# Every address the BROWSER will use is inlined here too, for the same reason:
# `next build` bakes `NEXT_PUBLIC_*` into the bundle, and no runtime value can
# move a URL the browser has already downloaded. An arg the stage does not
# declare is dropped SILENTLY by docker — which is how these kept their
# `localhost` defaults from `.env` while the platform was passing the real ones.
ARG NEXT_PUBLIC_SITE_URL=""
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_GOTRUE_URL=""
ENV NEXT_PUBLIC_GOTRUE_URL=$NEXT_PUBLIC_GOTRUE_URL

RUN pnpm --filter studio exec next build

# The standalone tracer carries styled-jsx's entry stub without the dist/
# behind it (the `outputFileTracingIncludes` glob in next.config.js did not
# survive the config composition), so every page render died MODULE_NOT_FOUND
# while /api/* stayed green. Copy the whole package into the traced tree by
# hand — the shell resolves the store-hash directory the tracer names.
# Copy ONLY the styled-jsx package itself: its store dir's node_modules also
# holds SYMLINKS to peer packages (react, @babel/*) whose targets sit outside
# this subtree — `cp -L` over those dies on the first dangling link.
# And styled-jsx's own runtime dependency `client-only` beside it: the store
# dir's sibling symlink was (rightly) skipped by the narrow copy above, and
# whether the tracer hoists its own copy varies build to build — one rebuild
# rendered pages, the next died `Cannot find module 'client-only'`. Copying it
# as a sibling makes resolution deterministic: styled-jsx's require walks up
# into this exact node_modules first.
RUN set -eux; \
    for dir in /app/node_modules/.pnpm/styled-jsx@*; do \
        dest="/app/apps/studio/.next/standalone/node_modules/.pnpm/$(basename "$dir")/node_modules"; \
        mkdir -p "$dest"; \
        cp -rL "$dir/node_modules/styled-jsx" "$dest/"; \
        for dep in /app/node_modules/.pnpm/client-only@*; do \
            rm -rf "$dest/client-only"; \
            cp -rL "$dep/node_modules/client-only" "$dest/"; \
        done; \
    done

# Copy only compiled code and dependencies
FROM base AS production
COPY --from=builder /app/apps/studio/public ./apps/studio/public
COPY --from=builder /app/apps/studio/.next/standalone ./
COPY --from=builder /app/apps/studio/.next/static ./apps/studio/.next/static
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
HEALTHCHECK --interval=5s --timeout=5s --retries=3 CMD node -e "fetch('http://localhost:3000/api/platform/profile').then((r) => {if (r.status !== 200) throw new Error(r.status)})"
CMD ["node", "apps/studio/server.js"]
