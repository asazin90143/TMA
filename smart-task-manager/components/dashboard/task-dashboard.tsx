'use client';

import { useState, type ReactNode, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, LayoutDashboard, List, Plus, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createTask } from '@/app/actions/create-task';

// Mock task data for demonstration
interface Task {
    id: string;
    title: string;
    description: string | null;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    due_date: string | null;
    priority_score: number;
    eisenhower_category: string | null;
    position: number;
}

const MOCK_TASKS: Task[] = [
    {
        id: '1',
        title: 'Fix critical payment bug',
        description: 'Client reported checkout failures',
        status: 'todo',
        due_date: '2024-02-10T12:00:00.000Z',
        priority_score: 95,
        eisenhower_category: 'do_first',
        position: 0,
    },
    {
        id: '2',
        title: 'Deploy staging environment',
        description: 'Set up staging server for client preview',
        status: 'in_progress',
        due_date: '2024-02-12T09:00:00.000Z',
        priority_score: 75,
        eisenhower_category: 'schedule',
        position: 0,
    },
    {
        id: '3',
        title: 'Refactor authentication module',
        description: 'Clean up legacy auth code',
        status: 'todo',
        due_date: '2024-02-25T14:00:00.000Z',
        priority_score: 35,
        eisenhower_category: 'schedule',
        position: 1,
    },
    {
        id: '4',
        title: 'Update project documentation',
        description: 'Document new API endpoints',
        status: 'review',
        due_date: null,
        priority_score: 20,
        eisenhower_category: 'delegate',
        position: 0,
    },
    {
        id: '5',
        title: 'Invoice Q4 clients',
        description: 'Send invoices for October-December work',
        status: 'todo',
        due_date: '2024-02-05T10:00:00.000Z',
        priority_score: 85,
        eisenhower_category: 'do_first',
        position: 2,
    },
];

