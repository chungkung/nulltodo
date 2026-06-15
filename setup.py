import os

print("正在检查Python环境...")
print(f"Python版本: {os.sys.version}")

try:
    import flask
    print(f"Flask版本: {flask.__version__}")
except ImportError:
    print("Flask未安装，正在安装...")
    os.system("pip install flask flask-cors requests")

try:
    import requests
    print(f"Requests版本: {requests.__version__}")
except ImportError:
    print("Requests未安装，正在安装...")
    os.system("pip install requests")

print("\n所有依赖已安装完成！")
print("运行 'python api/app.py' 启动后端服务")
