import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, AlertCircle } from 'lucide-react';

export default function PayoutFailed() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const sellerId = searchParams.get('sellerId');
  const payoutId = searchParams.get('payoutId');
  const errorCode = searchParams.get('error');

  useEffect(() => {
    // Set error message based on error code
    switch (errorCode) {
      case 'user_cancelled':
        setError('The seller cancelled the GCash authorization.');
        break;
      case 'insufficient_funds':
        setError('Insufficient funds in the seller\'s GCash account.');
        break;
      case 'invalid_account':
        setError('Invalid GCash account details.');
        break;
      default:
        setError('The payout authorization failed. Please try again.');
    }
  }, [errorCode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <XCircle className="w-6 h-6 text-red-600" />
            Payout Authorization Failed
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{error}</p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-medium text-red-800">What to do next:</p>
                <ul className="text-xs text-red-700 mt-1 space-y-1">
                  <li>• Verify the seller's GCash details are correct</li>
                  <li>• Ask the seller to try again with a different GCash account</li>
                  <li>• Use manual payout method as an alternative</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={() => navigate('/orders')}
              variant="outline"
            >
              Back to Orders
            </Button>
            
            <Button 
              onClick={() => navigate('/orders')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
