export const MOCK_ACCOUNTS = [
  {
    role: 'kader',
    label: 'Kader',
    username: 'kader',
    password: 'kader123',
    name: 'Budi Kurniawan',
    email: 'kader@sisphs.test',
    duty_location: 'Desa Sukamaju',
  },
  {
    role: 'puskesmas',
    label: 'Puskesmas',
    username: 'puskesmas',
    password: 'puskesmas123',
    name: 'dr. Rina Puskesmas',
    email: 'puskesmas@sisphs.test',
    duty_location: 'Puskesmas Sukamaju',
  },
  {
    role: 'dinkes',
    label: 'Dinkes',
    username: 'dinkes',
    password: 'dinkes123',
    name: 'Tim Dinkes Kabupaten',
    email: 'dinkes@sisphs.test',
    duty_location: 'Dinas Kesehatan',
  },
  {
    role: 'admin',
    label: 'Admin',
    username: 'admin',
    password: 'admin123',
    name: 'Admin SIS-PHS',
    email: 'admin@sisphs.test',
    duty_location: 'Pusat Sistem',
  },
]

export function getMockAccountByRole(roleRaw) {
  return MOCK_ACCOUNTS.find((account) => account.role === roleRaw) || MOCK_ACCOUNTS[0]
}

export function getMockAccountByCredentials(username, password) {
  return MOCK_ACCOUNTS.find((account) => account.username === username && account.password === password) || null
}
