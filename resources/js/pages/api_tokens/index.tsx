import { Head, Link, useForm, router } from '@inertiajs/react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Shield, Plus, Key, ToggleLeft, ToggleRight } from 'lucide-react';
import React, { useState } from 'react';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface ApiToken {
    id: number;
    client_name: string;
    token: string;
    last_used_at: string | null;
    is_active: boolean;
    created_at: string;
}

interface PageProps {
    tokens: {
        data: ApiToken[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
    };
    flash: {
        success?: string;
    };
}

export default function Index({ tokens, flash }: PageProps) {
    const [isCreating, setIsCreating] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        client_name: '',
    });

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post('/api-tokens', {
            onSuccess: () => {
                reset();
                setIsCreating(false);
            },
        });
    };

    const toggleStatus = (token: ApiToken) => {
        router.put(`/api-tokens/${token.id}`, {
            is_active: !token.is_active,
        });
    };

    return (
        <DashboardLayout>
            <Head title="API Tokens" />
            
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Shield size={20} className="text-[#1a56db]" />
                            Manajemen API Tokens
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Kelola akses token untuk aplikasi pihak ketiga.
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => setIsCreating(!isCreating)}
                        className="flex items-center gap-2 bg-[#1a56db] hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                        <Plus size={16} />
                        <span>{isCreating ? 'Batal' : 'Token Baru'}</span>
                    </button>
                </div>

                {flash?.success && (
                    <div className="bg-emerald-50 text-emerald-600 px-6 py-3 text-sm font-semibold border-b border-emerald-100">
                        {flash.success}
                    </div>
                )}

                {/* Create Form */}
                {isCreating && (
                    <div className="p-6 bg-slate-50 border-b border-slate-100">
                        <form onSubmit={submitCreate} className="flex items-end gap-4 max-w-xl">
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    Nama Aplikasi Klien
                                </label>
                                <input
                                    type="text"
                                    value={data.client_name}
                                    onChange={e => setData('client_name', e.target.value)}
                                    placeholder="Contoh: Gateway SMS Center"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                {errors.client_name && <p className="text-xs text-red-500 mt-1">{errors.client_name}</p>}
                            </div>
                            <button 
                                type="submit" 
                                disabled={processing}
                                className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                Buat & Simpan
                            </button>
                        </form>
                    </div>
                )}

                {/* Table */}
                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Klien</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Token Rahasia</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Terakhir Digunakan</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status Akses</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tokens.data.length > 0 ? (
                                tokens.data.map((token) => (
                                    <tr key={token.id} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="py-3 px-6 text-sm font-bold text-slate-700">
                                            {token.client_name}
                                        </td>
                                        <td className="py-3 px-6 text-sm text-slate-600 font-mono bg-slate-50">
                                            <div className="flex items-center gap-2">
                                                <Key size={14} className="text-slate-400" />
                                                <span className="truncate w-48 block">{token.token}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-6 text-sm text-slate-500 font-medium">
                                            {token.last_used_at ? new Date(token.last_used_at).toLocaleString('id-ID') : 'Belum pernah dipakai'}
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            <button 
                                                onClick={() => toggleStatus(token)}
                                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                                                token.is_active 
                                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                            }`}>
                                                {token.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                                {token.is_active ? 'AKTIF' : 'MATI'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <Shield size={32} className="mb-3 text-slate-300" />
                                            <p className="text-sm font-medium">Belum ada token API yang dibuat</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
