# 使用 Node.js 作为基础镜像
FROM node:18-alpine

# 安装必要的工具
RUN apk add --no-cache nginx supervisor curl

# 创建工作目录
WORKDIR /app

# 复制 package.json
COPY package.json .

# 安装依赖
RUN npm install --production

# 复制应用文件
COPY server.js .
COPY index.html /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf
COPY supervisord.conf /etc/supervisord.conf

# 创建日志目录
RUN mkdir -p /var/log/supervisor

# 暴露端口
EXPOSE 80 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ && curl -f http://localhost:3000/health || exit 1

# 使用 supervisor 启动多个服务
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
