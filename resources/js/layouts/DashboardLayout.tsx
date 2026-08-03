import { Link, usePage } from '@inertiajs/react';
import { 
    Search, Bell, Mail, Menu, Home, CheckSquare, Briefcase, FileText, 
    PieChart, Monitor, Database, Settings, Users, Shield, ArrowDown, BarChart2, Clock, Key, LogOut
} from 'lucide-react';
import React, { useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { url, props } = usePage();
    const { auth } = props as any;
    const [showUserMenu, setShowUserMenu] = useState(false);

    const hasPermission = (permission: string) => {
        if (auth?.user?.role === 'Admin Utama') return true;
        return auth?.permissions?.includes(permission);
    };

    return (
        <div className="flex h-screen bg-[#f8fafc] font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-[280px] bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0 relative z-20">
                {/* Logo Area */}
                <div className="p-6 flex flex-col items-center justify-center border-b border-slate-100">
                    <h1 className="text-2xl font-extrabold text-[#1a56db] tracking-tight">Linkit360</h1>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-slate-200">
                    <div className="mb-2">
                        <Link href="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all group ${
                            url.startsWith('/dashboard') 
                                ? 'bg-[#1a56db] text-white shadow-md shadow-blue-500/20' 
                                : 'text-slate-600 hover:text-[#1a56db] hover:bg-blue-50'
                        }`}>
                            <Home size={20} className={url.startsWith('/dashboard') ? 'text-white' : 'text-slate-400 group-hover:text-[#1a56db] transition-colors'} />
                            <span>Dashboard</span>
                        </Link>
                    </div>

                    <div className="mt-8 mb-4">
                        <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-3 px-2">MENU UTAMA</h3>
                        <div className="flex flex-col gap-1">
                            {hasPermission('arpu.view') && (
                                <NavItem icon={<Database size={18} />} text="ARPU Subscriptions" href="/arpu-subscriptions" />
                            )}
                            {hasPermission('arpu.view') && (
                                <NavItem icon={<Database size={18} />} text="API Subscriptions" href="/api-subscriptions" />
                            )}
                            {hasPermission('tokens.view') && (
                                <NavItem icon={<Shield size={18} />} text="API Tokens" href="/api-tokens" />
                            )}
                            {hasPermission('endpoints.view') && (
                                <NavItem icon={<Settings size={18} />} text="Endpoint Configs" href="/endpoint-configs" />
                            )}
                            {hasPermission('dailypush.view') && (
                                <NavItem icon={<Clock size={18} />} text="Daily Push (H-1)" href="/daily-push" />
                            )}
                            {hasPermission('requests.view') && (
                                <NavItem icon={<FileText size={18} />} text="Request Service" href="/request-service" />
                            )}
                            {hasPermission('users.view') && (
                                <NavItem icon={<Users size={18} />} text="User Management" href="/users" />
                            )}
                            {hasPermission('roles.view') && (
                                <NavItem icon={<Key size={18} />} text="Role Management" href="/roles" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Help Banner */}
                <div className="p-4 border-t border-slate-100">
                    <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3 border border-blue-100">
                        <div className="bg-white p-2 rounded-lg shadow-sm text-blue-600">
                            <Mail size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-700">Butuh bantuan?</p>
                            <a href="#" className="text-xs text-[#1a56db] hover:underline font-semibold">Hubungi Administrator</a>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
                
                {/* Header */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10 sticky top-0">
                    <div className="flex items-center gap-6">
                        <button className="text-slate-500 hover:text-slate-700 md:hidden">
                            <Menu size={24} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">App</h2>
                            <p className="text-sm text-slate-500 font-medium mt-0.5">Sistem Manajemen Data</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative hidden md:block w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Cari data, menu, laporan, dll..." 
                                className="w-full bg-slate-100/70 border-none rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 transition-shadow placeholder:text-slate-400"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                                <Bell size={20} />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                            </button>
                            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                                <Mail size={20} />
                                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full ring-2 ring-white">2</span>
                            </button>
                        </div>

                        <div className="h-8 w-px bg-slate-200"></div>

                        <div className="relative">
                            <div 
                                className="flex items-center gap-3 cursor-pointer group"
                                onClick={() => setShowUserMenu(!showUserMenu)}
                            >
                                <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User" className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm object-cover" />
                                <div className="hidden sm:block">
                                    <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{auth?.user?.name || 'Admin Utama'}</p>
                                    <p className="text-xs text-slate-500">{auth?.user?.role || 'Administrator'}</p>
                                </div>
                            </div>
                            
                            {showUserMenu && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowUserMenu(false)}
                                    ></div>
                                    <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-100 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-slate-100 mb-1">
                                            <p className="text-sm font-bold text-slate-800">{auth?.user?.name || 'Admin Utama'}</p>
                                            <p className="text-xs text-slate-500 truncate">{auth?.user?.email || 'admin@example.com'}</p>
                                        </div>
                                        <Link 
                                            href="/logout" 
                                            method="post" 
                                            as="button"
                                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 font-semibold hover:bg-red-50 transition-colors flex items-center gap-2"
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-slate-300">
                    <div className="max-w-[1400px] mx-auto space-y-6">
                        {children}
                        
                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-400 font-medium pb-8 mt-6">
                            <p>© 2026 Linkit360. All rights reserved.</p>
                            <p>Versi 1.0.0</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function NavItem({ icon, text, href = "#" }: { icon: React.ReactNode, text: string, href?: string }) {
    const { url } = usePage();
    const isActive = href !== "#" && url.startsWith(href);
    
    const Component = href !== "#" ? Link : 'a';
    const linkProps = href !== "#" ? { href } : { href: "#" };
    
    return (
        <Component {...linkProps as any} className={`flex items-center justify-between px-4 py-2.5 rounded-xl font-medium transition-colors group ${
            isActive 
                ? 'bg-[#1a56db] text-white shadow-md shadow-blue-500/20' 
                : 'text-slate-600 hover:text-[#1a56db] hover:bg-blue-50'
        }`}>
            <div className="flex items-center gap-3">
                <div className={`transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#1a56db]'}`}>
                    {icon}
                </div>
                <span className="text-sm">{text}</span>
            </div>
            {!isActive && (
                <ArrowDown className="w-3 h-3 -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
        </Component>
    );
}
