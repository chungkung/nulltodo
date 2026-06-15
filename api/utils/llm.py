import os
import requests
from api.config import Config

def call_llm(prompt: str, temperature: float = 0.7) -> str:
    api_key = os.environ.get('LLM_API_KEY', '')
    
    if not api_key:
        return generate_fallback_response(prompt)
    
    try:
        response = requests.post(
            f"{Config.LLM_BASE_URL}/chat/completions",
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'model': Config.LLM_MODEL,
                'messages': [
                    {'role': 'system', 'content': '你是一个任务管理助手，专注于帮助用户解析和管理任务。'},
                    {'role': 'user', 'content': prompt}
                ],
                'temperature': temperature
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return data['choices'][0]['message']['content']
        else:
            print(f"LLM API error: {response.status_code} - {response.text}")
            return generate_fallback_response(prompt)
            
    except Exception as e:
        print(f"LLM调用失败: {e}")
        return generate_fallback_response(prompt)

def generate_fallback_response(prompt: str) -> str:
    if '拆分' in prompt:
        return '[{"content":"准备任务","estimated_hours":0.5},{"content":"执行任务","estimated_hours":1.0},{"content":"检查结果","estimated_hours":0.5}]'
    else:
        return '{"content":"新任务","deadline":"","estimated_hours":1,"scenario":"general","urgency":2}'
