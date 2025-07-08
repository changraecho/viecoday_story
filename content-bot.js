// 컨텐츠 생성 봇 시스템
class ContentBot {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
        this.config = {
            interval: 10 * 60 * 1000, // 10분 (밀리초)
            prompt: "한국어로 일상적이고 친근한 커뮤니티 글을 작성해주세요. 제목과 내용을 포함해서 작성해주세요.",
            enabled: false
        };
        this.init();
    }

    async init() {
        // Firebase 로드 대기
        await this.waitForFirebase();
        // 봇 설정 로드
        await this.loadBotConfig();
    }

    waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.db && window.firestore) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }

    // Firebase에서 봇 설정 로드
    async loadBotConfig() {
        try {
            const q = window.firestore.query(
                window.firestore.collection(window.db, 'bot_config'),
                window.firestore.orderBy('timestamp', 'desc')
            );
            const querySnapshot = await window.firestore.getDocs(q);
            
            if (!querySnapshot.empty) {
                const latestConfig = querySnapshot.docs[0].data();
                this.config = {
                    interval: latestConfig.interval || 10 * 60 * 1000,
                    prompt: latestConfig.prompt || this.config.prompt,
                    enabled: latestConfig.enabled || false
                };
                console.log('봇 설정 로드됨:', this.config);
            } else {
                // 설정이 없으면 기본 설정 생성
                await this.saveBotConfig();
                console.log('기본 봇 설정 생성됨');
            }
        } catch (error) {
            console.error('봇 설정 로드 실패:', error);
            // 권한 문제일 경우 기본 설정 사용
            console.log('기본 설정으로 봇 초기화');
        }
    }

    // Firebase에 봇 설정 저장
    async saveBotConfig() {
        try {
            await window.firestore.addDoc(
                window.firestore.collection(window.db, 'bot_config'),
                {
                    ...this.config,
                    timestamp: new Date().toISOString()
                }
            );
            console.log('봇 설정 저장됨');
        } catch (error) {
            console.error('봇 설정 저장 실패:', error);
        }
    }

    // 봇 시작
    async start() {
        if (this.isRunning) {
            console.log('봇이 이미 실행 중입니다.');
            return false;
        }

        console.log('봇 시작 프로세스 시작...');
        this.isRunning = true;
        this.config.enabled = true;
        
        console.log(`컨텐츠 봇 시작됨 - ${this.config.interval / 1000 / 60}분마다 실행`);
        console.log('봇 설정:', this.config);
        
        // 즉시 첫 번째 컨텐츠 생성
        console.log('즉시 첫 번째 컨텐츠 생성 시작...');
        await this.generateContent();
        
        // 주기적 실행 설정
        console.log('주기적 실행 타이머 설정...');
        this.intervalId = setInterval(async () => {
            console.log('주기적 컨텐츠 생성 실행 - 활성화 상태:', this.config.enabled);
            if (this.config.enabled) {
                await this.generateContent();
            }
        }, this.config.interval);

        // 설정 저장
        console.log('봇 설정 저장 중...');
        await this.saveBotConfig();
        await this.logActivity('bot_started', { interval: this.config.interval });
        
        console.log('봇 시작 완료!');
        return true;
    }

    // 봇 중지
    async stop() {
        if (!this.isRunning) {
            console.log('봇이 실행 중이 아닙니다.');
            return false;
        }

        this.isRunning = false;
        this.config.enabled = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        console.log('컨텐츠 봇 중지됨');
        
        // 설정 저장
        await this.saveBotConfig();
        await this.logActivity('bot_stopped');
        
        return true;
    }

    // 컨텐츠 생성
    async generateContent() {
        try {
            console.log('컨텐츠 생성 중...');
            
            // 프롬프트 기반 컨텐츠 생성 (시뮬레이션)
            const content = await this.createContentFromPrompt();
            
            // Firebase에 글 저장
            const success = await this.savePostToFirebase(content);
            
            if (success) {
                await this.logActivity('content_generated', {
                    title: content.title,
                    contentLength: content.content.length
                });
                console.log('컨텐츠 생성 완료:', content.title);
            } else {
                await this.logActivity('content_generation_failed');
                console.error('컨텐츠 저장 실패');
            }
            
        } catch (error) {
            console.error('컨텐츠 생성 중 오류:', error);
            await this.logActivity('content_generation_error', { error: error.message });
        }
    }

    // 프롬프트 기반 컨텐츠 생성
    async createContentFromPrompt() {
        console.log('프롬프트 기반 컨텐츠 생성 시작');
        console.log('현재 프롬프트:', this.config.prompt);
        
        // 사용자 프롬프트 분석 및 컨텐츠 생성
        const generatedContent = await this.generateContentFromUserPrompt(this.config.prompt);
        
        return {
            title: generatedContent.title,
            content: generatedContent.content,
            author: 'AI봇'
        };
    }

    // 사용자 프롬프트를 분석하여 컨텐츠 생성
    async generateContentFromUserPrompt(prompt) {
        console.log('사용자 프롬프트 분석:', prompt);
        
        // 프롬프트 키워드 분석
        const keywords = this.extractKeywords(prompt);
        console.log('추출된 키워드:', keywords);
        
        // 키워드 기반 컨텐츠 생성
        const content = this.createContentFromKeywords(keywords, prompt);
        
        return content;
    }

    // 프롬프트에서 키워드 추출
    extractKeywords(prompt) {
        const keywords = {
            topics: [],
            tone: '친근한',
            style: '일상적',
            length: '보통'
        };

        // 주제 키워드 추출
        const topicKeywords = [
            '일상', '취미', '음식', '여행', '운동', '독서', '영화', '음악', 
            '가족', '친구', '연애', '직장', '학교', '날씨', '계절', '건강',
            '요리', '카페', '쇼핑', '게임', '드라마', '뉴스', '문화', '예술'
        ];

        topicKeywords.forEach(keyword => {
            if (prompt.includes(keyword)) {
                keywords.topics.push(keyword);
            }
        });

        // 톤 키워드 추출
        if (prompt.includes('재미있는') || prompt.includes('유머')) keywords.tone = '재미있는';
        if (prompt.includes('진지한') || prompt.includes('깊이')) keywords.tone = '진지한';
        if (prompt.includes('따뜻한') || prompt.includes('감동')) keywords.tone = '따뜻한';
        if (prompt.includes('가벼운') || prompt.includes('캐주얼')) keywords.tone = '가벼운';

        // 스타일 키워드 추출
        if (prompt.includes('정보') || prompt.includes('팁')) keywords.style = '정보성';
        if (prompt.includes('질문') || prompt.includes('토론')) keywords.style = '상호작용';
        if (prompt.includes('공유') || prompt.includes('경험')) keywords.style = '경험공유';

        return keywords;
    }

    // 키워드 기반 컨텐츠 생성
    createContentFromKeywords(keywords, originalPrompt) {
        console.log('키워드 기반 컨텐츠 생성:', keywords);
        
        // 주제별 컨텐츠 템플릿
        const contentTemplates = {
            일상: {
                titles: ["오늘의 소소한 일상", "평범한 하루의 특별함", "일상 속 작은 발견"],
                contents: [
                    "오늘 하루도 평범하게 시작했지만, 작은 것들에서 행복을 찾을 수 있었어요. 여러분은 어떤 순간에 행복을 느끼시나요?",
                    "바쁜 일상 속에서도 잠깐의 여유를 찾아보려고 해요. 오늘은 어떤 특별한 순간이 있으셨나요?",
                    "평범해 보이는 하루지만, 그 안에는 많은 이야기가 숨어있어요. 여러분의 일상 이야기도 들려주세요!"
                ]
            },
            음식: {
                titles: ["오늘의 맛있는 한 끼", "음식으로 느끼는 행복", "맛있는 음식 이야기"],
                contents: [
                    "오늘 먹은 음식이 정말 맛있었어요. 음식 하나로도 하루가 행복해지는 것 같아요. 여러분이 좋아하는 음식은 무엇인가요?",
                    "새로운 음식에 도전해봤는데 생각보다 맛있더라고요. 가끔은 새로운 것에 도전하는 것도 좋은 것 같아요!",
                    "집에서 요리를 해봤는데 의외로 잘 됐어요. 직접 만든 음식의 맛은 정말 특별한 것 같아요."
                ]
            },
            여행: {
                titles: ["여행의 즐거움", "새로운 곳에서의 경험", "여행 이야기"],
                contents: [
                    "새로운 곳을 방문하면서 많은 것을 배우고 느낄 수 있었어요. 여행은 정말 좋은 경험인 것 같아요.",
                    "여행지에서 만난 사람들과의 이야기가 참 재미있었어요. 새로운 만남의 소중함을 느꼈습니다.",
                    "아름다운 풍경을 보면서 마음이 정말 평온해졌어요. 자연의 아름다움에 감사하게 되네요."
                ]
            },
            취미: {
                titles: ["새로운 취미 이야기", "취미생활의 즐거움", "나만의 시간"],
                contents: [
                    "새로운 취미를 시작해봤는데 생각보다 재미있어요. 새로운 도전은 항상 설레는 것 같아요.",
                    "취미 활동을 하면서 스트레스가 많이 풀렸어요. 여러분만의 특별한 취미가 있나요?",
                    "혼자만의 시간에 좋아하는 것을 하니까 정말 행복해요. 자신만의 시간도 중요한 것 같아요."
                ]
            }
        };

        // 기본 템플릿 (키워드가 없을 때)
        const defaultTemplates = {
            titles: [
                `${keywords.tone} 하루 보내기`,
                `${keywords.style} 이야기`,
                "오늘의 특별한 순간",
                "함께 나누고 싶은 이야기",
                "좋은 하루 되세요"
            ],
            contents: [
                `${originalPrompt}를 바탕으로 오늘 하루를 돌아보니 많은 것을 느낄 수 있었어요. 여러분도 좋은 하루 보내세요!`,
                `${keywords.tone} 마음으로 하루를 보내고 있어요. 작은 것에서도 행복을 찾을 수 있는 하루였으면 좋겠어요.`,
                "오늘도 새로운 하루가 시작되었네요. 모두 건강하고 행복한 하루 보내시길 바랍니다!",
                `${keywords.tone} 분위기로 이야기를 나누고 싶어요. 여러분은 어떤 하루를 보내고 계신가요?`,
                "평범한 일상이지만 그 안에서 특별함을 찾아보려고 해요. 여러분의 특별한 순간도 공유해주세요!"
            ]
        };

        // 주제가 있으면 해당 주제의 템플릿 사용, 없으면 기본 템플릿 사용
        let selectedTemplate = defaultTemplates;
        if (keywords.topics.length > 0) {
            const mainTopic = keywords.topics[0];
            if (contentTemplates[mainTopic]) {
                selectedTemplate = contentTemplates[mainTopic];
            }
        }

        // 랜덤 선택
        const randomTitle = selectedTemplate.titles[Math.floor(Math.random() * selectedTemplate.titles.length)];
        const randomContent = selectedTemplate.contents[Math.floor(Math.random() * selectedTemplate.contents.length)];

        return {
            title: randomTitle,
            content: randomContent
        };
    }

    // Firebase에 글 저장
    async savePostToFirebase(content) {
        try {
            const post = {
                title: content.title,
                content: content.content,
                author: content.author,
                date: new Date().toISOString(),
                likes: 0,
                liked: false,
                comments: [],
                isBot: true // 봇이 생성한 글임을 표시
            };

            const docRef = await window.firestore.addDoc(
                window.firestore.collection(window.db, 'posts'),
                post
            );

            console.log('글 저장 완료:', docRef.id);
            return true;
        } catch (error) {
            console.error('글 저장 실패:', error);
            return false;
        }
    }

    // 활동 로그 저장
    async logActivity(action, data = {}) {
        try {
            const logEntry = {
                action,
                data,
                timestamp: new Date().toISOString(),
                botConfig: { ...this.config }
            };

            await window.firestore.addDoc(
                window.firestore.collection(window.db, 'bot_logs'),
                logEntry
            );
        } catch (error) {
            console.error('로그 저장 실패:', error);
        }
    }

    // 설정 업데이트
    updateConfig(newConfig) {
        const oldInterval = this.config.interval;
        const oldPrompt = this.config.prompt;
        
        this.config = { ...this.config, ...newConfig };
        
        console.log('봇 설정 업데이트');
        console.log('이전 설정:', { interval: oldInterval, prompt: oldPrompt });
        console.log('새로운 설정:', this.config);
        
        // 실행 중이고 간격이 변경되었다면 재시작
        if (this.isRunning && oldInterval !== this.config.interval) {
            console.log('간격 변경으로 인한 봇 재시작');
            this.restart();
        }
        
        // 프롬프트가 변경되었다면 로그 출력
        if (oldPrompt !== this.config.prompt) {
            console.log('프롬프트 변경됨:', this.config.prompt);
        }
    }

    // 봇 재시작
    async restart() {
        console.log('봇 재시작 중...');
        await this.stop();
        await this.start();
    }

    // 상태 조회
    getStatus() {
        return {
            isRunning: this.isRunning,
            config: this.config,
            nextExecution: this.isRunning ? new Date(Date.now() + this.config.interval) : null
        };
    }

    // 수동 컨텐츠 생성
    async generateManualContent() {
        if (!this.isRunning) {
            console.log('봇이 실행 중이 아닙니다. 수동 생성을 진행합니다.');
        }
        await this.generateContent();
    }
}

// 전역 봇 인스턴스 생성
window.contentBot = new ContentBot();