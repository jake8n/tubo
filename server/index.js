const io = require('socket.io')({})
// TODO: make persistent
const docs = {}
io.on('connection', socket => {
  const { room } = socket.handshake
  socket.join(room).emit('joined', docs[room])
  socket.on('update', changes => {
    console.debug(changes)
    socket.to(room).emit('update', changes)
  })
  socket.on('sync', doc => {
    console.debug(doc)
    docs[room] = doc.join('\n')
  })
})
io.listen(process.env.SNOWPACK_PUBLIC_WSS_PORT)
