import React, { useState, useEffect } from 'react';
import { saveUser, getUserByEmail, loginUser } from '../services/storageService';
import { User, PlanType } from '../types';
import { OWNER_EMAIL } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface AuthProps {
  type: 'login' | 'signup';
  onSuccess: (user: User) => void;
  onSwitchMode: () => void;
}

const Auth: React.FC<AuthProps> = ({ type, onSuccess, onSwitchMode }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setError('');
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  }, [type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        if (type === 'signup') {
            if (formData.password !== formData.confirmPassword) {
                setError(t('auth_err_password'));
                setLoading(false);
                return;
            }
            
            const existingUser = await getUserByEmail(formData.email);
            if (existingUser) {
                setError(t('auth_err_exists')); 
                setLoading(false);
                return;
            }

            const newUser: User = {
                id: Date.now().toString(),
                name: formData.name,
                email: formData.email,
                password: formData.password, 
                plan: PlanType.FREE,
                isAdmin: formData.email === OWNER_EMAIL,
                isTrialEligible: true
            };

            await saveUser(newUser);
            loginUser(newUser);
            onSuccess(newUser); 
        } else {
            // LOGIN
            const user = await getUserByEmail(formData.email);
            if (user && user.password === formData.password) {
                loginUser(user);
                onSuccess(user);
            } else {
                setError(t('auth_err_invalid'));
            }
        }
    } catch (e) {
        console.error(e);
        setError("An error occurred. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-[80vh] w-full">
      <div className="max-w-md w-full space-y-8 glass-card p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-500 border border-white/10">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-600/20 rounded-full blur-[80px] mix-blend-screen pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] mix-blend-screen pointer-events-none"></div>

        <div className="relative z-10">
            <h2 className="mt-2 text-center text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
            {type === 'login' ? t('auth_welcome_login') : t('auth_welcome_signup')}
            </h2>
            <p className="mt-3 text-center text-gray-400 text-sm md:text-base font-light">
            {type === 'login' ? t('auth_subtitle_login') : t('auth_subtitle_signup')}
            </p>
        </div>
        
        {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-2xl text-sm text-center backdrop-blur-md animate-in slide-in-from-top-2">
            {error}
            </div>
        )}

        <form className="mt-8 md:mt-10 space-y-6 relative z-10" onSubmit={handleSubmit}>
          <div className="space-y-5">
            {type === 'signup' && (
              <div>
                <label className="sr-only">Full Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  className="appearance-none rounded-xl relative block w-full px-5 py-4 glass-input placeholder-gray-500 focus:z-10 text-sm transition-all"
                  placeholder={t('auth_name')}
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            )}
            <div>
              <label className="sr-only">Email address</label>
              <input
                name="email"
                type="email"
                required
                className="appearance-none rounded-xl relative block w-full px-5 py-4 glass-input placeholder-gray-500 focus:z-10 text-sm transition-all"
                placeholder={t('auth_email')}
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="sr-only">Password</label>
              <input
                name="password"
                type="password"
                required
                className="appearance-none rounded-xl relative block w-full px-5 py-4 glass-input placeholder-gray-500 focus:z-10 text-sm transition-all"
                placeholder={t('auth_password')}
                value={formData.password}
                onChange={handleChange}
              />
            </div>
             {type === 'signup' && (
              <div>
                <label className="sr-only">Confirm Password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  className="appearance-none rounded-xl relative block w-full px-5 py-4 glass-input placeholder-gray-500 focus:z-10 text-sm transition-all"
                  placeholder={t('auth_confirm_password')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-bold rounded-2xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(139,92,246,0.6)] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processing...' : (type === 'login' ? t('auth_btn_login') : t('auth_btn_signup'))}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-6 relative z-10">
             <button
                type="button" 
                onClick={onSwitchMode}
                className="text-sm text-indigo-300 hover:text-white transition font-medium hover:underline underline-offset-4"
            >
                {type === 'login' ? t('auth_switch_login') : t('auth_switch_signup')}
            </button>
        </div>

      </div>
    </div>
  );
};

export default Auth;