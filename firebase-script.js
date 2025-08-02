/**
 * Viecoday Story - Firebase 연동 및 SPA 라우팅 스크립트
 * 베트남 커뮤니티 플랫폼을 위한 메인 애플리케이션 로직
 */

// 전역 상태 변수
let posts = []; // Firebase에서 로드된 게시글 배열
let postIdCounter = 1; // 게시글 ID 카운터 (사용 안 함, Firebase 자동 ID 사용)
let currentPage = 'home'; // 현재 페이지 상태 ('home', 'write', 'detail')
let currentPostId = null; // 현재 보고 있는 게시글 ID

/**
 * SPA 라우팅 관리 클래스
 * URL 변경 없이 페이지 전환을 처리하고 개별 글 URL 지원
 */
class Router {
    constructor() {
        this.routes = {
            '/': () => this.showHomePage(), // 홈페이지 (게시글 목록)
            '/write': () => this.showWritePage(), // 글 작성 페이지  
            '/post/:id': (id) => this.showPostPage(id) // 개별 글 상세 페이지
        };
        this.init();
    }

    init() {
        // 브라우저 뒤로가기/앞으로가기 처리
        window.addEventListener('popstate', () => this.handleRoute());
    }

    // 라우터 초기화 (Firebase 로드 후 호출)
    initializeRouting() {
        this.handleRoute();
    }

    handleRoute() {
        const path = window.location.pathname;
        const hash = window.location.hash.replace('#', '');
        
        // 해시 기반 라우팅도 지원
        const routePath = hash || path;
        
        if (routePath === '/' || routePath === '') {
            this.showHomePage();
        } else if (routePath === '/write') {
            this.showWritePage();
        } else if (routePath.startsWith('/post/')) {
            const postId = routePath.replace('/post/', '');
            this.showPostPage(postId);
        } else {
            this.showHomePage(); // 기본값
        }
    }

    navigateTo(path) {
        // URL 업데이트 (페이지 새로고침 없이)
        window.history.pushState({}, '', path);
        this.handleRoute();
    }

    showHomePage() {
        currentPage = 'home';
        document.getElementById('writePage').style.display = 'none';
        document.getElementById('detailPage').style.display = 'none';
        document.querySelector('.container').style.display = 'block';
        document.getElementById('floatingBtn').style.display = 'flex';
        
        // 하단 탭바 표시
        const bottomTabBar = document.querySelector('.bottom-tab-bar');
        if (bottomTabBar) bottomTabBar.style.display = 'flex';
        
        // URL 업데이트
        if (window.location.pathname !== '/') {
            window.history.replaceState({}, '', '/');
        }
        
        // 홈페이지에서 글이 없으면 다시 로드 시도
        if (posts.length === 0) {
            console.log('홈페이지에서 글이 없어서 Firebase 재로드 시도');
            loadPostsFromFirebase();
        }
    }

    showWritePage() {
        currentPage = 'write';
        document.getElementById('writePage').style.display = 'flex';
        document.getElementById('detailPage').style.display = 'none';
        document.querySelector('.container').style.display = 'none';
        document.getElementById('floatingBtn').style.display = 'none';
        
        // 하단 탭바 숨기기
        const bottomTabBar = document.querySelector('.bottom-tab-bar');
        if (bottomTabBar) bottomTabBar.style.display = 'none';
        
        // 입력 필드 초기화
        document.getElementById('postTitle').value = '';
        document.getElementById('postContent').value = '';
        
        // 글 작성 페이지 진입 이벤트
        logAnalyticsEvent('page_view', {
            page_title: 'Write Post',
            page_location: window.location.href
        });
    }

