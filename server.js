const express = require('express')
const app = express()
const PORT = 3030 || process.env.PORT
const path=require('path')
const server = require('http').Server(app)
const io= require('socket.io')(server)
let users = []
const {v4:uuidv4} = require('uuid');
const {ExpressPeerServer} = require('peer')
const peerServer = ExpressPeerServer(server, {
    debug: true
})

app.set('view engine','ejs')
app.use(express.static(path.join(__dirname,'public')))

app.use('/peerjs',peerServer)

app.get('/leave', (req,res) => {
    res.render('leave')
})



app.get('/', (req,res)=>{
    res.redirect(`/${uuidv4()}`)
})

app.get('/:room', (req,res) => {
    res.render('room',{ roomId: req.params.room})
})



io.on('connection' , socket => {
    socket.on('join-room' , (roomId , userId , username) => {
        users.push({roomId , userId , username})
        socket.join(roomId)
        socket.to(roomId).broadcast.emit('user-connected',userId, username)
        socket.on('message', ({message, username}) =>{
            io.to(roomId).emit('show-message',{message, username})
        })

        io.to(roomId).emit('show-users',users,roomId)
        socket.on('disconnect', () => {
            socket.to(roomId).broadcast.emit('userLeave',userId,username)
            let index =users.findIndex(user => user.userId === userId)
            users.splice(index, 1)
          })
    
    })
    

})

server.listen(PORT)