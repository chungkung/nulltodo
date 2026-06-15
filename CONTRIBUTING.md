# 贡献指南

感谢你对 NullTodo 项目的关注！我们欢迎各种形式的贡献，无论是报告问题、提出新功能，还是贡献代码。

## 行为准则

参与本项目即表示你同意遵守我们的[行为准则](CODE_OF_CONDUCT.md)。请阅读该文件，以了解哪些行为是我们不容忍的。

## 如何贡献

### 报告 Bug

使用 [GitHub Issues](https://github.com/yourusername/nulltodo/issues) 报告 Bug。在提交 Issue 时，请包含：

- 清晰的问题描述
- 重现步骤
- 预期行为和实际行为
- 环境信息（操作系统、浏览器版本等）
- 如果可能，提供截图或错误日志

### 提出新功能

在提出新功能之前，请先[创建一个 Issue](https://github.com/yourusername/nulltodo/issues/new) 讨论你的想法。我们需要了解：

- 这个功能解决什么问题？
- 你期望它如何工作？
- 有没有类似的实现可以参考？

### 贡献代码

#### 开发环境设置

1. Fork 本项目
2. 克隆到本地：
   ```bash
   git clone https://github.com/yourusername/nulltodo.git
   cd nulltodo
   ```

3. 安装依赖：
   ```bash
   npm install
   ```

4. 启动开发服务器：
   ```bash
   npm run dev
   ```

5. 创建新分支：
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/bug-description
   ```

#### 代码规范

- 使用 TypeScript 编写代码
- 遵循项目现有的代码风格
- 确保代码通过 ESLint 检查
- 添加必要的注释（特别是复杂逻辑）
- 保持组件单一职责

#### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: 添加新功能
fix: 修复 Bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建/工具变更
```

示例：
```bash
git commit -m "feat: 添加任务优先级筛选功能"
git commit -m "fix: 修复任务状态同步问题"
git commit -m "docs: 更新 README 安装说明"
```

#### 提交 Pull Request

1. 确保你的代码通过了所有测试
2. 更新相关文档（如果需要）
3. 创建 Pull Request，描述你的更改
4. 等待代码审查

### 代码审查流程

- 所有 PR 都需要至少一位维护者的审查
- 审查者可能会提出修改建议
- 请积极回应审查意见
- 合并后，你的贡献将被记录在项目的贡献者列表中

## 开发指南

### 项目结构

```
nulltodo/
├── src/
│   ├── components/    # React 组件
│   ├── pages/         # 页面组件
│   ├── stores/        # 状态管理（Zustand）
│   ├── services/      # API 服务
│   └── utils/         # 工具函数
├── api/               # 后端（可选）
├── electron/          # 桌面应用
└── docs/              # 文档
```

### 常用命令

```bash
# 开发
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览生产构建

# 代码质量
npm run lint         # ESLint 检查
npm run type-check   # TypeScript 类型检查

# 桌面应用
cd electron
npm run dev          # 开发模式
npm run dist         # 打包
```

### 测试

目前项目正在完善测试覆盖率。在提交 PR 前，请确保：

- 新功能包含相应的测试
- 现有测试全部通过
- 手动测试所有相关功能

## 获取帮助

- 查看 [README.md](README.md) 了解项目概览
- 在 [Discussions](https://github.com/yourusername/nulltodo/discussions) 提问
- 查看现有 Issues 和 PRs 了解正在进行的工作

## 致谢

所有贡献者都将被列入项目的贡献者列表。感谢你的贡献！

---

**注意**：这是一个开源项目，所有贡献都是自愿的。请尊重其他贡献者，保持友好的交流氛围。
