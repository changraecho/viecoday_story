// Firebase 설정 파일
// Firebase Console에서 복사한 설정 정보를 여기에 붙여넣으세요

const firebaseConfig = {
  apiKey: "AIzaSyDkizkARVKF2K8cYoDsmp90t9fAYnBteMc",
  authDomain: "viecoday-story.firebaseapp.com",
  projectId: "viecoday-story",
  storageBucket: "viecoday-story.firebasestorage.app",
  messagingSenderId: "34135324273",
  appId: "1:34135324273:web:b4769983ef770c8c9b4dd0",
  measurementId: "G-0TSSCC89DB"
};

// Firebase 초기화
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy,
  query,
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-analytics.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// 전역 변수로 내보내기
window.db = db;
window.analytics = analytics;
window.firestore = {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  onSnapshot
};
window.analyticsUtils = {
  logEvent
};