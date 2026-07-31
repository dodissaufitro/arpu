import React from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    Database, FileText, CheckCircle, Plus, Upload, 
    CheckSquare, ClipboardList, PieChart, Monitor, ArrowUp, Activity, Filter, BarChart2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import DashboardLayout from '@/layouts/DashboardLayout';

interface PageProps {
    filters?: {
        start_date?: string;
        end_date?: string;
        operator?: string;
        service?: string;
        adnet?: string;
    };
    charts?: {
        by_date: { label: string; value: number }[];
        by_operator: { label: string; value: number }[];
        by_service: { label: string; value: number }[];
        by_adnet: { label: string; value: number }[];
    };
    metrics?: {
        total_data: number;
        total_active: number;
        total_inactive: number;
        total_revenue: number;
    };
}

export default function Dashboard({ filters, charts, metrics }: PageProps) {
    const [showFilters, setShowFilters] = React.useState(true);
    const [filterData, setFilterData] = React.useState({
        start_date: filters?.start_date || '',
        end_date: filters?.end_date || '',
        operator: filters?.operator || '',
        service: filters?.service || '',
        adnet: filters?.adnet || '',
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilterData(prev => ({ ...prev, [key]: value }));
    };

    const applyFilters = () => {
        router.get('/dashboard', filterData as any, {
            preserveState: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        const empty = { start_date: '', end_date: '', operator: '', service: '', adnet: '' };
        setFilterData(empty);
        router.get('/dashboard', empty as any, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <DashboardLayout>
            <Head title="Dashboard" />
            
            {/* Header with Filter Toggle */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">ARPU Dashboard</h2>
                    <p className="text-slate-500 text-sm">Analisis Total Pendapatan dan Performa</p>
                </div>
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center justify-center px-4 py-2 rounded-lg border font-semibold text-sm transition-colors ${
                        showFilters 
                            ? 'bg-blue-50 border-blue-200 text-blue-600' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <Filter size={16} className="mr-2" />
                    {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
                </button>
            </div>

            {/* Filters Row */}
            {showFilters && (
            <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Dari Tanggal (Subs)</label>
                        <input 
                            type="date" 
                            value={filterData.start_date}
                            onChange={e => handleFilterChange('start_date', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Sampai Tanggal (Subs)</label>
                        <input 
                            type="date" 
                            value={filterData.end_date}
                            onChange={e => handleFilterChange('end_date', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Operator</label>
                        <input 
                            type="text" 
                            placeholder="Misal: Telkomsel"
                            value={filterData.operator}
                            onChange={e => handleFilterChange('operator', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Service</label>
                        <input 
                            type="text" 
                            placeholder="Misal: Game Portal"
                            value={filterData.service}
                            onChange={e => handleFilterChange('service', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">AdNet</label>
                        <input 
                            type="text" 
                            placeholder="Nama AdNet"
                            value={filterData.adnet}
                            onChange={e => handleFilterChange('adnet', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end gap-3 border-t border-slate-100 pt-4">
                    <button 
                        onClick={resetFilters}
                        className="px-5 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Reset Filter
                    </button>
                    <button 
                        onClick={applyFilters}
                        className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                    >
                        Terapkan Filter
                    </button>
                </div>
            </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <MetricCard 
                    title="Total Revenue" 
                    value={`Rp ${(metrics?.total_revenue || 0).toLocaleString('id-ID')}`} 
                    subtitle="Pendapatan keseluruhan" 
                    bg="bg-gradient-to-br from-blue-600 to-blue-800" 
                    icon={<Database size={24} />} 
                />
                <MetricCard 
                    title="Total Subscription" 
                    value={(metrics?.total_data || 0).toLocaleString('id-ID')} 
                    subtitle="Berdasarkan data difilter" 
                    bg="bg-gradient-to-br from-emerald-500 to-emerald-700" 
                    icon={<FileText size={24} />} 
                />
                <MetricCard 
                    title="Status Aktif" 
                    value={(metrics?.total_active || 0).toLocaleString('id-ID')} 
                    subtitle="User aktif saat ini" 
                    bg="bg-gradient-to-br from-amber-500 to-amber-700" 
                    icon={<Activity size={24} />} 
                />
                <MetricCard 
                    title="Status Inaktif" 
                    value={(metrics?.total_inactive || 0).toLocaleString('id-ID')} 
                    subtitle="User berhenti berlangganan" 
                    bg="bg-gradient-to-br from-rose-500 to-rose-700" 
                    icon={<CheckCircle size={24} />} 
                />
            </div>

            {/* Main Chart */}
            {charts && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
                    <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <BarChart2 size={18} className="text-blue-600" />
                        Tren Revenue per Tanggal
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={charts.by_date} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} tickFormatter={(val) => `Rp ${(val/1000)}k`} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Revenue']} />
                                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#10b981', strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Sub Charts */}
            {charts && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-600 mb-4 uppercase tracking-wider">Revenue per Operator</h3>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.by_operator} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Revenue']} />
                                    <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-600 mb-4 uppercase tracking-wider">Revenue per Service</h3>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.by_service} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Revenue']} />
                                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-600 mb-4 uppercase tracking-wider">Revenue per AdNet</h3>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.by_adnet} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Revenue']} />
                                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

// Reusable micro-components
function MetricCard({ title, value, subtitle, bg, icon }: { title: string, value: string, subtitle: string, bg: string, icon: React.ReactNode }) {
    return (
        <div className={`${bg} rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group`}>
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white opacity-10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            <div className="flex items-start justify-between relative z-10 mb-4">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm shadow-inner">{icon}</div>
                <h3 className="text-white/90 text-sm font-bold uppercase tracking-wider">{title}</h3>
            </div>
            <div className="relative z-10">
                <p className="text-2xl lg:text-3xl font-extrabold tracking-tight drop-shadow-sm truncate">{value}</p>
                <p className="text-white/80 text-xs mt-2 font-medium bg-black/10 w-max px-3 py-1 rounded-full">{subtitle}</p>
            </div>
        </div>
    );
}
