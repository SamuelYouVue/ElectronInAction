const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');

const windows = new Set();
const openFiles = new Map();

app.on('ready', () => {
    createWindow();
});
app.on('will-finish-launching', () => {
    app.on('open-file', (event, file) => {
        const win = createWindow();
        win.once('ready-to-show', () => {
            openFile(win, file);
        });
    });
});
app.on('window-all-closed', () => {
    if (process.platform === 'darwin') {
        return false;
    }
    console.log(process.platform);
    app.quit();
});

app.on('activate', (event, hasVisibleWindows) => {
    if (!hasVisibleWindows) { createWindow(); }
});

const createWindow = exports.createWindow = () => {
    let x, y;
    const currentWindow = BrowserWindow.getFocusedWindow();
    if (currentWindow) {
        const [currentWindowX, currentWindowY] = currentWindow.getPosition();
        x = currentWindowX + 10;
        y = currentWindowY + 10;
    }
    let newWindow = new BrowserWindow({
        x,
        y,
        show: false,
        webPreferences: {
            // webSecurity: false,
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });
    newWindow.loadFile(`${__dirname}/index.html`);
    newWindow.once('ready-to-show', () => {
        newWindow.show();
    });
    newWindow.on('close', (event) => {
        if (newWindow.isDocumentEdited()) {
            event.preventDefault();
            const result = dialog.showMessageBox(newWindow, {
                type: 'warning',
                title: 'Quit with Unsaved Changes?',
                message: 'Your changes will be lost if you do not save.',
                buttons: [
                    'Quit Anyway',
                    'Cancel',
                ],
                defaultId: 0,
                cancelId: 1
            });
            if (result === 0) newWindow.destroy();
        }
    });
    newWindow.on('closed', () => {
        windows.delete(newWindow);
        stopWatchingFile(newWindow);
        newWindow = null;
    });
    windows.add(newWindow);
    return newWindow;
};

const getFileFromUser = exports.getFileFromUser = (targetWindow) => {
    const files = dialog.showOpenDialog(targetWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'Markdown Files', extensions: ['md', 'markdown'] },
            { name: 'Text Files', extensions: ['txt'] },
        ]
    }).then((result) => {
        if (!result || result.filePaths.length === 0) {
            return;
        }
        console.log(result);
        const file = result.filePaths[0];
        openFile(targetWindow, file);
    });
};

const openFile = (targetWindow, file) => {
    const content = fs.readFileSync(file).toString();
    app.addRecentDocument(file);
    targetWindow.setRepresentedFilename(file);
    targetWindow.webContents.send('file-opened', file, content);
    startWatchingFile(targetWindow, file);
};

const saveHtml = exports.saveHtml = (targetWindow, content) => {
    const file = dialog.showSaveDialog(targetWindow, {
        title: 'Save HTML',
        defaultPath: app.getPath('documents'),
        buttonLabel: "Save Html(s)",
        filters: [
            { name: 'HTML Files', extensions: ['html', 'htm'] }
        ]
    }).then((result) => {
        if (!result || !result.filePath) {
            return;
        }
        console.log(result);
        const file = result.filePath;
        fs.writeFileSync(file, content);
    });
};

const saveMarkdown = exports.saveMarkdown = (targetWindow, file, content) => {
    if (!file) {
        dialog.showSaveDialog(targetWindow, {
            title: 'Save Markdown',
            defaultPath: app.getPath('documents'),
            filters: [
                { name: 'Markdown Files', extensions: ['md', 'markdown'] }
            ]
        }).then((result) => {
            if (!result || !result.filePath) {
                return;
            }
            file = result.filePath;
            if (!file) return;
            fs.writeFileSync(file, content);
            openFile(targetWindow, file);
        });
    } else {
        if (!file) return;
        fs.writeFileSync(file, content);
        openFile(targetWindow, file);
    }
};

const startWatchingFile = (targetWindow, file) => {
    stopWatchingFile(targetWindow);
    const watcher = fs.watchFile(file, (prev, curr) => {
        const content = fs.readFileSync(file).toString();
        targetWindow.webContents.send('file-changed', file, content);
    });
    openFiles.set(targetWindow, watcher);
};
const stopWatchingFile = (targetWindow) => {
    if (openFiles.has(targetWindow)) {
        openFiles.get(targetWindow).stop();
        openFiles.delete(targetWindow);
    }
};