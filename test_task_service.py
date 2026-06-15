import sys
sys.path.insert(0, 'd:/PersonalProject/api')

# 导入app模块
from app import app, get_db

print("="*50)
print("直接测试TaskService")
print("="*50)
print()

# 创建应用上下文
with app.app_context():
    from services.task_service import TaskService
    task_service = TaskService()

    # 测试update_subtask_status
    subtask_id = "92339d45-777c-4785-97f0-ccc9d7206d4b"

    print(f"[1] 测试更新子任务 {subtask_id}:")
    try:
        result = task_service.update_subtask_status(subtask_id, True)
        print(f"结果: {result}")
        if result:
            print("✓ 更新成功")
        else:
            print("✗ 返回None - 子任务未找到")
    except Exception as e:
        print(f"✗ 错误: {e}")
        import traceback
        traceback.print_exc()

    print()

    # 测试update_subtask_status（更新为false）
    print(f"[2] 测试更新子任务为未完成:")
    try:
        result = task_service.update_subtask_status(subtask_id, False)
        print(f"结果: {result}")
        if result:
            print("✓ 更新成功")
        else:
            print("✗ 返回None - 子任务未找到")
    except Exception as e:
        print(f"✗ 错误: {e}")
        import traceback
        traceback.print_exc()

print()
print("="*50)
