class AdminPanel {
    constructor() {
        this.posts = [];
        this.filteredPosts = [];
        this.currentPage = 1;
        this.postsPerPage = 50;
        this.selectedPosts = new Set();
        this.isLoggedIn = false;
        this.currentPostDetail = null;
        
        this.init();
    }

    init() {
        this.loadPosts();
        this.bindEvents();
        this.checkLoginStatus();
        this.initAnalytics();
    }
    
    async initAnalytics() {
        // Firebase Analytics 로드 대기
        const waitForAnalytics = () => {
            return new Promise((resolve) => {
                const checkAnalytics = () => {
                    if (window.analytics && window.analyticsUtils) {
                        resolve();
                    } else {
                        setTimeout(checkAnalytics, 100);
                    }
                };
                checkAnalytics();
            });
        };
        
        await waitForAnalytics();
        
        // 관리자 페이지 방문 로깅
        if (this.isLoggedIn) {
            window.analyticsUtils.logEvent(window.analytics, 'admin_page_view', {
                page_title: 'Admin Dashboard',
                page_location: window.location.href
            });
        }
    }

    loadPosts() {
        // localStorage에서 posts 데이터 로드 (실제 환경에서는 API 호출)
        const savedPosts = localStorage.getItem('viecoday_posts');
        if (savedPosts) {
            this.posts = JSON.parse(savedPosts);
        } else {
            // 샘플 데이터 생성
            this.generateSampleData();
        }
        this.filteredPosts = [...this.posts];
        this.updateDisplay();
    }

    generateSampleData() {
        const samplePosts = [];
        const categories = ['부동산', '셀소·미팅·모임', '썸·연애', '일상', '취미', '음식', '여행', '직장'];
        const sampleTitles = [
            '청산주공13단지 전세에 대한 의견 부탁드림',
            '30대 남자입니다. 셀소해봅니다.',
            '스물 후반 남자 솔로가 되었다,,,',
            '오늘의 좋은 소식',
            '주말에 뭐하고 지내세요?',
            '맛있는 카페 추천해주세요',
            '제주도 여행 계획 중입니다',
            '직장에서 힘든 일이 있었어요'
        ];
        const sampleContents = [
            '얼마전 서울직 전분하면서 세입자한테 애기하는 과정 관련해서 조언을 구했었는데 지금 방향 그 집 처분하고 싶어서 다시 연락하여 알려드리고자 합니다.',
            '안녕하세요! 고민 많이하다가 올립니다. 저는 90년 초반 생이구요 을지로쪽 살고있습니다. 키 187 몸무게 80키로대 입니다.',
            '스물 후반에 솔로가 되니까 아니 언제를 하려면 무조건 소개팅 나가야 하네,,, 혼자 있는 시간이 많아서 외로워요.',
            '오늘 날씨가 정말 좋네요! 산책하면서 좋은 하루 보내세요. 다들 행복한 하루 되시길 바랍니다.',
            '요즘 할 일이 없어서 심심해요. 다들 주말에 뭐하고 지내시나요? 좋은 활동 추천해주세요!',
            '홍대 근처에 분위기 좋은 카페 있으면 추천해주세요. 친구들과 만나서 수다떨기 좋은 곳으로요.',
            '다음주에 제주도 3박 4일로 여행 가는데 꼭 가봐야 할 곳이나 맛집 추천해주세요!',
            '회사에서 상사가 너무 스트레스를 줘서 힘들어요. 비슷한 경험 있으신 분들 조언 부탁드려요.'
        ];

        for (let i = 1; i <= 127; i++) {
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            const randomTitle = sampleTitles[Math.floor(Math.random() * sampleTitles.length)];
            const randomContent = sampleContents[Math.floor(Math.random() * sampleContents.length)];
            const randomDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
            
            samplePosts.push({
                id: i,
                title: randomTitle + (i > 8 ? ` (${i})` : ''),
                content: randomContent,
                author: randomCategory,
                date: randomDate.toLocaleString('ko-KR'),
                likes: Math.floor(Math.random() * 50),
                liked: false,
                comments: this.generateSampleComments(i)
            });
        }
        
        this.posts = samplePosts;
        localStorage.setItem('viecoday_posts', JSON.stringify(this.posts));
    }

    generateSampleComments(postId) {
        const comments = [];
        const commentCount = Math.floor(Math.random() * 5);
        const sampleComments = [
            '좋은 정보 감사합니다!',
            '저도 비슷한 경험이 있어요.',
            '도움이 많이 되었습니다.',
            '공감합니다.',
            '좋은 하루 보내세요!'
        ];

        for (let i = 0; i < commentCount; i++) {
            comments.push({
                id: Date.now() + i,
                postId: postId,
                content: sampleComments[Math.floor(Math.random() * sampleComments.length)],
                date: new Date().toLocaleString('ko-KR'),
                likes: Math.floor(Math.random() * 10),
                liked: false
            });
        }

        return comments;
    }

