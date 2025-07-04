
(function() {
    // --- 1. Prevent multiple executions ---
    if (document.getElementById('hus-importer-overlay')) {
        console.log("HUS-importer: Already running.");
        return;
    }

    // --- 2. Create UI Elements ---
    console.log("HUS-importer: UI 생성 시작");

    const overlay = document.createElement('div');
    overlay.id = 'hus-importer-overlay';
    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.7)', zIndex: '9998',
        backdropFilter: 'blur(3px)'
    });

    const modal = document.createElement('div');
    modal.id = 'hus-importer-modal';
    Object.assign(modal.style, {
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        backgroundColor: 'white', padding: '25px', borderRadius: '12px',
        zIndex: '9999', textAlign: 'center', fontFamily: '"Helvetica Neue", Arial, sans-serif',
        boxShadow: '0 5px 20px rgba(0,0,0,0.25)',
        width: '90%', maxWidth: '400px'
    });

    modal.innerHTML = `
        <h3 style="margin-top:0; color:#2c3e50; font-size: 1.3em; font-weight: 600;">時間割インポート</h3>
        <p style="color:#34495e; margin: 15px 0 25px 0; line-height: 1.6;">現在のページから時間割情報を抽出し、<br>HUS-schedulerに転送します。よろしいですか？</p>
        <div id="hus-importer-buttons">
            <button id="hus-confirm-btn" style="background-color:#3498db; color:white; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; margin-right:10px; font-weight:500; transition: background-color 0.2s;">はい、転送する</button>
            <button id="hus-cancel-btn" style="background-color:#95a5a6; color:white; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:500; transition: background-color 0.2s;">キャンセル</button>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    console.log("HUS-importer: UI 생성 완료 및 이벤트 리스너 등록");

    // --- 3. Register Event Handlers ---
    const closeModal = () => {
        const overlayElement = document.getElementById('hus-importer-overlay');
        const modalElement = document.getElementById('hus-importer-modal');
        if (overlayElement && overlayElement.parentNode) document.body.removeChild(overlayElement);
        if (modalElement && modalElement.parentNode) document.body.removeChild(modalElement);
        console.log("HUS-importer: UI가 닫혔습니다.");
    };

    document.getElementById('hus-cancel-btn').onclick = closeModal;

    document.getElementById('hus-confirm-btn').onclick = function() {
        try {
            console.log("HUS-importer: '동의' 버튼 클릭됨. 데이터 스크레이핑 시작...");
            this.innerText = '処理中...';
            this.disabled = true;
            document.getElementById('hus-cancel-btn').disabled = true;

            // --- 4. Scrape Data ---
            const courseElements = document.querySelectorAll('#funcForm\\:j_idt387\\:j_idt3700 .ui-datalist-item .lessonArea');
            if (courseElements.length === 0) {
                throw new Error("時間割情報が見つかりません。「履修授業」タブで実行してください。");
            }

            const courses = [];
            const dayMap = {'月': 1, '火': 2, '水': 3, '木': 4, '金': 5, '土': 6, '日': 0};

            courseElements.forEach(element => {
                try {
                    const dayPeriodText = element.querySelector('.period')?.innerText.trim() || '';
                    const [dayText, periodStr] = dayPeriodText.split(/\s+/);
                    const dayOfWeek = dayMap[dayText.replace('曜', '')];
                    const period = Number(periodStr);
                    const courseName = element.querySelector('.lessonTitle')?.innerText.trim();
                    
                    let location = '';
                    const detailElement = element.querySelector('.lessonDetail > div');
                    if (detailElement) {
                        const clone = detailElement.cloneNode(true);
                        const professorLink = clone.querySelector('a');
                        if (professorLink) professorLink.remove();
                        location = clone.textContent.trim().replace(/\s+/g, ' ');
                    }

                    if (courseName && dayOfWeek !== undefined && !isNaN(period) && period > 0) {
                        courses.push({ courseName, dayOfWeek, period, location });
                    }
                } catch(e) {
                    console.warn("A course element could not be parsed, skipping.", element, e);
                }
            });

            if (courses.length === 0) {
                 throw new Error("有効な講義情報が抽出されませんでした。ページの内容を確認してください。");
            }
            
            console.log(`HUS-importer: ${courses.length}개의 강의 정보를 추출했습니다.`);
            console.table(courses);
            
            // --- 5. Send Data and Redirect ---
            const jsonString = JSON.stringify(courses);
            const encodedData = btoa(encodeURIComponent(jsonString));
            const targetUrl = `https://hus-scheduler-project.vercel.app/schedule/import?data=${encodedData}`;

            // Update modal to show completion message
            const modal = document.getElementById('hus-importer-modal');
            if (modal) {
                modal.innerHTML = `
                    <h3 style="margin-top:0; color:#2c3e50; font-size: 1.3em; font-weight: 600;">処理完了</h3>
                    <p style="color:#34495e; margin: 15px 0 25px 0; line-height: 1.6;">時間割情報を取得しました。<br><strong>確認ページへ移動します...</strong></p>
                `;
            }

            // Redirect after a short delay
            setTimeout(() => {
                window.open(targetUrl, '_blank');
                closeModal();
            }, 1500);

        } catch (error) {
            console.error("HUS-importer: 오류 발생", error);
            alert("エラーが発生しました: " + error.message);
            closeModal();
        }
    };
})();
