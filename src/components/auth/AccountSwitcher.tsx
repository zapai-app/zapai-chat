// NOTE: This file is stable and usually should not be modified.
// It is important that all functionality in this file is preserved, and should only be modified if explicitly requested.

import { ChevronDown, LogOut, UserIcon, UserPlus, Wallet } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { RelaySelector } from '@/components/RelaySelector';
import { WalletModal } from '@/components/WalletModal';
import { useLoggedInAccounts, type Account } from '@/hooks/useLoggedInAccounts';
import { genUserName } from '@/lib/genUserName';

interface AccountSwitcherProps {
  onAddAccountClick: () => void;
}

export function AccountSwitcher({ onAddAccountClick }: AccountSwitcherProps) {
  const { currentUser, otherUsers, setLogin, removeLogin } = useLoggedInAccounts();

  if (!currentUser) return null;

  const getDisplayName = (account: Account): string => {
    return account.metadata.name ?? genUserName(account.pubkey);
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button className='flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors w-full text-foreground'>
          <Avatar className='w-8 h-8'>
            {currentUser.metadata.picture && <AvatarImage src={currentUser.metadata.picture} alt={getDisplayName(currentUser)} />}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {getDisplayName(currentUser).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1 text-left hidden md:block truncate'>
            <p className='text-sm truncate'>{getDisplayName(currentUser)}</p>
          </div>
          <ChevronDown className='w-4 h-4 opacity-50' />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56 p-1.5'>
        <div className='text-xs text-muted-foreground px-2 py-1.5'>Switch Relay</div>
        <RelaySelector className="w-full" />
        <DropdownMenuSeparator className="my-1" />
        <div className='text-xs text-muted-foreground px-2 py-1.5'>Switch Account</div>
        {otherUsers.map((user) => (
          <DropdownMenuItem
            key={user.id}
            onClick={() => setLogin(user.id)}
            className='flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-md text-sm'
          >
            <Avatar className='w-7 h-7'>
              {user.metadata.picture && <AvatarImage src={user.metadata.picture} alt={getDisplayName(user)} />}
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {getDisplayName(user)?.slice(0, 2).toUpperCase() || <UserIcon className="w-3 h-3" />}
              </AvatarFallback>
            </Avatar>
            <div className='flex-1 truncate'>
              <p className='text-sm'>{getDisplayName(user)}</p>
            </div>
            {user.id === currentUser.id && <div className='w-1.5 h-1.5 rounded-full bg-primary'></div>}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="my-1" />
        <WalletModal>
          <DropdownMenuItem
            className='flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-md text-sm'
            onSelect={(e) => e.preventDefault()}
          >
            <Wallet className='w-4 h-4 opacity-70' />
            <span>Wallet Settings</span>
          </DropdownMenuItem>
        </WalletModal>
        <DropdownMenuItem
          onClick={onAddAccountClick}
          className='flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-md text-sm'
        >
          <UserPlus className='w-4 h-4 opacity-70' />
          <span>Add another account</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => removeLogin(currentUser.id)}
          className='flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-md text-sm text-red-500'
        >
          <LogOut className='w-4 h-4' />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}