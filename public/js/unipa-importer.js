(function() {
    // --- 1. UI 생성 및 동의 확인 로직 ---
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.7)', zIndex: '9998'
    });
    const modal = document.createElement('div');
    Object.assign(modal.style, {
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        backgroundColor: 'white', padding: '25px', borderRadius: '10px',
        zIndex: '9999', textAlign: 'center', fontFamily: 'sans-serif', color: '#333'
    });
    modal.innerHTML = `
        <h3 style="margin-top:0;">時間割インポート</h3>
        <p>現在のページから時間割情報を抽出し、<br>HUS-schedulerに転送します。よろしいですか？</p>
        <button id="hus-confirm-btn" style="background-color:#007bff; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; margin-right:10px;">はい、転送する</button>
        <button id="hus-cancel-btn" style="background-color:#6c757d; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer;">キャンセル</button>
    `;
    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    const closeModal = () => {
        if (overlay.parentNode) document.body.removeChild(overlay);
        if (modal.parentNode) document.body.removeChild(modal);
    };
    document.getElementById('hus-cancel-btn').onclick = closeModal;

    // --- 2. 확인 버튼 클릭 시, 검증된 로직으로 데이터 추출 실행 ---
    document.getElementById('hus-confirm-btn').onclick = function() {
        try {
            this.innerText = '処理中...';
            this.disabled = true;

            let courses = [];
            
            // --- 3. 페이지 유형 자동 감지 및 데이터 추출 ---
            const fullTimetableContainer = document.querySelector('#funcForm\\:j_idt387\\:j_idt3700');
            if (fullTimetableContainer) {
                const courseElements = fullTimetableContainer.querySelectorAll('.ui-datalist-item .lessonArea');
                
                courses = Array.from(courseElements).flatMap(el => {
                    const moodleLink = el.querySelector('a[title*="授業評価アンケート"]');
                    const moodleCourseId = moodleLink ? new URL(moodleLink.href).searchParams.get('id') : null;

                    const baseData = {
                        courseName: el.querySelector('.lessonTitle')?.innerText.trim() || '',
                        professor: el.querySelector('.lessonDetail a')?.innerText.trim() || '',
                        location: el.querySelector('.lessonDetail > div:last-child')?.innerText.trim() || '',
                        moodleCourseId: moodleCourseId
                    };

                    const dayPeriodElements = el.querySelectorAll('.period');
                    if (dayPeriodElements.length === 0) return [];

                    const dayPeriodText = Array.from(dayPeriodElements).map(p => p.innerText.trim()).join(' ');
                    const dayPeriodParts = dayPeriodText.split(/\s+/).filter(Boolean);
                    if (dayPeriodParts.length < 1) return [];

                    const day = dayPeriodParts[0].replace(/[^月火水木金土日]/g, '');
                    if (!day) return [];
                    
                    const periodStrings = dayPeriodText.replace(day, '').trim();
                    const allPeriods = periodStrings.split(/[\s・]+/).filter(Boolean);

                    return allPeriods.map(period => ({
                        ...baseData,
                        dayOfWeek: day,
                        period: period
                    }));
                });
            }

            if (courses.length === 0) {
                const dateString = document.querySelector('.dateDisp')?.innerText.trim() || '';
                const dayMatch = dateString.match(/\((月|火|水|木|金|土|日)\)/);
                if (dayMatch) {
                    const dayOfWeek = dayMatch[1];
                    const timeElements = document.querySelectorAll('#portalSchedule2 .lessonArea');
                    const periodMap = {"09:00": "1", "10:40": "2", "13:00": "3", "14:40": "4", "16:20": "5", "18:00": "6"};
                    
                    courses = Array.from(timeElements).flatMap(el => {
                        const timeText = el.querySelector('.lessonHead p').innerText.trim().replace(/\s*-\s*/g, "-");
                        const timeMatch = timeText.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
                        const periodText = el.querySelector('.lessonHead .period')?.innerText.match(/([1-6])/);
                        const period = periodText ? periodText[1] : (timeMatch ? periodMap[timeMatch[1]] : null);
                        
                        if (!period) return [];

                        const moodleLink = el.querySelector('a[title*="授業評価アンケート"]');
                        const moodleCourseId = moodleLink ? new URL(moodleLink.href).searchParams.get('id') : null;

                        return [{
                            dayOfWeek,
                            period,
                            courseName: el.querySelector('.lessonTitle')?.innerText.trim() || '',
                            professor: el.querySelector('.lessonDetail a')?.innerText.trim() || '',
                            location: el.querySelector('.lessonDetail > div:last-child')?.innerText.trim() || '',
                            moodleCourseId
                        }];
                    }).filter(Boolean);
                }
            }

            if (courses.length === 0) {
                throw new Error("時間割情報が見つかりません。「履修授業一覧」または「日表示」タブで実行してください。");
            }
            
            // --- 4. 데이터 인코딩 및 서버로 전송 ---
            const jsonString = JSON.stringify(courses);
            const encodedData = btoa(encodeURIComponent(jsonString));
            const targetUrl = `https://hus-scheduler-project.vercel.app/dashboard/schedule/import?data=${encodedData}`;

            // 현재 탭에서 페이지 이동
            window.location.href = targetUrl;

        } catch (error) {
            alert("エラー: " + error.message);
            console.error(error);
            closeModal();
        }
    };
})();
