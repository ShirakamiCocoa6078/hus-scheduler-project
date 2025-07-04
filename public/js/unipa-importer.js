javascript:(function() {
    console.log("HUS-scheduler 북마크릿을 시작합니다.");

    const dayMap = {
        "月": 1, "火": 2, "水": 3, "木": 4, "金": 5, "土": 6, "日": 0,
        "月曜": 1, "火曜": 2, "水曜": 3, "木曜": 4, "金曜": 5, "土曜": 6, "日曜": 0
    };

    function getCourseElements() {
        const standardSelector = '#funcForm\\:j_idt387\\:j_idt3700 .lessonArea';
        let elements = document.querySelectorAll(standardSelector);
        if (elements.length > 0) {
            console.log(`성공: 표준 선택자 '${standardSelector}'로 ${elements.length}개의 강의를 찾았습니다.`);
            return elements;
        }
        console.warn(`경고: 표준 선택자 '${standardSelector}'로 강의를 찾지 못했습니다. 대체 선택자를 시도합니다.`);
        
        const alternativeSelector = '.lessonArea';
        elements = document.querySelectorAll(alternativeSelector);
        if (elements.length > 0) {
            console.log(`성공: 대체 선택자 '${alternativeSelector}'로 ${elements.length}개의 강의를 찾았습니다.`);
        } else {
            console.error("오류: 어떤 선택자로도 강의 블록(.lessonArea)을 찾을 수 없었습니다.");
        }
        return elements;
    }
    
    const courseElements = getCourseElements();

    if (courseElements.length === 0) {
        alert("시간표 데이터를 찾을 수 없습니다. HUS-UNIPA의 '履修授業' 탭에서 실행했는지 확인해주세요.");
        return;
    }

    const courses = [];
    courseElements.forEach((element, index) => {
        const courseNameElement = element.querySelector('.lessonTitle');
        const courseName = courseNameElement?.innerText.trim();

        if (!courseName) {
            console.warn(`${index + 1}번째 항목은 강의명이 없어 건너뜁니다.`);
            return;
        }

        const dayPeriodElement = element.querySelector('.period');
        const dayPeriodText = dayPeriodElement?.innerText.trim() || '';
        const [dayStr, periodStr] = dayPeriodText.split(/\s+/);
        
        const dayOfWeek = dayMap[dayStr] ?? -1;
        const period = parseInt(periodStr, 10) || -1;
        
        const locationElement = element.querySelector('.lessonDetail div');
        const location = locationElement?.innerText.trim() || '';

        if (dayOfWeek !== -1 && period !== -1) {
            courses.push({
                courseName,
                dayOfWeek,
                period,
                location
            });
        }
    });

    if (courses.length === 0) {
        alert("유효한 강의 정보를 추출하지 못했습니다.");
        return;
    }

    const jsonString = JSON.stringify(courses);
    const encodedData = btoa(encodeURIComponent(jsonString));
    const targetUrl = `https://hus-scheduler-project.vercel.app/schedule/import?data=${encodedData}`;

    if (confirm(`${courses.length}件の授業情報をHUS-schedulerにインポートしますか？\n(新しいタブで開きます)`)) {
        window.open(targetUrl, '_blank');
    }
})();
