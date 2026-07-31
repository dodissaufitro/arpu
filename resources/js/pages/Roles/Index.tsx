import React, { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Search, Plus, CheckCircle, XCircle, Trash2, Edit2, Shield, Key } from 'lucide-react';

interface RoleData {
    id: number;
    name: string;
    permissions: string[] | null;
    created_at: string;
}

interface AvailablePermissions {
    [category: string]: {
        [key: string]: string;
    };
}

export default function Index({ roles = [], availablePermissions, filters = {} }: { roles?: RoleData[], availablePermissions: AvailablePermissions, filters?: any }) {
    const { flash } = usePage().props as any;
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [editModeId, setEditModeId] = useState<number | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        permissions: [] as string[],
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/roles', { search: searchTerm }, { preserveState: true, preserveScroll: true });
    };

    const handleEdit = (role: RoleData) => {
        setEditModeId(role.id);
        clearErrors();
        setData({
            name: role.name,
            permissions: role.permissions || [],
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this role?')) {
            router.delete(`/roles/${id}`, { preserveScroll: true });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editModeId) {
            put(`/roles/${editModeId}`, {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    setEditModeId(null);
                },
            });
        } else {
            post('/roles', {
                preserveScroll: true,
                onSuccess: () => reset(),
            });
        }
    };

    const handlePermissionToggle = (permKey: string) => {
        const currentPerms = [...data.permissions];
        if (currentPerms.includes(permKey)) {
            setData('permissions', currentPerms.filter(p => p !== permKey));
        } else {
            setData('permissions', [...currentPerms, permKey]);
        }
    };

    const handleSelectAllGroup = (categoryKeys: string[]) => {
        const currentPerms = [...data.permissions];
        const allIncluded = categoryKeys.every(key => currentPerms.includes(key));
        
        if (allIncluded) {
            setData('permissions', currentPerms.filter(p => !categoryKeys.includes(p)));
        } else {
            const newPerms = new Set([...currentPerms, ...categoryKeys]);
            setData('permissions', Array.from(newPerms));
        }
    };

    return (
        <DashboardLayout>
            <Head title="Role Management" />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Role Management</h1>
                        <p className="text-sm text-slate-500 mt-1">Manage user roles and assign access rights</p>
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
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24 max-h-[85vh] overflow-y-auto custom-scrollbar">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Plus size={18} className="text-[#1a56db]" />
                                    {editModeId ? 'Edit Role' : 'Create New Role'}
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
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Role Name</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g. Manager"
                                        required
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                        <Key size={16} className="text-slate-500"/> 
                                        Access Rights (Permissions)
                                    </label>
                                    
                                    <div className="space-y-4">
                                        {Object.entries(availablePermissions).map(([category, perms]) => {
                                            const categoryKeys = Object.keys(perms);
                                            const allIncluded = categoryKeys.every(key => data.permissions.includes(key));
                                            
                                            return (
                                                <div key={category} className="border border-slate-200 rounded-xl overflow-hidden">
                                                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{category}</span>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleSelectAllGroup(categoryKeys)}
                                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            {allIncluded ? 'Deselect All' : 'Select All'}
                                                        </button>
                                                    </div>
                                                    <div className="p-3 bg-white space-y-2">
                                                        {Object.entries(perms).map(([key, label]) => (
                                                            <label key={key} className="flex items-center gap-3 cursor-pointer group">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={data.permissions.includes(key)}
                                                                    onChange={() => handlePermissionToggle(key)}
                                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                                />
                                                                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {errors.permissions && <p className="text-red-500 text-xs mt-1">{errors.permissions}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-[#1a56db] hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {editModeId ? 'Update Role' : 'Save Role'}
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
                                            placeholder="Search roles..."
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <button type="submit" className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition-colors shrink-0">
                                        Search
                                    </button>
                                </form>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role Name</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Permissions Count</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {roles.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <Shield size={32} className="text-slate-300 mb-3" />
                                                        <p className="font-medium text-slate-600">No roles found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            roles.map(role => (
                                                <tr key={role.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                                                                <Shield size={18} />
                                                            </div>
                                                            <span className="block font-bold text-slate-800">{role.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                                                                {role.permissions ? role.permissions.length : 0} Permissions Granted
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <button 
                                                            onClick={() => handleEdit(role)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-semibold transition-colors"
                                                        >
                                                            <Edit2 size={16} /> Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(role.id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-semibold transition-colors"
                                                        >
                                                            <Trash2 size={16} /> Delete
                                                        </button>
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
