import os
os.environ['PYTHONDONTWRITEBYTECODE'] = '1'

print("="*70)
print("1. 首先，我们查看当前目录...")
print(os.getcwd())

print("\n2. 查看 api/services 目录下的内容...")
import glob
print(glob.glob(os.path.join(os.path.dirname(__file__), "services", "*.py")))

print("\n3. 读取 analytics_service.py 的文件内容...")
with open(os.path.join(os.path.dirname(__file__), "services", "analytics_service.py"), "r", encoding="utf-8") as f:
    content = f.read()
    print("前 300 个字符:")
    print(repr(content[:300]))
    print("\ndue_date 出现的次数:", content.count('due_date'))
    print("deadline 出现的次数:", content.count('deadline'))

print("\n4. 读取 recurring_service.py 的内容...")
with open(os.path.join(os.path.dirname(__file__), "services", "recurring_service.py"), "r", encoding="utf-8") as f:
    content = f.read()
    print("前 300 个字符:")
    print(repr(content[:300]))
    print("\ncreate_task 出现的次数:", content.count('create_task'))
    print("TaskService 出现的次数:", content.count('TaskService'))

print("\n5. 现在让我们看看是否有另一个 services 目录...")
print(os.listdir(os.path.dirname(__file__)))
print("\n在上级目录:")
print(os.listdir(os.path.join(os.path.dirname(__file__), "..")))

print("\n" + "="*70)
