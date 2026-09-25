import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import { Upload, FileText, Zap, Droplet, Gauge, Map as MapIcon, MapPin, ArrowLeft, LayoutGrid, Activity, TrendingUp, Clock, Mountain, History as HistoryIcon, Trash2, Eye, EyeOff, Search, Filter, LogOut, AlertTriangle, Users, UserPlus, Shield } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// ALAMAT SERVER BACKEND KITA (SUDAH DIPERBAIKI)
const API_URL = '/api';

// Konfigurasi icon Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper: Membaca File & Parsing CSV
const readAsText = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (e) => resolve(e.target.result);
  reader.onerror = reject;
  reader.readAsText(file);
});

const parseCSV = (text) => new Promise(resolve => {
  const lines = text.split('\n');
  const relevantText = lines.slice(9).join('\n');
  Papa.parse(relevantText, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim(), complete: resolve });
});

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
};

const SummaryCard = ({ icon: Icon, iconColor, title, value, unit }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
    <div>
      <div className="flex items-center gap-2 mb-1 text-slate-500 text-sm font-medium">{title}</div>
      <p className="text-2xl font-bold text-slate-800">{value} <span className="text-sm font-normal text-slate-500">{unit}</span></p>
    </div>
    <div className={`p-3 rounded-xl ${iconColor.replace('text-', 'bg-').replace('500', '100')} ${iconColor}`}><Icon size={24} /></div>
  </div>
);

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Ya, Lanjutkan", isDanger = true }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 transition-all">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-full ${isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}><AlertTriangle size={24} /></div>
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        </div>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">Batal</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition shadow-sm ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

const GuideModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="px-6 py-4 bg-[#111827] text-white flex justify-between items-center sticky top-0 z-10 shadow-md">
          <h3 className="font-bold text-lg flex items-center gap-2"><FileText size={20} className="text-blue-400" /> Panduan Penggunaan Sistem</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition">Tutup ✕</button>
        </div>

        {/* Konten Panduan (Teks Lengkap) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 text-slate-700 space-y-8 bg-slate-50">
          
          <div className="text-center border-b border-slate-200 pb-6 mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">PANDUAN PENGGUNAAN SISTEM<br/>MONITORING EFISIENSI LOKOMOTIF</h2>
            <p className="text-slate-500 font-medium">PT Yerry Primatama Hosindo</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-bold text-blue-700 flex items-center gap-2"><span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span> Cara Masuk (Login)</h4>
            <ul className="list-disc list-outside space-y-2 text-slate-600 ml-8">
              <li>Buka aplikasi melalui web browser.</li>
              <li>Sistem ini terhubung langsung dengan Database MySQL Server.</li>
              <li>Masukkan Username dan Password yang telah didaftarkan. (Default Admin: <strong>admin</strong> | <strong>admin123</strong>)</li>
              <li>Klik tombol "Login".</li>
            </ul>
          </div>

<div className="space-y-3">
            <h4 className="text-lg font-bold text-blue-700 flex items-center gap-2"><span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span> Hak Akses (Role)</h4>
            <ul className="list-disc list-outside space-y-2 text-slate-600 ml-8">
              <li><strong>Admin:</strong> Memiliki akses penuh, termasuk menu "Manajemen Akun" untuk menambah atau menghapus user di Database MySQL.</li>
              <li><strong>Operator/User:</strong> Hanya dapat mengunggah CSV dan melihat riwayat analisis bersama di server.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-bold text-blue-700 flex items-center gap-2"><span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span> Penjelasan Ruang Kerja (Menu Utama)</h4>
            <p className="text-slate-600 ml-8 mb-2">Setelah login, Anda akan melihat pilihan mode laporan:</p>
            <ul className="list-disc list-outside space-y-2 text-slate-600 ml-12">
              <li><strong>Database Riwayat:</strong> Tempat melihat kembali laporan yang sudah diproses oleh semua teknisi. Data tersimpan di MySQL Server.</li>
              <li><strong>Per Jam (Hourly):</strong> Digunakan untuk mengunggah CSV tipe Hourly Resume. Menampilkan grafik batang level BBM dan rata-rata topografi (Pitch/Roll) setiap jam.</li>
              <li><strong>Harian (Daily):</strong> Digunakan untuk mengunggah CSV tipe Raw Data. Akan memunculkan peta (map) lokasi pergerakan, dan grafik garis interaktif untuk kecepatan lokomotif per menit.</li>
              <li><strong>Mingguan & Bulanan:</strong> Upload banyak file (hingga 7 atau 31 CSV) untuk agregasi total jarak dan konsumsi BBM harian.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-bold text-blue-700 flex items-center gap-2"><span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span> Cara Upload Data CSV</h4>
            <ul className="list-disc list-outside space-y-2 text-slate-600 ml-8">
              <li>Pilih salah satu mode (misalnya "Harian").</li>
              <li>Klik tombol <strong>Upload CSV</strong> di pojok kanan atas.</li>
              <li>Pilih file berformat .csv dari komputer Anda (tahan tombol <strong>CTRL</strong> untuk memilih banyak file sekaligus di mode Mingguan/Bulanan).</li>
              <li>Grafik dan peta akan otomatis muncul dalam hitungan detik.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-bold text-blue-700 flex items-center gap-2"><span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">5</span> Menyimpan & Menghapus Riwayat</h4>
            <ul className="list-disc list-outside space-y-2 text-slate-600 ml-8">
              <li>Setiap kali Anda berhasil mengupload file, sistem otomatis menyimpannya ke <strong>Database Server (MySQL)</strong>.</li>
              <li>Laporan yang diupload akan mencatat nama pengunggahnya (*Uploader*).</li>
              <li>Penghapusan riwayat dari database hanya bisa dilakukan oleh <strong>Admin</strong> atau <strong>User yang mengunggah file tersebut</strong>.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-bold text-blue-700 flex items-center gap-2"><span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">6</span> Keluar (Logout)</h4>
            <p className="text-slate-600 ml-8 leading-relaxed">
              Untuk keluar dari sistem, klik tombol "Logout" di pojok kanan atas. Riwayat analisis Anda akan tetap aman tersinkronisasi di Database pusat meskipun Anda logout.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* ROOT APP & KOMUNIKASI DATABASE MYSQL                                      */
/* ========================================================================= */
export default function App() {
  const [view, setView] = useState('login'); 
  const [activeRecord, setActiveRecord] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [history, setHistory] = useState([]);
  const [users, setUsers] = useState([]);

  // Mengambil data riwayat dari MySQL
  const loadHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/history`);
      const data = await res.json();
      setHistory(data);
    } catch (err) { console.error('Gagal mengambil history:', err); }
  };

  // Mengambil data user dari MySQL (Khusus Admin)
  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users`);
      const data = await res.json();
      setUsers(data);
    } catch (err) { console.error('Gagal mengambil users:', err); }
  };

  // Refresh data ketika tampilan berubah atau berhasil login
  useEffect(() => {
    if (currentUser) {
      loadHistory();
      if (currentUser.role === 'admin') loadUsers();
    }
  }, [currentUser, view]);

  // Login via API MySQL
  const handleLogin = async (username, password) => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        setView('home');
        return true;
      }
      return false;
    } catch (error) {
      console.error("Server error:", error);
      return false;
    }
  };

  // Simpan Riwayat ke MySQL
  const saveToHistory = async (record) => {
    try {
      const payload = { ...record, uploadedBy: currentUser.name };
      await fetch(`${API_URL}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      loadHistory(); // Tarik data terbaru setelah simpan
    } catch (err) { console.error('Gagal menyimpan:', err); }
  };

  // Hapus Riwayat di MySQL
  const handleDeleteHistory = async (id) => {
    try {
      await fetch(`${API_URL}/history/${id}`, { method: 'DELETE' });
      loadHistory(); // Tarik data terbaru setelah hapus
    } catch (err) { console.error('Gagal menghapus history:', err); }
  };

  // Tambah User ke MySQL
  const handleAddUser = async (newUser) => {
    try {
      await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      loadUsers();
    } catch (err) { console.error('Gagal menambah user:', err); }
  };

  // Hapus User di MySQL
  const handleDeleteUser = async (id) => {
    try {
      await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
      loadUsers();
    } catch (err) { console.error('Gagal menghapus user:', err); }
  };

  const handleNavMenu = (targetView) => {
    setActiveRecord(null); 
    setView(targetView);
  };

  const executeLogout = () => {
    setCurrentUser(null);
    setShowLogoutModal(false);
    setView('login');
  };

  if (view === 'login') return <LoginView onLogin={handleLogin} />;
  
  return (
    <>
      {view === 'home' ? (
        <HomeMenu onSelect={handleNavMenu} onLogout={() => setShowLogoutModal(true)} historyCount={history.length} currentUser={currentUser} />
      ) : (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
          <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-3 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-6">
              <img src="/kai-logo.jpeg" alt="KAI" className="h-8 object-contain" onError={(e)=>e.target.src="/kai-logo.jpg"} />
              <div className="h-6 w-px bg-slate-300"></div>
              <img src="/yph-logo(1).png" alt="YPH" className="h-6 object-contain" onError={(e)=>e.target.src="/yph-logo(1).png"} />
            </div>
            <div className="flex gap-4 items-center">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-800">{currentUser?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{currentUser?.role}</p>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
              <button onClick={() => handleNavMenu('home')} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition bg-slate-100 hover:bg-blue-50 px-4 py-2 rounded-lg">
                <ArrowLeft size={16} /> Menu
              </button>
              <button onClick={() => setShowLogoutModal(true)} className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-white transition bg-red-50 hover:bg-red-600 px-4 py-2 rounded-lg">
                <LogOut size={16} /> Logout
              </button>
            </div>
          </nav>
          
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
            {view === 'history' && <HistoryDashboard history={history} onView={(r) => { setActiveRecord(r); setView(r.type); }} onDelete={handleDeleteHistory} currentUser={currentUser} />}
            {view === 'users' && <UserManagementDashboard users={users} onAddUser={handleAddUser} onDeleteUser={handleDeleteUser} currentUser={currentUser} />}
            {view === 'hourly' && <HourlyDashboard activeRecord={activeRecord} onSave={saveToHistory} />}
            {view === 'daily' && <DailyDashboard activeRecord={activeRecord} onSave={saveToHistory} />}
            {view === 'weekly' && <MultiDayDashboard mode="Mingguan" maxFiles={7} activeRecord={activeRecord} onSave={saveToHistory} />}
            {view === 'monthly' && <MultiDayDashboard mode="Bulanan" maxFiles={31} activeRecord={activeRecord} onSave={saveToHistory} />}
          </main>
        </div>
      )}
 <ConfirmModal 
        isOpen={showLogoutModal}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin logout dari sistem?"
        confirmText="Ya, Logout"
        onConfirm={executeLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
}

/* ========================================================================= */
/* TAMPILAN LOGIN (AUTENTIKASI ASLI)                                         */
/* ========================================================================= */
const LoginView = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false); 
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    setErrorMsg('');
    setIsLoading(true);
    
    // Menunggu respons dari MySQL
    const success = await onLogin(username, password);
    
    setIsLoading(false);
    if (!success) {
      setErrorMsg('Username/Password salah');
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-white font-sans">
      <div className="hidden md:flex md:w-1/2 relative bg-[#111827] flex-col justify-center px-12 lg:px-24 text-white overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)"><path d="M25 0L50 14.4V43.3L25 57.7L0 43.3V14.4Z" fill="none" stroke="#ffffff" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#hexagons)"/></svg>
        </div>
        <div className="relative z-10 mb-20">
          <div className="bg-white p-3 rounded-full inline-block mb-4"><Activity className="text-[#111827] w-8 h-8" /></div>
          <div>
            <p className="text-sm text-slate-300 tracking-wider">Sistem Monitoring</p>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mt-1">Fuel Lokomotif KAI</h1>
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex flex-col relative min-h-screen">
        <div className="absolute top-6 right-6 lg:top-8 lg:right-10 flex items-center gap-4">
          <img src="/kai-logo.jpeg" alt="KAI" className="h-8 object-contain" onError={(e)=>e.target.src="/kai-logo.jpg"} />
          <div className="h-6 w-px bg-slate-300"></div>
          <img src="/yph-logo(1).png" alt="YPH" className="h-6 object-contain" onError={(e)=>e.target.src="/yph-logo(1).png"} />
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto px-6 mt-16 md:mt-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Activity className="text-blue-800" size={28}/> SISTEM <span className="text-slate-500 font-normal">MONITORING</span></h2>
            <p className="text-sm text-slate-500 mt-2">Silahkan Masukan Username dan Password anda.</p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4 border border-red-100 flex items-center gap-2">
              <AlertTriangle size={16} /> {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input type="text" placeholder="Username" className="w-full px-4 py-4 bg-[#eff6ff] text-slate-700 rounded-xl focus:bg-[#dbeafe] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] transition text-sm" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={isLoading} />
            </div>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder="Password" className="w-full px-4 py-4 bg-[#eff6ff] text-slate-700 rounded-xl focus:bg-[#dbeafe] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] transition text-sm pr-12" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            <button type="submit" disabled={isLoading} className={`w-full text-white font-medium py-4 rounded-xl transition mt-2 shadow-lg ${isLoading ? 'bg-blue-400' : 'bg-[#1e3a8a] hover:bg-blue-900 shadow-blue-900/20'}`}>
              {isLoading ? 'Memeriksa Database...' : 'Login'}
            </button>
          </form>

          <div className="mt-10">
            <div className="relative flex items-center py-4"><div className="flex-grow border-t border-slate-200"></div><span className="flex-shrink-0 mx-4 text-slate-400 text-xs">Lihat Panduan Penggunaan</span><div className="flex-grow border-t border-slate-200"></div></div>
            <div className="flex justify-center mt-1"><button onClick={() => setIsGuideOpen(true)} className="flex items-center gap-2 bg-[#1e3a8a] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition shadow-md"><FileText size={15} /> Panduan</button></div>
          </div>
        </div>
        <div className="absolute bottom-6 left-0 right-0 text-center text-[11px] text-slate-400 font-medium px-4">© 2026 PT Yerry Primatama Hosindo</div>
      </div>
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
};
/* ========================================================================= */
/* MENU UTAMA (UPDATE TATA LETAK MENJADI 3 KOLOM / GRID 3x2)                 */
/* ========================================================================= */
const HomeMenu = ({ onSelect, onLogout, historyCount, currentUser }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
    <div className="max-w-5xl w-full">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-6">
          <img src="/kai-logo.jpeg" alt="KAI" className="h-12 object-contain" onError={(e)=>e.target.src="/kai-logo.jpg"} />
          <img src="/yph-logo(1).png" alt="YPH" className="h-10 object-contain" onError={(e)=>e.target.src="/yph-logo(1).png"} />
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800">Hi, {currentUser?.name}</p>
            <p className="text-xs text-blue-600 font-semibold capitalize flex justify-end items-center gap-1"><Shield size={12}/> Role: {currentUser?.role}</p>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 text-red-500 font-medium hover:bg-red-50 px-4 py-2 rounded-lg transition border border-red-100">
            <LogOut size={18}/> Logout
          </button>
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Workspace Dashboard</h1>
      <p className="text-slate-500 mb-8">Pilih modul analisis data. Semua riwayat tersinkronisasi di server pusat (MySQL).</p>
      
      {/* GRID DIUBAH MENJADI 3 KOLOM AGAR RAPI (3 DI ATAS, 3 DI BAWAH) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {currentUser?.role === 'admin' && (
          <button onClick={() => onSelect('users')} className="bg-blue-800 p-6 rounded-2xl shadow-sm hover:shadow-lg transition text-left group relative overflow-hidden transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition"><Users className="text-white w-6 h-6" /></div>
            <h2 className="text-lg font-bold text-white mb-2">Manajemen Akun</h2>
            <p className="text-xs text-blue-200">Tambah/hapus akses pengguna.</p>
          </button>
        )}

        <button onClick={() => onSelect('history')} className="bg-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition text-left group relative overflow-hidden transform hover:-translate-y-1">
          <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition"><HistoryIcon className="text-white w-6 h-6" /></div>
          <h2 className="text-lg font-bold text-white mb-2">Database Riwayat</h2>
          <p className="text-xs text-slate-300">Akses {historyCount} data tersimpan.</p>
          {historyCount > 0 && <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">{historyCount}</span>}
        </button>

        <button onClick={() => onSelect('hourly')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-orange-500 hover:shadow-md transition text-left group transform hover:-translate-y-1">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition"><Clock className="text-orange-600 w-6 h-6" /></div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Per Jam (Hourly)</h2>
          <p className="text-xs text-slate-500">Resume konsumsi BBM dan kemiringan (Pitch/Roll).</p>
        </button>
        
        <button onClick={() => onSelect('daily')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition text-left group transform hover:-translate-y-1">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition"><LayoutGrid className="text-blue-600 w-6 h-6" /></div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Harian (Daily)</h2>
          <p className="text-xs text-slate-500">Upload Raw Data CSV untuk grafik kecepatan dan peta.</p>
        </button>
        
        <button onClick={() => onSelect('weekly')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-md transition text-left group transform hover:-translate-y-1">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition"><MapIcon className="text-emerald-600 w-6 h-6" /></div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Mingguan (Weekly)</h2>
          <p className="text-xs text-slate-500">Agregasi 7 CSV untuk kalkulasi efisiensi harian.</p>
        </button>
        
        <button onClick={() => onSelect('monthly')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-purple-500 hover:shadow-md transition text-left group transform hover:-translate-y-1">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition"><MapPin className="text-purple-600 w-6 h-6" /></div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Bulanan (Monthly)</h2>
          <p className="text-xs text-slate-500">Pemetaan rute sebulan (31 CSV) untuk mencari tren.</p>
        </button>
      </div>
    </div>
  </div>
);

/* ========================================================================= */
/* MODUL MANAJEMEN PENGGUNA (HANYA ADMIN)                                    */
/* ========================================================================= */
const UserManagementDashboard = ({ users, onAddUser, onDeleteUser, currentUser }) => {
  const [showForm, setShowForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('user');

  const handleSubmit = (e) => {
    e.preventDefault();
    if(users.some(u => u.username === newUsername)) {
      alert("Username sudah digunakan di Database!"); return;
    }
    onAddUser({ name: newName, username: newUsername, password: newPassword, role: newRole });
    setShowForm(false); setNewUsername(''); setNewPassword(''); setNewName('');
  };

  if (currentUser?.role !== 'admin') {
    return <div className="p-12 text-center text-red-500 font-bold">Akses Ditolak. Anda bukan Admin.</div>;
  }
return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Akun Pengguna</h1>
          <p className="text-slate-500 text-sm mt-1">Tambah, edit, atau hapus akses masuk dari Database MySQL.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition">
          {showForm ? 'Batal' : <><UserPlus size={18} /> Tambah User</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 animate-in slide-in-from-top-4">
          <h3 className="font-bold text-lg mb-4 border-b pb-2">Buat Akun Baru ke MySQL</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="text" placeholder="Nama Lengkap" className="px-4 py-2 border rounded-lg" value={newName} onChange={e=>setNewName(e.target.value)} required />
            <input type="text" placeholder="Username Login" className="px-4 py-2 border rounded-lg" value={newUsername} onChange={e=>setNewUsername(e.target.value)} required />
            <input type="text" placeholder="Password" className="px-4 py-2 border rounded-lg" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required />
            <div className="flex gap-2">
              <select className="px-4 py-2 border rounded-lg w-full bg-white" value={newRole} onChange={e=>setNewRole(e.target.value)}>
                <option value="user">Operator (User)</option>
                <option value="admin">Administrator</option>
              </select>
              <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700">Simpan</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">ID DB</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nama / Karyawan</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Username</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Role / Hak Akses</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-slate-400 text-sm">#{u.id}</td>
                <td className="px-6 py-4 font-medium text-slate-800">{u.name}</td>
                <td className="px-6 py-4 text-slate-500"><code className="bg-slate-100 px-2 py-1 rounded text-xs">{u.username}</code></td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {u.username !== 'admin' && (
                    <button onClick={() => { if(window.confirm('Hapus akun ini dari MySQL?')) onDeleteUser(u.id); }} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition">Hapus Akun</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


/* ========================================================================= */
/* HALAMAN RIWAYAT                                                           */
/* ========================================================================= */
const HistoryDashboard = ({ history, onView, onDelete, currentUser }) => {
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = history.filter(item => {
    const matchType = filterType === 'all' || item.type === filterType;
    const matchSearch = item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) || (item.uploadedBy && item.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchType && matchSearch;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Database Server (MySQL)</h1>
        <p className="text-slate-500 text-sm mt-1">Laporan dari seluruh teknisi tersinkronisasi langsung dari database.</p>
      </div>
      
      {history.length > 0 && (
        <div className="flex gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex-1 relative">
            <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Cari nama file atau nama teknisi..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <select className="w-56 px-4 py-2 border rounded-lg text-sm bg-white" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">Semua Mode</option>
            <option value="hourly">Per Jam (Hourly)</option>
            <option value="daily">Harian (Daily)</option>
            <option value="weekly">Mingguan (Weekly)</option>
            <option value="monthly">Bulanan (Monthly)</option>
          </select>
        </div>
      )}
 {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
          <HistoryIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Belum ada data di dalam server MySQL.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Mode</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Sumber File</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Diunggah Oleh</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Waktu</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4"><span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-600 border">{item.type}</span></td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{item.fileName}</td>
                  <td className="px-6 py-4 text-sm text-blue-600 font-medium flex items-center gap-2"><div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs">{item.uploadedBy ? item.uploadedBy.charAt(0) : 'U'}</div> {item.uploadedBy || 'User Lama'}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(item.timestamp).toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onView(item)} className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-medium mr-2">Lihat</button>
                    {(currentUser?.role === 'admin' || currentUser?.name === item.uploadedBy) && (
                       <button onClick={() => { if(window.confirm('Hapus laporan ini dari Database MySQL?')) onDelete(item.id); }} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium">Hapus</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ========================================================================= */
/* HOURLY DASHBOARD                                                          */
/* ========================================================================= */
const HourlyDashboard = ({ activeRecord, onSave }) => {
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [summary, setSummary] = useState({ fuelConsumed: 0, avgPitch: 0, avgRoll: 0, avgFuelLevel: 0 });

  useEffect(() => {
    if (activeRecord) {
      setData(activeRecord.payload.data);
      setSummary(activeRecord.payload.summary);
      setFileName(activeRecord.fileName);
    }
  }, [activeRecord]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const text = await readAsText(file);
    const results = await parseCSV(text);
    let totalPitch = 0, totalRoll = 0, totalFuelLvl = 0, validRows = 0;

    const formattedData = results.data.map(row => {
      const timeMatch = (row['Time'] || '').match(/(\d{1,2}:\d{2}:\d{2} [AP]M)/);
      const fuel = parseFloat(String(row['Fuel Level (L)'] || '0').replace(',', '.'));
      const pitch = parseFloat(String(row['Avg Pitch (°)'] || '0').replace(',', '.'));
      const roll = parseFloat(String(row['Avg Roll (°)'] || '0').replace(',', '.'));
      if (!isNaN(pitch)) totalPitch += pitch;
      if (!isNaN(roll)) totalRoll += roll;
      if (!isNaN(fuel)) totalFuelLvl += fuel;
      validRows++;
      return { Time: timeMatch ? timeMatch[1] : row['Time'], FuelLevel: isNaN(fuel) ? 0 : fuel, Pitch: isNaN(pitch) ? 0 : pitch, Roll: isNaN(roll) ? 0 : roll };
    }).filter(item => item.Time !== undefined);

    if (formattedData.length > 0) {
      const sum = { 
        fuelConsumed: Math.max(0, formattedData[0].FuelLevel - formattedData[formattedData.length - 1].FuelLevel).toFixed(1),
        avgPitch: validRows > 0 ? (totalPitch / validRows).toFixed(2) : 0,
        avgRoll: validRows > 0 ? (totalRoll / validRows).toFixed(2) : 0,
        avgFuelLevel: validRows > 0 ? (totalFuelLvl / validRows).toFixed(1) : 0
      };
      setSummary(sum); setData(formattedData);
      onSave({ type: 'hourly', fileName: file.name, payload: { data: formattedData, summary: sum } });
    }
    e.target.value = null; 
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Resume Per Jam</h1>
          <p className="text-slate-500 text-sm mt-1">{activeRecord ? 'Melihat Data dari Riwayat Server' : 'Upload CSV format Hourly Resume'}</p>
        </div>
        {!activeRecord && (
          <label className="bg-orange-600 text-white px-5 py-2.5 rounded-lg cursor-pointer hover:bg-orange-700 flex gap-2 font-medium">
            <Upload size={18} /> {fileName || 'Upload CSV'}
            <input type="file" accept=".csv, .txt" className="hidden" onChange={handleUpload} />
          </label>
        )}
      </div>
      {data.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <SummaryCard icon={Zap} iconColor="text-orange-500" title="BBM Terpakai" value={summary.fuelConsumed} unit="L" />
            <SummaryCard icon={Droplet} iconColor="text-blue-500" title="Rata Level BBM" value={summary.avgFuelLevel} unit="L" />
            <SummaryCard icon={Mountain} iconColor="text-emerald-500" title="Avg Pitch" value={summary.avgPitch} unit="°" />
            <SummaryCard icon={Activity} iconColor="text-purple-500" title="Avg Roll" value={summary.avgRoll} unit="°" />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Droplet size={20} className="text-blue-500" /> Grafik Level BBM</h2>
            <div className="h-[350px]"><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="Time" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} /><Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '12px' }} /><Bar dataKey="FuelLevel" name="Fuel Level (L)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} /></BarChart></ResponsiveContainer></div>
          </div>
        </>
      )}
    </div>
  );
};

/* ========================================================================= */
/* DAILY DASHBOARD                                                           */
/* ========================================================================= */
const DailyDashboard = ({ activeRecord, onSave }) => {
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [summary, setSummary] = useState({ currentFuel: 0, fuelConsumed: 0, avgSpeed: 0, totalDistance: 0 });
  const [mapPoint, setMapPoint] = useState({ lat: -6.465, lng: 108.237 });

  useEffect(() => {
    if (activeRecord) {
      setData(activeRecord.payload.data);
      setSummary(activeRecord.payload.summary);
      setMapPoint(activeRecord.payload.mapPoint);
      setFileName(activeRecord.fileName);
    }
  }, [activeRecord]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const text = await readAsText(file);
    const results = await parseCSV(text);
    let totalSpeed = 0, validSpeedCount = 0, calculatedDistance = 0;
    let lastValidLat = null, lastValidLng = null, prevLat = null, prevLng = null;

    const formattedData = results.data.map(row => {
      const timeMatch = (row['Time'] || '').match(/(\d{1,2}:\d{2}:\d{2})/);
      const fuel = parseFloat(String(row['Fuel Level (L)'] || '0').replace(',', '.'));
      const speed = parseFloat(String(row['Speed'] || '0').replace(',', '.'));
      const lat = parseFloat(String(row['Latitude'] || '').replace(',', '.'));
      const lng = parseFloat(String(row['Longitude'] || '').replace(',', '.'));

      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) { 
        lastValidLat = lat; lastValidLng = lng; 
        if (prevLat !== null && prevLng !== null) calculatedDistance += calculateDistance(prevLat, prevLng, lat, lng);
        prevLat = lat; prevLng = lng;
      }
      if (!isNaN(speed)) { totalSpeed += speed; validSpeedCount++; }
      return { Time: timeMatch ? timeMatch[1] : row['Time'], FuelLevel: isNaN(fuel) ? 0 : fuel, Speed: isNaN(speed) ? 0 : speed };
    }).filter(item => item.Time !== undefined);

    if (formattedData.length > 0) {
      const sum = { 
        currentFuel: formattedData[formattedData.length - 1].FuelLevel.toFixed(1), 
        fuelConsumed: Math.max(0, formattedData[0].FuelLevel - formattedData[formattedData.length - 1].FuelLevel).toFixed(1), 
        avgSpeed: validSpeedCount > 0 ? (totalSpeed / validSpeedCount).toFixed(1) : 0, 
        totalDistance: calculatedDistance.toFixed(1)
      };
      const point = (lastValidLat !== null) ? { lat: lastValidLat, lng: lastValidLng } : { lat: -6.465, lng: 108.237 };
      setSummary(sum); setData(formattedData); setMapPoint(point);
      onSave({ type: 'daily', fileName: file.name, payload: { data: formattedData, summary: sum, mapPoint: point } });
    }
    e.target.value = null; 
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Performa Harian</h1>
          <p className="text-slate-500 text-sm mt-1">{activeRecord ? 'Melihat Data dari Riwayat Server' : 'Upload 1 file CSV Raw Data'}</p>
        </div>
        {!activeRecord && (
          <label className="bg-blue-600 text-white px-5 py-2.5 rounded-lg cursor-pointer hover:bg-blue-700 flex gap-2 font-medium">
            <Upload size={18} /> {fileName || 'Upload CSV'}
            <input type="file" accept=".csv, .txt" className="hidden" onChange={handleUpload} />
          </label>
        )}
      </div>
      {data.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <SummaryCard icon={Droplet} iconColor="text-blue-500" title="Current Fuel" value={summary.currentFuel} unit="L" />
            <SummaryCard icon={Zap} iconColor="text-orange-500" title="Fuel Consumed" value={summary.fuelConsumed} unit="L" />
            <SummaryCard icon={Gauge} iconColor="text-emerald-500" title="Avg Speed" value={summary.avgSpeed} unit="km/h" />
            <SummaryCard icon={MapIcon} iconColor="text-purple-500" title="Total Jarak" value={summary.totalDistance} unit="KM" />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><MapPin className="text-red-500" /> Lokasi Terkini</h2>
            <div className="h-[250px] w-full rounded-xl overflow-hidden border border-slate-200 z-0"><MapContainer key={`${mapPoint.lat}-${mapPoint.lng}`} center={[mapPoint.lat, mapPoint.lng]} zoom={15} style={{ height: '100%', width: '100%' }}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Marker position={[mapPoint.lat, mapPoint.lng]}><Popup>Lokasi Harian</Popup></Marker></MapContainer></div>
          </div>
          <div className="flex flex-col gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"><h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Droplet size={20} className="text-blue-500" /> Grafik Level BBM</h2><div className="h-[350px] w-full"><ResponsiveContainer><AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="Time" hide /><YAxis domain={['auto', 'auto']} tick={{ fontSize: 12, fill: '#64748b' }} /><Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} /><Area type="monotone" dataKey="FuelLevel" name="BBM (L)" stroke="#2563eb" strokeWidth={2} fill="#3b82f6" fillOpacity={0.2} /></AreaChart></ResponsiveContainer></div></div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"><h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Gauge size={20} className="text-emerald-500" /> Riwayat Kecepatan</h2><div className="h-[350px] w-full"><ResponsiveContainer><LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="Time" hide /><YAxis tick={{ fontSize: 12, fill: '#64748b' }} /><Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} /><Line type="monotone" dataKey="Speed" name="Kecepatan" stroke="#10b981" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></div>
          </div>
        </>
      )}
    </div>
  );
};

/* ========================================================================= */
/* MULTI-DAY DASHBOARD                                                       */
/* ========================================================================= */
const MultiDayDashboard = ({ mode, maxFiles, activeRecord, onSave }) => {
  const [processedPoints, setProcessedPoints] = useState([]);
  const [multiSummary, setMultiSummary] = useState({ totalBBM: 0, totalDist: 0, overallAvgSpeed: 0, overallEfficiency: 0 });

  useEffect(() => {
    if (activeRecord) {
      setProcessedPoints(activeRecord.payload.data);
      setMultiSummary(activeRecord.payload.summary);
    }
  }, [activeRecord]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > maxFiles) { alert(`Mode ini dibatasi maks ${maxFiles} file!`); e.target.value = null; return; }
    if (files.length === 0) return;
    let pointsArr = [], accumBBM = 0, accumDist = 0, accumSpeed = 0, validSpeedDays = 0;
    
    for (let i = 0; i < files.length; i++) {
      const text = await readAsText(files[i]);
      const results = await parseCSV(text);
      const rows = results.data.filter(r => r['Time'] != null && r['Time'] !== '');
      if (rows.length > 0) {
        let lastLat = -6.465, lastLng = 108.237, dayTotalSpeed = 0, dayValidSpeed = 0, dayMaxSpeed = 0, dayCalculatedDistance = 0, prevLat = null, prevLng = null;
        const startFuel = parseFloat(String(rows[0]['Fuel Level (L)'] || '0').replace(',', '.'));
        const endFuel = parseFloat(String(rows[rows.length - 1]['Fuel Level (L)'] || '0').replace(',', '.'));
        const fuelConsumed = Math.max(0, startFuel - endFuel);
        for(let j = 0; j < rows.length; j++) {
          const lat = parseFloat(String(rows[j]['Latitude'] || '').replace(',', '.'));
          const lng = parseFloat(String(rows[j]['Longitude'] || '').replace(',', '.'));
          const speed = parseFloat(String(rows[j]['Speed'] || '0').replace(',', '.'));
          if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) { 
            lastLat = lat; lastLng = lng; 
            if (prevLat !== null && prevLng !== null) dayCalculatedDistance += calculateDistance(prevLat, prevLng, lat, lng);
            prevLat = lat; prevLng = lng;
          }
          if (!isNaN(speed)) { dayTotalSpeed += speed; dayValidSpeed++; if(speed > dayMaxSpeed) dayMaxSpeed = speed; }
        }
        const dayAvgSpeed = dayValidSpeed > 0 ? (dayTotalSpeed / dayValidSpeed) : 0;
        accumBBM += fuelConsumed; accumDist += dayCalculatedDistance;
        if(dayAvgSpeed > 0) { accumSpeed += dayAvgSpeed; validSpeedDays++; }
        pointsArr.push({ dayName: `Hari ${i + 1}`, fuelConsumed: parseFloat(fuelConsumed.toFixed(1)), avgSpeed: parseFloat(dayAvgSpeed.toFixed(1)), maxSpeed: parseFloat(dayMaxSpeed.toFixed(1)), distance: parseFloat(dayCalculatedDistance.toFixed(1)), efficiency: fuelConsumed > 0 ? parseFloat((dayCalculatedDistance / fuelConsumed).toFixed(2)) : 0, lat: lastLat, lng: lastLng });
      }
    }
    const sum = { totalBBM: accumBBM.toFixed(1), totalDist: accumDist.toFixed(1), overallAvgSpeed: validSpeedDays > 0 ? (accumSpeed / validSpeedDays).toFixed(1) : 0, overallEfficiency: accumBBM > 0 ? (accumDist / accumBBM).toFixed(2) : 0 };
    setProcessedPoints(pointsArr); setMultiSummary(sum);
    onSave({ type: mode === 'Mingguan' ? 'weekly' : 'monthly', fileName: `${files.length} File CSV`, payload: { data: pointsArr, summary: sum } });
    e.target.value = null;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Agregasi {mode}</h1>
          <p className="text-slate-500 text-sm mt-1">{activeRecord ? 'Melihat Data dari Riwayat Server' : `Upload max ${maxFiles} file (Tahan CTRL)`}</p>
        </div>
        {!activeRecord && (
          <label className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg cursor-pointer hover:bg-emerald-700 flex gap-2 font-medium">
            <Upload size={18} /> Upload Multi CSV
            <input type="file" multiple accept=".csv, .txt" className="hidden" onChange={handleUpload} />
          </label>
        )}
      </div>
      {processedPoints.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <SummaryCard icon={MapIcon} iconColor="text-blue-500" title="Total Jarak" value={multiSummary.totalDist} unit="KM" />
            <SummaryCard icon={Zap} iconColor="text-orange-500" title="Total BBM" value={multiSummary.totalBBM} unit="L" />
            <SummaryCard icon={Activity} iconColor="text-purple-500" title="Efisiensi" value={multiSummary.overallEfficiency} unit="KM/L" />
            <SummaryCard icon={Gauge} iconColor="text-emerald-500" title="Avg Speed" value={multiSummary.overallAvgSpeed} unit="km/h" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-[400px]"><h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500" /> Jarak vs Konsumsi BBM</h2><ResponsiveContainer><ComposedChart data={processedPoints}><XAxis dataKey="dayName"/><YAxis yAxisId="left"/><YAxis yAxisId="right" orientation="right"/><Tooltip/><Legend/><Bar yAxisId="left" dataKey="fuelConsumed" name="BBM Terpakai" fill="#f97316" /><Line yAxisId="right" type="monotone" dataKey="distance" name="Jarak (KM)" stroke="#3b82f6" strokeWidth={3} /></ComposedChart></ResponsiveContainer></div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-[400px]"><h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity size={18} className="text-emerald-500" /> Kecepatan Harian</h2><ResponsiveContainer><LineChart data={processedPoints}><XAxis dataKey="dayName"/><YAxis/><Tooltip/><Legend/><Line type="monotone" dataKey="maxSpeed" name="Max Speed" stroke="#ef4444" /><Line type="monotone" dataKey="avgSpeed" name="Avg Speed" stroke="#10b981" strokeWidth={3} /></LineChart></ResponsiveContainer></div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-[450px] flex flex-col"><h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><MapPin size={18} className="text-red-500" /> Pemetaan Rute</h2><div className="flex-1 rounded-xl overflow-hidden border border-slate-200 z-0"><MapContainer key={`multi-${processedPoints[0]?.lat}-${processedPoints.length}`} center={[processedPoints[0]?.lat || -6.465, processedPoints[0]?.lng || 108.237]} zoom={12} style={{ height: '100%', width: '100%' }}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Polyline positions={processedPoints.map(p => [p.lat, p.lng])} color="#8b5cf6" weight={4} />{processedPoints.map((point, idx) => (<Marker key={idx} position={[point.lat, point.lng]}><Popup><strong>{point.dayName}</strong><br/>Jarak: {point.distance} KM<br/>BBM: {point.fuelConsumed} L</Popup></Marker>))}</MapContainer></div></div>
        </>
      )}
    </div>
  );
};
