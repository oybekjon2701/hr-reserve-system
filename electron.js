const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow = null;
let serverInstance = null;
const BASE_PORT = 17832;

function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const srv = http.createServer();
    srv.listen(startPort, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'HR Rezerv Tizimi',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    show: false,
    backgroundColor: '#f9fafb',
    autoHideMenuBar: true
  });

  mainWindow.loadURL(url);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    shell.openExternal(targetUrl);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const port = await findAvailablePort(BASE_PORT);
  process.env.PORT = port;

  // Start the Express backend
  require(path.join(__dirname, 'backend', 'server'));

  // Wait for DB init and server startup
  await new Promise((resolve) => setTimeout(resolve, 2000));

  createWindow(`http://localhost:${port}`);
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    app.whenReady().then(async () => {
      const port = await findAvailablePort(BASE_PORT);
      process.env.PORT = port;
      require(path.join(__dirname, 'backend', 'server'));
      await new Promise((resolve) => setTimeout(resolve, 2000));
      createWindow(`http://localhost:${port}`);
    });
  }
});
