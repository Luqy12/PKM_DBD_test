// quiz.js - Interactive Quiz Logic
(function () {
    'use strict';

    const QUESTIONS = [
        {
            question: "Apa kepanjangan dari DBD?",
            answers: [
                { text: "Demam Berdarah Dengue", correct: true },
                { text: "Demam Berdarah Daerah", correct: false },
                { text: "Demam Berat Dengue", correct: false },
                { text: "Demam Berulang Dengue", correct: false }
            ]
        },
        {
            question: "Nyamuk apa yang menyebarkan virus dengue penyebab DBD?",
            answers: [
                { text: "Aedes aegypti", correct: true },
                { text: "Anopheles", correct: false },
                { text: "Culex", correct: false },
                { text: "Mansonia", correct: false }
            ]
        },
        {
            question: "Apa arti '3M Plus' dalam pencegahan DBD?",
            answers: [
                { text: "Menguras, Menutup, Mendaur ulang, Plus pencegahan tambahan", correct: true },
                { text: "Membersihkan, Mengepel, Mencuci, Plus vitamin", correct: false },
                { text: "Menyapu, Mengepel, Menguras, Plus fogging", correct: false },
                { text: "Menjaga, Memantau, Melaporkan, Plus obat", correct: false }
            ]
        },
        {
            question: "Berapa lama siklus hidup nyamuk Aedes aegypti dari telur hingga dewasa?",
            answers: [
                { text: "7-10 hari", correct: true },
                { text: "1-3 hari", correct: false },
                { text: "14-21 hari", correct: false },
                { text: "30 hari", correct: false }
            ]
        },
        {
            question: "Kapan waktu aktif nyamuk Aedes aegypti menggigit?",
            answers: [
                { text: "Pagi (08.00-10.00) dan sore (15.00-17.00)", correct: true },
                { text: "Malam hari saja", correct: false },
                { text: "Siang hari saat panas", correct: false },
                { text: "24 jam tanpa henti", correct: false }
            ]
        },
        {
            question: "Gejala utama DBD yang harus diwaspadai adalah?",
            answers: [
                { text: "Demam tinggi mendadak, nyeri otot, bintik merah", correct: true },
                { text: "Batuk dan pilek", correct: false },
                { text: "Sakit perut dan diare", correct: false },
                { text: "Sakit kepala ringan saja", correct: false }
            ]
        },
        {
            question: "Apa yang dimaksud dengan 'pemantauan jentik' atau jumantik?",
            answers: [
                { text: "Mengecek tempat penampungan air untuk mencari jentik nyamuk", correct: true },
                { text: "Menghitung jumlah nyamuk dewasa", correct: false },
                { text: "Mengukur suhu air", correct: false },
                { text: "Membersihkan saluran air", correct: false }
            ]
        },
        {
            question: "Seberapa sering kita harus menguras tempat penampungan air?",
            answers: [
                { text: "Minimal seminggu sekali", correct: true },
                { text: "Sebulan sekali", correct: false },
                { text: "Hanya saat air kotor", correct: false },
                { text: "Tidak perlu rutin", correct: false }
            ]
        },
        {
            question: "Apa fungsi dari bubuk abate/larvasida?",
            answers: [
                { text: "Membunuh jentik nyamuk di air", correct: true },
                { text: "Membunuh nyamuk dewasa", correct: false },
                { text: "Mengusir nyamuk", correct: false },
                { text: "Memurnikan air", correct: false }
            ]
        },
        {
            question: "Tindakan pencegahan tambahan (Plus) dalam 3M Plus adalah?",
            answers: [
                { text: "Memelihara ikan pemakan jentik, memasang kelambu, menanam pengusir nyamuk", correct: true },
                { text: "Minum vitamin C setiap hari", correct: false },
                { text: "Mandi 3 kali sehari", correct: false },
                { text: "Berjemur di pagi hari", correct: false }
            ]
        }
    ];

    let currentQuestion = 0;
    let score = 0;
    let userAnswers = [];
    let quizHistory = [];

    // Elements
    const startScreen = document.getElementById('startScreen');
    const quizScreen = document.getElementById('quizScreen');
    const resultScreen = document.getElementById('resultScreen');
    const startBtn = document.getElementById('startBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const retakeBtn = document.getElementById('retakeBtn');
    const shareBtn = document.getElementById('shareBtn');
    const progressBar = document.getElementById('progressBar');
    const questionNumber = document.getElementById('questionNumber');
    const questionText = document.getElementById('questionText');
    const answersContainer = document.getElementById('answersContainer');
    const finalScore = document.getElementById('finalScore');
    const resultMessage = document.getElementById('resultMessage');
    const badgeContainer = document.getElementById('badgeContainer');
    const badgeIcon = document.getElementById('badgeIcon');
    const leaderboardList = document.getElementById('leaderboardList');

    // Initialize
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        loadHistory();
        attachEventListeners();
    }

    function attachEventListeners() {
        startBtn?.addEventListener('click', startQuiz);
        prevBtn?.addEventListener('click', previousQuestion);
        nextBtn?.addEventListener('click', nextQuestion);
        retakeBtn?.addEventListener('click', restartQuiz);
        shareBtn?.addEventListener('click', shareResults);
    }

    function loadHistory() {
        try {
            const stored = localStorage.getItem('pkm_dbd_quiz_history');
            quizHistory = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading quiz history:', error);
            quizHistory = [];
        }
    }

    function saveHistory() {
        try {
            localStorage.setItem('pkm_dbd_quiz_history', JSON.stringify(quizHistory));
        } catch (error) {
            console.error('Error saving quiz history:', error);
        }
    }

    function startQuiz() {
        currentQuestion = 0;
        score = 0;
        userAnswers = new Array(QUESTIONS.length).fill(null);

        startScreen.style.display = 'none';
        quizScreen.style.display = 'block';
        resultScreen.style.display = 'none';

        renderQuestion();
    }

    function renderQuestion() {
        const question = QUESTIONS[currentQuestion];

        // Update progress
        const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;
        progressBar.style.width = progress + '%';

        // Update question number
        questionNumber.textContent = `Pertanyaan ${currentQuestion + 1} dari ${QUESTIONS.length}`;

        // Update question text
        questionText.textContent = question.question;

        // Render answers
        answersContainer.innerHTML = question.answers.map((answer, index) => `
      <label class="answer-option ${userAnswers[currentQuestion] === index ? 'selected' : ''}">
        <input type="radio" name="answer" value="${index}" ${userAnswers[currentQuestion] === index ? 'checked' : ''}>
        <span>${answer.text}</span>
      </label>
    `).join('');

        // Add click handlers to options
        answersContainer.querySelectorAll('.answer-option').forEach((option, index) => {
            option.addEventListener('click', () => selectAnswer(index));
        });

        // Update button visibility
        prevBtn.style.visibility = currentQuestion > 0 ? 'visible' : 'hidden';
        nextBtn.textContent = currentQuestion === QUESTIONS.length - 1 ? 'Selesai' : 'Selanjutnya →';
    }

    function selectAnswer(index) {
        userAnswers[currentQuestion] = index;

        // Update UI
        answersContainer.querySelectorAll('.answer-option').forEach((option, i) => {
            option.classList.toggle('selected', i === index);
            option.querySelector('input').checked = i === index;
        });
    }

    function previousQuestion() {
        if (currentQuestion > 0) {
            currentQuestion--;
            renderQuestion();
        }
    }

    function nextQuestion() {
        if (userAnswers[currentQuestion] === null) {
            showToast('⚠️ Pilih jawaban terlebih dahulu');
            return;
        }

        if (currentQuestion < QUESTIONS.length - 1) {
            currentQuestion++;
            renderQuestion();
        } else {
            finishQuiz();
        }
    }

    function finishQuiz() {
        // Calculate score
        score = 0;
        userAnswers.forEach((answerIndex, questionIndex) => {
            if (answerIndex !== null && QUESTIONS[questionIndex].answers[answerIndex].correct) {
                score++;
            }
        });

        // Save to history
        const result = {
            timestamp: Date.now(),
            score: score,
            total: QUESTIONS.length,
            percentage: Math.round((score / QUESTIONS.length) * 100)
        };
        quizHistory.unshift(result);
        quizHistory = quizHistory.slice(0, 10); // Keep only top 10
        saveHistory();

        // Show results
        showResults(result);
    }

    function showResults(result) {
        quizScreen.style.display = 'none';
        resultScreen.style.display = 'block';

        // Display score
        finalScore.textContent = `${result.score}/${result.total}`;

        // Display message based on score
        let message = '';
        let badge = '';

        if (result.percentage === 100) {
            message = '🎉 Sempurna! Anda adalah ahli pencegahan DBD!';
            badge = '🏆';
            badgeContainer.style.display = 'block';
        } else if (result.percentage >= 80) {
            message = '👏 Hebat! Pengetahuan Anda sangat baik!';
            badge = '🥇';
            badgeContainer.style.display = 'block';
        } else if (result.percentage >= 60) {
            message = '👍 Bagus! Terus tingkatkan pengetahuan Anda!';
            badge = '🥈';
            badgeContainer.style.display = 'block';
        } else if (result.percentage >= 40) {
            message = '📚 Cukup baik, tapi masih bisa lebih baik lagi!';
            badgeContainer.style.display = 'none';
        } else {
            message = '💪 Jangan menyerah! Pelajari lagi materi pencegahan DBD.';
            badgeContainer.style.display = 'none';
        }

        resultMessage.textContent = message;
        if (badgeIcon) badgeIcon.textContent = badge;

        // Render leaderboard
        renderLeaderboard();
    }

    function renderLeaderboard() {
        if (!leaderboardList) return;

        const sortedHistory = [...quizHistory].sort((a, b) => b.percentage - a.percentage);

        if (sortedHistory.length === 0) {
            leaderboardList.innerHTML = '<p class="muted" style="text-align: center;">Belum ada riwayat quiz</p>';
            return;
        }

        leaderboardList.innerHTML = sortedHistory.slice(0, 5).map((entry, index) => {
            const date = new Date(entry.timestamp).toLocaleDateString('id-ID');
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

            return `
        <div class="leaderboard-item">
          <div>
            <strong>${medal} ${date}</strong>
            <span style="color: #6c757d; font-size: 0.9rem; margin-left: 0.5rem;">
              ${entry.score}/${entry.total} soal
            </span>
          </div>
          <div style="font-weight: 700; color: ${entry.percentage >= 80 ? '#27AE60' : entry.percentage >= 60 ? '#F39C12' : '#6c757d'};">
            ${entry.percentage}%
          </div>
        </div>
      `;
        }).join('');
    }

    function restartQuiz() {
        startQuiz();
    }

    function shareResults() {
        const percentage = Math.round((score / QUESTIONS.length) * 100);
        const text = `🎯 Saya mendapat nilai ${score}/${QUESTIONS.length} (${percentage}%) di Quiz Pencegahan DBD!\n\n` +
            `Ikuti Quiz di: ${window.location.href}\n\n` +
            `#BersihItuPatriotik #CegahDBD`;

        // Try native share API
        if (navigator.share) {
            navigator.share({
                title: 'Hasil Quiz Pencegahan DBD',
                text: text
            }).catch(err => console.log('Share cancelled:', err));
        } else {
            // Fallback to copy to clipboard
            navigator.clipboard.writeText(text).then(() => {
                showToast('✓ Hasil tersalin ke clipboard!');
            }).catch(() => {
                // Final fallback - show modal with text
                alert(text);
            });
        }
    }

    function showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

})();
