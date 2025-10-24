import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RelaySelector } from '@/components/RelaySelector';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Settings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your app preferences</p>
          </div>
        </div>

        {/* Relay Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Relay Configuration</CardTitle>
            <CardDescription>Choose which Nostr relay to connect to</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="relay">Nostr Relay</Label>
              <RelaySelector className="w-full" />
            </div>
          </CardContent>
        </Card>



        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>ZAI Chat - AI-powered chat with Lightning Network integration</p>
            <p>Built with Nostr protocol for decentralized communication</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
