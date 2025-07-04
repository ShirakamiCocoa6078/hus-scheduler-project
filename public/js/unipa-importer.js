
(function() {
    'use strict';

    // --- Configuration ---
    const APP_URL = 'https://hus-scheduler-project.vercel.app';
    const API_ENDPOINT = `${APP_URL}/api/courses/receive-from-portal`;
    const CONFIRM_PAGE_URL = `${APP_URL}/schedule/confirm`;

    // --- Helper Functions ---
    function createModal() {
        const overlay = document.createElement('div');
        overlay.id = 'hus-scheduler-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.fontFamily = 'sans-serif';

        const modal = document.createElement('div');
        modal.id = 'hus-scheduler-modal';
        modal.style.backgroundColor = 'white';
        modal.style.padding = '30px';
        modal.style.borderRadius = '8px';
        modal.style.textAlign = 'center';
        modal.style.maxWidth = '400px';
        modal.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';

        modal.innerHTML = `
            <h2 style="margin-top: 0; color: #333; font-size: 1.2rem;">時間割情報を転送しますか？</h2>
            <p style="color: #666; margin-bottom: 25px; font-size: 0.9rem;">現在のページから時間割情報を抽出し、<br><strong>HUS-scheduler</strong>に転送します。</p>
            <div style="display: flex; justify-content: space-around;">
                <button id="hus-scheduler-cancel" style="padding: 10px 20px; border-radius: 5px; border: 1px solid #ccc; background-color: #f0f0f0; cursor: pointer; font-size: 0.9rem;">いいえ</button>
                <button id="hus-scheduler-confirm" style="padding: 10px 20px; border-radius: 5px; border: none; background-color: #28a745; color: white; cursor: pointer; font-size: 0.9rem;">はい、転送する</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        return { overlay, confirmBtn: document.getElementById('hus-scheduler-confirm'), cancelBtn: document.getElementById('hus-scheduler-cancel') };
    }

    function showStatus(message, isError = false) {
        const modal = document.getElementById('hus-scheduler-modal');
        if (modal) {
            modal.innerHTML = `
                <h2 style="color: ${isError ? '#dc3545' : '#333'}; font-size: 1.2rem;">${message}</h2>
            `;
        }
    }
    
    function dayOfWeekToInt(dayChar) {
        const map = { '月': 1, '火': 2, '水': 3, '木': 4, '金': 5, '土': 6, '日': 0 };
        return map[dayChar] !== undefined ? map[dayChar] : -1;
    }
    
    function scrapeTimetable() {
        console.log("Scraping started...");
        const scheduleContainer = document.querySelector('#funcForm\\:j_idt387\\:j_idt3700');
        if (!scheduleContainer) {
            throw new Error("時間割のコンテナが見つかりませんでした。");
        }

        const courseElements = scheduleContainer.querySelectorAll('.ui-datalist-item .lessonArea');
        if (courseElements.length === 0) {
            throw new Error("授業データが見つかりませんでした。「履修授業」ページであることを確認してください。");
        }
        
        console.log(`Found ${courseElements.length} course elements.`);
        
        const courses = [];
        courseElements.forEach(element => {
            const dayPeriodText = element.querySelector('.period')?.innerText.trim() || '';
            const [dayChar, periodStr] = dayPeriodText.split(/\s+/);

            const courseName = element.querySelector('.lessonTitle')?.innerText.trim() || '不明な授業';
            const location = element.querySelector('.lessonDetail div')?.innerText.trim() || '';
            
            const dayOfWeek = dayOfWeekToInt(dayChar);
            const period = parseInt(periodStr?.replace('時限', ''), 10);
            
            if (dayOfWeek !== -1 && !isNaN(period)) {
                courses.push({
                    courseName,
                    dayOfWeek,
                    period,
                    location,
                });
            }
        });
        
        console.log("Scraped courses:", courses);
        if (courses.length === 0) {
            throw new Error("有効な授業データを抽出できませんでした。");
        }
        return courses;
    }

    // --- Main Logic ---
    function main() {
        const { overlay, confirmBtn, cancelBtn } = createModal();
        
        function cleanup() {
            if(overlay) document.body.removeChild(overlay);
        }

        cancelBtn.addEventListener('click', cleanup);

        confirmBtn.addEventListener('click', async () => {
            try {
                showStatus("時間割を抽出中...");
                const courses = scrapeTimetable();
                
                showStatus("サーバーに転送中...");
                const response = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(courses)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `サーバーエラー: ${response.status}`);
                }

                showStatus("転送成功！確認ページに移動します...");
                window.location.href = CONFIRM_PAGE_URL;

            } catch (error) {
                console.error("Error during import:", error);
                showStatus(`エラー: ${error.message}`, true);
                setTimeout(cleanup, 4000);
            }
        });
    }

    if (!document.getElementById('hus-scheduler-overlay')) {
        main();
    }
})();
