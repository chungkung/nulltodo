import sqlite3
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
import uuid
import os

try:
    from zhipuai import ZhipuAI
    ZHIPU_AVAILABLE = True
except ImportError:
    ZHIPU_AVAILABLE = False

# 获取数据库路径 - 使用绝对路径，和app.py保持一致
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'tasks.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

class AIAssistantService:
    def __init__(self):
        # 在这里设置你的智谱AI API密钥
        # 实际使用时，建议从环境变量或配置文件读取
        self.api_key = "a6aaae5bcc984e268f23561d93e81625.X48jy90H1V2eqpCu"  # 用户提供的智谱API密钥
        self.client = None
        self.use_mock = False  # 启用真实的智谱AI
        
        if ZHIPU_AVAILABLE and self.api_key:
            try:
                self.client = ZhipuAI(api_key=self.api_key)
                print("智谱AI客户端初始化成功")
                self.use_mock = False  # 如果初始化成功，就使用真实的智谱AI
            except Exception as e:
                print(f"智谱AI客户端初始化失败: {e}，使用模拟响应")
                self.use_mock = True
        else:
            print("Warning: 智谱AI不可用或密钥未设置，使用模拟响应")
            self.use_mock = True
    
    def initialize_database(self):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 创建聊天会话表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chat_conversations (
                id TEXT PRIMARY KEY,
                title TEXT,
                created_at TEXT,
                updated_at TEXT,
                pinned INTEGER DEFAULT 0
            )
        ''')
        
        # 创建聊天消息表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chat_messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT,
                role TEXT,
                content TEXT,
                created_at TEXT,
                FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id)
            )
        ''')
        
        # 创建任务记忆表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS task_memory (
                id TEXT PRIMARY KEY,
                task_id TEXT,
                user_id TEXT DEFAULT 'default',
                content TEXT,
                memory_type TEXT,
                created_at TEXT,
                FOREIGN KEY (task_id) REFERENCES tasks(id)
            )
        ''')
        
        # 创建用户画像表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_profile (
                id TEXT PRIMARY KEY DEFAULT 'default',
                best_hours TEXT DEFAULT '[]',
                procrastination_pattern TEXT,
                work_preferences TEXT,
                skill_levels TEXT DEFAULT '{}',
                created_at TEXT,
                updated_at TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def create_conversation(self, title: str = "新对话") -> Dict:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        conversation_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO chat_conversations (id, title, created_at, updated_at)
            VALUES (?, ?, ?, ?)
        ''', (conversation_id, title, now, now))
        
        conn.commit()
        conn.close()
        
        return self.get_conversation(conversation_id)
    
    def get_conversation(self, conversation_id: str) -> Optional[Dict]:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM chat_conversations WHERE id = ?', (conversation_id,))
        row = cursor.fetchone()
        
        if row:
            conversation = dict(row)
            # 获取该会话的所有消息
            cursor.execute('''
                SELECT * FROM chat_messages 
                WHERE conversation_id = ? 
                ORDER BY created_at ASC
            ''', (conversation_id,))
            messages = [dict(m) for m in cursor.fetchall()]
            conversation['messages'] = messages
            
            conn.close()
            return conversation
        
        conn.close()
        return None
    
    def get_all_conversations(self) -> List[Dict]:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM chat_conversations 
            ORDER BY pinned DESC, updated_at DESC
        ''')
        conversations = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        return conversations
    
    def delete_conversation(self, conversation_id: str) -> bool:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM chat_messages WHERE conversation_id = ?', (conversation_id,))
        cursor.execute('DELETE FROM chat_conversations WHERE id = ?', (conversation_id,))
        
        conn.commit()
        conn.close()
        
        return True
    
    def add_message(self, conversation_id: str, role: str, content: str) -> Dict:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        message_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO chat_messages (id, conversation_id, role, content, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (message_id, conversation_id, role, content, now))
        
        # 更新会话的更新时间
        cursor.execute('''
            UPDATE chat_conversations 
            SET updated_at = ? 
            WHERE id = ?
        ''', (now, conversation_id))
        
        # 如果是第一条消息，更新会话标题（截取前30个字符）
        cursor.execute('SELECT COUNT(*) as count FROM chat_messages WHERE conversation_id = ?', (conversation_id,))
        count = cursor.fetchone()['count']
        if count == 1 and role == 'user':
            title = content[:30] + '...' if len(content) > 30 else content
            cursor.execute('UPDATE chat_conversations SET title = ? WHERE id = ?', (title, conversation_id))
        
        conn.commit()
        conn.close()
        
        return self.get_conversation(conversation_id)
    
    def _get_user_tasks_info(self) -> str:
        """获取用户当前任务信息"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM tasks ORDER BY created_at DESC LIMIT 20')
            tasks = [dict(row) for row in cursor.fetchall()]
            
            conn.close()
            
            if not tasks:
                return "你目前还没有创建任何任务。"
            
            task_info = "你当前的任务列表：\n"
            for i, task in enumerate(tasks, 1):
                status = task.get('status', 'pending')
                priority = task.get('priority', 'medium')
                deadline = task.get('deadline', '未设置')
                content = task.get('content', '未命名任务')
                
                status_text = "✅ 已完成" if status == "completed" else "⏳ 进行中"
                
                task_info += f"{i}. {status_text} - {content} (优先级: {priority}, 截止: {deadline})\n"
            
            return task_info
        except Exception as e:
            print(f"获取任务信息失败: {e}")
            return "暂时无法获取任务信息。"
    
    def generate_ai_response(self, conversation_id: str, user_message: str) -> str:
        print(f"开始生成AI响应，用户消息: {user_message}")
        # 获取当前会话上下文
        conversation = self.get_conversation(conversation_id)
        if not conversation:
            return "无法找到会话"
        
        # 获取用户任务信息
        tasks_info = self._get_user_tasks_info()
        
        # 构建对话历史
        messages = []
        
        # 添加系统提示
        system_prompt = self._get_system_prompt()
        system_content = f"{system_prompt}\n\n---\n当前用户的任务情况：\n{tasks_info}"
        
        messages.append({
            'role': 'system',
            'content': system_content
        })
        
        # 添加历史对话
        for msg in conversation['messages']:
            messages.append({
                'role': msg['role'],
                'content': msg['content']
            })
        
        print(f"use_mock: {self.use_mock}，client: {self.client is not None}")
        
        # 如果设置为使用模拟响应，或者client不可用，使用模拟响应
        if self.use_mock or not self.client:
            print("使用模拟响应")
            return self._generate_mock_response(user_message, conversation)
        
        try:
            print("正在调用智谱AI API...")
            # 调用智谱AI API
            response = self.client.chat.completions.create(
                model="glm-4-flash",  # 使用免费模型
                messages=messages
            )
            
            ai_response = response.choices[0].message.content
            print(f"智谱AI响应: {ai_response}")
            return ai_response
        except Exception as e:
            print(f"调用智谱AI失败: {e}")
            print(f"错误类型: {type(e).__name__}")
            import traceback
            print(traceback.format_exc())
            return self._generate_mock_response(user_message, conversation)
    
    def _get_system_prompt(self) -> str:
        return '''你是一个专业的任务管理AI助手，帮助用户高效管理任务。你会通过友好的对话帮助用户。

