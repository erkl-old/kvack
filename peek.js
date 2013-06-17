var events = require('events')
  , crypto = require('crypto')
  , fs = require('fs')

function peek(path, opts) {
  var watcher = new events.EventEmitter()
    , options =
      { persistent: true
      , delay: 25
      }

  for (var key in opts) {
    options[key] = opts[key]
  }

  var watcher = null
    , timeout = null
    , lastTime = null
    , lastHash = null

  function watch() {
    try {
      watcher = fs.watch(path, { persistent: options.persistent })
    } catch (err) {
      if (err.code !== 'ENOENT') {
        watcher.emit('error', err)
      }

      timeout = setTimeout(watch, options.delay)
      return
    }

    watcher.on('error', function (err) {
      if (err.code !== 'ENOENT') {
        watcher.emit('error', err)
      }
      reset()
    })

    watcher.on('change', function (event, filename) {
      if (event === 'rename') {
        reset()
      } else {
        check()
      }
    })

    check()
  }

  function reset() {
    if (watcher != null) {
      watcher.close()
      watcher = null
    }

    check()
    watch()
  }

  function check() {
    stat(path, function (err, time, hash) {
      if (err != null && err.code !== 'ENOENT') {
        watcher.emit('error', err)
      }

      if (hash !== lastHash && time >= lastTime) {
        var event = 'modify'

        if (lastHash == null) {
          event = 'create'
        } else if (hash == null) {
          event = 'delete'
        }

        lastHash = hash
        lastTime = time

        watcher.emit('change', event)
        watcher.emit(event)
      }
    })
  }

  function close() {
    if (watcher != null) watcher.close()
    clearTimeout(timeout)

    watcher.closed = true
    watcher.emit('close')
  }

  stat(path, function (err, time, hash) {
    if (err != null && err.code !== 'ENOENT') {
      watcher.emit('error', err)
    }

    lastTime = time
    lastHash = hash

    watch()
  })

  watcher.path = path
  watcher.closed = false
  watcher.close = close

  return watcher
}

function stat(path, callback) {
  var hash = crypto.createHash('sha1')
    , time = Date.now()
    , stream = null

  try {
    stream = fs.createReadStream(path)
  } catch (err) {
    return callback(err, time, null)
  }

  stream.on('open', function () { time = Date.now() })
  stream.on('data', function (chunk) { hash.update(chunk) })
  stream.on('error', function (err) { callback(err, time, null) })
  stream.on('end', function () { callback(null, time, hash.digest('hex')) })
}

module.exports = peek
