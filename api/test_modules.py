import os
os.environ['PYTHONDONTWRITEBYTECODE'] = '1'
import sys
print("Python 缓存已禁用")

# 先测试一下 analytics_service 模块
print("\n测试 analytics_service 模块...")
try:
    import services.analytics_service
    print("✓ analytics_service 导入成功")
    
    print("\n检查 detect_procrastination_patterns 函数:")
    import inspect
    source = inspect.getsource(services.analytics_service.detect_procrastination_patterns)
    print("函数代码预览:")
    print("\n".join(source.split("\n")[:30]))
    if 'deadline' in source and 'due_date' not in source:
        print("✓ 函数正确使用 deadline 列")
    else:
        print("✗ 函数仍然包含 due_date 或缺少 deadline")
except Exception as e:
    print(f"✗ 导入失败: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)

# 测试 recurring_service
print("\n测试 recurring_service 模块...")
try:
    import services.recurring_service
    print("✓ recurring_service 导入成功")
    
    print("\n检查 generate_tasks_from_recurring 函数:")
    import inspect
    source = inspect.getsource(services.recurring_service.generate_tasks_from_recurring)
    print("函数代码预览:")
    print("\n".join(source.split("\n")[:40]))
    if 'TaskService' in source and 'task_service.create_task' in source:
        print("✓ 函数正确使用 TaskService")
    else:
        print("✗ 函数没有正确使用 TaskService")
except Exception as e:
    print(f"✗ 导入失败: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
