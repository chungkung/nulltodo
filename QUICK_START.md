# 🚀 NullTodo 快速开始指南

## 📱 现在支持的平台

✅ **Android** - APK应用
✅ **Windows 64位** - 桌面安装包
✅ **鸿蒙** - 原生应用
🔜 **iOS** - 需要macOS

---

## 🎨 第一件事：保存应用图标

**请将您提供的精美图标保存为：**
```
assets/icon.png
```
(推荐尺寸：512x512, PNG格式)

---

## 💻 Windows用户：构建桌面应用

### 1️⃣ 准备图标
```bash
mkdir assets
# 保存图标到 assets/icon.png
```

### 2️⃣ 安装依赖
```bash
cd electron
npm install
```

### 3️⃣ 构建应用
```bash
npm run build:win
```

### 4️⃣ 查找安装包
```
release/NullTodo Setup 1.0.0.exe
```

---

## 📱 Android用户：构建APK

```bash
npx cap open android
```

在Android Studio中：
- 等待Gradle同步
- Build -> Build APK(s)

APK位置：`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🌸 鸿蒙用户：构建HAP

1. 打开 DevEco Studio
2. 导入 `harmony/` 项目
3. 配置签名
4. Build -> Build HAP(s)/APP(s)

---

## 📋 详细文档

- **多平台完整指南**：[MULTI_PLATFORM_BUILD.md](file:///d:/PersonalProject/MULTI_PLATFORM_BUILD.md)
- **移动应用详细指南**：[MOBILE_BUILD.md](file:///d:/PersonalProject/MOBILE_BUILD.md)

---

## ⚙️ 重要配置

### 后端服务
修改 `src/services/api.ts` 配置您的后端地址：
```typescript
const API_BASE_URL = 'http://your-server:5000/api';
```

### 首次安装
所有平台首次安装都是**干净状态**（无预设数据），用户可以：
- 重新创建任务
- 使用"备份同步"恢复数据

---

## ✅ 您现在可以开始构建了！

1. 📷 保存图标到 `assets/icon.png`
2. 💻 选择您的平台
3. 🚀 按照对应步骤构建

🎊 **祝您使用愉快！**
