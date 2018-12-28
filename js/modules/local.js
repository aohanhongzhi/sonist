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
const LYRICS_PATH = path.join(HOME_PATH, 'lyrics')

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
    },

    play(song, idx) {
      if (song.id === this.curr) {
        return
      }
      SONIST.play(idx).then(it => {
        this.__APP__.play(it)
        this.curr = it.id

        this.__updateSong__(it, idx)
      })
    },

    __updateSong__(it, idx) {
      if (!it.cover) {
        if (idx === undefined) {
          for (let i in this.list.$model) {
            if (this.list[i].id === it.id) {
              idx = i
              break
            }
          }
        }
        let _P = Promise.resolve(true)
        if (!it.kgHash) {
          _P = Api.search(`${it.artist} ${it.title}`).then(list => {
            if (list.length) {
              let { AlbumID, FileHash } = list[0]
              it.kgHash = FileHash
              it.albumId = AlbumID
              return true
            }
            return false
          })
        }
        _P.then(next => {
          if (next) {
            Api.getSongInfoByHash(it.kgHash, it.albumId).then(json => {
              it.album = json.album_name
              it.albumId = json.album_id
              it.kgHash = json.hash
              it.cover = json.img
              it.lyrics = path.join(LYRICS_PATH, `${it.id}.lrc`)

              this.list.set(idx, it)
              LS.insert(it)

              this.__APP__.updateCurr(it)
              this.__APP__.draw()

              fs.echo(json.lyrics, it.lyrics)
              fs.echo(JSON.stringify(LS.getAll(), '', 2), MUSIC_DB_PATH)
            })
          }
        })
      }
    },

    __checkSong__(el) {
      let song = this.__LIST__.pop()

      if (!song) {
        el.textContent = '重新扫描'
        el = null
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
          return this.__checkSong__(el)
        }
        let hash = crypto.md5Sign(song)
        if (LS.get(hash)) {
          return this.__checkSong__(el)
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
          this.__checkSong__(el)
        })
      })
    },
    refresh(ev) {
      if (this.__load__) {
        return
      }
      if (appInit.musicPath) {
        this.__load__ = layer.load(4)
        this.__LIST__ = fs.ls('/Volumes/extends/music')
        this.__NEW_NUM__ = 0
        ev.target.textContent = '正在扫描, 请稍候...'
        this.__checkSong__(ev.target)
      }
    }
  }
})
