// dashboard.js - Dashboard Analytics Logic
(function () {
    'use strict';

    let reports = [];
    const STORAGE_KEY = 'pkm_dbd_reports';

    // Initialize dashboard
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        loadData();
        updateMetrics();
        renderCharts();
        renderActivityFeed();

        // Auto-refresh every 30 seconds
        setInterval(() => {
            loadData();
            updateMetrics();
            renderActivityFeed();
        }, 30000);
    }

    function loadData() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            reports = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading data:', error);
            reports = [];
        }
    }

    function updateMetrics() {
        // Total Reports
        const totalEl = document.getElementById('totalReports');
        if (totalEl) totalEl.textContent = reports.length;

        // High Priority
        const highEl = document.getElementById('highPriority');
        const highCount = reports.filter(r => r.priority === 'high').length;
        if (highEl) highEl.textContent = highCount;

        // Verified
        const verifiedEl = document.getElementById('verified');
        const verifiedCount = reports.filter(r => r.status === 'verified' || r.status === 'resolved').length;
        if (verifiedEl) verifiedEl.textContent = verifiedCount;

        // Response Rate
        const responseEl = document.getElementById('responseRate');
        if (responseEl) {
            const rate = reports.length > 0 ? Math.round((verifiedCount / reports.length) * 100) : 0;
            responseEl.textContent = rate + '%';
        }

        // Trends
        const trendReports = document.getElementById('trendReports');
        if (trendReports && reports.length > 0) {
            const last7Days = reports.filter(r => {
                const daysDiff = (Date.now() - r.timestamp) / (1000 * 60 * 60 * 24);
                return daysDiff <= 7;
            }).length;
            trendReports.textContent = `${last7Days} laporan minggu ini`;
        }

        const trendVerified = document.getElementById('trendVerified');
        if (trendVerified) {
            const pendingCount = reports.filter(r => r.status === 'pending').length;
            trendVerified.textContent = `${pendingCount} menunggu verifikasi`;
        }

        const trendResponse = document.getElementById('trendResponse');
        if (trendResponse) {
            const avgTime = calculateAvgResponseTime();
            trendResponse.textContent = avgTime;
        }

        // Quick Stats by Category
        document.getElementById('qsJentik').textContent = reports.filter(r => r.category === 'jentik').length;
        document.getElementById('qsKasus').textContent = reports.filter(r => r.category === 'kasus').length;
        document.getElementById('qsLingkungan').textContent = reports.filter(r => r.category === 'lingkungan').length;
        document.getElementById('qsLainnya').textContent = reports.filter(r => r.category === 'lainnya').length;
    }

    function calculateAvgResponseTime() {
        const resolvedReports = reports.filter(r => r.status === 'resolved');
        if (resolvedReports.length === 0) return 'Belum ada data';

        // Since we don't track resolution time, show count instead
        return `${resolvedReports.length} selesai`;
    }

    function renderCharts() {
        renderWeeklyChart();
        renderCategoryChart();
        renderStatusChart();
    }

    function renderWeeklyChart() {
        const canvas = document.getElementById('weeklyChart');
        if (!canvas || typeof Chart === 'undefined') return;

        // Get data for last 7 days
        const days = [];
        const counts = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
            days.push(dateStr);

            const dayStart = new Date(date).setHours(0, 0, 0, 0);
            const dayEnd = new Date(date).setHours(23, 59, 59, 999);

            const count = reports.filter(r => {
                return r.timestamp >= dayStart && r.timestamp <= dayEnd;
            }).length;

            counts.push(count);
        }

        new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: days,
                datasets: [{
                    label: 'Jumlah Laporan',
                    data: counts,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(15, 139, 109, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: '#3B82F6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    function renderCategoryChart() {
        const canvas = document.getElementById('categoryChart');
        if (!canvas || typeof Chart === 'undefined') return;

        const categories = {
            'jentik': reports.filter(r => r.category === 'jentik').length,
            'kasus': reports.filter(r => r.category === 'kasus').length,
            'lingkungan': reports.filter(r => r.category === 'lingkungan').length,
            'lainnya': reports.filter(r => r.category === 'lainnya').length
        };

        new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['🦟 Temuan Jentik', '🏥 Kasus DBD', '🌳 Lingkungan Berisiko', '📋 Lainnya'],
                datasets: [{
                    data: [categories.jentik, categories.kasus, categories.lingkungan, categories.lainnya],
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    function renderStatusChart() {
        const canvas = document.getElementById('statusChart');
        if (!canvas || typeof Chart === 'undefined') return;

        const statuses = {
            'pending': reports.filter(r => r.status === 'pending').length,
            'verified': reports.filter(r => r.status === 'verified').length,
            'resolved': reports.filter(r => r.status === 'resolved').length
        };

        new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Pending', 'Terverifikasi', 'Selesai'],
                datasets: [{
                    label: 'Jumlah Laporan',
                    data: [statuses.pending, statuses.verified, statuses.resolved],
                    backgroundColor: [
                        'rgba(243, 156, 18, 0.8)',
                        'rgba(52, 152, 219, 0.8)',
                        'rgba(39, 174, 96, 0.8)'
                    ],
                    borderColor: [
                        '#F39C12',
                        '#3498DB',
                        '#27AE60'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    function renderActivityFeed() {
        const container = document.getElementById('activityList');
        if (!container) return;

        // Get 10 most recent reports
        const recent = [...reports]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);

        if (recent.length === 0) {
            container.innerHTML = '<p class="muted" style="text-align: center; padding: 2rem;">Belum ada aktivitas</p>';
            return;
        }

        container.innerHTML = recent.map(report => {
            const time = formatTimeAgo(report.timestamp);
            const icon = getCategoryIcon(report.category);
            const bgColor = getPriorityColor(report.priority);

            return `
        <div class="activity-item">
          <div class="activity-icon" style="background: ${bgColor};">
            ${icon}
          </div>
          <div class="activity-content">
            <div class="activity-title">
              ${getCategoryLabel(report.category)} - ${report.address}
            </div>
            <div class="activity-time">
              ${time} · ${report.name} · 
              <span class="status-badge status-${report.status}" style="padding: 2px 8px; font-size: 0.8rem;">
                ${getStatusLabel(report.status)}
              </span>
            </div>
          </div>
        </div>
      `;
        }).join('');
    }

    // Helper Functions
    function formatTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);

        if (seconds < 60) return 'Baru saja';
        if (seconds < 3600) return Math.floor(seconds / 60) + ' menit lalu';
        if (seconds < 86400) return Math.floor(seconds / 3600) + ' jam lalu';
        if (seconds < 604800) return Math.floor(seconds / 86400) + ' hari lalu';

        return new Date(timestamp).toLocaleDateString('id-ID');
    }

    function getCategoryIcon(category) {
        const icons = {
            jentik: '🦟',
            kasus: '🏥',
            lingkungan: '🌳',
            lainnya: '📋'
        };
        return icons[category] || '📋';
    }

    function getCategoryLabel(category) {
        const labels = {
            jentik: 'Temuan Jentik',
            kasus: 'Kasus DBD',
            lingkungan: 'Lingkungan Berisiko',
            lainnya: 'Lainnya'
        };
        return labels[category] || category;
    }

    function getStatusLabel(status) {
        const labels = {
            pending: 'Pending',
            verified: 'Terverifikasi',
            resolved: 'Selesai'
        };
        return labels[status] || status;
    }

    function getPriorityColor(priority) {
        const colors = {
            high: 'rgba(213, 42, 58, 0.2)',
            medium: 'rgba(243, 156, 18, 0.2)',
            low: 'rgba(26, 188, 156, 0.2)'
        };
        return colors[priority] || colors.medium;
    }

})();
