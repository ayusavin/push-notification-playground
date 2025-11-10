# Stage 1: Cache dependencies
FROM denoland/deno:1.46.3 AS deps

WORKDIR /app

# Set Deno cache directory to a known location
ENV DENO_DIR=/deno-dir

# Copy dependency files
COPY deno.json deno.lock ./
COPY src/ ./src/

# Cache dependencies - this downloads and caches all imports
RUN deno cache --unstable-kv src/main.ts

# Stage 2: Runtime with distroless image
FROM denoland/deno:distroless-1.46.3

WORKDIR /app

# Set default port and Deno cache directory
ENV PORT=8000
ENV DENO_DIR=/deno-dir

# Copy cached dependencies from deps stage
COPY --from=deps /deno-dir /deno-dir

# Copy source files
COPY deno.json deno.lock ./
COPY src/ ./src/

CMD ["run", "-A", "--unstable-kv", "src/main.ts"]
