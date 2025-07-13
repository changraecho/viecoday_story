// DeepSeek API 연동 시스템
class DeepSeekAPI {
    constructor() {
        this.apiKey = 'sk-69f92fd69f094f2ea537749a6952a362';
        this.baseUrl = 'https://api.deepseek.com/v1/chat/completions';
        this.model = 'deepseek-chat';
        this.maxDailyUsage = 1000;
        this.currentUsage = 0;
        this.lastResetDate = new Date().toDateString();
        
        this.init();
    }
    
    async init() {
        await this.loadConfig();
        await this.loadUsageStats();
        this.resetDailyUsageIfNeeded();
    }
    
    // 설정 로드
    async loadConfig() {
        try {
            const configRef = window.firestore.collection(window.db, 'deepseek_config');
            const querySnapshot = await window.firestore.getDocs(configRef);
            
            if (!querySnapshot.empty) {
                const config = querySnapshot.docs[0].data();
                this.apiKey = config.apiKey || '';
                this.model = config.model || 'deepseek-chat';
                this.maxDailyUsage = config.maxDailyUsage || 1000;
                console.log('DeepSeek 설정 로드됨');
            }
        } catch (error) {
            console.error('DeepSeek 설정 로드 실패:', error);
        }
    }
    
    // 설정 저장
    async saveConfig() {
        try {
            const configRef = window.firestore.collection(window.db, 'deepseek_config');
            const querySnapshot = await window.firestore.getDocs(configRef);
            
            const configData = {
                apiKey: this.apiKey,
                model: this.model,
                maxDailyUsage: this.maxDailyUsage,
                updatedAt: new Date().toISOString()
            };
            
            if (querySnapshot.empty) {
                await window.firestore.addDoc(configRef, configData);
            } else {
                const docRef = querySnapshot.docs[0].ref;
                await window.firestore.updateDoc(docRef, configData);
            }
            
            console.log('DeepSeek 설정 저장됨');
        } catch (error) {
            console.error('DeepSeek 설정 저장 실패:', error);
        }
    }
    
    // 사용량 통계 로드 (간소화)
    async loadUsageStats() {
        try {
            // 로컬 스토리지에서 사용량 로드
            const today = new Date().toDateString();
            const storedData = localStorage.getItem('deepseek_usage');
            
            if (storedData) {
                const data = JSON.parse(storedData);
                if (data.date === today) {
                    this.currentUsage = data.count || 0;
                    this.lastResetDate = data.date;
                } else {
                    this.currentUsage = 0;
                    this.lastResetDate = today;
                }
            } else {
                this.currentUsage = 0;
                this.lastResetDate = today;
            }
            
            console.log(`오늘 DeepSeek 사용량: ${this.currentUsage}/${this.maxDailyUsage}`);
        } catch (error) {
            console.error('사용량 통계 로드 실패:', error);
            this.currentUsage = 0;
        }
    }
    
    // 사용량 통계 저장 (간소화)
    async saveUsageStats() {
        try {
            const today = new Date().toDateString();
            const usageData = {
                date: today,
                count: this.currentUsage,
                model: this.model,
                updatedAt: new Date().toISOString()
            };
            
            // 로컬 스토리지에 저장
            localStorage.setItem('deepseek_usage', JSON.stringify(usageData));
            
            console.log('사용량 통계 저장됨:', this.currentUsage);
        } catch (error) {
            console.error('사용량 통계 저장 실패:', error);
        }
    }
    
    // 일일 사용량 리셋 확인
    resetDailyUsageIfNeeded() {
        const today = new Date().toDateString();
        if (this.lastResetDate !== today) {
            this.currentUsage = 0;
            this.lastResetDate = today;
            this.saveUsageStats();
            console.log('일일 사용량 리셋됨');
        }
    }
    
    // 사용량 제한 확인
    canMakeRequest() {
        this.resetDailyUsageIfNeeded();
        const canUse = this.currentUsage < this.maxDailyUsage;
        
        if (!canUse) {
            console.warn(`일일 사용량 한도 초과: ${this.currentUsage}/${this.maxDailyUsage}`);
        }
        
        return canUse;
    }
    
