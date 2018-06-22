'use strict'

const domReady = require('detect-dom-ready')
const createNode = require('./create-node')
const libp2p = require('../../../..')
const pull = require('pull-stream')
const Pushable = require('pull-pushable')
const p = Pushable()

domReady(() => {
  const myPeerDiv = document.getElementById('my-peer')
  const swarmDiv = document.getElementById('swarm')

  createNode((err, node) => {
    if (err) {
      return console.log('Could not create the Node, check if your browser has WebRTC Support', err)
    }

    node.on('peer:discovery', (peerInfo) => {
      //console.log('Discovered a peer')
      const idStr = peerInfo.id.toB58String()
      //console.log('Discovered: ' + idStr)

      node.dialProtocol(peerInfo, '/chat/1.0.0', (err, conn) => {
    
        if(conn){
          pull(
            p,
            conn
          )
          // Sink, data converted from buffer to utf8 string
          pull(
            conn,
            pull.map((data) => {
              return data.toString('utf8').replace('\n', '')
            }),
            pull.drain(console.log)
          )
        }

        if (err) { 
          //return console.log('Failed to dial:', idStr) 
        }
      })
    })

    node.on('peer:connect', (peerInfo) => {
      const idStr = peerInfo.id.toB58String()
      console.log('Got connection to: ' + idStr)
      const connDiv = document.createElement('div')

      connDiv.innerHTML = 'Connected to: ' + idStr
      connDiv.id = idStr
      swarmDiv.append(connDiv)
    })

    node.on('peer:disconnect', (peerInfo) => {
      const idStr = peerInfo.id.toB58String()
      console.log('Lost connection to: ' + idStr)
      document.getElementById(idStr).remove()
    })

    node.start((err) => {
      if (err) {
        return console.log('WebRTC not supported')
      }

      const idStr = node.peerInfo.id.toB58String()

      const idDiv = document
        .createTextNode('Node is ready. ID: ' + idStr)

      myPeerDiv.append(idDiv)

      console.log('Node is listening o/')

      node.handle('/chat/1.0.0', (protocol, conn) => {
        pull(
          p,
          conn
        )
  
        pull(
          conn,
          pull.map((data) => {
            return data.toString('utf8').replace('\n', '')
          }),
          pull.drain(console.log)
        )
        p.push("Test")
        // process.stdin.setEncoding('utf8')
        // process.openStdin().on('data', (chunk) => {
        //   var data = chunk.toString()
        //   p.push(data)
        // })
      })
      // NOTE: to stop the node
      // node.stop((err) => {})
    })

  })
})
