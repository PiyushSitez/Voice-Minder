
import React, { useState, useEffect } from 'react';
import { ADMIN_PIN } from '../constants';
import * as Storage from '../services/storageService';
import { User, Transaction, ChatMessage } from '../types';
import { Lock, Check, X, Trash2, Send, ShieldAlert, Users, DollarSign, MessageCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AdminProps {
  onBack: () => void;
}

const AdminPanel: React.FC<AdminProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'transactions' | 'chats'>('transactions');
  const { t } = useLanguage();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [chatUsers, setChatUsers] = useState<string[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [currentChat, setCurrentChat] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
      if(selectedChatUser) {
          const msgs = Storage.getMessages(selectedChatUser);
          setCurrentChat(msgs);
      }
  }, [selectedChatUser]);

  const refreshData = () => {
    setTransactions(Storage.getTransactions());
    setUsers(Storage.getUsers());
    setChatUsers(Storage.getUniqueChatUsers());
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setIsAuthenticated(true);
    } else {
      alert("Invalid Admin PIN");
    }
  };

  const handleTransaction = (id: string, action: 'approved' | 'rejected') => {
    Storage.updateTransactionStatus(id, action);
    refreshData();
  };

  const handleDeleteUser = (id: string) => {
      if(window.confirm("Are you sure you want to delete this user?")) {
          Storage.deleteUser(id);
          refreshData();
      }
  }

  const sendReply = (e: React.FormEvent) => {
      e.preventDefault();
      if(!selectedChatUser || !adminMessage.trim()) return;
      
      const msg: ChatMessage = {
          id: Date.now().toString(),
          senderId: 'admin',
          receiverId: selectedChatUser,
          text: adminMessage,
          timestamp: Date.now(),
          read: false
      };
      Storage.saveMessage(msg);
      setAdminMessage('');
      setCurrentChat(Storage.getMessages(selectedChatUser));
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="glass-card p-8 md:p-10 rounded-[2rem] max-w-sm w-full text-center border border-red-900/50 shadow-[0_0_80px_rgba(220,38,38,0.4)] animate-in zoom-in-95">
          <div className="bg-red-600 p-6 rounded-full inline-flex mb-8 shadow-[0_0_30px_rgba(220,38,38,0.6)] animate-pulse">
            <Lock size={48} className="text-white" />
          </div>
          <h2 className="text-3xl font-extrabold mb-2 text-white tracking-tight">{t('admin_restricted')}</h2>
          <p className="text-red-400 mb-8 text-xs uppercase tracking-[0.2em] font-bold">{t('admin_auth_req')}</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder={t('admin_enter_pin')}
              className="w-full bg-black/60 border border-red-900 rounded-xl p-4 text-center text-3xl tracking-[0.5em] mb-6 text-white focus:border-red-500 outline-none focus:ring-2 focus:ring-red-900 transition font-mono placeholder-red-900/50"
              value={pin}
              onChange={e => setPin(e.target.value)}
              maxLength={6}
              autoFocus
            />
            <button className="w-full bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white font-bold py-4 rounded-xl transition shadow-lg hover:scale-105">
              {t('admin_unlock')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-[2rem] shadow-2xl min-h-[80vh] border border-red-900/30 overflow-hidden flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-950 via-black to-black p-6 flex flex-col md:flex-row justify-between items-center border-b border-red-900/30 gap-4">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-red-900/20 rounded-xl border border-red-500/20">
                <ShieldAlert className="text-red-500" size={28} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{t('admin_center')}</h2>
                <p className="text-xs text-red-400 font-mono tracking-widest flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> {t('admin_system')}</p>
            </div>
        </div>
        <button onClick={onBack} className="px-6 py-3 border border-red-900/50 rounded-xl text-red-300 hover:bg-red-900/20 hover:text-white transition text-sm font-bold hover:shadow-[0_0_15px_rgba(220,38,38,0.2)]">{t('admin_exit')}</button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap md:flex-nowrap border-b border-red-900/30 bg-black/20">
        <button 
            onClick={() => setActiveTab('transactions')} 
            className={`flex-1 py-4 md:py-5 px-2 font-bold text-xs md:text-sm uppercase tracking-wider flex justify-center items-center gap-2 transition-all ${activeTab === 'transactions' ? 'bg-red-900/20 text-red-400 border-b-2 border-red-500' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
        >
            <DollarSign size={16} /> {t('admin_tab_tx')}
        </button>
        <button 
            onClick={() => setActiveTab('users')} 
            className={`flex-1 py-4 md:py-5 px-2 font-bold text-xs md:text-sm uppercase tracking-wider flex justify-center items-center gap-2 transition-all ${activeTab === 'users' ? 'bg-red-900/20 text-red-400 border-b-2 border-red-500' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
        >
            <Users size={16} /> {t('admin_tab_users')}
        </button>
        <button 
            onClick={() => setActiveTab('chats')} 
            className={`flex-1 py-4 md:py-5 px-2 font-bold text-xs md:text-sm uppercase tracking-wider flex justify-center items-center gap-2 transition-all ${activeTab === 'chats' ? 'bg-red-900/20 text-red-400 border-b-2 border-red-500' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
        >
            <MessageCircle size={16} /> {t('admin_tab_support')}
        </button>
      </div>

      <div className="p-4 md:p-8 flex-grow bg-black/20">
        {/* Transactions View */}
        {activeTab === 'transactions' && (
          <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
            <h3 className="font-bold text-xl mb-6 text-white flex items-center gap-3">
                <div className="w-1 h-8 bg-red-500 rounded-full"></div> {t('admin_pending')}
            </h3>
            
            {transactions.filter(t => t.status === 'pending').length === 0 && (
                <div className="p-12 text-center border border-dashed border-gray-800 rounded-2xl text-gray-600 bg-gray-900/20">{t('admin_no_pending')}</div>
            )}
            
            {transactions.filter(t => t.status === 'pending').map(tx => (
              <div key={tx.id} className="bg-gray-900/50 border border-gray-700 rounded-3xl p-6 flex flex-col lg:flex-row gap-6 items-start hover:border-red-500/50 transition shadow-lg">
                <div className="flex-shrink-0 w-full lg:w-40 h-40 bg-black rounded-2xl overflow-hidden cursor-pointer border border-gray-700 group mx-auto lg:mx-0" onClick={() => window.open(tx.screenshot)}>
                  <img src={tx.screenshot} alt="Proof" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                </div>
                <div className="flex-grow space-y-3 w-full">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <h4 className="font-bold text-2xl text-white">{tx.plan} Plan <span className="text-green-400 ml-2">₹{tx.amount}</span></h4>
                    <span className="text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-full">{new Date(tx.date).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-300">{t('admin_th_email')}: <span className="text-white font-medium">{tx.userEmail}</span></p>
                  <div className="bg-black/40 p-4 rounded-xl border border-gray-800 w-full md:w-auto">
                      <p className="text-xs text-gray-500 uppercase mb-1 font-bold">{t('check_txn_id')}</p>
                      <p className="text-lg font-mono text-yellow-400 font-bold tracking-wider select-all break-all">{tx.transactionId}</p>
                  </div>
                </div>
                <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-auto min-w-[140px]">
                  <button onClick={() => handleTransaction(tx.id, 'approved')} className="flex-1 bg-green-600 text-white px-4 py-4 rounded-xl hover:bg-green-500 flex items-center justify-center gap-2 font-bold shadow-lg hover:scale-105 transition"><Check size={20} /> {t('admin_approve')}</button>
                  <button onClick={() => handleTransaction(tx.id, 'rejected')} className="flex-1 bg-red-600 text-white px-4 py-4 rounded-xl hover:bg-red-500 flex items-center justify-center gap-2 font-bold shadow-lg hover:scale-105 transition"><X size={20} /> {t('admin_reject')}</button>
                </div>
              </div>
            ))}
            
            <h3 className="font-bold text-xl mt-16 mb-6 text-white flex items-center gap-3">
                <div className="w-1 h-8 bg-gray-600 rounded-full"></div> {t('admin_history')}
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-gray-800 shadow-2xl">
                <table className="w-full text-sm text-left text-gray-300 min-w-[600px]">
                    <thead className="bg-gray-800/80 text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="p-5">{t('admin_th_date')}</th>
                            <th className="p-5">{t('admin_th_email')}</th>
                            <th className="p-5">{t('admin_th_plan')}</th>
                            <th className="p-5">{t('admin_th_status')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {transactions.filter(t => t.status !== 'pending').map(tx => (
                            <tr key={tx.id} className="hover:bg-white/5 transition bg-gray-900/30">
                                <td className="p-5">{new Date(tx.date).toLocaleDateString()}</td>
                                <td className="p-5">{tx.userEmail}</td>
                                <td className="p-5 font-bold">{tx.plan}</td>
                                <td className="p-5">
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${tx.status === 'approved' ? 'bg-green-900/30 text-green-400 border border-green-900' : 'bg-red-900/30 text-red-400 border border-red-900'}`}>
                                        {tx.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}

        {/* Users View */}
        {activeTab === 'users' && (
          <div className="bg-gray-900/50 rounded-3xl border border-gray-800 overflow-hidden animate-in slide-in-from-right-5 duration-300">
            <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-800/80">
                <tr>
                  <th className="px-6 md:px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin_th_name')}</th>
                  <th className="px-6 md:px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin_th_email')}</th>
                  <th className="px-6 md:px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin_th_plan')}</th>
                  <th className="px-6 md:px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin_th_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-300">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/5 transition">
                    <td className="px-6 md:px-8 py-5 whitespace-nowrap font-bold text-white text-lg">{u.name}</td>
                    <td className="px-6 md:px-8 py-5 whitespace-nowrap">{u.email}</td>
                    <td className="px-6 md:px-8 py-5 whitespace-nowrap">
                        <span className={`px-4 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full uppercase tracking-wide ${u.plan === 'Free' ? 'bg-gray-800 text-gray-400' : 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'}`}>
                            {u.plan}
                        </span>
                    </td>
                    <td className="px-6 md:px-8 py-5 whitespace-nowrap">
                        <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-white p-3 hover:bg-red-600 rounded-xl transition shadow-sm"><Trash2 size={20} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* Chat View */}
        {activeTab === 'chats' && (
            <div className="flex flex-col md:flex-row h-[650px] border border-gray-700 rounded-3xl overflow-hidden bg-gray-900/50 animate-in slide-in-from-right-5 duration-300">
                {/* Sidebar */}
                <div className="w-full md:w-1/3 border-r border-gray-700 overflow-y-auto bg-black/30 h-48 md:h-auto border-b md:border-b-0">
                    {chatUsers.length === 0 && <p className="p-10 text-gray-500 text-center text-sm">No active chats found.</p>}
                    {chatUsers.map(uid => {
                        const u = users.find(us => us.id === uid);
                        return (
                            <div 
                                key={uid} 
                                onClick={() => setSelectedChatUser(uid)}
                                className={`p-6 border-b border-gray-800 cursor-pointer hover:bg-white/5 transition-all ${selectedChatUser === uid ? 'bg-red-900/20 border-l-4 border-l-red-500' : 'border-l-4 border-l-transparent'}`}
                            >
                                <p className="font-bold text-gray-200 text-base truncate mb-1">{u?.name || 'Unknown'}</p>
                                <p className="text-xs text-gray-500 truncate font-mono">{u?.email || uid}</p>
                            </div>
                        )
                    })}
                </div>
                {/* Chat Area */}
                <div className="w-full md:w-2/3 flex flex-col bg-black/50 h-full">
                    {selectedChatUser ? (
                        <>
                            <div className="flex-grow p-4 md:p-8 overflow-y-auto space-y-6 custom-scrollbar">
                                {currentChat.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.senderId === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] p-4 rounded-2xl shadow-lg ${msg.senderId === 'admin' ? 'bg-red-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'}`}>
                                            <p className="text-base leading-relaxed">{msg.text}</p>
                                            <p className="text-[10px] opacity-50 mt-2 text-right font-mono uppercase">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={sendReply} className="p-4 md:p-6 border-t border-gray-700 flex gap-4 bg-gray-900/80 backdrop-blur-md">
                                <input 
                                    type="text" 
                                    className="flex-grow bg-black/50 border border-gray-700 rounded-2xl px-6 py-4 text-white focus:border-red-500 outline-none transition" 
                                    placeholder={t('admin_chat_placeholder')}
                                    value={adminMessage}
                                    onChange={e => setAdminMessage(e.target.value)}
                                />
                                <button type="submit" className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-2xl transition shadow-lg hover:scale-105"><Send size={24} /></button>
                            </form>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-6 p-6 text-center">
                            <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
                                <MessageCircle size={40} className="opacity-30" />
                            </div>
                            <p className="text-lg font-medium">{t('admin_chat_select')}</p>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
