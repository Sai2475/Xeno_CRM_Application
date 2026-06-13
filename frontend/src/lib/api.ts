const API_BASE = "http://localhost:8000/api";

export async function fetchDashboard() {
  const res = await fetch(`${API_BASE}/dashboard`);
  return res.json();
}

export async function generateAudience(query: string) {
  const res = await fetch(`${API_BASE}/ai/segment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

export async function generateCampaign(objective: string) {
  const res = await fetch(`${API_BASE}/ai/campaign/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ objective }),
  });
  return res.json();
}

export async function launchCampaign(segmentQuery: any, channel: string, messageContent: string) {
  const res = await fetch(`${API_BASE}/campaigns/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      campaign_id: "new",
      segment_query: segmentQuery,
      channel: channel,
      message_content: messageContent
    }),
  });
  return res.json();
}

export async function chatAgent(message: string) {
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  return res.json();
}

export async function getCustomerDetails(customerId: string) {
  const res = await fetch(`${API_BASE}/customers/${customerId}`);
  return res.json();
}
