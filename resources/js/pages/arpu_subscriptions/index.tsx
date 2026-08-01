import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Database, Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface ArpuSubscription {
    id: number;
    country: string;
    operator: string;
    id_operator: string;
    id_service: string;
    service: string;
    keyword: string;
    source: string;
    msisdn: string;
    status: string;
    cycle: string;
    adnet: string;
    revenue: string;
    subs_date: string;
    renewal_date: string;
    freemium_end_date: string;
    unsubs_from: string;
    unsubs_date: string;
    service_price: string;
    currency: string;
    profile_status: string;
    publisher: string;
    trxid: string;
    pixel: string;
    handset: string;
    browser: string;
    attempt_charging: number;
    success_billing: number;
    created_at: string;
}

interface PageProps {
    subscriptions: {
        data: ArpuSubscription[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
    };
    metrics?: {
        total_data: number;
        total_active: number;
        total_inactive: number;
        total_revenue: number;
    };
    operatorServices?: {
        id_operator: string;
        operator_name: string;
        services: {
            id_service: string;
            service_name: string;
        }[];
    }[];
}

const SearchableSelect = ({ value, onChange, options, placeholder }: { value: string, onChange: (val: string) => void, options: {value: string, label: string}[], placeholder: string }) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    
    const filteredOptions = query === '' 
        ? options 
        : options.filter(opt => opt.label.toLowerCase().includes(query.toLowerCase()));
        
    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="relative flex-1 min-w-[150px]">
            <input 
                type="text"
                value={isOpen ? query : (selectedOption ? selectedOption.label : '')}
                onChange={e => {
                    setQuery(e.target.value);
                    if (!isOpen) setIsOpen(true);
                    if (e.target.value === '') onChange('');
                }}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                placeholder={placeholder}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-700"
            />
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    <div 
                        className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer text-slate-500"
                        onMouseDown={(e) => { e.preventDefault(); onChange(''); setIsOpen(false); setQuery(''); }}
                    >
                        Semua {placeholder}
                    </div>
                    {filteredOptions.map(opt => (
                        <div 
                            key={opt.value}
                            className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer text-slate-700"
                            onMouseDown={(e) => { e.preventDefault(); onChange(opt.value); setIsOpen(false); setQuery(''); }}
                        >
                            {opt.label}
                        </div>
                    ))}
                    {filteredOptions.length === 0 && (
                        <div className="px-3 py-2 text-sm text-slate-400">Tidak ditemukan</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function Index({ subscriptions, metrics, operatorServices }: PageProps) {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '');
    const [idOperator, setIdOperator] = useState(searchParams?.get('id_operator') || '');
    const [idService, setIdService] = useState(searchParams?.get('id_service') || '');
    const [startDate, setStartDate] = useState(searchParams?.get('start_date') || '');
    const [endDate, setEndDate] = useState(searchParams?.get('end_date') || '');

    const handleSearch = () => {
        const params: any = {};
        if (searchQuery) params.search = searchQuery;
        if (idOperator) params.id_operator = idOperator;
        if (idService) params.id_service = idService;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        router.get(route('arpu_subscriptions.index'), params, {
            preserveState: true,
            replace: true,
        });
    };

    // Safely check if data is available
    const hasData = subscriptions && subscriptions.data && subscriptions.data.length > 0;
    const hasPagination = subscriptions && subscriptions.links && subscriptions.links.length > 3;

    return (
        <DashboardLayout>
            <Head title="ARPU Subscriptions" />
            
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Database size={20} className="text-[#1a56db]" />
                            Data ARPU Subscriptions
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Menampilkan {subscriptions?.from || 0} - {subscriptions?.to || 0} dari total {subscriptions?.total || 0} data
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 min-w-[130px]">
                            <input 
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-500"
                            />
                        </div>
                        <div className="relative flex-1 min-w-[130px]">
                            <input 
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-500"
                            />
                        </div>
                        <SearchableSelect
                            value={idOperator}
                            onChange={(val) => {
                                setIdOperator(val);
                                setIdService('');
                            }}
                            placeholder="Operator"
                            options={operatorServices ? operatorServices.map(op => ({
                                value: op.id_operator,
                                label: op.operator_name ? `${op.operator_name} (${op.id_operator})` : op.id_operator
                            })) : []}
                        />
                        
                        {idOperator && (
                            <SearchableSelect
                                value={idService}
                                onChange={setIdService}
                                placeholder="Service"
                                options={operatorServices?.find(op => op.id_operator === idOperator)?.services.map(svc => ({
                                    value: svc.id_service,
                                    label: svc.service_name ? `${svc.service_name} (${svc.id_service})` : svc.id_service
                                })) || []}
                            />
                        )}
                        <div className="relative flex-1 md:w-56 min-w-[150px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder="Cari MSISDN..." 
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                            />
                        </div>
                        <button onClick={handleSearch} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 shadow-sm">
                            <Search size={16} />
                            <span className="hidden sm:inline">Filter</span>
                        </button>
                        <button className="hidden md:flex items-center gap-2 bg-[#10b981] hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 shadow-sm">
                            <RefreshCw size={16} />
                            <span>Sinkronisasi Data</span>
                        </button>
                    </div>
                </div>

                {/* Metrics Summary */}
                {metrics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div className="text-sm text-slate-500 font-medium mb-1">Total Data</div>
                            <div className="text-xl font-bold text-slate-800">
                                {new Intl.NumberFormat('id-ID').format(metrics.total_data)}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div className="text-sm text-slate-500 font-medium mb-1">Total Active</div>
                            <div className="text-xl font-bold text-emerald-600">
                                {new Intl.NumberFormat('id-ID').format(metrics.total_active)}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div className="text-sm text-slate-500 font-medium mb-1">Total Inactive</div>
                            <div className="text-xl font-bold text-rose-600">
                                {new Intl.NumberFormat('id-ID').format(metrics.total_inactive)}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div className="text-sm text-slate-500 font-medium mb-1">Total Revenue</div>
                            <div className="text-xl font-bold text-blue-600">
                                Rp {new Intl.NumberFormat('id-ID').format(metrics.total_revenue)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">ID</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">MSISDN</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Country</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Operator</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">ID Operator</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">ID Service</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Service</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Keyword</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Source</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-center">Status</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Cycle</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">AdNet</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Revenue</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Subs Date</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Renewal Date</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Freemium End</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Unsubs From</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Unsubs Date</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Service Price</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Currency</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Profile Status</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Publisher</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">TRX ID</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Pixel</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Handset</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Browser</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Attempt Charge</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Success Billing</th>
                                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Created At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {hasData ? (
                                subscriptions.data.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="py-3 px-6 text-sm text-slate-500 font-medium whitespace-nowrap">{sub.id}</td>
                                        <td className="py-3 px-6 text-sm font-semibold text-slate-700 whitespace-nowrap">{sub.msisdn || '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-600 whitespace-nowrap">{sub.country || '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-600 whitespace-nowrap">{sub.operator || '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-600 whitespace-nowrap">{sub.id_operator || '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-600 whitespace-nowrap">{sub.id_service || '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-600 whitespace-nowrap">{sub.service || '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-600 whitespace-nowrap">{sub.keyword || '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-600 whitespace-nowrap">{sub.source || '-'}</td>
                                        <td className="py-3 px-6 text-center whitespace-nowrap">
                                            <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                                String(sub.status) === '1' ? 'bg-emerald-100 text-emerald-700' :
                                                String(sub.status) === '-1' ? 'bg-rose-100 text-rose-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                                {String(sub.status) === '1' ? 'ACTIVE' : String(sub.status) === '-1' ? 'INACTIVE' : sub.status || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-6 text-sm text-slate-600 whitespace-nowrap">{sub.cycle || '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-600 whitespace-nowrap">{sub.adnet || '-'}</td>
                                        <td className="py-3 px-6 text-sm font-medium text-emerald-600 whitespace-nowrap">{sub.revenue ? `Rp. ${sub.revenue}` : '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-500 whitespace-nowrap">{sub.subs_date || '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-500 whitespace-nowrap">{sub.renewal_date || '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-500 whitespace-nowrap">{sub.freemium_end_date || '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-600 whitespace-nowrap">{sub.unsubs_from || '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-500 whitespace-nowrap">{sub.unsubs_date || '-'}</td>
                                        <td className="py-3 px-6 text-sm font-medium text-slate-600 whitespace-nowrap">{sub.service_price || '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-600 whitespace-nowrap">{sub.currency || '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-600 whitespace-nowrap">{sub.profile_status || '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-600 whitespace-nowrap">{sub.publisher || '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-600 whitespace-nowrap">{sub.trxid || '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-600 whitespace-nowrap">{sub.pixel || '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-600 whitespace-nowrap">{sub.handset || '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-600 whitespace-nowrap">{sub.browser || '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-600 whitespace-nowrap">{sub.attempt_charging ?? '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-600 whitespace-nowrap">{sub.success_billing ?? '-'}</td>
                                        <td className="py-3 px-6 text-sm text-slate-500 whitespace-nowrap">{sub.created_at ? String(sub.created_at).split('T')[0] : '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={28} className="py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <Database size={32} className="mb-3 text-slate-300" />
                                            <p className="text-sm font-medium">Belum ada data subscription</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {hasPagination && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                        <div className="text-sm text-slate-500">
                            Halaman {subscriptions.current_page} dari {subscriptions.last_page}
                        </div>
                        <div className="flex items-center gap-1">
                            {subscriptions.links.map((link, i) => {
                                // Parse label for Prev/Next icons
                                let label: React.ReactNode = link.label;
                                if (typeof link.label === 'string') {
                                    if (link.label.includes('Previous')) label = <ChevronLeft size={16} />;
                                    else if (link.label.includes('Next')) label = <ChevronRight size={16} />;
                                }
                                
                                const contentProps = typeof label === 'string' 
                                    ? { dangerouslySetInnerHTML: { __html: label } }
                                    : { children: label };
                                
                                return link.url ? (
                                    <Link
                                        key={i}
                                        href={link.url}
                                        className={`min-w-[32px] h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                                            link.active 
                                                ? 'bg-[#1a56db] text-white shadow-sm' 
                                                : 'text-slate-600 hover:bg-slate-200'
                                        }`}
                                        {...contentProps}
                                    />
                                ) : (
                                    <span
                                        key={i}
                                        className="min-w-[32px] h-8 flex items-center justify-center rounded-md text-sm font-medium text-slate-300 cursor-not-allowed"
                                        {...contentProps}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
