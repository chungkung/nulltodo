import json
import re
from datetime import datetime, timedelta

LLM_AVAILABLE = False
LLM_API_KEY = 'a6aaae5bcc984e268f23561d93e81625.X48jy90H1V2eqpCu'
LLM_MODEL = 'glm-4-flash'
LLM_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4'

if LLM_API_KEY and LLM_API_KEY != 'your-api-key-here':
    LLM_AVAILABLE = True

def call_llm(prompt: str, temperature: float = 0.7) -> str:
    if not LLM_AVAILABLE:
        return generate_fallback_response(prompt)

    try:
        import requests

        response = requests.post(
            f"{LLM_BASE_URL}/chat/completions",
            headers={
                'Authorization': f'Bearer {LLM_API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'model': LLM_MODEL,
                'messages': [
                    {'role': 'system', 'content': '你是一个专业的任务管理助手，擅长从用户的自然语言输入中提取任务信息。请严格按照JSON格式输出，不要输出任何其他内容。'},
                    {'role': 'user', 'content': prompt}
                ],
                'temperature': temperature
            },
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            content = data['choices'][0]['message']['content']
            print(f"LLM原始返回: {content}")
            return content
        else:
            print(f"LLM API error: {response.status_code} - {response.text}")
            return generate_fallback_response(prompt)

    except Exception as e:
        print(f"LLM调用失败: {e}")
        return generate_fallback_response(prompt)

def generate_fallback_response(prompt: str) -> str:
    import re
    import json
    from datetime import datetime, timedelta
    
    if '拆分' in prompt or '拆分为' in prompt or '小任务' in prompt:
        content = prompt
        if '任务' in prompt and '：' in prompt:
            parts = prompt.split('任务：')
            if len(parts) > 1:
                content = parts[-1].split('\n')[0].strip()
        
        keywords = {
            '写': ['准备素材', '撰写内容', '检查校对'],
            '做': ['准备工作', '执行制作', '质量检查'],
            '准备': ['收集资料', '整理准备', '最终确认'],
            '学习': ['课前预习', '认真学习', '复习巩固'],
            '完成': ['分解目标', '逐步执行', '结果验证'],
            '开会': ['准备议程', '参加会议', '会后跟进'],
            '项目': ['需求分析', '执行开发', '测试上线'],
            '报告': ['收集数据', '撰写内容', '审核提交'],
        }
        
        subtasks = [
            {'content': '准备', 'estimated_hours': 0.5},
            {'content': '执行', 'estimated_hours': 1.0},
            {'content': '检查', 'estimated_hours': 0.5},
        ]
        
        for keyword, items in keywords.items():
            if keyword in content:
                subtasks = [
                    {'content': items[0], 'estimated_hours': 0.5},
                    {'content': items[1], 'estimated_hours': 1.0},
                    {'content': items[2], 'estimated_hours': 0.5},
                ]
                break
        
        return json.dumps(subtasks)
    
    text = prompt
    if '用户输入' in prompt:
        text = prompt.split('用户输入：')[-1].strip()
    
    result = {
        'content': text,
        'deadline': '',
        'estimated_hours': 1.0,
        'scenario': 'general',
        'urgency': 2
    }
    
    now = datetime.now()
    
    time_patterns = [
        (r'今天(?:中午)?(\d{1,2})[时点]?', 0, '中午'),
        (r'今天下午(\d{1,2})[时点]?', 0, '下午'),
        (r'今天上午(\d{1,2})[时点]?', 0, '上午'),
        (r'今天(\d{1,2})[时点]?', 0, ''),
        (r'今天', 0, '18:00'),
        (r'明天(?:中午)?(\d{1,2})[时点]?', 1, '中午'),
        (r'明天下午(\d{1,2})[时点]?', 1, '下午'),
        (r'明天上午(\d{1,2})[时点]?', 1, '上午'),
        (r'明天(\d{1,2})[时点]?', 1, ''),
        (r'明天', 1, '10:00'),
        (r'后天', 2, '10:00'),
    ]
    
    for pattern, days, time_hint in time_patterns:
        match = re.search(pattern, text)
        if match:
            target = now + timedelta(days=days)
            if match.groups() and match.group(1):
                hour = int(match.group(1))
                if '午' in time_hint:
                    if '下' in time_hint and hour < 12:
                        hour += 12
                    elif '上' in time_hint and hour >= 12:
                        hour = max(9, hour - 12) if hour > 12 else hour
                target = target.replace(hour=hour, minute=0, second=0)
            else:
                if time_hint == '中午':
                    target = target.replace(hour=12, minute=0, second=0)
                elif time_hint == '下午':
                    target = target.replace(hour=14, minute=0, second=0)
                elif time_hint == '上午':
                    target = target.replace(hour=10, minute=0, second=0)
                elif time_hint == '18:00':
                    target = target.replace(hour=18, minute=0, second=0)
                elif time_hint == '10:00':
                    target = target.replace(hour=10, minute=0, second=0)
                else:
                    target = target.replace(hour=18, minute=0, second=0)
            result['deadline'] = target.isoformat()
            break
    
    hours_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:小时|h|hrs?)', text)
    if hours_match:
        result['estimated_hours'] = float(hours_match.group(1))
    elif '大概' in text or '约' in text:
        num_match = re.search(r'[大概约](\d+(?:\.\d+)?)', text)
        if num_match:
            result['estimated_hours'] = float(num_match.group(1))
    
    scenario_keywords = {
        'work': ['工作', '报告', '开会', '项目', '任务', '汇报', '方案', '客户', '老板', '上班'],
        'study': ['学习', '读书', '课程', '考试', '复习', '笔记', '论文', '写作业', '上课'],
        'life': ['购物', '做饭', '打扫', '健身', '运动', '约会', '买菜', '洗衣服'],
        'side-project': ['副业', '兼职', '接单', '创业', '自媒体', '视频', '文章'],
        'social': ['聚会', '社交', '朋友', '家人', '联系', '打电话', '视频通话']
    }
    
    for scenario, keywords in scenario_keywords.items():
        if any(kw in text for kw in keywords):
            result['scenario'] = scenario
            break
    
    if any(kw in text for kw in ['紧急', '着急', '马上', '立刻', '尽快']):
        result['urgency'] = 4
    elif any(kw in text for kw in ['重要', '必须', '一定']):
        result['urgency'] = 3
    
    return json.dumps(result)


