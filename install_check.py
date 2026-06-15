#!/usr/bin/env python3
import subprocess
import sys
import os

def run_command(cmd, description):
    """运行命令并返回结果"""
    print(f"\n{'='*50}")
    print(f"  {description}")
    print(f"{'='*50}")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✓ 成功")
            if result.stdout:
                print(result.stdout.strip())
            return True
        else:
            print(f"✗ 失败")
            if result.stderr:
                print(result.stderr.strip())
            return False
    except Exception as e:
        print(f"✗ 错误: {e}")
        return False

def check_command(cmd):
    """检查命令是否存在"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.returncode == 0
    except:
        return False

def main():
    print("\n" + "="*50)
    print("  AI任务管家 - 依赖检查与安装")
    print("="*50 + "\n")

    # 检查Node.js
    print("[1/4] 检查 Node.js...")
    if check_command("node --version"):
        result = subprocess.run("node --version", shell=True, capture_output=True, text=True)
        print(f"✓ Node.js 已安装: {result.stdout.strip()}")
        node_ok = True
    else:
        print("✗ Node.js 未安装")
        print("  请访问 https://nodejs.org/ 下载安装")
        node_ok = False

    # 检查Python
    print("\n[2/4] 检查 Python...")
    if check_command("python --version"):
        result = subprocess.run("python --version", shell=True, capture_output=True, text=True)
        print(f"✓ Python 已安装: {result.stdout.strip()}")
        python_ok = True
    else:
        print("✗ Python 未安装")
        print("  请访问 https://www.python.org/downloads/ 下载安装")
        python_ok = False

    # 检查pip
    print("\n[3/4] 检查 pip...")
    if check_command("pip --version"):
        result = subprocess.run("pip --version", shell=True, capture_output=True, text=True)
        print(f"✓ pip 已安装")
        pip_ok = True
    else:
        print("✗ pip 未安装")
        pip_ok = False

    # 安装依赖
    print("\n[4/4] 安装项目依赖...")
    print("-" * 50)

    if node_ok:
        print("\n安装前端依赖 (npm install)...")
        if run_command("npm install", "npm install"):
            print("✓ 前端依赖安装完成")
        else:
            print("✗ npm install 失败")
    else:
        print("\n⚠ 跳过前端安装 (需要Node.js)")

    if pip_ok:
        print("\n安装后端依赖 (pip install)...")
        deps = ["flask", "flask-cors", "requests"]
        for dep in deps:
            run_command(f"pip install {dep}", f"安装 {dep}")
        print("✓ 后端依赖安装完成")
    else:
        print("\n⚠ 跳过后端安装 (需要pip)")

    # 总结
    print("\n" + "="*50)
    print("  安装结果")
    print("="*50)

    if node_ok and python_ok and pip_ok:
        print("\n✓ 所有依赖安装完成！")
        print("\n启动方式:")
        print("  后端: python api\\app.py")
        print("  前端: npm run dev")
        print("  访问: http://localhost:3000")
    else:
        print("\n⚠ 部分依赖未安装")
        print("\n请手动安装缺失的依赖后重新运行此脚本")

    print("\n" + "="*50)

if __name__ == "__main__":
    main()
    input("\n按Enter键退出...")
