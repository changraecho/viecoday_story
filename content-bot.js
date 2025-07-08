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

        this.isRunning = true;
        this.config.enabled = true;
        
        console.log(`컨텐츠 봇 시작됨 - ${this.config.interval / 1000 / 60}분마다 실행`);
        
        // 즉시 첫 번째 컨텐츠 생성
        await this.generateContent();
        
        // 주기적 실행 설정
        this.intervalId = setInterval(async () => {
            if (this.config.enabled) {
                await this.generateContent();
            }
        }, this.config.interval);

        // 설정 저장
        await this.saveBotConfig();
        await this.logActivity('bot_started', { interval: this.config.interval });
        
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

    // 프롬프트 기반 컨텐츠 생성 (시뮬레이션)
    async createContentFromPrompt() {
        // 실제 환경에서는 여기서 AI API를 호출하겠지만,
        // 현재는 프롬프트를 기반으로 다양한 샘플 컨텐츠를 생성합니다.
        
        const templates = {
            titles: [
                "오늘의 소중한 순간들",
                "일상 속 작은 행복",
                "새로운 하루의 시작",
                "마음이 따뜻해지는 이야기",
                "소소한 일상 공유",
                "행복한 하루 되세요",
                "감사한 마음으로",
                "평범한 하루의 특별함",
                "좋은 하루 보내고 계신가요?",
                "함께 나누고 싶은 이야기"
            ],
            contents: [
                "오늘 아침 창문을 열었을 때 들어온 신선한 공기가 하루를 기분 좋게 시작하게 해주었어요. 작은 것에서도 행복을 찾을 수 있다는 걸 다시 한번 느꼈습니다. 여러분도 좋은 하루 보내세요!",
                "길을 걸으면서 만난 작은 꽃들이 참 예뻤어요. 바쁜 일상 속에서도 이런 아름다운 순간들을 놓치지 않으려고 노력하고 있습니다. 모두 행복한 하루 되시길 바라요.",
                "오늘 카페에서 마신 따뜻한 커피 한 잔이 마음까지 따뜻하게 해주었어요. 가끔은 이런 여유로운 시간이 필요한 것 같아요. 여러분은 어떤 순간에 위로를 받으시나요?",
                "친구와 나눈 따뜻한 대화가 하루 종일 기분을 좋게 만들어주었어요. 좋은 사람들과 함께하는 시간의 소중함을 다시 한번 느꼈습니다.",
                "새로운 책을 읽기 시작했는데, 첫 페이지부터 흥미진진해요. 좋은 책 한 권이 주는 즐거움은 정말 특별한 것 같아요. 여러분도 좋은 책 추천해주세요!",
                "오늘 하늘이 정말 맑고 예뻤어요. 이런 날씨를 보면 자연스럽게 기분이 좋아지는 것 같아요. 모두 건강하고 행복한 하루 보내시길 바랍니다.",
                "음악을 들으면서 산책을 했는데, 마음이 정말 평온해졌어요. 때로는 혼자만의 시간도 필요한 것 같아요. 여러분만의 힐링 방법이 있다면 공유해주세요!",
                "가족과 함께 보낸 저녁 시간이 참 따뜻했어요. 바쁜 일상 속에서도 소중한 사람들과의 시간을 놓치지 않으려고 해요. 모든 분들도 사랑하는 사람들과 행복한 시간 보내세요.",
                "새로운 취미를 시작해봤는데 생각보다 재밌어요! 도전하는 것의 즐거움을 다시 한번 느꼈습니다. 여러분도 새로운 것에 도전해보시는 건 어떨까요?",
                "오늘 만난 작은 행복들에 감사한 마음이에요. 평범한 하루지만 그 안에 숨어있는 특별함을 발견할 수 있어서 좋았어요. 모두 좋은 밤 되세요!"
            ]
        };

        // 랜덤하게 제목과 내용 선택
        const randomTitle = templates.titles[Math.floor(Math.random() * templates.titles.length)];
        const randomContent = templates.contents[Math.floor(Math.random() * templates.contents.length)];

        return {
            title: randomTitle,
            content: randomContent,
            author: 'AI봇'
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
        this.config = { ...this.config, ...newConfig };
        
        // 실행 중이고 간격이 변경되었다면 재시작
        if (this.isRunning && oldInterval !== this.config.interval) {
            this.restart();
        }
        
        console.log('봇 설정 업데이트:', this.config);
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