    showPostPage(postId) {
        currentPage = 'detail';
        currentPostId = postId;
        document.getElementById('writePage').style.display = 'none';
        document.getElementById('detailPage').style.display = 'flex';
        document.querySelector('.container').style.display = 'none';
        document.getElementById('floatingBtn').style.display = 'none';
        
        // 하단 탭바 숨기기
        const bottomTabBar = document.querySelector('.bottom-tab-bar');
        if (bottomTabBar) bottomTabBar.style.display = 'none';
        
        console.log('글 상세 페이지 진입:', postId, 'posts 배열 길이:', posts.length);
        
        // 로딩 상태 표시
        this.showPostDetailLoading();
        
        // 항상 Firebase에서 최신 데이터를 다시 로드
        this.loadPostAndRender(postId);
        
        // 글 상세 페이지 진입 이벤트
        logAnalyticsEvent('select_content', {
            content_type: 'post',
            item_id: postId,
            content_title: 'Loading'
        });
    }

    async loadPostAndRender(postId) {
        console.log('Firebase에서 최신 데이터 로드 시작:', postId);
        
        try {
            // Firebase에서 최신 데이터 로드
            await loadPostsFromFirebase();
            
            console.log('Firebase 로드 완료, posts 길이:', posts.length);
            console.log('찾는 글 ID:', postId);
            
            // 로드 후 글 찾기
            const post = posts.find(p => p.id === postId);
            
            if (post) {
                console.log('글 찾음:', post.title);
                renderPostDetail(postId);
            } else {
                console.log('글을 찾을 수 없음. 전체 글 ID 목록:', posts.map(p => p.id));
                this.showPostNotFound();
            }
        } catch (error) {
            console.error('Firebase 로드 실패:', error);
            this.showPostNotFound();
        }
    }

    showPostDetailLoading() {
        const postDetailElement = document.getElementById('postDetail');
        postDetailElement.innerHTML = `
            <div class="loading-container" style="text-align: center; padding: 40px;">
                <div class="loading-spinner" style="margin: 20px auto; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #333; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p>Đang tải bài viết...</p>
            </div>
        `;
        
        // 액션 버튼들 비활성화
        const likeBtn = document.getElementById('detailLikeBtn');
        const commentBtn = document.getElementById('detailCommentBtn');
        const shareBtn = document.getElementById('detailShareBtn');
        
        if (likeBtn) likeBtn.style.display = 'none';
        if (commentBtn) commentBtn.style.display = 'none';
        if (shareBtn) shareBtn.style.display = 'none';
        
        // 댓글 섹션 숨기기
        const commentsList = document.getElementById('detailCommentsList');
        const commentInput = document.getElementById('commentInput');
        const commentSubmit = document.getElementById('commentSubmitBtn');
        
        if (commentsList) commentsList.innerHTML = '';
        if (commentInput) commentInput.style.display = 'none';
        if (commentSubmit) commentSubmit.style.display = 'none';
    }

    showPostNotFound() {
        const postDetailElement = document.getElementById('postDetail');
        postDetailElement.innerHTML = `
            <div class="not-found-container" style="text-align: center; padding: 40px;">
                <h2>Không tìm thấy bài viết</h2>
                <p>Bài viết này có thể đã bị xóa hoặc không tồn tại.</p>
                <button onclick="router.navigateTo('/')" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Về trang chủ</button>
            </div>
        `;
        
        // 액션 버튼들 숨기기
        const likeBtn = document.getElementById('detailLikeBtn');
        const commentBtn = document.getElementById('detailCommentBtn');
        const shareBtn = document.getElementById('detailShareBtn');
        
        if (likeBtn) likeBtn.style.display = 'none';
        if (commentBtn) commentBtn.style.display = 'none';
        if (shareBtn) shareBtn.style.display = 'none';
        
        // 댓글 섹션 숨기기
        const commentsList = document.getElementById('detailCommentsList');
        const commentInput = document.getElementById('commentInput');
        const commentSubmit = document.getElementById('commentSubmitBtn');
        
        if (commentsList) commentsList.innerHTML = '';
        if (commentInput) commentInput.style.display = 'none';
        if (commentSubmit) commentSubmit.style.display = 'none';
    }

}

// 전역 라우터 인스턴스
let router;