export default function TaskDashboard() {
    const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
    // ... existing state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [activeView, setActiveView] = useState<'kanban' | 'calendar' | 'list'>('kanban');
    const [draggedTask, setDraggedTask] = useState<string | null>(null);
    const [classifyingTask, setClassifyingTask] = useState<string | null>(null);
    const [now, setNow] = useState<number | null>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setNow(Date.now());
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    /**
     * Simulates AI classification with a delay.
     * In production, this would call the Server Action.
     */
    const handleClassifyTask = async (taskId: string) => {
        setClassifyingTask(taskId);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock AI response
        setTasks(current =>
            current.map(t =>
                t.id === taskId
                    ? {
                        ...t,
                        eisenhower_category: 'do_first',
                        priority_score: Math.floor(Math.random() * 30) + 70,
                    }
                    : t
            )
        );

        setClassifyingTask(null);
    };

    /**
     * Simulates drag-and-drop task movement.
     * In production, this would use dnd-kit and update Supabase.
     */
    const handleMoveTask = (taskId: string, newStatus: Task['status']) => {
        setTasks(current =>
            current.map(t => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
    };

    const columns: Task['status'][] = ['todo', 'in_progress', 'review', 'done'];

    const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsCreating(true);
        const formData = new FormData(e.currentTarget);

        try {
            const result = await createTask({
                title: formData.get('title'),
                description: formData.get('description'),
                due_date: formData.get('due_date') ? new Date(formData.get('due_date') as string).toISOString() : undefined,
                manual_priority: formData.get('priority') || undefined,
            });

            if (result.success && result.task) {
                // Add to local state for immediate feedback using the returned task
                // We need to map the DB task shape to our frontend Task shape if they differ
                // For now, let's just re-fetch or append. 
                // Since strict typing is on, let's cast or map.
                const newTask: Task = {
                    id: result.task.id,
                    title: result.task.title,
                    description: result.task.description,
                    status: result.task.status as any,
                    due_date: result.task.due_date,
                    priority_score: result.task.priority_score,
                    eisenhower_category: result.task.eisenhower_category,
                    position: 0
                };

                setTasks(prev => [newTask, ...prev]);
                setIsCreateOpen(false);
            }
        } catch (error) {
            console.error('Failed to create task:', error);
            alert('Failed to create task');
        } finally {
            setIsCreating(false);
        }
    };

    // ... existing logic

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 md:p-8 font-sans">
            <div className="max-w-[1400px] mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Smart Task Manager</h1>
                        <p className="text-muted-foreground mt-2 text-lg">AI-powered prioritization to reclaim your time.</p>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 bg-primary text-primary-foreground text-md px-6 py-6 h-auto rounded-xl">
                                <Plus className="w-5 h-5" />
                                New Task
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Task</DialogTitle>
                                <DialogDescription>
                                    Add a task and let AI help you prioritize it.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateTask} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Task Title</Label>
                                    <Input id="title" name="title" required placeholder="e.g., Fix payment integration" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Textarea id="description" name="description" placeholder="Details about the task..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="due_date">Due Date</Label>
                                        <Input id="due_date" name="due_date" type="datetime-local" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="priority">Manual Priority</Label>
                                        <select
                                            id="priority"
                                            name="priority"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">Auto (AI)</option>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={isCreating}>
                                        {isCreating ? 'Creating...' : 'Create Task'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'kanban' | 'calendar' | 'list')} className="space-y-6">
                    <TabsList className="bg-white/50 backdrop-blur-md border border-slate-200/50 p-1 rounded-xl">
                        <TabsTrigger value="kanban" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 rounded-lg transition-all">
                            <LayoutDashboard className="w-4 h-4" />
                            Kanban
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 rounded-lg transition-all">
                            <Calendar className="w-4 h-4" />
                            Calendar
                        </TabsTrigger>
                        <TabsTrigger value="list" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 rounded-lg transition-all">
                            <List className="w-4 h-4" />
                            List
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="kanban" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {columns.map((status) => (
                                <KanbanColumn
                                    key={status}
                                    status={status}
                                    tasks={tasks.filter((t) => t.status === status)}
                                    onMoveTask={handleMoveTask}
                                    onClassifyTask={handleClassifyTask}
                                    classifyingTask={classifyingTask}
                                    now={now}
                                />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="calendar">
                        <CalendarView tasks={tasks} onClassifyTask={handleClassifyTask} classifyingTask={classifyingTask} />
                    </TabsContent>

                    <TabsContent value="list">
                        <ListView tasks={tasks} onClassifyTask={handleClassifyTask} classifyingTask={classifyingTask} />
                    </TabsContent>
                </Tabs>

                <div className="mt-8 p-6 bg-indigo-50/50 backdrop-blur-sm border border-indigo-100 rounded-2xl flex items-start gap-3 shadow-sm">
                    <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="text-sm text-indigo-900/80 leading-relaxed">
                        <strong>Demo Mode Active.</strong> Experiencing the power of AI-driven task management.
                        <br />
                        In production, tasks sync in real-time. Use the sparkle icon on any task to simulate our advanced AI classification engine.
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Kanban column component with simulated drag-and-drop.
 */
function KanbanColumn({
    status,
    tasks,
    onMoveTask,
    onClassifyTask,
    classifyingTask,
    now,
}: {
    status: Task['status'];
    tasks: Task[];
    onMoveTask: (taskId: string, newStatus: Task['status']) => void;
    onClassifyTask: (taskId: string) => void;
    classifyingTask: string | null;
    now: number | null;
}) {
    const columnLabels = {
        todo: 'To Do',
        in_progress: 'In Progress',
        review: 'Review',
        done: 'Done',
    };

    const columnAccents = {
        todo: 'border-t-4 border-t-slate-400 bg-slate-50/50',
        in_progress: 'border-t-4 border-t-blue-500 bg-blue-50/30',
        review: 'border-t-4 border-t-purple-500 bg-purple-50/30',
        done: 'border-t-4 border-t-emerald-500 bg-emerald-50/30',
    };

    return (
        <div className={`rounded-xl p-4 min-h-[600px] border border-slate-100/60 backdrop-blur-sm ${columnAccents[status]}`}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-700 tracking-tight text-lg">{columnLabels[status]}</h3>
                <Badge variant="secondary" className="bg-white/80 shadow-sm text-slate-600 font-mono">{tasks.length}</Badge>
            </div>

            <div className="space-y-4">
                {tasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onMoveTask={onMoveTask}
                        onClassifyTask={onClassifyTask}
                        isClassifying={classifyingTask === task.id}
                        now={now}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Task card with urgency styling and simulated actions.
 */
function TaskCard({
    task,
    onMoveTask,
    onClassifyTask,
    isClassifying,
    now,
}: {
    task: Task;
    onMoveTask: (taskId: string, newStatus: Task['status']) => void;
    onClassifyTask: (taskId: string) => void;
    isClassifying: boolean;
    now: number | null;
}) {
    const getUrgencyStyles = () => {
        if (!task.due_date || now === null) return { border: 'border-l-transparent', badge: 'bg-slate-100 text-slate-600' };

        const hoursUntilDue = (new Date(task.due_date).getTime() - now) / (1000 * 60 * 60);

        if (hoursUntilDue < 0) return { border: 'border-l-red-500', badge: 'bg-red-100 text-red-700' };
        if (hoursUntilDue < 24) return { border: 'border-l-orange-500', badge: 'bg-orange-100 text-orange-700' };
        if (hoursUntilDue < 72) return { border: 'border-l-amber-400', badge: 'bg-amber-100 text-amber-700' };
        return { border: 'border-l-emerald-400', badge: 'bg-emerald-100 text-emerald-700' };
    };

    const urgency = getUrgencyStyles();

    const getTimeRemaining = () => {
        if (!task.due_date || now === null) return null;
        const hoursUntilDue = (new Date(task.due_date).getTime() - now) / (1000 * 60 * 60);
        if (hoursUntilDue < 0) return <span className="flex items-center gap-1">⚠️ Overdue</span>;
        if (hoursUntilDue < 24) return <span className="flex items-center gap-1">🔥 {Math.ceil(hoursUntilDue)}h</span>;
        const days = Math.floor(hoursUntilDue / 24);
        return <span className="flex items-center gap-1">📅 {days}d</span>;
    };

    return (
        <div
            className={`
        bg-white rounded-xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1
        cursor-grab active:cursor-grabbing group border border-slate-100 shadow-sm
        border-l-4 ${urgency.border}
      `}
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <h4 className="font-semibold text-slate-900 text-base leading-tight flex-1">{task.title}</h4>
                <button
                    onClick={() => onClassifyTask(task.id)}
                    disabled={isClassifying}
                    className="opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-indigo-50 rounded-full text-indigo-400 hover:text-indigo-600"
                    title="AI Priority Analysis"
                >
                    <Sparkles className={`w-4 h-4 ${isClassifying ? 'text-indigo-600 animate-spin' : ''}`} />
                </button>
            </div>

            {task.description && (
                <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">{task.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 mb-4">
                {task.due_date && (
                    <Badge variant="outline" className={`text-xs font-normal border-0 ${urgency.badge}`}>
                        {getTimeRemaining()}
                    </Badge>
                )}
                {task.eisenhower_category && (
                    <Badge variant="secondary" className="text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-0">
                        {formatCategory(task.eisenhower_category)}
                    </Badge>
                )}
            </div>

            {task.priority_score !== null && (
                <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                        <span>Priority Score</span>
                        <span className="font-mono text-slate-600">{task.priority_score}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ease-out rounded-full bg-gradient-to-r ${getPriorityGradient(task.priority_score)}`}
                            style={{ width: `${task.priority_score}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Move to:</span>
                <div className="flex gap-1">
                    {(['todo', 'in_progress', 'review', 'done'] as const).map((newStatus) => (
                        newStatus !== task.status && (
                            <button
                                key={newStatus}
                                onClick={(e) => { e.stopPropagation(); onMoveTask(task.id, newStatus); }}
                                className="text-[10px] font-medium px-2 py-1 bg-slate-50 text-slate-600 rounded-md hover:bg-indigo-50 hover:text-indigo-700 transition-colors border border-slate-200 hover:border-indigo-200"
                                title={`Move to ${newStatus.replace('_', ' ')}`}
                            >
                                {newStatus === 'in_progress' ? 'In Prog' : newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
                            </button>
                        )
                    ))}
                </div>
            </div>

            {isClassifying && (
                <div className="mt-2 p-2 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs text-indigo-800 flex items-center gap-2 animate-pulse">
                    <Sparkles className="w-3 h-3 animate-spin" />
                    AI analyzing context...
                </div>
            )}
        </div>
    );
}

/**
 * Calendar view - groups tasks by due date.
 */
function CalendarView({
    tasks,
    onClassifyTask,
    classifyingTask,
}: {
    tasks: Task[];
    onClassifyTask: (taskId: string) => void;
    classifyingTask: string | null;
}) {
    const tasksWithDates = tasks.filter((t) => t.due_date).sort((a, b) =>
        new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
    );

    const groupedByDate = tasksWithDates.reduce((acc, task) => {
        const date = new Date(task.due_date!).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(task);
        return acc;
    }, {} as Record<string, Task[]>);

    return (
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 tracking-tight">Tasks by Due Date</h3>
            <div className="space-y-8">
                {Object.keys(groupedByDate).length === 0 ? (
                    <p className="text-slate-500 italic text-center py-8">No tasks with due dates</p>
                ) : (
                    Object.entries(groupedByDate).map(([date, dateTasks]) => (
                        <div key={date} className="space-y-3">
                            <h4 className="font-semibold text-sm text-indigo-900 border-b border-indigo-100 pb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-indigo-500" />
                                {date}
                            </h4>
                            <div className="space-y-3">
                                {dateTasks.map((task) => (
                                    <div key={task.id} className="bg-white border border-slate-100 rounded-lg p-4 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <h5 className="font-semibold text-sm text-slate-800 group-hover:text-indigo-700 transition-colors">{task.title}</h5>
                                                {task.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{task.description}</p>}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-0">{task.status.replace('_', ' ')}</Badge>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onClassifyTask(task.id); }}
                                                    disabled={classifyingTask === task.id}
                                                    className="p-1.5 hover:bg-indigo-50 rounded-full text-indigo-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Sparkles className={`w-4 h-4 ${classifyingTask === task.id ? 'text-indigo-600 animate-spin' : ''}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

/**
 * List view - sortable table of all tasks.
 */
function ListView({
    tasks,
    onClassifyTask,
    classifyingTask,
}: {
    tasks: Task[];
    onClassifyTask: (taskId: string) => void;
    classifyingTask: string | null;
}) {
    const [sortBy, setSortBy] = useState<'priority' | 'due_date'>('priority');

    const sortedTasks = [...tasks].sort((a, b) => {
        if (sortBy === 'priority') return b.priority_score - a.priority_score;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

    return (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">All Tasks</h3>
                <div className="flex gap-2">
                    <Button
                        variant={sortBy === 'priority' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortBy('priority')}
                    >
                        Sort by Priority
                    </Button>
                    <Button
                        variant={sortBy === 'due_date' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortBy('due_date')}
                    >
                        Sort by Date
                    </Button>
                </div>
            </div>
            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Task</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Priority</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Due Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedTasks.map((task) => (
                        <tr key={task.id} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-3">
                                <div>
                                    <p className="font-medium text-sm">{task.title}</p>
                                    <p className="text-xs text-gray-600">{task.description}</p>
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <Badge variant="secondary">{task.status.replace('_', ' ')}</Badge>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${getPriorityGradient(task.priority_score)}`}
                                            style={{ width: `${task.priority_score}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium">{task.priority_score}</span>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                                {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-4 py-3">
                                <button
                                    onClick={() => onClassifyTask(task.id)}
                                    disabled={classifyingTask === task.id}
                                >
                                    <Sparkles className={`w-4 h-4 ${classifyingTask === task.id ? 'text-blue-600 animate-spin' : 'text-gray-400 hover:text-blue-600'}`} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function formatCategory(category: string): ReactNode {
    const map: Record<string, ReactNode> = {
        do_first: <><span role="img" aria-label="Fire">🔥</span> Do First</>,
        schedule: <><span role="img" aria-label="Calendar">📅</span> Schedule</>,
        delegate: <><span role="img" aria-label="People">👥</span> Delegate</>,
        delete: <><span role="img" aria-label="Trash">🗑️</span> Delete</>,
    };
    return map[category] || category;
}

function getPriorityGradient(score: number): string {
    if (score >= 80) return 'from-red-600 to-rose-500';
    if (score >= 60) return 'from-orange-500 to-amber-500';
    if (score >= 40) return 'from-amber-400 to-yellow-400';
    return 'from-emerald-500 to-teal-400';
}