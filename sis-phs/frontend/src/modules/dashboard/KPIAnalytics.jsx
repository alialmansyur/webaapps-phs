import { useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Activity, Users, FileText, TrendingUp, Filter, Download } from 'lucide-react';

export default function KPIAnalytics() {
  const [filterYear, setFilterYear] = useState('2026');

  // Dummy data for Donut Chart
  const donutOptions = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: ['Sehat', 'Tidak Sehat'],
    colors: ['#14b8a6', '#f59e0b', '#ef4444'],
    plotOptions: {
      pie: {
        donut: { size: '75%' }
      }
    },
    dataLabels: { enabled: false },
    legend: { position: 'bottom' },
    stroke: { width: 0 }
  };
  const donutSeries = [65, 25, 10];

  // Dummy data for Bar Chart
  const barOptions = {
    chart: { type: 'bar', fontFamily: 'inherit', toolbar: { show: false } },
    colors: ['#14b8a6'],
    plotOptions: {
      bar: { borderRadius: 6, horizontal: false, columnWidth: '45%' }
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { show: false },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
  };
  const barSeries = [{ name: 'Survei Masuk', data: [120, 150, 180, 220, 300, 280, 350, 410, 400, 450, 500, 600] }];

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-xl">
              <Activity size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard Analitik</h2>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ringkasan capaian Indeks Data Sehat (IKS) tingkat wilayah.</p>
        </div>
        
        <div className="flex gap-3">
          <select 
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal-500 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            <option value="2026">Tahun 2026</option>
            <option value="2025">Tahun 2025</option>
          </select>
          <button className="flex items-center gap-2 px-5 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl text-sm font-bold transition-all">
            <Download size={18} />
            <span className="hidden sm:inline">Export Laporan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Responden Disurvei', value: '124,592', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Indeks Data Sehat', value: '0.650', icon: TrendingUp, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10' },
          { label: 'Intervensi Berjalan', value: '3,402', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
          { label: 'Total Kader Aktif', value: '1,820', icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-start gap-4">
            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} flex-shrink-0`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white">Tren Kunjungan Survei ({filterYear})</h3>
            <button className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
              <Filter size={18} />
            </button>
          </div>
          <div className="h-[300px]">
            <ReactApexChart options={barOptions} series={barSeries} type="bar" height="100%" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6">Proporsi Status IKS</h3>
          <div className="h-[300px] flex items-center justify-center">
            <ReactApexChart options={donutOptions} series={donutSeries} type="donut" height="100%" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-white">Capaian 12 Indikator PHS</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Indikator</th>
                <th className="p-4 font-bold">Target</th>
                <th className="p-4 font-bold">Capaian</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {[
                { ind: '1. Responden mengikuti KB', target: '80%', cap: '65%', status: 'Perlu Perhatian', color: 'text-amber-500 bg-amber-50' },
                { ind: '2. Persalinan di Faskes', target: '100%', cap: '98%', status: 'Tercapai', color: 'text-teal-600 bg-teal-50' },
                { ind: '3. Bayi mendapat imunisasi dasar', target: '90%', cap: '92%', status: 'Tercapai', color: 'text-teal-600 bg-teal-50' },
                { ind: '4. Tidak ada anggota yang merokok', target: '50%', cap: '42%', status: 'Perlu Perhatian', color: 'text-amber-500 bg-amber-50' },
              ].map((d, i) => (
                <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-slate-800 dark:text-slate-200">{d.ind}</td>
                  <td className="p-4 text-slate-500">{d.target}</td>
                  <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{d.cap}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${d.color}`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


