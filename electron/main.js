const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  // 直接在根目录下找 index.html
  const indexPath = path.join(__dirname, 'index.html');
  
  console.log('🚀 NullTodo 启动...');
  console.log('📂 目录:', __dirname);
  console.log('📄 加载路径:', indexPath);
  console.log('📁 目录内容:', fs.readdirSync(__dirname));
  
  const windowOptions = {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // 禁用Web安全策略，避免file://协议的问题
    }
  };

  const win = new BrowserWindow(windowOptions);

  // 先打开开发者工具方便调试
  win.webContents.openDevTools();

  if (fs.existsSync(indexPath)) {
    console.log('✅ 找到 index.html，正在加载...');
    
    // 在加载前，先打印一下文件内容的前200字符确认
    const content = fs.readFileSync(indexPath, 'utf8');
    console.log('📄 index.html开头:', content.substring(0, 300));
    
    win.loadFile(indexPath);
  } else {
    console.error('❌ 找不到 index.html');
    win.loadURL(`data:text/html;charset=utf-8,
      <html>
        <head>
          <style>
            body { 
              background: #0f172a; 
              color: white; 
              font-family: system-ui; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh;
              margin: 0;
            }
            .container { text-align: center; }
            h1 { color: #60a5fa; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ 找不到资源</h1>
            <p>找不到 index.html</p>
            <p>路径: ${indexPath}</p>
            <p>__dirname: ${__dirname}</p>
          </div>
        </body>
      </html>
    `);
  }

  // 创建菜单模板
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '视图',
      submenu: [
        {
          label: '重新加载',
          accelerator: 'CmdOrCtrl+R',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.reload();
            }
          }
        },
        {
          label: '开发者工具',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.toggleDevTools();
            }
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
