/**
 * KSEUnriPedia - Admin Popup Notification System
 * Smart popup yang muncul di homepage untuk promote admin panel
 */

class AdminPopupManager {
    constructor() {
        this.isShown = false;
        this.popupElement = null;
        this.init();
    }

    init() {
        // Create popup on page load
        document.addEventListener('DOMContentLoaded', () => {
            this.createPopup();

            // Check if user should see popup
            const shouldShowPopup = this.shouldShowPopup();
            if (shouldShowPopup) {
                // Small delay untuk user sudah fokus ke page
                setTimeout(() => {
                    this.showPopup();
                }, 800);
            }
        });
    }

    /**
     * Check if popup should be shown (localStorage check)
     */
    shouldShowPopup() {
        // Don't show if user already closed in last 24 hours
        const lastClosedTime = localStorage.getItem('adminPopup_lastClosed');
        if (lastClosedTime) {
            const hoursSinceClosed = (Date.now() - parseInt(lastClosedTime)) / (1000 * 60 * 60);
            if (hoursSinceClosed < 24) {
                return false;
            }
        }
        return true;
    }

    /**
     * Create popup element
     */
    createPopup() {
        const popupHTML = `
            <div id="adminPopupOverlay" class="admin-popup-overlay" style="display: none;">
                <div class="admin-popup-container">
                    <!-- Close button -->
                    <button class="admin-popup-close" onclick="adminPopup.closePopup()" title="Tutup">
                        <i class="fas fa-times"></i>
                    </button>

                    <!-- Popup content -->
                    <div class="admin-popup-content">
                        <!-- Icon animation -->
                        <div class="admin-popup-icon">
                            <i class="fas fa-magic"></i>
                        </div>

                        <!-- Title -->
                        <h3 class="admin-popup-title">
                            🎉 Fitur Baru! Smart Admin Parser
                        </h3>

                        <!-- Description -->
                        <p class="admin-popup-desc">
                            Kirim info lomba super cepat! Cukup paste text, AI kami ekstrak otomatis 
                            & kirim ke database.
                        </p>

                        <!-- Quick stats -->
                        <div class="admin-popup-stats">
                            <div class="stat-item">
                                <div class="stat-number">⚡</div>
                                <div class="stat-text">Super Cepat</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">🤖</div>
                                <div class="stat-text">AI Parser</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">✅</div>
                                <div class="stat-text">Auto-Fill</div>
                            </div>
                        </div>

                        <!-- Quick input section -->
                        <div class="admin-popup-input-section">
                            <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 0.8rem;">
                                <strong>Demo Cepat:</strong> Paste info lomba & kirim langsung!
                            </p>
                            <textarea 
                                id="popupQuickInput" 
                                class="admin-popup-textarea"
                                placeholder="Tempel info lomba di sini... (optional)"
                                rows="3"
                            ></textarea>
                        </div>

                        <!-- Buttons -->
                        <div class="admin-popup-buttons">
                            <button class="btn-popup-submit" onclick="adminPopup.submitQuickData()">
                                <i class="fas fa-paper-plane me-2"></i>
                                Proses & Kirim
                            </button>
                            <a href="https://kseunripedia.my.id/admin" class="btn-popup-admin">
                                <i class="fas fa-arrow-right me-2"></i>
                                Buka Admin Panel
                            </a>
                        </div>

                        <!-- Bottom note -->
                        <p class="admin-popup-note">
                            💡 Tip: Admin panel membuka otomatis dengan data terparse!
                        </p>
                    </div>

                    <!-- Progress bar (auto-close indicator) -->
                    <div class="admin-popup-progress">
                        <div class="admin-popup-progress-bar"></div>
                    </div>
                </div>
            </div>
        `;

        // Inject popup ke body
        document.body.insertAdjacentHTML('beforeend', popupHTML);
        this.popupElement = document.getElementById('adminPopupOverlay');

        // Store reference globally
        window.adminPopup = this;
    }

    /**
     * Show popup dengan animasi
     */
    showPopup() {
        if (!this.popupElement || this.isShown) return;

        this.isShown = true;
        this.popupElement.style.display = 'flex';

        // Trigger animation
        setTimeout(() => {
            this.popupElement.classList.add('show');
        }, 50);

        // Auto-close after 7 seconds
        this.autoCloseTimer = setTimeout(() => {
            this.closePopup();
        }, 7000);

        // Reset progress bar
        const progressBar = this.popupElement.querySelector('.admin-popup-progress-bar');
        if (progressBar) {
            progressBar.style.animation = 'none';
            setTimeout(() => {
                progressBar.style.animation = 'adminPopupProgress 7s linear forwards';
            }, 100);
        }
    }

    /**
     * Close popup dengan animasi
     */
    closePopup() {
        if (!this.popupElement || !this.isShown) return;

        this.isShown = false;

        // Clear auto-close timer
        if (this.autoCloseTimer) {
            clearTimeout(this.autoCloseTimer);
        }

        // Trigger fade out animation
        this.popupElement.classList.remove('show');

        // Remove after animation
        setTimeout(() => {
            this.popupElement.style.display = 'none';
        }, 300);

        // Store close time in localStorage
        localStorage.setItem('adminPopup_lastClosed', Date.now().toString());
    }

