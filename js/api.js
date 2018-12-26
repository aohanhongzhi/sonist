/**
 * 音乐APP接口
 * @author yutent<yutent@doui.cc>
 * @date 2018/12/24 16:02:00
 */

'use strict'

import request from '/dist/request/index.js'

const log = console.log

const BASE_API_URI = 'http://mobilecdnbj.kugou.com'

const get = uri => {
  return request.get(BASE_API_URI + uri)
}

const post = uri => {
  return request.post(BASE_API_URI + uri)
}

export default {
  getLastHot100Artists() {
    return get('/api/v5/singer/list')
      .send({
        sort: 1,
        showtype: 1,
        sextype: 0,
        musician: 0,
        pagesize: 100,
        plat: 2,
        type: 0,
        page: 1
      })
      .then(res => {
        if (res.status === 200) {
          return JSON.parse(res.text)
        }
      })
  },

  getArtistList(sextype = 1, type = 1) {
    return get('/api/v5/singer/list')
      .send({
        showtype: 2,
        musician: 0,
        type,
        sextype
      })
      .then(res => {
        if (res.status === 200) {
          return JSON.parse(res.text)
        }
      })
  },

  getArtistInfo(singerid) {
    return get('/api/v3/singer/info')
      .send({ singerid })
      .then(res => {
        if (res.status === 200) {
          return JSON.parse(res.text)
        }
      })
  },

  getArtistInfo(singerid) {
    return get('/api/v3/singer/info')
      .send({ singerid })
      .then(res => {
        if (res.status === 200) {
          return JSON.parse(res.text)
        }
      })
  },

  getArtistSongs(singerid, page = 1) {
    return get('/api/v3/singer/song')
      .send({
        sorttype: 2,
        pagesize: 50,
        singerid,
        area_code: 1,
        page
      })
      .then(res => {
        if (res.status === 200) {
          return JSON.parse(res.text)
        }
      })
  },

  getArtistAlbums(singerid, page = 1) {
    return get('/api/v3/singer/album')
      .send({
        pagesize: 50,
        singerid,
        area_code: 1,
        page
      })
      .then(res => {
        if (res.status === 200) {
          return JSON.parse(res.text)
        }
      })
  }
}
