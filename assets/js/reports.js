// reports.js - Manajemen laporan dan ekspor Excel
(function () {
    'use strict';

    // State management
    let allReports = [];
    let filteredReports = [];

    // Constants
    const STORAGE_KEY = 'pkm_dbd_reports';

    // DOM Elements
    const tableBody = document.getElementById('reportsTableBody');
    const emptyState = document.getElementById('emptyState');
    const reportModal = document.getElementById('reportModal');
    const formModal = document.getElementById('formModal');
    const modalBody = document.getElementById('modalBody');
    const manualReportForm = document.getElementById('manualReportForm');

    // Statistics elements
    const statTotal = document.getElementById('statTotal');
    const statPending = document.getElementById('statPending');
    const statVerified = document.getElementById('statVerified');
    const statHighPriority = document.getElementById('statHighPriority');

    // Filter elements
    const filterStatus = document.getElementById('filterStatus');
    const filterPriority = document.getElementById('filterPriority');
    const filterCategory = document.getElementById('filterCategory');
    const searchInput = document.getElementById('searchInput');

    // Action buttons
    const btnExportExcel = document.getElementById('btnExportExcel');
    const btnExportCSV = document.getElementById('btnExportCSV');
    const btnAddReport = document.getElementById('btnAddReport');
    const btnClearAll = document.getElementById('btnClearAll');

    // Initialize
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        loadReports();
        attachEventListeners();
        renderReports();
        updateStatistics();
    }

    function attachEventListeners() {
        // Export buttons
        btnExportExcel?.addEventListener('click', exportToExcel);
        btnExportCSV?.addEventListener('click', exportToCSV);
        btnAddReport?.addEventListener('click', () => formModal.classList.add('active'));
        btnClearAll?.addEventListener('click', clearAllReports);

        // Filters
        filterStatus?.addEventListener('change', applyFilters);
        filterPriority?.addEventListener('change', applyFilters);
        filterCategory?.addEventListener('change', applyFilters);
        searchInput?.addEventListener('input', applyFilters);

        // Modals
        document.getElementById('modalClose')?.addEventListener('click', () => {
            reportModal.classList.remove('active');
        });
        document.getElementById('formModalClose')?.addEventListener('click', () => {
            formModal.classList.remove('active');
        });

        // Form submission
        manualReportForm?.addEventListener('submit', handleFormSubmit);

        // Close modal on outside click
        reportModal?.addEventListener('click', (e) => {
            if (e.target === reportModal) reportModal.classList.remove('active');
        });
        formModal?.addEventListener('click', (e) => {
            if (e.target === formModal) formModal.classList.remove('active');
        });
    }

    function loadReports() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            allReports = stored ? JSON.parse(stored) : [];

            // Migrate old reports from reports_v2 if exists
            const oldReports = localStorage.getItem('reports_v2');
            if (oldReports && allReports.length === 0) {
                const old = JSON.parse(oldReports);
                allReports = old.map((r, idx) => ({
                    id: generateId(),
                    timestamp: r.ts || Date.now(),
                    name: r.name || 'Anonim',
                    address: r.address || '',
                    note: r.note || '',
                    category: r.category || 'lainnya',
                    priority: r.priority || 'medium',
                    status: r.status || 'pending'
                }));
                saveReports();
            }

            filteredReports = [...allReports];
        } catch (error) {
            console.error('Error loading reports:', error);
            allReports = [];
            filteredReports = [];
        }
    }

    function saveReports() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allReports));
        } catch (error) {
            console.error('Error saving reports:', error);
            showToast('Gagal menyimpan data. Storage mungkin penuh.');
        }
    }

    function generateId() {
        return 'RPT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    function handleFormSubmit(e) {
        e.preventDefault();

        const newReport = {
            id: generateId(),
            timestamp: Date.now(),
            name: document.getElementById('formName').value.trim() || 'Anonim',
            address: document.getElementById('formAddress').value.trim(),
            category: document.getElementById('formCategory').value,
            priority: document.getElementById('formPriority').value,
            status: document.getElementById('formStatus').value,
            note: document.getElementById('formNote').value.trim()
        };

        allReports.unshift(newReport); // Add to beginning
        saveReports();
        applyFilters();
        updateStatistics();

        formModal.classList.remove('active');
        manualReportForm.reset();
        showToast('✓ Laporan berhasil ditambahkan');
    }

    function applyFilters() {
        const statusFilter = filterStatus?.value || '';
        const priorityFilter = filterPriority?.value || '';
        const categoryFilter = filterCategory?.value || '';
        const searchTerm = searchInput?.value.toLowerCase() || '';

        filteredReports = allReports.filter(report => {
            const matchStatus = !statusFilter || report.status === statusFilter;
            const matchPriority = !priorityFilter || report.priority === priorityFilter;
            const matchCategory = !categoryFilter || report.category === categoryFilter;
            const matchSearch = !searchTerm ||
                report.name.toLowerCase().includes(searchTerm) ||
                report.address.toLowerCase().includes(searchTerm) ||
                report.note.toLowerCase().includes(searchTerm) ||
                report.id.toLowerCase().includes(searchTerm);

            return matchStatus && matchPriority && matchCategory && matchSearch;
        });

        renderReports();
    }

    function renderReports() {
        if (!tableBody) return;

        if (filteredReports.length === 0) {
            tableBody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        tableBody.innerHTML = filteredReports.map(report => {
            const date = new Date(report.timestamp);
            const dateStr = date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
            const timeStr = date.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
        <tr>
          <td><strong>${report.id}</strong></td>
          <td>
            ${dateStr}<br>
            <small style="color: #6c757d;">${timeStr}</small>
          </td>
          <td>${getCategoryLabel(report.category)}</td>
          <td><span class="priority-${report.priority}">${getPriorityLabel(report.priority)}</span></td>
          <td><span class="status-badge status-${report.status}">${getStatusLabel(report.status)}</span></td>
          <td>${report.name}</td>
          <td>${truncate(report.address, 30)}</td>
          <td>${truncate(report.note, 50)}</td>
          <td>
            <button class="action-btn action-btn-view" onclick="window.reportsModule.viewReport('${report.id}')">
              👁️ Lihat
            </button>
            <button class="action-btn action-btn-delete" onclick="window.reportsModule.deleteReport('${report.id}')">
              🗑️
            </button>
          </td>
        </tr>
      `;
        }).join('');
    }

    function viewReport(id) {
        const report = allReports.find(r => r.id === id);
        if (!report) return;

        const date = new Date(report.timestamp);
        const dateStr = date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        modalBody.innerHTML = `
      <div style="margin-bottom: 1rem;">
        <strong>ID Laporan:</strong><br>
        <code style="background: #f8f9fa; padding: 4px 8px; border-radius: 4px;">${report.id}</code>
      </div>
      <div style="margin-bottom: 1rem;">
        <strong>Tanggal & Waktu:</strong><br>
        ${dateStr}
      </div>
      <div style="margin-bottom: 1rem;">
        <strong>Kategori:</strong><br>
        ${getCategoryLabel(report.category)}
      </div>
      <div style="margin-bottom: 1rem;">
        <strong>Prioritas:</strong><br>
        <span class="priority-${report.priority}">${getPriorityLabel(report.priority)}</span>
      </div>
      <div style="margin-bottom: 1rem;">
        <strong>Status:</strong><br>
        <span class="status-badge status-${report.status}">${getStatusLabel(report.status)}</span>
      </div>
      <div style="margin-bottom: 1rem;">
        <strong>Nama Pelapor:</strong><br>
        ${report.name}
      </div>
      <div style="margin-bottom: 1rem;">
        <strong>Alamat:</strong><br>
        ${report.address}
      </div>
      <div style="margin-bottom: 1rem;">
        <strong>Keterangan Lengkap:</strong><br>
        ${report.note}
      </div>
      <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem;">
        <button class="btn btn-outline" onclick="window.reportsModule.changeStatus('${report.id}')">
          📝 Ubah Status
        </button>
        <button class="btn btn-subtle" onclick="window.reportsModule.deleteReport('${report.id}'); document.getElementById('reportModal').classList.remove('active');">
          🗑️ Hapus
        </button>
      </div>
    `;

        reportModal.classList.add('active');
    }

    function changeStatus(id) {
        const report = allReports.find(r => r.id === id);
        if (!report) return;

        const newStatus = prompt(
            'Ubah status laporan:\n\n' +
            '1. pending - Menunggu verifikasi\n' +
            '2. verified - Sudah diverifikasi\n' +
            '3. resolved - Sudah diselesaikan\n\n' +
            'Masukkan status baru (pending/verified/resolved):',
            report.status
        );

        if (newStatus && ['pending', 'verified', 'resolved'].includes(newStatus)) {
            report.status = newStatus;
            saveReports();
            applyFilters();
            updateStatistics();
            reportModal.classList.remove('active');
            showToast('✓ Status berhasil diubah');
        }
    }

    function deleteReport(id) {
        if (!confirm('Yakin ingin menghapus laporan ini?')) return;

        allReports = allReports.filter(r => r.id !== id);
        saveReports();
        applyFilters();
        updateStatistics();
        showToast('✓ Laporan berhasil dihapus');
    }

    function clearAllReports() {
        if (!confirm('PERINGATAN: Ini akan menghapus SEMUA laporan!\n\nUnduh backup Excel terlebih dahulu jika diperlukan.\n\nLanjutkan?')) return;

        const confirmation = prompt('Ketik "HAPUS SEMUA" untuk mengonfirmasi:');
        if (confirmation === 'HAPUS SEMUA') {
            allReports = [];
            filteredReports = [];
            saveReports();
            renderReports();
            updateStatistics();
            showToast('✓ Semua laporan berhasil dihapus');
        }
    }

    function updateStatistics() {
        if (!statTotal) return;

        const total = allReports.length;
        const pending = allReports.filter(r => r.status === 'pending').length;
        const verified = allReports.filter(r => r.status === 'verified').length;
        const highPriority = allReports.filter(r => r.priority === 'high').length;

        statTotal.textContent = total;
        statPending.textContent = pending;
        statVerified.textContent = verified;
        statHighPriority.textContent = highPriority;
    }

    function exportToExcel() {
        if (typeof XLSX === 'undefined') {
            showToast('❌ Library Excel belum dimuat. Refresh halaman dan coba lagi.');
            return;
        }

        if (allReports.length === 0) {
            showToast('❌ Tidak ada data untuk diekspor');
            return;
        }

        try {
            // Prepare data for export
            const data = allReports.map(report => ({
                'ID Laporan': report.id,
                'Tanggal': new Date(report.timestamp).toLocaleDateString('id-ID'),
                'Waktu': new Date(report.timestamp).toLocaleTimeString('id-ID'),
                'Nama Pelapor': report.name,
                'Alamat': report.address,
                'Kategori': getCategoryLabel(report.category),
                'Prioritas': getPriorityLabel(report.priority),
                'Status': getStatusLabel(report.status),
                'Keterangan': report.note
            }));

            // Create workbook
            const wb = XLSX.utils.book_new();

            // Sheet 1: All Reports
            const ws1 = XLSX.utils.json_to_sheet(data);

            // Set column widths
            ws1['!cols'] = [
                { wch: 20 }, // ID
                { wch: 12 }, // Tanggal
                { wch: 10 }, // Waktu
                { wch: 20 }, // Nama
                { wch: 35 }, // Alamat
                { wch: 15 }, // Kategori
                { wch: 12 }, // Prioritas
                { wch: 12 }, // Status
                { wch: 50 }  // Keterangan
            ];

            XLSX.utils.book_append_sheet(wb, ws1, 'Semua Laporan');

            // Sheet 2: Statistics
            const stats = [
                { 'Metrik': 'Total Laporan', 'Jumlah': allReports.length },
                { 'Metrik': 'Pending', 'Jumlah': allReports.filter(r => r.status === 'pending').length },
                { 'Metrik': 'Terverifikasi', 'Jumlah': allReports.filter(r => r.status === 'verified').length },
                { 'Metrik': 'Selesai', 'Jumlah': allReports.filter(r => r.status === 'resolved').length },
                { 'Metrik': '', 'Jumlah': '' },
                { 'Metrik': 'Prioritas Tinggi', 'Jumlah': allReports.filter(r => r.priority === 'high').length },
                { 'Metrik': 'Prioritas Sedang', 'Jumlah': allReports.filter(r => r.priority === 'medium').length },
                { 'Metrik': 'Prioritas Rendah', 'Jumlah': allReports.filter(r => r.priority === 'low').length },
                { 'Metrik': '', 'Jumlah': '' },
                { 'Metrik': 'Kategori Jentik', 'Jumlah': allReports.filter(r => r.category === 'jentik').length },
                { 'Metrik': 'Kategori Kasus DBD', 'Jumlah': allReports.filter(r => r.category === 'kasus').length },
                { 'Metrik': 'Kategori Lingkungan', 'Jumlah': allReports.filter(r => r.category === 'lingkungan').length },
                { 'Metrik': 'Kategori Lainnya', 'Jumlah': allReports.filter(r => r.category === 'lainnya').length }
            ];

            const ws2 = XLSX.utils.json_to_sheet(stats);
            ws2['!cols'] = [{ wch: 25 }, { wch: 15 }];
            XLSX.utils.book_append_sheet(wb, ws2, 'Statistik');

            // Sheet 3: High Priority Reports
            const highPriorityData = allReports
                .filter(r => r.priority === 'high')
                .map(report => ({
                    'ID Laporan': report.id,
                    'Tanggal': new Date(report.timestamp).toLocaleDateString('id-ID'),
                    'Nama Pelapor': report.name,
                    'Alamat': report.address,
                    'Kategori': getCategoryLabel(report.category),
                    'Status': getStatusLabel(report.status),
                    'Keterangan': report.note
                }));

            if (highPriorityData.length > 0) {
                const ws3 = XLSX.utils.json_to_sheet(highPriorityData);
                ws3['!cols'] = [
                    { wch: 20 },
                    { wch: 12 },
                    { wch: 20 },
                    { wch: 35 },
                    { wch: 15 },
                    { wch: 12 },
                    { wch: 50 }
                ];
                XLSX.utils.book_append_sheet(wb, ws3, 'Prioritas Tinggi');
            }

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = `Laporan_DBD_${timestamp}.xlsx`;

            // Export
            XLSX.writeFile(wb, filename);
            showToast('✓ File Excel berhasil diunduh: ' + filename);
        } catch (error) {
            console.error('Export error:', error);
            showToast('❌ Gagal mengekspor ke Excel: ' + error.message);
        }
    }

    function exportToCSV() {
        if (allReports.length === 0) {
            showToast('❌ Tidak ada data untuk diekspor');
            return;
        }

        try {
            // CSV Headers
            const headers = ['ID Laporan', 'Tanggal', 'Waktu', 'Nama Pelapor', 'Alamat', 'Kategori', 'Prioritas', 'Status', 'Keterangan'];

            // CSV Rows
            const rows = allReports.map(report => {
                const date = new Date(report.timestamp);
                return [
                    report.id,
                    date.toLocaleDateString('id-ID'),
                    date.toLocaleTimeString('id-ID'),
                    report.name,
                    report.address,
                    getCategoryLabel(report.category),
                    getPriorityLabel(report.priority),
                    getStatusLabel(report.status),
                    report.note
                ];
            });

            // Combine headers and rows
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            // Create blob and download
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            const timestamp = new Date().toISOString().slice(0, 10);

            link.setAttribute('href', url);
            link.setAttribute('download', `Laporan_DBD_${timestamp}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast('✓ File CSV berhasil diunduh');
        } catch (error) {
            console.error('Export error:', error);
            showToast('❌ Gagal mengekspor ke CSV: ' + error.message);
        }
    }

    // Helper functions
    function getCategoryLabel(category) {
        const labels = {
            jentik: '🦟 Temuan Jentik',
            kasus: '🏥 Kasus DBD',
            lingkungan: '🌳 Lingkungan Berisiko',
            lainnya: '📋 Lainnya'
        };
        return labels[category] || category;
    }

    function getPriorityLabel(priority) {
        const labels = {
            high: '🔴 Tinggi',
            medium: '🟡 Sedang',
            low: '🟢 Rendah'
        };
        return labels[priority] || priority;
    }

    function getStatusLabel(status) {
        const labels = {
            pending: 'Pending',
            verified: 'Terverifikasi',
            resolved: 'Selesai'
        };
        return labels[status] || status;
    }

    function truncate(str, maxLength) {
        if (!str) return '-';
        return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
    }

    function showToast(message, duration = 3500) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), duration);
    }

    // Expose public API
    window.reportsModule = {
        viewReport,
        deleteReport,
        changeStatus,
        exportToExcel,
        exportToCSV
    };

})();
