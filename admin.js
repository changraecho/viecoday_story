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

    async loadPosts() {
        try {
            // Firebase에서 posts 데이터 로드 (최신 글부터)
            if (window.db && window.firestore) {
                const q = window.firestore.query(
                    window.firestore.collection(window.db, 'posts'),
                    window.firestore.orderBy('date', 'desc')
                );
                
                const querySnapshot = await window.firestore.getDocs(q);
                this.posts = [];
                
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    this.posts.push({
                        id: doc.id,
                        ...data,
                        date: new Date(data.date).toLocaleString('ko-KR')
                    });
                });
                
                console.log('Firebase에서 글 로드 완료:', this.posts.length, '개');
            } else {
                // Firebase가 없으면 샘플 데이터 생성
                this.generateSampleData();
            }
        } catch (error) {
            console.error('Firebase 글 로드 실패:', error);
            // 실패 시 localStorage에서 로드 시도
            const savedPosts = localStorage.getItem('viecoday_posts');
            if (savedPosts) {
                this.posts = JSON.parse(savedPosts);
                // 날짜 기준 내림차순 정렬
                this.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
            } else {
                // 샘플 데이터 생성
                this.generateSampleData();
            }
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
        
        // 날짜 기준 내림차순 정렬 (최신 글부터)
        samplePosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
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
        
        // 대시보드가 로드된 후 탭과 봇 기능 초기화
        setTimeout(() => {
            this.initTabs();
            this.bindBotEvents();
        }, 100);
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

        this.showConfirmModal(`선택한 ${this.selectedPosts.size}개의 글을 삭제하시겠습니까?`, async () => {
            try {
                // Firebase에서 선택된 글들 삭제
                if (window.db && window.firestore) {
                    const deletePromises = [];
                    this.selectedPosts.forEach(postId => {
                        deletePromises.push(
                            window.firestore.deleteDoc(
                                window.firestore.doc(window.db, 'posts', postId)
                            )
                        );
                    });
                    
                    await Promise.all(deletePromises);
                    console.log('Firebase에서 글 삭제 완료');
                    
                    // 글 목록 다시 로드
                    await this.loadPosts();
                } else {
                    // Firebase가 없으면 기존 방식
                    this.posts = this.posts.filter(post => !this.selectedPosts.has(post.id));
                    this.savePosts();
                    this.applyCurrentFilter();
                    this.updateDisplay();
                }
                
                this.selectedPosts.clear();
            } catch (error) {
                console.error('글 삭제 실패:', error);
                alert('글 삭제에 실패했습니다.');
            }
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
        this.showConfirmModal('이 글을 삭제하시겠습니까?', async () => {
            try {
                // Firebase에서 글 삭제
                if (window.db && window.firestore) {
                    await window.firestore.deleteDoc(
                        window.firestore.doc(window.db, 'posts', postId)
                    );
                    console.log('Firebase에서 글 삭제 완료');
                    
                    // 글 목록 다시 로드
                    await this.loadPosts();
                } else {
                    // Firebase가 없으면 기존 방식
                    this.posts = this.posts.filter(post => post.id !== postId);
                    this.savePosts();
                    this.applyCurrentFilter();
                    this.updateDisplay();
                }
                
                this.selectedPosts.delete(postId);
            } catch (error) {
                console.error('글 삭제 실패:', error);
                alert('글 삭제에 실패했습니다.');
            }
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

    // 탭 기능 초기화
    initTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
    }

    // 탭 전환
    switchTab(tabName) {
        // 모든 탭 버튼 비활성화
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 모든 탭 컨텐츠 숨기기
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // 선택된 탭 활성화
        const selectedTabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const selectedTabContent = document.getElementById(`${tabName}Tab`);
        
        if (selectedTabBtn) {
            selectedTabBtn.classList.add('active');
        }
        
        if (selectedTabContent) {
            selectedTabContent.classList.add('active');
        }

        // 봇 탭이 선택되면 봇 상태 업데이트
        if (tabName === 'bot') {
            setTimeout(() => {
                this.updateBotStatus();
                // Firebase 권한 문제가 있을 수 있으므로 try-catch로 감싸기
                try {
                    this.loadBotStats();
                    this.loadBotLogs();
                } catch (error) {
                    console.log('Firebase data loading skipped due to permissions');
                }
            }, 100);
        }
    }

    // 봇 관련 이벤트 바인딩
    bindBotEvents() {
        // DOM 요소 존재 확인 후 이벤트 바인딩
        const startBotBtn = document.getElementById('startBotBtn');
        const stopBotBtn = document.getElementById('stopBotBtn');
        const generateNowBtn = document.getElementById('generateNowBtn');
        const saveBotConfigBtn = document.getElementById('saveBotConfigBtn');
        const refreshLogsBtn = document.getElementById('refreshLogsBtn');
        const clearLogsBtn = document.getElementById('clearLogsBtn');

        if (startBotBtn) startBotBtn.addEventListener('click', () => this.startBot());
        if (stopBotBtn) stopBotBtn.addEventListener('click', () => this.stopBot());
        if (generateNowBtn) generateNowBtn.addEventListener('click', () => this.generateNow());
        if (saveBotConfigBtn) saveBotConfigBtn.addEventListener('click', () => this.saveBotConfig());
        if (refreshLogsBtn) refreshLogsBtn.addEventListener('click', () => this.loadBotLogs());
        if (clearLogsBtn) clearLogsBtn.addEventListener('click', () => this.clearBotLogs());
    }

    // 봇 시작
    async startBot() {
        try {
            if (window.contentBot) {
                const success = await window.contentBot.start();
                if (success) {
                    this.showNotification('봇이 시작되었습니다.', 'success');
                    this.updateBotStatus();
                } else {
                    this.showNotification('봇이 이미 실행 중입니다.', 'info');
                }
            } else {
                this.showNotification('봇 시스템을 찾을 수 없습니다.', 'error');
            }
        } catch (error) {
            console.error('봇 시작 실패:', error);
            this.showNotification('봇 시작에 실패했습니다.', 'error');
        }
    }

    // 봇 중지
    async stopBot() {
        try {
            if (window.contentBot) {
                const success = await window.contentBot.stop();
                if (success) {
                    this.showNotification('봇이 중지되었습니다.', 'success');
                    this.updateBotStatus();
                } else {
                    this.showNotification('봇이 실행 중이 아닙니다.', 'info');
                }
            } else {
                this.showNotification('봇 시스템을 찾을 수 없습니다.', 'error');
            }
        } catch (error) {
            console.error('봇 중지 실패:', error);
            this.showNotification('봇 중지에 실패했습니다.', 'error');
        }
    }

    // 즉시 컨텐츠 생성
    async generateNow() {
        try {
            if (window.contentBot) {
                await window.contentBot.generateManualContent();
                this.showNotification('컨텐츠가 생성되었습니다.', 'success');
                setTimeout(() => {
                    this.loadPosts();
                    this.loadBotStats();
                }, 1000);
            } else {
                this.showNotification('봇 시스템을 찾을 수 없습니다.', 'error');
            }
        } catch (error) {
            console.error('컨텐츠 생성 실패:', error);
            this.showNotification('컨텐츠 생성에 실패했습니다.', 'error');
        }
    }

    // 봇 설정 저장
    async saveBotConfig() {
        try {
            const interval = parseInt(document.getElementById('botInterval').value) * 60 * 1000; // 분을 밀리초로 변환
            const prompt = document.getElementById('botPrompt').value;

            if (window.contentBot) {
                window.contentBot.updateConfig({
                    interval: interval,
                    prompt: prompt
                });
                await window.contentBot.saveBotConfig();
                this.showNotification('설정이 저장되었습니다.', 'success');
            } else {
                this.showNotification('봇 시스템을 찾을 수 없습니다.', 'error');
            }
        } catch (error) {
            console.error('설정 저장 실패:', error);
            this.showNotification('설정 저장에 실패했습니다.', 'error');
        }
    }

    // 봇 상태 업데이트
    updateBotStatus() {
        if (window.contentBot) {
            const status = window.contentBot.getStatus();
            const statusElement = document.getElementById('botStatus');
            const nextExecutionElement = document.getElementById('nextExecution');
            const botIntervalElement = document.getElementById('botInterval');
            const botPromptElement = document.getElementById('botPrompt');
            
            if (statusElement) {
                if (status.isRunning) {
                    statusElement.textContent = '실행 중';
                    statusElement.className = 'status-indicator running';
                    
                    // 다음 실행 시간 표시
                    if (status.nextExecution && nextExecutionElement) {
                        nextExecutionElement.textContent = 
                            status.nextExecution.toLocaleTimeString('ko-KR');
                    }
                } else {
                    statusElement.textContent = '중지됨';
                    statusElement.className = 'status-indicator';
                    if (nextExecutionElement) {
                        nextExecutionElement.textContent = '-';
                    }
                }
            }

            // 설정 폼에 현재 값 표시
            if (botIntervalElement) {
                botIntervalElement.value = status.config.interval / 60 / 1000; // 밀리초를 분으로 변환
            }
            if (botPromptElement) {
                botPromptElement.value = status.config.prompt;
            }
        }
    }

    // 봇 통계 로드
    async loadBotStats() {
        try {
            // Firebase에서 봇이 생성한 글 수 조회
            if (window.db && window.firestore) {
                const q = window.firestore.query(
                    window.firestore.collection(window.db, 'posts')
                );
                const querySnapshot = await window.firestore.getDocs(q);
                
                let totalBotPosts = 0;
                let todayBotPosts = 0;
                const today = new Date().toDateString();
                
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.isBot) {
                        totalBotPosts++;
                        const postDate = new Date(data.date).toDateString();
                        if (postDate === today) {
                            todayBotPosts++;
                        }
                    }
                });

                const totalBotPostsElement = document.getElementById('totalBotPosts');
                const todayBotPostsElement = document.getElementById('todayBotPosts');
                
                if (totalBotPostsElement) totalBotPostsElement.textContent = totalBotPosts;
                if (todayBotPostsElement) todayBotPostsElement.textContent = todayBotPosts;
            }
        } catch (error) {
            console.error('봇 통계 로드 실패:', error);
            // Firebase 권한 문제 시 기본값 표시
            const totalBotPostsElement = document.getElementById('totalBotPosts');
            const todayBotPostsElement = document.getElementById('todayBotPosts');
            
            if (totalBotPostsElement) totalBotPostsElement.textContent = '권한 없음';
            if (todayBotPostsElement) todayBotPostsElement.textContent = '권한 없음';
        }
    }

    // 봇 로그 로드
    async loadBotLogs() {
        try {
            if (window.db && window.firestore) {
                const q = window.firestore.query(
                    window.firestore.collection(window.db, 'bot_logs'),
                    window.firestore.orderBy('timestamp', 'desc')
                );
                const querySnapshot = await window.firestore.getDocs(q);
                
                const logsList = document.getElementById('botLogsList');
                logsList.innerHTML = '';

                if (querySnapshot.empty) {
                    logsList.innerHTML = '<div class="log-item"><span class="log-time">-</span><span class="log-message">활동 로그가 없습니다.</span></div>';
                    return;
                }

                querySnapshot.forEach((doc) => {
                    const log = doc.data();
                    const logElement = document.createElement('div');
                    logElement.className = 'log-item';
                    
                    const time = new Date(log.timestamp).toLocaleString('ko-KR');
                    const message = this.formatLogMessage(log.action, log.data);
                    
                    logElement.innerHTML = `
                        <span class="log-time">${time}</span>
                        <span class="log-message">${message}</span>
                    `;
                    
                    logsList.appendChild(logElement);
                });
            }
        } catch (error) {
            console.error('봇 로그 로드 실패:', error);
            // Firebase 권한 문제 시 기본 메시지 표시
            const logsList = document.getElementById('botLogsList');
            if (logsList) {
                logsList.innerHTML = '<div class="log-item"><span class="log-time">-</span><span class="log-message">Firebase 권한이 필요합니다.</span></div>';
            }
        }
    }

    // 로그 메시지 포맷팅
    formatLogMessage(action, data) {
        switch (action) {
            case 'bot_started':
                return '봇이 시작되었습니다';
            case 'bot_stopped':
                return '봇이 중지되었습니다';
            case 'content_generated':
                return `컨텐츠 생성: "${data?.title || '제목 없음'}"`;
            case 'content_generation_failed':
                return '컨텐츠 생성 실패';
            case 'content_generation_error':
                return `컨텐츠 생성 오류: ${data?.error || '알 수 없는 오류'}`;
            default:
                return action;
        }
    }

    // 봇 로그 삭제
    async clearBotLogs() {
        if (!confirm('모든 봇 로그를 삭제하시겠습니까?')) {
            return;
        }

        try {
            if (window.db && window.firestore) {
                const q = window.firestore.query(
                    window.firestore.collection(window.db, 'bot_logs')
                );
                const querySnapshot = await window.firestore.getDocs(q);
                
                const deletePromises = [];
                querySnapshot.forEach((doc) => {
                    deletePromises.push(window.firestore.deleteDoc(doc.ref));
                });
                
                await Promise.all(deletePromises);
                this.showNotification('로그가 삭제되었습니다.', 'success');
                this.loadBotLogs();
            }
        } catch (error) {
            console.error('로그 삭제 실패:', error);
            this.showNotification('로그 삭제에 실패했습니다.', 'error');
        }
    }

    // 알림 표시
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            border-radius: 6px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // 애니메이션으로 표시
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // 3초 후 자동 제거
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// 전역 변수로 adminPanel 인스턴스 생성
const adminPanel = new AdminPanel();