// Firebase가 로드되기를 기다림
function waitForFirebase() {
    return new Promise((resolve) => {
        const checkFirebase = () => {
            if (window.db && window.firestore && window.analytics) {
                resolve();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    });
}

// Analytics 이벤트 로깅 함수
function logAnalyticsEvent(eventName, parameters = {}) {
    if (window.analytics && window.analyticsUtils) {
        window.analyticsUtils.logEvent(window.analytics, eventName, parameters);
    }
}

// 날짜 포맷팅 함수 (베트남 시간대)
function formatPostDate(dateValue) {
    try {
        if (!dateValue) return 'Không có ngày';
        
        // Firebase Timestamp인 경우
        if (dateValue && dateValue.toDate) {
            return dateValue.toDate().toLocaleString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh'
            });
        }
        
        // 문자열이나 다른 형태인 경우
        const dateObj = new Date(dateValue);
        if (!isNaN(dateObj.getTime())) {
            return dateObj.toLocaleString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh'
            });
        }
        
        // 모든 변환이 실패한 경우
        return dateValue.toString();
    } catch (error) {
        console.error('날짜 포맷 오류:', error, dateValue);
        return 'Lỗi ngày';
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // Firebase 로드 대기
    await waitForFirebase();
    
    // 라우터 초기화
    router = new Router();
    
    const floatingBtn = document.getElementById('floatingBtn');
    const backBtn = document.getElementById('backBtn');
    const detailBackBtn = document.getElementById('detailBackBtn');
    const submitBtn = document.getElementById('submitBtn');
    const modal = document.getElementById('shareModal');
    const closeModal = document.querySelector('.close');
    const detailHeaderShareBtn = document.getElementById('detailHeaderShareBtn');

    // 플로팅 버튼 클릭 - 글 작성 페이지로 이동
    floatingBtn.addEventListener('click', function() {
        router.navigateTo('/write');
    });

    // 뒤로 가기 버튼들
    backBtn.addEventListener('click', function() {
        router.navigateTo('/');
    });

    detailBackBtn.addEventListener('click', function() {
        router.navigateTo('/');
    });

    // 글 상세 페이지 헤더 공유 버튼
    detailHeaderShareBtn.addEventListener('click', function() {
        if (currentPostId) {
            openShareModal(currentPostId);
        }
    });

    // 글 작성 완료 버튼
    submitBtn.addEventListener('click', function() {
        createPost();
    });

    // 모달 닫기
    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // 댓글 작성 기능
    document.getElementById('commentSubmitBtn').addEventListener('click', function() {
        addCommentToDetail();
    });

    document.getElementById('commentInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addCommentToDetail();
        }
    });

    // Firebase 데이터 로드 후 라우팅 처리
    await loadPostsFromFirebase();
    
    // 데이터 로드 완료 후 라우터 초기화
    router.initializeRouting();
    
    // 페이지 방문 이벤트 로깅
    logAnalyticsEvent('page_view', {
        page_title: 'Viecoday Story Home',
        page_location: window.location.href
    });
});

// 이전 버전과의 호환성을 위한 함수들 (라우터로 대체됨)
function showHomePage() {
    router.navigateTo('/');
}

function showWritePage() {
    router.navigateTo('/write');
}

function showDetailPage(postId) {
    router.navigateTo('/post/' + postId);
}

async function createPost() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    
    if (title.trim() === '' || content.trim() === '') {
        alert('Vui lòng nhập cả tiêu đề và nội dung.');
        return;
    }

    const post = {
        title: title,
        content: content,
        author: 'Ẩn danh',
        date: new Date().toISOString(),
        likes: 0,
        liked: false,
        comments: []
    };

    try {
        // Firebase에 저장
        const docRef = await window.firestore.addDoc(
            window.firestore.collection(window.db, 'posts'), 
            post
        );
        console.log('글이 저장되었습니다:', docRef.id);
        
        // 글 작성 이벤트 로깅
        logAnalyticsEvent('post_create', {
            content_type: 'post',
            content_title: title,
            content_length: content.length
        });
        
        router.navigateTo('/');
        loadPostsFromFirebase(); // 새로고침
    } catch (error) {
        console.error('Lưu bài viết thất bại:', error);
        alert('Lưu bài viết thất bại.');
    }
}

