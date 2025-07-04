
(function() {
    // --- Day of week mapping ---
    const dayOfWeekToNumber = { '月': 1, '火': 2, '水': 3, '木': 4, '金': 5, '土': 6, '日': 0 };

    // --- 1. Create UI Elements ---
    console.log("HUS-importer: Starting UI creation");

    // Create a semi-transparent overlay that covers the entire screen
    const overlay = document.createElement('div');
    overlay.id = 'hus-importer-overlay';
    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.7)', zIndex: '9998'
    });

    // Create the modal (popup) window to be displayed in the center
    const modal = document.createElement('div');
    modal.id = 'hus-importer-modal';
    Object.assign(modal.style, {
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        backgroundColor: 'white', padding: '25px', borderRadius: '10px',
        zIndex: '9999', textAlign: 'center', fontFamily: 'sans-serif',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
    });

    // Construct the modal's inner content
    modal.innerHTML = `
        <h3 style="margin-top:0; color:#333; font-size: 1.2em;">時間割インポート</h3>
        <p style="color:#555; line-height: 1.5;">現在のページから時間割情報を抽出し、<br>HUS-schedulerに転送します。よろしいですか？</p>
        <div style="margin-top: 20px;">
            <button id="hus-confirm-btn" style="background-color:#007bff; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; margin-right:10px; font-size: 1em;">はい、転送する</button>
            <button id="hus-cancel-btn" style="background-color:#6c757d; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; font-size: 1em;">キャンセル</button>
        </div>
    `;

    // Add the created UI to the page
    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    console.log("HUS-importer: UI created and event listeners registered");

    // --- 2. Register Event Handlers ---
    const closeModal = () => {
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
        if (document.body.contains(modal)) document.body.removeChild(modal);
        console.log("HUS-importer: UI closed.");
    };

    document.getElementById('hus-cancel-btn').onclick = closeModal;

    document.getElementById('hus-confirm-btn').onclick = function() {
        try {
            console.log("HUS-importer: 'Confirm' button clicked. Starting data scraping...");
            this.innerText = '処理中...';
            this.disabled = true;

            // --- 3. Data Scraping ---
            const courseElements = document.querySelectorAll('#funcForm\\:j_idt387\\:j_idt3700 .ui-datalist-item .lessonArea');
            if (courseElements.length === 0) {
                throw new Error("時間割情報が見つかりません。「履修授業」タブで実行してください。");
            }

            const courses = [];
            courseElements.forEach(element => {
                const dayPeriodText = element.querySelector('.period')?.innerText.trim() || ' ';
                const [dayStr, period] = dayPeriodText.split(' ');
                const courseName = element.querySelector('.lessonTitle')?.innerText.trim();
                const professor = element.querySelector('.lessonDetail a')?.innerText.trim();
                const locationElement = element.querySelector('.lessonDetail div');
                
                if (locationElement && professor && locationElement.innerText.includes(professor)) {
                    const professorLink = locationElement.querySelector('a');
                    if(professorLink) professorLink.remove();
                }
                const location = locationElement?.innerText.trim();
                
                const dayChar = dayStr ? dayStr.charAt(0) : '';
                const dayNumber = dayOfWeekToNumber[dayChar];

                if (courseName && dayNumber !== undefined) {
                    courses.push({ courseName, dayOfWeek: dayNumber, period: parseInt(period, 10) || null, professor, location });
                }
            });

            console.log(`HUS-importer: Extracted ${courses.length} course(s).`);
            console.table(courses);

            // --- 4. Data Transmission and Redirection ---
            const jsonString = JSON.stringify(courses);
            const encodedData = btoa(encodeURIComponent(jsonString));
            const targetUrl = `https://hus-scheduler-project.vercel.app/schedule/import?data=${encodedData}`;

            alert("時間割情報を取得しました。確認ページに移動します。");
            window.open(targetUrl, '_blank');
            closeModal();

        } catch (error) {
            console.error("HUS-importer: An error occurred", error);
            alert("エラーが発生しました: " + error.message);
            closeModal();
        }
    };
})();
