import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, ChatAttachment } from '../types';
import { saveMessage, getMessages } from '../services/storageService';
import { MessageSquare, Send, MessageCircle, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ChatSupportProps {
  currentUser: User;
}

const ChatSupport: React.FC<ChatSupportProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
        const newMsgs = await getMessages(currentUser.id);
        setMessages(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(newMsgs)) {
                return newMsgs;
            }
            return prev;
        });
    };
    
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  useEffect(() => {
    if (chatContainerRef.current && isOpen) {
        const { scrollHeight, clientHeight } = chatContainerRef.current;
        chatContainerRef.current.scrollTo({
            top: scrollHeight - clientHeight,
            behavior: 'smooth'
        });
    }
  }, [messages, isOpen]);

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
          
          setAttachment({
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

  const removeAttachment = () => {
      setAttachment(null);
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !attachment) return;

    const msg: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      receiverId: 'admin',
      text,
      attachment: attachment || undefined,
      timestamp: Date.now(),
      read: false
    };
    
    await saveMessage(msg);
    
    const updatedMsgs = await getMessages(currentUser.id);
    setMessages(updatedMsgs);
    setText('');
    setAttachment(null);
  };

  const renderAttachment = (att: ChatAttachment) => {
      if (att.type === 'image') {
          return (
              <div className="mb-2 cursor-pointer transition hover:opacity-80" onClick={() => setSelectedImage(att.url)}>
                  <img src={att.url} alt="attachment" className="max-w-full h-auto rounded-lg max-h-40 object-cover border border-white/10" />
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

  return (
    <>
    {selectedImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-200" onClick={() => setSelectedImage(null)}>
            <button className="absolute top-4 right-4 text-white/70 hover:text-white transition p-2 bg-white/10 rounded-full z-[100] hover:bg-red-500">
                <X size={24} />
            </button>
            <div className="max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <img src={selectedImage} alt="Full View" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl border border-white/10" />
            </div>
        </div>
    )}

    <div className="glass-card rounded-2xl overflow-hidden border border-gray-700 shadow-xl">
      <div className="bg-gradient-to-r from-indigo-900 to-blue-900 p-4 text-white flex justify-between items-center cursor-pointer hover:brightness-110 transition" onClick={() => setIsOpen(!isOpen)}>
         <h3 className="font-bold flex items-center gap-2"><MessageSquare size={18} /> {t('chat_title')}</h3>
      </div>
      
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="h-[450px] flex flex-col bg-black/20">
            <div 
                ref={chatContainerRef}
                className="flex-grow overflow-y-auto p-4 space-y-3 scrollbar-hide scroll-smooth"
            >
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 text-sm mt-10 flex flex-col items-center gap-2">
                        <MessageCircle size={32} className="opacity-30" />
                        <p>{t('chat_intro')}</p>
                    </div>
                )}
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-xl text-sm flex flex-col ${msg.senderId === currentUser.id ? 'bg-indigo-600 text-white rounded-br-none shadow-md' : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'}`}>
                            {msg.attachment && renderAttachment(msg.attachment)}
                            {msg.text && <span>{msg.text}</span>}
                        </div>
                    </div>
                ))}
            </div>
            
            {attachment && (
                <div className="px-3 py-2 bg-gray-900 border-t border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-indigo-300 truncate">
                        {attachment.type === 'image' ? <ImageIcon size={14} /> : <FileText size={14} />}
                        {attachment.name}
                    </div>
                    <button onClick={removeAttachment} className="text-gray-400 hover:text-red-400"><X size={14} /></button>
                </div>
            )}

            <form onSubmit={handleSend} className="p-3 border-t border-gray-700 flex gap-2 bg-gray-900/50 items-center">
                <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition"
                >
                    <Paperclip size={18} />
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
                    className="flex-grow bg-black/40 border border-gray-700 rounded-xl px-3 py-2 focus:border-indigo-500 outline-none text-sm text-white placeholder-gray-500"
                    placeholder={t('chat_placeholder')}
                    value={text}
                    onChange={e => setText(e.target.value)}
                />
                <button type="submit" className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-500 transition shadow-lg">
                    <Send size={16} />
                </button>
            </form>
        </div>
      </div>
    </div>
    </>
  );
};

export default ChatSupport;