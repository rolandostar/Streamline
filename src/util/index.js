'use strict'

function timemarkToSeconds (timemark) {
  var parts = timemark.split(':')
  var secs = Number(parts.pop())
  if (parts.length) secs += Number(parts.pop()) * 60
  if (parts.length) secs += Number(parts.pop()) * 3600
  return secs
}

module.exports = {
  timemarkToSeconds
}
