
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";
import { getAuth, Auth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdgZZV7YKSbrzBqumc33G7y-PnTJeR-ck",
  authDomain: "schedule-app-e9918.firebaseapp.com",
  databaseURL: "https://schedule-app-e9918-default-rtdb.firebaseio.com",
  projectId: "schedule-app-e9918",
  storageBucket: "schedule-app-e9918.appspot.com",
  messagingSenderId: "985983742655",
  appId: "1:985983742655:web:d9f5011495c2cfec528c0a"
};


let app: FirebaseApp;
let auth: Auth;
let database: Database;

// This ensures we initialize Firebase only once
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

auth = getAuth(app);
database = getDatabase(app);


export { app, database, auth };
