import os
os.environ['PYTHONDONTWRITEBYTECODE'] = '1'
import sys

print("清除已导入模块...")
for key in list(sys.modules.keys()):
    if key.startswith('services') or key == 'app':
        del sys.modules[key]
    if key.startswith('api.services'):
        del sys.modules[key]

print("\n正在重新导入服务...")
import app

print("\n测试 analytics_service.detect_procrastination_patterns:")
try:
    # 直接调用服务
    result = app.analytics_service.detect_procrastination_patterns()
    print(f"✓ 成功! 结果: {result}")
except Exception as e:
    print(f"✗ 错误: {e}")
    import traceback
    traceback.print_exc()

print("\n测试 recurring_service.generate_tasks_from_recurring:")
try:
    # 直接调用服务
    result = app.recurring_service.generate_tasks_from_recurring()
    print(f"✓ 成功! 结果: {result}")
except Exception as e:
    print(f"✗ 错误: {e}")
    import traceback
    traceback.print_exc()

print("\n测试完成!")
