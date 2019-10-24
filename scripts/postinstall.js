#!/usr/bin/env node

// Module Download
// http://github.com/google/shaka-packager/releases/latest/download/packager-linux
// https://yt-dl.org/downloads/latest/youtube-dl
// python
// ffmpeg

// Modules we use:
var fs = require('fs');
var path = require('path');
var spawnSync = require('child_process').spawnSync;

// Command names per-platform:
var commandNames = {
  linux: 'packager-linux'
  //darwin: 'packager-osx',
  //win32: 'packager-win.exe',
};

var urlBase = 'https://github.com/google/shaka-packager/releases/latest/download/'
var yt = 'https://github.com/ytdl-org/youtube-dl/releases/latest/download/youtube-dl'

// For spawning curl subprocesses:
var options = {
  detached: false,  // Do not let the child process continue without us
  stdio: 'inherit',  // Pass stdin/stdout/stderr straight through
};

// Create the bin folder if needed:
var binFolderPath = path.resolve(__dirname, '../bin');
if (!fs.existsSync(binFolderPath)) {
  fs.mkdirSync(binFolderPath, 0755);
}

// Wipe the bin folder's contents if needed:
fs.readdirSync(binFolderPath).forEach(function(childName) {
  var childPath = path.resolve(binFolderPath, childName);
  fs.unlinkSync(childPath);
});

for (var platform in commandNames) {
  // Find the destination for this binary:
  var command = commandNames[platform];
  var binaryPath = path.resolve(binFolderPath, command);

  // Curl args:
  var args = [
    '-L',  // follow redirects
    '-o', binaryPath,  // output destination
    '--show-error',  // show errors, but no progress bar
    urlBase + command,  // URL
  ];

  // Now fetch the binary and fail the script if that fails:
  console.log('Downloading', command);
  var returnValue = spawnSync('curl', args, options);
  if (returnValue.error) {
    process.exit(returnValue.error.code);
  }

  fs.chmodSync(binaryPath, 0755);
}

console.log('Done!');
