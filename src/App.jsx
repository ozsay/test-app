import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Base44Logo } from "@/components/Base44Logo";
import { TaskCompletionCard } from "@/components/TaskCompletionCard";
import { AIChatPanel } from "@/components/AIChatPanel";
import { Plus, Trash2, LogIn, LogOut, User } from "lucide-react";

const Task = base44.entities.Task;

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (err) {
        // Not authenticated
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleGoogleLogin = () => {
    base44.auth.loginWithProvider("google", window.location.href);
  };

  const handleLogout = () => {
    base44.auth.logout(window.location.href);
  };

  const fetchTasks = useCallback(async () => {
    const data = await Task.list();
    setTasks(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await Task.create({ title: newTaskTitle.trim(), completed: false });
    setNewTaskTitle("");
    fetchTasks();
  };

  const toggleTask = async (id, completed) => {
    await Task.update(id, { completed });
    if (completed) {
      const task = tasks.find((t) => t.id === id);
      if (task) {
        base44.functions.invoke("notify-slack-task-completed", {
          taskTitle: task.title,
        }).catch(() => {});
      }
    }
    fetchTasks();
  };

  const deleteTask = async (id) => {
    await Task.delete(id);
    fetchTasks();
  };

  const clearCompleted = async () => {
    await Promise.all(
      tasks.filter((t) => t.completed).map((t) => Task.delete(t.id))
    );
    fetchTasks();
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      {/* Auth Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-6 py-3 flex items-center justify-end">
          {authLoading ? (
            <div className="w-5 h-5 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User className="w-4 h-4" />
                <span>{user.full_name || user.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-500 hover:text-slate-700 h-8 px-3"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleGoogleLogin}
              className="h-9 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm rounded-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
            <span className="inline-flex items-center gap-2 align-middle">
              <Base44Logo className="w-9 h-9" />
              <span className="font-bold">Base44</span>
              <span>Tasks</span>
            </span>
          </h1>
          {totalCount > 0 && (
            <p className="text-slate-500 mt-2 text-sm">
              {completedCount} of {totalCount} completed
            </p>
          )}
        </div>

        {/* Stats Card */}
        <div className="mb-8">
          <TaskCompletionCard />
        </div>

        {/* Add Task Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            <Input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 h-12 bg-white border-slate-200 rounded-xl shadow-sm"
            />
            <Button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="h-12 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 shadow-sm"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </form>

        {/* Task List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No tasks yet. Add one above!</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={(checked) => toggleTask(task.id, checked)}
                  className="w-5 h-5 rounded-md border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <span
                  className={`flex-1 text-slate-700 transition-all ${
                    task.completed ? "line-through text-slate-400" : ""
                  }`}
                >
                  {task.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {completedCount > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={clearCompleted}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear completed
            </button>
          </div>
        )}
      </div>

      {/* AI Chat Panel */}
      <AIChatPanel onTasksChanged={fetchTasks} />
    </div>
  );
}
