import { Server, Socket } from 'socket.io'

export default (() => {
  let io: Server | null = null
  const connections: Record<string, Socket> = {}
  const forwardEvent = (event: string, message: any) => {
    if (io) {
      io.emit(event, message)
    }
  }
  const forwardEventToAllSockets = (
    event: string,
    message: any,
    exclude: string[],
  ) => {
    Object.keys(connections).forEach((id) => {
      if (!exclude.includes(id)) {
        connections[id].emit(event, message)
      }
    })
  }
  return {
    start({ port }: { port: number }) {
      io = new Server(port, {
        cors: {
          origin: '*',
          methods: ['*'],
        },
      })
      io.on('connect', (socket) => {
        console.log('[socket.io] Connected:', socket.id)
        connections[socket.id] = socket
        socket.on('disconnect', () => {
          console.log('[socket.io] Disconnected:', socket.id)
          delete connections[socket.id]
        })
        socket.on('say', (message) => {
          forwardEventToAllSockets('say', message, [socket.id])
        })
        socket.on('add-dictionary-rule', (message) => {
          forwardEventToAllSockets('add-dictionary-rule', message, [socket.id])
        })
        socket.on('update-dictionary-rule', (message) => {
          forwardEventToAllSockets('update-dictionary-rule', message, [socket.id])
        })
        socket.on('remove-dictionary-rule', (message) => {
          forwardEventToAllSockets('remove-dictionary-rule', message, [socket.id])
        })
        ;[
          'message:load',
          'message:start',
          'message:caption',
          'message:end',
          'message:error',
          'window:focus',
          'window:blur',
          'input:focus',
          'input:blur',
          'speech:recording:start',
          'speech:recording:end',
        ].forEach((event) => {
          socket.on(event, (message) => forwardEvent(event, message))
        })
      })
    },
    forwardEvent,
  }
})()