    /**
     * Submit quick data dari popup
     */
    submitQuickData() {
        const textarea = document.getElementById('popupQuickInput');
        const text = textarea?.value.trim();

        if (!text) {
            alert('Silakan paste info lomba terlebih dahulu!');
            return;
        }

        // Encode text untuk URL parameter
        const encodedText = encodeURIComponent(text);

        // Redirect ke admin dengan preloaded data
        // (akan dihandle by admin page untuk auto-parse)
        const adminUrl = `https://kseunripedia.my.id/admin?prefill=${encodedText}`;
        window.location.href = adminUrl;

        // Close popup sebelum redirect
        this.closePopup();
    }

    /**
     * Reopen popup (untuk testing)
     */
    reopen() {
        localStorage.removeItem('adminPopup_lastClosed');
        this.showPopup();
    }
}

// Initialize popup manager
const adminPopupManager = new AdminPopupManager();

// Inject CSS animations
const popupStyles = `
    <style>
        /* Popup Overlay */
        .admin-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease;
            backdrop-filter: blur(4px);
        }

        .admin-popup-overlay.show {
            opacity: 1;
        }

        /* Popup Container */
        .admin-popup-container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 90%;
            overflow: hidden;
            animation: adminPopupSlideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            position: relative;
        }

        @keyframes adminPopupSlideUp {
            from {
                opacity: 0;
                transform: translateY(40px) scale(0.9);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        /* Close button */
        .admin-popup-close {
            position: absolute;
            top: 15px;
            right: 15px;
            background: #f1f5f9;
            border: none;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            font-size: 18px;
            color: #64748b;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            z-index: 10;
        }

        .admin-popup-close:hover {
            background: #e2e8f0;
            color: #1e40af;
            transform: rotate(90deg);
        }

        /* Popup content */
        .admin-popup-content {
            padding: 2.5rem 1.5rem 1.5rem;
            text-align: center;
        }

        /* Icon */
        .admin-popup-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            animation: adminPopupBounce 0.8s ease-in-out;
        }

        @keyframes adminPopupBounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
        }

        /* Title */
        .admin-popup-title {
            font-size: 1.4rem;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 0.8rem;
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        /* Description */
        .admin-popup-desc {
            font-size: 0.95rem;
            color: #64748b;
            margin-bottom: 1.5rem;
            line-height: 1.6;
        }

        /* Stats section */
        .admin-popup-stats {
            display: flex;
            justify-content: space-around;
            margin-bottom: 1.5rem;
            padding: 1.2rem;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 12px;
        }

        .stat-item {
            text-align: center;
        }

        .stat-number {
            font-size: 2rem;
            margin-bottom: 0.4rem;
            display: block;
        }

        .stat-text {
            font-size: 0.75rem;
            color: #64748b;
            font-weight: 600;
        }

        /* Input section */
        .admin-popup-input-section {
            margin-bottom: 1.5rem;
            text-align: left;
        }

        .admin-popup-textarea {
            width: 100%;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            padding: 0.8rem;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 0.9rem;
            color: #1e293b;
            resize: vertical;
            transition: all 0.3s ease;
        }

        .admin-popup-textarea:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
            background-color: white;
        }

        /* Buttons */
        .admin-popup-buttons {
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
            margin-bottom: 1rem;
        }

        .btn-popup-submit,
        .btn-popup-admin {
            padding: 0.9rem 1.5rem;
            border: none;
            border-radius: 10px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            white-space: nowrap;
        }

        .btn-popup-submit {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: #78350f;
            box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
        }

        .btn-popup-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(251, 191, 36, 0.4);
        }

        .btn-popup-admin {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
        }

        .btn-popup-admin:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(30, 64, 175, 0.4);
            color: white;
            text-decoration: none;
        }

        /* Note */
        .admin-popup-note {
            font-size: 0.8rem;
            color: #94a3b8;
            margin: 0;
            padding-top: 0.5rem;
            border-top: 1px solid #e2e8f0;
        }

        /* Progress bar */
        .admin-popup-progress {
            height: 3px;
            background: #e2e8f0;
            overflow: hidden;
        }

        .admin-popup-progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
            animation: adminPopupProgress 7s linear forwards;
        }

        @keyframes adminPopupProgress {
            from {
                width: 100%;
            }
            to {
                width: 0%;
            }
        }

        /* Mobile Responsive */
        @media (max-width: 576px) {
            .admin-popup-container {
                width: 95%;
                max-width: 100%;
            }

            .admin-popup-content {
                padding: 2rem 1rem 1rem;
            }

            .admin-popup-title {
                font-size: 1.1rem;
            }

            .admin-popup-desc {
                font-size: 0.85rem;
            }

            .admin-popup-stats {
                padding: 0.8rem;
            }

            .admin-popup-icon {
                font-size: 2.5rem;
            }
        }

        /* Accessibility */
        .admin-popup-close:focus,
        .btn-popup-submit:focus,
        .btn-popup-admin:focus {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
        }
    </style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', popupStyles);

// Console API untuk testing
console.log(`
╔════════════════════════════════════════════════════════╗
║   Admin Popup System Ready                             ║
╚════════════════════════════════════════════════════════╝

Available Commands:
  adminPopupManager.showPopup()    - Show popup
  adminPopupManager.closePopup()   - Close popup
  adminPopupManager.reopen()       - Reopen (reset 24h timer)
  adminPopupManager.submitQuickData() - Submit quick data
`);
