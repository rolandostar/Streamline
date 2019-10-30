#!/usr/bin/env node

// Module Download
// http://github.com/google/shaka-packager/releases/latest/download/packager-linux
// https://yt-dl.org/downloads/latest/youtube-dl
// python
// ffmpeg

var fs = require('fs')
var path = require('path')
var spawnSync = require('child_process').spawnSync

// var commandNames = {
//   linux: 'packager-linux',
//   darwin: 'packager-osx',
//   win32: 'packager-win.exe',
// };

// var packagerURL = 'https://github.com/google/shaka-packager/releases/latest/download/packager-linux'
var youtubeURL = 'https://github.com/ytdl-org/youtube-dl/releases/latest/download/youtube-dl'

var options = { detached: false, stdio: 'inherit' }

// Create the bin folder if needed:
var binFolderPath = path.resolve(__dirname, '../bin')
if (!fs.existsSync(binFolderPath)) {
  fs.mkdirSync(binFolderPath, 0755)
}

// Wipe the bin folder's contents if needed:
fs.readdirSync(binFolderPath).forEach(function(childName) {
  var childPath = path.resolve(binFolderPath, childName)
  fs.unlinkSync(childPath)
});

/* -------------------------------- Packager -------------------------------- */
// var packagerPath = path.resolve(binFolderPath, 'packager-linux')
// var packagerArgs = ['-L', '-o', packagerPath, '--show-error', packagerURL ]
// console.log('Downloading packager')
// var returnValue = spawnSync('curl', packagerArgs, options)
// if (returnValue.error) {
//   process.exit(returnValue.error.code)
// }
// fs.chmodSync(packagerPath, 0755);
/* ------------------------------- Youtube-DL ------------------------------- */
var youtubePath = path.resolve(binFolderPath, 'youtube-dl');
var youtubeArgs = ['-L', '-o', youtubePath, '--show-error', youtubeURL]
console.log('Downloading youtube-dl');
var returnValue = spawnSync('curl', youtubeArgs, options);
if (returnValue.error) {
  process.exit(returnValue.error.code);
}
fs.chmodSync(youtubePath, 0755);

/* ---------------------------------- Done ---------------------------------- */
console.log('Done!');
