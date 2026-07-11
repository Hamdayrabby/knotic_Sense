import { useState } from 'react';
import api from '../../services/api';
import { X, Send, Loader } from 'lucide-react';

const EmailModal = ({ user, onClose }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setError('Subject and message are both required.');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      await api.post(`/admin/users/${user._id}/email`, { subject, message });
      setStatus('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send email.');
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-white font-semibold text-lg">Email user</h2>
            <p className="text-slate-400 text-sm mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        {status === 'success' ? (
          <div className="px-6 py-10 text-center">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send size={20} className="text-emerald-400" />
            </div>
            <p className="text-white font-medium">Email sent successfully</p>
            <p className="text-slate-400 text-sm mt-1">
              Your message was delivered to {user.email}.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Important update about your account"
                className="w-full bg-slate-800 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Write your message here..."
                className="w-full bg-slate-800 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 px-4 py-2.5 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1 pb-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={status === 'sending'}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {status === 'sending' ? (
                  <><Loader size={14} className="animate-spin" /> Sending…</>
                ) : (
                  <><Send size={14} /> Send email</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailModal;
