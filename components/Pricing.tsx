
import React from 'react';
import { PLANS } from '../constants';
import { PlanConfig } from '../types';
import { Check, Minus, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface PricingProps {
  onSelectPlan: (plan: PlanConfig) => void;
}

const Pricing: React.FC<PricingProps> = ({ onSelectPlan }) => {
  const { t } = useLanguage();

  return (
    <div className="py-6 md:py-10">
      <div className="text-center mb-12 md:mb-20">
        <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-4 md:mb-6 drop-shadow-2xl tracking-tight">{t('price_title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">{t('price_title_highlight')}</span></h2>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto px-4">{t('price_subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 max-w-7xl mx-auto">
        {PLANS.map((plan, index) => (
          <div key={index} className={`group relative glass-card rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-4 md:hover:-translate-y-6 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col ${plan.type === 'Lifetime' ? 'border-yellow-500/50 ring-1 ring-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.15)]' : 'border-gray-800'}`}>
            
            {/* Card Glow on Hover */}
            <div className={`absolute inset-0 bg-gradient-to-b ${plan.type === 'Lifetime' ? 'from-yellow-600/20' : 'from-indigo-600/20'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            
            {plan.type === 'Lifetime' && (
                <div className="absolute top-0 right-0 bg-gradient-to-bl from-yellow-400 to-orange-600 text-black text-xs font-black px-5 py-2 rounded-bl-2xl z-10 shadow-lg uppercase tracking-wider">
                    {t('price_best_value')}
                </div>
            )}
            
            <div className="p-6 md:p-8 text-center border-b border-white/5 bg-white/5 relative z-10">
              <h3 className={`text-xl md:text-2xl font-bold mb-2 uppercase tracking-widest ${plan.type === 'Lifetime' ? 'text-yellow-400' : 'text-white'}`}>{plan.type}</h3>
              <div className="flex justify-center items-end mb-2">
                <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">₹{plan.price}</span>
                <span className="text-gray-500 ml-2 mb-2 text-sm font-bold">/ {plan.durationLabel}</span>
              </div>
            </div>

            <div className="p-6 flex-grow relative z-10 overflow-y-auto max-h-[400px] md:max-h-[500px] custom-scrollbar">
              <ul className="space-y-3 md:space-y-4">
                {plan.features.map((feat, i) => {
                    const isIncluded = feat.status === 'included';
                    const isLimited = feat.status === 'limited';
                    const isExcluded = feat.status === 'excluded';

                    return (
                        <li 
                            key={i} 
                            className={`flex items-center p-2 rounded-lg transition-colors duration-300 ${isExcluded ? 'bg-red-900/20 border border-red-900/30' : 'hover:bg-white/5'}`}
                        >
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 border 
                                ${isIncluded ? 'bg-green-500/20 border-green-500/30' : ''}
                                ${isLimited ? 'bg-yellow-500/20 border-yellow-500/30' : ''}
                                ${isExcluded ? 'bg-gray-700/20 border-gray-600' : ''}
                            `}>
                                {isIncluded && <Check className="h-3.5 w-3.5 text-green-400" />}
                                {isLimited && <AlertCircle className="h-3.5 w-3.5 text-yellow-400" />}
                                {isExcluded && <Minus className="h-3.5 w-3.5 text-gray-400" />}
                            </div>
                            <div className="flex flex-col text-left">
                                <span className={`text-xs font-medium ${isExcluded ? 'text-gray-500 line-through decoration-gray-600' : 'text-gray-300'}`}>
                                    {feat.arg ? `${feat.arg} ${t(feat.nameKey)}` : t(feat.nameKey)}
                                </span>
                                {feat.valueKey && (
                                    <span className="text-[10px] text-yellow-500 font-bold">{t(feat.valueKey)}</span>
                                )}
                            </div>
                        </li>
                    );
                })}
              </ul>
            </div>

            <div className="p-6 mt-auto relative z-10 border-t border-white/5">
              <button 
                onClick={() => onSelectPlan(plan)}
                className={`w-full py-3 md:py-4 px-6 rounded-2xl font-bold text-white transition-all shadow-lg transform active:scale-95 text-sm md:text-base ${
                    plan.type === 'Lifetime' 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-600 text-black hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] hover:scale-105' 
                    : 'bg-white/5 border border-white/10 hover:bg-white/20 hover:border-indigo-500 hover:text-indigo-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                }`}
              >
                {t('price_select')} {plan.type}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;
