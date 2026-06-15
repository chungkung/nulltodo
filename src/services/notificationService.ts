export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
}

class NotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      this.permission = result;
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async sendNotification(options: NotificationOptions): Promise<void> {
    if (!await this.requestPermission()) {
      console.warn('Notification permission not granted');
      return;
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/notification-icon.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 10000);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  async notifyTaskReminder(task: { content: string; deadline: string }): Promise<void> {
    const deadline = new Date(task.deadline);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const hours = Math.round(diff / (1000 * 60 * 60));

    let body = '';
    if (hours <= 0) {
      body = `"${task.content}" 已到期！`;
    } else if (hours <= 1) {
      body = `"${task.content}" 将在1小时内到期`;
    } else {
      body = `"${task.content}" 将在${hours}小时后到期`;
    }

    await this.sendNotification({
      title: '📋 任务提醒',
      body,
      requireInteraction: true,
    });
  }

  async notifyTaskCompleted(taskContent: string): Promise<void> {
    await this.sendNotification({
      title: '✅ 任务完成',
      body: `"${taskContent}" 已完成！`,
    });
  }

  getPermission(): NotificationPermission {
    return this.permission;
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
