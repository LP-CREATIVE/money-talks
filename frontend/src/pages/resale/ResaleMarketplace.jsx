import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { resale } from '../../services/api';
import { 
  Search, Filter, TrendingUp, DollarSign, ShoppingCart, 
  Star, Clock, Building, AlertCircle, Loader2, Tag, ArrowLeft
} from 'lucide-react';

const ResaleMarketplace = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    sector: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'newest'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [filters]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const response = await resale.getMarketplace(filters);
      setListings(response.data.listings);
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
    setLoading(false);
  };

  const handlePurchase = (answerId) => {
    navigate(`/resale/purchase/${answerId}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const sectors = [
    'Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer', 
    'Industrial', 'Real Estate', 'Materials', 'Utilities'
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingCart className="text-green-500" />
                Research Marketplace
              </h1>
              <p className="text-gray-400 mt-1">
                Buy validated answers at a fraction of the original cost
              </p>
            </div>
            <button
              onClick={() => navigate('/institutional')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search answers by content or question..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Filter size={20} />
              Filters
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-700/50 rounded-lg grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Sector</label>
                <select
                  value={filters.sector}
                  onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500"
                >
                  <option value="">All Sectors</option>
                  {sectors.map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Min Price</label>
                <input
                  type="number"
                  placeholder="$0"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Max Price</label>
                <input
                  type="number"
                  placeholder="$10,000"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Marketplace Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-green-500" size={40} />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <AlertCircle className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-400">No answers available in the marketplace</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">
                      {listing.question.idea.title}
                    </h3>
                    <p className="text-gray-400 mb-3">{listing.question.text}</p>
                    
                    {/* Answer Preview */}
                    <div className="bg-gray-900/50 rounded-lg p-4 mb-3">
                      <p className="text-sm text-gray-300 line-clamp-3">
                        {listing.content.substring(0, 300)}...
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Building size={16} />
                        {listing.user.organizationName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Tag size={16} />
                        {listing.question.idea.sector || 'N/A'}
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp size={16} />
                        {listing._count.resalePurchases} purchases
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={16} />
                        Score: {listing.finalScore || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Price and Action */}
                  <div className="ml-6 text-right">
                    <div className="text-2xl font-bold text-green-500 mb-2">
                      {formatCurrency(listing.resalePrice)}
                    </div>
                    <div className="text-sm text-gray-400 mb-3">
                      Original: {formatCurrency(listing.question.escrowAmount || 1000)}
                    </div>
                    <button
                      onClick={() => handlePurchase(listing.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <ShoppingCart size={18} />
                      Purchase
                    </button>
                  </div>
                </div>

                {/* Cost Savings Badge */}
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-sm">
                  <DollarSign size={16} />
                  Save {Math.round((1 - listing.resalePrice / (listing.question.escrowAmount || 1000)) * 100)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResaleMarketplace;
