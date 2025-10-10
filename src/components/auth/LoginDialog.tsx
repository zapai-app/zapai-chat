// NOTE: This file is stable and usually should not be modified.
// It is important that all functionality in this file is preserved, and should only be modified if explicitly requested.

import React, { useRef, useState, useEffect } from 'react';
import { Shield, Upload, AlertTriangle, UserPlus, KeyRound, Sparkles, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLoginActions } from '@/hooks/useLoginActions';
import { cn } from '@/lib/utils';

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onSignup?: () => void;
}

const validateNsec = (nsec: string) => {
  return /^nsec1[a-zA-Z0-9]{58}$/.test(nsec);
};

const validateBunkerUri = (uri: string) => {
  return uri.startsWith('bunker://');
};

const LoginDialog: React.FC<LoginDialogProps> = ({ isOpen, onClose, onLogin, onSignup }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [nsec, setNsec] = useState('');
  const [bunkerUri, setBunkerUri] = useState('');
  const [errors, setErrors] = useState<{
    nsec?: string;
    bunker?: string;
    file?: string;
    extension?: string;
  }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const login = useLoginActions();

  // Reset all state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setIsLoading(false);
      setIsFileLoading(false);
      setNsec('');
      setBunkerUri('');
      setErrors({});
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  const handleExtensionLogin = async () => {
    setIsLoading(true);
    setErrors(prev => ({ ...prev, extension: undefined }));

    try {
      if (!('nostr' in window)) {
        throw new Error('Nostr extension not found. Please install a NIP-07 extension.');
      }
      await login.extension();
      onLogin();
      onClose();
    } catch (e: unknown) {
      const error = e as Error;
      console.error('Bunker login failed:', error);
      console.error('Nsec login failed:', error);
      console.error('Extension login failed:', error);
      setErrors(prev => ({
        ...prev,
        extension: error instanceof Error ? error.message : 'Extension login failed'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const executeLogin = (key: string) => {
    setIsLoading(true);
    setErrors({});

    // Use a timeout to allow the UI to update before the synchronous login call
    setTimeout(() => {
      try {
        login.nsec(key);
        onLogin();
        onClose();
      } catch {
        setErrors({ nsec: "Failed to login with this key. Please check that it's correct." });
        setIsLoading(false);
      }
    }, 50);
  };

  const handleKeyLogin = () => {
    if (!nsec.trim()) {
      setErrors(prev => ({ ...prev, nsec: 'Please enter your secret key' }));
      return;
    }

    if (!validateNsec(nsec)) {
      setErrors(prev => ({ ...prev, nsec: 'Invalid secret key format. Must be a valid nsec starting with nsec1.' }));
      return;
    }
    executeLogin(nsec);
  };

  const handleBunkerLogin = async () => {
    if (!bunkerUri.trim()) {
      setErrors(prev => ({ ...prev, bunker: 'Please enter a bunker URI' }));
      return;
    }

    if (!validateBunkerUri(bunkerUri)) {
      setErrors(prev => ({ ...prev, bunker: 'Invalid bunker URI format. Must start with bunker://' }));
      return;
    }

    setIsLoading(true);
    setErrors(prev => ({ ...prev, bunker: undefined }));

    try {
      await login.bunker(bunkerUri);
      onLogin();
      onClose();
      // Clear the URI from memory
      setBunkerUri('');
    } catch {
      setErrors(prev => ({
        ...prev,
        bunker: 'Failed to connect to bunker. Please check the URI.'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFileLoading(true);
    setErrors({});

    const reader = new FileReader();
    reader.onload = (event) => {
      setIsFileLoading(false);
      const content = event.target?.result as string;
      if (content) {
        const trimmedContent = content.trim();
        if (validateNsec(trimmedContent)) {
          executeLogin(trimmedContent);
        } else {
          setErrors({ file: 'File does not contain a valid secret key.' });
        }
      } else {
        setErrors({ file: 'Could not read file content.' });
      }
    };
    reader.onerror = () => {
      setIsFileLoading(false);
      setErrors({ file: 'Failed to read file.' });
    };
    reader.readAsText(file);
  };

  const handleSignupClick = () => {
    onClose();
    if (onSignup) {
      onSignup();
    }
  };

  const defaultTab = 'nostr' in window ? 'extension' : 'key';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn("max-w-[95vw] sm:max-w-md max-h-[90vh] max-h-[90dvh] p-6 overflow-hidden")}
      >
        <DialogHeader className={cn('pb-4')}>
            <DialogDescription className="text-sm text-muted-foreground">
              Sign up or log in to continue
            </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 overflow-y-auto flex-1'>
          {/* Sign Up Section */}
          <div className='p-4 rounded-lg bg-accent/50 border'>
            <div className='text-center space-y-3'>
              <div className='flex justify-center items-center gap-2'>
                <Sparkles className='w-4 h-4 opacity-70' />
                <span className='text-sm font-medium'>
                  New to Nostr?
                </span>
              </div>
              <p className='text-xs text-muted-foreground'>
                Create a new account to get started
              </p>
              <Button
                onClick={handleSignupClick}
                className='w-full'
                size="sm"
              >
                <UserPlus className='w-4 h-4 mr-2' />
                <span>Sign Up</span>
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t'></div>
            </div>
            <div className='relative flex justify-center text-xs'>
              <span className='px-2 bg-background text-muted-foreground'>
                <span>Or log in</span>
              </span>
            </div>
          </div>

          {/* Login Methods */}
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="extension" className="text-xs">
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                <span>Extension</span>
              </TabsTrigger>
              <TabsTrigger value="key" className="text-xs">
                <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                <span>Key</span>
              </TabsTrigger>
              <TabsTrigger value="bunker" className="text-xs">
                <Cloud className="w-3.5 h-3.5 mr-1.5" />
                <span>Bunker</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value='extension' className='space-y-3'>
              {errors.extension && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{errors.extension}</AlertDescription>
                </Alert>
              )}
              <div className='text-center p-4 rounded-lg bg-accent/30'>
                <Shield className='w-10 h-10 mx-auto mb-2 opacity-70' />
                <p className='text-xs text-muted-foreground mb-3'>
                  Login with browser extension
                </p>
                <div className="flex justify-center">
                  <Button
                    className='w-full'
                    size="sm"
                    onClick={handleExtensionLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging in...' : 'Login with Extension'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value='key' className='space-y-3'>
              <div className='space-y-3'>
                <div className='space-y-1.5'>
                  <label htmlFor='nsec' className='text-xs font-medium'>
                    Secret Key (nsec)
                  </label>
                  <Input
                    id='nsec'
                    type="password"
                    value={nsec}
                    onChange={(e) => {
                      setNsec(e.target.value);
                      if (errors.nsec) setErrors(prev => ({ ...prev, nsec: undefined }));
                    }}
                    className={errors.nsec ? 'border-red-500' : ''}
                    placeholder='nsec1...'
                    autoComplete="off"
                  />
                  {errors.nsec && (
                    <p className="text-xs text-red-500">{errors.nsec}</p>
                  )}
                </div>

                <Button
                  className='w-full'
                  size="sm"
                  onClick={handleKeyLogin}
                  disabled={isLoading || !nsec.trim()}
                >
                  {isLoading ? 'Verifying...' : 'Log In'}
                </Button>

                <div className='relative'>
                  <div className='absolute inset-0 flex items-center'>
                    <div className='w-full border-t'></div>
                  </div>
                  <div className='relative flex justify-center text-xs'>
                    <span className='px-2 bg-background text-muted-foreground'>
                      or
                    </span>
                  </div>
                </div>

                <div className='text-center'>
                  <input
                    type='file'
                    accept='.txt'
                    className='hidden'
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    title="Upload key file"
                    aria-label="Upload key file"
                  />
                  <Button
                    variant='outline'
                    className='w-full'
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || isFileLoading}
                  >
                    <Upload className='w-4 h-4 mr-2' />
                    {isFileLoading ? 'Reading File...' : 'Upload Key File'}
                  </Button>
                  {errors.file && (
                    <p className="text-xs text-red-500 mt-1.5">{errors.file}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value='bunker' className='space-y-3'>
              <div className='space-y-1.5'>
                <label htmlFor='bunkerUri' className='text-xs font-medium'>
                  Bunker URI
                </label>
                <Input
                  id='bunkerUri'
                  value={bunkerUri}
                  onChange={(e) => {
                    setBunkerUri(e.target.value);
                    if (errors.bunker) setErrors(prev => ({ ...prev, bunker: undefined }));
                  }}
                  className={errors.bunker ? 'border-red-500' : ''}
                  placeholder='bunker://'
                  autoComplete="off"
                />
                {errors.bunker && (
                  <p className="text-xs text-red-500">{errors.bunker}</p>
                )}
              </div>

              <div className="flex justify-center">
                <Button
                  className='w-full'
                  size="sm"
                  onClick={handleBunkerLogin}
                  disabled={isLoading || !bunkerUri.trim()}
                >
                  {isLoading ? 'Connecting...' : 'Login with Bunker'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
    );
  };

export default LoginDialog;
