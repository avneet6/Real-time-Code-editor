import express from "express"; //Import the express module
import http from "http"; //Import the http module
import { Server } from "socket.io"; //Import the server class from socket.io
import path from "path"; //Import the path module 

const app = express(); // Create an instance of the express application

const server = http.createServer(app);

const io = new Server(server, { // Create a new instance of the Socket.IO server
  cors: {
    origin: "*", // Allow all origins to connect
  },
});

const rooms = new Map(); // Create a Map to store room data

// Listen for client connections
io.on("connection", (socket) => {
  console.log("User Connected", socket.id);

  let currentRoom = null; // Variable to store the current room of the connected user
  let currentUser = null; // Variable to store the current user's name

  // Listen for the "join" event
  socket.on("join", ({ roomId, userName }) => {
    if (currentRoom) {
      socket.leave(currentRoom);
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
    }

    currentRoom = roomId; // Update the current room
    currentUser = userName; // Update the current user

    socket.join(roomId); // Join the new room

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set()); // Create a new room if it doesn't exist
    }

    rooms.get(roomId).add(userName); // Add the user to the room

    io.to(roomId).emit("userJoined", Array.from(rooms.get(currentRoom))); // Notify the room that the user joined
  });

  // Listen for the "codeChange" event
  socket.on("codeChange", ({ roomId, code }) => {
    socket.to(roomId).emit("codeUpdate", code); // Broadcast the code change to the room
  });

  // Listen for the "leaveRoom" event
  socket.on("leaveRoom", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom).delete(currentUser); // Remove the user from the current room
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom))); // Notify the room that the user left

      socket.leave(currentRoom);

      currentRoom = null; // Reset the current room
      currentUser = null; // Reset the current user
    }
  });

  // Listen for the "typing" event
  socket.on("typing", ({ roomId, userName }) => {
    socket.to(roomId).emit("userTyping", userName); // Broadcast that the user is typing to the room
  });

  // Listen for the "languageChange" event
  socket.on("languageChange", ({ roomId, language }) => {
    io.to(roomId).emit("languageUpdate", language); // Broadcast the language change to the room
  });

  // Listen for the "disconnect" event
  socket.on("disconnect", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom).delete(currentUser); // Remove the user from the current room
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom))); // Notify the room that the user left
    }
    console.log("user Disconnected");
  });
});

const port = process.env.PORT || 5000; // Define the port to listen on

const __dirname = path.resolve(); // Get the current directory path

app.use(express.static(path.join(__dirname, "/frontend/dist"))); // Serve static files from the frontend/dist directory

// Handle all other routes by serving the index.html file
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend","dist", "index.html"));
});

server.listen(port, () => {
  console.log("server is working on port 5000"); // Log that the server is running
});
