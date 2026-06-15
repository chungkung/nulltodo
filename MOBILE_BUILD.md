# NullTodo 移动端构建指南

## ✅ 已完成
- 应用名称更新为 NullTodo
- Capacitor 6.x 已安装
- Web应用已构建
- Android平台已添加
- 应用已同步到Android

---

## 📱 构建Android应用

### 方式1: 使用Android Studio构建（推荐）

```bash
# 打开Android Studio
npx cap open android
```

在Android Studio中：
1. 等待Gradle同步完成
2. 点击 **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**
3. APK文件位置：`android/app/build/outputs/apk/debug/app-debug.apk`

### 方式2: 命令行构建

```bash
cd android
./gradlew assembleDebug
```

APK位置：`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🍎 构建iOS应用（需要macOS）

### 添加iOS平台（首次）
```bash
npx cap add ios
```

### 打开Xcode
```bash
npx cap open ios
```

在Xcode中：
1. 选择您的开发团队（签名）
2. 选择目标设备
3. 点击 **Product** -> **Archive**
4. 按照提示导出IPA文件

---

## 🔄 更新应用（有新版本）

```bash
# 1. 重新构建Web应用
npm run build:fast

# 2. 同步到原生平台
npx cap sync

# 3. 打开对应的IDE重新构建
npx cap open android  # 或 ios
```

---

## ⚙️ 配置说明

### 应用信息
- **应用名称**: NullTodo
- **包名**: com.nulltodo.app
- **版本**: 1.0.0

### 后端服务配置
移动端需要配置可公网访问的后端地址。修改`src/services/api.ts`：
```typescript
const API_BASE_URL = 'https://your-backend-domain.com/api';
```

### 首次安装注意
- 首次安装应用时默认无数据（干净状态）
- 用户可以重新创建任务
- 支持使用"备份同步"功能恢复数据

---

## 📋 项目结构
```
PersonalProject/
├── dist/              # 构建的Web应用
├── android/           # Android原生项目
├── src/               # 源代码
│   ├── components/
│   ├── pages/
│   └── ...
└── capacitor.config.json
```

---

## 🎯 快速开始

### 已经准备好了！直接运行：
```bash
# 构建APK
npx cap open android
# 然后在Android Studio中 Build APK
```

### 测试修改
```bash
npm run build:fast  # 快速构建Web
npx cap sync        # 同步到Android
npx cap open android  # 重新测试
```

---

## 📞 需要帮助？
- 查看 [Capacitor官方文档](https://capacitorjs.com/docs)
- Android Studio问题：检查JDK和SDK配置
- iOS问题：检查Xcode和开发者证书配置
