// HUS-scheduler UNIPA Importer Bookmarklet
(function() {
    'use strict';

    const TARGET_APP_URL = 'https://hus-scheduler-project.vercel.app'; // This should be your app's domain

    // --- UI Creation ---
    function createModal() {
        const overlay = document.createElement('div');
        overlay.id = 'hus-scheduler-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.6)';
        overlay.style.zIndex = '10000';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.fontFamily = '"Helvetica Neue", Arial, sans-serif';

        const modal = document.createElement('div');
        modal.style.backgroundColor = '#fff';
        modal.style.padding = '24px';
        modal.style.borderRadius = '8px';
        modal.style.textAlign = 'center';
        modal.style.maxWidth = '400px';
        modal.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';

        const title = document.createElement('h2');
        title.textContent = '時間割のインポート';
        title.style.margin = '0 0 10px 0';
        title.style.fontSize = '22px';
        title.style.color = '#333';
        
        const message = document.createElement('p');
        message.textContent = '現在のページから時間割情報を抽出し、HUS-schedulerに転送しますか？';
        message.style.margin = '0 0 20px 0';
        message.style.fontSize = '16px';
        message.style.color = '#555';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.gap = '10px';

        const confirmButton = document.createElement('button');
        confirmButton.id = 'hus-confirm-import';
        confirmButton.textContent = 'はい、転送する';
        styleButton(confirmButton, '#28a745', '#fff');

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'いいえ';
        styleButton(cancelButton, '#ccc', '#333');
        
        cancelButton.onclick = () => document.body.removeChild(overlay);
        
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(confirmButton);
        modal.appendChild(title);
        modal.appendChild(message);
        modal.appendChild(buttonContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        return { overlay, confirmButton };
    }

    function styleButton(button, bgColor, textColor) {
        button.style.padding = '10px 20px';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.style.fontSize = '16px';
        button.style.backgroundColor = bgColor;
        button.style.color = textColor;
        button.style.transition = 'opacity 0.2s';
        button.onmouseover = () => button.style.opacity = '0.8';
        button.onmouseout = () => button.style.opacity = '1';
    }

    // --- Data Scraping ---
    function scrapeTimetable() {
        const dayMapping = { '月': 1, '火': 2, '水': 3, '木': 4, '金': 5, '土': 6, '日':0 };
        const courses = [];
        
        // This selector is a placeholder and MUST be adapted to the actual HUS-UNIPA timetable structure.
        const rows = document.querySelectorAll('table#jugyo_ichiran tr.class_odd, table#jugyo_ichiran tr.class_even');
        
        if (rows.length === 0) {
            alert('時間割のテーブルが見つかりませんでした。\n(セレクタ: table#jugyo_ichiran tr)');
            return null;
        }

        rows.forEach(row => {
            try {
                const cells = row.querySelectorAll('td');
                if (cells.length < 5) return;

                const courseName = cells[0].textContent.trim();
                const dayAndPeriodText = cells[1].textContent.trim(); // e.g., "月3-4" or "火1"
                const location = cells[4].textContent.trim();

                const dayChar = dayAndPeriodText.charAt(0);
                const dayOfWeek = dayMapping[dayChar];
                
                const periodChars = dayAndPeriodText.substring(1).split('-');
                const startPeriod = parseInt(periodChars[0], 10);
                const endPeriod = parseInt(periodChars[1] || periodChars[0], 10);

                if (courseName && dayOfWeek !== undefined && !isNaN(startPeriod)) {
                    for (let period = startPeriod; period <= endPeriod; period++) {
                        courses.push({
                            courseName,
                            dayOfWeek,
                            period,
                            location,
                        });
                    }
                }
            } catch (e) {
                console.warn('Error parsing a row:', row, e);
            }
        });
        
        return courses;
    }

    // --- Main Logic ---
    function main() {
        const { overlay, confirmButton } = createModal();

        confirmButton.onclick = async () => {
            try {
                confirmButton.textContent = '処理中...';
                confirmButton.disabled = true;

                const courses = scrapeTimetable();
                if (!courses || courses.length === 0) {
                    alert('抽出できる授業データがありませんでした。時間割ページで実行しているか確認してください。');
                    document.body.removeChild(overlay);
                    return;
                }

                // Use 'no-cors' mode and send as text to avoid preflight issues from a simple bookmarklet.
                // The backend will need to be ready for this.
                const response = await fetch(`${TARGET_APP_URL}/api/courses/receive-from-portal`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(courses),
                });

                if (!response.ok) {
                    throw new Error(`サーバーエラー: ${response.status} ${response.statusText}`);
                }

                alert('時間割データを正常に転送しました。確認ページに移動します。');
                window.location.href = `${TARGET_APP_URL}/schedule/confirm`;

            } catch (error) {
                console.error('HUS-scheduler Importer Error:', error);
                alert(`エラーが発生しました: ${error.message}`);
                document.body.removeChild(overlay);
            }
        };
    }

    main();
})();
