import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const userType = searchParams.get('userType');
      const error = searchParams.get('error');

      console.log('AuthCallback received:', { token, userType, error });

      if (error) {
        setError(error);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (token && userType) {
        try {
          localStorage.setItem('token', token);
          
          const userResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          console.log('User response status:', userResponse.status);

          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log('User data:', userData);
            localStorage.setItem('user', JSON.stringify(userData.user));
            
            switch (userType) {
              case 'INSTITUTIONAL':
                navigate('/institutional');
                break;
              case 'EXPERT':
                navigate('/expert/dashboard');
                break;
              case 'RETAIL':
                navigate('/expert/dashboard');
                break;
              case 'ADMIN':
                navigate('/admin');
                break;
              default:
                console.log('Unknown userType:', userType);
                navigate('/');
            }
          } else {
            throw new Error('Failed to fetch user data');
          }
        } catch (err) {
          console.error('Auth callback error:', err);
          setError('Authentication failed');
          setTimeout(() => navigate('/login'), 3000);
        }
      } else {
        console.log('No token or userType provided');
        setError('Invalid authentication response');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center">
        {error ? (
          <div className="text-red-500">
            <p className="text-xl font-semibold mb-2">Authentication Error</p>
            <p>{error}</p>
            <p className="text-sm text-gray-400 mt-4">Redirecting to login...</p>
          </div>
        ) : (
          <div className="text-white">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p className="text-xl font-semibold">Completing authentication...</p>
            <p className="text-gray-400 mt-2">Please wait</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
