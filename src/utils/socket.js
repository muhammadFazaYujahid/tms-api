import { Server } from "socket.io";

let io;
let socketIo;
let projectRoom;

export const setupSocketIO = (server) => {
    io = new Server(server, {
        cors: {
            origin: true,
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        socketIo = socket;
        socket.emit('notification', 'Welcome to the real-time notification system!');

        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });

        socket.on('loggedIn', (socketData) => {
            // socket.id = socketData.user_key;
            socket.join(socketData.org_key);
            socket.emit('getId', socket.id);
            console.log(`${socket.id} joined ${socketData.org_key} room`);
        })

        socket.on('projectRoom', (socketData) => {
            // socket.id = socketData.user_key;
            socket.join(socketData.org_key);

            // Get the IDs of sockets in the 'org_key' room
            const roomSockets = io.sockets.adapter.rooms.get(socketData.org_key);

            // Convert the Set to an array to get the IDs
            const socketIds = Array.from(roomSockets);

            console.log(`Sockets in room '${socketData.org_key}':`, socketIds);
        })

        socket.on('sendNotif', (data) => {
            const { room, messageData } = data;

            console.log(`Socket task ${socket.id} joined room ${room}`);
            // Get the IDs of sockets in the 'org_key' room
            // const roomSockets = io.sockets.adapter.rooms.get(room);

            // // // Convert the Set to an array to get the IDs
            // const socketIds = Array.from(roomSockets);

            // console.log(`Sockets in room by backlog'${room}':`, socketIds);
            socket.to(room).emit('receiveNotif', messageData);
            console.log(`Task status updated broadcasted to room ${room}`);
        });
    });

    return io;
};
export const getSocket = () => {
    return socketIo;
}

export { io };

// Broadcast a message to a specific user
export const broadcastToUser = (message) => {
    console.log('masukkk bang', projectRoom);
    console.log(`Socket ${socketIo.id}`);
    socketIo.to(projectRoom).emit('taskStatusUpdated', message);
};