import { createClientFromRequest } from "npm:@base44/sdk";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { taskTitle } = await req.json();

    if (!taskTitle) {
      return Response.json({ error: "taskTitle is required" }, { status: 400 });
    }

    // Get the Slack OAuth token via the connector
    const slackToken = await base44.asServiceRole.connectors.getAccessToken("slack");

    // Look up the channel ID by name
    const channelName = "baas44-agent-skills";
    
    // Post a message to Slack
    const slackResponse = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${slackToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: channelName,
        text: `Task completed: ${taskTitle}`,
      }),
    });

    const result = await slackResponse.json();

    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
