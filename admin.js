class AdminPanel {
    constructor() {
        this.posts = [];
        this.filteredPosts = [];
        this.currentPage = 1;
        this.postsPerPage = 50;
        this.selectedPosts = new Set();
        this.isLoggedIn = false;
        this.currentPostDetail = null;
        
        // 비동기 초기화
        this.init().catch(error => {
            console.error('AdminPanel 초기화 실패:', error);
        });
    }

    async init() {
        console.log('AdminPanel 초기화 시작...');
        
        // 이벤트 바인딩
        this.bindEvents();
        
        // 로그인 상태 먼저 확인 (비동기)
        await this.checkLoginStatus();
        
        this.initAnalytics();
        
        console.log('AdminPanel 초기화 완료');
    }

    async initializeData() {
        console.log('로그인된 사용자 - 데이터 초기화 시작');
        
        // Firebase 초기화 대기
        await this.waitForFirebase();
        
        // Firebase 준비 완료 후 데이터 로드
        await this.loadPosts();
        
        console.log('데이터 초기화 완료');
    }

    // Firebase 초기화 대기 함수
    waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                console.log('Firebase 상태 확인:', {
                    db: !!window.db,
                    firestore: !!window.firestore
                });
                
                if (window.db && window.firestore) {
                    console.log('Firebase 초기화 완료, 데이터 로드 시작');
                    resolve();
                } else {
                    console.log('Firebase 초기화 대기 중...');
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
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
            // Firebase에서 posts 데이터 로드
            if (window.db && window.firestore) {
                console.log('Firebase에서 posts 컬렉션 로드 시작...');
                
                // 먼저 orderBy 없이 모든 문서를 가져온 후 클라이언트에서 정렬
                const postsRef = window.firestore.collection(window.db, 'posts');
                const querySnapshot = await window.firestore.getDocs(postsRef);
                
                console.log('Firebase 쿼리 완료. 문서 개수:', querySnapshot.size);
                this.posts = [];
                
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    let originalDate = data.date;
                    let displayDate;
                    
                    console.log('로드된 문서 ID:', doc.id, '제목:', data.title);
                    
                    // 날짜 형식 안전 처리
                    try {
                        if (originalDate && originalDate.toDate) {
                            // Firebase Timestamp 객체인 경우
                            const dateObj = originalDate.toDate();
                            originalDate = dateObj.toISOString();
                            displayDate = dateObj.toLocaleString('ko-KR');
                        } else if (typeof originalDate === 'string') {
                            // 문자열인 경우
                            const dateObj = new Date(originalDate);
                            if (!isNaN(dateObj.getTime())) {
                                displayDate = dateObj.toLocaleString('ko-KR');
                            } else {
                                displayDate = originalDate; // 원본 그대로 표시
                            }
                        } else {
                            // 기타 경우 현재 시간 사용
                            originalDate = new Date().toISOString();
                            displayDate = new Date().toLocaleString('ko-KR');
                        }
                    } catch (error) {
                        console.error('날짜 변환 오류:', error, originalDate);
                        originalDate = new Date().toISOString();
                        displayDate = new Date().toLocaleString('ko-KR');
                    }
                    
                    this.posts.push({
                        id: doc.id,
                        ...data,
                        date: originalDate,
                        displayDate: displayDate
                    });
                });
                
                // 클라이언트에서 날짜순 정렬 (최신 글부터)
                this.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                console.log('Firebase에서 글 로드 완료:', this.posts.length, '개');
                console.log('로드된 글 목록:', this.posts.map(p => ({id: p.id, title: p.title, date: p.date})));
            } else {
                console.log('Firebase가 초기화되지 않음. 샘플 데이터 생성.');
                this.generateSampleData();
            }
        } catch (error) {
            console.error('Firebase 글 로드 실패:', error);
            console.error('에러 상세:', error.code, error.message);
            // Firebase 연결 실패 시 로딩 메시지 표시
            this.generateSampleData();
        }
        
        this.filteredPosts = [...this.posts];
        this.updateDisplay();
    }

    generateSampleData() {
        console.log('generateSampleData 호출됨 - Firebase 연결 실패 시 백업');
        // Firebase 연결 실패 시에만 호출되는 백업 메시지
        this.posts = [{
            id: 'loading',
            title: "Firebase 연결 중...",
            content: "Firebase 데이터베이스 연결을 시도하고 있습니다. 잠시 후 새로고침해 주세요.",
            author: "시스템",
            date: new Date().toISOString(),
            displayDate: new Date().toLocaleString('ko-KR'),
            likes: 0,
            liked: false,
            comments: []
        }];
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

        // 탭 네비게이션
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTab = e.target.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });

        // 봇 관리 관련
        document.getElementById('startBotBtn').addEventListener('click', () => this.startBot());
        document.getElementById('stopBotBtn').addEventListener('click', () => this.stopBot());
        document.getElementById('generateNowBtn').addEventListener('click', () => this.generateNow());
        document.getElementById('saveBotConfigBtn').addEventListener('click', () => this.saveBotConfig());
        document.getElementById('refreshLogsBtn').addEventListener('click', () => this.loadBotLogs());
        document.getElementById('clearLogsBtn').addEventListener('click', () => this.clearBotLogs());

        // API 설정 관련
        const saveApiConfigBtn = document.getElementById('saveApiConfigBtn');
        const testApiBtn = document.getElementById('testApiBtn');
        const toggleApiKeyBtn = document.getElementById('toggleApiKeyBtn');
        const refreshUsageBtn = document.getElementById('refreshUsageBtn');
        const resetUsageBtn = document.getElementById('resetUsageBtn');
        const refreshApiLogsBtn = document.getElementById('refreshApiLogsBtn');
        const clearApiLogsBtn = document.getElementById('clearApiLogsBtn');
        const logFilterBtn = document.getElementById('logFilterBtn');

        if (saveApiConfigBtn) saveApiConfigBtn.addEventListener('click', () => this.saveApiConfig());
        if (testApiBtn) testApiBtn.addEventListener('click', () => this.testApiConnection());
        if (toggleApiKeyBtn) toggleApiKeyBtn.addEventListener('click', () => this.toggleApiKeyVisibility());
        if (refreshUsageBtn) refreshUsageBtn.addEventListener('click', () => this.refreshApiUsage());
        if (resetUsageBtn) resetUsageBtn.addEventListener('click', () => this.resetApiUsage());
        if (refreshApiLogsBtn) refreshApiLogsBtn.addEventListener('click', () => this.loadApiLogs());
        if (clearApiLogsBtn) clearApiLogsBtn.addEventListener('click', () => this.clearApiLogs());
        if (logFilterBtn) logFilterBtn.addEventListener('change', () => this.filterApiLogs());
    }

    async checkLoginStatus() {
        const isLoggedIn = sessionStorage.getItem('admin_logged_in');
        const loginTime = sessionStorage.getItem('admin_login_time');
        
        console.log('로그인 상태 확인:', isLoggedIn, '로그인 시간:', loginTime);
        
        if (isLoggedIn === 'true' && loginTime) {
            // 세션 만료 확인 (24시간)
            const currentTime = Date.now();
            const sessionDuration = 24 * 60 * 60 * 1000; // 24시간
            
            if (currentTime - parseInt(loginTime) < sessionDuration) {
                console.log('유효한 로그인 세션 발견, 대시보드 표시');
                this.isLoggedIn = true;
                this.showDashboard();
                
                // 로그인된 상태에서 데이터 초기화
                await this.initializeData();
            } else {
                console.log('세션 만료, 로그아웃 처리');
                this.handleLogout();
            }
        } else {
            console.log('로그인 필요, 로그인 화면 표시');
            this.isLoggedIn = false;
            this.showLogin();
        }
    }

    async handleLogin() {
        const password = document.getElementById('passwordInput').value;
        const errorElement = document.getElementById('loginError');

        if (password === 'viecoday12#$') {
            console.log('로그인 성공, 세션 저장 및 데이터 초기화');
            sessionStorage.setItem('admin_logged_in', 'true');
            sessionStorage.setItem('admin_login_time', Date.now().toString());
            this.isLoggedIn = true;
            this.showDashboard();
            errorElement.style.display = 'none';
            
            // 로그인 성공 후 데이터 초기화
            await this.initializeData();
        } else {
            console.log('로그인 실패');
            errorElement.style.display = 'block';
            document.getElementById('passwordInput').value = '';
        }
    }

    handleLogout() {
        console.log('로그아웃 처리');
        sessionStorage.removeItem('admin_logged_in');
        sessionStorage.removeItem('admin_login_time');
        this.isLoggedIn = false;
        
        // 데이터 초기화
        this.posts = [];
        this.filteredPosts = [];
        this.selectedPosts.clear();
        
        this.showLogin();
        
        // 페이지 새로고침으로 완전한 정리
        setTimeout(() => {
            window.location.reload();
        }, 100);
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
                    // Firebase가 없으면 기존 방식 (현재는 Firebase 필수이므로 이 코드는 사용되지 않음)
                    console.log('Firebase가 필요합니다.');
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
                           data-post-id="${post.id}">
                </td>
                <td class="id-col">${post.id}</td>
                <td class="author-col">${post.author}</td>
                <td class="title-col">${this.truncateText(post.title, 30)}</td>
                <td class="content-col">
                    <div class="content-preview">${this.truncateText(post.content, 100)}</div>
                </td>
                <td class="date-col">${post.displayDate || this.formatDate(post.date)}</td>
                <td class="stats-col">
                    <div class="stats-info">
                        <span>❤️ ${post.likes}</span>
                        <span>💬 ${post.comments.length}</span>
                    </div>
                </td>
                <td class="actions-col">
                    <div class="action-buttons">
                        <button class="btn view" data-post-id="${post.id}" data-action="view">보기</button>
                        <button class="btn danger" data-post-id="${post.id}" data-action="delete">삭제</button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.updateHeaderCheckbox();
        this.bindTableEvents();
    }

    bindTableEvents() {
        // 체크박스 이벤트
        document.querySelectorAll('input[type="checkbox"][data-post-id]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const postId = e.target.getAttribute('data-post-id');
                this.togglePostSelection(postId);
            });
        });

        // 액션 버튼 이벤트
        document.querySelectorAll('button[data-action]').forEach(button => {
            button.addEventListener('click', (e) => {
                const postId = e.target.getAttribute('data-post-id');
                const action = e.target.getAttribute('data-action');
                
                if (action === 'view') {
                    this.viewPost(postId);
                } else if (action === 'delete') {
                    this.deletePost(postId);
                }
            });
        });
    }

    togglePostSelection(postId) {
        const checkbox = document.getElementById(`checkbox-${postId}`);
        if (checkbox && checkbox.checked) {
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
        document.getElementById('detailDate').textContent = post.displayDate || this.formatDate(post.date);
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
                    // Firebase가 없으면 기존 방식 (현재는 Firebase 필수이므로 이 코드는 사용되지 않음)
                    console.log('Firebase가 필요합니다.');
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

    formatDate(dateValue) {
        try {
            if (!dateValue) return '날짜 없음';
            
            // Firebase Timestamp인 경우
            if (dateValue && dateValue.toDate) {
                return dateValue.toDate().toLocaleString('ko-KR');
            }
            
            // 문자열이나 다른 형태인 경우
            const dateObj = new Date(dateValue);
            if (!isNaN(dateObj.getTime())) {
                return dateObj.toLocaleString('ko-KR');
            }
            
            // 모든 변환이 실패한 경우
            return dateValue.toString();
        } catch (error) {
            console.error('날짜 포맷 오류:', error, dateValue);
            return '날짜 오류';
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

        // 탭별 초기화
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
        } else if (tabName === 'api') {
            setTimeout(() => {
                this.loadApiConfig();
                this.updateApiStatus();
                try {
                    this.loadApiLogs();
                } catch (error) {
                    console.log('API logs loading skipped due to permissions');
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
            console.log('즉시 생성 버튼 클릭됨');
            if (window.contentBot) {
                console.log('봇 시스템 발견, 컨텐츠 생성 시작...');
                await window.contentBot.generateManualContent();
                this.showNotification('컨텐츠가 생성되었습니다.', 'success');
                
                // 즉시 글 목록 새로고침
                console.log('컨텐츠 생성 완료, 글 목록 새로고침 중...');
                setTimeout(async () => {
                    await this.loadPosts();
                    await this.loadBotStats();
                    console.log('글 목록 새로고침 완료');
                }, 1500); // 1.5초 후 새로고침 (Firebase 동기화 시간 고려)
            } else {
                console.error('봇 시스템을 찾을 수 없음');
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

    // API 설정 로드
    async loadApiConfig() {
        try {
            if (window.deepSeekAPI) {
                await window.deepSeekAPI.loadConfig();
                const status = window.deepSeekAPI.getStatus();
                
                // 폼에 현재 설정 표시
                const apiKeyInput = document.getElementById('deepseekApiKey');
                const modelSelect = document.getElementById('deepseekModel');
                const maxUsageInput = document.getElementById('maxDailyUsage');
                
                if (apiKeyInput && window.deepSeekAPI.apiKey) {
                    apiKeyInput.value = window.deepSeekAPI.apiKey;
                }
                if (modelSelect) {
                    modelSelect.value = window.deepSeekAPI.model;
                }
                if (maxUsageInput) {
                    maxUsageInput.value = window.deepSeekAPI.maxDailyUsage;
                }
                
                console.log('API 설정 로드 완료');
            }
        } catch (error) {
            console.error('API 설정 로드 실패:', error);
            this.showNotification('API 설정 로드에 실패했습니다.', 'error');
        }
    }

    // API 설정 저장
    async saveApiConfig() {
        try {
            const apiKey = document.getElementById('deepseekApiKey').value.trim();
            const model = document.getElementById('deepseekModel').value;
            const maxUsage = parseInt(document.getElementById('maxDailyUsage').value);
            
            if (!apiKey) {
                this.showNotification('API 키를 입력해주세요.', 'error');
                return;
            }
            
            if (window.deepSeekAPI) {
                window.deepSeekAPI.setApiKey(apiKey);
                window.deepSeekAPI.setModel(model);
                window.deepSeekAPI.setMaxDailyUsage(maxUsage);
                
                await window.deepSeekAPI.saveConfig();
                this.showNotification('API 설정이 저장되었습니다.', 'success');
                this.updateApiStatus();
            }
        } catch (error) {
            console.error('API 설정 저장 실패:', error);
            this.showNotification('API 설정 저장에 실패했습니다.', 'error');
        }
    }

    // API 연결 테스트
    async testApiConnection() {
        try {
            if (!window.deepSeekAPI || !window.deepSeekAPI.apiKey) {
                this.showNotification('API 키를 먼저 설정해주세요.', 'error');
                return;
            }
            
            this.showNotification('API 연결을 테스트하고 있습니다...', 'info');
            
            const testPrompt = '간단한 인사말을 한국어로 작성해주세요.';
            const response = await window.deepSeekAPI.generateContent(testPrompt);
            
            if (response) {
                this.showNotification('API 연결 테스트가 성공했습니다!', 'success');
                console.log('API 테스트 응답:', response);
            } else {
                this.showNotification('API 응답이 없습니다.', 'error');
            }
        } catch (error) {
            console.error('API 테스트 실패:', error);
            this.showNotification(`API 테스트 실패: ${error.message}`, 'error');
        }
    }

    // API 키 표시/숨기기
    toggleApiKeyVisibility() {
        const apiKeyInput = document.getElementById('deepseekApiKey');
        const toggleBtn = document.getElementById('toggleApiKeyBtn');
        
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            toggleBtn.textContent = '숨기기';
        } else {
            apiKeyInput.type = 'password';
            toggleBtn.textContent = '보기';
        }
    }

    // API 상태 업데이트
    updateApiStatus() {
        if (window.deepSeekAPI) {
            const status = window.deepSeekAPI.getStatus();
            
            document.getElementById('apiKeyStatus').textContent = status.apiKey;
            document.getElementById('currentModel').textContent = status.model;
            document.getElementById('dailyUsage').textContent = `${status.currentUsage} / ${status.maxDailyUsage}`;
            document.getElementById('remainingUsage').textContent = status.remainingUsage;
            
            // 사용량 바 업데이트
            const usagePercent = (status.currentUsage / status.maxDailyUsage) * 100;
            document.getElementById('usageBar').style.width = `${usagePercent}%`;
            document.getElementById('usagePercentage').textContent = `${Math.round(usagePercent)}%`;
            
            // 사용량에 따른 색상 변경
            const usageBar = document.getElementById('usageBar');
            if (usagePercent < 50) {
                usageBar.style.backgroundColor = '#28a745';
            } else if (usagePercent < 80) {
                usageBar.style.backgroundColor = '#ffc107';
            } else {
                usageBar.style.backgroundColor = '#dc3545';
            }
        }
    }

    // API 사용량 새로고침
    async refreshApiUsage() {
        try {
            if (window.deepSeekAPI) {
                await window.deepSeekAPI.loadUsageStats();
                this.updateApiStatus();
                this.showNotification('사용량이 새로고침되었습니다.', 'success');
            }
        } catch (error) {
            console.error('사용량 새로고침 실패:', error);
            this.showNotification('사용량 새로고침에 실패했습니다.', 'error');
        }
    }

    // API 사용량 초기화
    async resetApiUsage() {
        if (!confirm('오늘의 사용량을 초기화하시겠습니까?')) {
            return;
        }
        
        try {
            if (window.deepSeekAPI) {
                window.deepSeekAPI.currentUsage = 0;
                await window.deepSeekAPI.saveUsageStats();
                this.updateApiStatus();
                this.showNotification('사용량이 초기화되었습니다.', 'success');
            }
        } catch (error) {
            console.error('사용량 초기화 실패:', error);
            this.showNotification('사용량 초기화에 실패했습니다.', 'error');
        }
    }

    // API 로그 로드
    async loadApiLogs() {
        try {
            if (window.db && window.firestore) {
                const q = window.firestore.query(
                    window.firestore.collection(window.db, 'deepseek_logs'),
                    window.firestore.orderBy('timestamp', 'desc')
                );
                const querySnapshot = await window.firestore.getDocs(q);
                
                const logsList = document.getElementById('apiLogsList');
                logsList.innerHTML = '';

                if (querySnapshot.empty) {
                    logsList.innerHTML = '<div class="log-item"><span class="log-time">-</span><span class="log-status">-</span><span class="log-message">API 로그가 없습니다.</span></div>';
                    return;
                }

                querySnapshot.forEach((doc) => {
                    const log = doc.data();
                    this.addApiLogItem(log);
                });
            }
        } catch (error) {
            console.error('API 로그 로드 실패:', error);
            const logsList = document.getElementById('apiLogsList');
            if (logsList) {
                logsList.innerHTML = '<div class="log-item"><span class="log-time">-</span><span class="log-status">오류</span><span class="log-message">API 로그 로드에 실패했습니다.</span></div>';
            }
        }
    }

    // API 로그 항목 추가
    addApiLogItem(log) {
        const logsList = document.getElementById('apiLogsList');
        const logElement = document.createElement('div');
        logElement.className = 'log-item';
        logElement.setAttribute('data-status', log.success ? 'success' : 'error');
        
        const time = new Date(log.timestamp).toLocaleString('ko-KR');
        const status = log.success ? '성공' : '실패';
        const message = log.success 
            ? `컨텐츠 생성 성공 (사용량: ${log.dailyUsage})`
            : `API 오류: ${log.error}`;
        
        logElement.innerHTML = `
            <span class="log-time">${time}</span>
            <span class="log-status ${log.success ? 'success' : 'error'}">${status}</span>
            <span class="log-message">${message}</span>
        `;
        
        logsList.appendChild(logElement);
    }

    // API 로그 필터링
    filterApiLogs() {
        const filter = document.getElementById('logFilterBtn').value;
        const logItems = document.querySelectorAll('#apiLogsList .log-item');
        
        logItems.forEach(item => {
            const status = item.getAttribute('data-status');
            if (filter === 'all' || 
                (filter === 'success' && status === 'success') ||
                (filter === 'error' && status === 'error')) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // API 로그 삭제
    async clearApiLogs() {
        if (!confirm('모든 API 로그를 삭제하시겠습니까?')) {
            return;
        }

        try {
            if (window.db && window.firestore) {
                const q = window.firestore.query(
                    window.firestore.collection(window.db, 'deepseek_logs')
                );
                const querySnapshot = await window.firestore.getDocs(q);
                
                const deletePromises = [];
                querySnapshot.forEach((doc) => {
                    deletePromises.push(window.firestore.deleteDoc(doc.ref));
                });
                
                await Promise.all(deletePromises);
                this.showNotification('API 로그가 삭제되었습니다.', 'success');
                this.loadApiLogs();
            }
        } catch (error) {
            console.error('API 로그 삭제 실패:', error);
            this.showNotification('API 로그 삭제에 실패했습니다.', 'error');
        }
    }
}

// AdminPanel 클래스 정의 완료
// 인스턴스는 admin.html에서 DOM 로드 후 생성됨