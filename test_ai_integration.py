import sys
import os

# 添加api目录到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))

from services.ai_assistant_service import AIAssistantService
import json

print("="*50)
print("测试智谱AI集成")
print("="*50)

# 初始化服务
service = AIAssistantService()

print(f"\nuse_mock: {service.use_mock}")
print(f"client available: {service.client is not None}")
print(f"ZHIPU_AVAILABLE: {service.__init__.__globals__.get('ZHIPU_AVAILABLE', 'Not found')}")

print("\n" + "="*50)
print("测试任务信息获取")
print("="*50)

tasks_info = service._get_user_tasks_info()
print(tasks_info)

print("\n" + "="*50)
print("测试对话创建和消息发送")
print("="*50)

# 创建测试对话
conv = service.create_conversation("测试对话")
print(f"创建对话: {conv['id']}")

# 添加用户消息
service.add_message(conv['id'], 'user', '今日的任务有什么')

# 测试AI响应
print("\n正在生成AI响应...")
response = service.generate_ai_response(conv['id'], '今日的任务有什么')
print(f"\nAI响应:")
print(response)

print("\n" + "="*50)
print("测试完成！")
print("="*50)