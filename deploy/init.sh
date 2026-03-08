#!/bin/bash
# SkillHub 服务器初始化脚本
# 用法: bash init.sh
set -euo pipefail

echo "=== SkillHub 服务器初始化 ==="

# 1. 安装 Docker (如果未安装)
if ! command -v docker &> /dev/null; then
    echo "[1/5] 安装 Docker..."
    curl -fsSL https://get.docker.com | bash
    systemctl enable docker && systemctl start docker
else
    echo "[1/5] Docker 已安装，跳过"
fi

# 2. 安装 Docker Compose 插件 (如果未安装)
if ! docker compose version &> /dev/null; then
    echo "[2/5] 安装 Docker Compose 插件..."
    apt-get update && apt-get install -y docker-compose-plugin
else
    echo "[2/5] Docker Compose 已安装，跳过"
fi

# 3. 安装 certbot (SSL 证书)
if ! command -v certbot &> /dev/null; then
    echo "[3/5] 安装 certbot..."
    apt-get update && apt-get install -y certbot
else
    echo "[3/5] certbot 已安装，跳过"
fi

# 4. 创建必要目录
echo "[4/5] 创建目录..."
mkdir -p /var/www/certbot
mkdir -p /etc/letsencrypt

# 5. 检查 .env 文件
if [ ! -f .env ]; then
    echo "[5/5] 请先创建 .env 文件"
    echo "  cp .env.example .env"
    echo "  vim .env  # 填入实际配置"
    exit 1
else
    echo "[5/5] .env 文件已存在"
fi

echo ""
echo "=== 初始化完成 ==="
echo ""
echo "下一步:"
echo "  1. 确认 .env 配置正确"
echo "  2. 启动服务: docker compose --env-file .env up -d --build"
echo "  3. 生成 admin key: docker compose exec backend ./generate_admin_key.sh"
echo "  4. 本地部署 Convex 函数:"
echo "     export CONVEX_SELF_HOSTED_URL=http://api.skillhub.ver0.cn"
echo "     export CONVEX_SELF_HOSTED_ADMIN_KEY=<上一步生成的key>"
echo "     npx convex deploy"
