/**
 * {sonist app}
 * @author yutent<yutent@doui.cc>
 * @date 2018/12/16 17:15:57
 */

import '/dist/anot.next.js'
import layer from '/dist/layer/index.js'
import store from '/dist/store/index.js'
import AudioPlayer from '/dist/audio/index.js'

import Api from '/js/api.js'

import Artist from '/js/modules/artist.js'
import Local from '/js/modules/local.js'

const log = console.log

const fs = require('iofs')
const path = require('path')
const crypto = require('crypto.js')
const { exec } = require('child_process')
const {
  remote: { app }
} = require('electron')

const HOME_PATH = app.getPath('appData')
const APP_INI_PATH = path.join(HOME_PATH, 'app.ini')
const MUSIC_DB_PATH = path.join(HOME_PATH, 'music.db')
const PLAY_MODE = {
  0: 'all',
  1: 'single',
  2: 'random'
}
const FONTS_NAME =
  ' Helvetica, Arial,"WenQuanYi Micro Hei","PingFang SC","Hiragino Sans GB","Segoe UI", "Microsoft Yahei", sans-serif'

// 本地音乐和试用音乐列表
window.LS = store.collection('local')
window.TS = store.collection('temp')
//  音乐播放器
window.SONIST = new AudioPlayer()

let appInit = fs.cat(APP_INI_PATH)
let dbCache = fs.cat(MUSIC_DB_PATH)

dbCache = JSON.parse(dbCache)
appInit = JSON.parse(appInit)
LS.insert(dbCache)

dbCache = null

let list = fs.ls('/Volumes/extends/music')

let hasNew = false
// list.forEach(it => {
//   let name = path.basename(it)
//   if (name.startsWith('.')) {
//     return
//   }
//   let hash = crypto.md5Sign(it)
//   if (LS.get(hash)) {
//     return
//   }
//   hasNew = true
//   AudioPlayer.ID3(it).then(tag => {
//     LS.insert({
//       id: hash,
//       title: tag.title,
//       album: tag.album,
//       artist: tag.artist,
//       path: `file://${it}`,
//       duration: tag.duration
//     })
//   })
// })

if (hasNew) {
  setTimeout(() => {
    dbCache = JSON.stringify(LS.getAll(), '', 2)
    log(dbCache, MUSIC_DB_PATH)
    fs.echo(dbCache, MUSIC_DB_PATH)
  }, 500)
}

