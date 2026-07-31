import React, { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Search, Plus, CheckCircle, XCircle, Clock, Edit2, Trash2, Copy } from 'lucide-react';

interface RequestService {
    id: number;
    operator: string;
    service: string;
    keyword: string;
    price: string | number;
    negara: string;
    sdc: string;
    url_wap: string;
    status: string;
}

export default function Index({ services = [], filters = {} }: { services?: RequestService[], filters?: any }) {
    const { flash, auth } = usePage().props as any;
    const isSuperAdmin = auth?.user?.role === 'Admin Utama';
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [editModeId, setEditModeId] = useState<number | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, service: RequestService } | null>(null);

    React.useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        operator: '',
        service: '',
        keyword: '',
        price: '',
        negara: '',
        sdc: '',
        url_wap: '',
        status: 'Request',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/request-service', { search: searchTerm }, { preserveState: true, preserveScroll: true });
    };

    const handleEdit = (service: RequestService) => {
        setEditModeId(service.id);
        clearErrors();
        setData({
            operator: service.operator,
            service: service.service,
            keyword: service.keyword,
            price: service.price as string,
            negara: service.negara,
            sdc: service.sdc,
            url_wap: service.url_wap || '',
            status: service.status,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleContextMenu = (e: React.MouseEvent, service: RequestService) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            service,
        });
    };

    const handleCopy = () => {
        if (!contextMenu?.service) return;
        const service = contextMenu.service;
        
        setEditModeId(null);
        clearErrors();
        setData({
            operator: service.operator,
            service: service.service,
            keyword: service.keyword,
            price: service.price as string,
            negara: service.negara,
            sdc: service.sdc,
            url_wap: service.url_wap || '',
            status: 'Request',
        });
        
        setContextMenu(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this request service?')) {
            router.delete(`/request-service/${id}`, { preserveScroll: true });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editModeId) {
            put(`/request-service/${editModeId}`, {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    setEditModeId(null);
                },
            });
        } else {
            post('/request-service', {
                preserveScroll: true,
                onSuccess: () => reset(),
            });
        }
    };

    return (
        <DashboardLayout>
            <Head title="Request Service" />

            {contextMenu && (
                <div 
                    className="fixed z-50 bg-white rounded-xl shadow-xl border border-slate-200 py-1 min-w-[160px]"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button 
                        onClick={handleCopy}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700 font-medium"
                    >
                        <Copy size={16} className="text-[#1a56db]" />
                        Copy (Duplicate)
                    </button>
                </div>
            )}

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Request Service</h1>
                        <p className="text-sm text-slate-500 mt-1">Manage and view all request service data</p>
                    </div>
                </div>

                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3">
                        <CheckCircle size={20} className="text-green-500" />
                        <span className="font-medium text-sm">{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
                        <XCircle size={20} className="text-red-500" />
                        <span className="font-medium text-sm">{flash.error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Form Section */}
                    <div className="xl:col-span-1">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Plus size={18} className="text-[#1a56db]" />
                                    {editModeId ? 'Edit Request' : 'Add New Request'}
                                </span>
                                {editModeId && (
                                    <button 
                                        type="button" 
                                        onClick={() => { reset(); setEditModeId(null); clearErrors(); }}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Operator</label>
                                    <input
                                        type="text"
                                        value={data.operator}
                                        onChange={e => setData('operator', e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g. Telkomsel"
                                        required
                                    />
                                    {errors.operator && <p className="text-red-500 text-xs mt-1">{errors.operator}</p>}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Service</label>
                                    <input
                                        type="text"
                                        value={data.service}
                                        onChange={e => setData('service', e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g. VOD Content"
                                        required
                                    />
                                    {errors.service && <p className="text-red-500 text-xs mt-1">{errors.service}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Keyword</label>
                                        <input
                                            type="text"
                                            value={data.keyword}
                                            onChange={e => setData('keyword', e.target.value)}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g. REG ON"
                                            required
                                        />
                                        {errors.keyword && <p className="text-red-500 text-xs mt-1">{errors.keyword}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Price</label>
                                        <input
                                            type="text"
                                            value={data.price}
                                            onChange={e => setData('price', e.target.value)}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g. 2000"
                                            required
                                        />
                                        {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Negara</label>
                                        <input
                                            type="text"
                                            value={data.negara}
                                            onChange={e => setData('negara', e.target.value)}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g. Indonesia"
                                            required
                                        />
                                        {errors.negara && <p className="text-red-500 text-xs mt-1">{errors.negara}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">SDC</label>
                                        <input
                                            type="text"
                                            value={data.sdc}
                                            onChange={e => setData('sdc', e.target.value)}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g. 99123"
                                            required
                                        />
                                        {errors.sdc && <p className="text-red-500 text-xs mt-1">{errors.sdc}</p>}
                                    </div>
                                </div>

                                {isSuperAdmin && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">URL WAP (Optional)</label>
                                            <input
                                                type="url"
                                                value={data.url_wap}
                                                onChange={e => setData('url_wap', e.target.value)}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="https://..."
                                            />
                                            {errors.url_wap && <p className="text-red-500 text-xs mt-1">{errors.url_wap}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                                            <select
                                                value={data.status}
                                                onChange={e => setData('status', e.target.value)}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                                required
                                            >
                                                <option value="Request">Request</option>
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                            {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
                                        </div>
                                    </>
                                )}

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-[#1a56db] hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors mt-2 disabled:opacity-50"
                                >
                                    {editModeId ? 'Update Request Service' : 'Save Request Service'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="xl:col-span-2">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            {/* Filter Bar */}
                            <div className="p-4 border-b border-slate-200 bg-slate-50">
                                <form onSubmit={handleSearch} className="flex gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search by operator, service, or keyword..."
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <button type="submit" className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition-colors shrink-0">
                                        Search
                                    </button>
                                </form>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Operator</th>
                                            <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Service</th>
                                            <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Keyword</th>
                                            <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
                                            <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Negara</th>
                                            <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">SDC</th>
                                            <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider max-w-[150px]">URL WAP</th>
                                            <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {services.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <Search size={32} className="text-slate-300 mb-3" />
                                                        <p className="font-medium text-slate-600">No request services found</p>
                                                        <p className="text-sm mt-1">Try adding a new one using the form.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            services.map(service => (
                                                <tr 
                                                    key={service.id} 
                                                    className="hover:bg-slate-50 transition-colors cursor-context-menu"
                                                    onContextMenu={(e) => handleContextMenu(e, service)}
                                                >
                                                    <td className="px-4 py-4">
                                                        <span className="font-semibold text-slate-800">{service.operator}</span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="font-medium text-slate-700">{service.service}</span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                                            {service.keyword}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm font-medium text-slate-700">
                                                        {service.price}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-slate-600">
                                                        {service.negara}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm font-medium text-slate-700">
                                                        {service.sdc}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-slate-500 max-w-[150px] truncate" title={service.url_wap}>
                                                        {service.url_wap ? (
                                                            <a href={service.url_wap} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                                {service.url_wap}
                                                            </a>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {service.status?.toLowerCase() === 'active' || service.status?.toLowerCase() === 'success' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-bold border border-green-200">
                                                                <CheckCircle size={14} /> Active
                                                            </span>
                                                        ) : service.status?.toLowerCase() === 'inactive' || service.status?.toLowerCase() === 'failed' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                                                                <XCircle size={14} /> Inactive
                                                            </span>
                                                        ) : service.status?.toLowerCase() === 'request' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-50 text-yellow-700 text-xs font-bold border border-yellow-200">
                                                                <Clock size={14} /> Request
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                                                                <Clock size={14} /> {service.status || 'Pending'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-right space-x-2">
                                                        {(isSuperAdmin || service.status?.toLowerCase() === 'request') && (
                                                            <button 
                                                                onClick={() => handleEdit(service)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-semibold transition-colors"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                        )}
                                                        {(isSuperAdmin || service.status?.toLowerCase() !== 'active') && (
                                                            <button 
                                                                onClick={() => handleDelete(service.id)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-semibold transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
