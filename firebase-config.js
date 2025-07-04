// Firebase 설정 파일
// Firebase Console에서 복사한 설정 정보를 여기에 붙여넣으세요

const firebaseConfig = {
  // TODO: Firebase Console에서 복사한 설정을 여기에 붙여넣기
  // 예시:
  // apiKey: "your-api-key",
  // authDomain: "viecoday-story.firebaseapp.com",
  // projectId: "viecoday-story",
  // storageBucket: "viecoday-story.appspot.com",
  // messagingSenderId: "123456789",
  // appId: "your-app-id"
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 전역 변수로 내보내기
window.db = db;
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