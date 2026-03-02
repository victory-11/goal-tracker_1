'use client';

import { useState, useEffect, useMemo } from 'react';
import { useGoals } from '@/hooks/useGoals';
import { Goal, Priority, Status, Category } from '@/types/goal';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalForm } from '@/components/goals/GoalForm';
import { GoalGroup } from '@/components/goals/GoalGroup';
import { Statistics } from '@/components/goals/Statistics';
import { ThemeToggle } from '@/components/goals/ThemeToggle';
import { GoalFilter, SortOption, SortDirection } from '@/components/goals/GoalFilter';
import { SyncDialog } from '@/components/goals/SyncDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Target, 
  List, 
  FolderTree, 
  BarChart3, 
  Wifi, 
  WifiOff,
  Loader2,
  AlertCircle,
  RefreshCw,
  HardDrive,
  Cloud,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

type ViewMode = 'list' | 'groups' | 'stats';
type Theme = 'light' | 'dark' | 'system';

export default function Home() {
  const { 
    goals, 
    loading, 
    error, 
    isOnline, 
    syncGroup,
    isLocalMode,
    createGoal, 
    updateGoal, 
    deleteGoal, 
    updateStatus,
    joinSyncGroup,
    createSyncGroup,
    leaveSyncGroup,
    syncFromServer,
  } = useGoals();
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as Theme | null;
      return stored || 'system';
    }
    return 'system';
  });
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [parentGoalId, setParentGoalId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // Filter state
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<Status | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Filtered and sorted goals
  const filteredGoals = useMemo(() => {
    let result = [...goals];

    // Search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(g => 
        g.title.toLowerCase().includes(searchLower) ||
        (g.description?.toLowerCase().includes(searchLower))
      );
    }

    // Priority filter
    if (priorityFilter !== 'ALL') {
      result = result.filter(g => g.priority === priorityFilter);
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(g => g.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'ALL') {
      result = result.filter(g => g.category === categoryFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'dueDate':
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          comparison = aDate - bDate;
          break;
        case 'priority':
          const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
          comparison = priorityOrder[a.priority as Priority] - priorityOrder[b.priority as Priority];
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          const statusOrder = { PENDING: 0, IN_PROGRESS: 1, COMPLETED: 2 };
          comparison = statusOrder[a.status as Status] - statusOrder[b.status as Status];
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [goals, search, priorityFilter, statusFilter, categoryFilter, sortBy, sortDirection]);

  // Root goals (no parent)
  const rootGoals = useMemo(() => {
    return filteredGoals.filter(g => !g.parentId);
  }, [filteredGoals]);

  // Goals with sub-goals (groups)
  const goalGroups = useMemo(() => {
    return rootGoals.filter(g => g.subGoals && g.subGoals.length > 0);
  }, [rootGoals]);

  const hasActiveFilters = search || priorityFilter !== 'ALL' || statusFilter !== 'ALL' || categoryFilter !== 'ALL';

  const clearFilters = () => {
    setSearch('');
    setPriorityFilter('ALL');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
  };

  const handleCreateGoal = async (data: Parameters<typeof createGoal>[0]) => {
    const goal = await createGoal(data);
    if (goal) {
      setShowForm(false);
      setParentGoalId(null);
    }
  };

  const handleUpdateGoal = async (data: Parameters<typeof updateGoal>[1]) => {
    if (editingGoal) {
      const goal = await updateGoal(editingGoal.id, data);
      if (goal) {
        setEditingGoal(null);
      }
    }
  };

  const handleDeleteGoal = async () => {
    if (deleteConfirm) {
      await deleteGoal(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const handleAddSubGoal = (parentId: string) => {
    setParentGoalId(parentId);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Goal Tracker</h1>
              </div>
              <div className="flex items-center gap-2">
                {/* Storage mode indicator */}
                {isLocalMode ? (
                  <Badge 
                    variant="secondary"
                    className="text-xs"
                  >
                    <HardDrive className="h-3 w-3 mr-1" />
                    Local Only
                  </Badge>
                ) : (
                  <Badge 
                    variant="default"
                    className="text-xs"
                  >
                    <Cloud className="h-3 w-3 mr-1" />
                    Synced
                  </Badge>
                )}
                {/* Online status */}
                <Badge 
                  variant={isOnline ? 'outline' : 'destructive'}
                  className="text-xs"
                >
                  {isOnline ? (
                    <><Wifi className="h-3 w-3 mr-1" /> Online</>
                  ) : (
                    <><WifiOff className="h-3 w-3 mr-1" /> Offline</>
                  )}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SyncDialog
                syncGroup={syncGroup}
                isLocalMode={isLocalMode}
                localGoalsCount={goals.length}
                onJoinGroup={joinSyncGroup}
                onCreateGroup={createSyncGroup}
                onLeaveGroup={leaveSyncGroup}
                isOnline={isOnline}
              />
              <ThemeToggle theme={theme} setTheme={handleSetTheme} />
              <Button onClick={() => { setShowForm(true); setParentGoalId(null); }}>
                <Plus className="h-4 w-4 mr-2" />
                New Goal
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* View Tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="list" className="flex items-center gap-1">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex items-center gap-1">
                <FolderTree className="h-4 w-4" />
                <span className="hidden sm:inline">Groups</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Statistics</span>
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              {syncGroup && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={syncFromServer}
                  disabled={!isOnline}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Sync
                </Button>
              )}
              <div className="text-sm text-muted-foreground">
                {filteredGoals.length} goal{filteredGoals.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* List View */}
          <TabsContent value="list" className="space-y-4">
            <GoalFilter
              search={search}
              onSearchChange={setSearch}
              priorityFilter={priorityFilter}
              onPriorityFilterChange={setPriorityFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              sortDirection={sortDirection}
              onSortDirectionChange={setSortDirection}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12 text-destructive">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            ) : filteredGoals.length === 0 ? (
              <div className="text-center py-12">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No goals found</h3>
                <p className="text-muted-foreground mb-4">
                  {hasActiveFilters 
                    ? 'Try adjusting your filters or create a new goal.'
                    : 'Get started by creating your first goal!'}
                </p>
                <Button onClick={() => { setShowForm(true); setParentGoalId(null); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Goal
                </Button>
              </div>
            ) : (
              <ScrollArea className="max-h-[calc(100vh-320px)]">
                <div className="space-y-3 pr-4">
                  {rootGoals.map(goal => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={setEditingGoal}
                      onDelete={setDeleteConfirm}
                      onStatusChange={updateStatus}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Groups View */}
          <TabsContent value="groups" className="space-y-4">
            <GoalFilter
              search={search}
              onSearchChange={setSearch}
              priorityFilter={priorityFilter}
              onPriorityFilterChange={setPriorityFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              sortDirection={sortDirection}
              onSortDirectionChange={setSortDirection}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredGoals.length === 0 ? (
              <div className="text-center py-12">
                <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No goal groups</h3>
                <p className="text-muted-foreground mb-4">
                  Create goals with sub-goals to see them organized in groups.
                </p>
                <Button onClick={() => { setShowForm(true); setParentGoalId(null); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Goal
                </Button>
              </div>
            ) : (
              <ScrollArea className="max-h-[calc(100vh-320px)]">
                <div className="space-y-4 pr-4">
                  {rootGoals.map(goal => (
                    <GoalGroup
                      key={goal.id}
                      goal={goal}
                      onEdit={setEditingGoal}
                      onDelete={setDeleteConfirm}
                      onStatusChange={updateStatus}
                      onAddSubGoal={handleAddSubGoal}
                      onViewGoal={setEditingGoal}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Statistics View */}
          <TabsContent value="stats">
            <Statistics goals={goals} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Create/Edit Goal Dialog */}
      <Dialog open={showForm || !!editingGoal} onOpenChange={(open) => {
        if (!open) {
          setShowForm(false);
          setEditingGoal(null);
          setParentGoalId(null);
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? 'Edit Goal' : parentGoalId ? 'Add Sub-goal' : 'Create New Goal'}
            </DialogTitle>
          </DialogHeader>
          <GoalForm
            goal={editingGoal}
            parentId={parentGoalId}
            onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal}
            onCancel={() => {
              setShowForm(false);
              setEditingGoal(null);
              setParentGoalId(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => {
        if (!open) setDeleteConfirm(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this goal? This action cannot be undone.
              {goals.find(g => g.id === deleteConfirm)?.subGoals?.length ? (
                <span className="block mt-2 text-destructive">
                  This will also delete all sub-goals.
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGoal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
