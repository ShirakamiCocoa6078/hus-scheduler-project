
javascript:(function() {
    console.clear();
    console.log("HUS-scheduler: UNIPA Importer script started.");

    function parseCourses() {
        const scheduleContainer = document.querySelector('div.rishu-koma-list-page-body-sp, div.rishu-koma-list-page-body');
        if (!scheduleContainer) {
            console.error("Importer Error: Could not find the main schedule container. The page structure might have changed.");
            alert("時間割コンテナが見つかりませんでした。ページの構造が変更された可能性があります。「履修授業」タブで実行しているか確認してください。");
            return null;
        }
        console.log("Found schedule container:", scheduleContainer);

        const courseElements = scheduleContainer.querySelectorAll('.lessonArea');
        if (courseElements.length === 0) {
            console.error("Importer Error: No '.lessonArea' elements found inside the container.");
            alert("時間割データが見つかりませんでした。「履修授業」タブで実行しているか確認してください。");
            return null;
        }
        console.log(`Found ${courseElements.length} course elements.`);

        const dayMap = { '月': 1, '火': 2, '水': 3, '木': 4, '金': 5, '土': 6, '日': 0 };
        const courses = [];

        courseElements.forEach((element, index) => {
            const courseNameElement = element.querySelector('.lessonTitle');
            const dayPeriodElement = element.querySelector('.period');
            const locationElement = element.querySelector('.lessonDetail > div:not(:has(a))');

            if (!courseNameElement || !dayPeriodElement) {
                console.warn(`Skipping element at index ${index} due to missing course name or period.`);
                return;
            }

            const courseName = courseNameElement.innerText.trim();
            const dayPeriodText = dayPeriodElement.innerText.trim();
            const location = locationElement ? locationElement.innerText.trim() : '';
            
            const match = dayPeriodText.match(/([月火水木金土日])\s*(\d)/);
            if (!match) {
                console.warn(`Skipping course "${courseName}" due to invalid day/period format: "${dayPeriodText}"`);
                return;
            }

            const dayChar = match[1];
            const period = parseInt(match[2], 10);
            const dayOfWeek = dayMap[dayChar];

            if (dayOfWeek !== undefined) {
                courses.push({ courseName, dayOfWeek, period, location });
            } else {
                 console.warn(`Skipping course "${courseName}" due to unknown day character: "${dayChar}"`);
            }
        });

        console.log("Final parsed courses:", courses);
        return courses;
    }

    function showConfirmation(courses) {
        if (!courses || courses.length === 0) {
            alert("インポートできる授業がありませんでした。");
            return;
        }

        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.6)';
        overlay.style.zIndex = '9998';
        document.body.appendChild(overlay);

        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.backgroundColor = '#fff';
        modal.style.padding = '25px';
        modal.style.borderRadius = '8px';
        modal.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
        modal.style.zIndex = '9999';
        modal.style.fontFamily = '"Helvetica Neue", Arial, sans-serif';
        modal.style.textAlign = 'center';
        
        modal.innerHTML = `
            <h3 style="margin-top:0; margin-bottom:15px; font-size:18px; color:#333;">時間割のインポート</h3>
            <p style="margin-bottom:20px; font-size:14px; color:#555;">${courses.length}件の授業情報をHUS-schedulerにインポートしますか？</p>
            <button id="hus-import-confirm" style="background-color:#007bff; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; margin-right:10px;">はい</button>
            <button id="hus-import-cancel" style="background-color:#6c757d; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer;">いいえ</button>
        `;

        document.body.appendChild(modal);

        document.getElementById('hus-import-confirm').onclick = function() {
            const jsonString = JSON.stringify(courses);
            const encodedData = btoa(encodeURIComponent(jsonString));
            const targetUrl = `https://hus-scheduler-project.vercel.app/schedule/manage?data=${encodedData}`;
            window.open(targetUrl, '_blank');
            closeModal();
        };

        document.getElementById('hus-import-cancel').onclick = closeModal;
        overlay.onclick = closeModal;

        function closeModal() {
            document.body.removeChild(modal);
            document.body.removeChild(overlay);
        }
    }

    const parsedCourses = parseCourses();
    showConfirmation(parsedCourses);

})();
