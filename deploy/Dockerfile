# SkillHub 前端构建镜像
# 多阶段构建：安装依赖 → 构建 → 最小运行镜像

# 阶段1: 安装依赖并构建
FROM oven/bun:1 AS builder
WORKDIR /app

# 先拷贝依赖文件，利用 Docker 缓存
COPY package.json bun.lock ./
COPY packages/schema/package.json packages/schema/
COPY packages/clawdhub/package.json packages/clawdhub/
RUN bun install --frozen-lockfile

# 拷贝源码
COPY . .

# 构建时注入环境变量
ARG VITE_CONVEX_URL
ARG VITE_CONVEX_SITE_URL
ARG VITE_SITE_MODE=skills
ENV VITE_CONVEX_URL=$VITE_CONVEX_URL
ENV VITE_CONVEX_SITE_URL=$VITE_CONVEX_SITE_URL
ENV VITE_SITE_MODE=$VITE_SITE_MODE

# 构建 workspace 包 + 前端
RUN bun run --filter 'clawhub-schema' build 2>/dev/null || true
RUN bun run build

# 阶段2: 精简运行镜像
FROM oven/bun:1-slim
WORKDIR /app

# 只拷贝构建产物
COPY --from=builder /app/.output .output
COPY --from=builder /app/public public

ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", ".output/server/index.mjs"]
