import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDy9RngtXub6jn1ZlekQI3jhKyRlQfwv6U',
  authDomain: 'trade-da943.firebaseapp.com',
  projectId: 'trade-da943',
  storageBucket: 'trade-da943.firebasestorage.app',
  messagingSenderId: '1099480763776',
  appId: '1:1099480763776:web:30f0f231ec611597c64565',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
