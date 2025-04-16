// This script registers the service worker when the page loads

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(function(error) {
        console.log('ServiceWorker registration failed: ', error);
      });
  });

  // Add event listener for online/offline status
  window.addEventListener('online', function() {
    document.dispatchEvent(new CustomEvent('online-status-changed', { detail: { online: true } }));
  });

  window.addEventListener('offline', function() {
    document.dispatchEvent(new CustomEvent('online-status-changed', { detail: { online: false } }));
  });
}

// Function to request notification permission
function requestNotificationPermission() {
  if ('Notification' in window) {
    Notification.requestPermission().then(function(permission) {
      if (permission === 'granted') {
        console.log('Notification permission granted');
        
        // Subscribe to push notifications if supported
        if ('PushManager' in window) {
          subscribeToPushNotifications();
        }
      }
    });
  }
}

// Function to subscribe to push notifications
function subscribeToPushNotifications() {
  navigator.serviceWorker.ready
    .then(function(registration) {
      // This would normally use your actual VAPID key
      const applicationServerKey = urlBase64ToUint8Array(
        'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
      );

      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
    })
    .then(function(subscription) {
      // Send the subscription to your server
      console.log('User is subscribed:', subscription);
      
      // In a real app, you would send this subscription to your server
      // Example: fetch('/api/save-subscription', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(subscription)
      // });
    })
    .catch(function(error) {
      console.log('Failed to subscribe the user: ', error);
    });
}

// Helper function to convert base64 string to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
} 