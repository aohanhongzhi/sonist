/**
 * 设置模块
 * @author yutent<yutent@doui.cc>
 * @date 2018/12/27 02:02:54
 */

'use strict'

import '/dist/form/index.js'

const fs = require('iofs')
const path = require('path')
const { app, dialog } = require('electron').remote
const log = console.log

const HOME_PATH = app.getPath('appData')
const APP_INI_PATH = path.join(HOME_PATH, 'app.ini')

let appInit = fs.cat(APP_INI_PATH)

appInit = JSON.parse(appInit)

export default Anot({
  $id: 'profile',
  state: {
    setting: {
      autoPlay: appInit.autoPlay,
      autoLrc: appInit.autoLrc,
      musicPath: appInit.musicPath
    }
  },
  methods: {
    __init__() {},
    openDir() {
      dialog.showOpenDialog(
        {
          properties: ['openDirectory'],
          defaultPath: app.getPath('home')
        },
        dir => {
          if (dir) {
            this.setting.musicPath = dir[0]
          }
        }
      )
    },
    save() {
      let setting = this.setting.$model

      Object.assign(appInit, setting)

      fs.echo(JSON.stringify(appInit, '', 2), APP_INI_PATH)

      layer.toast('保存成功')
    }
  }
})
