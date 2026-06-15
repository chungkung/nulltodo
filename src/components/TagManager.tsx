import { useState, useEffect } from 'react';
import { tagApi, categoryApi, Tag, Category } from '@/services/tagService';

interface TagManagerProps {
  onClose: () => void;
}

const TAG_COLORS = [
  '#6366f1', '#8b5cf6', '#d946ef', '#ec4899',
  '#f43f5e', '#f97316', '#eab308', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9',
];

const CATEGORY_COLORS = [
  '#1e40af', '#3730a3', '#4c1d95', '#581c87',
  '#701a75', '#9f1239', '#9a3412', '#78350f',
  '#365314', '#115e59', '#164e63', '#0c4a6e',
];

export default function TagManager({ onClose }: TagManagerProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'tags' | 'categories'>('tags');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tagsData, categoriesData] = await Promise.all([
        tagApi.getAll(),
        categoryApi.getAll(),
      ]);
      setTags(tagsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load tags and categories:', error);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const tag = await tagApi.create({ name: newTagName.trim(), color: newTagColor });
      setTags([...tags, tag]);
      setNewTagName('');
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag) return;
    try {
      const updated = await tagApi.update(editingTag.id, {
        name: editingTag.name,
        color: editingTag.color,
      });
      setTags(tags.map(t => t.id === updated.id ? updated : t));
      setEditingTag(null);
    } catch (error) {
      console.error('Failed to update tag:', error);
    }
  };

  const handleDeleteTag = async (id: string) => {
    try {
      await tagApi.delete(id);
      setTags(tags.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const category = await categoryApi.create({
        name: newCategoryName.trim(),
        color: newCategoryColor,
        icon: 'folder',
      });
      setCategories([...categories, category]);
      setNewCategoryName('');
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await categoryApi.delete(id);
      setCategories(categories.filter(c => c.id !== id));
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleClose = () => {
    console.log('Closing tag manager');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">标签与分类管理</h2>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
            >
              ✕ 关闭
            </button>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setActiveTab('tags')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'tags'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              🏷️ 标签
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'categories'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              📁 分类
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'tags' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3">
                <div className="flex gap-3 flex-wrap">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                    placeholder="输入标签名称..."
                    className="flex-1 min-w-[150px] px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {TAG_COLORS.slice(0, 6).map(color => (
                      <button
                        key={color}
                        onClick={() => setNewTagColor(color)}
                        className={`w-10 h-10 rounded-xl transition-transform border-2 ${
                          newTagColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110 border-gray-400' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleCreateTag}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl"
                  >
                    ✨ 添加标签
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {tags.map(tag => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
                  >
                    {editingTag?.id === tag.id ? (
                      <>
                        <input
                          type="text"
                          value={editingTag.name}
                          onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                          className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white"
                        />
                        <div className="flex gap-1">
                          {TAG_COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => setEditingTag({ ...editingTag, color })}
                              className={`w-7 h-7 rounded-lg transition-transform ${
                                editingTag.color === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <button
                          onClick={handleUpdateTag}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingTag(null)}
                          className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                        >
                          取消
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          className="w-6 h-6 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="flex-1 text-gray-900 dark:text-white font-medium">{tag.name}</span>
                        <button
                          onClick={() => setEditingTag(tag)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                        >
                          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                        >
                          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                ))}
                {tags.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <span className="text-4xl mb-3 block">🏷️</span>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">暂无标签，点击上方添加</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3">
                <div className="flex gap-3 flex-wrap">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                    placeholder="输入分类名称..."
                    className="flex-1 min-w-[150px] px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {CATEGORY_COLORS.slice(0, 6).map(color => (
                      <button
                        key={color}
                        onClick={() => setNewCategoryColor(color)}
                        className={`w-10 h-10 rounded-xl transition-transform border-2 ${
                          newCategoryColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110 border-gray-400' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleCreateCategory}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-lg hover:shadow-xl"
                  >
                    ✨ 添加分类
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {categories.map(category => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border-2 border-blue-200 dark:border-blue-800"
                  >
                    <span
                      className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: category.color }}
                    >
                      <span className="text-white text-xs">📁</span>
                    </span>
                    <span className="flex-1 text-gray-900 dark:text-white font-bold text-lg">{category.name}</span>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                    >
                      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                {categories.length === 0 && (
                  <div className="text-center py-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                    <span className="text-4xl mb-3 block">📁</span>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">暂无分类，点击上方添加</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
