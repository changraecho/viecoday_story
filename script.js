let posts = [];
let postIdCounter = 1;
let currentPage = 'home';
let currentPostId = null;

document.addEventListener('DOMContentLoaded', function() {
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

    loadPostsFromStorage();
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
}

function showDetailPage(postId) {
    currentPage = 'detail';
    currentPostId = postId;
    document.getElementById('writePage').style.display = 'none';
    document.getElementById('detailPage').style.display = 'flex';
    document.querySelector('.container').style.display = 'none';
    document.getElementById('floatingBtn').style.display = 'none';
    
    renderPostDetail(postId);
}

function createPost() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    
    if (title.trim() === '' || content.trim() === '') {
        alert('제목과 내용을 모두 입력해주세요.');
        return;
    }

    const post = {
        id: postIdCounter++,
        title: title,
        content: content,
        author: '익명',
        date: new Date().toLocaleString('ko-KR'),
        likes: 0,
        liked: false,
        comments: []
    };

    posts.unshift(post);
    savePostsToStorage();
    renderPosts();
    showHomePage();
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
                        <div class="post-date">${post.date}</div>
                    </div>
                </div>
            </div>
            <div class="post-content-area" onclick="showDetailPage(${post.id})">
                <div class="post-title">${post.title}</div>
                <div class="post-content">${post.content}</div>
            </div>
            <div class="post-stats">
                <div class="stat-item like-btn ${post.liked ? 'liked' : ''}" onclick="event.stopPropagation(); toggleLikeFromList(${post.id})">
                    <span>${post.liked ? '❤️' : '♡'}</span>
                    <span>${post.likes}</span>
                </div>
                <div class="stat-item" onclick="showDetailPage(${post.id})">
                    <span>💬</span>
                    <span>${post.comments.length}</span>
                </div>
            </div>
        `;
        postsContainer.appendChild(postElement);
    });
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
                    <div class="post-date">${post.date}</div>
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
        <span class="count">${post.comments.length}</span>
    `;

    shareBtn.onclick = () => openShareModal(postId);

    // 댓글 목록 렌더링
    renderDetailComments(post.comments);
}

function renderDetailComments(comments) {
    const commentsList = document.getElementById('detailCommentsList');
    commentsList.innerHTML = comments.map(comment => `
        <div class="comment">
            <div class="comment-header">
                <span class="comment-author">익명</span>
                <span class="comment-date">${comment.date}</span>
            </div>
            <div class="comment-content">${comment.content}</div>
            <div class="comment-actions">
                <button class="comment-like-btn ${comment.liked ? 'liked' : ''}" onclick="toggleCommentLike(${comment.postId}, ${comment.id})">
                    <span>좋아요</span>
                    <span>${comment.likes}</span>
                </button>
            </div>
        </div>
    `).join('');
}

function toggleDetailLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (post) {
        if (post.liked) {
            post.likes--;
            post.liked = false;
        } else {
            post.likes++;
            post.liked = true;
        }
        savePostsToStorage();
        renderPosts();
        renderPostDetail(postId);
    }
}

function addCommentToDetail() {
    const commentInput = document.getElementById('commentInput');
    const commentContent = commentInput.value.trim();
    
    if (commentContent === '') {
        alert('댓글 내용을 입력해주세요.');
        return;
    }

    const post = posts.find(p => p.id === currentPostId);
    if (!post) return;

    const comment = {
        id: Date.now(),
        postId: currentPostId,
        content: commentContent,
        date: new Date().toLocaleString('ko-KR'),
        likes: 0,
        liked: false
    };

    post.comments.push(comment);
    commentInput.value = '';
    
    savePostsToStorage();
    renderPosts();
    renderPostDetail(currentPostId);
}

function toggleCommentLike(postId, commentId) {
    const post = posts.find(p => p.id === postId);
    if (post) {
        const comment = post.comments.find(c => c.id === commentId);
        if (comment) {
            if (comment.liked) {
                comment.likes--;
                comment.liked = false;
            } else {
                comment.likes++;
                comment.liked = true;
            }
            
            savePostsToStorage();
            renderPosts();
            renderPostDetail(postId);
        }
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

function toggleLikeFromList(postId) {
    const post = posts.find(p => p.id === postId);
    if (post) {
        if (post.liked) {
            post.likes--;
            post.liked = false;
        } else {
            post.likes++;
            post.liked = true;
        }
        savePostsToStorage();
        renderPosts();
    }
}

function copyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        alert('링크가 복사되었습니다!');
        document.getElementById('shareModal').style.display = 'none';
    }).catch(() => {
        alert('링크 복사에 실패했습니다.');
    });
}

function loadPostsFromStorage() {
    const savedPosts = localStorage.getItem('viecoday_posts');
    if (savedPosts) {
        posts = JSON.parse(savedPosts);
        // 최대 ID 값 설정
        if (posts.length > 0) {
            postIdCounter = Math.max(...posts.map(p => p.id)) + 1;
        }
    } else {
        loadSamplePosts();
    }
    renderPosts();
}

function savePostsToStorage() {
    localStorage.setItem('viecoday_posts', JSON.stringify(posts));
}

function loadSamplePosts() {
    const samplePosts = [
        {
            id: postIdCounter++,
            title: "청산주공13단지 전세에 대한 의견 부탁드림",
            content: "얼마전 서울직 전분하면서 세입자한테 애기하는 과정 관련해서 조언을 구했었는데 지금 방향 그 집 처분하고 싶어서 다시 연락하여 알려드리고자 합니다. 어떻게 하면 좋을지 조언 부탁드려요.",
            author: "부동산",
            date: "방금",
            likes: 0,
            liked: false,
            comments: []
        },
        {
            id: postIdCounter++,
            title: "30대 남자입니다. 셀소해봅니다.",
            content: "안녕하세요! 고민 많이하다가 올립니다. 저는 90년 초반 생이구요 을지로쪽 살고있습니다. 키 187 몸무게 80키로대 입니다. 존잘까진 아니지만 그래도 잘생겼다는 얘기는 자주 듣는것 같습니다.",
            author: "셀소·미팅·모임",
            date: "방금",
            likes: 4,
            liked: false,
            comments: [
                {
                    id: Date.now(),
                    postId: postIdCounter - 1,
                    content: "좋은 인연 만나시길 바래요!",
                    date: new Date().toLocaleString('ko-KR'),
                    likes: 1,
                    liked: false
                }
            ]
        },
        {
            id: postIdCounter++,
            title: "스물 후반 남자 솔로가 되었다,,,",
            content: "스물 후반에 솔로가 되니까 아니 언제를 하려면 무조건 소개팅 나가야 하네,,,",
            author: "썸·연애",
            date: "1분",
            likes: 14,
            liked: false,
            comments: []
        },
        {
            id: postIdCounter++,
            title: "오늘의 좋은 소식",
            content: "오늘 날씨가 정말 좋네요! 산책하면서 좋은 하루 보내세요.",
            author: "일상",
            date: "5분",
            likes: 8,
            liked: false,
            comments: [
                {
                    id: Date.now() + 1,
                    postId: postIdCounter - 1,
                    content: "정말 좋은 날씨네요!",
                    date: new Date().toLocaleString('ko-KR'),
                    likes: 2,
                    liked: false
                }
            ]
        }
    ];

    posts = samplePosts;
    savePostsToStorage();
    renderPosts();
}