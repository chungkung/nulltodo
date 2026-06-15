import { Task } from '@/types';

interface ParsedInput {
  content: string;
  deadline: string | null;
  priority: Task['priority'];
  scenario: string;
  estimated_hours: number;
}

// 优先级关键词映射
const priorityKeywords: Record<string, Task['priority']> = {
  '紧急': 'urgent',
  '立刻': 'urgent',
  '马上': 'urgent',
  ' ASAP': 'urgent',
  '高': 'high',
  '重要': 'high',
  '优先': 'high',
  '中': 'medium',
  '一般': 'medium',
  '低': 'low',
  '不急': 'low',
  '有空': 'low',
};

// 场景关键词映射
const scenarioKeywords: Record<string, string> = {
  '工作': 'work',
  '上班': 'work',
  '会议': 'work',
  '项目': 'work',
  '学习': 'study',
  '考试': 'study',
  '课程': 'study',
  '作业': 'study',
  '生活': 'life',
  '购物': 'life',
  '家务': 'life',
  '副业': 'side-project',
  '兼职': 'side-project',
  '社交': 'social',
  '聚会': 'social',
  '约会': 'social',
};

// 时间单位映射（小时）
const timeUnits: Record<string, number> = {
  '分钟': 1 / 60,
  '小时': 1,
  '天': 24,
  '周': 168,
};

/**
 * 解析中文自然语言输入
 */
export function parseNaturalLanguage(input: string): ParsedInput {
  let content = input;
  let deadline: string | null = null;
  let priority: Task['priority'] = 'medium';
  let scenario = 'general';
  let estimated_hours = 1;

  // 1. 解析时间
  deadline = parseDeadline(content);
  if (deadline) {
    content = removeTimeKeywords(content);
  }

  // 2. 解析优先级
  const parsedPriority = parsePriority(content);
  if (parsedPriority) {
    priority = parsedPriority.priority;
    content = parsedPriority.content;
  }

  // 3. 解析场景
  const parsedScenario = parseScenario(content);
  if (parsedScenario) {
    scenario = parsedScenario.scenario;
    content = parsedScenario.content;
  }

  // 4. 解析预估时长
  const parsedHours = parseEstimatedHours(content);
  if (parsedHours) {
    estimated_hours = parsedHours.hours;
    content = parsedHours.content;
  }

  // 清理多余空格
  content = content.replace(/\s+/g, ' ').trim();

  return {
    content,
    deadline,
    priority,
    scenario,
    estimated_hours,
  };
}

/**
 * 解析截止日期
 */
function parseDeadline(input: string): string | null {
  const now = new Date();

  // 今天
  if (input.includes('今天') || input.includes('今日')) {
    return setEndTime(now);
  }

  // 明天
  if (input.includes('明天') || input.includes('明日')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return setEndTime(tomorrow);
  }

  // 后天
  if (input.includes('后天')) {
    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);
    return setEndTime(dayAfter);
  }

  // 大后天
  if (input.includes('大后天')) {
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    return setEndTime(threeDaysLater);
  }

  // 下周X
  const weekDayMatch = input.match(/下周([一二三四五六日天])/);
  if (weekDayMatch) {
    const weekDay = getWeekDayNumber(weekDayMatch[1]);
    const target = getNextWeekDay(weekDay);
    return setEndTime(target);
  }

  // 这周X
  const thisWeekMatch = input.match(/这周([一二三四五六日天])/);
  if (thisWeekMatch) {
    const weekDay = getWeekDayNumber(thisWeekMatch[1]);
    const target = getThisWeekDay(weekDay);
    return setEndTime(target);
  }

  // X天后
  const daysLaterMatch = input.match(/(\d+)天后/);
  if (daysLaterMatch) {
    const days = parseInt(daysLaterMatch[1]);
    const target = new Date(now);
    target.setDate(target.getDate() + days);
    return setEndTime(target);
  }

  // 具体日期：X月X日
  const dateMatch = input.match(/(\d{1,2})月(\d{1,2})[日号]/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1]) - 1;
    const day = parseInt(dateMatch[2]);
    const target = new Date(now.getFullYear(), month, day);
    if (target < now) {
      target.setFullYear(target.getFullYear() + 1);
    }
    return setEndTime(target);
  }

  // 周末
  if (input.includes('周末')) {
    const dayOfWeek = now.getDay();
    const daysUntilWeekend = dayOfWeek === 0 || dayOfWeek === 6 ? 0 : 6 - dayOfWeek;
    const target = new Date(now);
    target.setDate(target.getDate() + daysUntilWeekend);
    return setEndTime(target);
  }

  // 月底
  if (input.includes('月底')) {
    const target = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return setEndTime(target);
  }

  return null;
}

