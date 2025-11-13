// /api/set-icon.js (Vercel Serverless Function)
export default async function handler(req, res) {
  try {
    const page_id = (req.query.page_id || "").trim();
    if (!page_id) return res.status(400).json({ error: "Missing page_id" });

    // Fetch page to read properties
    const pageResp = await fetch(`https://api.notion.com/v1/pages/${page_id}`, {
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
      },
    });
    if (!pageResp.ok) {
      const errText = await pageResp.text();
      return res.status(pageResp.status).send(errText);
    }
    const page = await pageResp.json();

    // Read Task Type (adjust property name if needed)
    const props = page.properties || {};
    const taskType =
      props["Task Type"]?.select?.name ||
      props["task type"]?.select?.name ||
      props["Type"]?.select?.name ||
      "";

    const map = {
      lecture: "👩‍🏫", // woman teacher
      assignment: "📖",
      exam: "💯",
      lab_werk: "🥼",
      lab_meeting: "🧑‍🧒",
      hangout: "👯‍♀️",
      lab_출근: "🚶‍♀️",
       default: "📌",
    };
    const emoji = map[(taskType || "").toLowerCase()] || map.default;

    // Patch the page icon
    const patchResp = await fetch(`https://api.notion.com/v1/pages/${page_id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ icon: { type: "emoji", emoji } }),
    });

    if (!patchResp.ok) {
      const errText = await patchResp.text();
      return res.status(patchResp.status).send(errText);
    }

    return res.status(200).json({ ok: true, page_id, taskType, icon: emoji });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}
