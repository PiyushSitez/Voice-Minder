import React, { useState, useEffect, useRef } from 'react';
import { ADMIN_PIN, OWNER_EMAIL, PLANS } from '../constants';
import * as Storage from '../services/storageService';
import { User, Transaction, ChatMessage, PlanType, ChatAttachment } from '../types';
import { Lock, Check, X, Trash2, Send, ShieldAlert, Users, DollarSign, MessageCircle, Zap, Ban, RotateCcw, AlertTriangle, LayoutList, Settings, History, Image, Clock, Calendar, CheckSquare, Square, Paperclip, FileText, Image as ImageIcon, Download, Upload, Database } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AdminProps {
  onBack: () => void;
}

const AdminPanel: React.FC<AdminProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<'users' | 'transactions' | 'chats' | 'system'>('transactions');
  const [userSubTab, setUserSubTab] = useState<'overview' | 'manual'>('overview');
  const [transactionSubTab, setTransactionSubTab] = useState<'pending' | 'history' | 'gallery'>('pending');

  const { t } = useLanguage();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [chatUsers, setChatUsers] = useState<string[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  
  // Chat State
  const [adminMessage, setAdminMessage] = useState('');
  const [adminAttachment, setAdminAttachment] = useState<ChatAttachment | null>(null);
  const [currentChat, setCurrentChat] = useState<ChatMessage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Bulk Delete State
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());

  // Image Viewer State (Transaction or Chat Image)
  const [viewTransaction, setViewTransaction] = useState<Transaction | null>(null);
  const [viewChatImage, setViewChatImage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
      setSelectedTxIds(new Set());
  }, [transactionSubTab]);

  useEffect(() => {
      const loadChat = async () => {
        if(selectedChatUser) {
            const msgs = await Storage.getMessages(selectedChatUser);
            setCurrentChat(msgs);
        }
      }
      loadChat();
  }, [selectedChatUser]);

  const refreshData = async () => {
    setTransactions(await Storage.getTransactions());
    setUsers(await Storage.getUsers());
    setChatUsers(await Storage.getUniqueChatUsers());
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setIsAuthenticated(true);
    } else {
      alert("Invalid Admin PIN");
    }
  };

  const handleTransaction = async (id: string, action: 'approved' | 'rejected') => {
    await Storage.updateTransactionStatus(id, action);
    refreshData();
  };

  // --- Deletion Logic ---

  const toggleTxSelection = (id: string) => {
      const newSet = new Set(selectedTxIds);
      if(newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setSelectedTxIds(newSet);
  }

  const handleBulkDelete = async () => {
      if(selectedTxIds.size === 0) {
          alert("Please select the history or items then press delete button.");
          return;
      }
      
      if(window.confirm(`Are you sure you want to delete ${selectedTxIds.size} selected items? This cannot be undone.`)) {
          for(const id of selectedTxIds) {
             await Storage.deleteTransaction(id);
          }
          setSelectedTxIds(new Set());
          refreshData();
      }
  }

  const initiateDeleteUser = (id: string) => {
      setUserToDelete(id);
      setDeleteConfirmText('');
      setDeleteModalOpen(true);
  }

  const confirmDeleteUser = async () => {
      if(userToDelete && deleteConfirmText === "DELETE THIS USER") {
          await Storage.deleteUser(userToDelete);
          setDeleteModalOpen(false);
          setUserToDelete(null);
          setDeleteConfirmText('');
          refreshData();
      }
  }

  // --- Backup & Restore Logic ---
  const handleExportData = async () => {
      const json = await Storage.exportDatabase();
      const blob = new Blob([json], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `voiceminder_backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }

  const handleImportClick = () => {
      backupInputRef.current?.click();
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          const json = event.target?.result as string;
          if(await Storage.importDatabase(json)) {
              alert("Database restored successfully! The page will now reload.");
              window.location.reload();
          } else {
              alert("Failed to restore database. Invalid file format.");
          }
      };
      reader.readAsText(file);
      e.target.value = ''; // Reset
  }

  // --- Chat Logic ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 1024 * 1024) {
          alert("File too large. Max 1MB allowed.");
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
          let type: 'image' | 'pdf' | 'text' = 'text';
          if (file.type.startsWith('image/')) type = 'image';
          else if (file.type === 'application/pdf') type = 'pdf';
          
          setAdminAttachment({
              type,
              url: reader.result as string,
              name: file.name
          });
      };
      
      if (file.type.startsWith('image/') || file.type === 'application/pdf' || file.type === 'text/plain') {
          reader.readAsDataURL(file);
      } else {
          alert("Only Images, PDFs, and Text files are supported.");
      }
      
      e.target.value = '';
  };

  const sendReply = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!selectedChatUser || (!adminMessage.trim() && !adminAttachment)) return;
      
      const msg: ChatMessage = {
          id: Date.now().toString(),
          senderId: 'admin',
          receiverId: selectedChatUser,
          text: adminMessage,
          attachment: adminAttachment || undefined,
          timestamp: Date.now(),
          read: false
      };
      await Storage.saveMessage(msg);
      setAdminMessage('');
      setAdminAttachment(null);
      setCurrentChat(await Storage.getMessages(selectedChatUser));
  }
  
  const renderAttachment = (att: ChatAttachment) => {
      if (att.type === 'image') {
          return (
              <div className="mb-2 cursor-pointer transition hover:opacity-80" onClick={() => setViewChatImage(att.url)}>
                  <img src={att.url} alt="attachment" className="max-w-full h-auto rounded-lg max-h-48 object-cover border border-white/10" />
              </div>
          );
      }
      return (
          <a href={att.url} download={att.name} className="flex items-center gap-2 bg-black/20 p-2 rounded-lg mb-2 hover:bg-black/40 transition">
               {att.type === 'pdf' ? <FileText size={20} className="text-red-400" /> : <FileText size={20} className="text-blue-400" />}
              <span className="text-xs underline truncate max-w-[150px]">{att.name}</span>
          </a>
      );
  };

  // --- Manual Plan Logic ---
  const setPlan = async (userId: string, plan: PlanType) => {
      await Storage.updateUserPlan(userId, plan);
      refreshData();
  };

  const deactivateSpecificPlan = async (userId: string, targetPlan: PlanType) => {
      const user = users.find(u => u.id === userId);
      if (user && user.plan === targetPlan) {
          await Storage.updateUserPlan(userId, PlanType.FREE);
          refreshData();
      } else {
          alert("User does not have this plan active.");
      }
  };

  const removePlan = async (userId: string) => {
      await Storage.updateUserPlan(userId, PlanType.FREE);
      refreshData();
  }

  const getPlanName = (type: PlanType) => {
      if(type === PlanType.FREE) return "Free";
      const p = PLANS.find(pl => pl.type === type);
      return p ? t(p.nameLabel) : type;
  }

  const getUserNameByEmail = (email: string) => {
      const u = users.find(user => user.email === email);
      return u ? u.name : 'Unknown User';
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
    <div className="glass-card rounded-[2rem] shadow-2xl min-h-[80vh] border border-red-900/30 overflow-hidden flex flex-col animate-in fade-in duration-500 relative">
      
      {viewTransaction && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-200" onClick={() => setViewTransaction(null)}>
              
              <button className="absolute top-4 right-4 text-white/70 hover:text-white transition p-2 bg-white/10 rounded-full z-[102] backdrop-blur-sm hover:bg-red-500 hover:rotate-90 duration-300">
                  <X size={24} />
              </button>
              
              <div className="w-full h-full flex flex-col items-center justify-center p-2 relative" onClick={(e) => e.stopPropagation()}>
                <div className="relative w-full flex-grow flex items-center justify-center overflow-hidden mb-2">
                    <img 
                        src={viewTransaction.screenshot} 
                        alt="Payment Proof Full" 
                        className="max-w-full max-h-[85vh] md:max-h-[80vh] rounded-xl shadow-2xl object-contain border border-gray-800 bg-black/50" 
                    />
                </div>
                
                <div className="w-full max-w-lg bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col gap-3 shrink-0 absolute bottom-4 md:relative md:bottom-auto z-[101]">
                    <div className="flex justify-between items-center text-xs text-gray-400 px-1">
                        <span>{new Date(viewTransaction.date).toLocaleDateString()}</span>
                        <span className="font-mono">ID: {viewTransaction.transactionId}</span>
                    </div>
                    <div className="flex flex-row gap-3 w-full">
                        {viewTransaction.status === 'pending' ? (
                            <>
                                <button 
                                    onClick={() => { handleTransaction(viewTransaction.id, 'approved'); setViewTransaction(null); }} 
                                    className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-500 flex items-center justify-center gap-2 font-bold shadow-lg active:scale-95 transition text-sm"
                                >
                                    <Check size={18} /> Approve
                                </button>
                                <button 
                                    onClick={() => { handleTransaction(viewTransaction.id, 'rejected'); setViewTransaction(null); }} 
                                    className="flex-1 bg-red-600 text-white py-3 rounded-xl hover:bg-red-500 flex items-center justify-center gap-2 font-bold shadow-lg active:scale-95 transition text-sm"
                                >
                                    <X size={18} /> Reject
                                </button>
                            </>
                        ) : (
                             <div className={`w-full text-center py-2 font-bold uppercase tracking-widest rounded-xl border ${viewTransaction.status === 'approved' ? 'text-green-400 border-green-900 bg-green-900/20' : 'text-red-400 border-red-900 bg-red-900/20'}`}>
                                 Status: {viewTransaction.status}
                             </div>
                        )}
                    </div>
                </div>
              </div>
          </div>
      )}

      {viewChatImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-200" onClick={() => setViewChatImage(null)}>
              <button className="absolute top-4 right-4 text-white/70 hover:text-white transition p-2 bg-white/10 rounded-full z-[102] backdrop-blur-sm hover:bg-red-500">
                  <X size={24} />
              </button>
              <div className="max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                  <img src={viewChatImage} alt="Chat Full" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl border border-white/10" />
              </div>
          </div>
      )}

      {deleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
              <div className="bg-gray-900 border border-red-500 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(220,38,38,0.5)] animate-in zoom-in-95">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertTriangle size={32} className="text-red-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Delete User?</h3>
                  <p className="text-gray-400 mb-6 text-sm">This action cannot be undone. All data will be lost.</p>
                  
                  <div className="text-left mb-2 text-xs font-bold text-red-400 uppercase">Type "DELETE THIS USER"</div>
                  <input 
                    type="text" 
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full bg-black border border-red-900 rounded-xl p-3 text-white mb-6 focus:border-red-500 outline-none placeholder-gray-600"
                    placeholder="DELETE THIS USER"
                  />
                  
                  <div className="flex gap-3">
                      <button 
                        onClick={() => setDeleteModalOpen(false)}
                        className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 font-bold"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={confirmDeleteUser}
                        disabled={deleteConfirmText !== "DELETE THIS USER"}
                        className={`flex-1 py-3 rounded-xl font-bold text-white transition-all ${deleteConfirmText === "DELETE THIS USER" ? 'bg-red-600 hover:bg-red-500 hover:shadow-lg' : 'bg-red-900/30 cursor-not-allowed opacity-50'}`}
                      >
                          Confirm Delete
                      </button>
                  </div>
              </div>
          </div>
      )}

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
        <button 
            onClick={() => setActiveTab('system')} 
            className={`flex-1 py-4 md:py-5 px-2 font-bold text-xs md:text-sm uppercase tracking-wider flex justify-center items-center gap-2 transition-all ${activeTab === 'system' ? 'bg-red-900/20 text-red-400 border-b-2 border-red-500' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
        >
            <Database size={16} /> System Backup
        </button>
      </div>

      <div className="p-4 md:p-8 flex-grow bg-black/20 overflow-y-auto custom-scrollbar">
        
        {activeTab === 'transactions' && (
          <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
            
            <div className="flex flex-wrap items-center gap-2 md:gap-4 p-1 bg-white/5 rounded-xl backdrop-blur-md border border-white/10 w-full md:w-auto inline-flex overflow-x-auto scrollbar-hide">
                <button 
                    onClick={() => setTransactionSubTab('pending')}
                    className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap ${transactionSubTab === 'pending' ? 'bg-yellow-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Clock size={16} /> Pending Approvals
                </button>
                <button 
                    onClick={() => setTransactionSubTab('history')}
                    className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap ${transactionSubTab === 'history' ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                   <History size={16} /> History
                </button>
                <button 
                    onClick={() => setTransactionSubTab('gallery')}
                    className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap ${transactionSubTab === 'gallery' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                   <Image size={16} /> Payment Gallery
                </button>
                
                {(transactionSubTab === 'history' || transactionSubTab === 'gallery') && (
                    <button 
                        onClick={handleBulkDelete}
                        className={`ml-auto px-4 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${selectedTxIds.size > 0 ? 'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                    >
                        <Trash2 size={16} />
                        <span className="hidden md:inline">Delete Selected</span>
                        {selectedTxIds.size > 0 && <span className="bg-white text-red-600 px-1.5 rounded-full text-xs">{selectedTxIds.size}</span>}
                    </button>
                )}
            </div>

            {transactionSubTab === 'pending' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="font-bold text-xl mb-6 text-white flex items-center gap-3">
                        <div className="w-1 h-8 bg-yellow-500 rounded-full"></div> {t('admin_pending')}
                    </h3>
                    
                    {transactions.filter(t => t.status === 'pending').length === 0 && (
                        <div className="p-12 text-center border border-dashed border-gray-800 rounded-2xl text-gray-600 bg-gray-900/20">{t('admin_no_pending')}</div>
                    )}
                    
                    <div className="space-y-4">
                        {transactions.filter(t => t.status === 'pending').map(tx => (
                        <div key={tx.id} className="bg-gray-900/50 border border-gray-700 rounded-3xl p-6 flex flex-col lg:flex-row gap-6 items-start hover:border-yellow-500/50 transition shadow-lg relative">
                            <div className="relative flex-shrink-0 w-full lg:w-40 h-40 bg-black rounded-2xl overflow-hidden cursor-pointer border border-gray-700 group mx-auto lg:mx-0" onClick={() => setViewTransaction(tx)}>
                            <img src={tx.screenshot} alt="Proof" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10">
                                <p className="text-xs font-bold text-white">CLICK TO VIEW</p>
                            </div>
                            </div>
                            <div className="flex-grow space-y-3 w-full">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                                <h4 className="font-bold text-2xl text-white">{tx.plan} Plan <span className="text-green-400 ml-2">₹{tx.amount}</span></h4>
                                <span className="text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-full">{new Date(tx.date).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-gray-300">{t('admin_th_email')}: <span className="text-white font-medium">{tx.userEmail}</span></p>
                            <p className="text-sm text-gray-400">User: {getUserNameByEmail(tx.userEmail)}</p>
                            <div className="bg-black/40 p-4 rounded-xl border border-gray-800 w-full md:w-auto">
                                <p className="text-xs text-gray-500 uppercase mb-1 font-bold">{t('check_txn_id')}</p>
                                <p className="text-lg font-mono text-yellow-400 font-bold tracking-wider select-all break-all">{tx.transactionId}</p>
                            </div>
                            </div>
                            <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-auto min-w-[140px] relative z-20">
                            <button onClick={() => handleTransaction(tx.id, 'approved')} className="flex-1 bg-green-600 text-white px-4 py-4 rounded-xl hover:bg-green-500 flex items-center justify-center gap-2 font-bold shadow-lg hover:scale-105 transition"><Check size={20} /> {t('admin_approve')}</button>
                            <button onClick={() => handleTransaction(tx.id, 'rejected')} className="flex-1 bg-red-600 text-white px-4 py-4 rounded-xl hover:bg-red-500 flex items-center justify-center gap-2 font-bold shadow-lg hover:scale-105 transition"><X size={20} /> {t('admin_reject')}</button>
                            </div>
                        </div>
                        ))}
                    </div>
                </div>
            )}

            {transactionSubTab === 'history' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="font-bold text-xl mb-6 text-white flex items-center gap-3">
                        <div className="w-1 h-8 bg-gray-600 rounded-full"></div> {t('admin_history')}
                    </h3>
                    <div className="overflow-x-auto rounded-2xl border border-gray-800 shadow-2xl">
                        <table className="w-full text-sm text-left text-gray-300 min-w-[600px]">
                            <thead className="bg-gray-800/80 text-gray-400 uppercase text-xs">
                                <tr>
                                    <th className="p-5 w-10">
                                        <div className="flex items-center justify-center"><CheckSquare size={16} /></div>
                                    </th>
                                    <th className="p-5">{t('admin_th_date')}</th>
                                    <th className="p-5">{t('admin_th_email')}</th>
                                    <th className="p-5">{t('admin_th_plan')}</th>
                                    <th className="p-5">{t('admin_th_status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {transactions.filter(t => t.status !== 'pending').map(tx => {
                                    const isSelected = selectedTxIds.has(tx.id);
                                    return (
                                        <tr key={tx.id} className={`hover:bg-white/5 transition cursor-pointer ${isSelected ? 'bg-indigo-900/20' : 'bg-gray-900/30'}`} onClick={() => toggleTxSelection(tx.id)}>
                                            <td className="p-5 text-center">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-600'}`}>
                                                    {isSelected && <Check size={14} className="text-white" />}
                                                </div>
                                            </td>
                                            <td className="p-5">{new Date(tx.date).toLocaleDateString()}</td>
                                            <td className="p-5">{tx.userEmail}</td>
                                            <td className="p-5 font-bold">{tx.plan}</td>
                                            <td className="p-5">
                                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${tx.status === 'approved' ? 'bg-green-900/30 text-green-400 border border-green-900' : 'bg-red-900/30 text-red-400 border border-red-900'}`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {transactionSubTab === 'gallery' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                     <h3 className="font-bold text-xl mb-6 text-white flex items-center gap-3">
                        <div className="w-1 h-8 bg-indigo-500 rounded-full"></div> Payment Gallery
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {transactions.map(tx => {
                            const isSelected = selectedTxIds.has(tx.id);
                            return (
                                <div key={tx.id} className={`glass-card rounded-2xl overflow-hidden border transition duration-300 group relative ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-gray-800 hover:border-indigo-500/50'}`}>
                                    <div 
                                        className="absolute top-2 left-2 z-20 cursor-pointer"
                                        onClick={(e) => { e.stopPropagation(); toggleTxSelection(tx.id); }}
                                    >
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors shadow-lg ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-black/50 border-white/50 hover:bg-black/70'}`}>
                                            {isSelected && <Check size={16} className="text-white" />}
                                        </div>
                                    </div>

                                    <div className="h-48 w-full bg-black relative cursor-pointer" onClick={() => setViewTransaction(tx)}>
                                        <img src={tx.screenshot} alt="Proof" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-500" />
                                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur text-[10px] font-bold uppercase rounded text-white">
                                            {tx.plan}
                                        </div>
                                        <div className={`absolute bottom-2 left-2 px-2 py-1 text-[10px] font-bold uppercase rounded text-black ${tx.status === 'approved' ? 'bg-green-500' : tx.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                                            {tx.status}
                                        </div>
                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center pointer-events-none">
                                            <Image size={32} className="text-white drop-shadow-lg" />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-900/50" onClick={() => toggleTxSelection(tx.id)}>
                                        <div className="flex items-center gap-2 mb-2 text-white font-bold">
                                            <Users size={14} className="text-indigo-400" />
                                            <span className="truncate">{getUserNameByEmail(tx.userEmail)}</span>
                                        </div>
                                        <div className="text-xs text-gray-400 mb-2 truncate">
                                            {tx.userEmail}
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-gray-500 border-t border-gray-800 pt-2 mt-2">
                                            <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(tx.date).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1"><Clock size={10} /> {new Date(tx.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

          </div>
        )}

        {activeTab === 'users' && (
          <div className="animate-in slide-in-from-right-5 duration-300 space-y-6">
            <div className="flex p-1 bg-white/5 rounded-xl backdrop-blur-md border border-white/10 w-full md:w-auto inline-flex">
                <button 
                    onClick={() => setUserSubTab('overview')}
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${userSubTab === 'overview' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <LayoutList size={16} /> User Overview
                </button>
                <button 
                    onClick={() => setUserSubTab('manual')}
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${userSubTab === 'manual' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'text-gray-400 hover:text-yellow-400 hover:bg-white/5'}`}
                >
                   <Settings size={16} /> Manual Plan Option
                </button>
            </div>

            {userSubTab === 'overview' && (
                <div className="bg-gray-900/50 rounded-3xl border border-gray-800 overflow-hidden animate-in fade-in">
                    <div className="p-6 bg-gray-800/50 border-b border-gray-800">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><Users size={20} /> User Overview</h3>
                    </div>
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
                            {users.map(u => {
                                const isOwner = u.email === OWNER_EMAIL;
                                return (
                                <tr key={u.id} className="hover:bg-white/5 transition">
                                    <td className="px-6 md:px-8 py-5 whitespace-nowrap font-bold text-white text-lg">{u.name}</td>
                                    <td className="px-6 md:px-8 py-5 whitespace-nowrap">{u.email}</td>
                                    <td className="px-6 md:px-8 py-5 whitespace-nowrap">
                                        <span className={`px-4 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full uppercase tracking-wide ${isOwner ? 'bg-yellow-500 text-black' : u.plan === 'Free' ? 'bg-gray-800 text-gray-400' : 'bg-indigo-900/30 text-indigo-300 border border-indigo-800'}`}>
                                            {isOwner ? 'LIFETIME' : getPlanName(u.plan)}
                                        </span>
                                    </td>
                                    <td className="px-6 md:px-8 py-5 whitespace-nowrap">
                                        {!isOwner && (
                                            <button onClick={() => initiateDeleteUser(u.id)} className="text-red-500 hover:text-white p-3 hover:bg-red-600 rounded-xl transition shadow-sm" title="Delete User">
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}

            {userSubTab === 'manual' && (
                <div className="bg-gray-900/50 rounded-3xl border border-gray-800 overflow-hidden animate-in fade-in">
                    <div className="p-6 bg-gray-800/50 border-b border-gray-800 flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><Zap size={20} className="text-yellow-400" /> Manual Plan Option</h3>
                        <span className="text-xs bg-yellow-900/30 text-yellow-500 px-2 py-1 rounded font-bold">ADMIN ONLY</span>
                    </div>
                    <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-800">
                        <thead className="bg-gray-800/80">
                            <tr>
                            <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-40">{t('admin_th_name')}</th>
                            <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-60">{t('admin_th_email')}</th>
                            <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Manual Plan Options (9 Controls)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-gray-300">
                            {users.filter(u => u.email !== OWNER_EMAIL).map(u => (
                                <tr key={`manual-${u.id}`} className="hover:bg-white/5 transition">
                                    <td className="px-6 py-4 font-bold text-white">{u.name}</td>
                                    <td className="px-6 py-4 text-xs font-mono text-gray-400">{u.email}</td>
                                    <td className="px-6 py-4">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-4xl">
                                            <button onClick={() => setPlan(u.id, PlanType.MONTHLY)} className="px-2 py-2 bg-green-900/30 text-green-400 border border-green-800 rounded hover:bg-green-600 hover:text-white text-[10px] uppercase font-bold transition">Active Basic</button>
                                            <button onClick={() => setPlan(u.id, PlanType.HALF_YEARLY)} className="px-2 py-2 bg-green-900/30 text-green-400 border border-green-800 rounded hover:bg-green-600 hover:text-white text-[10px] uppercase font-bold transition">Active Standard</button>
                                            <button onClick={() => setPlan(u.id, PlanType.YEARLY)} className="px-2 py-2 bg-green-900/30 text-green-400 border border-green-800 rounded hover:bg-green-600 hover:text-white text-[10px] uppercase font-bold transition">Active Premium</button>
                                            <button onClick={() => setPlan(u.id, PlanType.LIFETIME)} className="px-2 py-2 bg-green-900/30 text-green-400 border border-green-800 rounded hover:bg-green-600 hover:text-white text-[10px] uppercase font-bold transition">Active Infinity</button>
                                            
                                            <button onClick={() => deactivateSpecificPlan(u.id, PlanType.MONTHLY)} className="px-2 py-2 bg-red-900/20 text-red-400 border border-red-900/50 rounded hover:bg-red-900 hover:text-white text-[10px] uppercase font-bold transition">Deact Basic</button>
                                            <button onClick={() => deactivateSpecificPlan(u.id, PlanType.HALF_YEARLY)} className="px-2 py-2 bg-red-900/20 text-red-400 border border-red-900/50 rounded hover:bg-red-900 hover:text-white text-[10px] uppercase font-bold transition">Deact Standard</button>
                                            <button onClick={() => deactivateSpecificPlan(u.id, PlanType.YEARLY)} className="px-2 py-2 bg-red-900/20 text-red-400 border border-red-900/50 rounded hover:bg-red-900 hover:text-white text-[10px] uppercase font-bold transition">Deact Premium</button>
                                            <button onClick={() => deactivateSpecificPlan(u.id, PlanType.LIFETIME)} className="px-2 py-2 bg-red-900/20 text-red-400 border border-red-900/50 rounded hover:bg-red-900 hover:text-white text-[10px] uppercase font-bold transition">Deact Infinity</button>
                                        </div>
                                        <div className="mt-2">
                                            <button onClick={() => removePlan(u.id)} className="w-full py-2 bg-gray-800 border border-gray-600 text-gray-300 rounded hover:bg-gray-200 hover:text-black text-xs uppercase font-bold transition flex items-center justify-center gap-2">
                                                <RotateCcw size={12} /> Remove Plan (Reset to Free)
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}
          </div>
        )}

        {activeTab === 'chats' && (
            <div className="flex flex-col md:flex-row h-[650px] border border-gray-700 rounded-3xl overflow-hidden bg-gray-900/50 animate-in slide-in-from-right-5 duration-300">
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
                <div className="w-full md:w-2/3 flex flex-col bg-black/50 h-full">
                    {selectedChatUser ? (
                        <>
                            <div className="flex-grow p-4 md:p-8 overflow-y-auto space-y-6 custom-scrollbar">
                                {currentChat.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.senderId === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] p-4 rounded-2xl shadow-lg flex flex-col ${msg.senderId === 'admin' ? 'bg-red-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'}`}>
                                            {msg.attachment && renderAttachment(msg.attachment)}
                                            {msg.text && <p className="text-base leading-relaxed">{msg.text}</p>}
                                            <p className="text-[10px] opacity-50 mt-2 text-right font-mono uppercase">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {adminAttachment && (
                                <div className="px-4 py-2 bg-gray-900 border-t border-gray-700 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs text-red-300 truncate">
                                        {adminAttachment.type === 'image' ? <ImageIcon size={14} /> : <FileText size={14} />}
                                        {adminAttachment.name}
                                    </div>
                                    <button onClick={() => setAdminAttachment(null)} className="text-gray-400 hover:text-red-400"><X size={14} /></button>
                                </div>
                            )}

                            <form onSubmit={sendReply} className="p-4 md:p-6 border-t border-gray-700 flex gap-4 bg-gray-900/80 backdrop-blur-md items-center">
                                <button 
                                    type="button" 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition"
                                >
                                    <Paperclip size={20} />
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*,application/pdf,text/plain"
                                    onChange={handleFileSelect}
                                />

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

        {activeTab === 'system' && (
             <div className="flex flex-col items-center justify-center h-full p-8 animate-in slide-in-from-bottom-5 duration-500">
                <div className="glass-card rounded-3xl p-10 max-w-2xl w-full text-center border border-red-900/50 shadow-2xl">
                    <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                        <Database size={40} className="text-red-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Database Backup & Recovery</h2>
                    <p className="text-gray-400 mb-8 leading-relaxed">
                        Secure your entire platform data. This includes all users, payments, chat messages, and reminders.
                        Download the backup file regularly to prevent data loss.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 hover:bg-gray-800 transition">
                            <h3 className="font-bold text-white mb-2 flex items-center justify-center gap-2"><Download size={20} className="text-green-400" /> Export Data</h3>
                            <p className="text-xs text-gray-500 mb-6">Download a .JSON file containing all system data.</p>
                            <button 
                                onClick={handleExportData}
                                className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-500 transition shadow-lg"
                            >
                                Download Backup
                            </button>
                        </div>

                        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 hover:bg-gray-800 transition relative">
                            <h3 className="font-bold text-white mb-2 flex items-center justify-center gap-2"><Upload size={20} className="text-yellow-400" /> Import Data</h3>
                            <p className="text-xs text-gray-500 mb-6">Restore system from a previously saved .JSON file.</p>
                            <button 
                                onClick={handleImportClick}
                                className="w-full py-3 bg-yellow-600 text-white rounded-xl font-bold hover:bg-yellow-500 transition shadow-lg"
                            >
                                Restore Backup
                            </button>
                            <input 
                                type="file" 
                                ref={backupInputRef}
                                className="hidden"
                                accept=".json"
                                onChange={handleImportFile}
                            />
                        </div>
                    </div>
                    
                    <p className="mt-8 text-xs text-red-500/80 font-mono">
                        WARNING: Importing data will overwrite all current system data.
                    </p>
                </div>
             </div>
        )}

      </div>
    </div>
  );
};

export default AdminPanel;