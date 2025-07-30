// Firebase 연동 스크립트
let posts = [];
let postIdCounter = 1;
let currentPage = 'home';
let currentPostId = null;

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
    
    const floatingBtn = document.getElementById('floatingBtn');
    const backBtn = document.getElementById('backBtn');
    const detailBackBtn = document.getElementById('detailBackBtn');
    const submitBtn = document.getElementById('submitBtn');
    const modal = document.getElementById('shareModal');
    const closeModal = document.querySelector('.close');

    // 플로팅 버튼 클릭 - 글 작성 페이지로 이동
    floatingBtn.addEventListener('click', function() {
        showWritePage();
    });

    // 뒤로 가기 버튼들
    backBtn.addEventListener('click', function() {
        showHomePage();
    });

    detailBackBtn.addEventListener('click', function() {
        showHomePage();
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

    loadPostsFromFirebase();
    
    // 페이지 방문 이벤트 로깅
    logAnalyticsEvent('page_view', {
        page_title: 'Viecoday Story Home',
        page_location: window.location.href
    });
});

function showHomePage() {
    currentPage = 'home';
    document.getElementById('writePage').style.display = 'none';
    document.getElementById('detailPage').style.display = 'none';
    document.querySelector('.container').style.display = 'block';
    document.getElementById('floatingBtn').style.display = 'flex';
}

function showWritePage() {
    currentPage = 'write';
    document.getElementById('writePage').style.display = 'flex';
    document.getElementById('detailPage').style.display = 'none';
    document.querySelector('.container').style.display = 'none';
    document.getElementById('floatingBtn').style.display = 'none';
    
    // 입력 필드 초기화
    document.getElementById('postTitle').value = '';
    document.getElementById('postContent').value = '';
    
    // 글 작성 페이지 진입 이벤트
    logAnalyticsEvent('page_view', {
        page_title: 'Write Post',
        page_location: window.location.href + '#write'
    });
}

function showDetailPage(postId) {
    currentPage = 'detail';
    currentPostId = postId;
    document.getElementById('writePage').style.display = 'none';
    document.getElementById('detailPage').style.display = 'flex';
    document.querySelector('.container').style.display = 'none';
    document.getElementById('floatingBtn').style.display = 'none';
    
    renderPostDetail(postId);
    
    // 글 상세 페이지 진입 이벤트
    const post = posts.find(p => p.id === postId);
    logAnalyticsEvent('select_content', {
        content_type: 'post',
        item_id: postId,
        content_title: post ? post.title : 'Unknown'
    });
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
        
        showHomePage();
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
            <div class="post-content-area" onclick="showDetailPage('${post.id}')">
                <div class="post-title">${post.title}</div>
                <div class="post-content">${post.content}</div>
            </div>
            <div class="post-stats">
                <div class="stat-item like-btn ${post.liked ? 'liked' : ''}" onclick="event.stopPropagation(); toggleLikeFromList('${post.id}')">
                    <span>${post.liked ? '❤️' : '♡'}</span>
                    <span>${post.likes}</span>
                </div>
                <div class="stat-item" onclick="showDetailPage('${post.id}')">
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
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const postDetailElement = document.getElementById('postDetail');
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

    // 액션 버튼 업데이트
    const likeBtn = document.getElementById('detailLikeBtn');
    const commentBtn = document.getElementById('detailCommentBtn');
    const shareBtn = document.getElementById('detailShareBtn');

    likeBtn.innerHTML = `
        <span class="icon">${post.liked ? '❤️' : '♡'}</span>
        <span class="count">${post.likes}</span>
    `;
    likeBtn.className = `action-btn ${post.liked ? 'liked' : ''}`;
    likeBtn.onclick = () => toggleDetailLike(postId);

    commentBtn.innerHTML = `
        <span class="icon">💬</span>
        <span class="count">${post.comments ? post.comments.length : 0}</span>
    `;

    shareBtn.onclick = () => openShareModal(postId);

    // 댓글 목록 렌더링
    renderDetailComments(post.comments || []);
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
                    <span>Thích</span>
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
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${post.title} - ${post.content.substring(0, 100)}...`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank');
}

function shareToTwitter() {
    const postId = document.getElementById('shareModal').getAttribute('data-post-id');
    const post = posts.find(p => p.id == postId);
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${post.title} - ${post.content.substring(0, 100)}...`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
}

function copyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
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