'use strict'

function timemarkToSeconds (timemark) {
  var parts = timemark.split(':')
  var secs = Number(parts.pop())
  if (parts.length) secs += Number(parts.pop()) * 60
  if (parts.length) secs += Number(parts.pop()) * 3600
  return secs
}

function to (promise) {
  return promise
    .then(data => { return [null, data] })
    .catch(err => [err])
}

module.exports = {
  timemarkToSeconds,
  to
}
