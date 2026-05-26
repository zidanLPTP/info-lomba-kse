/**
 * KSEUnriPedia - Interactive Tutorial Guide
 * Animated hand showing workflow: Search → Admin → Type → Parse → Submit
 */

class InteractiveTutorialGuide {
    constructor() {
        this.currentStep = 0;
        this.isPlaying = false;
        this.tutorialOverlay = null;
        this.animatedHand = null;
        this.autoPlayTimer = null;
        this.isSkipped = false;
        this.randomSentences = [
            "Kompetisi Cerdas Cermat se-Indonesia 2024 - Pendaftaran terbuka hingga 15 Juni",
            "Beasiswa Penuh S2 Luar Negeri dari Kementerian Pendidikan",
            "Magang di Google - Aplikasi dibuka setiap Januari",
            "Lomba Inovasi Sosial dengan hadiah total Rp 500 juta",
            "Seminar Leadership gratis untuk semua mahasiswa KSE"
        ];

        this.init();
    }

    init() {
        // Try both DOMContentLoaded and immediate check
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupTutorial());
        } else {
            this.setupTutorial();
        }
    }

    setupTutorial() {
        // Check if tutorial should show (localStorage)
        const tutorialShown = localStorage.getItem('tutorialGuide_shown');
        const currentPage = this.getCurrentPage();

        if (!tutorialShown && currentPage === 'home') {
            // Show tutorial button
            this.addTutorialButton();
        }

        // Also add manual tutorial trigger
        this.setupManualTrigger();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('admin')) return 'admin';
        if (path === '/' || path.includes('index')) return 'home';
        return 'other';
    }

    addTutorialButton() {
        // Add tutorial button to homepage
        const headerElement = document.querySelector('.header-content');
        if (headerElement) {
            const tutorialBtn = document.createElement('button');
            tutorialBtn.className = 'btn btn-tutorial-start';
            tutorialBtn.innerHTML = '<i class="fas fa-graduation-cap"></i> Pelajari Admin Panel';
            tutorialBtn.addEventListener('click', () => this.startTutorial());

            // Add CSS for button
            this.injectTutorialStyles();

            // Add button after header
            headerElement.appendChild(tutorialBtn);
        }
    }

    setupManualTrigger() {
        // Allow manual trigger via Ctrl+Shift+T
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.code === 'KeyT') {
                e.preventDefault();
                this.startTutorial();
            }
        });
    }

    startTutorial() {
        this.isSkipped = false;
        this.currentStep = 0;
        this.isPlaying = true;

        // Create overlay
        this.createTutorialOverlay();

        // Start steps
        this.runStep(0);
    }

    createTutorialOverlay() {
        // Inject CSS
        this.injectTutorialStyles();

        // Create overlay container
        this.tutorialOverlay = document.createElement('div');
        this.tutorialOverlay.className = 'tutorial-overlay';
        this.tutorialOverlay.innerHTML = `
            <div class="tutorial-content">
                <div class="tutorial-header">
                    <h3 id="tutorialTitle">Belajar Admin Panel</h3>
                    <button class="tutorial-close" id="tutorialCloseBtn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="tutorial-body" id="tutorialBody">
                    <p id="tutorialTextContent"></p>
                </div>
                <div class="tutorial-footer">
                    <div class="tutorial-progress">
                        <div class="progress-bar" id="tutorialProgressBar"></div>
                    </div>
                    <div class="tutorial-buttons">
                        <button class="btn btn-sm btn-secondary" id="tutorialPrevBtn">← Sebelumnya</button>
                        <button class="btn btn-sm btn-primary" id="tutorialNextBtn">Lanjut →</button>
                        <button class="btn btn-sm btn-warning" id="tutorialSkipBtn">Skip</button>
                    </div>
                </div>
            </div>
            <canvas id="tutorialCanvas"></canvas>
        `;

        document.body.appendChild(this.tutorialOverlay);

        // Setup event listeners
        document.getElementById('tutorialCloseBtn').addEventListener('click', () => this.closeTutorial());
        document.getElementById('tutorialNextBtn').addEventListener('click', () => this.nextStep());
        document.getElementById('tutorialPrevBtn').addEventListener('click', () => this.previousStep());
        document.getElementById('tutorialSkipBtn').addEventListener('click', () => this.skipTutorial());

        // Setup canvas for hand animation
        this.setupCanvas();
    }

    setupCanvas() {
        const canvas = document.getElementById('tutorialCanvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Handle resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    runStep(stepIndex) {
        const steps = [
            {
                title: '🔍 Langkah 1: Buka Admin Panel',
                text: 'Untuk menambah data baru, buka URL: https://kseunripedia.my.id/admin',
                action: () => this.animateSearchBar(),
                duration: 4000
            },
            {
                title: '✏️ Langkah 2: Isi Data Raw',
                text: 'Di admin panel, paste informasi lengkap tentang lomba/beasiswa/karir di textarea',
                action: () => this.animateTextInput(),
                duration: 5000
            },
            {
                title: '⚙️ Langkah 3: Proses Data',
                text: 'Klik tombol "Parsing Otomatis & Ekstrak Data" untuk menganalisis informasi',
                action: () => this.animateProcessButton(),
                duration: 3000
            },
            {
                title: '📤 Langkah 4: Kirim Ke Database',
                text: 'Klik "Kirim" untuk mengirim data ke database Google Sheets',
                action: () => this.animateSendButton(),
                duration: 3000
            },
            {
                title: '✅ Selesai!',
                text: 'Data sudah masuk ke database dan akan muncul di homepage secara otomatis',
                action: () => this.animateSuccess(),
                duration: 3000
            }
        ];

        const currentStep = steps[stepIndex];
        if (!currentStep) return;

        // Update title and text
        document.getElementById('tutorialTitle').innerHTML = currentStep.title;
        document.getElementById('tutorialTextContent').innerHTML = currentStep.text;

        // Update progress bar
        const progress = ((stepIndex + 1) / steps.length) * 100;
        document.getElementById('tutorialProgressBar').style.width = progress + '%';

        // Update buttons
        document.getElementById('tutorialPrevBtn').disabled = stepIndex === 0;
        document.getElementById('tutorialNextBtn').textContent = stepIndex === steps.length - 1 ? 'Selesai' : 'Lanjut →';

        // Run animation
        if (currentStep.action && !this.isSkipped) {
            currentStep.action();
        }

        this.currentStep = stepIndex;
    }

    animateSearchBar() {
        const canvas = document.getElementById('tutorialCanvas');
        const ctx = canvas.getContext('2d');
        const searchBox = document.querySelector('.search-box');

        if (searchBox) {
            const rect = searchBox.getBoundingClientRect();
            this.drawHandPointing(ctx, rect.left + rect.width / 2, rect.top - 50);

            // Animate typing URL
            let urlText = 'https://kseunripedia.my.id/admin';
            let currentText = '';
            let charIndex = 0;

            const typeInterval = setInterval(() => {
                if (charIndex < urlText.length && !this.isSkipped) {
                    currentText += urlText[charIndex];
                    charIndex++;

                    // Draw hand typing animation
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    this.drawHandTyping(ctx, rect.left + rect.width / 2, rect.top - 30);

                    // Show text in search box (visual only)
                    const inputEl = searchBox.querySelector('input');
                    if (inputEl) inputEl.placeholder = currentText;
                } else {
                    clearInterval(typeInterval);
                }
            }, 100);
        }
    }

    animateTextInput() {
        const canvas = document.getElementById('tutorialCanvas');
        const ctx = canvas.getContext('2d');
        const textarea = document.getElementById('rawTextArea');

        if (textarea) {
            const rect = textarea.getBoundingClientRect();
            this.drawHandPointing(ctx, rect.left + 20, rect.top - 50);

            // Animate typing with random sentences
            let fullText = '';
            let sentenceIndex = 0;
            let charIndexInSentence = 0;

            const typeInterval = setInterval(() => {
                if (sentenceIndex < 3 && !this.isSkipped) {
                    const currentSentence = this.randomSentences[Math.floor(Math.random() * this.randomSentences.length)];

                    if (charIndexInSentence < currentSentence.length) {
                        fullText += currentSentence[charIndexInSentence];
                        charIndexInSentence++;

                        // Draw typing animation
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        this.drawHandTyping(ctx, rect.left + 20, rect.top - 30);

                        textarea.value = fullText;
                        textarea.style.minHeight = 'auto';
                        textarea.style.minHeight = (textarea.scrollHeight) + 'px';
                    } else {
                        // Move to next sentence
                        fullText += '\n\n';
                        charIndexInSentence = 0;
                        sentenceIndex++;
                    }
                } else {
                    clearInterval(typeInterval);
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }, 50);
        }
    }

    animateProcessButton() {
        const canvas = document.getElementById('tutorialCanvas');
        const ctx = canvas.getContext('2d');
        const btn = document.getElementById('btnEksekusi');

        if (btn) {
            const rect = btn.getBoundingClientRect();

            // Draw hand pointing to button
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    this.drawHandPointing(ctx, rect.left + rect.width / 2, rect.top - 30);

                    // Highlight button
                    ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
                    ctx.lineWidth = 3;
                    ctx.shadowColor = 'rgba(251, 191, 36, 0.5)';
                    ctx.shadowBlur = 15;
                    ctx.strokeRect(rect.left - 5, rect.top - 5, rect.width + 10, rect.height + 10);
                }, i * 800);
            }

            // Draw click animation
            setTimeout(() => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                this.drawHandClicking(ctx, rect.left + rect.width / 2, rect.top + rect.height / 2);
            }, 2400);
        }
    }

    animateSendButton() {
        const canvas = document.getElementById('tutorialCanvas');
        const ctx = canvas.getContext('2d');
        const btn = document.getElementById('btnKirim');

        if (btn) {
            const rect = btn.getBoundingClientRect();

            // Draw hand pointing
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.drawHandPointing(ctx, rect.left + rect.width / 2, rect.top - 30);

            // Highlight and click
            setTimeout(() => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
                ctx.lineWidth = 3;
                ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
                ctx.shadowBlur = 15;
                ctx.strokeRect(rect.left - 5, rect.top - 5, rect.width + 10, rect.height + 10);

                setTimeout(() => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    this.drawHandClicking(ctx, rect.left + rect.width / 2, rect.top + rect.height / 2);
                }, 800);
            }, 500);
        }
    }

    animateSuccess() {
        const canvas = document.getElementById('tutorialCanvas');
        const ctx = canvas.getContext('2d');

        // Draw success animation - checkmark and confetti effect
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Draw large checkmark
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Simple checkmark
        ctx.beginPath();
        ctx.moveTo(centerX - 40, centerY);
        ctx.lineTo(centerX - 10, centerY + 30);
        ctx.lineTo(centerX + 60, centerY - 40);
        ctx.stroke();

        // Draw confetti particles
        for (let i = 0; i < 20; i++) {
            const x = centerX + (Math.random() - 0.5) * 200;
            const y = centerY + (Math.random() - 0.5) * 200;
            const size = Math.random() * 8 + 4;

            ctx.fillStyle = ['#fbbf24', '#10b981', '#3b82f6', '#f87171'][Math.floor(Math.random() * 4)];
            ctx.fillRect(x, y, size, size);
        }
    }

    drawHandPointing(ctx, x, y) {
        // Draw hand pointer (palm + pointing finger)
        ctx.save();
        ctx.fillStyle = '#fde047';
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;

        // Palm (circle)
        ctx.beginPath();
        ctx.arc(x, y + 20, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pointing finger
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 5);
        ctx.lineTo(x + 15, y - 30);
        ctx.stroke();

        // Finger tip
        ctx.fillStyle = '#92400e';
        ctx.beginPath();
        ctx.arc(x + 15, y - 30, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawHandTyping(ctx, x, y) {
        // Similar to pointing but fingers bent
        ctx.save();
        ctx.fillStyle = '#fde047';
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;

        // Palm
        ctx.beginPath();
        ctx.arc(x, y + 15, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Bent fingers (typing position)
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2.5;

        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * 8, y - 5);
            ctx.quadraticCurveTo(x + i * 10, y - 15, x + i * 8, y - 20);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawHandClicking(ctx, x, y) {
        // Hand in clicking position
        ctx.save();
        ctx.fillStyle = '#fde047';
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;

        // Palm
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Clicking finger (down position)
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x + 5, y - 8);
        ctx.lineTo(x + 8, y + 15);
        ctx.stroke();

        ctx.restore();

        // Draw click ripple effect
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.6)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(x + 8, y + 10, 15 + i * 10, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    injectTutorialStyles() {
        if (document.getElementById('tutorialStyles')) return;

        const style = document.createElement('style');
        style.id = 'tutorialStyles';
        style.textContent = `
            .btn-tutorial-start {
                background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
                color: #78350f;
                border: none;
                padding: 12px 24px;
                border-radius: 12px;
                font-weight: 700;
                font-size: 1rem;
                transition: all 0.3s ease;
                margin-top: 1.5rem;
                box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
            }

            .btn-tutorial-start:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 25px rgba(245, 158, 11, 0.5);
                background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
            }

            .tutorial-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeInOverlay 0.3s ease;
            }

            @keyframes fadeInOverlay {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .tutorial-content {
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                width: 90%;
                max-width: 600px;
                z-index: 10001;
                animation: slideInCard 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            @keyframes slideInCard {
                from {
                    opacity: 0;
                    transform: translateY(30px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            .tutorial-header {
                background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                color: white;
                padding: 1.5rem;
                border-radius: 20px 20px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .tutorial-header h3 {
                margin: 0;
                font-size: 1.3rem;
                font-weight: 700;
            }

            .tutorial-close {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 1rem;
                transition: all 0.2s;
            }

            .tutorial-close:hover {
                background: rgba(255, 255, 255, 0.4);
                transform: scale(1.1);
            }

            .tutorial-body {
                padding: 2rem;
                min-height: 100px;
                font-size: 1.05rem;
                line-height: 1.6;
                color: #1e293b;
            }

            .tutorial-footer {
                border-top: 1px solid #f1f5f9;
                padding: 1.5rem;
                background: #f8fafc;
                border-radius: 0 0 20px 20px;
            }

            .tutorial-progress {
                width: 100%;
                height: 4px;
                background: #e2e8f0;
                border-radius: 2px;
                margin-bottom: 1rem;
                overflow: hidden;
            }

            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
                width: 0%;
                transition: width 0.3s ease;
            }

            .tutorial-buttons {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }

            .tutorial-buttons .btn {
                padding: 8px 16px;
                font-weight: 600;
                border-radius: 8px;
                transition: all 0.2s;
            }

            .tutorial-buttons .btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            #tutorialCanvas {
                position: fixed;
                top: 0;
                left: 0;
                pointer-events: none;
                z-index: 9999;
            }

            @media (max-width: 768px) {
                .tutorial-content {
                    max-width: 95%;
                }

                .tutorial-body {
                    padding: 1.5rem;
                    font-size: 0.95rem;
                }

                .btn-tutorial-start {
                    width: 100%;
                }
            }
        `;

        document.head.appendChild(style);
    }

    nextStep() {
        if (this.currentStep < 4) {
            this.runStep(this.currentStep + 1);
        } else {
            this.completeTutorial();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.runStep(this.currentStep - 1);
        }
    }

    skipTutorial() {
        this.isSkipped = true;
        const canvas = document.getElementById('tutorialCanvas');
        if (canvas) {
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        }
        this.nextStep();
    }

    completeTutorial() {
        localStorage.setItem('tutorialGuide_shown', 'true');
        this.closeTutorial();

        // Show success message
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: #10b981;
            color: white;
            padding: 1.5rem 2rem;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            animation: slideInToast 0.3s ease;
            max-width: 400px;
        `;
        toast.innerHTML = '<i class="fas fa-check-circle me-2"></i> Tutorial selesai! Silakan coba admin panel.';
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutToast 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    closeTutorial() {
        this.isSkipped = true;
        this.isPlaying = false;
        if (this.tutorialOverlay) {
            this.tutorialOverlay.style.animation = 'fadeOutOverlay 0.3s ease';
            setTimeout(() => this.tutorialOverlay.remove(), 300);
        }

        const canvas = document.getElementById('tutorialCanvas');
        if (canvas) {
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        }
    }
}

// Initialize tutorial on page load
const tutorialGuide = new InteractiveTutorialGuide();
