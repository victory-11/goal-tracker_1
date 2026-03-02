'use client';

import { Goal, PRIORITY_COLORS, PRIORITY_BORDER_COLORS, STATUS_COLORS, CATEGORY_COLORS, CATEGORY_LABELS, STATUS_LABELS, PRIORITY_LABELS, Priority, Status, Category } from '@/types/goal';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, Edit2, Trash2, AlertCircle, ChevronRight, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast, isToday, isTomorrow, addDays } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Status) => void;
  onClick?: (goal: Goal) => void;
  isSubGoal?: boolean;
}

export function GoalCard({ 
  goal, 
  onEdit, 
  onDelete, 
  onStatusChange,
  onClick,
  isSubGoal = false
}: GoalCardProps) {
  const isCompleted = goal.status === 'COMPLETED';
  const isOverdue = goal.dueDate && !isCompleted && isPast(new Date(goal.dueDate)) && !isToday(new Date(goal.dueDate));
  const isDueToday = goal.dueDate && isToday(new Date(goal.dueDate));
  const isDueTomorrow = goal.dueDate && isTomorrow(new Date(goal.dueDate));
  const isDueSoon = goal.dueDate && !isCompleted && !isOverdue && !isDueToday && !isDueTomorrow && 
    isPast(addDays(new Date(goal.dueDate), -3));

  const getDueDateLabel = () => {
    if (!goal.dueDate) return null;
    const date = new Date(goal.dueDate);
    if (isOverdue) return 'Overdue';
    if (isDueToday) return 'Due today';
    if (isDueTomorrow) return 'Due tomorrow';
    return format(date, 'MMM d, yyyy');
  };

  const handleCheckboxChange = (checked: boolean) => {
    onStatusChange(goal.id, checked ? 'COMPLETED' : 'PENDING');
  };

  return (
    <Card 
      className={cn(
        'transition-all duration-200 hover:shadow-md cursor-pointer group',
        PRIORITY_BORDER_COLORS[goal.priority as Priority],
        'border-l-4',
        isCompleted && 'opacity-60',
        isSubGoal && 'ml-6 border-l-2',
        onClick && 'hover:border-l-8'
      )}
      onClick={() => onClick?.(goal)}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <h3 
                className={cn(
                  'font-semibold text-base truncate',
                  isCompleted && 'line-through text-muted-foreground'
                )}
              >
                {goal.title}
              </h3>
              {goal.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {goal.description}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(goal); }}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(goal.id); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Badge */}
          <Badge 
            variant="secondary" 
            className={cn('text-xs', STATUS_COLORS[goal.status as Status])}
          >
            {STATUS_LABELS[goal.status as Status]}
          </Badge>

          {/* Priority Badge */}
          <Badge 
            variant="secondary" 
            className={cn('text-xs', PRIORITY_COLORS[goal.priority as Priority])}
          >
            {PRIORITY_LABELS[goal.priority as Priority]}
          </Badge>

          {/* Category Badge */}
          <Badge 
            variant="secondary" 
            className={cn('text-xs text-white', CATEGORY_COLORS[goal.category as Category])}
          >
            {CATEGORY_LABELS[goal.category as Category]}
          </Badge>

          {/* Due Date */}
          {goal.dueDate && (
            <Badge 
              variant="secondary" 
              className={cn(
                'text-xs',
                isOverdue && 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
                isDueToday && 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
                isDueSoon && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
              )}
            >
              {isOverdue ? (
                <AlertCircle className="h-3 w-3 mr-1" />
              ) : (
                <Calendar className="h-3 w-3 mr-1" />
              )}
              {getDueDateLabel()}
            </Badge>
          )}

          {/* Sub-goals indicator */}
          {goal.subGoals && goal.subGoals.length > 0 && (
            <Badge variant="outline" className="text-xs">
              <ChevronRight className="h-3 w-3 mr-1" />
              {goal.subGoals.length} sub-goal{goal.subGoals.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Sync Status */}
        {!goal.syncedAt && (
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            Pending sync
          </div>
        )}
      </CardContent>
    </Card>
  );
}
