/* eslint-disable no-undef */

function GetParameterValues (param) {
  var url = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&')
  for (var i = 0; i < url.length; i++) {
    var p = url[i].split('=')
    if (p[0] === param) {
      return p[1]
    }
  }
}

var id = GetParameterValues('id')
var title = GetParameterValues('title')
var storageUri = `/storage/${id}/${title}`

$(document).idle({
  onIdle: function () {
    $('body').css({ cursor: 'none' })
    $('.controls').animate({ opacity: 0 }, 220)
  },
  onActive: function () {
    $('body').css({ cursor: 'default' })
    $('.controls').animate({ opacity: 1 }, 270)
  },
  onHide: function () {
    $('.controls').css({ opacity: 1 })
  },
  idle: 1280
})

function initApp () {
  $('#video').attr('poster', storageUri + '/thumb.png')
  shaka.polyfill.installAll()
  if (shaka.Player.isBrowserSupported()) initPlayer()
  else console.error('Browser not supported!')
  $('body').css({ cursor: 'default' })
}

function initPlayer () {
  var video = document.getElementById('video')
  var player = new shaka.Player(video)
  window.player = player
  player.configure({
    streaming: {
      bufferBehind: 1,
      bufferingGoal: 3,
      // durationBackoff: 1,
      // rebufferingGoal: 2,
      // safeSeekOffset: 5
    },
    abr: {
      switchInterval: 1
    }
  })
  player.addEventListener('error', onErrorEvent)
  if (GetParameterValues('debug') === '1') {
    player.load('https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd').catch(onError)
  } else {
    player.load(storageUri + '/stream/manifest.mpd').catch(onError)
  }
  player.addEventListener('adaptation', function (e) {
    var tracks = player.getVariantTracks() // all tracks
    tracks.forEach(function (t) {
      if (t.active) { // an active track, that is, in use by the player right now
        console.log(`Adapting resolution: ${t.type} ${t.width}x${t.height}`)
      }
    })
  })
  player.addEventListener('buffering', function (e) {
    const buff = player.getBufferedInfo()
    console.log(buff.total[0].end)
  })
}

function onErrorEvent (event) { onError(event.detail) }
function onError (error) { console.error('Error code', error.code, 'object', error) }
document.addEventListener('DOMContentLoaded', initApp)

// ELEMENT SELECTORS
var video = document.querySelector('#video')
var playBtn = document.querySelector('.play-btn')
var rewBtn = document.querySelector('.rew')
var ffwBtn = document.querySelector('.ffw')
var volumeBtn = document.querySelector('.volume-btn')
var volumeSlider = document.querySelector('.volume-slider')
var volumeFill = document.querySelector('.volume-filled')
var progressSlider = document.querySelector('.progress')
var progressFill = document.querySelector('.progress-filled')
var textCurrent = document.querySelector('.time-current')
var fullscreenBtn = document.querySelector('.fullscreen')

// GLOBAL VARS
let lastVolume = 1

// PLAYER FUNCTIONS
function togglePlay () {
  if (video.paused) {
    video.play()
  } else {
    video.pause()
  }
  playBtn.classList.toggle('paused')
}
function togglePlayBtn () {
  playBtn.classList.toggle('playing')
}

