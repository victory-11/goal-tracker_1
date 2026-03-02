'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Link2,
  Copy,
  Check,
  Loader2,
  LogOut,
  Plus,
  ArrowRight,
  Cloud,
  HardDrive,
} from 'lucide-react';
import { StoredSyncGroup, isValidSyncCode, formatSyncCode } from '@/lib/sync';
import { Goal } from '@/types/goal';

interface SyncDialogProps {
  syncGroup: StoredSyncGroup | null;
  isLocalMode: boolean;
  localGoalsCount: number;
  onJoinGroup: (code: string) => Promise<boolean>;
  onCreateGroup: (name?: string) => Promise<StoredSyncGroup | null>;
  onLeaveGroup: () => void;
  isOnline: boolean;
}

export function SyncDialog({
  syncGroup,
  isLocalMode,
  localGoalsCount,
  onJoinGroup,
  onCreateGroup,
  onLeaveGroup,
  isOnline,
}: SyncDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'menu' | 'join' | 'create' | 'info'>(syncGroup ? 'info' : 'menu');
  const [joinCode, setJoinCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleJoin = async () => {
    if (!isValidSyncCode(joinCode)) {
      setError('Invalid code format. Must be 6 characters (A-Z, 0-9)');
      return;
    }

    setLoading(true);
    setError(null);

    const success = await onJoinGroup(formatSyncCode(joinCode));
    setLoading(false);

    if (success) {
      setMode('info');
      setJoinCode('');
      setOpen(false);
    } else {
      setError('Failed to join group. Check your code and try again.');
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    const group = await onCreateGroup(groupName || undefined);
    setLoading(false);

    if (group) {
      setMode('info');
      setGroupName('');
      setOpen(false);
    } else {
      setError('Failed to create group. Please try again.');
    }
  };

  const handleCopyCode = async () => {
    if (syncGroup?.code) {
      await navigator.clipboard.writeText(syncGroup.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeave = () => {
    onLeaveGroup();
    setMode('menu');
    setOpen(false);
  };

  const resetDialog = () => {
    setMode(syncGroup ? 'info' : 'menu');
    setJoinCode('');
    setGroupName('');
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o) resetDialog();
    }}>
      <DialogTrigger asChild>
        <Button 
          variant={syncGroup ? 'default' : 'outline'} 
          size="sm" 
          className="gap-2"
        >
          {syncGroup ? (
            <>
              <Cloud className="h-4 w-4" />
              <span className="hidden sm:inline">Synced</span>
            </>
          ) : (
            <>
              <HardDrive className="h-4 w-4" />
              <span className="hidden sm:inline">Local</span>
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {mode === 'info' ? 'Sync Group' : 'Cross-Device Sync'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'info'
              ? 'Your goals are synced across devices.'
              : isLocalMode
                ? 'Your goals are stored locally. Create or join a sync group to share across devices.'
                : 'Create or join a sync group to share goals across devices.'}
          </DialogDescription>
        </DialogHeader>

        {/* Info Mode - Show current sync group */}
        {mode === 'info' && syncGroup && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Sync Code</span>
                <Badge variant="secondary" className="text-xs">
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-2xl font-mono font-bold tracking-wider">
                  {syncGroup.code}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyCode}
                  className="h-8 w-8"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {syncGroup.name && (
                <p className="text-sm text-muted-foreground mt-2">
                  {syncGroup.name}
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Share this code with other devices to sync your goals.
            </p>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLeave}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave Sync Group
            </Button>
          </div>
        )}

        {/* Menu Mode - Choose create or join */}
        {mode === 'menu' && !syncGroup && (
          <div className="space-y-4">
            {/* Show local mode indicator */}
            {isLocalMode && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-sm">
                  <HardDrive className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-700 dark:text-blue-300">
                    <strong>Local Mode:</strong> {localGoalsCount} goal{localGoalsCount !== 1 ? 's' : ''} stored on this device only
                  </span>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-between h-auto py-4"
                onClick={() => setMode('create')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Create New Group</div>
                    <div className="text-xs text-muted-foreground">
                      {localGoalsCount > 0 
                        ? `Upload your ${localGoalsCount} local goal${localGoalsCount !== 1 ? 's' : ''} to sync`
                        : 'Start a new sync group'}
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between h-auto py-4"
                onClick={() => setMode('join')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Join Existing Group</div>
                    <div className="text-xs text-muted-foreground">
                      Enter a 6-character code
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              Your local goals will be replaced when joining an existing group
            </p>
          </div>
        )}

        {/* Join Mode - Enter code */}
        {mode === 'join' && (
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                ⚠️ Joining a group will replace your local goals with the group&apos;s goals
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="joinCode">Sync Code</Label>
              <Input
                id="joinCode"
                placeholder="ABC123"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-xl font-mono tracking-widest uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-character code from another device
              </p>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setMode('menu')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleJoin}
                disabled={loading || joinCode.length !== 6}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Join'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Create Mode - Enter group name */}
        {mode === 'create' && (
          <div className="space-y-4 py-4">
            {localGoalsCount > 0 && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-300">
                  ✅ Your {localGoalsCount} local goal{localGoalsCount !== 1 ? 's' : ''} will be uploaded to the new sync group
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name (optional)</Label>
              <Input
                id="groupName"
                placeholder="My Goals"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                Give your sync group a name to identify it
              </p>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setMode('menu')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
