
let videoGrid=document.getElementById('video-grid')
let joinMessageDiv = document.getElementById('joinMessage')
let uistring=''
let userList = []
let currentRoom
let username = prompt('enter username')
let leaveMessageDiv = document.getElementById('leaveMessage')
const socket = io()
let peers ={}
var peer = new Peer(undefined)
let myId
let myVideoStream
let myVideo=document.createElement('video')
myVideo.muted = true
navigator.mediaDevices.getUserMedia({
    video:true,
    audio:true
}).then(stream => {
    myVideoStream = stream
    addVideoStream(myVideo,stream)

    peer.on('call', call => {
        call.answer(stream)
        const video =document.createElement('video')
        call.on('stream', userVideoStream => {
            addVideoStream(video,userVideoStream)
        })
    })

    socket.on('user-connected', (userId , username) => {
        connectToNewUser(userId, stream , username)
    })

    
})

peer.on('open', id => {
    socket.emit('join-room',ROOM_ID,id,username)
})


const connectToNewUser = (userId,stream,username) =>{
    const call = peer.call(userId, stream);
    const video =document.createElement('video')
    call.on('stream', userVideoStream => {
        addVideoStream(video,userVideoStream)
  })

    call.on('close', () => {
        video.remove()
    })

    peers[userId] = call
    
    
    const joinMessage = `${username} joined the meeting`
    const h3 = document.createElement('h3')
    h3.innerText = joinMessage
    joinMessageDiv.append(h3)   
    setTimeout(() => {
           joinMessageDiv.remove(h3)
    }, 2500);

}
socket.on('show-users',(users,roomId) => {
    userList = users
    currentRoom = roomId
})
function showUsers(){
    let head = document.getElementById('chat');
    head.innerHTML = "Particpants"
    let participants = document.querySelector('.participants')
    let pString = ""
    for(user of userList){
        if(user.roomId === currentRoom){
            pString+=`<li>${user.username}</li>`
            console.log(user.userId);
        }
    }
    participants.innerHTML = pString
    let messages = document.querySelector('.messages')
    messages.innerHTML = ""
    let input = document.getElementById("chat_message")
    input.style.display = 'none'
    console.log(peers);
}

function showChats(){
    let head = document.getElementById('chat');
    head.innerHTML = "Chat"
    let messages = document.querySelector('.messages')
    messages.innerHTML=uistring;
    let participants = document.querySelector('.participants')
    participants.innerHTML = ""
    let input = document.getElementById("chat_message")
    input.style.display = 'flex'
}

const addVideoStream = (video, stream) => {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play();
    })
    videoGrid.append(video)
    
}

document.onkeydown = (e) => {
    if (e.keyCode == 13){
        const message = document.getElementById('chat_message');
        if(message.value.length != 0){
            socket.emit('message',{message : message.value, username : username})
            message.value='';
            message.focus()
        }
    }
}

socket.on('show-message', ({message, username}) => {
    const messageList = document.querySelector('.messages')
    uistring+=`<li><b>${username}</b><br><p>${message}</p></li>`
    messageList.innerHTML=uistring;
    const chatWindow = document.querySelector('.main__chat__window')
    chatWindow.scrollTop = chatWindow.scrollHeight;
})


function muteUnmute(){
    const enabled = myVideoStream.getAudioTracks()[0].enabled
    if (enabled){
        myVideoStream.getAudioTracks()[0].enabled = false
        setUnmuteButton();
    }
    else {
        myVideoStream.getAudioTracks()[0].enabled = true
        setMuteButton();
    }
}

function setUnmuteButton(){
    const mute = document.querySelector('.main__mute__button')
    mute.innerHTML = `<i class="unmute fas fa-microphone-slash"></i>
                        <span>Unmute</span>`
}

function setMuteButton(){
    const mute = document.querySelector('.main__mute__button')
    mute.innerHTML = `<i class="fas fa-microphone"></i>
                        <span>Mute</span>`
}


function playStop(){
    const enabled = myVideoStream.getVideoTracks()[0].enabled
    if (enabled){
        myVideoStream.getVideoTracks()[0].enabled = false
        setStopVideo();
    }
    else {
        myVideoStream.getVideoTracks()[0].enabled = true
        setPlayVideo();
    }
}


function setStopVideo(){
    const video = document.querySelector('.main__video__button')
    video.innerHTML = `<i class="unmute fas fa-video-slash"></i>
                        <span>Play Video</span>`
}

function setPlayVideo(){
    const video = document.querySelector('.main__video__button')
    video.innerHTML = `<i class="fas fa-video"></i>
                        <span>Stop Video</span>`
}

const deleteUser = (userId,username) => {
    let index = 0
    for(user of userList){
        if(user.userId === userId){
            
            const leaveMessage = `${username} left the meeting`
            const h3 = document.createElement('h3')
            h3.innerText = leaveMessage
            leaveMessageDiv.append(h3)   
            setTimeout(() => {
                leaveMessageDiv.remove(h3)
            }, 2500); 
            let deleted = userList.splice(index,1)
        }
        index+=1;
    }
}


socket.on('userLeave',(userId , username) =>{
    deleteUser(userId,username)
    if(peers[userId]) peers[userId].close()
})