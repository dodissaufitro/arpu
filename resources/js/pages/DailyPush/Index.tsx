import React, { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Head, useForm, usePage, router, Link } from '@inertiajs/react';
import { Play, Plus, Trash2, Calendar, Database, Hash, CheckCircle, XCircle, Clock, FastForward, Settings, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import axios from 'axios';

interface EndpointConfig {
    id: number;
    operator: number;
    operator_name: string | null;
    id_service: number;
    service_name: string | null;
    date_mode: string;
    last_run_at: string | null;
    status: string | null;
}

interface PaginatedData<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
}

export default function Index({ configs, filters, operatorServices }: { configs: PaginatedData<EndpointConfig>, filters: any, operatorServices: Record<string, string[]> }) {
    const { flash } = usePage().props as any;
    const [isSubmitting, setIsSubmitting] = useState<number | 'all' | 'sync' | null>(null);
    const [pushProgress, setPushProgress] = useState<{ current: number; total: number } | null>(null);
    const [editModeId, setEditModeId] = useState<number | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, config: EndpointConfig | null } | null>(null);

    // Close context menu when clicking outside
    React.useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const [filterData, setFilterData] = useState({
        operator_name: filters?.operator_name || '',
        service_name: filters?.service_name || '',
    });

    const operatorNames = Object.keys(operatorServices || {});
    const availableServices = filterData.operator_name ? (operatorServices[filterData.operator_name] || []) : [];

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/daily-push', filterData, { preserveState: true, preserveScroll: true });
    };

    const clearFilters = () => {
        setFilterData({ operator_name: '', service_name: '' });
        router.get('/daily-push', {}, { preserveState: true, preserveScroll: true });
    };

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        operator: '',
        operator_name: '',
        id_service: '',
        service_name: '',
    });

    const handleEdit = (config: EndpointConfig) => {
        setEditModeId(config.id);
        clearErrors();
        setData({
            operator: config.operator.toString(),
            operator_name: config.operator_name || '',
            id_service: config.id_service.toString(),
            service_name: config.service_name || '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCopy = (config: EndpointConfig) => {
        setEditModeId(null);
        clearErrors();
        setData({
            operator: config.operator.toString(),
            operator_name: config.operator_name || '',
            id_service: config.id_service.toString(),
            service_name: config.service_name || '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editModeId) {
            put(`/daily-push/${editModeId}`, {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    setEditModeId(null);
                },
            });
        } else {
            post('/daily-push', {
                preserveScroll: true,
                onSuccess: () => reset(),
            });
        }
    };

    const handlePush = (id: number) => {
        setIsSubmitting(id);
        router.post(`/daily-push/${id}/push`, {}, {
            onFinish: () => setIsSubmitting(null),
        });
    };

    const handlePushAll = async () => {
        if (confirm('Are you sure you want to push ALL configurations for H-1 sequentially? This may take some time.')) {
            setIsSubmitting('all');
            
            try {
                // Get all IDs
                const response = await axios.get('/daily-push/all-ids', { headers: { Accept: 'application/json' } });
                const ids = response.data.ids;
                
                if (ids.length === 0) {
                    setIsSubmitting(null);
                    return;
                }
                
                setPushProgress({ current: 0, total: ids.length });
                
                // Process sequentially
                for (let i = 0; i < ids.length; i++) {
                    try {
                        await axios.post(`/daily-push/${ids[i]}/push`, {}, { 
                            headers: { Accept: 'application/json' } 
                        });
                    } catch (err) {
                        console.error(`Failed to push ID ${ids[i]}`, err);
                        // Continue to next item even if one fails
                    }
                    setPushProgress({ current: i + 1, total: ids.length });
                }
                
                // Reload to reflect changes
                router.visit(window.location.href, { preserveScroll: true, preserveState: true });
            } catch (error) {
                console.error("Failed to fetch IDs or execute push all", error);
                alert("An error occurred during sequential push.");
            } finally {
                setIsSubmitting(null);
                setPushProgress(null);
            }
        }
    };

    const handleSyncFromEndpointConfigs = () => {
        if (confirm('Sinkronkan konfigurasi dari Endpoint Configs? (Data yang sudah ada tidak akan diduplikasi)')) {
            setIsSubmitting('sync');
            router.post(`/daily-push/sync`, {}, {
                onFinish: () => setIsSubmitting(null),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this configuration?')) {
            router.delete(`/daily-push/${id}`);
        }
    };

    return (
        <DashboardLayout>
            <Head title="Daily Push (H-1)" />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Daily Push (H-1)</h1>
                        <p className="text-sm text-slate-500 mt-1">Manage and execute daily data synchronization (Target Date is automatically set to Yesterday)</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSyncFromEndpointConfigs}
                            disabled={isSubmitting === 'sync'}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                        >
                            {isSubmitting === 'sync' ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <RefreshCw size={20} />
                            )}
                            Sync dari Endpoint Configs
                        </button>
                        {configs.data.length > 0 && (
                            <button
                                onClick={handlePushAll}
                                disabled={isSubmitting === 'all'}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isSubmitting === 'all' ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        {pushProgress ? `Pushing (${pushProgress.current}/${pushProgress.total})` : 'Pushing...'}
                                    </>
                                ) : (
                                    <>
                                        <FastForward size={20} />
                                        Push All (H-1)
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
                        <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                        <span className="font-medium text-sm">{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
                        <XCircle size={20} className="text-red-500 flex-shrink-0" />
                        <span className="font-medium text-sm">{flash.error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Form Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center justify-between">
                                <span>{editModeId ? 'Edit Configuration' : 'Add New Configuration'}</span>
                                {editModeId && (
                                    <button 
                                        type="button" 
                                        onClick={() => { reset(); setEditModeId(null); clearErrors(); }}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Operator ID</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="number"
                                            value={data.operator}
                                            onChange={e => setData('operator', e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g. 162"
                                            required
                                        />
                                    </div>
                                    {errors.operator && <p className="text-red-500 text-xs mt-1">{errors.operator}</p>}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Operator Name (Optional)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={data.operator_name}
                                            onChange={e => setData('operator_name', e.target.value)}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g. Telkomsel"
                                        />
                                    </div>
                                    {/* @ts-ignore */}
                                    {errors.operator_name && <p className="text-red-500 text-xs mt-1">{errors.operator_name}</p>}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Service ID</label>
                                    <div className="relative">
                                        <Database className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="number"
                                            value={data.id_service}
                                            onChange={e => setData('id_service', e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g. 1955"
                                            required
                                        />
                                    </div>
                                    {errors.id_service && <p className="text-red-500 text-xs mt-1">{errors.id_service}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Service Name (Optional)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={data.service_name}
                                            onChange={e => setData('service_name', e.target.value)}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g. Content VOD"
                                        />
                                    </div>
                                    {/* @ts-ignore */}
                                    {errors.service_name && <p className="text-red-500 text-xs mt-1">{errors.service_name}</p>}
                                </div>

                                <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-xl border border-blue-100 flex items-start gap-2">
                                    <Calendar size={18} className="mt-0.5 flex-shrink-0" />
                                    <p>The target date for this configuration will automatically be set to <strong>Yesterday (H-1)</strong> whenever you run a push.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-[#1a56db] hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {editModeId ? 'Update Configuration' : 'Save Configuration'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            {/* Filter Bar */}
                            <div className="p-4 border-b border-slate-200 bg-slate-50">
                                <form onSubmit={handleFilter} className="flex flex-col sm:flex-row flex-wrap gap-3 items-end">
                                    <div className="flex-1 w-full min-w-[150px]">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Filter Operator Name</label>
                                        <select
                                            value={filterData.operator_name}
                                            onChange={e => {
                                                setFilterData({ ...filterData, operator_name: e.target.value, service_name: '' });
                                            }}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">All Operators</option>
                                            {operatorNames.map(name => (
                                                <option key={name} value={name}>{name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1 w-full min-w-[150px]">
                                        <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${filterData.operator_name ? 'text-slate-500' : 'text-slate-400'}`}>Filter Service Name</label>
                                        <select
                                            value={filterData.service_name}
                                            onChange={e => setFilterData({ ...filterData, service_name: e.target.value })}
                                            disabled={!filterData.operator_name}
                                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!filterData.operator_name ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'border-slate-300'}`}
                                        >
                                            <option value="">{filterData.operator_name ? 'All Services' : 'Select Operator First'}</option>
                                            {availableServices.map(name => (
                                                <option key={name} value={name}>{name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button type="submit" className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition-colors">
                                            Filter
                                        </button>
                                        {(filters?.operator_name || filters?.service_name) && (
                                            <button type="button" onClick={clearFilters} className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-semibold transition-colors">
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Operator</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Service</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Target</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {configs.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                                    No daily configurations found. Add one to get started.
                                                </td>
                                            </tr>
                                        ) : (
                                            configs.data.map(config => (
                                                <tr 
                                                    key={config.id} 
                                                    className="hover:bg-slate-50 transition-colors cursor-context-menu"
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        setContextMenu({ x: e.pageX, y: e.pageY, config });
                                                    }}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-slate-800">{config.operator}</span>
                                                            {config.operator_name && (
                                                                <span className="text-xs font-medium text-slate-500">{config.operator_name}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-slate-800">{config.id_service}</span>
                                                            {config.service_name && (
                                                                <span className="text-xs font-medium text-slate-500">{config.service_name}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium">
                                                            <Calendar size={14} />
                                                            H-1 (Yesterday)
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            {config.status === 'success' ? (
                                                                <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-600">
                                                                    <CheckCircle size={14} /> Success
                                                                </span>
                                                            ) : config.status === 'failed' ? (
                                                                <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600">
                                                                    <XCircle size={14} /> Failed
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-400">
                                                                    <Clock size={14} /> Pending
                                                                </span>
                                                            )}
                                                            {config.last_run_at && (
                                                                <span className="text-xs text-slate-400 mt-1">
                                                                    {dayjs(config.last_run_at).format('DD/MM HH:mm')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <button 
                                                            onClick={() => handlePush(config.id)}
                                                            disabled={isSubmitting === config.id || isSubmitting === 'all'}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                                                        >
                                                            {isSubmitting === config.id ? (
                                                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                            ) : (
                                                                <Play size={16} />
                                                            )}
                                                            Push
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(config.id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-semibold transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Pagination Controls */}
                            {configs.last_page > 1 && (
                                <div className="px-6 py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="text-sm text-slate-500">
                                        Showing <span className="font-semibold text-slate-700">{configs.from}</span> to <span className="font-semibold text-slate-700">{configs.to}</span> of <span className="font-semibold text-slate-700">{configs.total}</span> results
                                    </div>
                                    <div className="flex gap-1">
                                        {configs.links.map((link, i) => {
                                            if (!link.url) {
                                                return (
                                                    <span
                                                        key={i}
                                                        className="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-400 cursor-not-allowed"
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                );
                                            }
                                            
                                            const getRelativeUrl = (url: string) => {
                                                try {
                                                    const urlObj = new URL(url);
                                                    return urlObj.pathname + urlObj.search;
                                                } catch (e) {
                                                    return url;
                                                }
                                            };
                                            
                                            return (
                                                <Link
                                                    key={i}
                                                    href={getRelativeUrl(link.url)}
                                                    preserveScroll
                                                    preserveState
                                                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                                        link.active
                                                            ? 'bg-blue-600 text-white shadow-sm pointer-events-none'
                                                            : 'text-slate-600 hover:bg-slate-100'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && contextMenu.config && (
                <div 
                    className="fixed bg-white border border-slate-200 shadow-lg rounded-xl py-2 z-50 min-w-[160px]"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        onClick={() => handleEdit(contextMenu.config!)}
                    >
                        <Settings size={16} className="text-blue-500" />
                        Edit Configuration
                    </button>
                    <button
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        onClick={() => handleCopy(contextMenu.config!)}
                    >
                        <RefreshCw size={16} className="text-emerald-500" />
                        Copy as New
                    </button>
                </div>
            )}
        </DashboardLayout>
    );
}
