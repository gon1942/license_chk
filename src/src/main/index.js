import {
  Tray,
  app,
  BrowserWindow,
  Menu,
  electron,
  ipcMain
} from 'electron'
import pkg from '../../package.json'
import windowStateKeeper from 'electron-window-state';

import {
  v4 as uuidv4
} from 'uuid';
import sysinfo from 'systeminformation';
import fs from 'fs';
import request from 'request';
import log from 'electron-log';
log.transports.file.level = 'info';
log.transports.file.resolvePath = () => process.cwd() + '/.config/hamonikrAuth/logs/mainlog.log';

require('@electron/remote/main').initialize()

// set app name
app.name = pkg.productName

// to hide deprecation message
app.allowRendererProcessReuse = true

// disable electron warning
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = false

const gotTheLock = app.requestSingleInstanceLock()
const isDev = process.env.NODE_ENV === 'development'
const isDebug = process.argv.includes('--debug')
let mainWindow
var folderDir = '/.config/hamonikrAuth/configSysInfo/'
var fileDir = '/.config/hamonikrAuth/configSysInfo/sysInfo.hmkr'
var licenseFileDir = '/.config/hamonikrAuth/configSysInfo/license.hmkr'

let trayIcon = null;
/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */



// only allow single instance of application
if (!isDev) {
  if (gotTheLock) {
    app.on('second-instance', () => {
      // Someone tried to run a second instance, we should focus our window.
      if (mainWindow && mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()
    })
  } else {
    app.quit()
    process.exit(0)
  }
} else {
  // process.env.ELECTRON_ENABLE_LOGGING = true

  require('electron-debug')({
    showDevTools: false,
  })
}

let position_x = '';
let position_y = '';
async function createWindow() {

  const {
    screen
  } = require('electron')
  let display = screen.getPrimaryDisplay();
  let bounds = screen.getPrimaryDisplay().bounds;
  position_x = bounds.x + ((bounds.width - 960) / 2);
  position_y = bounds.y + ((bounds.height - 540) / 2);


  mainWindow = new BrowserWindow({
    backgroundColor: '#fff',
    x: position_x,
    y: position_y,
    width: 800,
    height: 400,
    // width: 960,
    // height: 540,
    minWidth: 800,
    minHeight: 400,
    // useContentSize: true,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: false,
      contextIsolation: false,
      webSecurity: false,
    },
    show: false,
    // icon: `${__dirname}/assets/icon.ico`,
  })

  // setMenu()

    mainWindow.setMenu(null);
    mainWindow.setMenuBarVisibility(false);
    mainWindow.setAlwaysOnTop(true, 'screen');

  // load root file/url
  if (isDev) {
    mainWindow.loadURL('http://localhost:9080')
  } else {
    mainWindow.loadFile(`${__dirname}/index.html`)
    global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
  }

  // Show when loaded
  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  })

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
app.on('ready', () => {

  createWindow();
  createTray();

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  if (isDebug) {
    mainWindow.webContents.openDevTools()
  }

})

const toggleWindow = () => {
  mainWindow.isVisible() ? mainWindow.hide() : showWindow();
}
const showWindow = () => {
  const position = getWindowPosition();
  mainWindow.setPosition(position.x, position.y, false);
  mainWindow.show();
}
const getWindowPosition = () => {
  return {
    x: position_x,
    y: position_y
  }
}


const createTray = () => {
  const iconName = '/logo.png';
  log.info("__dirname===========>"+ __dirname);
  log.info("__static===========>"+ __static);

  const iconPath = require('path').join(__static, iconName);
  trayIcon = new Tray(iconPath);
  
  const trayMenuTemplate = [{
      label: 'Hamonikr-Auth',
      //enabled: false
      click: function () {
        // toggleWindow();
        showWindow();
      }
    }
    // {
    //   label: 'devTool',
    //   click: function () {
    //     mainWindow.webContents.openDevTools()
    //   }
    // },
    ,{
      label: 'Quit',
      click: () => {
        // mainWindow.close();
        app.quit();
        app.exit();
      }
    }
  ]

  let trayMenu = Menu.buildFromTemplate(trayMenuTemplate)
  // trayIcon.setTitle('hamonikrAuth');
  trayIcon.setContextMenu(trayMenu)
}


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})


const sendMenuEvent = async (data) => {
  mainWindow.webContents.send('change-view', data)
}

