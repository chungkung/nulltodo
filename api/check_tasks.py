import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'tasks.db')

def check_tasks():
    """检查任务数据"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("="*60)
    print("检查任务数据")
    print("="*60)
    
    # 获取所有任务
    cursor.execute('''
        SELECT id, content, status, deadline, created_at, completed_at
        FROM tasks
        ORDER BY created_at DESC
    ''')
    
    tasks = cursor.fetchall()
    print(f"\n共 {len(tasks)} 个任务:\n")
    
    for task in tasks:
        task_id, content, status, deadline, created_at, completed_at = task
        print(f"  ID: {task_id}")
        print(f"  内容: {content}")
        print(f"  状态: {status}")
        print(f"  截止日期: {deadline}")
        print(f"  创建时间: {created_at}")
        print(f"  完成时间: {completed_at}")
        
        # 检查日期格式
        if deadline:
            try:
                dt = datetime.fromisoformat(deadline.replace(' ', 'T') if ' ' in deadline and 'T' not in deadline else deadline)
                print(f"  日期解析成功: {dt}")
            except Exception as e:
                print(f"  ⚠️ 日期解析失败: {e}")
        
        print("  " + "-"*40)
    
    # 检查任务状态
    print("\n状态统计:")
    cursor.execute('SELECT status, COUNT(*) FROM tasks GROUP BY status')
    for status, count in cursor.fetchall():
        print(f"  {status}: {count}")
    
    conn.close()

if __name__ == "__main__":
    check_tasks()
