import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, Trash2, Bot, User } from 'lucide-react';
import { chatApi } from '../services/tagService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  messages: Message[];
}

export const AIAssistant: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const fetchConversations = async () => {
    try {
      setError(null);
      const response = await chatApi.getConversations();
      // 确保数据是数组且包含有效对象
      if (Array.isArray(response)) {
        const validConversations = response.filter(c => c && c.id) as Conversation[];
        setConversations(validConversations);
      } else {
        console.warn('Invalid response format for conversations:', response);
        setConversations([]);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setError('无法加载对话列表');
      setConversations([]);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const createNewConversation = async () => {
    try {
      setError(null);
      const response = await chatApi.createConversation('新对话');
      if (response && response.id) {
        setConversations(prev => [response, ...prev]);
        setCurrentConversation(response);
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
      setError('创建对话失败');
    }
  };

  const selectConversation = async (conversationId: string) => {
    try {
      setError(null);
      const response = await chatApi.getConversation(conversationId);
      if (response && response.id) {
        setCurrentConversation(response);
      }
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
      setError('加载对话失败');
    }
  };

  const deleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个对话吗？')) return;
    
    try {
      setError(null);
      await chatApi.deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      setError('删除对话失败');
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim()) return;
    
    if (!currentConversation) {
      await createNewConversation();
      return;
    }

    const messageToSend = inputMessage;
    setInputMessage('');
    setLoading(true);

    try {
      setError(null);
      const updatedConversation = await chatApi.sendMessage(
        currentConversation.id, messageToSend
      );
      if (updatedConversation && updatedConversation.id) {
        setCurrentConversation(updatedConversation);
      }
      
      await fetchConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('发送消息失败');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  const safeMessages = currentConversation?.messages && Array.isArray(currentConversation.messages) 
    ? currentConversation.messages.filter(m => m && m.id) 
    : [];

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {isSidebarOpen && (
        <div className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={createNewConversation}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              新对话
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => selectConversation(conversation.id)}
                className={`p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                  currentConversation?.id === conversation.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <MessageSquare className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="text-sm truncate text-gray-700 dark:text-gray-300">
                    {conversation.title || '无标题'}
                  </span>
                </div>
                <button
                  onClick={(e) => deleteConversation(e, conversation.id)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                >
                  <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {currentConversation?.title || 'AI任务助手'}
            </h2>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 text-sm">
            {error}
            <button 
              onClick={() => setError(null)} 
              className="ml-2 hover:underline"
            >
              关闭
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {!currentConversation ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="w-16 h-16 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                欢迎使用AI任务助手
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                我可以帮助你创建任务、分析数据、或者回答问题
              </p>
              <button
                onClick={createNewConversation}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
              >
                开始聊天
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {safeMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                    {message.role === 'user' ? (
                      <User className="w-6 h-6 text-gray-500" />
                    ) : (
                      <Bot className="w-6 h-6 text-blue-500" />
                    )}
                  </div>
                  <div
                    className={`max-w-2xl p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content || ''}</div>
                    <div className={`text-xs mt-1 opacity-70 ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {formatTime(message.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-3 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="输入消息..."
              disabled={!currentConversation || loading}
              className="flex-1 p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!currentConversation || loading || !inputMessage.trim()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg disabled:cursor-not-allowed"
            >
              发送
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
