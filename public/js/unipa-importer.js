
(function() {
    console.clear(); // 이전 로그를 지우고 새로 시작
    console.log("HUS-scheduler ブックマークレットのデバッグモードを開始します。");

    const dayOfWeekJpToNum = {
        '月': 1, '火': 2, '水': 3, '木': 4, '金': 5, '土': 6, '日': 0
    };

    // 1. 전체 시간표를 감싸고 있는 컨테이너를 찾습니다.
    const scheduleContainer = document.querySelector('#funcForm\\:j_idt387\\:j_idt3700');
    if (!scheduleContainer) {
        console.error("エラー: 時間割コンテナ(#funcForm\\:j_idt387\\:j_idt3700)が見つかりません。");
        alert("時間割コンテナが見つかりませんでした。UNIPAページの構造が変更された可能性があります。");
        return;
    }
    console.log("成功: 時間割コンテナを発見しました。", scheduleContainer);

    // 2. 개별 강의 블록들을 모두 선택합니다.
    const courseElements = scheduleContainer.querySelectorAll('.ui-datalist-item .lessonArea');
    if (courseElements.length === 0) {
        console.error("エラー: 授業ブロック(.lessonArea)が見つかりませんでした。");
        alert("抽出できる授業データがありません。「履修授業」タブで実行していることを確認してください。");
        return;
    }
    console.log(`成功: ${courseElements.length}件の授業ブロックが見つかりました。`);

    const courses = [];
    // 3. 각 강의 블록을 순회하며 정보를 추출합니다.
    courseElements.forEach((element, index) => {
        console.log(`\n--- ${index + 1}件目の授業を処理中 ---`);

        const dayPeriodElement = element.querySelector('.period');
        const courseNameElement = element.querySelector('.lessonTitle');
        const locationElement = element.querySelector('.lessonDetail div');

        // 각 요소의 존재 여부와 텍스트 내용을 로그로 출력
        console.log("曜日/時限 要素:", dayPeriodElement ? dayPeriodElement.innerText.trim() : "見つかりません");
        console.log("授業名 要素:", courseNameElement ? courseNameElement.innerText.trim() : "見つかりません");
        console.log("教室 要素:", locationElement ? locationElement.innerText.trim() : "見つかりません");

        if (courseNameElement?.innerText.trim()) {
            const dayPeriodText = dayPeriodElement?.innerText.trim() || ' ';
            const [dayStr, periodStr] = dayPeriodText.split(' ');

            const dayOfWeek = dayOfWeekJpToNum[dayStr] ?? -1;
            const period = parseInt(periodStr, 10) || 0;

            courses.push({
                courseName: courseNameElement.innerText.trim(),
                dayOfWeek: dayOfWeek,
                period: period,
                location: locationElement?.innerText.trim() || ''
            });
        } else {
             console.warn(`${index + 1}番目のブロックで授業名が見つからなかったため、スキップします。`);
        }
    });

    // 4. 최종적으로 파싱된 데이터를 콘솔에 테이블 형태로 출력
    console.log("\n--- 最終パース結果 ---");
    console.table(courses);

    // 5. 클립보드 복사 및 알림
    const jsonString = JSON.stringify(courses, null, 2);
    const encodedData = btoa(encodeURIComponent(jsonString));
    const targetUrl = `${window.location.origin}/schedule/manage?data=${encodedData}&tab=import`;
    
    if (confirm(`${courses.length}件の授業情報をインポートしますか？`)) {
        window.open(targetUrl, '_blank');
        alert("新しいタブで時間割の確認ページを開きました。内容を確認して保存してください。");
    }
})();
