import React, { useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';
import { demo } from '../../services/api';

const DemoEmailSender = () => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const sendDemoEmail = async () => {
    setSending(true);
    setError('');
    try {
      const response = await demo.sendOutreachEmail({ email });
      
      if (response.data.success) {
        setSent(true);
        setTimeout(() => {
          setSent(false);
          setEmail('');
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to send demo email:', error);
      setError(error.response?.data?.error || 'Failed to send email');
    }
    setSending(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-xl font-bold text-white mb-4">Demo: Expert Outreach</h3>
      
      <div className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
        />
        
        <button
          onClick={sendDemoEmail}
          disabled={!email || sending}
          className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-semibold"
        >
          {sending ? 'Sending...' : sent ? 'Email Sent!' : 'Send Demo Email'}
        </button>
        
        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}
        
        {sent && (
          <p className="text-green-400 text-sm">Email sent to {email}</p>
        )}
      </div>
    </div>
  );
};

export default DemoEmailSender;
