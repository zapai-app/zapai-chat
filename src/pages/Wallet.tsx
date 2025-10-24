import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap, RefreshCw, Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LoginArea } from '@/components/auth/LoginArea';
import { ZapButton } from '@/components/ZapButton';
import { ZapItem } from '@/components/ZapItem';
import { useAuthor } from '@/hooks/useAuthor';
import { useBalance } from '@/hooks/useBalance';
import { useReceivedZaps } from '@/hooks/useReceivedZaps';
import { genUserName } from '@/lib/genUserName';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { nip19 } from 'nostr-tools';

export function Wallet() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  // Get bot pubkey from environment variable
  const botPubkey = useMemo(() => {
    const envPubkey = import.meta.env.VITE_TARGET_PUBKEY;
    
    if (!envPubkey) {
      return null;
    }

    // If it's already in hex format, return it
    if (envPubkey.match(/^[0-9a-f]{64}$/i)) {
      return envPubkey;
    }

    // Try to decode from npub format
    try {
      const decoded = nip19.decode(envPubkey);
      if (decoded.type === 'npub' && typeof decoded.data === 'string') {
        return decoded.data;
      }
    } catch {
      console.error('Invalid VITE_TARGET_PUBKEY format. Use hex or npub format.');
    }

    return null;
  }, []);

  // Fetch user's balance from bot (real-time subscription)
  const { data: balanceData, isLoading: isLoadingBalance, refetch: refetchBalance } = useBalance();
  const balance = balanceData?.totalSats ?? 0;

  // Fetch all zap receipts sent to the bot
  const { zaps, totals, isLoading: isLoadingZaps, refetch: refetchZaps } = useReceivedZaps(botPubkey);

  // Fetch bot's profile
  const botAuthor = useAuthor(botPubkey || undefined);
  const botMetadata = botAuthor.data?.metadata;
  const botDisplayName = botMetadata?.name || botMetadata?.display_name || genUserName(botPubkey || '');


  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="bg-muted border-border max-w-md">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>You need to log in to send zaps</CardDescription>
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

  if (!botPubkey) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="bg-muted border-border max-w-md">
          <CardHeader>
            <CardTitle>Configuration Error</CardTitle>
            <CardDescription>Bot public key is not configured</CardDescription>
          </CardHeader>
          <CardContent>
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10 hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Wallet</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your account balance</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetchBalance()}
            disabled={isLoadingBalance}
            className="h-10 w-10"
            title="Refresh balance"
          >
            <RefreshCw className={`h-5 w-5 ${isLoadingBalance ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Balance Card */}
        <Card className="overflow-hidden border-2">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8">
            {isLoadingBalance ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Current Balance
                  </p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-bold tracking-tight">
                      {balance.toLocaleString()}
                    </span>
                    <span className="text-2xl font-semibold text-muted-foreground">
                      sats
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ≈ ${(balance * 0.0001).toFixed(2)} USD
                  </p>
                </div>
                <div className="hidden sm:flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-12 w-12 text-primary" />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Charge Account Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Charge Your Account</CardTitle>
                <CardDescription>
                  Send a Lightning zap to add funds to your balance
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bot Profile */}
            <div className="flex items-center gap-4 rounded-lg border bg-muted/50 p-4">
              <Avatar className="h-14 w-14 border-2 border-background">
                <AvatarImage src={botMetadata?.picture} alt={botDisplayName} />
                <AvatarFallback className="bg-primary/10">
                  <Zap className="h-7 w-7 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold truncate">{botDisplayName}</h3>
                {botMetadata?.about && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                    {botMetadata.about}
                  </p>
                )}
              </div>
            </div>

            {/* Zap Button */}
            {botPubkey && (
              <div className="space-y-4">
                <div className="rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Zap className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-semibold">Send Lightning Payment</h4>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Zaps sent to this account will be credited to your balance instantly
                      </p>
                    </div>
                    <ZapButton 
                      target={null}
                      targetPubkey={botPubkey}
                      className="w-full max-w-sm h-12 text-base font-semibold"
                      showCount={false}
                    />
                  </div>
                </div>

                {/* Info Cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card className="border-muted-foreground/20">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <h5 className="font-semibold text-sm">Instant Credit</h5>
                          <p className="text-xs text-muted-foreground">
                            Your balance updates immediately after payment confirmation
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-muted-foreground/20">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <h5 className="font-semibold text-sm">Auto-Linked</h5>
                          <p className="text-xs text-muted-foreground">
                            Zaps are automatically linked to your Nostr account
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-muted-foreground/20">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <h5 className="font-semibold text-sm">Lightning Fast</h5>
                          <p className="text-xs text-muted-foreground">
                            Pay with any Lightning wallet for quick transactions
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Zaps</p>
                  <p className="text-2xl font-bold">
                    {isLoadingZaps ? <Skeleton className="h-8 w-16" /> : totals.zapCount}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Received</p>
                  <p className="text-2xl font-bold">
                    {isLoadingZaps ? <Skeleton className="h-8 w-24" /> : `${totals.totalSats.toLocaleString()}`}
                  </p>
                  <p className="text-xs text-muted-foreground">sats</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Unique Senders</p>
                  <p className="text-2xl font-bold">
                    {isLoadingZaps ? <Skeleton className="h-8 w-16" /> : totals.uniqueSenders}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Received Zaps */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>All Lightning payments you sent to charge your account</CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetchBalance();
                  refetchZaps();
                }}
                disabled={isLoadingZaps}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingZaps ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingZaps ? (
              <div className="space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : zaps.length > 0 ? (
              <div className="space-y-3">
                {zaps.map((zap) => (
                  <ZapItem key={zap.id} zap={zap} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Zap className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  No zaps received yet. Send a zap to the bot to charge your account.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}