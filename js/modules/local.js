/**
 * 本地音乐模块
 * @author yutent<yutent@doui.cc>
 * @date 2018/12/24 17:00:48
 */

'use strict'

import Api from '/js/api.js'
import { ID3 } from '/dist/audio/index.js'

const fs = require('iofs')
const path = require('path')
const crypto = require('crypto.js')
const { app, dialog } = require('electron').remote

const log = console.log
const HOME_PATH = app.getPath('appData')
const MUSIC_DB_PATH = path.join(HOME_PATH, 'music.db')

let appInit = {}
let dbCache = fs.cat(MUSIC_DB_PATH)
dbCache = JSON.parse(dbCache)

export default Anot({
  $id: 'local',
  state: {
    list: [],
    curr: '',
    __APP__: null
  },
  mounted() {
    LS.insert(dbCache)
    appInit = JSON.parse(Anot.ss('app-init'))

    dbCache = null
    this.__APP__ = Anot.vmodels.app
    this.list = LS.getAll()
    let lastPlay = Anot.ls('last-play') || 0

    SONIST.clear()
    SONIST.push(LS.getAll())

    // if (appInit.autoPlay) {
    //   SONIST.play(lastPlay).then(it => {
    //     this.__APP__.play(it)
    //     this.curr = it.id
    //   })
    // }
  },
  watch: {
    'props.curr'(v) {
      this.curr = v
    }
  },
  methods: {
    __init__() {
      appInit = JSON.parse(Anot.ss('app-init'))
      log(appInit)
    },

    play(idx) {
      SONIST.play(idx).then(it => {
        this.__APP__.play(it)
        this.curr = it.id
      })
    },

    __checkSong__() {
      let song = this.__LIST__.pop()

      if (!song) {
        if (this.__NEW_NUM__ > 0) {
          dbCache = LS.getAll()
          this.list.clear()
          this.list.pushArray(dbCache)
          SONIST.clear()
          SONIST.push(dbCache)
          fs.echo(JSON.stringify(dbCache, '', 2), MUSIC_DB_PATH)
          dbCache = null
        }

        layer.close(this.__load__)
        layer.toast(`刷新缓存完成,新增${this.__NEW_NUM__}首`)
        delete this.__load__
        return
      }

      Anot.nextTick(() => {
        let name = path.basename(song)
        if (name.startsWith('.')) {
          return this.__checkSong__()
        }
        let hash = crypto.md5Sign(song)
        if (LS.get(hash)) {
          return this.__checkSong__()
        }
        this.__NEW_NUM__++
        ID3(song).then(tag => {
          LS.insert({
            id: hash,
            title: tag.title,
            album: tag.album,
            artist: tag.artist,
            path: `file://${song}`,
            duration: tag.duration
          })
          this.__checkSong__()
        })
      })
    },
    refresh() {
      if (this.__load__) {
        return
      }
      if (appInit.musicPath) {
        this.__load__ = layer.load(4)
        this.__LIST__ = fs.ls('/Volumes/extends/music')
        this.__NEW_NUM__ = 0
        this.__checkSong__()
      }
    }
  }
})
