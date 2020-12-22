const electron = require("electron");
const { app, ipcMain, ipcRenderer, dialog, shell } = electron;
const BrowserWindow = electron.BrowserWindow;
const fs = require("fs");

const os = require("os");
const path = require("path");
const isDev = require("electron-is-dev");
const FormData = require("form-data");
const axios = require("axios");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
    icon: __dirname + "/icon.png",
  });

  if (!isDev) {
    mainWindow.removeMenu();
  }

  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );
  mainWindow.on("closed", () => (mainWindow = null));
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.handle("getDirectorySelection", async (event, args) => {
  return await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
});

const homedir = os.homedir();
const CONFIG_PATH = path.join(homedir, ".raid-gatherer-config.json");

ipcMain.handle("getBossNames", async (event, args) => {
  const directory = args.selectedFolder;
  const children = await fs.promises.readdir(directory, {
    withFileTypes: true,
  });
  
  return children
    .filter(c => c.isDirectory())
    .map(c => c.name);
})

ipcMain.handle("getUserConfig", async (event, args) => {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  const data = fs.readFileSync(CONFIG_PATH);
  return JSON.parse(data);
});

ipcMain.handle("sendFileWithinTimes", async (event, args) => {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({selectedFolder: args.selectedFolder}));
    const arr = await recursiveSearch(event, args);
    return await Promise.all(arr);
  } catch (err) {
    return { error: err, message: "There was en error trying to process your files. Check your log directory is correct." }
  }
});

ipcMain.handle("openLink", (event, link) => {
  shell.openExternal(link);
});

const recursiveSearch = async (event, args) => {
  const { selectedFolder, foldersToUse } = args; 
  const children = await fs.promises.readdir(selectedFolder, {
    withFileTypes: true,
  });
  let matches = [];
  for (const child of children) {
    const fullPath = path.join(selectedFolder, child.name);
    if (child.isDirectory()) {
      const arr = await recursiveSearch(event, {
        ...args,
        selectedFolder: fullPath,
      });
      matches = matches.concat(arr);
    } else {
      if (!foldersToUse.some(f => fullPath.includes(f))) continue;
      const stat = await fs.promises.stat(fullPath);
      const lastModified = new Date(stat.mtime);
      if (
        lastModified - args.fullStartTime > 0 &&
        lastModified - args.fullEndTime < 0
      ) {
        matches.push(
          sendToDPSReport(fullPath)
            .then((res) => {
              event.sender.send("addLink", res.data.permalink);
              return true;
            })
            .catch((err) => {
              console.log(`Error on ${fullPath}. ${err.message}`);
              return false;
            })
        );
      }
    }
  }
  return matches;
};

const sendToDPSReport = async (fullPath) => {
  const formData = new FormData();
  formData.append("json", 1);
  formData.append("file", fs.createReadStream(fullPath));
  return await axios({
    method: "post",
    url: "https://dps.report/uploadContent",
    data: formData,
    headers: {
      "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
    },
  });
};
