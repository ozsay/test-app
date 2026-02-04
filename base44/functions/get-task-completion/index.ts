import { createClientFromRequest } from "npm:@base44/sdk";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Use service role to get all tasks
    const tasks = await base44.asServiceRole.entities.Task.list();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task: { completed: boolean }) => task.completed).length;

    // Calculate completion percentage (handle division by zero)
    const completionPercentage = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;

    console.log(`Total tasks: ${totalTasks}, Completed tasks: ${completedTasks}, Completion percentage: ${completionPercentage}`);

    if (completionPercentage < 50) {
      throw new Error("Completion percentage is less than 50%");

    }

    console.log(`Tasks: ${JSON.stringify(tasks)}`);
    return Response.json({
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      completionPercentage
    });

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});
