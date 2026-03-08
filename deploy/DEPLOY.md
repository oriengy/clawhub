# SkillHub 国内部署文档

## 架构概览

```
用户 → Nginx (TLS) → Frontend (SSR, port 3000)
                   → Convex Backend (API/WS, port 3210)
                   → Convex Site (HTTP Actions, port 3211)
                   → Convex Dashboard (管理面板, port 6791)
                          ↓
                    RDS PostgreSQL
```

单机部署，全部服务跑在一台 ECS 上。Nginx 安装在宿主机，其余服务通过 Docker Compose 管理。

## 服务器信息

- **ECS**: 2C4G, Ubuntu 24.04, IP `101.201.213.210`
- **RDS PostgreSQL**: `pgm-2zefwv2d521ud6ei.pg.rds.aliyuncs.com`
- **数据库名**: `skillbook`
- **数据库用户**: `skillbook`

## 域名与端口

| 域名 | 内部端口 | 用途 |
|------|---------|------|
| `skill.ver0.cn` | 3000 | 前端网站 |
| `api.skill.ver0.cn` | 3210 | Convex API (WebSocket + REST) |
| `site.skill.ver0.cn` | 3211 | Convex HTTP Actions (下载、CLI API) |
| `dash.skill.ver0.cn` | 6791 | Convex Dashboard (管理面板，HTTP) |

所有域名 A 记录指向 `101.201.213.210`。

## TLS 证书

- 由 Let's Encrypt 签发，certbot 自动管理
- 证书路径: `/etc/letsencrypt/live/skill.ver0.cn/`
- 自动续期: `certbot.timer` 已启用，每天自动检查
- 覆盖域名: `skill.ver0.cn`, `api.skill.ver0.cn`, `site.skill.ver0.cn`
- `dash.skill.ver0.cn` 目前仅 HTTP（管理员专用，按需添加）

## Convex Admin Key

```
skillbook|013b679d57cd290e2a2ec2dc5d19f61f11cbf5f180f0d7e43cd1cf4231e9db635d7f70c718
```

用于本地部署 Convex 函数和管理后端。

## 文件布局

### 服务器 `/opt/skillhub/`

```
/opt/skillhub/
├── deploy/
│   ├── docker-compose.yml    # Docker 服务编排
│   ├── Dockerfile            # 前端构建镜像
│   ├── .env                  # 环境变量（不入 Git）
│   ├── nginx/                # Docker 版 nginx 配置（未使用）
│   └── init.sh               # 服务器初始化脚本
├── src/                      # 前端源码
├── convex/                   # Convex 后端函数
├── packages/                 # Workspace 包
└── ...
```

### 宿主机 Nginx 配置

```
/etc/nginx/sites-available/skillhub   # 反向代理 + TLS（由 certbot 管理）
```

## 日常运维

### 查看服务状态

```bash
cd /opt/skillhub/deploy
docker compose ps
```

### 查看日志

```bash
docker compose logs backend --tail 50      # Convex 后端
docker compose logs frontend --tail 50     # 前端
docker compose logs dashboard --tail 50    # 管理面板
```

### 重启服务

```bash
docker compose --env-file .env restart backend
docker compose --env-file .env restart frontend
docker compose --env-file .env restart dashboard
```

### 更新前端代码

```bash
# 1. 在服务器上更新代码（rsync 或 git pull）
# 2. 重新构建并启动前端
cd /opt/skillhub/deploy
docker compose --env-file .env up -d --build frontend
```

### 部署 Convex 函数（本地执行）

```bash
export CONVEX_SELF_HOSTED_URL=https://api.skill.ver0.cn
export CONVEX_SELF_HOSTED_ADMIN_KEY='skillbook|013b679d57cd290e2a2ec2dc5d19f61f11cbf5f180f0d7e43cd1cf4231e9db635d7f70c718'
npx convex deploy --typecheck=disable --yes
```

### 设置 Convex 环境变量

```bash
# 例如设置 GitHub OAuth（如果需要管理员登录）
export CONVEX_SELF_HOSTED_URL=https://api.skill.ver0.cn
export CONVEX_SELF_HOSTED_ADMIN_KEY='skillbook|013b679d57cd290e2a2ec2dc5d19f61f11cbf5f180f0d7e43cd1cf4231e9db635d7f70c718'
npx convex env set AUTH_GITHUB_ID=xxx
npx convex env set AUTH_GITHUB_SECRET=xxx
npx convex env set OPENAI_API_KEY=xxx
```

### 手动续期 TLS 证书

```bash
certbot renew --nginx
```

## Docker Compose 环境变量 (.env)

```env
POSTGRES_URL=postgresql://skillbook:<密码URL编码>@pgm-2zefwv2d521ud6ei.pg.rds.aliyuncs.com:5432
CONVEX_CLOUD_ORIGIN=https://api.skill.ver0.cn
CONVEX_SITE_ORIGIN=https://site.skill.ver0.cn
```

注意: `INSTANCE_SECRET` 不需要设置，Convex 后端自动生成并存储在 Docker volume 中。

## 注意事项

1. **Docker Hub 被墙**: 国内 ECS 无法直接拉取 Docker Hub 镜像（nginx、redis 等）。Convex 镜像来自 `ghcr.io`，不受影响。Nginx 改用宿主机直装。
2. **macOS 打包注意**: 从 macOS 打包上传时，需排除 `._*` 文件（macOS 资源文件），否则 vite 构建会报错。
3. **密码特殊字符**: RDS 密码中的 `$` 在 .env 文件中需 URL 编码为 `%24`。
4. **内存监控**: 2C4G 下所有服务运行后约占 1.2-1.5G，有充足余量。如果内存紧张，dashboard 可以停掉（`docker compose stop dashboard`）。
5. **数据持久化**: Convex 数据存在 Docker volume `deploy_convex-data` 和 RDS PostgreSQL 中。Volume 包含本地缓存，可重建；核心数据在 RDS。

## 从零重建

如需在新机器上重新部署:

```bash
# 1. 安装 Docker + Nginx + certbot
apt-get install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx

# 2. 上传代码到 /opt/skillhub

# 3. 配置 .env
cd /opt/skillhub/deploy
cp .env.example .env
# 编辑 .env 填入实际值

# 4. 配置 Nginx（复制 sites-available 配置）

# 5. 启动服务
docker compose --env-file .env up -d --build

# 6. 生成 admin key（首次部署）
docker compose exec backend ./generate_admin_key.sh

# 7. 申请 TLS 证书
certbot --nginx -d skill.ver0.cn -d api.skill.ver0.cn -d site.skill.ver0.cn

# 8. 部署 Convex 函数（本地执行）
export CONVEX_SELF_HOSTED_URL=https://api.skill.ver0.cn
export CONVEX_SELF_HOSTED_ADMIN_KEY='<生成的 admin key>'
npx convex deploy --typecheck=disable --yes
```
