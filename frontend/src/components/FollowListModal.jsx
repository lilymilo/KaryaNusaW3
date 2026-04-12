import React, { useState, useEffect } from 'react';
import { X, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function FollowListModal({ isOpen, onClose, userId, type, title }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && userId) {
      const fetchUsers = async () => {
        try {
          setLoading(true);
          const { data } = await api.get(`/social/${type}/${userId}`);
          setUsers(data);
        } catch (err) {
          console.error(`Error fetching ${type}:`, err);
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Memuat daftar...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={32} className="text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-bold">Belum ada data untuk ditampilkan.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div 
                  key={u.id}
                  onClick={() => {
                    navigate(`/shop/${u.username || u.id}`);
                    onClose();
                  }}
                  className="flex items-center gap-4 p-3 rounded-2xl border border-transparent hover:border-gray-100 dark:hover:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-700 shadow-sm flex-shrink-0">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={24} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-green-600 transition-colors">{u.full_name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate">@{u.username}</p>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-green-600 bg-green-50 dark:bg-green-900/30 rounded-xl">
                    <ArrowRight size={18} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
