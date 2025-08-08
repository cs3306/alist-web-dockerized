const express = require('express');
const axios = require('axios');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// 速率限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: 100, // 限制 100 个请求
    message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// 健康检查端点
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 主页路由
app.get('/', (req, res) => {
    res.json({
        service: 'OneDrive OAuth Token Service',
        version: '1.0.0',
        endpoints: {
            token: '/api/token/:tenant',
            refresh: '/api/refresh/:tenant',
            health: '/health'
        }
    });
});

// 获取访问令牌的端点
app.post('/api/token/:tenant', async (req, res) => {
    const tenant = req.params.tenant || 'common';
    
    try {
        console.log(`[${new Date().toISOString()}] Token request for tenant: ${tenant}`);
        
        // 验证必需的参数
        const requiredParams = ['client_id', 'client_secret', 'code', 'redirect_uri'];
        const missingParams = requiredParams.filter(param => !req.body[param]);
        
        if (missingParams.length > 0) {
            return res.status(400).json({
                error: 'missing_parameters',
                error_description: `Missing required parameters: ${missingParams.join(', ')}`
            });
        }
        
        // 构建请求参数
        const tokenParams = new URLSearchParams({
            client_id: req.body.client_id,
            client_secret: req.body.client_secret,
            code: req.body.code,
            redirect_uri: req.body.redirect_uri,
            grant_type: 'authorization_code',
            scope: req.body.scope || 'Files.ReadWrite.All offline_access'
        });
        
        // 请求 Microsoft Token 端点
        const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
        console.log(`Making request to: ${tokenUrl}`);
        
        const response = await axios.post(tokenUrl, tokenParams.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            timeout: 30000 // 30 秒超时
        });
        
        console.log(`[${new Date().toISOString()}] Token obtained successfully`);
        
        // 返回 token 数据
        res.json({
            ...response.data,
            obtained_at: new Date().toISOString()
        });
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error obtaining token:`, error.message);
        
        if (error.response) {
            // Microsoft API 返回的错误
            res.status(error.response.status).json({
                error: error.response.data.error || 'token_error',
                error_description: error.response.data.error_description || 'Failed to obtain token',
                correlation_id: error.response.data.correlation_id
            });
        } else if (error.request) {
            // 网络错误
            res.status(503).json({
                error: 'network_error',
                error_description: 'Unable to reach Microsoft authentication service'
            });
        } else {
            // 其他错误
            res.status(500).json({
                error: 'internal_error',
                error_description: error.message
            });
        }
    }
});

// 刷新访问令牌的端点
app.post('/api/refresh/:tenant', async (req, res) => {
    const tenant = req.params.tenant || 'common';
    
    try {
        console.log(`[${new Date().toISOString()}] Refresh token request for tenant: ${tenant}`);
        
        // 验证必需的参数
        if (!req.body.client_id || !req.body.client_secret || !req.body.refresh_token) {
            return res.status(400).json({
                error: 'missing_parameters',
                error_description: 'Missing required parameters: client_id, client_secret, or refresh_token'
            });
        }
        
        // 构建请求参数
        const refreshParams = new URLSearchParams({
            client_id: req.body.client_id,
            client_secret: req.body.client_secret,
            refresh_token: req.body.refresh_token,
            grant_type: 'refresh_token',
            scope: req.body.scope || 'Files.ReadWrite.All offline_access'
        });
        
        // 请求 Microsoft Token 端点
        const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
        
        const response = await axios.post(tokenUrl, refreshParams.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            timeout: 30000
        });
        
        console.log(`[${new Date().toISOString()}] Token refreshed successfully`);
        
        // 返回新的 token 数据
        res.json({
            ...response.data,
            refreshed_at: new Date().toISOString()
        });
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error refreshing token:`, error.message);
        
        if (error.response) {
            res.status(error.response.status).json({
                error: error.response.data.error || 'refresh_error',
                error_description: error.response.data.error_description || 'Failed to refresh token',
                correlation_id: error.response.data.correlation_id
            });
        } else {
            res.status(500).json({
                error: 'internal_error',
                error_description: error.message
            });
        }
    }
});

// 验证 token 的端点（可选）
app.post('/api/verify', async (req, res) => {
    try {
        const token = req.body.access_token;
        
        if (!token) {
            return res.status(400).json({
                error: 'missing_token',
                error_description: 'Access token is required'
            });
        }
        
        // 使用 token 调用 Microsoft Graph API 来验证
        const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            timeout: 10000
        });
        
        res.json({
            valid: true,
            user: response.data
        });
        
    } catch (error) {
        if (error.response && error.response.status === 401) {
            res.json({
                valid: false,
                error: 'Invalid or expired token'
            });
        } else {
            res.status(500).json({
                error: 'verification_error',
                error_description: 'Unable to verify token'
            });
        }
    }
});

// 404 处理
app.use((req, res) => {
    res.status(404).json({
        error: 'not_found',
        error_description: `Endpoint ${req.path} not found`
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Unhandled error:`, err);
    res.status(500).json({
        error: 'server_error',
        error_description: 'An unexpected error occurred'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`OneDrive OAuth Token Service`);
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log(`===========================================`);
});
