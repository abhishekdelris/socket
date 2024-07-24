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
const serverKey = "AAAA7wCQWoY:APA91bH1Kzy4sffZE9ftswfmDkOLu5tjI_sObnKghbmmgx8fkkFBQ3z2qU5W96V3DG2zOHhI37WoNMq_0_QIUPQlOa1S0cDO_01czA2IJ1hBIw8k55sC82-z0awd1uRwnRy6Y5EkMkas" ;
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
async function sendNotification(userLocation) {
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


// const userLocation = {
//   latitude : 78.987,
//   longitude : 56.576
// }
// sendNotification(userLocation);


io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle custom events
  socket.on('alertMessage', (data) => {
      
      
      
        // Extract latitude and longitude from data
    let latitude = null;
    let longitude = null;

    Object.entries(data).forEach(([key, value]) => {
      if (key === 'Latitude') {
        latitude = value;
      } else if (key === 'Longitude') {
        longitude = value;
      }
    });

    if (latitude !== null && longitude !== null) {
      const userLocation = { latitude, longitude };
      
    //   function getLatitude(data, key) {
    //       return data[key] ? data[key].Latitude : null;
    //   }
      
    //   function getLogitude(data, key) {
    //       return data[key] ? data[key].Longitude : null;
    //   }
       
      
    //     const  latitude= getLatitude(data, key);
    //     const  logitude= getLogitude(data, key);
    
    //       const arrayFromEntries = Object.entries(data);
    //   console.log(arrayFromEntries);


// Using Object.keys() and Array.map() to convert JSON object to array of objects
// const arrayFromKeys = Object.keys(data);
// // .map(key => ({
// //     key
// // //   latitude :key.Latitude,
// // //   logitude : key.Longitude
// // }));
// 
// console.log(arrayFromKeys);

    //   const  { latitude,  longitude } = data;
    //   console.log(  latitude,  longitude );
    //   const userLocation =  { latitude,  longitude };
      
        sendNotification(userLocation);


//               //pre notificatiion
//     const message = {
//       content_available: true,
//       mutable_content: true,
//       notification: {
//       title: "Emergency Alert", 
//       body: "this is a message", 
//       icon : "./emergency.png",//Default Icon
//       sound :`'./beeper_alert.mp3'`,//Default sound
//      }, 
//      to: "fGT0snVmQV6X9BubojMyH_:APA91bFkosltcx1AqH78NNwerOPerKDd-TYFB3M7QBBLNcrnmXNn2rcqQK2-EDx1XEnnsLbVgHV_FZfroM4rZs-StobKi5aqgmRL8LhBu6U_B_hoAJzAzXtMUrBP2GaBxAYDOKqS2m_0"
//   }
   
   
//   fcm.send(message, function (err, response) {    
//      if(err){
//       console.log("error sending message :", err); 
//      } else {
//       console.log("send message:", response);
//      } 
//   })
  
    // io.emit('receiveAlert', arrayFromKeys); // Emit the alert to all connected clients
    //   function getLatitude(data, key) {
    //       return data[key] ? data[key].Latitude : null;
    //   }
      
    //   function getLogitude(data, key) {
    //       return data[key] ? data[key].Longitude : null;
    //   }
       
    //     // const key = "-Nxm4aTJ0-gxhXu0FDTh"
    // console.log(getLatitude(data, key)); 
    // console.log(getLogitude(data, key));
     io.emit('receiveAlert',userLocation); 
    console.log('Alert message received:', data);
    }
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
