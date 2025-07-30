// Firebase 연동 스크립트
let posts = [];
let postIdCounter = 1;
let currentPage = 'home';
let currentPostId = null;

// 무한 스크롤 페이지네이션 관련 변수
let isLoading = false;
let hasMorePosts = true;
let lastPostDoc = null;
const POSTS_PER_PAGE = 20;

// URL 라우팅 관리
class Router {
    constructor() {
        this.routes = {
            '/': () => this.showHomePage(),
            '/write': () => this.showWritePage(),
            '/post/:id': (id) => this.showPostPage(id)
        };
        this.init();
    }

    init() {
        // 페이지 로드 시 현재 URL 처리
        window.addEventListener('load', () => this.handleRoute());
        
        // 브라우저 뒤로가기/앞으로가기 처리
        window.addEventListener('popstate', () => this.handleRoute());
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
        
        // URL 업데이트
        if (window.location.pathname !== '/') {
            window.history.replaceState({}, '', '/');
        }
    }

    showWritePage() {
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
        
        // 로딩 상태 표시
        this.showPostDetailLoading();
        
        // 글이 로드되기를 기다린 후 렌더링
        if (posts.length > 0) {
            const post = posts.find(p => p.id === postId);
            if (post) {
                renderPostDetail(postId);
            } else {
                this.showPostNotFound();
            }
        } else {
            // 글이 아직 로드되지 않았으면 로드 후 렌더링
            this.waitForPostsAndRender(postId);
        }
        
        // 글 상세 페이지 진입 이벤트
        const post = posts.find(p => p.id === postId);
        logAnalyticsEvent('select_content', {
            content_type: 'post',
            item_id: postId,
            content_title: post ? post.title : 'Unknown'
        });
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

    async waitForPostsAndRender(postId) {
        // 최대 10초 동안 글 로드를 기다림
        let attempts = 0;
        const maxAttempts = 100;
        
        const checkPosts = () => {
            if (posts.length > 0) {
                const post = posts.find(p => p.id === postId);
                if (post) {
                    renderPostDetail(postId);
                } else {
                    this.showPostNotFound();
                }
                return;
            }
            
            attempts++;
            if (attempts < maxAttempts) {
                setTimeout(checkPosts, 100);
            } else {
                // 타임아웃 시 "찾을 수 없음" 표시
                this.showPostNotFound();
            }
        };
        
        checkPosts();
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

    // 무한 스크롤 이벤트 리스너
    setupInfiniteScroll();

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

// 무한 스크롤 설정
function setupInfiniteScroll() {
    let ticking = false;
    
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(function() {
                checkScrollPosition();
                ticking = false;
            });
            ticking = true;
        }
    });
}

// 스크롤 위치 확인 및 다음 페이지 로드
function checkScrollPosition() {
    // 홈페이지에서만 무한 스크롤 작동
    if (currentPage !== 'home' || isLoading || !hasMorePosts) {
        return;
    }
    
    const posts = document.querySelectorAll('.post');
    const currentPostsCount = posts.length;
    
    // 15번째 글 기준으로 체크 (0부터 시작하므로 index 14)
    if (currentPostsCount >= 15) {
        const fifteenthPost = posts[14];
        const rect = fifteenthPost.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // 15번째 글이 화면에 보이면 다음 페이지 로드
        if (rect.top <= windowHeight && rect.bottom >= 0) {
            console.log('15번째 글이 화면에 보임, 다음 페이지 로드 시작');
            loadMorePosts();
        }
    }
    
    // 추가적으로 스크롤이 끝까지 내려갔을 때도 체크 (백업)
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // 스크롤이 끝에서 100px 이내에 있으면 다음 페이지 로드
    if (scrollTop + windowHeight >= documentHeight - 100) {
        console.log('스크롤이 페이지 끝에 도달, 다음 페이지 로드 시작');
        loadMorePosts();
    }
}

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
        // 새 글 작성 후 첫 페이지 다시 로드
        loadPostsFromFirebase(true);
    } catch (error) {
        console.error('Lưu bài viết thất bại:', error);
        alert('Lưu bài viết thất bại.');
    }
}

