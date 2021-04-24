const { app, BrowserWindow } = require('electron');

let mainWindow = null;

app.on('ready', () => {
    console.log('Hello from Electron');
    mainWindow = new BrowserWindow(
        {    
            webPreferences: {
                devTools: true,
                contextIsolation: false,
                nodeIntegration: true
            }
        }
    );
    console.log(`${__dirname}`);
    mainWindow.webContents.loadURL(`file://${__dirname}/index.html`); // #A
});