    bindEvents() {
        // 로그인 관련
        document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());
        document.getElementById('passwordInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

        // 컨트롤 버튼들
        document.getElementById('deleteSelectedBtn').addEventListener('click', () => this.deleteSelected());

        // 검색
        document.getElementById('searchBtn').addEventListener('click', () => this.handleSearch());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });

        // 페이지네이션
        document.getElementById('prevPageBtn').addEventListener('click', () => this.previousPage());
        document.getElementById('nextPageBtn').addEventListener('click', () => this.nextPage());

        // 헤더 체크박스
        document.getElementById('headerCheckbox').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.selectAllCurrentPage();
            } else {
                this.deselectAllCurrentPage();
            }
        });

        // 모달 관련
        document.getElementById('closeDetailModal').addEventListener('click', () => this.closeDetailModal());
        document.getElementById('closeDetailBtn').addEventListener('click', () => this.closeDetailModal());
        document.getElementById('deletePostBtn').addEventListener('click', () => this.deleteCurrentPost());

        // 확인 모달
        document.getElementById('confirmYes').addEventListener('click', () => this.confirmAction());
        document.getElementById('confirmNo').addEventListener('click', () => this.closeConfirmModal());

        // 모달 외부 클릭 시 닫기
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    checkLoginStatus() {
        const isLoggedIn = sessionStorage.getItem('admin_logged_in');
        if (isLoggedIn === 'true') {
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    handleLogin() {
        const password = document.getElementById('passwordInput').value;
        const errorElement = document.getElementById('loginError');

        if (password === 'viecoday12#$') {
            sessionStorage.setItem('admin_logged_in', 'true');
            this.isLoggedIn = true;
            this.showDashboard();
            errorElement.style.display = 'none';
        } else {
            errorElement.style.display = 'block';
            document.getElementById('passwordInput').value = '';
        }
    }

    handleLogout() {
        sessionStorage.removeItem('admin_logged_in');
        this.isLoggedIn = false;
        this.showLogin();
    }

    showLogin() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('adminDashboard').style.display = 'none';
        document.getElementById('passwordInput').focus();
    }

    showDashboard() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        this.updateDisplay();
    }

    selectAllCurrentPage() {
        const currentPagePosts = this.getCurrentPagePosts();
        currentPagePosts.forEach(post => {
            this.selectedPosts.add(post.id);
            const checkbox = document.getElementById(`checkbox-${post.id}`);
            if (checkbox) checkbox.checked = true;
        });
        this.updateHeaderCheckbox();
    }

    deselectAllCurrentPage() {
        const currentPagePosts = this.getCurrentPagePosts();
        currentPagePosts.forEach(post => {
            this.selectedPosts.delete(post.id);
            const checkbox = document.getElementById(`checkbox-${post.id}`);
            if (checkbox) checkbox.checked = false;
        });
        this.updateHeaderCheckbox();
    }

    updateHeaderCheckbox() {
        const headerCheckbox = document.getElementById('headerCheckbox');
        const currentPagePosts = this.getCurrentPagePosts();
        const selectedInCurrentPage = currentPagePosts.filter(post => this.selectedPosts.has(post.id));
        
        if (selectedInCurrentPage.length === 0) {
            headerCheckbox.checked = false;
            headerCheckbox.indeterminate = false;
        } else if (selectedInCurrentPage.length === currentPagePosts.length) {
            headerCheckbox.checked = true;
            headerCheckbox.indeterminate = false;
        } else {
            headerCheckbox.checked = false;
            headerCheckbox.indeterminate = true;
        }
    }

    deleteSelected() {
        if (this.selectedPosts.size === 0) {
            alert('삭제할 글을 선택해주세요.');
            return;
        }

        this.showConfirmModal(`선택한 ${this.selectedPosts.size}개의 글을 삭제하시겠습니까?`, () => {
            this.posts = this.posts.filter(post => !this.selectedPosts.has(post.id));
            this.selectedPosts.clear();
            this.savePosts();
            this.applyCurrentFilter();
            this.updateDisplay();
        });
    }

    handleSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        
        if (searchTerm === '') {
            this.filteredPosts = [...this.posts];
        } else {
            this.filteredPosts = this.posts.filter(post => 
                post.title.toLowerCase().includes(searchTerm) ||
                post.content.toLowerCase().includes(searchTerm)
            );
        }
        
        this.currentPage = 1;
        this.updateDisplay();
    }

    applyCurrentFilter() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        if (searchTerm === '') {
            this.filteredPosts = [...this.posts];
        } else {
            this.filteredPosts = this.posts.filter(post => 
                post.title.toLowerCase().includes(searchTerm) ||
                post.content.toLowerCase().includes(searchTerm)
            );
        }
    }

    getCurrentPagePosts() {
        const startIndex = (this.currentPage - 1) * this.postsPerPage;
        const endIndex = startIndex + this.postsPerPage;
        return this.filteredPosts.slice(startIndex, endIndex);
    }

    updateDisplay() {
        this.renderPostsTable();
        this.renderPagination();
        this.updateStats();
    }

    renderPostsTable() {
        const tbody = document.getElementById('postsTableBody');
        const currentPagePosts = this.getCurrentPagePosts();

        tbody.innerHTML = currentPagePosts.map(post => `
            <tr>
                <td class="checkbox-col">
                    <input type="checkbox" id="checkbox-${post.id}" 
                           ${this.selectedPosts.has(post.id) ? 'checked' : ''}
                           onchange="adminPanel.togglePostSelection(${post.id})">
                </td>
                <td class="id-col">${post.id}</td>
                <td class="author-col">${post.author}</td>
                <td class="title-col">${this.truncateText(post.title, 30)}</td>
                <td class="content-col">
                    <div class="content-preview">${this.truncateText(post.content, 100)}</div>
                </td>
                <td class="date-col">${post.date}</td>
                <td class="stats-col">
                    <div class="stats-info">
                        <span>❤️ ${post.likes}</span>
                        <span>💬 ${post.comments.length}</span>
                    </div>
                </td>
                <td class="actions-col">
                    <div class="action-buttons">
                        <button class="btn view" onclick="adminPanel.viewPost(${post.id})">보기</button>
                        <button class="btn danger" onclick="adminPanel.deletePost(${post.id})">삭제</button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.updateHeaderCheckbox();
    }

    togglePostSelection(postId) {
        const checkbox = document.getElementById(`checkbox-${postId}`);
        if (checkbox.checked) {
            this.selectedPosts.add(postId);
        } else {
            this.selectedPosts.delete(postId);
        }
        this.updateHeaderCheckbox();
    }

    viewPost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        this.currentPostDetail = post;

        document.getElementById('detailId').textContent = post.id;
        document.getElementById('detailAuthor').textContent = post.author;
        document.getElementById('detailTitle').textContent = post.title;
        document.getElementById('detailContent').textContent = post.content;
        document.getElementById('detailDate').textContent = post.date;
        document.getElementById('detailLikes').textContent = post.likes;

        const commentsHtml = post.comments.length > 0 
            ? post.comments.map(comment => `
                <div class="comment-item">
                    <div class="comment-header">
                        <span>익명</span>
                        <span>${comment.date}</span>
                    </div>
                    <div class="comment-content">${comment.content}</div>
                    <div class="comment-stats">❤️ ${comment.likes}</div>
                </div>
            `).join('')
            : '<div style="padding: 20px; text-align: center; color: #666;">댓글이 없습니다.</div>';

        document.getElementById('detailComments').innerHTML = commentsHtml;
        document.getElementById('postDetailModal').style.display = 'block';
    }

    deletePost(postId) {
        this.showConfirmModal('이 글을 삭제하시겠습니까?', () => {
            this.posts = this.posts.filter(post => post.id !== postId);
            this.selectedPosts.delete(postId);
            this.savePosts();
            this.applyCurrentFilter();
            this.updateDisplay();
        });
    }

    deleteCurrentPost() {
        if (this.currentPostDetail) {
            this.closeDetailModal();
            this.deletePost(this.currentPostDetail.id);
        }
    }

    showConfirmModal(message, onConfirm) {
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmModal').style.display = 'block';
        this.confirmCallback = onConfirm;
    }

    confirmAction() {
        if (this.confirmCallback) {
            this.confirmCallback();
            this.confirmCallback = null;
        }
        this.closeConfirmModal();
    }

    closeConfirmModal() {
        document.getElementById('confirmModal').style.display = 'none';
        this.confirmCallback = null;
    }

    closeDetailModal() {
        document.getElementById('postDetailModal').style.display = 'none';
        this.currentPostDetail = null;
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredPosts.length / this.postsPerPage);
        const startIndex = (this.currentPage - 1) * this.postsPerPage;
        const endIndex = Math.min(startIndex + this.postsPerPage, this.filteredPosts.length);

        // 페이지 정보 업데이트
        document.getElementById('paginationInfo').textContent = 
            `${startIndex + 1}-${endIndex} / 총 ${this.filteredPosts.length}개`;

        // 이전/다음 버튼 상태
        document.getElementById('prevPageBtn').disabled = this.currentPage === 1;
        document.getElementById('nextPageBtn').disabled = this.currentPage === totalPages || totalPages === 0;

        // 페이지 번호 생성
        const pageNumbers = document.getElementById('pageNumbers');
        pageNumbers.innerHTML = '';

        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-number ${i === this.currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.onclick = () => this.goToPage(i);
            pageNumbers.appendChild(pageBtn);
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updateDisplay();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredPosts.length / this.postsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.updateDisplay();
        }
    }

    goToPage(pageNumber) {
        this.currentPage = pageNumber;
        this.updateDisplay();
    }

    updateStats() {
        document.getElementById('totalPosts').textContent = this.posts.length;
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    savePosts() {
        localStorage.setItem('viecoday_posts', JSON.stringify(this.posts));
        // 메인 페이지에서도 사용할 수 있도록 동기화
        if (window.posts) {
            window.posts = [...this.posts];
        }
    }
}

// 전역 변수로 adminPanel 인스턴스 생성
const adminPanel = new AdminPanel();