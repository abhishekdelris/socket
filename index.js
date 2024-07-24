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
const serverKey = "AAAA7wCQWoY:APA91bH1Kzy4sffZE9ftswfmDkOLu5tjI_sObnKghbmmgx8fkkFBQ3z2qU5W96V3DG2zOHhI37WoNMq_0_QIUPQlOa1S0cDO_01czA2IJ1hBIw8k55sC82-z0awd1uRwnRy6Y5EkMkas";
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
  user: "karzzrxd_amosbe",
  password: "Akpokpokpor77@",
  database: "karzzrxd_alert"
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
        const coordinates = results.map(result => ({
          latitude: result.latitude,
          longitude: result.longitude,
        }));
        resolve({ tokens, coordinates });

      }
    });
  });
}

// FCM notification sending function
async function sendNotification(userLocation,data) {
  try {
    const { tokens, coordinates } = await getDeviceTokensFromDB();
    let nearestDeviceToken = null;
    let smallestDistance = Infinity;

    coordinates.forEach((coordinate, index) => {
      const distance = geolib.getDistance(userLocation, coordinate);
      if (distance < smallestDistance) {
        smallestDistance = distance;
        nearestDeviceToken = tokens[index];
      }
    });

    if (nearestDeviceToken) {
      console.log('Nearest device token:', nearestDeviceToken);

      const message = {
        content_available: true,
        mutable_content: true,
        notification: {
          title: 'Emergency Alert',
          body: "A user needs emergency service",
          icon: './emergency.png',
          sound: './beeper_alert.mp3',
        },
        data : data,
        to: nearestDeviceToken,
      };

      fcm.send(message, (err, response) => {
        if (err) {
          console.log('Error sending message:', err);
        } else {
          console.log('Message sent:', response);
        }
      });
    } else {
      console.log('No nearest device found.');
    }
  } catch (error) {
    console.log('Error in sendNotification:', error);
  }
}

app.get('/', (req, res) => {
  res.send('this is a send notification domain');
})


const userLocation = {
  latitude : 78.987,
  longitude : 56.576
}
sendNotification(userLocation);

io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle custom events
  socket.on('alertMessage', (data) => {
  
  
  const decodedData = JSON.parse(data);
     
      const dynamicKey = Object.keys(decodedData)[0];

    // Access latitude and longitude
    const latitude = decodedData.dynamicKey.Latitude;
    const longitude = decodedData.dynamicKey.Longitude;
    const userLocation = {
      latitude,
      longitude     }
    sendNotification(userLocation,data);


    io.emit('receiveAlert', userLocation); // Emit the alert to all connected clients 
    console.log('Alert message received:', userLocation);
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




server.listen();
