# OneDrive OAuth Token Service / OneDrive OAuth 令牌服务

[English](#english) | [中文](#中文)

---

## English

A fully self-hosted OneDrive OAuth callback service that helps you obtain refresh tokens securely. No external dependencies required - everything runs on your own server.

### ✨ Features

- 🚀 **One-click deployment** - Easy setup with Docker
- 🔒 **Fully self-hosted** - All data processing happens on your server
- 🎨 **Beautiful web interface** - User-friendly design
- 🔧 **Built-in API server** - Direct OAuth flow handling
- 📦 **Lightweight** - Based on Alpine Linux
- 🔄 **Auto-update support** - Compatible with Watchtower
- 🌐 **Reverse proxy ready** - Works with Nginx/Traefik
- ⚡ **Multi-service architecture** - Managed by Supervisor

### 🏗️ Architecture

This image contains two main services:
- **Nginx** (Port 80) - Serves the web interface
- **Node.js API** (Port 3000) - Handles OAuth token exchange

Both services are managed by Supervisor for stability.

### 📋 Prerequisites

1. **Azure App Registration**
   - Go to [Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
   - Create a new app registration
   - Add your redirect URI: `http://your-domain.com/` 
   - Create a client secret
   - Note down your Client ID and Client Secret

2. **Docker Environment**
   - Docker installed on your server
   - Docker Compose (optional)
   - Available ports: 80 and 3000 (or custom)

### 🚀 Quick Start

#### Method 1: Docker Run

```bash
# Pull the image
docker pull yourusername/onedrive-oauth:latest

# Run the container
docker run -d \
  --name onedrive-oauth \
  -p 8080:80 \
  -p 3000:3000 \
  -e TZ=Asia/Shanghai \
  --restart unless-stopped \
  yourusername/onedrive-oauth:latest
```

#### Method 2: Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  onedrive-oauth:
    image: yourusername/onedrive-oauth:latest
    container_name: onedrive-oauth
    restart: unless-stopped
    ports:
      - "8080:80"      # Web interface
      - "3000:3000"    # API service
    environment:
      - TZ=Asia/Shanghai
      - NODE_ENV=production
    volumes:
      - ./logs:/var/log
```

Start the service:

```bash
docker-compose up -d
```

Access the service:
- Web Interface: `http://localhost:8080`
- API Endpoint: `http://localhost:3000`

### 🔧 Nginx Reverse Proxy Configuration

For production deployment with domain:

```nginx
server {
    listen 80;
    server_name oauth.yourdomain.com;

    # Web interface
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

### 📡 API Endpoints

#### Get Access Token
```bash
POST /api/token/{tenant}
Content-Type: application/json

{
  "client_id": "your-client-id",
  "client_secret": "your-client-secret",
  "code": "authorization-code",
  "redirect_uri": "your-redirect-uri",
  "scope": "Files.ReadWrite.All offline_access"
}
```

#### Refresh Token
```bash
POST /api/refresh/{tenant}
Content-Type: application/json

{
  "client_id": "your-client-id",
  "client_secret": "your-client-secret",
  "refresh_token": "your-refresh-token"
}
```

#### Health Check
```bash
GET /health
```

### 🔨 Build Your Own Image

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/onedrive-oauth
cd onedrive-oauth
```

2. **Required files**
   - `index.html` - Web interface
   - `server.js` - Node.js API server
   - `package.json` - Node.js dependencies
   - `Dockerfile` - Docker build configuration
   - `nginx.conf` - Nginx configuration
   - `default.conf` - Nginx site configuration
   - `supervisord.conf` - Process manager configuration

3. **Build and push**
```bash
# Build the image
docker build -t yourusername/onedrive-oauth:latest .

# Push to Docker Hub
docker push yourusername/onedrive-oauth:latest
```

### 🛠️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TZ` | `UTC` | Timezone |
| `NODE_ENV` | `production` | Node.js environment |
| `PORT` | `3000` | API service port |

### 🐛 Troubleshooting

#### Container won't start
```bash
# Check logs
docker logs onedrive-oauth

# Check supervisor logs
docker exec onedrive-oauth cat /var/log/supervisor/supervisord.log
```

#### API service not accessible
```bash
# Check Node.js service status
docker exec onedrive-oauth supervisorctl status node-api

# View Node.js logs
docker exec onedrive-oauth tail -f /var/log/supervisor/node.stdout.log

# Restart API service
docker exec onedrive-oauth supervisorctl restart node-api
```

#### Token acquisition failed
1. Verify Azure app configuration
2. Check network connectivity
3. Review detailed error logs

### 🔒 Security Recommendations

1. **Use HTTPS** - Always use SSL certificates in production
2. **Restrict access** - Configure IP whitelisting or basic auth
3. **Regular updates** - Keep the image and dependencies updated
4. **Monitor logs** - Regularly check access and error logs
5. **Rate limiting** - Built-in rate limiting (100 requests per 15 minutes)

### 📄 License

MIT License

### 🤝 Contributing

Issues and Pull Requests are welcome!

---

## 中文

一个完全自托管的 OneDrive OAuth 回调服务，帮助您安全地获取刷新令牌。无需外部依赖 - 所有服务都在您自己的服务器上运行。

### ✨ 特性

- 🚀 **一键部署** - 使用 Docker 轻松安装
- 🔒 **完全自托管** - 所有数据处理都在您的服务器上进行
- 🎨 **精美的 Web 界面** - 用户友好的设计
- 🔧 **内置 API 服务器** - 直接处理 OAuth 流程
- 📦 **轻量级** - 基于 Alpine Linux
- 🔄 **支持自动更新** - 兼容 Watchtower
- 🌐 **支持反向代理** - 可与 Nginx/Traefik 配合使用
- ⚡ **多服务架构** - 由 Supervisor 管理

### 🏗️ 架构说明

此镜像包含两个主要服务：
- **Nginx**（端口 80）- 提供 Web 界面
- **Node.js API**（端口 3000）- 处理 OAuth 令牌交换

两个服务由 Supervisor 统一管理以确保稳定性。

### 📋 前置要求

1. **Azure 应用注册**
   - 访问 [Azure 门户](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
   - 创建新的应用注册
   - 添加重定向 URI：`http://your-domain.com/`
   - 创建客户端密码
   - 记下您的客户端 ID 和客户端密码

2. **Docker 环境**
   - 服务器上已安装 Docker
   - Docker Compose（可选）
   - 可用端口：80 和 3000（或自定义）

### 🚀 快速开始

#### 方法 1：Docker Run

```bash
# 拉取镜像
docker pull yourusername/onedrive-oauth:latest

# 运行容器
docker run -d \
  --name onedrive-oauth \
  -p 8080:80 \
  -p 3000:3000 \
  -e TZ=Asia/Shanghai \
  --restart unless-stopped \
  yourusername/onedrive-oauth:latest
```

#### 方法 2：Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  onedrive-oauth:
    image: yourusername/onedrive-oauth:latest
    container_name: onedrive-oauth
    restart: unless-stopped
    ports:
      - "8080:80"      # Web 界面
      - "3000:3000"    # API 服务
    environment:
      - TZ=Asia/Shanghai
      - NODE_ENV=production
    volumes:
      - ./logs:/var/log
```

启动服务：

```bash
docker-compose up -d
```

访问服务：
- Web 界面：`http://localhost:8080`
- API 端点：`http://localhost:3000`

### 🔧 Nginx 反向代理配置

用于生产环境的域名部署：

```nginx
server {
    listen 80;
    server_name oauth.yourdomain.com;

    # Web 界面
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

### 📡 API 端点

#### 获取访问令牌
```bash
POST /api/token/{tenant}
Content-Type: application/json

{
  "client_id": "你的客户端ID",
  "client_secret": "你的客户端密码",
  "code": "授权码",
  "redirect_uri": "你的重定向URI",
  "scope": "Files.ReadWrite.All offline_access"
}
```

#### 刷新令牌
```bash
POST /api/refresh/{tenant}
Content-Type: application/json

{
  "client_id": "你的客户端ID",
  "client_secret": "你的客户端密码",
  "refresh_token": "你的刷新令牌"
}
```

#### 健康检查
```bash
GET /health
```

### 🔨 构建自己的镜像

1. **克隆仓库**
```bash
git clone https://github.com/yourusername/onedrive-oauth
cd onedrive-oauth
```

2. **必需文件**
   - `index.html` - Web 界面
   - `server.js` - Node.js API 服务器
   - `package.json` - Node.js 依赖
   - `Dockerfile` - Docker 构建配置
   - `nginx.conf` - Nginx 配置
   - `default.conf` - Nginx 站点配置
   - `supervisord.conf` - 进程管理器配置

3. **构建并推送**
```bash
# 构建镜像
docker build -t yourusername/onedrive-oauth:latest .

# 推送到 Docker Hub
docker push yourusername/onedrive-oauth:latest
```

### 🛠️ 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `TZ` | `UTC` | 时区 |
| `NODE_ENV` | `production` | Node.js 环境 |
| `PORT` | `3000` | API 服务端口 |

### 🐛 故障排查

#### 容器无法启动
```bash
# 查看日志
docker logs onedrive-oauth

# 查看 supervisor 日志
docker exec onedrive-oauth cat /var/log/supervisor/supervisord.log
```

#### API 服务无法访问
```bash
# 检查 Node.js 服务状态
docker exec onedrive-oauth supervisorctl status node-api

# 查看 Node.js 日志
docker exec onedrive-oauth tail -f /var/log/supervisor/node.stdout.log

# 重启 API 服务
docker exec onedrive-oauth supervisorctl restart node-api
```

#### 令牌获取失败
1. 验证 Azure 应用配置
2. 检查网络连接
3. 查看详细错误日志

### 🔒 安全建议

1. **使用 HTTPS** - 生产环境始终使用 SSL 证书
2. **限制访问** - 配置 IP 白名单或基本认证
3. **定期更新** - 保持镜像和依赖项更新
4. **监控日志** - 定期检查访问和错误日志
5. **速率限制** - 内置速率限制（每 15 分钟 100 个请求）

### 📄 许可证

MIT 许可证

### 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📊 Comparison / 对比

| Feature / 特性 | This Solution / 本方案 | Other Solutions / 其他方案 |
|----------------|------------------------|----------------------------|
| External Dependencies / 外部依赖 | ❌ None / 无 | ✅ Cloudflare Worker, etc. |
| Data Privacy / 数据隐私 | ✅ Full control / 完全控制 | ⚠️ Through third parties / 经过第三方 |
| Deployment Complexity / 部署复杂度 | ✅ One-click / 一键部署 | ⚠️ Multiple steps / 多步骤 |
| Maintenance / 维护 | ✅ Single container / 单容器 | ⚠️ Multiple services / 多个服务 |
| Cost / 成本 | ✅ Self-hosted only / 仅自托管成本 | ⚠️ May need paid services / 可能需要付费服务 |

## 🔗 Related Links / 相关链接

- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/)
- [Azure App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Reverse Proxy Guide](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)

## 📝 Changelog / 更新日志

### v2.0.0 (2024-01-XX)
- 🎉 Complete rewrite with self-hosted API server / 使用自托管 API 服务器完全重写
- 🚀 No external dependencies required / 无需外部依赖
- 🔧 Multi-service architecture with Supervisor / 使用 Supervisor 的多服务架构
- 📊 Enhanced logging and error handling / 增强的日志记录和错误处理
- 🔒 Built-in rate limiting / 内置速率限制

### v1.0.0 (2024-01-01)
- Initial release / 初始版本
- Basic OAuth flow support / 基本 OAuth 流程支持
- Web interface / Web 界面
- Docker containerization / Docker 容器化

---

**⚠️ Important Notice / 重要提示**

This service is completely self-hosted and does not rely on any external proxy services like Cloudflare Worker. All OAuth token exchanges are processed directly on your server, ensuring maximum privacy and control over your data.

此服务完全自托管，不依赖任何外部代理服务（如 Cloudflare Worker）。所有 OAuth 令牌交换都直接在您的服务器上处理，确保对您的数据拥有最大的隐私和控制权。

---

Made with ❤️ for the self-hosting community / 为自托管社区用心打造
