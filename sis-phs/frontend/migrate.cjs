const fs = require('fs');
const path = require('path');

const pagesConfig = [
  { path: 'surveyor/surveys', name: 'DraftSurveys', title: 'Draft Survei', headers: "'No. KK', 'Kepala Keluarga', 'Alamat', 'Status Draft', 'Aksi'", data: "[ {kk:'320101...', nama:'Budi Santoso', alamat:'RT 01/RW 02', status:'Belum Lengkap'}, {kk:'320102...', nama:'Siti Aminah', alamat:'RT 03/RW 01', status:'Menunggu Sinyal'} ].map((d,i) => <tr key={i}><td className='px-6 py-4 text-sm font-medium'>{d.kk}</td><td className='px-6 py-4'>{d.nama}</td><td className='px-6 py-4'>{d.alamat}</td><td className='px-6 py-4 text-amber-600 dark:text-amber-400'>{d.status}</td><td className='px-6 py-4 text-blue-500 cursor-pointer'>Lanjutkan</td></tr>)" },
  { path: 'surveyor/surveys', name: 'HistorySurveys', title: 'Riwayat Terkirim', headers: "'No. KK', 'Kepala Keluarga', 'Skor IKS', 'Status', 'Tanggal'", data: "[ {kk:'320101...', nama:'Ahmad Dhani', iks:'0.800', status:'Sehat', tgl:'12 Jun 2026'}, {kk:'320102...', nama:'Rina Nose', iks:'0.300', status:'Tidak Sehat', tgl:'10 Jun 2026'} ].map((d,i) => <tr key={i}><td className='px-6 py-4'>{d.kk}</td><td className='px-6 py-4 font-medium'>{d.nama}</td><td className='px-6 py-4 font-bold'>{d.iks}</td><td className='px-6 py-4'><span className={`px-2 py-1 rounded text-xs ${d.status==='Sehat'?'bg-emerald-100 text-emerald-700':'bg-rose-100 text-rose-700'}`}>{d.status}</span></td><td className='px-6 py-4 text-slate-500'>{d.tgl}</td></tr>)" },
  { path: 'surveyor/interventions', name: 'InterventionSchedule', title: 'Jadwal Intervensi', headers: "'Sasaran', 'Alamat', 'Masalah Utama', 'Tgl Rencana', 'Aksi'", data: "[ {nama:'Keluarga Rina', alamat:'RT 03/RW 01', masalah:'Anggota merokok, Belum KB', tgl:'15 Jun 2026'}, {nama:'Keluarga Joko', alamat:'RT 02/RW 01', masalah:'Tidak ada akses air bersih', tgl:'16 Jun 2026'} ].map((d,i) => <tr key={i}><td className='px-6 py-4 font-medium'>{d.nama}</td><td className='px-6 py-4'>{d.alamat}</td><td className='px-6 py-4 text-rose-600'>{d.masalah}</td><td className='px-6 py-4'>{d.tgl}</td><td className='px-6 py-4 text-blue-500 cursor-pointer'>Catat Edukasi</td></tr>)" },
  { path: 'surveyor/interventions', name: 'InterventionLog', title: 'Log Edukasi', headers: "'Sasaran', 'Topik Edukasi', 'Tanggal', 'Hasil', 'Aksi'", data: "[ {nama:'Keluarga Budi', topik:'Edukasi Stop Merokok', tgl:'05 Jun 2026', hasil:'Berjanji mengurangi merokok'}, {nama:'Keluarga Siti', topik:'Penggunaan Jamban', tgl:'02 Jun 2026', hasil:'Akan membangun septic tank'} ].map((d,i) => <tr key={i}><td className='px-6 py-4 font-medium'>{d.nama}</td><td className='px-6 py-4'>{d.topik}</td><td className='px-6 py-4 text-slate-500'>{d.tgl}</td><td className='px-6 py-4'>{d.hasil}</td><td className='px-6 py-4 text-blue-500 cursor-pointer'>Detail</td></tr>)" },
  { path: 'surveyor/profile', name: 'WilayahBinaan', title: 'Wilayah Binaan', headers: "'RT/RW', 'Total KK', 'Sudah Disurvei', 'IKS Rata-rata', 'Status'", data: "[ {rt:'RT 01 / RW 01', total:45, done:40, iks:0.650, status:'Pra-Sehat'}, {rt:'RT 02 / RW 01', total:50, done:10, iks:0.320, status:'Tidak Sehat'} ].map((d,i) => <tr key={i}><td className='px-6 py-4 font-medium'>{d.rt}</td><td className='px-6 py-4'>{d.total}</td><td className='px-6 py-4'>{d.done}</td><td className='px-6 py-4 font-bold text-amber-600'>{d.iks}</td><td className='px-6 py-4'>{d.status}</td></tr>)" },
  { path: 'surveyor/profile', name: 'SyncData', title: 'Sinkronisasi Data', headers: "'Tipe Data', 'Terakhir Sinkronisasi', 'Status', 'Aksi'", data: "[ {tipe:'Master Wilayah', tgl:'Hari ini, 08:00', status:'Up to date'}, {tipe:'Draft Survei (3 items)', tgl:'Belum disinkronisasi', status:'Pending Push'} ].map((d,i) => <tr key={i}><td className='px-6 py-4 font-medium'>{d.tipe}</td><td className='px-6 py-4 text-slate-500'>{d.tgl}</td><td className='px-6 py-4'>{d.status}</td><td className='px-6 py-4 text-blue-500 cursor-pointer'>Sinkronkan</td></tr>)" },
  { path: 'surveyor/profile', name: 'ProfileKader', title: 'Pengaturan Akun', headers: "'Atribut', 'Nilai', 'Aksi'", data: "[ {attr:'Nama Lengkap', val:'Siti Aminah Kader'}, {attr:'No. Telepon', val:'081234567890'}, {attr:'Area Tugas', val:'Desa Suka Maju'} ].map((d,i) => <tr key={i}><td className='px-6 py-4 font-medium text-slate-500'>{d.attr}</td><td className='px-6 py-4 font-medium'>{d.val}</td><td className='px-6 py-4 text-blue-500 cursor-pointer'>Ubah</td></tr>)" },
  { path: 'admin/dashboard', name: 'KPIAnalytics', title: 'Capaian Indikator', headers: "'Indikator PHS', 'Target Nasional', 'Capaian Saat Ini', 'Status', 'Trend'", data: "[ {ind:'1. Keluarga mengikuti KB', target:'80%', cap:'65%', status:'Perlu Perhatian', trend:'+5%'}, {ind:'2. Persalinan di Faskes', target:'100%', cap:'98%', status:'Tercapai', trend:'+1%'} ].map((d,i) => <tr key={i}><td className='px-6 py-4 font-medium'>{d.ind}</td><td className='px-6 py-4'>{d.target}</td><td className='px-6 py-4 font-bold text-emerald-600'>{d.cap}</td><td className='px-6 py-4'>{d.status}</td><td className='px-6 py-4 text-emerald-500'>{d.trend}</td></tr>)" },
  { path: 'admin/surveys', name: 'SurveyValidation', title: 'Validasi Data', headers: "'Tgl Masuk', 'Kader', 'Keluarga', 'Nilai IKS', 'Aksi'", data: "[ {tgl:'10 Jun 2026', kader:'Siti Aminah', kk:'Kel. Budi', iks:'0.800'}, {tgl:'11 Jun 2026', kader:'Bambang S', kk:'Kel. Joko', iks:'0.450'} ].map((d,i) => <tr key={i}><td className='px-6 py-4 text-slate-500'>{d.tgl}</td><td className='px-6 py-4 font-medium'>{d.kader}</td><td className='px-6 py-4'>{d.kk}</td><td className='px-6 py-4 font-bold'>{d.iks}</td><td className='px-6 py-4 flex gap-3'><button className='text-emerald-600 font-medium'>Terima</button><button className='text-rose-600 font-medium'>Tolak</button></td></tr>)" },
  { path: 'admin/surveys', name: 'SurveyDatabase', title: 'Database Keluarga', headers: "'No. KK', 'Kepala Keluarga', 'Desa/Kelurahan', 'IKS', 'Status', 'Aksi'", data: "[ {kk:'32010...', nama:'Budi Santoso', desa:'Suka Maju', iks:'0.800', status:'Sehat'}, {kk:'32011...', nama:'Ahmad Yani', desa:'Suka Mundur', iks:'0.300', status:'Tidak Sehat'} ].map((d,i) => <tr key={i}><td className='px-6 py-4 text-sm'>{d.kk}</td><td className='px-6 py-4 font-medium'>{d.nama}</td><td className='px-6 py-4'>{d.desa}</td><td className='px-6 py-4 font-bold'>{d.iks}</td><td className='px-6 py-4'><span className={`px-2 py-1 rounded text-xs ${d.status==='Sehat'?'bg-emerald-100 text-emerald-700':'bg-rose-100 text-rose-700'}`}>{d.status}</span></td><td className='px-6 py-4 text-blue-500 cursor-pointer'>Lihat</td></tr>)" },
  { path: 'admin/surveys', name: 'InterventionMonitoring', title: 'Monitoring Intervensi', headers: "'Keluarga Sasaran', 'Desa', 'Kader Bertugas', 'Progress', 'Status'", data: "[ {kk:'Kel. Rina', desa:'Suka Maju', kader:'Siti Aminah', prog:'2/3 Edukasi', status:'On Progress'}, {kk:'Kel. Joko', desa:'Suka Maju', kader:'Bambang S', prog:'0/1 Edukasi', status:'Pending'} ].map((d,i) => <tr key={i}><td className='px-6 py-4 font-medium'>{d.kk}</td><td className='px-6 py-4'>{d.desa}</td><td className='px-6 py-4'>{d.kader}</td><td className='px-6 py-4'>{d.prog}</td><td className='px-6 py-4 text-amber-600'>{d.status}</td></tr>)" },
  { path: 'admin/maps', name: 'HotspotMap', title: 'Hotspot Kerawanan', headers: "'Penyakit/Masalah', 'Desa/Kecamatan', 'Jumlah Kasus', 'Tingkat Kerawanan', 'Aksi'", data: "[ {masalah:'Hipertensi Tinggi', lokasi:'Kecamatan A', kasus:145, level:'Tinggi'}, {masalah:'Balita Tidak Imunisasi', lokasi:'Kecamatan B', kasus:89, level:'Sedang'} ].map((d,i) => <tr key={i}><td className='px-6 py-4 font-medium'>{d.masalah}</td><td className='px-6 py-4'>{d.lokasi}</td><td className='px-6 py-4 font-bold text-slate-700'>{d.kasus}</td><td className='px-6 py-4'><span className={`px-2 py-1 rounded text-xs ${d.level==='Tinggi'?'bg-rose-100 text-rose-700':'bg-amber-100 text-amber-700'}`}>{d.level}</span></td><td className='px-6 py-4 text-blue-500 cursor-pointer'>Lihat Peta</td></tr>)" },
  { path: 'admin/master', name: 'MasterQuestions', title: 'Kuesioner Survei', headers: "'Indikator PHS', 'Pertanyaan', 'Tipe Jawaban', 'Wajib', 'Aksi'", data: "[ {ind:'Keluarga Berencana', tanya:'Apakah ibu menggunakan alat kontrasepsi?', tipe:'Ya/Tidak', wajib:'Ya'}, {ind:'Persalinan Faskes', tanya:'Apakah persalinan ibu di Faskes?', tipe:'Ya/Tidak', wajib:'Kondisional'} ].map((d,i) => <tr key={i}><td className='px-6 py-4 font-medium'>{d.ind}</td><td className='px-6 py-4 text-sm'>{d.tanya}</td><td className='px-6 py-4'>{d.tipe}</td><td className='px-6 py-4 text-emerald-600'>{d.wajib}</td><td className='px-6 py-4 text-blue-500 cursor-pointer'>Edit</td></tr>)" },
  { path: 'admin/master', name: 'MasterScoring', title: 'Algoritma Skoring', headers: "'Aturan', 'Kondisi N (Not Applicable)', 'Bobot', 'Aksi'", data: "[ {aturan:'All-or-Nothing', n:'Keluarga tanpa Balita (Indikator 3,4 diabaikan)', bobot:'1/N', status:'Aktif'} ].map((d,i) => <tr key={i}><td className='px-6 py-4 font-medium'>{d.aturan}</td><td className='px-6 py-4 text-sm'>{d.n}</td><td className='px-6 py-4 font-mono'>{d.bobot}</td><td className='px-6 py-4 text-blue-500 cursor-pointer'>Edit</td></tr>)" },
  { path: 'admin/master', name: 'MasterRegions', title: 'Wilayah Administrasi', headers: "'Kode Wilayah', 'Tingkat', 'Nama Wilayah', 'Induk Wilayah', 'Aksi'", data: "[ {kode:'32.01', tkt:'Kabupaten', nama:'Kab. Bogor', induk:'Prov. Jawa Barat'}, {kode:'32.01.01', tkt:'Kecamatan', nama:'Cibinong', induk:'Kab. Bogor'} ].map((d,i) => <tr key={i}><td className='px-6 py-4 font-mono text-sm'>{d.kode}</td><td className='px-6 py-4'>{d.tkt}</td><td className='px-6 py-4 font-medium'>{d.nama}</td><td className='px-6 py-4'>{d.induk}</td><td className='px-6 py-4 text-blue-500 cursor-pointer'>Kelola</td></tr>)" },
  { path: 'admin/master', name: 'MasterFaskes', title: 'Fasilitas Kesehatan', headers: "'Kode Faskes', 'Nama Faskes', 'Jenis', 'Wilayah Kerja', 'Aksi'", data: "[ {kode:'P-001', nama:'Puskesmas Cibinong', jenis:'Puskesmas', wilayah:'Kec. Cibinong'}, {kode:'PU-001', nama:'Pustu Cikaret', jenis:'Puskesmas Pembantu', wilayah:'Kel. Cikaret'} ].map((d,i) => <tr key={i}><td className='px-6 py-4 font-mono text-sm'>{d.kode}</td><td className='px-6 py-4 font-medium'>{d.nama}</td><td className='px-6 py-4'>{d.jenis}</td><td className='px-6 py-4'>{d.wilayah}</td><td className='px-6 py-4 text-blue-500 cursor-pointer'>Edit</td></tr>)" },
  { path: 'admin/users', name: 'UserKader', title: 'Direktori Kader', headers: "'ID Pegawai', 'Nama Kader', 'Puskesmas Pembina', 'Area Tugas', 'Status'", data: "[ {id:'K-1029', nama:'Siti Aminah', pkm:'PKM Cibinong', area:'RW 01 Cikaret', stat:'Aktif'}, {id:'K-1030', nama:'Bambang S', pkm:'PKM Cibinong', area:'RW 02 Cikaret', stat:'Aktif'} ].map((d,i) => <tr key={i}><td className='px-6 py-4 font-mono text-sm'>{d.id}</td><td className='px-6 py-4 font-medium'>{d.nama}</td><td className='px-6 py-4'>{d.pkm}</td><td className='px-6 py-4'>{d.area}</td><td className='px-6 py-4 text-emerald-600'>Aktif</td></tr>)" },
  { path: 'admin/users', name: 'UserAdmin', title: 'Admin Internal', headers: "'Username', 'Nama Lengkap', 'Role', 'Instansi', 'Aksi'", data: "[ {user:'admin.cibinong', nama:'Dr. Andi', role:'Admin Puskesmas', inst:'PKM Cibinong'}, {user:'dinkes.bogor', nama:'Budi M.Kes', role:'Admin Dinkes', inst:'Dinkes Kab. Bogor'} ].map((d,i) => <tr key={i}><td className='px-6 py-4 font-mono text-sm'>{d.user}</td><td className='px-6 py-4 font-medium'>{d.nama}</td><td className='px-6 py-4'>{d.role}</td><td className='px-6 py-4'>{d.inst}</td><td className='px-6 py-4 text-blue-500 cursor-pointer'>Edit Akses</td></tr>)" },
  { path: 'admin/reports', name: 'ReportIKS', title: 'Laporan Wilayah', headers: "'Periode', 'Tingkat Wilayah', 'Nama Wilayah', 'IKS Rata-rata', 'Aksi'", data: "[ {per:'Tahun 2026', tkt:'Kecamatan', nama:'Cibinong', iks:'0.650'}, {per:'Tahun 2026', tkt:'Kecamatan', nama:'Citeureup', iks:'0.540'} ].map((d,i) => <tr key={i}><td className='px-6 py-4'>{d.per}</td><td className='px-6 py-4'>{d.tkt}</td><td className='px-6 py-4 font-medium'>{d.nama}</td><td className='px-6 py-4 font-bold text-amber-600'>{d.iks}</td><td className='px-6 py-4 text-teal-600 font-medium cursor-pointer'>Unduh PDF</td></tr>)" },
  { path: 'admin/reports', name: 'ReportRawData', title: 'Raw Data Export', headers: "'Nama Dataset', 'Deskripsi', 'Format', 'Terakhir Diperbarui', 'Aksi'", data: "[ {nama:'Raw Data Survei 2026', desc:'Seluruh data mentah survei KK', format:'CSV/Excel', tgl:'Hari ini, 09:00'}, {nama:'Data Intervensi', desc:'Laporan log kunjungan intervensi', format:'Excel', tgl:'Kemarin, 14:00'} ].map((d,i) => <tr key={i}><td className='px-6 py-4 font-medium'>{d.nama}</td><td className='px-6 py-4 text-sm'>{d.desc}</td><td className='px-6 py-4'>{d.format}</td><td className='px-6 py-4 text-slate-500'>{d.tgl}</td><td className='px-6 py-4 text-blue-500 font-medium cursor-pointer'>Generate</td></tr>)" },
  { path: 'admin/settings', name: 'SystemSettings', title: 'Pengaturan Aplikasi', headers: "'Kategori', 'Nama Pengaturan', 'Nilai Saat Ini', 'Aksi'", data: "[ {kat:'Umum', nama:'Tahun Anggaran Aktif', val:'2026'}, {kat:'Integrasi', nama:'API Key Maps', val:'*******xyz'} ].map((d,i) => <tr key={i}><td className='px-6 py-4 text-slate-500'>{d.kat}</td><td className='px-6 py-4 font-medium'>{d.nama}</td><td className='px-6 py-4 font-mono'>{d.val}</td><td className='px-6 py-4 text-blue-500 cursor-pointer'>Ubah</td></tr>)" },
  { path: 'admin/settings', name: 'AuditLogs', title: 'Audit Trail', headers: "'Waktu', 'User', 'Aktivitas', 'IP Address', 'Aksi'", data: "[ {tgl:'Hari ini, 10:15', user:'Dr. Andi', act:'Menyetujui Survei KK Budi', ip:'192.168.1.100'}, {tgl:'Kemarin, 09:00', user:'Siti Aminah', act:'Mengirim Draft Survei (3 data)', ip:'10.10.10.5'} ].map((d,i) => <tr key={i}><td className='px-6 py-4 text-sm text-slate-500'>{d.tgl}</td><td className='px-6 py-4 font-medium'>{d.user}</td><td className='px-6 py-4'>{d.act}</td><td className='px-6 py-4 font-mono text-xs text-slate-400'>{d.ip}</td><td className='px-6 py-4 text-blue-500 cursor-pointer'>Detail</td></tr>)" }
];