Anot({
  $id: 'app',
  state: {
    theme: 1, // 1:macos, 2: deepin
    winFocus: true,
    mod: 'local',
    playMode: Anot.ls('play-mode') >>> 0, // 0:all | 1:single |  2:random
    isPlaying: false,
    curr: {
      id: '',
      index: 0,
      title: '',
      artist: '',
      album: '',
      time: 0,
      duration: 0
    },

    currTimeBar: '',
    currTimeBarPercent: 0,
    __DEG__: 0.01
  },
  skip: [],
  computed: {
    views() {
      if (!this.mod) {
        return
      }
      return '/views/' + this.mod + '.htm'
    }
  },
  watch: {
    'curr.*'() {
      let { time, duration } = this.curr
      let x = time / duration

      this.currTimeBar = `matrix(1, 0, 0, 1, ${x * this.__TB_WIDTH__}, 0)`
      this.currTimeBarPercent = 100 * x + '%'
    },
    mod(val) {
      this.activeModule(val)
    }
  },
  mounted() {
    let canvas = this.$refs.player

    // 画布放大4倍, 以解决模糊的问题
    this.__WIDTH__ = canvas.clientWidth * 4
    this.__HEIGHT__ = canvas.clientHeight * 4

    canvas.width = this.__WIDTH__
    canvas.height = this.__HEIGHT__
    this.__CTX__ = canvas.getContext('2d')

    // 修改歌曲进度
    canvas.addEventListener(
      'click',
      ev => {
        let rect = canvas.getBoundingClientRect()
        let aw = rect.width
        let ax = ev.pageX - rect.left
        let ay = ev.pageY - rect.top

        log(aw, ax, ay)
        if (ax > 124 && ay > 55 && ay < 64) {
          let pp = (ax - 124) / (aw - 124)
          this.curr.time = pp * this.curr.duration
          log(pp, this.curr.time)
          SONIST.seek(this.curr.time)
        }
      },
      true
    )

    // 设置循环模式
    SONIST.mode = PLAY_MODE[this.playMode]

    SONIST.on('play', time => {
      this.curr.time = time
    })

    SONIST.on('end', time => {
      this.nextSong(1)
    })

    this.activeModule(this.mod)
  },
  methods: {
    quit() {},
    minimize() {},
    maximize() {},

    activeModule(mod) {
      switch (mod) {
        case 'artist':
          Artist.__init__()
          break
        case 'local':
          Local.__init__()
          break
        default:
          break
      }
    },
    toggleModule(mod) {
      if (['radio', 'mv'].includes(mod)) {
        return
      }
      this.mod = mod
    },
    togglePlayMode() {
      let mod = this.playMode
      mod++
      if (mod > 2) {
        mod = 0
      }
      this.playMode = mod
      SONIST.mode = PLAY_MODE[mod]
      Anot.ls('play-mode', mod)
    },

    draw() {
      let img1 = new Image()
      let img2 = new Image()
      let p1 = Promise.defer()
      let p2 = Promise.defer()
      let { title, artist, cover } = this.curr
      let play = this.isPlaying

      img1.onload = p1.resolve
      img2.onload = p2.resolve
      img1.src = '/images/disk.png'
      img2.src = cover || '/images/album.png'

      let rx = (play ? 112 : 40) + this.__HEIGHT__ / 2 // 旋转唱片的圆心坐标X
      let ry = this.__HEIGHT__ / 2 // 旋转唱片的圆心坐标Y
      let pw = this.__WIDTH__ - this.__HEIGHT__ - 180 // 进度条总长度
      let wl = this.__HEIGHT__ + 180 // 文字的坐标X
      const draw = () => {
        let { time, duration } = this.curr
        let pp = time / duration // 进度百分比
        time = Anot.filters.time(time)
        duration = Anot.filters.time(duration)

        this.__CTX__.clearRect(0, 0, this.__WIDTH__, this.__HEIGHT__)
        this.__CTX__.save()

        // 将原点移到唱片圆心, 旋转完再回到初始值
        this.__CTX__.translate(rx, ry)
        this.__CTX__.rotate(this.__DEG__ * Math.PI)
        this.__CTX__.translate(-rx, -ry)

        this.__CTX__.drawImage(
          img1,
          play ? 112 : 40,
          0,
          this.__HEIGHT__,
          this.__HEIGHT__
        )

        this.__CTX__.restore()

        this.__CTX__.drawImage(img2, 0, 0, this.__HEIGHT__, this.__HEIGHT__)

        // 歌曲标题和歌手
        this.__CTX__.fillStyle = '#62778d'
        this.__CTX__.font = '56px' + FONTS_NAME
        this.__CTX__.fillText(`${title} - ${artist}`, wl, 100)

        // 时间
        this.__CTX__.fillStyle = '#98acae'
        this.__CTX__.font = '48px' + FONTS_NAME
        this.__CTX__.fillText(
          `${time} / ${duration}`,
          this.__WIDTH__ - 280,
          100
        )

        // 歌词
        this.__CTX__.fillStyle = '#98acae'
        this.__CTX__.font = '48px' + FONTS_NAME
        this.__CTX__.fillText(`暂无歌词...`, wl, 180)

        // 进度条
        this.__CTX__.fillStyle = '#dae1e9'
        this.__CTX__.fillRect(wl, 230, pw, 16)
        this.__CTX__.fillStyle = '#3fc2a7'
        this.__CTX__.fillRect(wl, 230, pw * pp, 16)

        this.__DEG__ += 0.01
      }

      Promise.all([p1.promise, p2.promise]).then(_ => {
        clearInterval(this.timer)
        if (play) {
          this.timer = setInterval(() => {
            draw(img1, img2, play, rx, ry)
          }, 20)
        } else {
          draw(img1, img2, play, rx, ry)
        }
      })
    },

    nextSong(step) {
      let _p = null
      if (step > 0) {
        _p = SONIST.next()
      } else {
        _p = SONIST.prev()
      }
      this.isPlaying = false
      _p.then(it => {
        this.curr = {
          ...it,
          time: 0,
          cover:
            'http://imge.kugou.com/stdmusic/480/20170906/20170906161516611883.jpg'
        }
        // 通知子模块歌曲已经改变
        this.$fire('child!curr', it.id)
        this.play()
      })
    },

    pause() {
      this.isPlaying = false
    },

    play(song) {
      // 有参数的,说明是播放回调通知
      // 此时仅更新播放控制条的信息即可
      if (song) {
        this.curr = {
          ...song,
          time: 0,
          cover:
            'http://imge.kugou.com/stdmusic/480/20170906/20170906161516611883.jpg'
        }
        this.isPlaying = true
      } else {
        if (SONIST.stat === 'ready') {
          if (this.isPlaying) {
            SONIST.pause()
          } else {
            SONIST.play()
          }
          this.isPlaying = !this.isPlaying
        }
      }
      this.draw()
    }
  }
})