const template = [{
    label: app.name,
    submenu: [{
        label: 'Home',
        accelerator: 'CommandOrControl+H',
        click() {
          sendMenuEvent({
            route: '/'
          })
        },
      },
      {
        type: 'separator'
      },
      {
        type: 'separator'
      },
      // { role: 'quit', accelerator: 'Alt+F4' },
    ],
  },
  {
    role: 'help',
    submenu: [{
        label: 'Get Help',
        role: 'help',
        accelerator: 'F1',
        click() {
          sendMenuEvent({
            route: '/help'
          })
        },
      },
      {
        label: 'About',
        role: 'about',
        accelerator: 'CommandOrControl+A',
        click() {
          sendMenuEvent({
            route: '/about'
          })
        },
      },
    ],
  },
]

function setMenu() {
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [{
          role: 'about'
        },
        {
          type: 'separator'
        },
        {
          role: 'services'
        },
        {
          type: 'separator'
        },
        {
          role: 'hide'
        },
        {
          role: 'hideothers'
        },
        {
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          role: 'quit'
        },
      ],
    })

    template.push({
      role: 'window',
    })

    template.push({
      role: 'help',
    })

    template.push({
      role: 'services'
    })
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}


let pushRenderer = null;

ipcMain.on("readLiecenseFile", async (event, args) => {
  log.info(`Application Init License Data & File Check] START- readLiecenseFile Action()`);

  // License File & Data Check , Result N/data
  let isFileData = await do_readLiecenseFile(args);
  log.info(`Application Init License Data & File Check] Result :: ${isFileData}`);

  pushRenderer = event.sender;
  pushRenderer.send("readLiecenseFileResult", isFileData);

});




// 라이선스 넘버 체크] ##############################################

/**
 * 라이선스 등록 프로세스 
 * machineIdAsync() > isOsMachineIdData() > licenseSubmitProc()
 * 1. Create file => MachineId + Application UUID)  머신아이디:앱아이디 형식으로 생성하여 파일로 저장, 파일 경로 /configSysInfo/sysInfo.hmkr 
 * 2. 생성된 값을 서버에 전달하여 체크 
 *  
 */
ipcMain.on("machineIdAsync", async (event, args) => {
  log.info("License Add STEP 1 ] MachineId + AppUUID Create Action Start ####################");
  try {
    log.info("License Add STEP 1-1 ] - MachineId + AppUUID file dir is ::: " + process.cwd() + fileDir);

    // 파일 정보가 없는경우 N, 있는경우 시스템 정보 데이터 
    var machineIdChk = await getOsMachineId(process.cwd() + fileDir);
    log.info("License Add STEP 1-2 ] - SystemInfo file Check is ::: " + machineIdChk);

    // 시스템 파일 정보가 없는경우
    if (machineIdChk == 'N') {
      var uniqid = require('uniqid');
      var appUUID = uniqid() + (new Date()).getTime().toString(36);
      const pcUuid = (await sysinfo.uuid());
      log.info("License Add STEP 1-3 ] - MachineId Value is ::: " + pcUuid + ",  App UUID Value is ::: " + appUUID);

      // 파일 저장
      var createMachineId = await userOsMachineIdWriteFile(pcUuid.os + ":" + appUUID);
      log.info("License Add STEP 1-4 ] - create File  is  ::: " + createMachineId);

      if (createMachineId == 'Y') {
        // 저장된 파일 정보를 가져온다. 
        var systemInfoVal = await getOsMachineId(process.cwd() + fileDir);
        log.info("License Add STEP 1-5 ] - create File  is  ::: " + systemInfoVal);
        event.sender.send('isOsMachineIdData', systemInfoVal);
      }
    } else {
      event.sender.send('isOsMachineIdData', machineIdChk);
    }
  } catch (err) {
    log.info("#### License Add STEP 1 ]  #### ");
    return Object.assign(err);
  }

});

/**
 * 인증완료된 라이선스 정보를 파일로 저장한다. 
 */
ipcMain.on('licenseSubmitProc', (event, licenseNo) => {
  log.info("License Add STEP 2 ] License Info Save Start =====================");
  makeRecursiveFileAsync(event, licenseNo);
});

