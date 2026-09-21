export const mockSurveyQuestions = [
  { id: 1, type: 'boolean', text: 'Apakah keluarga mengikuti program Keluarga Berencana (KB)?', condition: { type: 'family' } },
  { id: 2, type: 'boolean', text: 'Apakah ibu melakukan persalinan di fasilitas kesehatan?', condition: { type: 'family' } },
  { id: 3, type: 'boolean', text: 'Apakah bayi mendapat imunisasi dasar lengkap?', condition: { type: 'age_max', value: 1 } },
  { id: 4, type: 'boolean', text: 'Apakah bayi diberi ASI eksklusif selama 6 bulan?', condition: { type: 'age_max', value: 1 } },
  { id: 5, type: 'boolean', text: 'Apakah balita mendapatkan pemantauan pertumbuhan?', condition: { type: 'age_max', value: 5 } },
  { id: 6, type: 'boolean', text: 'Apakah penderita tuberkulosis paru berobat sesuai standar?', condition: { type: 'disease', value: 'tb' } },
  { id: 7, type: 'boolean', text: 'Apakah penderita hipertensi berobat teratur?', condition: { type: 'disease', value: 'hipertensi' } },
  { id: 8, type: 'boolean', text: 'Apakah penderita gangguan jiwa berat berobat dan tidak ditelantarkan?', condition: { type: 'disease', value: 'gangguan_jiwa' } },
  { id: 9, type: 'boolean', text: 'Apakah anggota keluarga tidak ada yang merokok?', condition: { type: 'age_min', value: 10 } },
  { id: 10, type: 'boolean', text: 'Apakah keluarga sudah menjadi anggota JKN?', condition: { type: 'family' } },
  { id: 11, type: 'boolean', text: 'Apakah keluarga mempunyai akses sarana air bersih?', condition: { type: 'family' } },
  { id: 12, type: 'boolean', text: 'Apakah keluarga mempunyai akses atau menggunakan jamban sehat?', condition: { type: 'family' } }
];

export const mockKaderDashboardStats = {
  totalSurveys: 120,
  targetYearly: 500,
  targetDaily: 5,
  draftSurveys: [
    { id: '1', familyHead: 'Budi Santoso', address: 'RT 01 / RW 02, Desa Sukamaju', lastUpdated: '2026-06-07T10:00:00Z' },
    { id: '2', familyHead: 'Siti Aminah', address: 'RT 03 / RW 02, Desa Sukamaju', lastUpdated: '2026-06-06T15:30:00Z' }
  ],
  followUpInterventions: [
    { id: '101', familyHead: 'Agus Salim', issue: 'Merokok di dalam rumah', status: 'Tidak Sehat' }
  ]
};

export const mockAdminStats = {
  totalFamilies: 5430,
  healthyFamilies: 3200,
  preHealthyFamilies: 1500,
  unhealthyFamilies: 730,
  ikSScore: 0.589, // Indeks Keluarga Sehat
  regionRankings: [
    { name: 'Kec. Sukamaju', score: 0.82 },
    { name: 'Kec. Harapan', score: 0.65 },
    { name: 'Kec. Cempaka', score: 0.45 }
  ]
};

export const mockGeoJson = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Kec. Sukamaju", status: "Sehat", color: "#10b981", IKS: 0.82 },
      geometry: { type: "Polygon", coordinates: [[[106.8, -6.2], [106.9, -6.2], [106.9, -6.3], [106.8, -6.3], [106.8, -6.2]]] }
    },
    {
      type: "Feature",
      properties: { name: "Kec. Harapan", status: "Tidak Sehat", color: "#f59e0b", IKS: 0.65 },
      geometry: { type: "Polygon", coordinates: [[[106.9, -6.2], [107.0, -6.2], [107.0, -6.3], [106.9, -6.3], [106.9, -6.2]]] }
    },
    {
      type: "Feature",
      properties: { name: "Kec. Cempaka", status: "Tidak Sehat", color: "#ef4444", IKS: 0.45 },
      geometry: { type: "Polygon", coordinates: [[[106.8, -6.3], [106.9, -6.3], [106.9, -6.4], [106.8, -6.4], [106.8, -6.3]]] }
    }
  ]
};
