
(function() {
    'use strict';

    // Helper function to remove the modal
    function closeModal() {
        const overlay = document.getElementById('hus-scheduler-overlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
    }

    // Check if the modal already exists
    if (document.getElementById('hus-scheduler-overlay')) {
        return;
    }

    // --- Modal UI Creation ---
    const overlay = document.createElement('div');
    overlay.id = 'hus-scheduler-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '10000';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';

    const modal = document.createElement('div');
    modal.style.background = '#fff';
    modal.style.padding = '30px';
    modal.style.borderRadius = '8px';
    modal.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    modal.style.width = '90%';
    modal.style.maxWidth = '500px';
    modal.style.fontFamily = '"Helvetica Neue", Arial, sans-serif';

    modal.innerHTML = `
        <h2 style="margin-top:0; margin-bottom: 20px; font-size: 20px; color: #333; font-weight: 600;">時間割情報をHUS-schedulerに転送しますか？</h2>
        <p style="margin-bottom: 25px; font-size: 14px; line-height: 1.5; color: #666;">現在のページから時間割情報を抽出し、HUS-schedulerに安全に転送します。この操作はあなたの時間割データをHUS-schedulerサーバーに一時的に保存します。</p>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button id="hus-scheduler-cancel" style="padding: 10px 20px; border: 1px solid #ccc; border-radius: 5px; background: #fff; cursor: pointer; font-size: 14px;">いいえ</button>
            <button id="hus-scheduler-confirm" style="padding: 10px 20px; border: none; border-radius: 5px; background: #337ab7; color: #fff; cursor: pointer; font-size: 14px; font-weight: bold;">はい、転送する</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('hus-scheduler-cancel').addEventListener('click', closeModal);

    document.getElementById('hus-scheduler-confirm').addEventListener('click', function() {
        console.clear();
        console.log("HUS-scheduler Bookmarklet: Starting UNIPA timetable import.");

        const confirmButton = document.getElementById('hus-scheduler-confirm');
        confirmButton.innerText = '転送中...';
        confirmButton.disabled = true;

        try {
            // 1. Find the main container for the timetable.
            // The ':' in the ID needs to be escaped with '\\:' for querySelector.
            const scheduleContainer = document.querySelector('#funcForm\\:j_idt387\\:j_idt3700');
            if (!scheduleContainer) {
                console.error("Error: Timetable container (#funcForm\\:j_idt387\\:j_idt3700) not found.");
                alert("時間割コンテナが見つかりませんでした。UNIPAページの構造が変更された可能性があります。");
                closeModal();
                return;
            }
            console.log("Success: Found timetable container.", scheduleContainer);

            // 2. Select all individual course blocks.
            const courseElements = scheduleContainer.querySelectorAll('.ui-datalist-item .lessonArea');
            if (courseElements.length === 0) {
                console.error("Error: No individual course blocks (.lessonArea) found.");
                alert("抽出可能な授業データがありません。「履修授業」タブが選択されているか確認してください。");
                closeModal();
                return;
            }
            console.log(`Success: Found ${courseElements.length} course blocks.`);

            const dayMap = { '月': 1, '火': 2, '水': 3, '木': 4, '金': 5, '土': 6, '日': 0 };
            const courses = [];

            // 3. Loop through each course block to extract information.
            courseElements.forEach((element, index) => {
                console.log(`\n--- Processing course #${index + 1} ---`);

                const dayPeriodElement = element.querySelector('.period');
                const courseNameElement = element.querySelector('.lessonTitle');
                const locationElement = element.querySelector('.lessonDetail div');

                // Log the existence and content of each element
                console.log("Day/Period element:", dayPeriodElement ? dayPeriodElement.innerText.trim() : "Not found");
                console.log("Course name element:", courseNameElement ? courseNameElement.innerText.trim() : "Not found");
                console.log("Location element:", locationElement ? locationElement.innerText.trim() : "Not found");

                const dayPeriodText = dayPeriodElement?.innerText.trim();
                const courseNameText = courseNameElement?.innerText.trim() || '名称不明';
                const locationText = locationElement?.innerText.trim() || '';

                if (dayPeriodText) {
                    const parts = dayPeriodText.split(/\s+/); // "月 1" -> ["月", "1"]
                    if (parts.length >= 2) {
                        const dayChar = parts[0];
                        const periodStr = parts[1].replace('時限', '');
                        
                        const dayOfWeek = dayMap[dayChar];
                        const period = parseInt(periodStr, 10);

                        if (dayOfWeek !== undefined && !isNaN(period)) {
                            courses.push({
                                courseName: courseNameText,
                                dayOfWeek: dayOfWeek,
                                period: period,
                                location: locationText
                            });
                             console.log(` -> Success: { courseName: "${courseNameText}", dayOfWeek: ${dayOfWeek}, period: ${period}, location: "${locationText}" }`);
                        } else {
                            console.warn(` -> Parse Fail: Could not parse day or period. Text: "${dayPeriodText}"`);
                        }
                    } else {
                         console.warn(` -> Parse Fail: Unexpected day/period format. Text: "${dayPeriodText}"`);
                    }
                } else {
                     console.warn(` -> Parse Fail: Day/Period element not found.`);
                }
            });

            console.log("\n--- Final Parsing Result ---");
            console.table(courses);

            if (courses.length === 0) {
                 alert("時間割情報の抽出に失敗しました。開発者コンソールで詳細を確認してください。");
                 closeModal();
                 return;
            }
            
            // 4. Send data to the server.
            const targetDomain = 'https://hus-scheduler-project.vercel.app';
            const apiEndpoint = `${targetDomain}/api/courses/receive-from-portal`;
            
            console.log(`Sending data to endpoint: ${apiEndpoint}`);

            fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courses)
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || `Server Error: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('Success response from server:', data);
                alert('時間割データが正常に転送されました。確認ページに移動します。');
                window.location.href = `${targetDomain}/schedule/confirm`;
            })
            .catch(error => {
                console.error('Error during data transfer:', error);
                alert(`データ転送エラー: ${error.message}`);
            })
            .finally(() => {
                closeModal();
            });

        } catch(e) {
            console.error("A critical error occurred during script execution:", e);
            alert("スクリプト実行中にエラーが発生しました。開発者コンソールを確認してください。");
            closeModal();
        }
    });
})();
