#!/usr/bin/env python3
import requests
import json

def test_api():
    print("="*50)
    print("AI任务管家 - API测试")
    print("="*50)
    print()

    base_url = 'http://localhost:5000/api'

    # 测试健康检查
    print("[1] 健康检查...")
    r = requests.get(f'{base_url}/health')
    print(f"状态码: {r.status_code}")
    if r.status_code == 200:
        print("✓ 健康检查通过")
    else:
        print(f"✗ 健康检查失败: {r.text}")
        return
    print()

    # 获取所有路由
    print("[2] 可用API路由:")
    routes = [
        '/tasks',
        '/settings',
        '/review/weekly',
        '/schedule',
        '/subtasks/test-id'
    ]
    for route in routes:
        r = requests.get(f'{base_url}{route}')
        status = "✓" if r.status_code in [200, 404, 500] else "✗"
        print(f"  {status} {route} - {r.status_code}")
    print()

    # 测试子任务PATCH
    print("[3] 测试子任务API (PATCH)...")
    r = requests.patch(f'{base_url}/subtasks/test-id', json={'completed': True})
    print(f"状态码: {r.status_code}")
    print(f"响应: {r.text}")
    print()

    # 测试任务列表
    print("[4] 测试获取任务列表...")
    r = requests.get(f'{base_url}/tasks')
    print(f"状态码: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        tasks = data.get('data', [])
        print(f"✓ 成功获取 {len(tasks)} 个任务")
    else:
        print(f"✗ 获取任务失败: {r.text}")
    print()

    print("="*50)
    print("测试完成")
    print("="*50)

if __name__ == '__main__':
    try:
        test_api()
    except Exception as e:
        print(f"\n✗ 测试失败: {e}")
