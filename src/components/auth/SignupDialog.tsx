// NOTE: This file is stable and usually should not be modified.
// It is important that all functionality in this file is preserved, and should only be modified if explicitly requested.

import React, { useState, useEffect, useRef } from 'react';
import { Download, Key, UserPlus, FileText, Shield, User, Sparkles, LogIn, CheckCircle, Upload, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/useToast';
import { useLoginActions } from '@/hooks/useLoginActions';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useUploadFile } from '@/hooks/useUploadFile';
import { generateSecretKey, nip19 } from 'nostr-tools';
import { cn } from '@/lib/utils';

interface SignupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const sanitizeFilename = (filename: string) => {
  return filename.replace(/[^a-z0-9_.-]/gi, '_');
}

const SignupDialog: React.FC<SignupDialogProps> = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState<'welcome' | 'generate' | 'download' | 'profile' | 'done'>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [nsec, setNsec] = useState('');
  const [showSparkles, setShowSparkles] = useState(false);
  const [keySecured, setKeySecured] = useState<'none' | 'downloaded'>('none');
  const [profileData, setProfileData] = useState({
    name: '',
    about: '',
    picture: ''
  });
  const login = useLoginActions();
  const { mutateAsync: publishEvent, isPending: isPublishing } = useNostrPublish();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Generate a proper nsec key using nostr-tools
  const generateKey = () => {
    setIsLoading(true);
    setShowSparkles(true);

    // Add a dramatic pause for the key generation effect
    setTimeout(() => {
      try {
        // Generate a new secret key
        const sk = generateSecretKey();

        // Convert to nsec format
        setNsec(nip19.nsecEncode(sk));
        setStep('download');

        toast({
          title: 'Your Secret Key is Ready!',
          description: 'A new secret key has been generated for you.',
        });
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to generate key. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
        setShowSparkles(false);
      }
    }, 2000);
  };

  const downloadKey = () => {
    try {
      // Create a blob with the key text
      const blob = new Blob([nsec], { type: 'text/plain; charset=utf-8' });
      const url = globalThis.URL.createObjectURL(blob);

      // Sanitize filename
      const filename = sanitizeFilename('nostr-nsec-key.txt');

      // Create a temporary link element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      // Clean up immediately
      globalThis.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Mark as secured
      setKeySecured('downloaded');

      toast({
        title: 'Secret Key Saved!',
        description: 'Your key has been safely stored.',
      });
    } catch {
      toast({
        title: 'Download failed',
        description: 'Could not download the key file. Please copy it manually.',
        variant: 'destructive',
      });
    }
  };



  const finishKeySetup = () => {
    try {
      login.nsec(nsec);
      setStep('profile');
    } catch {
      toast({
        title: 'Login Failed',
        description: 'Failed to login with the generated key. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input
    e.target.value = '';

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file for your avatar.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Avatar image must be smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const tags = await uploadFile(file);
      // Get the URL from the first tag
      const url = tags[0]?.[1];
      if (url) {
        setProfileData(prev => ({ ...prev, picture: url }));
        toast({
          title: 'Avatar uploaded!',
          description: 'Your avatar has been uploaded successfully.',
        });
      }
    } catch {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const finishSignup = async (skipProfile = false) => {
    // Mark signup completion time for fallback welcome modal
    localStorage.setItem('signup_completed', Date.now().toString());

    try {
      // Publish profile if user provided information
      if (!skipProfile && (profileData.name || profileData.about || profileData.picture)) {
        const metadata: Record<string, string> = {};
        if (profileData.name) metadata.name = profileData.name;
        if (profileData.about) metadata.about = profileData.about;
        if (profileData.picture) metadata.picture = profileData.picture;

        await publishEvent({
          kind: 0,
          content: JSON.stringify(metadata),
        });

        toast({
          title: 'Profile Created!',
          description: 'Your profile has been set up.',
        });
      }

      // Close signup and show welcome modal
      onClose();
      if (onComplete) {
        // Add a longer delay to ensure login state has fully propagated
        setTimeout(() => {
          onComplete();
        }, 600);
      } else {
        // Fallback for when used without onComplete
        setStep('done');
        setTimeout(() => {
          onClose();
          toast({
            title: 'Welcome!',
            description: 'Your account is ready.',
          });
        }, 3000);
      }
    } catch {
      toast({
        title: 'Profile Setup Failed',
        description: 'Your account was created but profile setup failed. You can update it later.',
        variant: 'destructive',
      });

      // Still proceed to completion even if profile failed
      onClose();
      if (onComplete) {
        // Add a longer delay to ensure login state has fully propagated
        setTimeout(() => {
          onComplete();
        }, 600);
      } else {
        // Fallback for when used without onComplete
        setStep('done');
        setTimeout(() => {
          onClose();
          toast({
            title: 'Welcome!',
            description: 'Your account is ready.',
          });
        }, 3000);
      }
    }
  };

  const getTitle = () => {
    if (step === 'welcome') return (
      <span className="flex items-center justify-center gap-2">
        Create Your Account
      </span>
    );
    if (step === 'generate') return (
      <span className="flex items-center justify-center gap-2">
        Generating Your Key
      </span>
    );
    if (step === 'download') return (
      <span className="flex items-center justify-center gap-2">
        Secret Key
      </span>
    );
    if (step === 'profile') return (
      <span className="flex items-center justify-center gap-2">
        Create Your Profile
      </span>
    );
    return (
      <span className="flex items-center justify-center gap-2">
        Welcome!
      </span>
    );
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep('welcome');
      setIsLoading(false);
      setNsec('');
      setShowSparkles(false);
      setKeySecured('none');
      setProfileData({ name: '', about: '', picture: '' });
    }
  }, [isOpen]);

  // Add sparkle animation effect
  useEffect(() => {
    if (showSparkles) {
      const interval = setInterval(() => {
        // This will trigger re-renders for sparkle animation
      }, 100);
      return () => clearInterval(interval);
    }
  }, [showSparkles]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn("max-w-[95vw] sm:max-w-md max-h-[90vh] max-h-[90dvh] p-6 overflow-hidden flex flex-col")}
      >
        <DialogHeader className={cn('pb-4 flex-shrink-0')}>
          <DialogTitle className={cn('text-base text-center')}>
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-4 overflow-y-auto flex-1'>
          {/* Welcome Step */}
          {step === 'welcome' && (
            <div className='text-center space-y-4'>
              {/* Hero illustration */}
              <div className='p-4 rounded-lg bg-accent/50 border'>
                <div className='flex justify-center items-center space-x-3 mb-3'>
                  <UserPlus className='w-8 h-8 opacity-70' />
                  <Globe className='w-10 h-10 opacity-70' />
                  <FileText className='w-8 h-8 opacity-70' />
                </div>

                {/* Benefits */}
                <div className='grid grid-cols-1 gap-1.5 text-xs'>
                  <div className='flex items-center justify-center gap-2 text-muted-foreground'>
                    <Shield className='w-3.5 h-3.5' />
                    Decentralized and censorship-resistant
                  </div>
                  <div className='flex items-center justify-center gap-2 text-muted-foreground'>
                    <User className='w-3.5 h-3.5' />
                    You control your data
                  </div>
                  <div className='flex items-center justify-center gap-2 text-muted-foreground'>
                    <Globe className='w-3.5 h-3.5' />
                    Join a global network
                  </div>
                </div>
              </div>

              <div className='space-y-3'>
                <Button
                  className='w-full'
                  size="sm"
                  onClick={() => setStep('generate')}
                >
                  <LogIn className='w-4 h-4 mr-2' />
                  Get Started
                </Button>
              </div>
            </div>
          )}

          {/* Generate Step */}
          {step === 'generate' && (
            <div className='text-center space-y-4'>
              <div className='p-4 rounded-lg bg-accent/50 border'>
                <div>
                  {isLoading ? (
                    <div className='space-y-3'>
                      <div className='relative'>
                        <Key className='w-16 h-16 mx-auto opacity-70 animate-pulse' />
                      </div>
                      <div className='space-y-1.5'>
                        <p className='text-sm font-medium flex items-center justify-center gap-2'>
                          <Sparkles className='w-4 h-4' />
                          Generating your secret key...
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          Creating your secure key
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      <Key className='w-16 h-16 mx-auto opacity-70' />
                      <div className='space-y-1.5'>
                        <p className='text-sm font-medium'>
                          Ready to generate your secret key?
                        </p>
                        <p className='text-xs text-muted-foreground px-4'>
                          This key will be your password to access Nostr applications
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!isLoading && (
                <Button
                  className='w-full'
                  size="sm"
                  onClick={generateKey}
                  disabled={isLoading}
                >
                  <Sparkles className='w-4 h-4 mr-2' />
                  Generate My Secret Key
                </Button>
              )}
            </div>
          )}

          {/* Download Step */}
          {step === 'download' && (
            <div className='text-center space-y-4'>
              {/* Key reveal */}
              <div className='p-4 rounded-lg bg-accent/50 border'>
                <div className='flex justify-center items-center mb-3'>
                  <div className='w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center'>
                    <Key className='w-7 h-7 opacity-70' />
                  </div>
                </div>

                <div className='space-y-2'>
                  <p className='text-sm font-medium'>
                    Your secret key has been generated!
                  </p>

                  {/* Warning */}
                  <div className='mx-auto max-w-sm'>
                    <div className='p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-300 dark:border-amber-700'>
                      <div className='flex items-center gap-2 mb-1'>
                        <FileText className='w-3 h-3 opacity-70' />
                        <span className='text-xs font-medium'>
                          Important Warning
                        </span>
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        This key is your only means of accessing your account. Store it safely.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security options */}
              <div className='space-y-3'>
                <div className='grid grid-cols-1 gap-2'>
                  {/* Download Option */}
                   <Card className={`cursor-pointer transition-all ${
                    keySecured === 'downloaded'
                       ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950/20'
                       : 'hover:bg-accent/30'
                   }`}>
                    <CardContent className='p-3'>
                      <Button
                        variant="ghost"
                        className='w-full h-auto p-0 justify-start hover:bg-transparent'
                        onClick={downloadKey}
                      >
                        <div className='flex items-center gap-3 w-full'>
                          <div className={`p-1.5 rounded-lg ${
                            keySecured === 'downloaded'
                               ? 'bg-green-100 dark:bg-green-900'
                               : 'bg-primary/10'
                           }`}>
                            {keySecured === 'downloaded' ? (
                               <CheckCircle className='w-4 h-4 text-green-600' />
                             ) : (
                               <Download className='w-4 h-4 opacity-70' />
                             )}
                          </div>
                          <div className='flex-1 text-left'>
                             <div className='text-sm font-medium'>
                               Download as File
                             </div>
                             <div className='text-xs text-muted-foreground'>
                               Save as nostr-nsec-key.txt file
                             </div>
                          </div>
                          {keySecured === 'downloaded' && (
                             <div className='text-xs font-medium text-green-600'>
                               ✓ Downloaded
                             </div>
                           )}
                        </div>
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Continue button */}
                <Button
                  className={`w-full ${
                    keySecured === 'downloaded'
                      ? ''
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  size="sm"
                  onClick={finishKeySetup}
                  disabled={keySecured !== 'downloaded'}
                >
                  <LogIn className='w-4 h-4 mr-2' />
                  <span>
                    {keySecured === 'none' ? (
                      'Please download your key first'
                    ) : (
                      'Key Secured - Continue'
                    )}
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* Profile Step */}
          {step === 'profile' && (
            <div className='text-center space-y-4'>
              {/* Profile setup illustration */}
              <div className='p-4 rounded-lg bg-accent/50 border'>
                <div className='flex justify-center items-center mb-2'>
                  <div className='w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center'>
                    <User className='w-7 h-7 opacity-70' />
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <p className='text-sm font-medium'>
                    Almost there! Let's set up your profile
                  </p>

                  <p className='text-xs text-muted-foreground'>
                    Your profile is your identity on Nostr
                  </p>
                </div>
              </div>

              {/* Publishing status indicator */}
              {isPublishing && (
                <div className='p-3 rounded-lg bg-accent/30 border'>
                  <div className='flex items-center justify-center gap-2'>
                    <div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin' />
                    <span className='text-xs font-medium'>
                      Publishing your profile...
                    </span>
                  </div>
                </div>
              )}

              {/* Profile form */}
              <div className={`space-y-3 text-left ${isPublishing ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className='space-y-1.5'>
                  <label htmlFor='profile-name' className='text-xs font-medium'>
                    Display Name
                  </label>
                  <Input
                    id='profile-name'
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder='Your name'
                    disabled={isPublishing}
                  />
                </div>

                <div className='space-y-1.5'>
                  <label htmlFor='profile-about' className='text-xs font-medium'>
                    Bio
                  </label>
                  <Textarea
                    id='profile-about'
                    value={profileData.about}
                    onChange={(e) => setProfileData(prev => ({ ...prev, about: e.target.value }))}
                    placeholder='Tell others about yourself...'
                    className='resize-none'
                    rows={3}
                    disabled={isPublishing}
                  />
                </div>

                <div className='space-y-1.5'>
                  <label htmlFor='profile-picture' className='text-xs font-medium'>
                    Avatar
                  </label>
                  <div className='flex gap-2'>
                    <Input
                      id='profile-picture'
                      value={profileData.picture}
                      onChange={(e) => setProfileData(prev => ({ ...prev, picture: e.target.value }))}
                      placeholder='https://example.com/your-avatar.jpg'
                      className='flex-1'
                      disabled={isPublishing}
                    />
                    <input
                      type='file'
                      accept='image/*'
                      className='hidden'
                      ref={avatarFileInputRef}
                      onChange={handleAvatarUpload}
                      aria-label="Upload avatar image"
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='icon'
                      onClick={() => avatarFileInputRef.current?.click()}
                      disabled={isUploading || isPublishing}
                      className='shrink-0'
                      title='Upload avatar image'
                    >
                      {isUploading ? (
                        <div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin' />
                      ) : (
                        <Upload className='w-4 h-4' />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className='space-y-2'>
                <Button
                  className='w-full'
                  size="sm"
                  onClick={() => finishSignup(false)}
                  disabled={isPublishing || isUploading}
                >
                  {isPublishing ? (
                    <>
                      <div className='w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin' />
                      Creating Profile...
                    </>
                  ) : (
                    <>
                      <User className='w-4 h-4 mr-2' />
                      Create Profile & Finish
                    </>
                  )}
                </Button>

                <Button
                  variant='outline'
                  className='w-full'
                  size="sm"
                  onClick={() => finishSignup(true)}
                  disabled={isPublishing || isUploading}
                >
                  {isPublishing ? (
                    <>
                      <div className='w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin' />
                      Setting up account...
                    </>
                  ) : (
                    'Skip for now'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignupDialog;
