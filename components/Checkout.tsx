import React, { useState, useRef } from 'react';
import { PlanConfig, Transaction, User } from '../types';
import { UPI_ID, PLACEHOLDER_QR } from '../constants';
import { saveTransaction } from '../services/storageService';
import { ArrowLeft, Upload, CheckCircle, AlertTriangle, ShieldCheck, QrCode, Smartphone } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface CheckoutProps {
  plan: PlanConfig;
  user: User;
  onComplete: () => void;
  onCancel: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ plan, user, onComplete, onCancel }) => {
  const [txnId, setTxnId] = useState('');
  const [screenshot, setScreenshot] = useState<string>('');
  const [status, setStatus] = useState<'initial' | 'submitting' | 'success'>('initial');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2000000) {
        alert("File too large. Please use an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    const transaction: Transaction = {
      id: Date.now().toString(),
      userId: user.id,
      userEmail: user.email,
      plan: plan.type,
      amount: plan.price,
      upiId: UPI_ID,
      transactionId: txnId,
      screenshot: screenshot,
      status: 'pending',
      date: Date.now()
    };

    try {
        await saveTransaction(transaction);
        setStatus('success');
    } catch (e) {
        console.error(e);
        alert("Failed to submit transaction. Please try again.");
        setStatus('initial');
    }
  };

  const getDeliveryMessage = () => {
      const now = new Date();
      const day = now.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
      const hour = now.getHours(); // 0-23

      // Rule 3: Any day between 10:00 PM (22:00) and 12:00 AM
      if (hour >= 22) {
          return (
              <>
                  Thanks for your purchase! Since you ordered after 10:00 PM, your plan will be approved tomorrow.
                  <br />
                  Your Plan will be Activate tomorrow before 5:00 PM (afternoon). ☀️⏳
              </>
          );
      }

      // Rule 2: Sunday (Day 0) before 10:00 PM
      if (day === 0) {
          return (
              <>
                  Your payment is received! Your plan will be approved tonight. 🌟
                  <br />
                  Your Plan will be Activate Today before 10:00 PM.
              </>
          );
      }

      // Rule 1: Monday-Saturday (Days 1-6) before 10:00 PM
      return (
          <>
              Your payment is received! Your plan will be approved today before 10:00 PM. ⏳✨
              <br />
              Your Plan will be Activate Today before 10:00 PM.
          </>
      );
  };

  if (status === 'success') {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-10 glass-card rounded-3xl text-center border border-green-500/30 relative overflow-hidden animate-in fade-in">
        <div className="absolute inset-0 bg-green-500/5 animate-pulse"></div>
        <div className="relative z-10">
            <div className="mb-8 inline-flex bg-green-500/20 p-6 rounded-full text-green-400 shadow-[0_0_30px_rgba(74,222,128,0.3)]">
                <CheckCircle size={80} />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">{t('check_success_title')}</h2>
            <p className="text-lg text-gray-300 mb-10 leading-relaxed">
                {getDeliveryMessage()}
            </p>
            <button onClick={onComplete} className="bg-green-600 text-white px-10 py-4 rounded-full font-bold hover:bg-green-500 transition shadow-lg shadow-green-600/40 text-lg">
                {t('check_goto_dash')}
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="flex items-center gap-4 mb-8">
         <button onClick={onCancel} className="p-3 rounded-full glass-card hover:bg-white/10 text-white transition"><ArrowLeft /></button>
         <h1 className="text-3xl font-bold text-white flex items-center gap-3">
             {t('check_title')} 
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                 {t(plan.nameLabel)} ({plan.type})
             </span>
         </h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Instructions & QR */}
        <div className="glass-card rounded-3xl p-8 border-l-4 border-indigo-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
                <QrCode size={150} />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><ShieldCheck className="text-green-400" /> {t('check_secure')}</h3>
            
            <div className="bg-white p-6 rounded-2xl text-center mb-8 shadow-xl mx-auto max-w-xs transform hover:scale-105 transition duration-300 border-4 border-indigo-600">
                <img src={PLACEHOLDER_QR} alt="PhonePe UPI QR Code" className="mx-auto w-full h-auto rounded-lg" />
                <div className="mt-2 font-bold text-indigo-900 flex items-center justify-center gap-2">
                    <div className="w-6 h-6 bg-indigo-600 rounded-full text-white flex items-center justify-center">Pe</div>
                    <span>PhonePe Accepted</span>
                </div>
            </div>
            
            <div className="text-center space-y-4">
                <p className="text-gray-400 text-sm uppercase tracking-widest">{t('check_scan')}</p>
                <div className="inline-block bg-black/50 border border-white/10 rounded-xl px-6 py-3 font-mono font-bold text-indigo-300 text-lg select-all cursor-copy">
                    {UPI_ID}
                </div>
            </div>

            <div className="mt-8 bg-blue-900/30 border border-blue-500/30 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle size={20} className="text-blue-400 mt-1 flex-shrink-0" />
                <p className="text-blue-200 text-sm">{t('check_ensure')} <strong>₹{plan.price}</strong>.</p>
            </div>
        </div>

        {/* Right Side: Form */}
        <div className="glass-card rounded-3xl p-8">
            <h3 className="text-xl font-bold text-white mb-6">{t('check_verify')}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('check_txn_id')}</label>
                    <input 
                        type="text" 
                        required 
                        placeholder="e.g. T23091912345" 
                        className="w-full glass-input rounded-xl p-4 text-white font-mono"
                        value={txnId}
                        onChange={e => setTxnId(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('check_screenshot')}</label>
                    <div 
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 group ${screenshot ? 'border-green-500 bg-green-900/10' : 'border-gray-600 hover:border-indigo-500 hover:bg-white/5'}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {screenshot ? (
                            <div className="relative">
                                <img src={screenshot} alt="Proof" className="max-h-48 mx-auto rounded-lg shadow-lg" />
                                <span className="block text-xs text-green-400 mt-3 font-bold uppercase tracking-widest">{t('check_img_loaded')}</span>
                            </div>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                                    <Upload className="h-8 w-8 text-gray-400 group-hover:text-indigo-400" />
                                </div>
                                <p className="text-sm text-gray-400 group-hover:text-white transition">{t('check_upload_text')}</p>
                                <p className="text-xs text-gray-500 mt-1">{t('check_upload_max')}</p>
                            </>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            accept="image/*" 
                            className="hidden" 
                            required={!screenshot} 
                            onChange={handleFileChange}
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={status === 'submitting' || !screenshot || !txnId}
                    className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-xl transition-all ${
                        status === 'submitting' 
                        ? 'bg-gray-700 cursor-not-allowed opacity-50' 
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)]'
                    }`}
                >
                    {status === 'submitting' ? t('check_verifying') : t('check_submit_verify')}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;