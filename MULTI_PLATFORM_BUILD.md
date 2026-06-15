# NullTodo 多平台构建指南

## 📱 支持的平台
- ✅ Android (APK)
- ✅ Windows 64位 (NSIS安装包)
- ✅ 鸿蒙原生应用
- 🔜 iOS (需要macOS)

---

## 🎨 应用图标
使用提供的精美图标！请将图标保存为：
- `assets/icon.png` (主图标，推荐尺寸512x512)

---

## 💻 Windows 64位桌面应用 (Electron)

### 📋 前置要求
- Node.js 18+
- Windows 10/11 (64位)

### 🚀 构建步骤

#### 1. 准备图标
```bash
# 在项目根目录创建assets文件夹
mkdir assets
# 将您的图标保存为 assets/icon.png
```

#### 2. 安装依赖
```bash
cd electron
npm install
```

#### 3. 构建应用
```bash
# 方式1: 完整构建 (推荐)
npm run build:win

# 方式2: 分步构建
npm run build-web    # 构建Web应用
npm run dist         # 打包Electron
```

#### 4. 查找安装包
构建完成后，安装包在：
```
release/NullTodo Setup 1.0.0.exe
```

#### 5. 开发测试
```bash
# 开发模式运行
npm start
```

---

## 🌸 鸿蒙应用

### 📋 前置要求
- DevEco Studio 4.0+
- HarmonyOS SDK 12+
- Node.js 18+

### 🚀 构建步骤

#### 1. 准备项目
```bash
# 将harmony/文件夹作为项目根目录
# 或在DevEco Studio中导入整个harmony/文件夹
```

#### 2. 配置Web资源
```bash
# 在项目根目录构建Web应用
npm run build:fast

# 复制dist/内容到鸿蒙项目的webview资源文件夹
# (具体位置取决于您的鸿蒙项目架构)
```

#### 3. 使用DevEco Studio
1. 打开 DevEco Studio
2. 导入 `harmony/` 项目
3. 配置签名证书
4. 连接鸿蒙设备或启动模拟器
5. 点击 **Build** -> **Build HAP(s)/APP(s)**

#### 4. 使用命令行
```bash
# 使用hvigorw构建
cd harmony
hvigorw assembleHap
```

#### 5. 项目架构说明
```
harmony/
├── AppScope/
│   ├── app.json5          # 应用配置
│   └── resources/
│       └── base/
│           └── element/
│               └── string.json  # 字符串资源
├── entry/
│   └── src/main/
│       ├── ets/          # ArkTS代码
│       ├── resources/    # 资源文件
│       └── module.json5  # 模块配置
└── build-profile.json5
```

---

## 📱 Android应用 (已有)

参考之前的 [MOBILE_BUILD.md](file:///d:/PersonalProject/MOBILE_BUILD.md)

```bash
npx cap open android
# 在Android Studio中构建APK
```

---

## 🍎 iOS应用 (需要macOS)

```bash
# 添加iOS平台
npx cap add ios

# 打开Xcode
npx cap open ios
```

---

## 📁 项目结构总览

```
PersonalProject/
├── src/                      # 源代码
├── dist/                     # 构建的Web应用
├── android/                  # Android原生项目
├── electron/                 # Electron桌面应用
│   ├── main.js
│   └── package.json
├── harmony/                  # 鸿蒙应用
│   ├── AppScope/
│   └── entry/
├── assets/                   # 资源文件
│   └── icon.png             # 应用图标
├── release/                  # 发布输出 (自动生成)
├── MOBILE_BUILD.md          # 移动端构建指南
└── MULTI_PLATFORM_BUILD.md   # 本文档
```

---

## 🎯 快速开始

### Windows用户
```bash
cd electron
npm install
npm run build:win
```

### 鸿蒙开发者
1. 用DevEco Studio打开 `harmony/`
2. 配置签名
3. 构建HAP

### Android用户
```bash
npx cap open android
```

---

## ⚙️ 配置后端服务

所有平台都需要后端服务。修改 `src/services/api.ts`：

```typescript
const API_BASE_URL = 'http://your-backend-server:5000/api';
// 或公网地址：
// const API_BASE_URL = 'https://your-domain.com/api';
```

重新构建对应平台即可生效。

---

## 🔄 更新应用流程

```bash
# 1. 更新Web应用
npm run build:fast

# 2. 更新各平台
# Windows: cd electron && npm run build:win
# Android: npx cap sync && npx cap open android
# 鸿蒙: 复制dist到项目资源
```

---

## ❓ 常见问题

### Windows构建问题
- 确保Python和Visual Studio Build Tools已安装
- 检查网络连接 (Electron需要下载二进制文件)

### 鸿蒙构建问题
- 确保使用正确的DevEco Studio版本
- 检查签名配置
- 确保SDK和API版本匹配

### 图标问题
- 建议图标尺寸512x512
- 格式PNG
- 保存到 `assets/icon.png`

---

## 📞 需要帮助？

- **Electron**: https://www.electronjs.org/docs
- **鸿蒙**: https://developer.huawei.com/consumer/cn/
- **Capacitor**: https://capacitorjs.com/docs

---

## ✅ 构建检查清单

- [ ] 图标已保存到 `assets/icon.png`
- [ ] Web应用已构建 (`npm run build:fast`)
- [ ] 后端API地址已配置
- [ ] 对应平台依赖已安装
- [ ] 签名/证书已配置 (如需要)

🎉 **祝构建顺利！**