const template = `import { StatCard } from '../../../components/ui/StatCard';
import { FilterBar } from '../../../components/ui/FilterBar';
import { DataTable } from '../../../components/ui/DataTable';

export default function {{COMPONENT_NAME}}() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{{TITLE}}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Modul manajemen dan pantauan untuk {{TITLE}}.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Data" value="1,234" subtitle="Bulan ini" trend={5} color="blue" />
        <StatCard title="Aktif / Selesai" value="892" subtitle="Telah divalidasi" trend={12} color="emerald" />
        <StatCard title="Perhatian" value="42" subtitle="Butuh tindakan lanjut" trend={-2} color="amber" />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col">
        <FilterBar placeholder="Cari {{TITLE}}...">
          <select className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:text-white">
            <option value="">Semua Wilayah</option>
            <option value="1">Kecamatan A</option>
            <option value="2">Kecamatan B</option>
          </select>
          <button className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors dark:text-white">
            Export Data
          </button>
        </FilterBar>
        
        <div className="p-6">
          <DataTable 
            headers={[ {{HEADERS}} ]} 
            pagination={true}
          >
            { {{DATA}} }
          </DataTable>
        </div>
      </div>
    </div>
  );
}
`;

const srcPath = path.join('d:', '2. Project', 'WebApps SIS-PHS', 'sis-phs', 'frontend', 'src');

pagesConfig.forEach(page => {
  const dir = path.join(srcPath, 'modules', page.path);
  let content = template
    .replace(/\{\{COMPONENT_NAME\}\}/g, page.name)
    .replace(/\{\{TITLE\}\}/g, page.title)
    .replace(/\{\{HEADERS\}\}/g, page.headers)
    .replace(/\{\{DATA\}\}/g, page.data);

  fs.writeFileSync(path.join(dir, page.name + '.jsx'), content);
});
console.log('Done!');
