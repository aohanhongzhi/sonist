/**
 * 本地音乐模块
 * @author yutent<yutent@doui.cc>
 * @date 2018/12/24 17:00:48
 */

'use strict'

import Api from '/js/api.js'

const log = console.log

export default Anot({
  $id: 'local',
  state: {
    list: [],
    curr: ''
  },
  __APP__: null,
  mounted() {
    this.__APP__ = Anot.vmodels.app
    this.list = LS.getAll()
    let lastPlay = Anot.ls('last-play') || 0

    SONIST.clear()
    SONIST.push(LS.getAll())
    SONIST.play(lastPlay).then(it => {
      this.__APP__.play(it)
      this.curr = it.id
    })
  },
  watch: {
    'props.curr'(v) {
      this.curr = v
    }
  },
  methods: {
    __init__() {},

    play(idx) {
      SONIST.play(idx).then(it => {
        this.__APP__.play(it)
        this.curr = it.id
      })
    }
  }
})