class NLUService:
    def __init__(self):
        self.parse_prompt_template = """你是一个专业的任务管理助手。请从用户的自然语言输入中提取任务信息。

请分析用户输入，提取以下信息并以JSON格式返回：
- content: 任务内容（保留原始描述中的核心内容，去除时间描述）
- deadline: 截止时间（ISO格式如2026-05-10T15:00:00，如无明确时间则为空字符串""）
- estimated_hours: 预估耗时（小时数，数字，如无说明默认1）
- scenario: 场景标签（work/study/life/side-project/social/general）
- priority: 优先级（urgent/high/medium/low，根据紧急程度判断）

规则：
1. 如果用户说"今天"，deadline设为今天18:00
2. 如果用户说"明天"，deadline设为明天10:00
3. 如果用户提到具体时间，按实际时间设置
4. 如果提到"紧急"、"马上"、"着急"，priority设为urgent
5. 根据关键词判断scenario：工作相关→work，学习相关→study，生活相关→life

示例：
输入："明天下午3点写项目报告，大概3小时，很重要"
输出：{{"content":"写项目报告","deadline":"{tomorrow}15:00:00","estimated_hours":3,"scenario":"work","priority":"high"}}

请直接输出JSON，不要其他内容。
用户输入：{input_text}"""

        self.split_prompt_template = """你是一个任务拆解专家。请将以下任务拆分为3-6个可执行的子任务。

任务：{task_content}

要求：
1. 子任务应该具体、可执行
2. 每个子任务预估合理耗时
3. 返回JSON数组格式

输出格式：
[
  {{"content":"子任务1","estimated_hours":0.5}},
  {{"content":"子任务2","estimated_hours":1.0}},
  ...
]

请直接输出JSON数组，不要其他内容。"""

    def parse_task(self, input_text: str) -> dict:
        try:
            tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
            prompt = self.parse_prompt_template.format(
                tomorrow=tomorrow,
                input_text=input_text
            )

            response = call_llm(prompt)
            
            response = response.strip()
            if response.startswith('```'):
                lines = response.split('\n')
                response = '\n'.join(lines[1:-1] if lines[-1].strip() == '```' else lines[1:])
            response = response.strip()

            result = json.loads(response)

            result['priority'] = result.get('priority', 'medium')
            result['content'] = input_text

            return result
        except Exception as e:
            print(f"NLU解析失败: {e}, 原始返回: {response if 'response' in dir() else 'N/A'}")
            return self._fallback_parse(input_text)

    def _urgency_to_priority(self, urgency: int) -> str:
        mapping = {4: 'urgent', 3: 'high', 2: 'medium', 1: 'low'}
        return mapping.get(urgency, 'medium')

    def _fallback_parse(self, input_text: str) -> dict:
        deadline = self._extract_deadline(input_text)
        hours = self._extract_hours(input_text)
        scenario = self._detect_scenario(input_text)

        return {
            'content': input_text,
            'deadline': deadline,
            'estimated_hours': hours,
            'scenario': scenario,
            'priority': 'medium'
        }

    def _extract_deadline(self, text: str) -> str:
        now = datetime.now()

        patterns = [
            (r'今天(?:中午)?(\d{1,2})[时点]?', 0, '中午'),
            (r'今天下午(\d{1,2})[时点]?', 0, '下午'),
            (r'今天上午(\d{1,2})[时点]?', 0, '上午'),
            (r'今天(\d{1,2})[时点]?', 0, ''),
            (r'今天', 0, '18:00'),
            (r'明天(?:中午)?(\d{1,2})[时点]?', 1, '中午'),
            (r'明天下午(\d{1,2})[时点]?', 1, '下午'),
            (r'明天上午(\d{1,2})[时点]?', 1, '上午'),
            (r'明天(\d{1,2})[时点]?', 1, ''),
            (r'明天', 1, '10:00'),
            (r'后天', 2, '10:00'),
        ]

        for pattern, days, time_hint in patterns:
            match = re.search(pattern, text)
            if match:
                target = now + timedelta(days=days)
                if match.groups() and match.group(1):
                    hour = int(match.group(1))
                    if '午' in time_hint:
                        if '下' in time_hint and hour < 12:
                            hour += 12
                        elif '上' in time_hint and hour >= 12:
                            hour = max(9, hour - 12) if hour > 12 else hour
                    target = target.replace(hour=hour, minute=0, second=0)
                else:
                    if time_hint == '中午':
                        target = target.replace(hour=12, minute=0, second=0)
                    elif time_hint == '下午':
                        target = target.replace(hour=14, minute=0, second=0)
                    elif time_hint == '上午':
                        target = target.replace(hour=10, minute=0, second=0)
                    elif time_hint == '18:00':
                        target = target.replace(hour=18, minute=0, second=0)
                    elif time_hint == '10:00':
                        target = target.replace(hour=10, minute=0, second=0)
                    else:
                        target = target.replace(hour=18, minute=0, second=0)
                return target.isoformat()

        return ''

    def _extract_hours(self, text: str) -> float:
        patterns = [
            r'(\d+(?:\.\d+)?)\s*小时',
            r'(\d+(?:\.\d+)?)\s*h',
            r'大概\s*(\d+(?:\.\d+)?)',
        ]

        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return float(match.group(1))

        return 1.0

    def _detect_scenario(self, text: str) -> str:
        keywords = {
            'work': ['工作', '报告', '开会', '项目', '任务', '汇报', '方案', '客户', '老板', '上班'],
            'study': ['学习', '读书', '课程', '考试', '复习', '笔记', '论文', '写作业', '上课'],
            'life': ['购物', '做饭', '打扫', '健身', '运动', '约会', '买菜', '洗衣服'],
            'side-project': ['副业', '兼职', '接单', '创业', '自媒体', '视频', '文章'],
            'social': ['聚会', '社交', '朋友', '家人', '联系', '打电话', '视频通话']
        }

        for scenario, words in keywords.items():
            if any(word in text for word in words):
                return scenario

        return 'general'

    def split_task(self, task: dict) -> list:
        if not task:
            return []

        content = task.get('content', '')
        prompt = self.split_prompt_template.format(task_content=content)

        try:
            response = call_llm(prompt)
            
            response = response.strip()
            if response.startswith('```'):
                lines = response.split('\n')
                response = '\n'.join(lines[1:-1] if lines[-1].strip() == '```' else lines[1:])
            response = response.strip()
            
            response = response.replace('"', '"').replace('"', '"').replace('"', '"').replace('"', '"').replace('：', ':').replace('，', ',')
            
            subtasks = json.loads(response)
            return subtasks if isinstance(subtasks, list) else []
        except Exception as e:
            print(f"任务拆解失败: {e}, 原始: {response[:200] if 'response' in dir() else 'N/A'}...")
            return self._fallback_split(content)

    def _fallback_split(self, content: str) -> list:
        content_lower = content.lower()
        
        task_patterns = {
            'writing': {
                'keywords': ['写', '文章', '报告', '文档', '方案', '策划', '总结', '简历', '邮件', '小说', '博客', '投稿'],
                'subtasks': [
                    '收集相关资料和信息',
                    '列出大纲和要点',
                    '撰写初稿内容',
                    '修改完善和润色',
                    '校对检查并定稿'
                ],
                'hours': [0.5, 0.5, 1.5, 1.0, 0.5]
            },
            'study': {
                'keywords': ['学习', '复习', '预习', '考试', '课程', '读书', '笔记', '作业', '论文'],
                'subtasks': [
                    '确定学习目标和范围',
                    '收集学习资料',
                    '系统性学习和理解',
                    '做笔记和整理重点',
                    '练习和巩固',
                    '回顾复习'
                ],
                'hours': [0.25, 0.25, 1.0, 0.5, 0.75, 0.5]
            },
            'work': {
                'keywords': ['工作', '项目', '任务', '开会', '汇报', '演示', '方案', '客户', '需求'],
                'subtasks': [
                    '明确需求和目标',
                    '分析和拆解问题',
                    '制定执行计划',
                    '实施和解决问题',
                    '检查和优化结果',
                    '总结和汇报'
                ],
                'hours': [0.25, 0.5, 0.25, 1.5, 0.5, 0.25]
            },
            'development': {
                'keywords': ['开发', '编程', '代码', '网站', 'app', '应用', '系统', '程序', 'bug', '测试'],
                'subtasks': [
                    '需求分析和设计',
                    '环境搭建和准备',
                    '核心功能实现',
                    '功能测试和修复',
                    '优化和完善',
                    '部署和上线'
                ],
                'hours': [0.5, 0.25, 2.0, 1.0, 0.5, 0.25]
            },
            'design': {
                'keywords': ['设计', '画图', '海报', 'ppt', '幻灯片', '封面', 'logo', '界面', 'ui'],
                'subtasks': [
                    '明确设计需求和风格',
                    '收集参考和素材',
                    '设计初稿',
                    '修改和完善',
                    '最终定稿输出'
                ],
                'hours': [0.25, 0.5, 1.5, 1.0, 0.25]
            },
            'purchase': {
                'keywords': ['买', '购物', '采购', '下单', '京东', '淘宝', '天猫'],
                'subtasks': [
                    '确定购买需求和预算',
                    '搜索和比较产品',
                    '查看评价和攻略',
                    '下单购买',
                    '收货确认'
                ],
                'hours': [0.25, 0.5, 0.25, 0.25, 0.25]
            },
            'housework': {
                'keywords': ['打扫', '清洁', '整理', '收纳', '洗衣服', '做饭', '买菜', '维修', '装修'],
                'subtasks': [
                    '准备工具和材料',
                    '分区域进行整理',
                    '彻底清洁打扫',
                    '检查和完善细节',
                    '整理归位'
                ],
                'hours': [0.25, 0.5, 1.0, 0.5, 0.25]
            },
            'communication': {
                'keywords': ['联系', '打电话', '沟通', '拜访', '面谈', '会议', '约会', '社交'],
                'subtasks': [
                    '确定沟通目标和内容',
                    '预约和安排时间',
                    '准备沟通材料',
                    '进行沟通',
                    '跟进和落实'
                ],
                'hours': [0.25, 0.25, 0.5, 0.5, 0.25]
            },
            'fitness': {
                'keywords': ['健身', '运动', '跑步', '游泳', '瑜伽', '锻炼', '减肥'],
                'subtasks': [
                    '热身准备',
                    '主要训练内容',
                    '放松拉伸',
                    '记录和总结'
                ],
                'hours': [0.25, 1.0, 0.25, 0.25]
            },
            'default': {
                'keywords': [],
                'subtasks': [
                    '分析任务需求',
                    '制定执行计划',
                    '逐步完成任务',
                    '检查和总结'
                ],
                'hours': [0.5, 0.5, 1.5, 0.5]
            }
        }
        
        for pattern_name, pattern_data in task_patterns.items():
            if pattern_name == 'default':
                continue
            if any(kw in content for kw in pattern_data['keywords']):
                return [
                    {'content': subtask, 'estimated_hours': hours}
                    for subtask, hours in zip(pattern_data['subtasks'], pattern_data['hours'])
                ]
        
        default_pattern = task_patterns['default']
        return [
            {'content': subtask, 'estimated_hours': hours}
            for subtask, hours in zip(default_pattern['subtasks'], default_pattern['hours'])
        ]
