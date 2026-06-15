import requests
import json

# 获取所有任务
r = requests.get('http://localhost:5000/api/tasks')
tasks = r.json()['data']

print(f"任务总数: {len(tasks)}")
print()

for i, task in enumerate(tasks):
    print(f"任务 {i+1}: {task['content'][:30]}...")
    print(f"  状态: {task['status']}")
    print(f"  子任务数: {len(task.get('subtasks', []))}")

    # 测试子任务更新
    if task.get('subtasks'):
        subtask = task['subtasks'][0]
        print(f"  第一个子任务: {subtask['content']}")
        print(f"  子任务ID: {subtask['id']}")

        # 测试更新子任务
        r2 = requests.patch(
            f"http://localhost:5000/api/subtasks/{subtask['id']}",
            json={'completed': not subtask['completed']}
        )
        print(f"  更新状态: {r2.status_code}")
        if r2.status_code == 200:
            print(f"  响应: {r2.json()}")
        else:
            print(f"  错误: {r2.text[:200]}")
        print()
        break

# 测试不存在的子任务
print("测试不存在的子任务:")
r3 = requests.patch(
    'http://localhost:5000/api/subtasks/nonexistent-id',
    json={'completed': True}
)
print(f"状态码: {r3.status_code}")
print(f"响应: {r3.text[:200]}")
