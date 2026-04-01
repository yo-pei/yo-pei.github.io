const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;

let isWorkMode = true;
let isRunning = false;
let timeLeft = WORK_MINUTES * 60;
let timerId = null;
let sessions = 0;
let isSoundEnabled = true;

// DOM要素の取得
const timeLeftDisplay = document.getElementById('time-left');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const workTab = document.getElementById('work-tab');
const breakTab = document.getElementById('break-tab');
const sessionCountDisplay = document.getElementById('session-count');
const soundToggleBtn = document.getElementById('sound-toggle-btn');
const soundOnIcon = document.getElementById('sound-on-icon');
const soundOffIcon = document.getElementById('sound-off-icon');
const minusBtn = document.getElementById('minus-btn');
const plusBtn = document.getElementById('plus-btn');

// アラーム音の生成関数（Web Audio API）外部ファイルに依存せず確実に鳴らす
function playBeep() {
    if (!isSoundEnabled) return;
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        function beep(time, duration) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine'; // ピピピという音色
            osc.frequency.setValueAtTime(880, audioCtx.currentTime + time);
            gain.gain.setValueAtTime(0.5, audioCtx.currentTime + time); // 音量
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + time + duration);
            
            osc.start(audioCtx.currentTime + time);
            osc.stop(audioCtx.currentTime + time + duration);
        }
        
        // 4連続のビープ音
        beep(0, 0.15);
        beep(0.2, 0.15);
        beep(0.4, 0.15);
        beep(0.6, 0.4);
    } catch (err) {
        console.warn('オーディオ再生エラー:', err);
    }
}

// デスクトップ通知（バナー）を表示する関数
function showNotification() {
    if ("Notification" in window && Notification.permission === "granted") {
        const title = isWorkMode ? "お疲れ様でした！休憩時間です☕️" : "作業時間です！集中しましょう💻";
        const message = isWorkMode ? "25分間の作業が完了しました。5分間リフレッシュしてください。" : "休憩が終わりました。次のセッションを始めましょう！";
        
        new Notification(title, {
            body: message,
            requireInteraction: true // ユーザーがクリックして閉じるまで保持（対応ブラウザのみ）
        });
    }
}

// 表示の更新
function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    timeLeftDisplay.textContent = timeStr;
    document.title = `${timeStr} - ${isWorkMode ? '作業' : '休憩'} (ポモドーロ)`;
}

// モードの切り替え
function setMode(workMode) {
    if (isRunning) pauseTimer();
    
    isWorkMode = workMode;
    timeLeft = (isWorkMode ? WORK_MINUTES : BREAK_MINUTES) * 60;
    
    if (isWorkMode) {
        workTab.classList.add('active');
        breakTab.classList.remove('active');
        document.body.classList.remove('break-mode');
    } else {
        breakTab.classList.add('active');
        workTab.classList.remove('active');
        document.body.classList.add('break-mode');
    }
    
    updateDisplay();
}

// タイマー開始
function startTimer() {
    if (isRunning) return;
    
    // 通知権限の要求（ユーザーのアクションにより許可ダイアログを出す）
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
    
    isRunning = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    
    timerId = setInterval(() => {
        timeLeft--;
        updateDisplay();
        
        if (timeLeft <= 0) {
            handleTimerComplete();
        }
    }, 1000);
}

// タイマー一時停止
function pauseTimer() {
    if (!isRunning) return;
    
    isRunning = false;
    clearInterval(timerId);
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

// タイマーリセット
function resetTimer() {
    pauseTimer();
    timeLeft = (isWorkMode ? WORK_MINUTES : BREAK_MINUTES) * 60;
    updateDisplay();
}

// 完了時の処理
function handleTimerComplete() {
    pauseTimer();
    
    // 通知音とバナーの実行
    playBeep();
    showNotification();

    if (isWorkMode) {
        sessions++;
        sessionCountDisplay.textContent = sessions;
        setMode(false); // 休憩に切り替え
    } else {
        setMode(true); // 作業に切り替え
    }
}

// イベントリスナーの登録
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

workTab.addEventListener('click', () => {
    if (!isWorkMode) setMode(true);
});

breakTab.addEventListener('click', () => {
    if (isWorkMode) setMode(false);
});

soundToggleBtn.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    if (isSoundEnabled) {
        soundOnIcon.style.display = 'block';
        soundOffIcon.style.display = 'none';
        soundToggleBtn.style.color = 'var(--text-secondary)';
    } else {
        soundOnIcon.style.display = 'none';
        soundOffIcon.style.display = 'block';
        soundToggleBtn.style.color = '#ff5e5e'; // ミュート時に強調
    }
});

soundToggleBtn.addEventListener('mouseenter', () => {
    if (isSoundEnabled) soundToggleBtn.style.color = 'var(--text-primary)';
});

soundToggleBtn.addEventListener('mouseleave', () => {
    if (isSoundEnabled) soundToggleBtn.style.color = 'var(--text-secondary)';
});

// 時間の調整（実行中でも可能）
function adjustTime(seconds) {
    timeLeft += seconds;
    if (timeLeft < 0) {
        timeLeft = 0;
    }
    updateDisplay();
}

minusBtn.addEventListener('click', () => adjustTime(-60));
plusBtn.addEventListener('click', () => adjustTime(60));

// 初期化
updateDisplay();