    // API 키 설정
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        this.saveConfig();
    }
    
    // 모델 설정
    setModel(model) {
        this.model = model;
        this.saveConfig();
    }
    
    // 일일 사용량 한도 설정
    setMaxDailyUsage(maxUsage) {
        this.maxDailyUsage = maxUsage;
        this.saveConfig();
    }
    
    // DeepSeek API 호출
    async generateContent(prompt, systemPrompt = '') {
        if (!this.apiKey) {
            throw new Error('DeepSeek API 키가 설정되지 않았습니다.');
        }
        
        if (!this.canMakeRequest()) {
            throw new Error(`일일 사용량 한도 초과 (${this.currentUsage}/${this.maxDailyUsage})`);
        }
        
        try {
            console.log('DeepSeek API 호출 시작...');
            console.log('사용 모델:', this.model);
            console.log('프롬프트:', prompt);
            
            const messages = [];
            
            if (systemPrompt) {
                messages.push({
                    role: 'system',
                    content: systemPrompt
                });
            }
            
            messages.push({
                role: 'user',
                content: prompt
            });
            
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    max_tokens: 1000,
                    temperature: 0.9,
                    top_p: 0.95,
                    frequency_penalty: 0.3,
                    presence_penalty: 0.3
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`DeepSeek API 오류: ${response.status} - ${errorData.error?.message || '알 수 없는 오류'}`);
            }
            
            const data = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('DeepSeek API 응답 형식 오류');
            }
            
            const generatedContent = data.choices[0].message.content;
            
            // 사용량 증가
            this.currentUsage++;
            await this.saveUsageStats();
            
            // 사용량 로그 저장
            await this.logAPIUsage(prompt, generatedContent, data.usage);
            
            console.log('DeepSeek API 호출 완료');
            console.log('생성된 컨텐츠:', generatedContent);
            
            return generatedContent;
            
        } catch (error) {
            console.error('DeepSeek API 호출 실패:', error);
            await this.logAPIError(prompt, error.message);
            throw error;
        }
    }
    
    // API 사용 로그 저장
    async logAPIUsage(prompt, response, usage) {
        try {
            const logData = {
                timestamp: new Date().toISOString(),
                model: this.model,
                prompt: prompt.substring(0, 500), // 프롬프트 앞부분만 저장
                response: response.substring(0, 500), // 응답 앞부분만 저장
                usage: usage,
                dailyUsage: this.currentUsage,
                success: true
            };
            
            await window.firestore.addDoc(
                window.firestore.collection(window.db, 'deepseek_logs'),
                logData
            );
        } catch (error) {
            console.error('API 사용 로그 저장 실패:', error);
        }
    }
    
    // API 에러 로그 저장
    async logAPIError(prompt, errorMessage) {
        try {
            const logData = {
                timestamp: new Date().toISOString(),
                model: this.model,
                prompt: prompt.substring(0, 500),
                error: errorMessage,
                dailyUsage: this.currentUsage,
                success: false
            };
            
            await window.firestore.addDoc(
                window.firestore.collection(window.db, 'deepseek_logs'),
                logData
            );
        } catch (error) {
            console.error('API 에러 로그 저장 실패:', error);
        }
    }
    
    // 컨텐츠 파싱 (제목과 내용 분리)
    parseContent(generatedContent) {
        try {
            // JSON 형태로 응답이 온 경우
            if (generatedContent.includes('{') && generatedContent.includes('}')) {
                const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (parsed.title && parsed.content) {
                        return {
                            title: parsed.title,
                            content: parsed.content
                        };
                    }
                }
            }
            
            // 일반 텍스트에서 제목과 내용 분리
            const lines = generatedContent.split('\n').filter(line => line.trim());
            
            if (lines.length >= 2) {
                // 첫 번째 줄을 제목으로, 나머지를 내용으로
                const title = lines[0].replace(/^제목[:：]\s*/, '').replace(/^title[:：]\s*/i, '').trim();
                const content = lines.slice(1).join('\n').replace(/^내용[:：]\s*/, '').replace(/^content[:：]\s*/i, '').trim();
                
                return {
                    title: title || '제목 없음',
                    content: content || '내용 없음'
                };
            }
            
            // 분리할 수 없는 경우 전체를 내용으로 사용
            return {
                title: '생성된 글',
                content: generatedContent
            };
            
        } catch (error) {
            console.error('컨텐츠 파싱 실패:', error);
            return {
                title: '생성된 글',
                content: generatedContent
            };
        }
    }
    
    // 상태 정보 반환
    getStatus() {
        return {
            apiKey: this.apiKey ? '설정됨' : '미설정',
            model: this.model,
            currentUsage: this.currentUsage,
            maxDailyUsage: this.maxDailyUsage,
            remainingUsage: this.maxDailyUsage - this.currentUsage,
            lastResetDate: this.lastResetDate
        };
    }
}

// 전역 인스턴스 생성
window.deepSeekAPI = new DeepSeekAPI();