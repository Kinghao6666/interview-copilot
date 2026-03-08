"""
Interview Copilot Backend - 快速启动脚本

使用方法：
1. 安装依赖：pip install -r requirements.txt
2. 配置环境变量：cp .env.example .env（然后填写实际值）
3. 运行服务：python run.py
"""

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
