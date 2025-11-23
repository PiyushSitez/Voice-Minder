
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { saveMessage, getMessages } from '../services/storageService';
import { MessageSquare, Send, MessageCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ChatSupportProps {
  currentUser: User;
}

const ChatSupport: React.FC<ChatSupportProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { t } = useLanguage();
  
  // Use a ref for the scrollable container instead of an element at the bottom
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
        const newMsgs = getMessages(currentUser.id);
        // Only update state if the data actually changed to prevent unnecessary re-renders
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

  // Scroll to bottom of CHAT CONTAINER only, not the window
  useEffect(() => {
    if (chatContainerRef.current && isOpen) {
        const { scrollHeight, clientHeight } = chatContainerRef.current;
        chatContainerRef.current.scrollTo({
            top: scrollHeight - clientHeight,
            behavior: 'smooth'
        });
    }
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const msg: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      receiverId: 'admin',
      text,
      timestamp: Date.now(),
      read: false
    };
    
    saveMessage(msg);
    
    // Force immediate update locally
    const updatedMsgs = getMessages(currentUser.id);
    setMessages(updatedMsgs);
    setText('');
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-gray-700 shadow-xl">
      <div className="bg-gradient-to-r from-indigo-900 to-blue-900 p-4 text-white flex justify-between items-center cursor-pointer hover:brightness-110 transition" onClick={() => setIsOpen(!isOpen)}>
         <h3 className="font-bold flex items-center gap-2"><MessageSquare size={18} /> {t('chat_title')}</h3>
      </div>
      
      {/* We explicitly toggle visibility or height to ensure it doesn't take space/process when closed if preferred, 
          but keeping your existing design structure: */}
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
                        <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.senderId === currentUser.id ? 'bg-indigo-600 text-white rounded-br-none shadow-md' : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={handleSend} className="p-3 border-t border-gray-700 flex gap-2 bg-gray-900/50">
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
  );
};

export default ChatSupport;
