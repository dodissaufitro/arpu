import { Head, useForm, Link } from '@inertiajs/react';
import { Loader2, Eye, EyeOff, User, Lock, ShieldCheck } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import InputError from '@/components/input-error';

export default function Login({ status, canResetPassword }: { status?: string, canResetPassword?: boolean }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        role: 'administrator',
        remember: false as boolean,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen w-full bg-[#f4f7fe] relative flex items-center justify-center p-4 md:p-8 font-sans overflow-hidden">
            {/* Abstract Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-blue-400/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />

            <Head title="Log in" />

            <div className="relative z-10 w-full max-w-[1100px] bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] flex flex-col md:flex-row overflow-hidden border border-white/50">
                
                {/* Left Side: Branding & Image */}
                <div className="hidden md:flex flex-col w-[45%] relative bg-gradient-to-b from-blue-50 to-white overflow-hidden p-10 justify-center items-center text-center">
                    {/* City Background Image */}
                    <div 
                        className="absolute inset-0 z-0 opacity-40 mix-blend-multiply"
                        style={{
                            backgroundImage: 'url("https://images.unsplash.com/photo-1555899434-94d1368aa7af?q=80&w=2070")',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        {/* Gradient overlay to fade bottom into white */}
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent" />
                    </div>

                    <div className="relative z-10 flex flex-col items-center max-w-sm mt-[-40px]">
                        <h1 className="text-4xl font-extrabold text-[#1a56db] tracking-tight mb-2">Linkit360</h1>
                        
                        <p className="text-slate-500 text-xs leading-relaxed mb-10">
                            Sistem Informasi Ketatausahaan yang terintegrasi untuk pengelolaan data dan layanan secara efektif dan efisien.
                        </p>

                        {/* Security Badge */}
                        <div className="bg-white/80 backdrop-blur-md border border-slate-100 shadow-sm rounded-2xl p-4 flex items-center gap-4 text-left">
                            <div className="bg-blue-100 p-2.5 rounded-full text-blue-600">
                                <ShieldCheck size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-700">Aman & Terpercaya</h3>
                                <p className="text-[0.65rem] text-slate-500 leading-tight mt-0.5">
                                    Data Anda kami jaga<br/>dengan enkripsi tingkat tinggi
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form Area */}
                <div className="w-full md:w-[55%] flex flex-col justify-center px-8 py-12 md:px-16 md:py-16 bg-white relative z-20">
                    <div className="mb-10 text-center">
                        <h2 className="text-[1.75rem] font-bold text-[#1e40af] mb-2">Selamat Datang!</h2>
                        <p className="text-slate-500 text-sm">Silakan masuk untuk melanjutkan ke dashboard</p>
                    </div>

                    {status && <div className="mb-4 font-medium text-sm text-green-600 text-center">{status}</div>}

                    <form className="flex flex-col gap-5" onSubmit={submit}>
                        {/* Role Selection */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-slate-700 text-sm font-bold">Pilih Role Akses</label>
                            <div className="flex p-1 bg-slate-100/80 rounded-xl shadow-inner border border-slate-200/50">
                                {['administrator', 'verifikator', 'pimpinan'].map((role) => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => setData('role', role)}
                                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg capitalize transition-all duration-300 ${
                                            data.role === role 
                                                ? 'bg-white text-[#1a56db] shadow-sm ring-1 ring-black/5' 
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                        }`}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Email Input */}
                        <div className="flex flex-col gap-1.5 mt-2">
                            <label className="text-slate-700 text-sm font-bold">Email atau Username</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <User size={18} strokeWidth={2} />
                                </div>
                                <input
                                    type="text"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm placeholder:text-slate-400"
                                    placeholder="Masukkan email atau username Anda"
                                    required
                                />
                            </div>
                            <InputError message={errors.email} className="mt-1" />
                        </div>

                        {/* Password Input */}
                        <div className="flex flex-col gap-1.5 mt-2">
                            <label className="text-slate-700 text-sm font-bold">Password</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <Lock size={18} strokeWidth={2} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-11 pr-11 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm placeholder:text-slate-400"
                                    placeholder="Masukkan password Anda"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                                </button>
                            </div>
                            <InputError message={errors.password} className="mt-1" />
                        </div>

                        {/* Remember & Forgot Password */}
                        <div className="flex items-center justify-between mt-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors cursor-pointer"
                                />
                                <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">Ingat saya</span>
                            </label>
                            
                            {canResetPassword && (
                                <Link 
                                    href={route('password.request')} 
                                    className="text-sm font-semibold text-[#1a56db] hover:text-blue-800 transition-colors"
                                >
                                    Lupa password?
                                </Link>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="mt-4 w-full bg-[#1a56db] hover:bg-[#1e40af] text-white py-3.5 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <Lock size={18} strokeWidth={2} />
                                    <span>Masuk</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative flex items-center justify-center mt-8 mb-6">
                        <div className="absolute w-full border-t border-slate-200"></div>
                        <span className="relative bg-white px-4 text-xs font-medium text-slate-400">
                            atau masuk dengan
                        </span>
                    </div>

                    {/* Google Login Button */}
                    <button
                        type="button"
                        className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3.5 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-3 transition-all duration-200 shadow-sm"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.8 15.71 17.58V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                            <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.58C14.72 18.24 13.47 18.64 12 18.64C9.15 18.64 6.74 16.71 5.88 14.13H2.19V16.99C4.01 20.61 7.7 23 12 23Z" fill="#34A853"/>
                            <path d="M5.88 14.13C5.66 13.47 5.54 12.75 5.54 12C5.54 11.25 5.66 10.53 5.88 9.87V7.01H2.19C1.43 8.52 1 10.21 1 12C1 13.79 1.43 15.48 2.19 16.99L5.88 14.13Z" fill="#FBBC05"/>
                            <path d="M12 5.36C13.62 5.36 15.07 5.92 16.21 7.01L19.36 3.86C17.45 2.07 14.97 1 12 1C7.7 1 4.01 3.39 2.19 7.01L5.88 9.87C6.74 7.29 9.15 5.36 12 5.36Z" fill="#EA4335"/>
                        </svg>
                        Masuk dengan Google
                    </button>

                    {/* Footer Link */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-500">
                            Belum punya akun? <a href="#" className="font-semibold text-[#1a56db] hover:underline">Hubungi Administrator</a>
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
