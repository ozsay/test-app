import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { BarChart3, RefreshCw } from "lucide-react";

export function TaskCompletionCard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await base44.functions.invoke("get-task-completion");
      // Handle both direct response and wrapped { data: ... } response
      const data = response.data ?? response;
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-orange-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Task Statistics</h2>
      </div>

      {stats ? (
        <div className="space-y-4">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Completion</span>
              <span className="font-medium text-slate-900">{stats.completionPercentage}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.totalTasks}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
              <p className="text-xs text-slate-500">Done</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">{stats.pendingTasks}</p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
          </div>

          {/* Refresh button */}
          <Button
            onClick={fetchStats}
            disabled={isLoading}
            variant="ghost"
            className="w-full mt-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-slate-500 mb-4">
            Fetch task completion stats from the backend
          </p>
          <Button
            onClick={fetchStats}
            disabled={isLoading}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-6"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Get Statistics"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
