const { Server } = require("socket.io");
const server = require("../app");

const io = new Server(server, {
    cors: {
        origin: "*",
    }
});

io.on("connection", (socket) => {

    socket.on("setup", (user) => {

        socket.join(user._id)

        io.emit("setup", { userID: user._id })

    })

    socket.on('is-connected', (userID) => {
        io.emit('is-connected', userID)
    })



})