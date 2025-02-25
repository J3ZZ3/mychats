import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCSz62FdByLc--MIAGyW63Bu_zYWdRqX5Y",
    authDomain: "sessions-63c09.firebaseapp.com",
    databaseURL: "https://sessions-63c09-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "sessions-63c09",
    storageBucket: "sessions-63c09.firebasestorage.app",
    messagingSenderId: "400978746959",
    appId: "1:400978746959:web:bf07cbd1da3d451a16143a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);