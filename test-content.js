// 테스트 컨텐츠 생성 스크립트
// 브라우저 콘솔에서 실행하여 Firebase에 테스트 데이터 추가

async function createTestContent() {
    // Firebase 로드 대기
    while (!window.db || !window.firestore) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('Firebase 연결됨, 테스트 컨텐츠 생성 중...');
    
    const testPosts = [
        {
            title: "안녕하세요! 첫 번째 게시물입니다",
            content: "Viecoday Story에 오신 것을 환영합니다. 이곳에서 일상을 공유하고 소통해보세요!",
            author: "관리자",
            date: new Date().toISOString(),
            likes: 3,
            liked: false,
            comments: [
                {
                    id: "comment1",
                    content: "첫 번째 댓글입니다! 환영합니다.",
                    date: new Date().toISOString(),
                    likes: 1,
                    liked: false
                }
            ]
        },
        {
            title: "좋은 하루 보내세요",
            content: "오늘 날씨가 정말 좋네요. 산책하며 기분 좋은 하루를 보내고 있습니다. 여러분도 좋은 하루 되세요!",
            author: "사용자",
            date: new Date(Date.now() - 3600000).toISOString(), // 1시간 전
            likes: 7,
            liked: false,
            comments: []
        },
        {
            title: "주말 계획 공유해요",
            content: "이번 주말에 카페 투어를 계획하고 있어요. 맛있는 카페 추천해주세요!",
            author: "커피러버",
            date: new Date(Date.now() - 7200000).toISOString(), // 2시간 전
            likes: 12,
            liked: false,
            comments: [
                {
                    id: "comment2",
                    content: "홍대 근처 블루보틀 추천해요!",
                    date: new Date(Date.now() - 3600000).toISOString(),
                    likes: 2,
                    liked: false
                },
                {
                    id: "comment3",
                    content: "성수동 카페 거리도 좋아요.",
                    date: new Date(Date.now() - 1800000).toISOString(),
                    likes: 1,
                    liked: false
                }
            ]
        }
    ];
    
    try {
        for (const post of testPosts) {
            const docRef = await window.firestore.addDoc(
                window.firestore.collection(window.db, 'posts'),
                post
            );
            console.log(`테스트 게시물 생성됨: ${docRef.id} - ${post.title}`);
        }
        console.log('모든 테스트 컨텐츠 생성 완료!');
        
        // 페이지 새로고침하여 컨텐츠 확인
        if (typeof loadPostsFromFirebase === 'function') {
            await loadPostsFromFirebase();
        }
        
    } catch (error) {
        console.error('테스트 컨텐츠 생성 실패:', error);
    }
}

// 실행
createTestContent();