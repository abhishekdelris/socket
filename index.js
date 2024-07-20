const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
var mysql = require('mysql');
const FCM = require("fcm-node");
const fs = require("fs");
const path = require('path');
const dotenv = require('dotenv').config();
const geolib = require('geolib');


//fcm server key
const serverKey = process.env.server_key ;
const fcm = new FCM(serverKey);

const app = express();
app.use(express.json());


app.use(
  cors({
    origin: "*",
  }) 
);

const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

const GOOGLE_APPLICATION_CREDENTIALS=require("./google-services.json");
 
//database connected
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "crime_project"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

// Function to get device tokens from MySQL
 async function getDeviceTokensFromDB() {
  return new Promise((resolve, reject) => {
    con.query('SELECT * FROM user_devices', (err, results) => {
      if (err) {
        reject(err);
      } else {
        const tokens = results.map(result => result.token);
        const latitude = results.map(result => result.latitude);
        const longitude = results.map(result => result.longitude);
        resolve({ tokens, latitude, longitude });
        // console.log(tokens);
        // console.log(latitude);
        // console.log(longitude);

      }
    });
  });
}

getDeviceTokensFromDB();
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle custom events
  socket.on('alertMessage', (data) => {
    io.emit('receiveAlert', data); // Emit the alert to all connected clients
    console.log('Alert message received:', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => { 
    console.log('A user disconnected');
  });
});

//Fcm code implementation
app.use(
  cors({
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);

app.use(function(req, res, next) {
  res.setHeader("Content-Type", "application/json");
  next();
});




async function getNearestDeviceTokens() {
 
  return  await getDeviceTokensFromDB();
 
  }

  app.get('/', (req, res) => {
    res.send('Hello World!')
  })
  
 
// Assuming necessary imports and configurations are correctly set up
// Define async function to handle sending notifications
const sendNotification = async () => {
  try {
    const nearestDeviceTokens = await getNearestDeviceTokens(); // Assuming getNearestDeviceTokens() is defined and returns an array of devices

    for (let i = 0; i < nearestDeviceTokens.length; i++) {
      const token = nearestDeviceTokens[i].token; // Access token property correctly
      
      // Retrieve latitude and longitude from current device
      const { latitude, longitude } = nearestDeviceTokens[i];

      let nearestUser = null;
      let smallestDistance = Infinity;

      // Iterate through each device to find the nearest one
      for (let j = 0; j < nearestDeviceTokens.length; j++) {
        if (i !== j) { // Ensure we're comparing different devices
          const distance = geolib.getDistance(
            { latitude, longitude },
            { latitude: nearestDeviceTokens[j].latitude, longitude: nearestDeviceTokens[j].longitude }
          );

          if (distance < smallestDistance) {
            smallestDistance = distance;
            nearestUser = nearestDeviceTokens[j];
          }
        }
      }

      if (nearestUser) {
        console.log('Nearest user:', nearestUser);
        
        // Construct notification message
        const message = {
          content_available: true,
          mutable_content: true,
          notification: {
            title: "Emergency Alert",
            body: req.body.getmessage, // Assuming getmessage is passed correctly in the request body
            icon: "./emergency.png", // Default Icon
            sound: "./beeper_alert.mp3" // Default sound
          },
          data: {},
          to: token
        };
        
        // Send notification using FCM
        fcm.send(message, function (err, response) {
          if (err) {
            console.log("Error sending message:", err);
          } else {
            console.log("Message sent:", response);
          }
        });
  
      } else {
        console.log('No nearest user found.');
      }
    }

  } catch (error) {
    console.error('Error sending notifications:', error);
    // Handle error sending notifications
  }
};

// Route handler for sending notifications
app.post("/send", async function (req, res) {
  try {
    // Call the sendNotification function
    await sendNotification();
    res.status(200).send("Notifications sent successfully");
  } catch (error) {
    console.error('Error in sending notifications:', error);
    res.status(500).send("Failed to send notifications");
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
