import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Wallet as WalletIcon, Plus, Zap, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LoginArea } from '@/components/auth/LoginArea';
import { useToast } from '@/hooks/useToast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { nip19 } from 'nostr-tools';

export function Wallet() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Mock balance - در production باید از API بیاید
  const balance = 0; // سرویس باید balance واقعی را برگرداند

  const npub = user ? nip19.npubEncode(user.pubkey) : '';

  const handleCopyPubkey = async () => {
    if (npub) {
      await navigator.clipboard.writeText(npub);
      setCopied(true);
      toast({ title: 'Public key copied!' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeposit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({ 
        title: 'Invalid amount', 
        description: 'Please enter a valid satoshi amount',
        variant: 'destructive' 
      });
      return;
    }

    // اینجا باید با API سرور ارتباط برقرار شود
    // API باید یک Lightning invoice برگرداند
    toast({
      title: 'Coming soon',
      description: 'Lightning invoice generation will be implemented on the server side'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="bg-white/[0.03] border-white/[0.08] max-w-md">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>You need to log in to access your wallet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoginArea className="w-full" />
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="w-full"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10 hover:bg-white/[0.08]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Wallet</h1>
            <p className="text-sm text-gray-400 mt-1">Manage your satoshis</p>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <WalletIcon className="h-5 w-5 text-primary" />
              <CardTitle>Current Balance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-5xl font-bold text-white flex items-baseline gap-2">
                {balance.toLocaleString()}
                <span className="text-xl text-gray-400">sats</span>
              </div>
              <p className="text-sm text-gray-400">
                ≈ ${(balance * 0.0001).toFixed(2)} USD
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Your Public Key */}
        <Card className="bg-white/[0.03] border-white/[0.08]">
          <CardHeader>
            <CardTitle>Your Account</CardTitle>
            <CardDescription>Your balance is linked to your Nostr public key</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Public Key (npub)</Label>
              <div className="flex gap-2">
                <Input
                  value={npub}
                  readOnly
                  className="font-mono text-xs bg-white/[0.03] border-white/[0.08]"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyPubkey}
                  className="border-white/[0.08] hover:bg-white/[0.08]"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deposit Card */}
        <Card className="bg-white/[0.03] border-white/[0.08]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-500" />
              <CardTitle>Deposit Satoshis</CardTitle>
            </div>
            <CardDescription>Add funds to your account via Lightning Network</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-yellow-500/10 border-yellow-500/20">
              <Zap className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-sm text-yellow-200">
                <strong>Server API Required:</strong> Lightning invoice generation needs to be implemented on the server side.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (sats)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount in satoshis"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-white/[0.03] border-white/[0.08]"
              />
            </div>

            <Button
              onClick={handleDeposit}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Zap className="h-4 w-4 mr-2" />
              Generate Lightning Invoice
            </Button>

            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>How it works:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Enter the amount you want to deposit</li>
                <li>Server generates a Lightning Network invoice</li>
                <li>Pay the invoice from any Lightning wallet</li>
                <li>Funds are credited to your account immediately</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* API Implementation Guide */}
        <Card className="bg-white/[0.03] border-white/[0.08]">
          <CardHeader>
            <CardTitle>🔧 Server Implementation Needed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-white mb-2">Required API Endpoints:</h3>
              <div className="space-y-3 text-gray-400">
                <div className="bg-white/[0.03] p-3 rounded border border-white/[0.08]">
                  <code className="text-xs">GET /api/wallet/:pubkey/balance</code>
                  <p className="mt-1">Returns current balance for user's public key</p>
                </div>
                <div className="bg-white/[0.03] p-3 rounded border border-white/[0.08]">
                  <code className="text-xs">POST /api/wallet/:pubkey/invoice</code>
                  <p className="mt-1">Creates Lightning invoice for deposit</p>
                  <p className="text-xs mt-1">Body: {`{ "amount": number }`}</p>
                </div>
                <div className="bg-white/[0.03] p-3 rounded border border-white/[0.08]">
                  <code className="text-xs">GET /api/wallet/:pubkey/transactions</code>
                  <p className="mt-1">Returns transaction history</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">Implementation Suggestions:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>Use LND, CLN, or Eclair for Lightning Network integration</li>
                <li>Store balances in PostgreSQL or similar database</li>
                <li>Implement webhook for payment confirmation</li>
                <li>Add proper authentication and rate limiting</li>
                <li>Consider using BTCPay Server for easier integration</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