function toggleMute () {
  if (video.volume) {
    lastVolume = video.volume
    video.volume = 0
    volumeBtn.classList.add('muted')
    volumeFill.style.width = 0
  } else {
    video.volume = lastVolume
    volumeBtn.classList.remove('muted')
    volumeFill.style.width = `${lastVolume * 100}%`
  }
}
function changeVolume (e) {
  volumeBtn.classList.remove('muted')
  let volume = e.offsetX / volumeSlider.offsetWidth
  volume = volume < 0.1 ? 0 : volume
  volumeFill.style.width = `${volume * 100}%`
  video.volume = volume
  if (volume > 0.7) {
    volumeBtn.classList.add('loud')
  } else if (volume < 0.7 && volume > 0) {
    volumeBtn.classList.remove('loud')
  } else if (volume === 0) {
    volumeBtn.classList.add('muted')
  }
  lastVolume = volume
}
function neatTime (time) {
  // var hours = Math.floor((time % 86400)/3600)
  var minutes = Math.floor((time % 3600) / 60)
  var seconds = Math.floor(time % 60)
  seconds = seconds > 9 ? seconds : `0${seconds}`
  return `${minutes}:${seconds}`
}
function updateProgress (e) {
  progressFill.style.width = `${video.currentTime / video.duration * 100}%`
  textCurrent.innerHTML = `${neatTime(video.currentTime)} / ${neatTime(video.duration)}`
  // textTotal.innerHTML = neatTime(video.duration);
  // console.log(progressFill.style.width);
}
function setProgress (e) {
  const newTime = e.offsetX / progressSlider.offsetWidth
  progressFill.style.width = `${newTime * 100}%`
  video.currentTime = newTime * video.duration
}
function launchIntoFullscreen (element) {
  if (element.requestFullscreen) {
    element.requestFullscreen()
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen()
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen()
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen()
  }
}
function exitFullscreen () {
  if (document.exitFullscreen) {
    document.exitFullscreen()
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen()
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen()
  }
}
var fullscreen = false
function toggleFullscreen () {
  fullscreen ? exitFullscreen() : launchIntoFullscreen(document.querySelector('body'))
  fullscreen = !fullscreen
}
function handleKeypress (e) {
  // activity()
  switch (e.key) {
    case ' ':
      togglePlay()
      break
    case 'ArrowRight':
      video.currentTime += 10
      $('#ffw-bg').css('transform', 'rotate(50deg)')
      setTimeout(function () {
        $('#ffw-bg').css('transform', 'rotate(0deg)')
      }, 100)
      break
    case 'ArrowLeft':
      video.currentTime -= 10
      $('#rew-bg').css('transform', 'rotate(-50deg)')
      setTimeout(function () {
        $('#rew-bg').css('transform', 'rotate(0deg)')
      }, 100)
      break
    default: break
  }
}

ffwBtn.addEventListener('mousedown', () => {
  $('#ffw-bg').css('transform', 'rotate(50deg)')
  video.currentTime += 10
})
ffwBtn.addEventListener('mouseup', () => {
  $('#ffw-bg').css('transform', 'rotate(0deg)')
})
rewBtn.addEventListener('mousedown', () => {
  $('#rew-bg').css('transform', 'rotate(-50deg)')
  video.currentTime -= 10
})
rewBtn.addEventListener('mouseup', () => {
  $('#rew-bg').css('transform', 'rotate(0deg)')
})

let pip = document.querySelector('.pip')
pip.addEventListener('click', async e => {
  pip.disabled = true
  try {
    if (video !== document.pictureInPictureElement) {
      await video.requestPictureInPicture()
    } else {
      await document.exitPictureInPicture()
      togglePlay()
    }
  } catch (error) {
    console.log(`> Argh! ${error}`)
  } finally {
    pip.disabled = false
  }
})

// let qs = document.querySelector('.qs')
// qs.addEventListener('click', async e => {
//   console.log(player.getBufferedInfo())
//   player.configure({ abr: { enabled: false } })
//   // player.load(storageUri + '/manifest.mpd').then(function () {
//   //   var track = player.getVariantTracks().filter(function (track) {
//   //     return track.width === 1920
//   //   }).pop()
//   //   if (track) {
//   //     console.log('Selecting variant track ', track)
//   //     player.selectVariantTrack(track, true)
//   //   }
//   // })

//   var track = player.getVariantTracks().filter(function (track) {
//     return track.height === 360
//   }).pop()
//   console.log(track)
//   if (track) {
//     console.log('Selecting variant track ', track)
//     player.selectVariantTrack(track, true)
//     console.log(player.getBufferedInfo())
//   }

//   // player.selectVideoTrack(trackId)
//   // const tracks = this.player.getVariantTracks()
//   // console.log(tracks[2])
//   // this.player.selectVariantTrack(tracks[2], true)
// })

// EVENT LISTENERS
// $(document).mousemove(activity)
playBtn.addEventListener('click', togglePlay)
video.addEventListener('click', togglePlay)
video.addEventListener('play', togglePlayBtn)
video.addEventListener('pause', togglePlayBtn)
video.addEventListener('ended', togglePlayBtn)
video.addEventListener('timeupdate', updateProgress)
video.addEventListener('canplay', updateProgress)
volumeBtn.addEventListener('click', toggleMute)
volumeSlider.addEventListener('click', changeVolume)
progressSlider.addEventListener('click', setProgress)
fullscreenBtn.addEventListener('click', toggleFullscreen)
window.addEventListener('keydown', handleKeypress)
