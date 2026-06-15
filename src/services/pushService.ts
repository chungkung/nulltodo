import api from './api';

export interface PushConfig {
  type: 'dingtalk' | 'wechat' | 'feishu' | 'email';
  webhook_url: string;
  enabled: boolean;
}

export interface PushMessage {
  title: string;
  content: string;
  type?: 'text' | 'markdown' | 'link';
  url?: string;
}

class PushService {
  private configs: Map<string, PushConfig> = new Map();

  async loadConfigs(): Promise<void> {
    try {
      const response = await api.get<PushConfig[]>('/push/configs');
      if (response.success && response.data) {
        response.data.forEach(config => {
          this.configs.set(config.type, config);
        });
      }
    } catch (error) {
      console.error('Failed to load push configs:', error);
    }
  }

  async saveConfig(config: PushConfig): Promise<void> {
    try {
      await api.post('/push/configs', config);
      this.configs.set(config.type, config);
    } catch (error) {
      console.error('Failed to save push config:', error);
      throw error;
    }
  }

  async sendNotification(message: PushMessage): Promise<{ success: boolean; failedTypes: string[] }> {
    const failedTypes: string[] = [];
    
    const promises = Array.from(this.configs.entries())
      .filter(([_, config]) => config.enabled && config.webhook_url)
      .map(async ([type, config]) => {
        try {
          await this.sendToProvider(type as PushConfig['type'], config.webhook_url, message);
        } catch (error) {
          console.error(`Failed to send to ${type}:`, error);
          failedTypes.push(type);
        }
      });

    await Promise.allSettled(promises);

    return {
      success: failedTypes.length === 0,
      failedTypes,
    };
  }

  private async sendToProvider(
    type: PushConfig['type'],
    webhookUrl: string,
    message: PushMessage
  ): Promise<void> {
    let payload: any;

    switch (type) {
      case 'dingtalk':
        payload = this.buildDingTalkMessage(message);
        break;
      case 'wechat':
        payload = this.buildWeChatMessage(message);
        break;
      case 'feishu':
        payload = this.buildFeiShuMessage(message);
        break;
      case 'email':
        await this.sendEmail(message);
        return;
      default:
        throw new Error(`Unknown push type: ${type}`);
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Push failed: ${response.status} ${response.statusText}`);
    }
  }

  private buildDingTalkMessage(message: PushMessage) {
    if (message.type === 'markdown') {
      return {
        msgtype: 'markdown',
        markdown: {
          title: message.title,
          text: message.content,
        },
      };
    }
    return {
      msgtype: 'text',
      text: {
        content: `**${message.title}**\n\n${message.content}`,
      },
    };
  }

  private buildWeChatMessage(message: PushMessage) {
    return {
      msgtype: 'text',
      text: {
        content: `${message.title}\n\n${message.content}`,
      },
    };
  }

  private buildFeiShuMessage(message: PushMessage) {
    if (message.type === 'link' && message.url) {
      return {
        msg_type: 'post',
        content: {
          post: {
            zh_cn: {
              title: message.title,
              content: [[{
                tag: 'text',
                text: message.content,
              }]],
            },
          },
        },
      };
    }
    return {
      msg_type: 'text',
      content: {
        text: `${message.title}\n\n${message.content}`,
      },
    };
  }

  private async sendEmail(message: PushMessage): Promise<void> {
    try {
      await api.post('/push/email', {
        subject: message.title,
        content: message.content,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async notifyTaskReminder(task: {
    content: string;
    deadline: string;
    priority: string;
  }): Promise<void> {
    const deadline = new Date(task.deadline);
    const timeStr = deadline.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const priorityEmoji = {
      urgent: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
    };

    await this.sendNotification({
      title: `${priorityEmoji[task.priority as keyof typeof priorityEmoji] || '📌'} 任务提醒`,
      content: `任务: ${task.content}\n截止时间: ${timeStr}\n优先级: ${task.priority}`,
      type: 'text',
    });
  }

  async notifyTaskCompleted(task: { content: string }): Promise<void> {
    await this.sendNotification({
      title: '✅ 任务完成',
      content: `恭喜！你已完成任务：${task.content}`,
      type: 'text',
    });
  }
}

export const pushService = new PushService();
