// scripts.js — interaktivitas utama PKM DBD dashboard
(function () {
  const monthNamesId = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthNamesShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  const DATA_ENDPOINT = 'https://www.cegahdbd.com/api/situasi-dbd'; // adapt to actual endpoint if available
  const NEWS_ENDPOINT = 'https://ayosehat.kemkes.go.id/topik/demam-berdarah-dengue';

  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      mainNav.classList.toggle('open');
      navToggle.classList.toggle('open');
    });
  }

  const toast = document.getElementById('toast');
  function showToast(message, duration = 3200) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  }

  function readReports() {
    try {
      return JSON.parse(localStorage.getItem('reports_v2') || '[]');
    } catch (error) {
      console.warn('Gagal membaca laporan tersimpan:', error);
      return [];
    }
  }

  const reportForm = document.getElementById('reportForm');
  if (reportForm) {
    reportForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = (document.getElementById('r_name')?.value || '').trim() || 'Anonim';
      const address = (document.getElementById('r_address')?.value || '').trim();
      const note = (document.getElementById('r_note')?.value || '').trim();
      const category = document.getElementById('r_category')?.value || 'lainnya';
      const priority = document.getElementById('r_priority')?.value || 'medium';

      if (!address || !note) {
        showToast('Alamat dan keterangan wajib diisi.');
        return;
      }

      // Save to new localStorage structure for reports system
      try {
        const reports = JSON.parse(localStorage.getItem('pkm_dbd_reports') || '[]');
        const newReport = {
          id: 'RPT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          timestamp: Date.now(),
          name: name,
          address: address,
          category: category,
          priority: priority,
          status: 'pending',
          note: note
        };
        reports.unshift(newReport);
        localStorage.setItem('pkm_dbd_reports', JSON.stringify(reports));

        showToast('✓ Laporan berhasil disimpan! Lihat di halaman Laporan.');

        // Optional: Also send via email
        const sendEmail = confirm('Laporan sudah tersimpan.\n\nApakah Anda juga ingin mengirim via email?');
        if (sendEmail) {
          const email = 'mikutannakano@gmail.com';
          const subject = `Laporan ${category.toUpperCase()} [${priority.toUpperCase()}]: ${address}`;

          const body = `
========================================
   LAPORAN WARGA - PENCEGAHAN DBD
   Program PKM "Bersih Itu Patriotik"
========================================

ID LAPORAN: ${newReport.id}

Yth. Tim PKM,

Berikut adalah laporan yang dikirimkan oleh warga melalui situs web:

----------------------------------------
   DETAIL LAPORAN
----------------------------------------

- NAMA PELAPOR:
  ${name}

- ALAMAT/LOKASI:
  ${address}

- KATEGORI:
  ${category.toUpperCase()}

- PRIORITAS:
  ${priority.toUpperCase()}

- KETERANGAN:
  ${note}

----------------------------------------

Laporan ini dibuat pada: ${new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' })}

Terima kasih atas perhatian dan tindak lanjutnya.

Hormat kami,
Sistem Pelaporan Warga
          `.trim().replace(/(\r\n|\n|\r)/gm, "\n");

          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          window.open(gmailUrl, '_blank');
        }
      } catch (error) {
        console.error('Error saving report:', error);
        showToast('❌ Gagal menyimpan laporan. Silakan coba lagi.');
        return;
      }

      reportForm.reset();

      // Redirect ke halaman laporan setelah 2 detik
      setTimeout(() => {
        if (confirm('Ingin melihat semua laporan sekarang?')) {
          window.location.href = 'reports.html';
        }
      }, 2000);
    });
  }

  let monthlyData = [];
  let filteredData = [];
  let casesChart;
  let humidityChart;
  let sparklineChart;

  const DEFAULT_MAP_IMAGE_PATTERNS = {
    ai: 'https://iklim.bmkg.go.id/id/dbdklim/storage/peta_ai/peta_ai_{year}_{month}.png',
    rh: 'https://iklim.bmkg.go.id/id/dbdklim/storage/peta_rh/peta_rh_{year}_{month}.png'
  };

  const MAP_IMAGE_TARGETS = [
    { id: 'bmkgMapImageAi', type: 'ai' },
    { id: 'bmkgMapImageRh', type: 'rh' },
    { id: 'bmkgMapImageAiStats', type: 'ai' },
    { id: 'bmkgMapImageRhStats', type: 'rh' }
  ];

  const REGION_BASELINES = [
    { id: 'jakpus', name: 'Jakarta Pusat', lat: -6.186, lng: 106.845, aiFactor: 0.92, rhFactor: 1.02 },
    { id: 'jakbar', name: 'Jakarta Barat', lat: -6.1767, lng: 106.755, aiFactor: 1.05, rhFactor: 1.00 },
    { id: 'jaksel', name: 'Jakarta Selatan', lat: -6.261, lng: 106.812, aiFactor: 1.12, rhFactor: 1.04 },
    { id: 'jakut', name: 'Jakarta Utara', lat: -6.121, lng: 106.900, aiFactor: 0.98, rhFactor: 0.97 },
    { id: 'jaktim', name: 'Jakarta Timur', lat: -6.225, lng: 106.903, aiFactor: 1.18, rhFactor: 1.06 },
    { id: 'depok', name: 'Depok', lat: -6.402, lng: 106.794, aiFactor: 0.88, rhFactor: 0.94 },
    { id: 'bekasi', name: 'Bekasi', lat: -6.235, lng: 106.989, aiFactor: 1.10, rhFactor: 1.02 },
    { id: 'tangerang', name: 'Tangerang', lat: -6.178, lng: 106.629, aiFactor: 0.96, rhFactor: 0.95 }
  ];

  const MEDIA_SOURCES = {
    gallery: [
      {
        title: 'Edukasi keluarga tentang 3M Plus',
        url: 'https://images.unsplash.com/photo-1582719478270-e207f5a1d69d?auto=format&fit=crop&w=900&q=80',
        credit: 'National Cancer Institute / Unsplash',
        source: 'unsplash.com'
      },
      {
        title: 'Petugas melakukan fogging fokus di pemukiman',
        url: 'https://images.unsplash.com/photo-1588412059654-6400c6ee15ba?auto=format&fit=crop&w=900&q=80',
        credit: 'Mufid Majnun / Unsplash',
        source: 'unsplash.com'
      },
      {
        title: 'Relawan membersihkan lingkungan dari sampah plastik',
        url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80',
        credit: 'Hermes Rivera / Unsplash',
        source: 'unsplash.com'
      },
      {
        title: 'Posyandu dan kader jumantik memeriksa tempat penampungan air',
        url: 'https://images.unsplash.com/photo-1629904853716-f0bc54eea481?auto=format&fit=crop&w=900&q=80',
        credit: 'CDC / Unsplash',
        source: 'cdc.gov'
      }
    ],
    posters: [
      {
        title: 'Poster 3M Plus Kemenkes',
        url: 'https://dinkes.bantenprov.go.id/uploads/poster/Poster-DBD-3M-Plus.jpg',
        credit: 'Kemenkes RI',
        source: 'dinkes.bantenprov.go.id'
      },
      {
        title: 'Poster Waspada DBD pada Musim Hujan',
        url: 'https://bpbd.jakarta.go.id/storage/app/media/poster/POS%20DBD%20BPBD%20DKI.jpg',
        credit: 'BPBD DKI Jakarta',
        source: 'bpbd.jakarta.go.id'
      },
      {
        title: 'Infografis Gejala dan Penanganan DBD',
        url: 'https://diskes.bulelengkab.go.id/uploads/berita/large_6646cd0cce36f4-05221852168.jpg',
        credit: 'Dinas Kesehatan Buleleng',
        source: 'diskes.bulelengkab.go.id'
      }
    ]
  };

  const FALLBACK_NEWS = [
    {
      title: 'Mengingat Pentingnya Pencegahan Dengue dengan 3M Plus melalui ASEAN DENGUE DAY',
      url: 'https://ayosehat.kemkes.go.id/mengingat-pentingnya-pencegahan-dengue-dengan-3m-plus-melalui-asean-dengue-day',
      excerpt: 'Kemenkes mengajak masyarakat memperkuat gerakan 3M Plus dan kolaborasi lintas sektor untuk menekan kasus DBD.',
      date: '15 Juni 2025'
    },
    {
      title: 'Cara Mencegah DBD dengan Menjaga Lingkungan dan Diri Sendiri',
      url: 'https://ayosehat.kemkes.go.id/cara-mencegah-dbd-dengan-menjaga-lingkungan-dan-diri-sendiri',
      excerpt: 'Lingkungan bersih dan perilaku hidup sehat menjadi kunci pencegahan DBD di musim pancaroba.',
      date: '4 Juli 2024'
    },
    {
      title: 'Poster ASEAN Dengue Day 2024',
      url: 'https://ayosehat.kemkes.go.id/poster-asean-dengue-day-2024',
      excerpt: 'Materi kampanye visual untuk mendukung kesadaran pencegahan DBD di kawasan ASEAN.',
      date: '7 Juni 2024'
    },
    {
      title: 'Teknologi Wolbachia dalam Pengendalian Demam Berdarah di Indonesia',
      url: 'https://ayosehat.kemkes.go.id/teknologi-wolbachia-dalam-pengendalian-demam-berdarah-di-indonesia',
      excerpt: 'Implementasi nyamuk ber-Wolbachia dilakukan di lima kota sebagai strategi nasional pengendalian DBD.',
      date: '28 November 2023'
    }
  ];

  async function fetchDBDData() {
    try {
      const response = await fetch(DATA_ENDPOINT, { mode: 'cors' });
      if (!response.ok) throw new Error('API situasi DBD tidak tersedia');
      const rawData = await response.json();
      monthlyData = normalizeBMKGData(rawData);
    } catch (error) {
      console.warn('Menggunakan data simulasi BMKG:', error.message);
      monthlyData = generateMockBMKGData();
    }
    monthlyData = enrichMonthlyData(monthlyData);
  }

  function normalizeBMKGData(data) {
    if (!Array.isArray(data)) return [];
    return data.map((entry) => ({
      year: Number(entry.year || entry.tahun || entry.Y) || 2024,
      month: Number(entry.month || entry.bulan || entry.M) || 1,
      cases: Number(entry.cases || entry.kasus || entry.nilai || entry.ai) || 0,
      humidity: Number(entry.humidity || entry.rh || entry.relativeHumidity) || 0,
      rhSuitability: Number(entry.rh_probability || entry.rhSuitability || entry.probabilitas || entry.risk_score) || 0,
      aiPrediction: Number(entry.ai_prediction || entry.ai || entry.insiden) || 0,
      risk: (entry.risk || entry.level || '').toString() || 'Sedang',
      summary: entry.summary || entry.keterangan || 'Tingkat risiko berdasarkan kombinasi kasus dan kelembaban udara.',
    }));
  }

  function enrichMonthlyData(data) {
    return data
      .filter((item) => item.year && item.month)
      .map((item) => {
        const monthIndex = Math.min(Math.max(Number(item.month), 1), 12);
        const id = `${item.year}-${String(monthIndex).padStart(2, '0')}`;
        return {
          ...item,
          month: monthIndex,
          id,
          label: `${monthNamesShort[monthIndex - 1]} ${item.year}`,
        };
      })
      .sort((a, b) => new Date(a.year, a.month - 1) - new Date(b.year, b.month - 1));
  }

  function generateMockBMKGData() {
    return [
      // 2023
      {
        year: 2023, month: 1, cases: 118, humidity: 79, rhSuitability: 0.54, aiPrediction: 21, risk: 'Sedang',
        summary: 'Awal musim hujan, lakukan 3M Plus intensif di rumah.'
      },
      {
        year: 2023, month: 2, cases: 132, humidity: 80, rhSuitability: 0.58, aiPrediction: 24, risk: 'Sedang',
        summary: 'Kelembaban naik, perhatikan bak mandi dan talang air.'
      },
      {
        year: 2023, month: 3, cases: 158, humidity: 82, rhSuitability: 0.62, aiPrediction: 27, risk: 'Sedang',
        summary: 'Kasus meningkat, aktifkan kader jumantik lingkungan.'
      },
      {
        year: 2023, month: 4, cases: 146, humidity: 81, rhSuitability: 0.60, aiPrediction: 26, risk: 'Sedang',
        summary: 'Kegiatan bersih lingkungan tiap akhir pekan tetap dijaga.'
      },
      {
        year: 2023, month: 5, cases: 172, humidity: 83, rhSuitability: 0.66, aiPrediction: 29, risk: 'Sedang',
        summary: 'Prediksi AI mendekati waspada, distribusikan larvasida.'
      },
      {
        year: 2023, month: 6, cases: 196, humidity: 84, rhSuitability: 0.70, aiPrediction: 32, risk: 'Tinggi',
        summary: 'Perlu monitoring jentik serentak bersama RT/RW.'
      },
      {
        year: 2023, month: 7, cases: 228, humidity: 85, rhSuitability: 0.74, aiPrediction: 35, risk: 'Tinggi',
        summary: 'Kondisi lembab, fokus cek tempat penampungan besar.'
      },
      {
        year: 2023, month: 8, cases: 214, humidity: 84, rhSuitability: 0.72, aiPrediction: 34, risk: 'Tinggi',
        summary: 'Lanjutkan kerja bakti dan pelaporan digital warga.'
      },
      {
        year: 2023, month: 9, cases: 206, humidity: 83, rhSuitability: 0.69, aiPrediction: 31, risk: 'Sedang',
        summary: 'Kasus turun perlahan, tetap pantau pot dan dispenser.'
      },
      {
        year: 2023, month: 10, cases: 184, humidity: 82, rhSuitability: 0.65, aiPrediction: 28, risk: 'Sedang',
        summary: 'Musim peralihan, saluran air harus bersih.'
      },
      {
        year: 2023, month: 11, cases: 166, humidity: 81, rhSuitability: 0.60, aiPrediction: 25, risk: 'Sedang',
        summary: 'Penyuluhan sekolah efektifkan gerakan Jumat Bersih.'
      },
      {
        year: 2023, month: 12, cases: 152, humidity: 80, rhSuitability: 0.57, aiPrediction: 23, risk: 'Sedang',
        summary: 'Menjelang liburan, cek kembali roof gutter rumah.'
      },
      // 2024
      {
        year: 2024, month: 1, cases: 162, humidity: 80, rhSuitability: 0.58, aiPrediction: 24, risk: 'Sedang',
        summary: 'Awal tahun, data stabil namun tetap giat pemantauan.'
      },
      {
        year: 2024, month: 2, cases: 176, humidity: 81, rhSuitability: 0.62, aiPrediction: 26, risk: 'Sedang',
        summary: 'Tambahkan inspeksi titik rawan di fasilitas umum.'
      },
      {
        year: 2024, month: 3, cases: 205, humidity: 83, rhSuitability: 0.68, aiPrediction: 30, risk: 'Tinggi',
        summary: 'Curah hujan tinggi, tingkatkan pengawasan sekolah.'
      },
      {
        year: 2024, month: 4, cases: 190, humidity: 82, rhSuitability: 0.66, aiPrediction: 29, risk: 'Sedang',
        summary: 'Fogging fokus dilaksanakan pada permintaan warga.'
      },
      {
        year: 2024, month: 5, cases: 222, humidity: 84, rhSuitability: 0.72, aiPrediction: 33, risk: 'Tinggi',
        summary: 'Kegiatan 3M massal perlu diperluas ke pasar tradisional.'
      },
      {
        year: 2024, month: 6, cases: 248, humidity: 85, rhSuitability: 0.75, aiPrediction: 35, risk: 'Tinggi',
        summary: 'Kelembaban mencapai puncak, jadwalkan evaluasi RT.'
      },
      {
        year: 2024, month: 7, cases: 276, humidity: 86, rhSuitability: 0.78, aiPrediction: 37, risk: 'Tinggi',
        summary: 'Peningkatan signifikan, aktifkan sistem peringatan dini.'
      },
      {
        year: 2024, month: 8, cases: 258, humidity: 85, rhSuitability: 0.76, aiPrediction: 36, risk: 'Tinggi',
        summary: 'Tetap lakukan penyuluhan door to door oleh kader.'
      },
      {
        year: 2024, month: 9, cases: 244, humidity: 84, rhSuitability: 0.72, aiPrediction: 32, risk: 'Sedang',
        summary: 'Mulai terjadi penurunan, pantau bak penampungan tinggi.'
      },
      {
        year: 2024, month: 10, cases: 228, humidity: 83, rhSuitability: 0.69, aiPrediction: 30, risk: 'Sedang',
        summary: 'Pelaporan warga masih penting untuk validasi data.'
      },
      {
        year: 2024, month: 11, cases: 206, humidity: 82, rhSuitability: 0.65, aiPrediction: 27, risk: 'Sedang',
        summary: 'Intensifkan lomba kawasan bebas jentik antar RT.'
      },
      {
        year: 2024, month: 12, cases: 188, humidity: 81, rhSuitability: 0.60, aiPrediction: 25, risk: 'Sedang',
        summary: 'Menjelang akhir tahun, jadwalkan penyemprotan fokus.'
      },
      // 2025
      {
        year: 2025, month: 1, cases: 176, humidity: 80, rhSuitability: 0.60, aiPrediction: 26, risk: 'Sedang',
        summary: 'Awal tahun 2025 terkendali, lanjutkan patroli jumantik.'
      },
      {
        year: 2025, month: 2, cases: 194, humidity: 82, rhSuitability: 0.64, aiPrediction: 28, risk: 'Sedang',
        summary: 'Koordinasi kelurahan untuk pendataan rumah kosong.'
      },
      {
        year: 2025, month: 3, cases: 226, humidity: 84, rhSuitability: 0.70, aiPrediction: 32, risk: 'Tinggi',
        summary: 'Potensi lonjakan, siapkan logistik fogging dan abate.'
      },
      {
        year: 2025, month: 4, cases: 214, humidity: 83, rhSuitability: 0.68, aiPrediction: 31, risk: 'Sedang',
        summary: 'Kampanye 3M di tempat ibadah terus diperkuat.'
      },
      {
        year: 2025, month: 5, cases: 238, humidity: 84, rhSuitability: 0.73, aiPrediction: 34, risk: 'Tinggi',
        summary: 'Libatkan karang taruna sebagai duta anti jentik.'
      },
      {
        year: 2025, month: 6, cases: 264, humidity: 85, rhSuitability: 0.77, aiPrediction: 36, risk: 'Tinggi',
        summary: 'Kelembaban tinggi, monitor wadah air darurat event besar.'
      },
      {
        year: 2025, month: 7, cases: 294, humidity: 87, rhSuitability: 0.81, aiPrediction: 38, risk: 'Tinggi',
        summary: 'Segmentasi wilayah prioritas untuk fogging terjadwal.'
      },
      {
        year: 2025, month: 8, cases: 278, humidity: 86, rhSuitability: 0.79, aiPrediction: 37, risk: 'Tinggi',
        summary: 'Pantau sumur gali dan toren tinggi di wilayah padat.'
      },
      {
        year: 2025, month: 9, cases: 262, humidity: 85, rhSuitability: 0.75, aiPrediction: 34, risk: 'Tinggi',
        summary: 'Tetap lakukan survei jentik mingguan oleh kader remaja.'
      },
      {
        year: 2025, month: 10, cases: 248, humidity: 84, rhSuitability: 0.72, aiPrediction: 32, risk: 'Sedang',
        summary: 'Penerapan gotong royong bulanan menjaga tren menurun.'
      },
      {
        year: 2025, month: 11, cases: 232, humidity: 83, rhSuitability: 0.70, aiPrediction: 30, risk: 'Sedang',
        summary: 'Sosialisasi akhir tahun untuk arus mudik warga dipersiapkan.'
      },
      {
        year: 2025, month: 12, cases: 216, humidity: 82, rhSuitability: 0.66, aiPrediction: 28, risk: 'Sedang',
        summary: 'Evaluasi tahunan dan perencanaan 2026 dimulai.'
      },
    ];
  }

  function aggregateReports() {
    return readReports().reduce((acc, entry) => {
      const time = new Date(entry.ts);
      if (Number.isNaN(time.getTime())) return acc;
      const key = `${time.getFullYear()}-${String(time.getMonth() + 1).padStart(2, '0')}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  function setFilteredData(data) {
    filteredData = data;
    updateChartsWithReports();
    updateTable(filteredData);
    if (filteredData.length) {
      const latest = filteredData[filteredData.length - 1];
      updateMapImages(latest);
      renderRegionalList(latest);
    }
  }

  function updateChartsWithReports() {
    if (!filteredData.length) return;
    const reportsByMonth = aggregateReports();
    const labels = filteredData.map((item) => item.label);
    const casesDataset = filteredData.map((item) => item.cases + (reportsByMonth[item.id] || 0));
    const humidityDataset = filteredData.map((item) => item.humidity);
    const suitabilityDataset = filteredData.map((item) => Math.round(item.rhSuitability * 100));

    renderCasesChart(labels, casesDataset);
    renderHumidityChart(labels, humidityDataset, suitabilityDataset);
    renderSparkline();
  }

  function renderCasesChart(labels, data) {
    const canvas = document.getElementById('casesChart');
    if (!canvas || typeof Chart === 'undefined') return;
    if (!casesChart) {
      casesChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Kasus DBD',
            data,
            borderColor: '#D52A3A',
            backgroundColor: 'rgba(213,42,58,0.16)',
            tension: 0.32,
            fill: true,
            borderWidth: 3,
            pointRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.parsed.y} kasus`,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Kasus per 100.000 penduduk' },
            },
          },
        },
      });
    } else {
      casesChart.data.labels = labels;
      casesChart.data.datasets[0].data = data;
      casesChart.update();
    }
  }

  function renderHumidityChart(labels, humidity, suitability) {
    const canvas = document.getElementById('humidityChart');
    if (!canvas || typeof Chart === 'undefined') return;
    if (!humidityChart) {
      humidityChart = new Chart(canvas.getContext('2d'), {
        data: {
          labels,
          datasets: [
            {
              type: 'bar',
              label: 'Kelembaban (%)',
              data: humidity,
              yAxisID: 'y',
              backgroundColor: 'rgba(213,42,58,0.24)',
              borderColor: 'rgba(213,42,58,0.65)',
              borderRadius: 8,
            },
            {
              type: 'line',
              label: 'Kesesuaian RH (%)',
              data: suitability,
              yAxisID: 'y1',
              borderColor: '#A1122A',
              backgroundColor: 'rgba(161,18,42,0.18)',
              tension: 0.3,
              fill: false,
              pointRadius: 3,
              borderWidth: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: true } },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: { display: true, text: 'Kelembaban (%)' },
            },
            y1: {
              beginAtZero: true,
              max: 100,
              position: 'right',
              grid: { drawOnChartArea: false },
              title: { display: true, text: 'Kesesuaian RH (%)' },
            },
          },
        },
      });
    } else {
      humidityChart.data.labels = labels;
      humidityChart.data.datasets[0].data = humidity;
      humidityChart.data.datasets[1].data = suitability;
      humidityChart.update();
    }
  }

  function renderSparkline() {
    const canvas = document.getElementById('sparklineChart');
    if (!canvas || typeof Chart === 'undefined') return;
    const recent = monthlyData.slice(-6);
    const reportsByMonth = aggregateReports();
    const labels = recent.map((item) => item.label);
    const data = recent.map((item) => item.cases + (reportsByMonth[item.id] || 0));

    if (!sparklineChart) {
      sparklineChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
          labels,
          datasets: [{
            data,
            borderColor: '#D52A3A',
            backgroundColor: 'rgba(213,42,58,0.12)',
            tension: 0.35,
            fill: true,
            borderWidth: 2,
            pointRadius: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: { display: false, beginAtZero: true },
          },
        },
      });
    } else {
      sparklineChart.data.labels = labels;
      sparklineChart.data.datasets[0].data = data;
      sparklineChart.update();
    }

    const trendNote = document.getElementById('trendNote');
    if (trendNote && recent.length) {
      trendNote.textContent = `${recent[0].label} — ${recent[recent.length - 1].label}`;
    }
  }

  function resolveMapPattern(type) {
    if (window.BMKG_MAP_IMAGE_PATTERNS && window.BMKG_MAP_IMAGE_PATTERNS[type]) {
      return window.BMKG_MAP_IMAGE_PATTERNS[type];
    }
    return DEFAULT_MAP_IMAGE_PATTERNS[type];
  }

  function computeRegionalSnapshot(item) {
    if (!item) return [];
    const aiBase = item.aiPrediction || Math.max(1, item.cases / 12);
    const rhBase = Math.round(item.rhSuitability * 100);
    const monthName = monthNamesId[item.month - 1];

    return REGION_BASELINES.map((region) => {
      const adjustedAi = Math.max(0.5, +(aiBase * region.aiFactor).toFixed(1));
      const adjustedRh = Math.max(15, Math.min(99, Math.round(rhBase * region.rhFactor)));
      const { label, color } = getRiskMeta(adjustedAi);
      let advice = 'Pertahankan jadwal 3M Plus dan pantau laporan warga.';
      if (adjustedAi >= 10) {
        advice = 'Segera koordinasikan fogging fokus, distribusi larvasida, dan edukasi door to door.';
      } else if (adjustedAi >= 3) {
        advice = 'Jadwalkan inspeksi jentik mingguan dan aktivasi kader jumantik remaja.';
      } else {
        advice = 'Tetap lakukan pemeriksaan 10 titik rawan dan dokumentasikan hasil ronda jentik.';
      }
      return {
        ...region,
        ai: adjustedAi,
        rh: adjustedRh,
        label,
        color,
        advice,
        popup: `
          <strong>${region.name}</strong><br>
          AI: ${adjustedAi.toFixed(1)} / 100.000<br>
          RH: ${adjustedRh}%<br>
          Risiko: ${label}<br>
          ${monthName} ${item.year}
        `
      };
    });
  }

  function getRiskMeta(ai) {
    if (ai >= 10) return { label: 'Awas', color: '#D52A3A' };
    if (ai >= 3) return { label: 'Waspada', color: '#F39C12' };
    return { label: 'Aman', color: '#1ABC9C' };
  }

  function renderRegionalList(item) {
    const chips = document.getElementById('regionalList');
    const matrix = document.getElementById('regionalMatrix');
    const snapshot = computeRegionalSnapshot(item);

    if (chips) {
      chips.innerHTML = '';
      snapshot.slice(0, 4).forEach((region) => {
        const div = document.createElement('div');
        div.className = 'regional-chip';
        div.innerHTML = `
          <strong>${region.name}</strong>
          <span class="chip-metric">AI: ${region.ai.toFixed(1)} / 100.000</span>
          <span class="chip-metric">RH: ${region.rh}%</span>
          <span class="chip-risk" style="color:${region.color}"><span style="width:8px;height:8px;border-radius:50%;background:${region.color};display:inline-block"></span>${region.label}</span>
          <span class="chip-metric">${region.advice}</span>
        `;
        chips.appendChild(div);
      });
    }

    if (matrix) {
      matrix.innerHTML = '';
      snapshot.forEach((region) => {
        const card = document.createElement('article');
        card.className = 'regional-card';
        card.innerHTML = `
          <div class="regional-pill" style="background:${region.color}1a;color:${region.color}">${region.label}</div>
          <h4>${region.name}</h4>
          <div class="regional-meta">
            <span><strong>${region.ai.toFixed(1)}</strong> AI</span>
            <span><strong>${region.rh}%</strong> RH</span>
          </div>
          <p>${region.advice}</p>
        `;
        matrix.appendChild(card);
      });
    }
  }

  function loadMediaGallery() {
    const galleryRoot = document.getElementById('dbdGallery');
    const posterRoot = document.getElementById('dbdPosters');

    function populate(root, items) {
      if (!root) return;
      root.innerHTML = '';
      items.forEach((item) => {
        const figure = document.createElement('figure');
        figure.className = 'media-card';
        const img = document.createElement('img');
        img.src = item.url;
        img.alt = item.title;
        img.loading = 'lazy';
        img.referrerPolicy = 'no-referrer';
        img.onerror = () => {
          figure.classList.add('is-hidden');
        };

        const caption = document.createElement('figcaption');
        caption.innerHTML = `<strong>${item.title}</strong><span>${item.credit}</span>`;
        if (item.source) {
          const link = document.createElement('a');
          link.href = item.url;
          link.target = '_blank';
          link.rel = 'noopener';
          link.textContent = item.source;
          link.style.fontWeight = '600';
          caption.appendChild(link);
        }

        figure.appendChild(img);
        figure.appendChild(caption);
        root.appendChild(figure);
      });

      if (!root.children.length) {
        const empty = document.createElement('p');
        empty.className = 'muted';
        empty.textContent = 'Belum ada media yang dapat dimuat otomatis. Silakan periksa koneksi internet Anda.';
        root.appendChild(empty);
      }
    }

    populate(galleryRoot, MEDIA_SOURCES.gallery);
    populate(posterRoot, MEDIA_SOURCES.posters);
  }

  async function fetchNewsArticles() {
    try {
      const response = await fetch(NEWS_ENDPOINT, { mode: 'cors' });
      if (!response.ok) throw new Error('Gagal mengambil berita AyoSehat');
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const candidates = Array.from(
        doc.querySelectorAll('article, .card, .list-card, .media')
      );

      const articles = [];
      candidates.forEach((node) => {
        if (articles.length >= 6) return;
        const link = node.querySelector('a[href]');
        if (!link) return;
        const titleNode = node.querySelector('h1, h2, h3, .title');
        const descNode = node.querySelector('p');
        const dateNode = node.querySelector('time, .date, .meta time');

        const title = (titleNode && titleNode.textContent.trim()) || link.textContent.trim();
        if (!title || title.length < 6) return;

        const url = link.href.startsWith('http') ? link.href : new URL(link.getAttribute('href'), NEWS_ENDPOINT).toString();
        const excerpt = descNode ? descNode.textContent.trim() : '';
        const date = dateNode ? dateNode.textContent.trim() : '';

        articles.push({ title, url, excerpt, date });
      });

      if (!articles.length) throw new Error('Struktur halaman tidak sesuai');
      return articles.slice(0, 6);
    } catch (error) {
      console.warn('Menggunakan fallback berita Kemenkes:', error.message);
      return FALLBACK_NEWS;
    }
  }

  function renderNewsSection(items) {
    const container = document.getElementById('dbdNewsList');
    if (!container) return;
    container.innerHTML = '';

    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'muted';
      empty.textContent = 'Belum ada berita terbaru yang dapat ditampilkan saat ini.';
      container.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'news-card';
      card.innerHTML = `
        <div class="news-meta">
          ${item.date ? `<span>${item.date}</span>` : ''}
          <span>AyoSehat Kemenkes</span>
        </div>
        <h3><a href="${item.url}" target="_blank" rel="noopener">${item.title}</a></h3>
        ${item.excerpt ? `<p>${item.excerpt}</p>` : ''}
        <a class="news-link" href="${item.url}" target="_blank" rel="noopener">Baca selengkapnya</a>
      `;
      container.appendChild(card);
    });
  }

  function updateMapImages(item) {
    if (!item) return;
    const month = String(item.month).padStart(2, '0');
    const monthName = monthNamesId[item.month - 1];

    MAP_IMAGE_TARGETS.forEach(({ id, type }) => {
      const img = document.getElementById(id);
      if (!img) return;
      const pattern = resolveMapPattern(type);
      const placeholder = document.querySelector(`[data-fallback-for="${id}"]`);

      if (!pattern) {
        if (placeholder) placeholder.classList.remove('hidden');
        return;
      }

      const url = pattern.replace('{year}', item.year).replace('{month}', month);
      img.alt = type === 'ai'
        ? `Prediksi angka insiden BMKG ${monthName} ${item.year}`
        : `Prediksi kesesuaian kelembaban BMKG ${monthName} ${item.year}`;
      if (placeholder) placeholder.classList.add('hidden');

      img.onload = () => {
        if (placeholder) placeholder.classList.add('hidden');
      };
      img.onerror = () => {
        if (placeholder) placeholder.classList.remove('hidden');
      };

      img.src = url;
    });
  }

  function updateInsights() {
    const latest = monthlyData[monthlyData.length - 1];
    const previous = monthlyData[monthlyData.length - 2];
    if (!latest) return;

    const casesEl = document.getElementById('metricCases');
    const casesDeltaEl = document.getElementById('metricCasesDelta');
    const humidityEl = document.getElementById('metricHumidity');
    const humidityNoteEl = document.getElementById('metricHumidityNote');
    const riskEl = document.getElementById('metricRisk');
    const riskNoteEl = document.getElementById('metricRiskNote');

    if (casesEl) casesEl.textContent = latest.cases.toLocaleString('id-ID');
    if (casesDeltaEl) {
      if (!previous) {
        casesDeltaEl.textContent = 'Data historis belum lengkap.';
      } else {
        const diff = latest.cases - previous.cases;
        const prefix = diff > 0 ? 'Naik' : diff < 0 ? 'Turun' : 'Stabil';
        casesDeltaEl.textContent = `${prefix} ${Math.abs(diff)} kasus dibanding bulan lalu.`;
      }
    }

    if (humidityEl) humidityEl.textContent = `${latest.humidity}`;
    if (humidityNoteEl) {
      const suitability = Math.round(latest.rhSuitability * 100);
      humidityNoteEl.textContent = `Kesesuaian RH ${suitability}% untuk pertumbuhan nyamuk.`;
    }

    if (riskEl) riskEl.textContent = latest.risk;
    if (riskNoteEl) riskNoteEl.textContent = latest.summary || 'Pantau dan lakukan 3M Plus secara rutin.';

    updateMapImages(latest);
    renderRegionalList(latest);
  }

  function renderMapTimeline() {
    const container = document.getElementById('mapTimeline');
    if (!container) return;
    container.innerHTML = '';

    const recent = monthlyData.slice(-5);
    recent.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.id = item.id;
      button.textContent = item.label;
      button.classList.toggle('is-active', index === recent.length - 1);
      button.addEventListener('click', () => {
        document
          .querySelectorAll('.map-timeline button')
          .forEach((btn) => btn.classList.toggle('is-active', btn.dataset.id === item.id));
        updateMapContext(item);
      });
      container.appendChild(button);
    });

    if (recent.length) {
      updateMapContext(recent[recent.length - 1]);
    }
  }

  function updateMapContext(item) {
    if (!item) return;
    const risk = document.getElementById('mapRiskLabel');
    const humidity = document.getElementById('mapHumidityLabel');
    const ai = document.getElementById('mapAIValue');
    const desc = document.getElementById('mapDescription');

    if (risk) risk.textContent = item.risk;
    if (humidity) humidity.textContent = `${item.humidity}`;
    if (ai) ai.textContent = (item.aiPrediction || item.cases).toLocaleString('id-ID');
    if (desc) {
      const monthName = monthNamesId[item.month - 1];
      desc.textContent = `${monthName} ${item.year} · ${item.summary}`;
    }

    updateMapImages(item);
    renderRegionalList(item);
  }

  function updateTable(data) {
    const tbody = document.getElementById('statsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const reportsByMonth = aggregateReports();

    data.forEach((item) => {
      const tr = document.createElement('tr');
      const adjustedCases = item.cases + (reportsByMonth[item.id] || 0);

      const cells = [
        monthNamesId[item.month - 1],
        item.year,
        adjustedCases.toLocaleString('id-ID'),
        `${item.humidity}%`,
        `${Math.round(item.rhSuitability * 100)}%`,
        (item.aiPrediction || adjustedCases).toLocaleString('id-ID'),
      ].map((value) => {
        const td = document.createElement('td');
        td.textContent = value;
        td.style.padding = '10px';
        td.style.border = '1px solid #e5e9f0';
        return td;
      });

      cells.forEach((cell) => tr.appendChild(cell));
      tbody.appendChild(tr);
    });
  }

  const filterBtn = document.getElementById('filterBtn');
  if (filterBtn) {
    filterBtn.addEventListener('click', () => {
      const yearSelect = document.getElementById('yearSelect');
      const monthSelect = document.getElementById('monthSelect');
      const selectedYear = Number(yearSelect?.value || 0);
      const selectedMonth = monthSelect?.value || 'all';

      if (!selectedYear) {
        showToast('Pilih tahun terlebih dahulu.');
        return;
      }

      let subset = monthlyData.filter((item) => item.year === selectedYear);
      if (selectedMonth !== 'all') {
        const monthInt = Number(selectedMonth);
        subset = subset.filter((item) => item.month === monthInt);
      }

      if (!subset.length) {
        showToast('Data belum tersedia untuk filter yang dipilih.');
        return;
      }

      setFilteredData(subset);
    });
  }

  function initMapSwitchers() {
    document.querySelectorAll('[data-map-switcher]').forEach((switcher) => {
      const buttons = switcher.querySelectorAll('button[data-target]');
      const frameWrapper = switcher.nextElementSibling;
      if (!buttons.length || !frameWrapper) return;
      buttons.forEach((button) => {
        button.addEventListener('click', () => {
          const target = button.dataset.target;
          buttons.forEach((btn) => btn.classList.toggle('is-active', btn === button));
          frameWrapper.querySelectorAll('.map-embed').forEach((pane) => {
            pane.classList.toggle('is-active', pane.id === target);
          });
        });
      });
    });
  }

  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });

    const targets = document.querySelectorAll('.card-reveal');
    targets.forEach(target => observer.observe(target));
  }

  function initMapEmbedFallback() {
    document.querySelectorAll('[data-map-type="bmkg"]').forEach((frame) => {
      const fallback = frame.parentElement.querySelector('.map-frame__fallback');
      if (!fallback) return;
      let loaded = false;
      frame.addEventListener('load', () => {
        loaded = true;
        fallback.hidden = true;
      });
      frame.addEventListener('error', () => {
        fallback.hidden = false;
      });
      setTimeout(() => {
        if (!loaded) fallback.hidden = false;
      }, 6000);
    });
  }

  window.addEventListener('load', async () => {
    await fetchDBDData();
    updateInsights();
    renderMapTimeline();
    initMapSwitchers();
    initMapEmbedFallback();
    loadMediaGallery();
    initScrollAnimations();
    const newsItems = await fetchNewsArticles();
    renderNewsSection(newsItems);

    const latestYear = monthlyData.length ? monthlyData[monthlyData.length - 1].year : new Date().getFullYear();
    const yearSelect = document.getElementById('yearSelect');
    if (yearSelect && !Array.from(yearSelect.options).some((opt) => Number(opt.value) === latestYear)) {
      const option = document.createElement('option');
      option.value = String(latestYear);
      option.textContent = latestYear;
      option.selected = true;
      yearSelect.appendChild(option);
    } else if (yearSelect) {
      yearSelect.value = String(latestYear);
    }

    const defaultSubset = monthlyData.filter((item) => item.year === latestYear);
    setFilteredData(defaultSubset.length ? defaultSubset : monthlyData);
  });
})();

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        const swPath = window.location.pathname.includes('/pages/') ? '../sw.js' : './sw.js';
        navigator.serviceWorker.register(swPath)
            .then(registration => console.log('SW registered: ', registration.scope))
            .catch(err => console.log('SW registration failed: ', err));
    });
}
