(function() {
    // --- 1. UI 생성 및 동의 확인 로직 (기존과 동일) ---
    const overlay = document.createElement('div');
    overlay.id = 'hus-overlay';
    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '9998'
    });

    const modal = document.createElement('div');
    modal.id = 'hus-modal';
    Object.assign(modal.style, {
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        backgroundColor: 'white', padding: '25px', borderRadius: '10px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)', zIndex: '9999',
        width: '90%', maxWidth: '500px', textAlign: 'center'
    });

    modal.innerHTML = `
        <h2 style="margin-top:0; font-size: 1.5em; color: #333;">HUS-scheduler インポート確認</h2>
        <p style="margin-bottom: 25px; font-size: 1.1em; color: #666;">
            現在のページの授業情報を HUS-scheduler にインポートしますか？<br>
            「履修授業一覧」ページで実行することをお勧めします。
        </p>
        <div style="display: flex; justify-content: space-around;">
            <button id="hus-cancel-btn" style="padding: 10px 20px; border: 1px solid #ccc; background-color: #f0f0f0; border-radius: 5px; cursor: pointer;">キャンセル</button>
            <button id="hus-confirm-btn" style="padding: 10px 20px; border: none; background-color: #28a745; color: white; border-radius: 5px; cursor: pointer;">はい、インポートします</button>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    const closeModal = () => {
        document.getElementById('hus-overlay')?.remove();
        document.getElementById('hus-modal')?.remove();
    };

    document.getElementById('hus-cancel-btn').onclick = closeModal;

    // --- 2. 확인 버튼 클릭 시 데이터 추출 실행 ---
    document.getElementById('hus-confirm-btn').onclick = function() {
        try {
            this.innerText = '処理中...';
            this.disabled = true;

            let courses = [];
            
            // --- 3. 페이지 유형 자동 감지 및 최종 데이터 추출 로직 ---
            const fullTimetableContainer = document.querySelector('#funcForm\\:j_idt387\\:j_idt3700');
            if (fullTimetableContainer) {
                console.log("「履修授業一覧」ページを認識しました。");
                const courseElements = fullTimetableContainer.querySelectorAll('.ui-datalist-item .lessonArea');
                
                courses = Array.from(courseElements).flatMap(el => {
                    const baseData = {
                        courseName: el.querySelector('.lessonTitle')?.innerText.trim() || '',
                        location: el.querySelector('.lessonDetail > div:last-child')?.innerText.trim() || '',
                        moodleCourseId: null
                    };

                    const dayPeriodElements = el.querySelectorAll('.lessonHead .period');
                    if (dayPeriodElements.length === 0) return [];

                    return Array.from(dayPeriodElements).map(periodEl => {
                        const text = periodEl.innerText.trim();
                        const [day, period] = text.split(' ');
                        
                        const individualPeriods = period ? period.split('・') : [];
                        if(individualPeriods.length > 1) {
                            return individualPeriods.map(p => ({ ...baseData, dayOfWeek: day, period: p }));
                        }
                        
                        return { ...baseData, dayOfWeek: day, period: period };
                    }).flat();
                });
            } else {
                 console.log("「日表示」ページまたは他のページを認識しました。");
                 const dateDisp = document.querySelector('.dateDisp')?.innerText.trim();
                 const dayMatch = dateDisp?.match(/（(月|火|水|木|金|土|日)）/);
                 if (dayMatch) {
                     const dayOfWeek = dayMatch[1];
                     const timeElements = document.querySelectorAll('#portalSchedule2 .lessonArea');
                     const periodMap = {"09:00":"1", "10:40":"2", "13:00":"3", "14:40":"4", "16:20":"5", "18:00":"6"};
                     courses = Array.from(timeElements).map(el => {
                         const timeText = el.querySelector('.lessonHead p').innerText.trim();
                         const timeMatch = timeText.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
                         const periodText = el.querySelector('.lessonHead .period')?.innerText.match(/([1-6])/);
                         const period = periodText ? periodText[1] : (timeMatch ? periodMap[timeMatch[1]] : null);
                         
                         return {
                            dayOfWeek,
                            period: String(period),
                            courseName: el.querySelector('.lessonTitle')?.innerText.trim() || '',
                            location: el.querySelector('.lessonDetail > div:last-child')?.innerText.trim() || '',
                            moodleCourseId: null
                         };
                     }).filter(c => c.period);
                 }
            }

            if (courses.length === 0) {
                throw new Error("時間割情報が見つかりません。「履修授業一覧」ページで実行してください。");
            }
            
            const jsonString = JSON.stringify(courses);
            const encodedData = btoa(encodeURIComponent(jsonString));
            const targetUrl = `https://hus-scheduler-project.vercel.app/dashboard/schedule/import?data=${encodedData}`;

            alert(`合計${courses.length}件の授業をインポートします。`);
            window.location.href = targetUrl;

        } catch (error) {
            alert("エラー: " + error.message);
            console.error(error);
            closeModal();
        }
    };
})();
