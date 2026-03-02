'use client';

import { Goal, CATEGORY_LABELS, CATEGORY_COLORS, Category, STATUS_LABELS } from '@/types/goal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, Calendar, Target, Flame } from 'lucide-react';
import { useMemo } from 'react';
import { format, subDays, startOfDay, isAfter, isBefore, isEqual } from 'date-fns';

interface StatisticsProps {
  goals: Goal[];
}

const COLORS = ['#3b82f6', '#f43f5e', '#a855f7', '#f97316', '#10b981', '#6b7280'];

export function Statistics({ goals }: StatisticsProps) {
  const stats = useMemo(() => {
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.status === 'COMPLETED').length;
    const inProgressGoals = goals.filter(g => g.status === 'IN_PROGRESS').length;
    const pendingGoals = goals.filter(g => g.status === 'PENDING').length;
    const overdueGoals = goals.filter(g => {
      if (!g.dueDate || g.status === 'COMPLETED') return false;
      return new Date(g.dueDate) < new Date();
    }).length;

    const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    // Category breakdown
    const categoryData: Record<Category, number> = {
      WORK: 0,
      HEALTH: 0,
      LEARNING: 0,
      PERSONAL: 0,
      FINANCE: 0,
      OTHER: 0,
    };

    goals.forEach(g => {
      categoryData[g.category as Category]++;
    });

    const categoryChartData = Object.entries(categoryData)
      .filter(([, count]) => count > 0)
      .map(([category, count]) => ({
        name: CATEGORY_LABELS[category as Category],
        value: count,
        color: CATEGORY_COLORS[category as Category].replace('bg-', '')
      }));

    // Status distribution
    const statusData = [
      { name: STATUS_LABELS.PENDING, value: pendingGoals, fill: '#9ca3af' },
      { name: STATUS_LABELS.IN_PROGRESS, value: inProgressGoals, fill: '#3b82f6' },
      { name: STATUS_LABELS.COMPLETED, value: completedGoals, fill: '#10b981' },
    ].filter(s => s.value > 0);

    // Activity over the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, 'EEE'),
        fullDate: date,
        completed: 0,
        created: 0,
      };
    });

    goals.forEach(g => {
      const createdDate = startOfDay(new Date(g.createdAt));
      last7Days.forEach(day => {
        if (isEqual(createdDate, startOfDay(day.fullDate))) {
          day.created++;
        }
        if (g.status === 'COMPLETED' && g.updatedAt) {
          const updatedDate = startOfDay(new Date(g.updatedAt));
          if (isEqual(updatedDate, startOfDay(day.fullDate))) {
            day.completed++;
          }
        }
      });
    });

    // Calculate streak
    let streak = 0;
    const today = startOfDay(new Date());
    for (let i = 0; i < 30; i++) {
      const checkDate = subDays(today, i);
      const hasCompletion = goals.some(g => {
        if (g.status !== 'COMPLETED') return false;
        const completedDate = startOfDay(new Date(g.updatedAt));
        return isEqual(completedDate, checkDate);
      });
      if (hasCompletion) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return {
      totalGoals,
      completedGoals,
      inProgressGoals,
      pendingGoals,
      overdueGoals,
      completionRate,
      categoryChartData,
      statusData,
      activityData: last7Days,
      streak,
    };
  }, [goals]);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.totalGoals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.completedGoals}</div>
            <p className="text-xs text-muted-foreground">{stats.completionRate}% completion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.inProgressGoals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-red-500">{stats.overdueGoals}</div>
          </CardContent>
        </Card>
      </div>

      {/* Streak Card */}
      <Card className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-sm font-medium text-white/90">Current Streak</CardTitle>
          <Flame className="h-5 w-5" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-3xl font-bold">{stats.streak} day{stats.streak !== 1 ? 's' : ''}</div>
          <p className="text-sm text-white/80">Keep completing goals daily!</p>
        </CardContent>
      </Card>

      {/* Completion Progress */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completion Rate</span>
              <span className="font-medium">{stats.completionRate}%</span>
            </div>
            <Progress value={stats.completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Goals by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Activity (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="created" 
                stroke="#3b82f6" 
                name="Created"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="#10b981" 
                name="Completed"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
