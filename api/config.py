import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    LLM_API_KEY = os.environ.get('LLM_API_KEY', '')
    LLM_BASE_URL = os.environ.get('LLM_BASE_URL', 'https://dashscope.aliyuncs.com/compatible-mode/v1')
    LLM_MODEL = os.environ.get('LLM_MODEL', 'qwen-turbo')
    DATABASE_PATH = os.environ.get('DATABASE_PATH', 'task_agent.db')