你的核心功能包括：
1. 智能任务创建：理解用户需求，帮用户规划任务
2. 任务查询：当用户问"我有什么任务"时，帮用户了解当前任务情况
3. 任务管理建议：分析任务关系，给出执行顺序和时间管理建议
4. 学习辅助：根据用户的学习任务提供相关建议
5. 问题解答：回答用户关于任务管理、效率提升的问题
6. 任务拆解：将大任务拆分成可执行的小步骤

请以友好、有帮助的方式回答用户的问题。'''
    
    def _generate_mock_response(self, user_message: str, conversation: Dict) -> str:
        # 更智能的模拟响应
        user_msg_lower = user_message.lower()
        user_msg = user_message.strip()
        
        # 处理问候
        if any(keyword in user_msg_lower for keyword in ['你好', 'hi', 'hello', '嗨', '早上好', '下午好', '晚上好']):
            return '''你好！😊 我是你的任务管理AI助手。
我可以帮你：
- 📋 创建和管理任务
- 🧩 拆分复杂任务
- 💡 提供效率建议
- 📊 分析任务完成情况
- 📚 回答问题

有什么我可以帮助你的吗？'''
        
        # 处理任务相关
        elif any(keyword in user_msg_lower for keyword in ['创建任务', '帮我做', '需要完成', '待办', '任务']):
            return f'''好的！我理解你想处理任务："{user_msg}"

作为任务管理助手，我可以帮你：
1. 创建新任务
2. 拆分现有任务
3. 分析任务优先级

你希望我帮你做什么呢？'''
        
        # 处理学习相关
        elif any(keyword in user_msg_lower for keyword in ['学习', '学会', '什么是', '解释', '介绍', '了解']):
            return f'''关于"{user_msg}"的问题：

作为你的AI助手，我可以帮你：
1. 解释相关概念
2. 制定学习计划
3. 拆分学习任务

你希望我从哪方面帮你呢？'''
        
        # 处理询问任务列表
        elif any(keyword in user_msg_lower for keyword in ['还有哪些', '任务列表', '查看任务', '我有什么']):
            return '''让我帮你查看一下当前任务情况。

你可以通过左侧菜单查看任务列表，或者我可以帮你：
1. 总结当前任务
2. 分析任务优先级
3. 制定执行计划

你需要哪个功能呢？'''
        
        # 默认智能响应
        else:
            return f'''收到你的消息："{user_msg}"

作为任务管理AI助手，我可以帮你：
- 创建任务并设置提醒
- 把大任务拆分成小步骤
- 分析你的工作习惯
- 回答你的问题

请告诉我具体需要什么帮助！'''
    
    def analyze_user_tasks(self) -> Dict:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 获取所有任务进行分析
        cursor.execute('SELECT * FROM tasks ORDER BY created_at DESC')
        tasks = [dict(t) for t in cursor.fetchall()]
        
        stats = {
            'total_tasks': len(tasks),
            'completed_tasks': sum(1 for t in tasks if t.get('status') == 'completed'),
            'pending_tasks': sum(1 for t in tasks if t.get('status') in ['pending', 'overdue']),
            'avg_completion_time': None,
            'common_priority': None,
            'best_hours': []
        }
        
        conn.close()
        return stats
    
    def add_task_memory(self, task_id: str, content: str, memory_type: str = "note") -> Dict:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        memory_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO task_memory (id, task_id, content, memory_type, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (memory_id, task_id, content, memory_type, now))
        
        conn.commit()
        conn.close()
        
        return {
            'id': memory_id,
            'task_id': task_id,
            'content': content,
            'memory_type': memory_type,
            'created_at': now
        }

# 初始化数据库
try:
    service = AIAssistantService()
    service.initialize_database()
except Exception as e:
    print(f"初始化AI助手服务失败: {e}")
