document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
  
    document.getElementById('sendAlert').addEventListener('click', async () => {
      const alertData = {
        uniqueKey: 'Nxm4aTJ0-gxhXu0FDTh',
        Date: new Date().toLocaleString(),
        Emergency: 'A user needs emergency service',
        Latitude: 31.5545131,
        Longitude: 74.3635971,
        UserName: 'M.Hamza',
        city: 'Lahore',
        isRead: true,
        state: 'Punjab',
        user_Img: 'https://firebasestorage.googleapis.com/v0/b/karzame-f00a9.appspot.com/o/UserPics%2Ffile%3A%2Fstorage%2Femulated%2F0%2FAndroid%2Fdata%2Fcom.karzamesos.app%2Ffiles%2FPictures%2Fe5856340-9b10-4b76-9d76-37c41dcea4aa_1714495511843.jpg?alt=media&token=cda67c9d-0d85-4046-862a-f315ad812c69',
        user_Name: 'M.Hamza',
        user_Phone: '+923164558585'
      };
      
      await socket.emit('alertMessage', alertData);
    });
  
    socket.on('receiveAlert', (data) => {
      console.log('Received alert:', data);
      // console.log(alertData);
      // Handle the received alert data as needed
    socket.emit('received_message',data)
   
    });
  });
  