/**
 * 设置结束时间为当天23:59
 */
function setEndTime(date: Date): string {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result.toISOString();
}

/**
 * 获取星期几的数字表示
 */
function getWeekDayNumber(day: string): number {
  const map: Record<string, number> = {
    '一': 1,
    '二': 2,
    '三': 3,
    '四': 4,
    '五': 5,
    '六': 6,
    '日': 0,
    '天': 0,
  };
  return map[day] || 0;
}

/**
 * 获取下周的指定星期几
 */
function getNextWeekDay(weekDay: number): Date {
  const now = new Date();
  const currentDay = now.getDay();
  let daysUntil = weekDay - currentDay;
  if (daysUntil <= 0) {
    daysUntil += 7;
  }
  daysUntil += 7; // 下周
  const target = new Date(now);
  target.setDate(target.getDate() + daysUntil);
  return target;
}

/**
 * 获取这周的指定星期几
 */
function getThisWeekDay(weekDay: number): Date {
  const now = new Date();
  const currentDay = now.getDay();
  let daysUntil = weekDay - currentDay;
  if (daysUntil < 0) {
    daysUntil += 7;
  }
  const target = new Date(now);
  target.setDate(target.getDate() + daysUntil);
  return target;
}

/**
 * 移除时间关键词
 */
function removeTimeKeywords(input: string): string {
  return input
    .replace(/今天|今日|明天|明日|后天|大后天/g, '')
    .replace(/下周[一二三四五六日天]/g, '')
    .replace(/这周[一二三四五六日天]/g, '')
    .replace(/\d+天后/g, '')
    .replace(/\d{1,2}月\d{1,2}[日号]/g, '')
    .replace(/周末|月底/g, '');
}

/**
 * 解析优先级
 */
function parsePriority(input: string): { priority: Task['priority']; content: string } | null {
  for (const [keyword, priority] of Object.entries(priorityKeywords)) {
    if (input.includes(keyword)) {
      return {
        priority,
        content: input.replace(keyword, ''),
      };
    }
  }
  return null;
}

/**
 * 解析场景
 */
function parseScenario(input: string): { scenario: string; content: string } | null {
  for (const [keyword, scenario] of Object.entries(scenarioKeywords)) {
    if (input.includes(keyword)) {
      return {
        scenario,
        content: input.replace(keyword, ''),
      };
    }
  }
  return null;
}

/**
 * 解析预估时长
 */
function parseEstimatedHours(input: string): { hours: number; content: string } | null {
  // 匹配：2小时、30分钟、1.5小时等
  const match = input.match(/(\d+(?:\.\d+)?)\s*(分钟|小时|天|周)/);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2];
    const hours = value * (timeUnits[unit] || 1);
    return {
      hours,
      content: input.replace(match[0], ''),
    };
  }
  return null;
}

/**
 * 格式化日期为可读字符串
 */
export function formatDeadline(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '今天';
  } else if (diffDays === 1) {
    return '明天';
  } else if (diffDays === 2) {
    return '后天';
  } else if (diffDays > 0 && diffDays <= 7) {
    return `${diffDays}天后`;
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
  }
}
