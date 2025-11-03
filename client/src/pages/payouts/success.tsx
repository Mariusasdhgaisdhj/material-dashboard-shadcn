import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function PayoutSuccess() {
  const navigate = useNavigate();
  const message = 'Payout completed successfully! The seller has received the payment.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Payout Successful!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{message}</p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              The seller has been notified and the payment has been processed.
            </p>
          </div>
          
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={() => navigate('/orders')}
              className="bg-green-600 hover:bg-green-700"
            >
              Back to Orders
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