// 첫 페이지 로드 (초기 20개)
async function loadPostsFromFirebase(isInitial = true) {
    if (isLoading || (!hasMorePosts && !isInitial)) {
        return;
    }
    
    try {
        isLoading = true;
        showLoadingIndicator();
        
        console.log('Firebase에서 posts 로드 시작... (페이지네이션)');
        
        let postsQuery;
        const postsRef = window.firestore.collection(window.db, 'posts');
        
        if (isInitial) {
            // 첫 페이지: 최신 글부터 20개
            posts = []; // 기존 글 목록 초기화
            lastPostDoc = null;
            hasMorePosts = true;
            
            postsQuery = window.firestore.query(
                postsRef,
                window.firestore.orderBy('date', 'desc'),
                window.firestore.limit(POSTS_PER_PAGE)
            );
        } else {
            // 다음 페이지: 마지막 문서 이후부터 20개
            if (!lastPostDoc) {
                hideLoadingIndicator();
                isLoading = false;
                return;
            }
            
            postsQuery = window.firestore.query(
                postsRef,
                window.firestore.orderBy('date', 'desc'),
                window.firestore.startAfter(lastPostDoc),
                window.firestore.limit(POSTS_PER_PAGE)
            );
        }
        
        const querySnapshot = await window.firestore.getDocs(postsQuery);
        console.log('Firebase 쿼리 완료. 문서 개수:', querySnapshot.size);
        
        if (querySnapshot.empty) {
            hasMorePosts = false;
            hideLoadingIndicator();
            isLoading = false;
            return;
        }
        
        const newPosts = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('로드된 문서 ID:', doc.id, '제목:', data.title);
            newPosts.push({
                id: doc.id,
                ...data,
                date: data.date // 원본 날짜 형식 유지
            });
        });
        
        // 마지막 문서 저장 (다음 페이지 로드용)
        lastPostDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        
        // 새 글들을 기존 목록에 추가
        posts = [...posts, ...newPosts];
        
        // 20개보다 적게 로드되면 더 이상 글이 없음
        if (newPosts.length < POSTS_PER_PAGE) {
            hasMorePosts = false;
        }
        
        console.log('posts 로드 완료:', posts.length, '개 (새로 추가:', newPosts.length, '개)');
        
        if (isInitial) {
            renderPosts();
        } else {
            appendPosts(newPosts);
        }
        
    } catch (error) {
        console.error('Tải dữ liệu thất bại:', error);
        console.error('에러 상세:', error.code, error.message);
        
        if (isInitial) {
            // 초기 로드 실패 시에만 샘플 데이터 로드
            loadSamplePosts();
        }
    } finally {
        hideLoadingIndicator();
        isLoading = false;
    }
}

// 다음 페이지 로드
async function loadMorePosts() {
    await loadPostsFromFirebase(false);
}

// 로딩 인디케이터 표시
function showLoadingIndicator() {
    let indicator = document.getElementById('loadingIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'loadingIndicator';
        indicator.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div class="loading-spinner" style="margin: 0 auto 10px; width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #333; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="color: #666;">Đang tải thêm bài viết...</p>
            </div>
        `;
        document.getElementById('posts').appendChild(indicator);
    }
    indicator.style.display = 'block';
}

// 로딩 인디케이터 숨기기
function hideLoadingIndicator() {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

function renderPosts() {
    const postsContainer = document.getElementById('posts');
    postsContainer.innerHTML = '';

    posts.forEach(post => {
        appendSinglePost(post, postsContainer);
    });
}

// 새 글들을 기존 목록에 추가 (무한 스크롤용)
function appendPosts(newPosts) {
    const postsContainer = document.getElementById('posts');
    
    newPosts.forEach(post => {
        appendSinglePost(post, postsContainer);
    });
}

// 단일 글을 컨테이너에 추가
function appendSinglePost(post, container) {
    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.setAttribute('data-post-index', posts.indexOf(post));
    
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
    container.appendChild(postElement);
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
    if (!post) {
        if (router) {
            router.showPostNotFound();
        }
        return;
    }

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

    // 액션 버튼 업데이트 및 표시
    const likeBtn = document.getElementById('detailLikeBtn');
    const commentBtn = document.getElementById('detailCommentBtn');
    const shareBtn = document.getElementById('detailShareBtn');
    const commentInput = document.getElementById('commentInput');
    const commentSubmit = document.getElementById('commentSubmitBtn');

    if (likeBtn) {
        likeBtn.innerHTML = `
            <span class="icon">${post.liked ? '❤️' : '♡'}</span>
            <span class="count">${post.likes}</span>
        `;
        likeBtn.className = `action-btn ${post.liked ? 'liked' : ''}`;
        likeBtn.onclick = () => toggleDetailLike(postId);
        likeBtn.style.display = 'flex';
    }

    if (commentBtn) {
        commentBtn.innerHTML = `
            <span class="icon">💬</span>
            <span class="count">${post.comments ? post.comments.length : 0}</span>
        `;
        commentBtn.style.display = 'flex';
    }

    if (shareBtn) {
        shareBtn.onclick = () => openShareModal(postId);
        shareBtn.style.display = 'flex';
    }

    // 댓글 입력 필드 표시
    if (commentInput) commentInput.style.display = 'block';
    if (commentSubmit) commentSubmit.style.display = 'block';

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
    const postUrl = `${window.location.origin}/post/${postId}`;
    const url = encodeURIComponent(postUrl);
    const text = encodeURIComponent(`${post.title} - ${post.content.substring(0, 100)}...`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank');
}

function shareToTwitter() {
    const postId = document.getElementById('shareModal').getAttribute('data-post-id');
    const post = posts.find(p => p.id == postId);
    const postUrl = `${window.location.origin}/post/${postId}`;
    const url = encodeURIComponent(postUrl);
    const text = encodeURIComponent(`${post.title} - ${post.content.substring(0, 100)}...`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
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