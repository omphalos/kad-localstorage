#!/usr/bin/env node

'use strict'

var test = require('tape-catch')
var KadLocalStorage = require('./kad-localstorage')
var DomStorage = require('dom-storage')
if(!global.localStorage)
  global.localStorage = new DomStorage(null, { strict: true }) // node

test('should get a key', function(t) {

  localStorage.clear()

  var store = new KadLocalStorage('test')

  store.put('a', 'b', function(err) {
    t.equal(err, null)
    store.get('a', function(err, result) {
      t.equal(err, null)
      t.equal(result, 'b')
      t.end()
    })
  })
})

test('should propagate error for missing key', function(t) {

  localStorage.clear()

  var store = new KadLocalStorage('test')

  store.get('a', function(err, result) {
    t.equal(result, undefined)
    t.equal(err.message, 'not found')
    t.end()
  })
})

test('should get falsey key', function(t) {

  localStorage.clear()

  var store = new KadLocalStorage('test')

  store.put('a', false, function(err) {
    t.equal(err, null)
    store.get('a', function(err, result) {
      t.equal(err, null)
      t.equal(result, false)
      t.end()
    })
  })
})

test('should delete key', function(t) {

  localStorage.clear()

  var store = new KadLocalStorage('test')

  store.put('a', 'b', function(err) {
    t.equal(err, null)
    store.del('a', onDel)
  })

  function onDel(err) {
    t.equal(err, null)
    store.get('a', onGet)
  }

  function onGet(err, result) {
    t.equal(err.message, 'not found')
    t.equal(result, undefined)
    t.end()
  }
})

test('should create read stream', function(t) {

  localStorage.clear()

  var store = new KadLocalStorage('test')
  var received = []

  localStorage.setItem('someOtherNamespace', 'should ignore other namespaces')

  store.put('a', 'a1', function(err) {
    t.equal(err, null)
    store.put('b', 'b1', onPut2)
  })

  function onPut2(err) {
    t.equal(err, null)
    var stream = store.createReadStream()
    stream.on('data', received.push.bind(received))
    stream.on('end', onEnd)
  }

  function onEnd() {
    received.sort(function(x, y) {
      return x.key > y.key ? 1 : x.key < y.key ? -1 : 0
    })
    t.deepEqual(received, [{
      key: 'a',
      value: 'a1'
    }, {
      key: 'b',
      value: 'b1'
    }])
    t.end()
  }
})

test('should propagate JSON parse error from stream', function(t) {

  localStorage.clear()

  var store = new KadLocalStorage('test')
  var errors = []

  localStorage.setItem('test_a', 'this is invalid JSON 1')
  localStorage.setItem('test_b', 'this is invalid JSON 2')

  var stream = store.createReadStream()
  stream.on('data', t.fail)
  stream.on('error', errors.push.bind(errors))
  stream.on('end', function() {
    t.equal(errors.length, 2)
    t.end()
  })
})

test('should handle JSON parse failures', function(t) {

  localStorage.clear()

  var store = new KadLocalStorage('test')

  localStorage.setItem('test_a', 'this is invalid JSON')

  store.get('a', function(err, result) {
    t.equal(!!err, true)
    t.equal(result, undefined)
    t.end()
  })
})

test('should validate namespace', function(t) {

  localStorage.clear()

  t.throws(function() {
    new KadLocalStorage('invalid_namespace')
  })

  t.end()
})