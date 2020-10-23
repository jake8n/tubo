const io = require('socket.io')({})
// TODO: make persistent
const docs = {}
io.on('connection', socket => {
  const { room } = socket.handshake.query
  socket.join(room).emit('joined', docs[room])
  socket.on('update', changes => {
    socket.to(room).emit('update', changes)
  })
  socket.on('sync', doc => {
    docs[room] = doc
  })
})
io.listen(process.env.SNOWPACK_PUBLIC_WSS_PORT)
