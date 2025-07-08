// Firebase 연결 및 데이터 디버깅 스크립트
// 브라우저 콘솔에서 실행하여 Firebase 상태 확인

async function debugFirebase() {
    console.log('=== Firebase 디버깅 시작 ===');
    
    // 1. Firebase 객체 확인
    console.log('1. Firebase 객체 확인:');
    console.log('window.db:', window.db);
    console.log('window.firestore:', window.firestore);
    console.log('window.analytics:', window.analytics);
    
    if (!window.db || !window.firestore) {
        console.error('Firebase가 제대로 초기화되지 않았습니다!');
        return;
    }
    
    // 2. 데이터베이스 연결 테스트
    console.log('\n2. 데이터베이스 연결 테스트:');
    try {
        const q = window.firestore.query(
            window.firestore.collection(window.db, 'posts'),
            window.firestore.orderBy('date', 'desc')
        );
        
        console.log('Query 객체 생성 성공:', q);
        
        const querySnapshot = await window.firestore.getDocs(q);
        console.log('Query 실행 성공!');
        console.log('문서 개수:', querySnapshot.size);
        
        querySnapshot.forEach((doc) => {
            console.log('문서 ID:', doc.id);
            console.log('문서 데이터:', doc.data());
        });
        
    } catch (error) {
        console.error('데이터베이스 쿼리 실패:', error);
        console.error('에러 코드:', error.code);
        console.error('에러 메시지:', error.message);
    }
    
    // 3. 단순 컬렉션 접근 테스트
    console.log('\n3. 단순 컬렉션 접근 테스트:');
    try {
        const postsRef = window.firestore.collection(window.db, 'posts');
        const snapshot = await window.firestore.getDocs(postsRef);
        
        console.log('단순 컬렉션 접근 성공!');
        console.log('문서 개수:', snapshot.size);
        
    } catch (error) {
        console.error('단순 컬렉션 접근 실패:', error);
    }
    
    // 4. 테스트 문서 생성 시도
    console.log('\n4. 테스트 문서 생성 시도:');
    try {
        const testDoc = {
            title: "테스트 게시물",
            content: "Firebase 연결 테스트용 게시물입니다.",
            author: "시스템",
            date: new Date().toISOString(),
            likes: 0,
            liked: false,
            comments: []
        };
        
        const docRef = await window.firestore.addDoc(
            window.firestore.collection(window.db, 'posts'),
            testDoc
        );
        
        console.log('테스트 문서 생성 성공! ID:', docRef.id);
        
    } catch (error) {
        console.error('테스트 문서 생성 실패:', error);
    }
    
    console.log('\n=== Firebase 디버깅 완료 ===');
}

// 실행
debugFirebase();