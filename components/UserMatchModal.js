// components/UserMatchModal.js
import { useEffect } from 'react';

export default function UserMatchModal({ isOpen, onClose, user, matches }) {
  // Close modal on outside click or Esc key
  useEffect(() => {
    const handleKeyDown = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white/10 border border-white/20 p-6 rounded-2xl max-w-md w-full shadow-xl relative text-white"
        onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-3 right-4 text-white hover:text-red-300 text-xl"
        >
          &times;
        </button>

        <h3 className="text-xl font-bold mb-4 text-yellow-300">
          🎯 Correct Predictions by {user}
        </h3>

        {matches.length === 0 ? (
          <p className="text-blue-200">No correct predictions found.</p>
        ) : (
          <ul className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
            {matches.map((match, idx) => (
              <li 
                key={idx} 
                className="bg-white/5 hover:bg-white/10 p-3 rounded-lg transition-all duration-200 border-l-4 border-green-500/40"
              >
                <span className="text-sm">{match}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
