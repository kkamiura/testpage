const functions = require("firebase-functions");
const fetch = require("node-fetch");

// Firebase Functions の config から取得
// terminal で: firebase functions:config:set github.pat="YOUR_PAT" github.repo="kkamiura/testpage"
const PAT  = functions.config().github.pat;
const REPO = functions.config().github.repo;  // "owner/repo"
const WORKFLOW_FILE = "update-pc-list.yml";

exports.updatePcStatus = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }
  const { status_row, new_status } = req.body;
  if (!status_row || !new_status) {
    return res.status(400).send("Missing parameters");
  }

  const url = `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
  const body = {
    ref: "main",
    inputs: { status_row, new_status }
  };

  try {
    const apiRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAT}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify(body)
    });
    if (apiRes.status === 204) {
      return res.json({ success: true });
    } else {
      const text = await apiRes.text();
      return res.status(apiRes.status).send(`GitHub API error: ${text}`);
    }
  } catch (e) {
    console.error(e);
    return res.status(500).send("Internal Server Error");
  }
});
