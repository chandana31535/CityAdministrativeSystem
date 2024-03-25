import { initializeApp } from "firebase/app";
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECTID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDERID",
  appId: "YOUR_APPID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
   
  //Initialize Firebase
  // const app = initializeApp(firebaseConfig);
  // const analytics = getAnalytics(app);
  if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
  export const auth = firebase.auth();
  export const firestore = firebase.firestore();