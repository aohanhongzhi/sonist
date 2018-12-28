const { app, BrowserWindow, protocol, Tray } = require('electron')
const path = require('path')
const fs = require('iofs')
const log = console.log

const ROOT = __dirname
const HOME = app.getPath('home')
const MIME_TYPES = {
  js: 'application/javascript',
  html: 'text/html',
  htm: 'text/html',
  css: 'text/css',
  jpg: 'image/jpg',
  png: 'image/png',
  gif: 'image/gif'
}

let win = null
let tray = null

function createWindow() {
  // 创建浏览器窗口
  win = new BrowserWindow({
    title: 'sonist',
    width: 1024,
    height: 600,
    frame: false,
    resizable: false,
    webPreferences: {
      webSecurity: false,
      experimentalFeatures: true
    }
  })

  // 然后加载应用的 index.html。
  win.loadURL('app://sonist/index.html')
}
app.commandLine.appendSwitch('--autoplay-policy', 'no-user-gesture-required')
app.setPath('appData', path.resolve(HOME, '.sonist/'))
protocol.registerStandardSchemes(['app'], { secure: true })

let appPath = app.getPath('appData')
if (!fs.exists(appPath)) {
  fs.mkdir(appPath)
  fs.echo('{}', path.join(appPath, 'app.ini'))
  fs.echo('[]', path.join(appPath, 'music.db'))
}

//  创建窗口
app.on('ready', () => {
  protocol.registerBufferProtocol('app', (req, cb) => {
    let file = req.url.replace(/^app:\/\/sonist\//, '')
    let ext = path.extname(req.url).slice(1)
    let buf = fs.cat(path.resolve(ROOT, file))
    cb({ data: buf, mimeType: MIME_TYPES[ext] })
  })

  tray = new Tray('./images/trays/trayTemplate.png')

  tray.on('click', _ => {
    win.show()
  })

  createWindow()
  win.tray = tray
  win.webContents.openDevTools()
})