async function loadPostsFromFirebase() {
    try {
        console.log('Firebase에서 posts 로드 시작...');
        
        // orderBy 없이 모든 문서를 가져온 후 클라이언트에서 정렬
        const postsRef = window.firestore.collection(window.db, 'posts');
        const querySnapshot = await window.firestore.getDocs(postsRef);
        
        console.log('Firebase 쿼리 완료. 문서 개수:', querySnapshot.size);
        posts = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('로드된 문서 ID:', doc.id, '제목:', data.title);
            posts.push({
                id: doc.id,
                ...data,
                date: data.date // 원본 날짜 형식 유지
            });
        });
        
        // 클라이언트에서 날짜순 정렬 (최신 글부터)
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        console.log('메인 페이지 posts 로드 완료:', posts.length, '개');
        renderPosts();
    } catch (error) {
        console.error('Tải dữ liệu thất bại:', error);
        console.error('에러 상세:', error.code, error.message);
        // 실패 시 샘플 데이터 로드
        loadSamplePosts();
    }
}

function renderPosts() {
    const postsContainer = document.getElementById('posts');
    postsContainer.innerHTML = '';

    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        
        postElement.innerHTML = `
            <div class="post-header">
                <div class="post-author">
                    <div class="author-avatar">
                        ${post.author.charAt(0)}
                    </div>
                    <div class="author-info">
                        <div class="author-name">${post.author}</div>
                        <div class="post-date">${formatPostDate(post.date)}</div>
                    </div>
                </div>
            </div>
            <div class="post-content-area" onclick="router.navigateTo('/post/${post.id}')">
                <div class="post-title">${post.title}</div>
                <div class="post-content">${post.content}</div>
            </div>
            <div class="post-stats">
                <div class="stat-item like-btn ${post.liked ? 'liked' : ''}" onclick="event.stopPropagation(); toggleLikeFromList('${post.id}')">
                    <span>${post.liked ? '❤️' : '♡'}</span>
                    <span>${post.likes}</span>
                </div>
                <div class="stat-item" onclick="router.navigateTo('/post/${post.id}')">
                    <span>💬</span>
                    <span>${post.comments ? post.comments.length : 0}</span>
                </div>
            </div>
        `;
        postsContainer.appendChild(postElement);
    });
}

async function toggleLikeFromList(postId) {
    const post = posts.find(p => p.id === postId);
    if (post) {
        if (post.liked) {
            post.likes--;
            post.liked = false;
        } else {
            post.likes++;
            post.liked = true;
        }
        
        try {
            // Firebase 업데이트
            await window.firestore.updateDoc(
                window.firestore.doc(window.db, 'posts', postId),
                {
                    likes: post.likes,
                    liked: post.liked
                }
            );
            
            // 좋아요 이벤트 로깅
            logAnalyticsEvent('like_post', {
                content_type: 'post',
                item_id: postId,
                action: post.liked ? 'like' : 'unlike'
            });
            
            renderPosts();
        } catch (error) {
            console.error('Cập nhật thích thất bại:', error);
        }
    }
}

