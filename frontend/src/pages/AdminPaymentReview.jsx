import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { DollarSign, CheckCircle, XCircle, AlertTriangle, Clock, TrendingUp, Shield, FileText } from 'lucide-react';

function AdminPaymentReview() {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      await fetchPendingPayments();
      await fetchAnalytics();
    };
    loadData();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const response = await api.get('/payments/pending');
      setPendingPayments(response.data.pendingPayments || []);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/payments/analytics');
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleReview = async (answerId, approved) => {
    if (!adminNotes && !approved) {
      alert('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/payments/${answerId}/review`, {
        approved,
        adminNotes,
        rejectionReason: !approved ? adminNotes : undefined
      });

      alert(approved ? 'Payment approved!' : 'Answer rejected');
      setSelectedPayment(null);
      setAdminNotes('');
      await fetchPendingPayments();
      await fetchAnalytics();
    } catch (error) {
      console.error('Error reviewing payment:', error);
      alert('Error processing review');
    }
    setLoading(false);
  };

  const ScoreDimension = ({ label, score, details }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className={`text-sm font-bold ${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
          {score?.toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${score >= 80 ? 'bg-green-600' : score >= 60 ? 'bg-yellow-600' : 'bg-red-600'}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Payment Review Dashboard</h1>
          <p className="text-gray-600">Review and approve expert answer payments</p>
        </div>

        {/* Analytics Summary */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Payments</p>
                  <p className="text-2xl font-bold">{analytics.pendingPayments || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Paid (30d)</p>
                  <p className="text-2xl font-bold">${analytics.totalAmount?.toFixed(2) || '0.00'}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Platform Revenue (30d)</p>
                  <p className="text-2xl font-bold">${analytics.totalPlatformRevenue?.toFixed(2) || '0.00'}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Veracity Score</p>
                  <p className="text-2xl font-bold">{analytics.avgVeracityScore?.toFixed(1) || '0'}%</p>
                </div>
                <Shield className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Payments List */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Pending Reviews ({pendingPayments.length})</h2>
            <div className="space-y-4 max-h-screen overflow-y-auto">
              {pendingPayments.map(payment => (
                <div 
                  key={payment.id}
                  className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedPayment(payment)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm">
                      {payment.question?.idea?.title || 'Question'}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded ${
                      payment.veracityScore >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      Score: {payment.veracityScore?.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    {payment.question?.text?.substring(0, 100)}...
                  </p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{payment.user?.email}</span>
                    <span>${payment.question?.escrowAmount || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Payment Details */}
          <div className="lg:col-span-2">
            {selectedPayment ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Payment Review Details</h2>
                
                {/* Tab Navigation */}
                <div className="border-b mb-4">
                  <nav className="flex space-x-8">
                    <button className="py-2 px-1 border-b-2 border-blue-500 font-medium text-sm">
                      Answer
                    </button>
                    <button className="py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500">
                      Veracity Score
                    </button>
                    <button className="py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500">
                      Expert Profile
                    </button>
                  </nav>
                </div>

                {/* Answer Content */}
                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="font-semibold mb-2">Question:</h3>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">
                      {selectedPayment.question?.text}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Answer:</h3>
                    <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
                      <p className="whitespace-pre-wrap">{selectedPayment.content}</p>
                    </div>
                  </div>
                  
                  {selectedPayment.sources && (
                    <div>
                      <h3 className="font-semibold mb-2">Sources:</h3>
                      <p className="text-gray-700">{selectedPayment.sources}</p>
                    </div>
                  )}
                </div>

                {/* Veracity Score Details */}
                {selectedPayment.veracityScoreDetail && (
                  <div className="bg-gray-50 p-4 rounded mb-6">
                    <h3 className="font-semibold mb-4">Veracity Score Breakdown</h3>
                    <div className="text-center mb-6">
                      <span className={`text-5xl font-bold ${
                        selectedPayment.veracityScoreDetail.overallScore >= 80 ? 'text-green-600' : 
                        selectedPayment.veracityScoreDetail.overallScore >= 60 ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {selectedPayment.veracityScoreDetail.overallScore?.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <ScoreDimension 
                        label="P1: Identity Verification" 
                        score={selectedPayment.veracityScoreDetail.identityScore}
                      />
                      <ScoreDimension 
                        label="P2: Profile Match" 
                        score={selectedPayment.veracityScoreDetail.profileMatchScore}
                      />
                      <ScoreDimension 
                        label="P3: Answer Quality" 
                        score={selectedPayment.veracityScoreDetail.answerQualityScore}
                      />
                      <ScoreDimension 
                        label="P4: Document Authenticity" 
                        score={selectedPayment.veracityScoreDetail.documentScore}
                      />
                      <ScoreDimension 
                        label="P5: No Contradictions" 
                        score={selectedPayment.veracityScoreDetail.contradictionScore}
                      />
                      <ScoreDimension 
                        label="P6: Corroboration" 
                        score={selectedPayment.veracityScoreDetail.corroborationScore}
                      />
                    </div>
                  </div>
                )}

                {/* Admin Review Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Admin Notes / Rejection Reason
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about your decision..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleReview(selectedPayment.id, true)}
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center justify-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Payment
                    </button>
                    <button
                      onClick={() => handleReview(selectedPayment.id, false)}
                      disabled={loading || !adminNotes}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex items-center justify-center"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Answer
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-600 text-center">
                    Approving will release ${(selectedPayment.question?.escrowAmount * 0.5).toFixed(2)} to the expert
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Select a payment to review</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPaymentReview;
