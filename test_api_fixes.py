import requests
import json

BASE_URL = "http://localhost:5000/api"

print("="*60)
print("测试已修复的API端点")
print("="*60 + "\n")

# 1. 测试 /api/analytics/procrastination
print("1. 测试 /api/analytics/procrastination (GET)...")
try:
    response = requests.get(f"{BASE_URL}/analytics/procrastination", timeout=10)
    print(f"   状态码: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ 成功! 响应: {json.dumps(data, indent=4, ensure_ascii=False)[:200]}...")
    else:
        print(f"   ✗ 失败: {response.text}")
except Exception as e:
    print(f"   ✗ 错误: {e}")

print("\n" + "-"*60 + "\n")

# 2. 测试 /api/analytics/insights
print("2. 测试 /api/analytics/insights (GET)...")
try:
    response = requests.get(f"{BASE_URL}/analytics/insights?days=30", timeout=10)
    print(f"   状态码: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ 成功! 响应: {json.dumps(data, indent=4, ensure_ascii=False)[:200]}...")
    else:
        print(f"   ✗ 失败: {response.text}")
except Exception as e:
    print(f"   ✗ 错误: {e}")

print("\n" + "-"*60 + "\n")

# 3. 测试 /api/recurring-tasks/generate
print("3. 测试 /api/recurring-tasks/generate (POST)...")
try:
    response = requests.post(f"{BASE_URL}/recurring-tasks/generate", timeout=10)
    print(f"   状态码: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ 成功! 响应: {json.dumps(data, indent=4, ensure_ascii=False)[:200]}...")
    else:
        print(f"   ✗ 失败: {response.text}")
except Exception as e:
    print(f"   ✗ 错误: {e}")

print("\n" + "="*60)
print("测试完成")
print("="*60)