const makeRecursiveFileAsync = async (event, licenseNo) => {
  try {
    // Save License Info Data 
    var lcnsChkVal = await userLcnsInfoWriteFile(licenseNo);
    log.info("License Add STEP 2-1 ]  License Info Data Is :: " + licenseNo + ", is Save :: " + lcnsChkVal);
    if (lcnsChkVal == 'Y') {
      event.sender.send('isBoolLicense');
    }

  } catch (err) {
    log.info(" #### License Add STEP 2  ####");
    return Object.assign(err);
  }
}

//========================================================================

function getOsMachineId(_fileDir) {
  return new Promise(function (resolve, reject) {
    fs.readFile(_fileDir, 'utf-8', (err, data) => {
      if (err) {
        return resolve("N");
      } else {
        return resolve(data);
      }
    });
  });
}

function userLcnsInfoWriteFile(licenseNo) {
  return new Promise(function (resolve, reject) {
    if (!fs.existsSync(licenseFileDir)) {
      fs.writeFile(process.cwd() + licenseFileDir, licenseNo, (err) => {
        if (err) {
          reject("error");
          log.info("#### userLcnsInfoWriteFile   #### " + err.message);
        }
        resolve("Y");
      });

    } else {
      fs.writeFile(process.cwd() + licenseFileDir, licenseNo, (err) => {
        if (err) {
          reject("error");
          log.info("#### userLcnsInfoWriteFile   #### " + err.message);
        }
        resolve("Y");
      });
    }
  });
}

const createDir = (dirPath) => {
  fs.mkdirSync(process.cwd() + dirPath, {
    recursive: true
  }, (error) => {
    if (error) {
      log.info("#### CreateDir Action Result is   #### " + error);
    } else {
      log.info("CreateDir Action Result Is Success")
    }
  });
}

const createFile = (filePath, fileContent) => {
  fs.writeFile(process.cwd() + filePath, fileContent, (error) => {
    if (error) {
      log.info("#### CreateFile Action Result  ####" + error);
    } else {
      log.info("CreateFile Action Result is Success")
    }
  })
}

function userOsMachineIdWriteFile(uuidData) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(fileDir)) {
      try {
        createDir(folderDir);
        createFile(fileDir, uuidData);
        resolve('Y');
      } catch {
        resolve('N');
      }
    }
  });
}


function do_readLiecenseFile(arg) {
  return new Promise(function (resolve, reject) {

    var osType = require('os');
    fs.readFile(process.cwd() + licenseFileDir, 'utf-8', (err, data) => {
      if (err) {
        log.info("#### do_readLiecenseFile  #### " + err);
        return resolve("N");
      } else {
        log.info("do_readLiecenseFile Result Data Is ::: " + data);
        resolve(uuid_db_chk(data, arg));
      }
    });
  });
}

// 라이선스 체크 (리턴값: 사용기간 유무)
function uuid_db_chk(arg) {
  return new Promise((resolve, reject) => {
    const formData = {
      usedUserLicenseUUID: arg.trim()
    };
    request.post({
      url: "http://192.168.0.118:8090/restapi/licenseChk",
      formData: formData
    }, async (err, response, body) => {
      if (err) return reject(err);
      const result = JSON.parse(body);
      log.info(`uuid_db_chk Action Result Data is ::: ${result.output}`)
      resolve(result.output);
    });
  });
}


// // (Polling) 라이선스 체크  
// const Poller = require('./Poller');
// let poller = new Poller(10000);

// poller.onPoll(async () => {
//   let isdata = await do_readLiecenseFile();
//   log.info(`License Check Polling ]  License Auth Is :: ${isdata}`);
//   if (isdata == 'N') {
//     if (isDev) {
//       mainWindow.loadURL('http://localhost:9080/#/about')
//     } else {
//       mainWindow.loadFile(`${__dirname}/about`)
//     }
//     mainWindow.setMenu(null);
//     mainWindow.setMenuBarVisibility(false);
//     mainWindow.setAlwaysOnTop(true, 'screen');
//     // mainWindow.setKiosk(true);
//     mainWindow.show();
//     mainWindow.webContents.openDevTools()
//   }

//   poller.poll(); // Go for the next poll

// });

// // Initial start
// poller.poll();



ipcMain.on("ChkLicenseProc", async (event, args) => {
  let isdata = await do_readLiecenseFile();
  log.info(`ChkLicenseProc Result ::: ${isdata}` );
  if (isdata == 'N') {
    mainWindow.show()
    pushRenderer = event.sender;
    pushRenderer.send("ChkLicenseProcResult", isdata);
  }

});
