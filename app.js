const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');  // Add CORS middleware

const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: 'https://device-track.onrender.com', // Replace with your frontend domain
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  }
});

// Set up CORS for HTTP routes
app.use(cors({
  origin: 'https://device-track.onrender.com',  // Replace with your frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Set custom headers for Permissions-Policy
app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "geolocation=(self 'https://device-track.onrender.com')");
  next();
});

io.on('connection', function (socket) {
  socket.on("send-location", function (data) {
    io.emit("receive-location", { id: socket.id, ...data });
  });

  socket.on("disconnect", function () {
    io.emit("user-disconnected", socket.id);
  });
});

app.get('/', (req, res) => {
  res.render('index');
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
