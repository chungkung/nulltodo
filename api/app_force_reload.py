import os
os.environ['PYTHONDONTWRITEBYTECODE'] = '1'

# 重新导入原始的 app.py
import importlib
import sys

# 删除已加载的服务模块
if 'services.analytics_service' in sys.modules:
    del sys.modules['services.analytics_service']
if 'services.recurring_service' in sys.modules:
    del sys.modules['services.recurring_service']
if 'services.template_service' in sys.modules:
    del sys.modules['services.template_service']
if 'services.task_service' in sys.modules:
    del sys.modules['services.task_service']

# 然后导入和运行
import app

if __name__ == '__main__':
    app.init_db()
    print("\n" + "="*50)
    print("  🚀 AI任务管家后端服务启动中 (强制重新加载)...")
    print("  📍 地址: http://localhost:5000")
    print("  📖 API文档: http://localhost:5000/api/health")
    print("="*50 + "\n")
    app.app.run(debug=False, host='0.0.0.0', port=5000)
