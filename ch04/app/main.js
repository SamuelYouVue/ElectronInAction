const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');

let mainWindow = null;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            // webSecurity: false,
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });
    mainWindow.loadFile(`${__dirname}/index.html`);
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        //getFileFromUser();
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});

const getFileFromUser = exports.getFileFromUser = () => {
    const files = dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'Text Files', extensions: ['txt'] },
            { name: 'Markdown Files', extensions: ['md', 'markdown'] }
        ]
    }).then((result) => {
        if (!result || result.filePaths.length === 0) {
            return;
        }
        console.log(result);
        const file = result.filePaths[0];
        openFile(file);
    });
};

const openFile = (file) => {
    const content = fs.readFileSync(file).toString();
    mainWindow.webContents.send('file-opened', file, content);
};