function renderPostDetail(postId) {
    console.log('renderPostDetail 시작:', postId);
    
    const post = posts.find(p => p.id === postId);
    if (!post) {
        console.error('renderPostDetail: 글을 찾을 수 없음:', postId);
        if (router) {
            router.showPostNotFound();
        }
        return;
    }

    console.log('renderPostDetail: 글 찾음:', post.title);

    const postDetailElement = document.getElementById('postDetail');
    if (!postDetailElement) {
        console.error('renderPostDetail: postDetail 엘리먼트를 찾을 수 없음');
        return;
    }

    // 글 내용 렌더링 (액션 버튼은 HTML에서 별도로 처리)
    postDetailElement.innerHTML = `
        <div class="post-header">
            <div class="post-author">
                <div class="author-avatar">
                    ${post.author.charAt(0)}
                </div>
                <div class="author-info">
                    <div class="author-name">${post.author}</div>
                    <div class="post-date">${formatPostDate(post.date)}</div>
                </div>
            </div>
        </div>
        <div class="post-title">${post.title}</div>
        <div class="post-content">${post.content}</div>
    `;

    console.log('renderPostDetail: 글 내용 렌더링 완료');

    // 액션 버튼 업데이트 및 표시
    const likeBtn = document.getElementById('detailLikeBtn');
    const commentBtn = document.getElementById('detailCommentBtn');
    const shareBtn = document.getElementById('detailShareBtn');
    const commentInput = document.getElementById('commentInput');
    const commentSubmit = document.getElementById('commentSubmitBtn');

    console.log('renderPostDetail: 버튼 엘리먼트들:', {
        likeBtn: !!likeBtn,
        commentBtn: !!commentBtn,
        shareBtn: !!shareBtn,
        commentInput: !!commentInput,
        commentSubmit: !!commentSubmit
    });

    if (likeBtn) {
        likeBtn.innerHTML = `
            <span class="icon">${post.liked ? '❤️' : '♡'}</span>
            <span class="count">${post.likes}</span>
        `;
        likeBtn.className = `action-btn ${post.liked ? 'liked' : ''}`;
        likeBtn.onclick = () => toggleDetailLike(postId);
        likeBtn.style.display = 'flex';
        console.log('renderPostDetail: 좋아요 버튼 설정 완료');
    }

    if (commentBtn) {
        commentBtn.innerHTML = `
            <span class="icon">💬</span>
            <span class="count">${post.comments ? post.comments.length : 0}</span>
        `;
        commentBtn.style.display = 'flex';
        console.log('renderPostDetail: 댓글 버튼 설정 완료');
    }

    if (shareBtn) {
        shareBtn.onclick = () => openShareModal(postId);
        shareBtn.style.display = 'flex';
        console.log('renderPostDetail: 공유 버튼 설정 완료');
    }

    // 댓글 입력 필드 표시
    if (commentInput) {
        commentInput.style.display = 'block';
        console.log('renderPostDetail: 댓글 입력창 표시');
    }
    if (commentSubmit) {
        commentSubmit.style.display = 'block';
        console.log('renderPostDetail: 댓글 제출 버튼 표시');
    }

    // 댓글 목록 렌더링
    renderDetailComments(post.comments || []);
    console.log('renderPostDetail: 댓글 목록 렌더링 완료');
}

// 댓글 좋아요 토글 함수
async function toggleCommentLike(postId, commentId) {
    console.log('댓글 좋아요 토글:', postId, commentId);
    
    const post = posts.find(p => p.id === postId);
    if (!post || !post.comments) {
        console.error('댓글을 찾을 수 없음:', postId, commentId);
        return;
    }
    
    const comment = post.comments.find(c => c.id === commentId);
    if (!comment) {
        console.error('해당 댓글을 찾을 수 없음:', commentId);
        return;
    }
    
    // 좋아요 상태 토글
    if (comment.liked) {
        comment.likes = Math.max(0, comment.likes - 1);
        comment.liked = false;
        console.log('댓글 좋아요 취소:', comment.likes);
    } else {
        comment.likes++;
        comment.liked = true;
        console.log('댓글 좋아요 추가:', comment.likes);
    }
    
    try {
        // Firebase 업데이트
        await window.firestore.updateDoc(
            window.firestore.doc(window.db, 'posts', postId),
            {
                comments: post.comments
            }
        );
        
        console.log('Firebase 댓글 좋아요 업데이트 완료');
        
        // UI 즉시 업데이트
        renderDetailComments(post.comments);
        
        // 댓글 수도 업데이트 (좋아요는 댓글 수에 영향 없음)
        const commentBtn = document.getElementById('detailCommentBtn');
        if (commentBtn) {
            commentBtn.innerHTML = `
                <span class="icon">💬</span>
                <span class="count">${post.comments.length}</span>
            `;
        }
        
    } catch (error) {
        console.error('댓글 좋아요 업데이트 실패:', error);
        
        // 실패 시 원래 상태로 복원
        if (comment.liked) {
            comment.likes = Math.max(0, comment.likes - 1);
            comment.liked = false;
        } else {
            comment.likes++;
            comment.liked = true;
        }
        
        alert('좋아요 업데이트에 실패했습니다.');
    }
}

