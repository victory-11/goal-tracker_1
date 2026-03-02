'use client';

import { Goal, Status } from '@/types/goal';
import { GoalCard } from './GoalCard';
import { ProgressBar } from './ProgressBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, FolderOpen, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface GoalGroupProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Status) => void;
  onAddSubGoal: (parentId: string) => void;
  onViewGoal: (goal: Goal) => void;
  level?: number;
}

export function GoalGroup({
  goal,
  onEdit,
  onDelete,
  onStatusChange,
  onAddSubGoal,
  onViewGoal,
  level = 0,
}: GoalGroupProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  const subGoals = goal.subGoals || [];
  const completedCount = subGoals.filter(sg => sg.status === 'COMPLETED').length;
  const totalCount = subGoals.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isGroup = subGoals.length > 0;

  return (
    <div className={cn('space-y-2', level > 0 && 'ml-4 pl-4 border-l-2 border-muted')}>
      <Card className="transition-all duration-200">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isGroup && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              <div className="flex items-center gap-2">
                {isGroup && <FolderOpen className="h-4 w-4 text-muted-foreground" />}
                <CardTitle 
                  className={cn(
                    'text-base cursor-pointer hover:text-primary',
                    goal.status === 'COMPLETED' && 'line-through text-muted-foreground'
                  )}
                  onClick={() => onViewGoal(goal)}
                >
                  {goal.title}
                </CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isGroup && (
                <Badge variant="outline" className="text-xs">
                  {completedCount}/{totalCount} completed
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddSubGoal(goal.id)}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Sub-goal
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {goal.description && (
            <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
          )}
          {isGroup && (
            <ProgressBar progress={progress} size="md" showLabel={false} />
          )}
        </CardContent>
      </Card>

      {isGroup && isExpanded && (
        <div className="space-y-2 mt-2">
          {subGoals.map((subGoal) => (
            <GoalGroup
              key={subGoal.id}
              goal={subGoal}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onAddSubGoal={onAddSubGoal}
              onViewGoal={onViewGoal}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
