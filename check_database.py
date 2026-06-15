import sqlite3
import os

db_path = os.path.join('d:/PersonalProject/api', 'task_agent.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("="*50)
print("数据库检查")
print("="*50)
print()

# 检查tasks表
print("[1] tasks表中的任务:")
cursor.execute("SELECT id, content, status FROM tasks")
tasks = cursor.fetchall()
for task in tasks:
    print(f"  ID: {task[0]}")
    print(f"  内容: {task[1]}")
    print(f"  状态: {task[2]}")
    print()

# 检查subtasks表
print("[2] subtasks表中的子任务:")
cursor.execute("SELECT id, task_id, content, completed FROM subtasks")
subtasks = cursor.fetchall()
print(f"总共 {len(subtasks)} 个子任务")
print()
for i, subtask in enumerate(subtasks[:5]):
    print(f"  {i+1}. ID: {subtask[0]}")
    print(f"     task_id: {subtask[1]}")
    print(f"     内容: {subtask[2]}")
    print(f"     completed: {subtask[3]}")
    print()

# 尝试查询特定的子任务
print("[3] 测试查询特定的子任务:")
test_id = "92339d45-777c-4785-97f0-ccc9d7206d4b"
cursor.execute("SELECT * FROM subtasks WHERE id = ?", (test_id,))
result = cursor.fetchone()
if result:
    print(f"✓ 找到子任务: {result}")
else:
    print(f"✗ 未找到子任务: {test_id}")

conn.close()
print()
print("="*50)
