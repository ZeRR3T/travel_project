'use client';

import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-all duration-300">
      <div className="card-navbar w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-slate-900/50 border border-slate-600/30 transition-all duration-300 transform scale-95 animate-in">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-600/30 bg-gradient-to-r from-slate-700/50 to-slate-800/50 backdrop-blur-md">
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="group p-2 rounded-xl hover:bg-slate-700/50 hover:border border-slate-600/30 transition-all duration-300 hover:scale-110"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors duration-300" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
        
        {/* Decorative footer */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-b-2xl"></div>
      </div>
    </div>
  );
}