function renderDetailComments(comments) {
    const commentsList = document.getElementById('detailCommentsList');
    commentsList.innerHTML = comments.map(comment => `
        <div class="comment">
            <div class="comment-header">
                <span class="comment-author">Ẩn danh</span>
                <span class="comment-date">${formatPostDate(comment.date)}</span>
            </div>
            <div class="comment-content">${comment.content}</div>
            <div class="comment-actions">
                <button class="comment-like-btn ${comment.liked ? 'liked' : ''}" onclick="toggleCommentLike('${comment.postId}', '${comment.id}')">
                    <span>${comment.liked ? '❤️' : '♡'}</span>
                    <span>${comment.likes}</span>
                </button>
            </div>
        </div>
    `).join('');
}

async function toggleDetailLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (post) {
        if (post.liked) {
            post.likes--;
            post.liked = false;
        } else {
            post.likes++;
            post.liked = true;
        }
        
        try {
            await window.firestore.updateDoc(
                window.firestore.doc(window.db, 'posts', postId),
                {
                    likes: post.likes,
                    liked: post.liked
                }
            );
            renderPosts();
            renderPostDetail(postId);
        } catch (error) {
            console.error('Cập nhật thích thất bại:', error);
        }
    }
}

async function addCommentToDetail() {
    const commentInput = document.getElementById('commentInput');
    const commentContent = commentInput.value.trim();
    
    if (commentContent === '') {
        alert('Vui lòng nhập nội dung bình luận.');
        return;
    }

    const post = posts.find(p => p.id === currentPostId);
    if (!post) return;

    const comment = {
        id: Date.now().toString(),
        postId: currentPostId,
        content: commentContent,
        date: new Date().toISOString(),
        likes: 0,
        liked: false
    };

    if (!post.comments) post.comments = [];
    post.comments.push(comment);
    commentInput.value = '';
    
    try {
        await window.firestore.updateDoc(
            window.firestore.doc(window.db, 'posts', currentPostId),
            {
                comments: post.comments
            }
        );
        
        // 댓글 작성 이벤트 로깅
        logAnalyticsEvent('comment_create', {
            content_type: 'comment',
            post_id: currentPostId,
            comment_length: commentContent.length
        });
        
        renderPosts();
        renderPostDetail(currentPostId);
    } catch (error) {
        console.error('Lưu bình luận thất bại:', error);
    }
}

function openShareModal(postId) {
    const modal = document.getElementById('shareModal');
    modal.style.display = 'block';
    modal.setAttribute('data-post-id', postId);
}

function shareToFacebook() {
    const postId = document.getElementById('shareModal').getAttribute('data-post-id');
    const post = posts.find(p => p.id == postId);
    const postUrl = `${window.location.origin}/post/${postId}`;
    const url = encodeURIComponent(postUrl);
    const text = encodeURIComponent(`${post.title} - ${post.content.substring(0, 100)}...`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank');
}


function copyLink() {
    const postId = document.getElementById('shareModal').getAttribute('data-post-id');
    const postUrl = postId ? `${window.location.origin}/post/${postId}` : window.location.href;
    
    navigator.clipboard.writeText(postUrl).then(() => {
        alert('Liên kết đã được sao chép!');
        document.getElementById('shareModal').style.display = 'none';
    }).catch(() => {
        alert('Sao chép liên kết thất bại.');
    });
}

function loadSamplePosts() {
    // 샘플 데이터 (Firebase 연결 실패 시 백업)
    const samplePosts = [
        {
            id: 'sample1',
            title: "Đang kết nối Firebase...",
            content: "Đang kết nối với cơ sở dữ liệu Firebase. Vui lòng chờ trong giây lát.",
            author: "Hệ thống",
            date: new Date().toISOString(),
            likes: 0,
            liked: false,
            comments: []
        }
    ];

    posts = samplePosts;
    renderPosts();
}