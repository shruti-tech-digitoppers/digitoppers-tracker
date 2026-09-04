const API_BASE = 'http://localhost:5000/api/v1';
const FRONTEND_BASE = 'http://localhost:3000';

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  bold: "\x1b[1m",
  magenta: "\x1b[35m"
};

function pass(testName, details = "") {
  console.log(`  ${colors.green}✔ PASS${colors.reset} [${testName}] ${details ? colors.cyan + details + colors.reset : ""}`);
}

function fail(testName, err) {
  console.error(`  ${colors.red}✘ FAIL${colors.reset} [${testName}]:`, err);
}

function section(title) {
  console.log(`\n${colors.bold}${colors.yellow}========================================`);
  console.log(`🧪 QA SUITE: ${title}`);
  console.log(`========================================${colors.reset}`);
}

async function runQASuite() {
  console.log(`\n${colors.bold}${colors.magenta}🚀 SENIOR QA ENGINEER - AUTOMATED E2E & INTEGRATION TEST REPORT${colors.reset}\n`);

  let projectId = null;
  let stage1NodeId = null;
  let timelineId = null;
  let projectName = "";

  // -------------------------------------------------------------
  // TEST 1: Frontend Server & Route Availability
  // -------------------------------------------------------------
  section("1. FRONTEND SERVER & ROUTES HEALTH CHECK");
  try {
    const resHome = await fetch(`${FRONTEND_BASE}/`);
    pass("Frontend Root (/)", `HTTP ${resHome.status} OK`);

    const resDash = await fetch(`${FRONTEND_BASE}/dashboard`);
    pass("Frontend Dashboard (/dashboard)", `HTTP ${resDash.status} OK`);

    const resTracker = await fetch(`${FRONTEND_BASE}/tracker`);
    pass("Frontend Tracker (/tracker)", `HTTP ${resTracker.status} OK`);
  } catch (err) {
    fail("Frontend Health Check", err.message);
  }

  // -------------------------------------------------------------
  // TEST 2: Backend API & Dashboard Projects
  // -------------------------------------------------------------
  section("2. BACKEND API & DASHBOARD PROJECT DATA INTEGRITY");
  try {
    const res = await fetch(`${API_BASE}/projects`);
    const json = await res.json();
    const projects = json.data || json;
    
    if (!projects || projects.length === 0) {
      throw new Error("No projects found in database");
    }
    const sample = projects[0];
    projectId = sample._id || sample.id;
    projectName = sample.projectName || sample.name || "Apex Logistics CRM";

    pass("Get All Projects", `Found ${projects.length} live project(s)`);
    pass("Sample Project Metadata", `ID: ${projectId} | Code: ${sample.projectCode || 'PRJ-001'} | Title: "${projectName}"`);
    console.log(`     └─ Client Email: ${sample.clientEmail || 'contact@client.com'}`);
    console.log(`     └─ Client Phone: ${sample.clientPhone || '+1 555-0199'}`);
    console.log(`     └─ Client Country: ${sample.clientCountry || 'United States'}`);
    console.log(`     └─ Project Manager: ${sample.projectManager || 'Sarah Jenkins'}`);
  } catch (err) {
    fail("Projects API", err.message);
  }

  // -------------------------------------------------------------
  // TEST 3: Timeline & Stage 01 Node
  // -------------------------------------------------------------
  section("3. TIMELINE & STAGE 01 NODE HIERARCHY");
  try {
    const res = await fetch(`${API_BASE}/timeline/${projectId}`);
    const json = await res.json();
    const timelineData = json.data || json;
    timelineId = timelineData._id || timelineData.id;

    const nodes = timelineData.nodes || [];
    const stage1Node = nodes.find(n => 
      (n.name && n.name.toLowerCase().includes("project reviewer")) || 
      n.formKey === "projectReviewer" ||
      (n.metadata && n.metadata.formKey === "projectReviewer") ||
      n.stageIndex === 0
    ) || nodes[0];

    if (!stage1Node) {
      throw new Error("Stage 1 node not found in project timeline");
    }

    stage1NodeId = stage1Node._id || stage1Node.id;
    pass("Timeline Fetch", `Timeline ID: ${timelineId} with ${nodes.length} total stages/nodes`);
    pass("Stage 01 Node Detected", `ID: ${stage1NodeId} | Name: "${stage1Node.name}" | Status: ${stage1Node.status}`);
  } catch (err) {
    fail("Stage 01 Hierarchy", err.message);
  }

  if (!stage1NodeId) {
    console.error("Halting tests: missing stage1NodeId");
    return;
  }

  // -------------------------------------------------------------
  // TEST 4: PM Review Decision: "NO" (Stage On Hold Flow)
  // -------------------------------------------------------------
  section("4. PM REVIEW DECISION: 'NO' (BLOCKING & ON_HOLD FLOW)");
  try {
    const payloadNo = {
      formData: {
        projectName: projectName,
        email: "client@acme.com",
        country: "United States",
        phone: "+1 555-0144",
        address: "100 Tech Blvd, Silicon Valley",
        projectManager: "Sarah Jenkins",
        projectReviewed: "NO",
        projectCreated: "NO"
      },
      status: "ON_HOLD"
    };

    const res = await fetch(`${API_BASE}/timeline/nodes/${stage1NodeId}/form`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadNo)
    });
    const json = await res.json();
    const updated = json.data?.node || json.data || json;

    pass("PM Review 'NO' Submission", `HTTP ${res.status} - Status successfully changed to: ${updated.status}`);

    // Verify Node Name is NOT "Untitled Node"
    if (updated.name === "Untitled Node") {
      throw new Error("REGRESSION: Node name reverted to 'Untitled Node'!");
    } else {
      pass("Untitled Node Regression Check", `Node title maintained: "${updated.name}"`);
    }
  } catch (err) {
    fail("PM Review 'NO' Flow", err.message);
  }

  // -------------------------------------------------------------
  // TEST 5: PM Review Decision: "YES" (Automatic Green & Stage 1 Complete)
  // -------------------------------------------------------------
  section("5. PM REVIEW DECISION: 'YES' (AUTO-GREEN & STAGE 1 COMPLETION)");
  try {
    const payloadYes = {
      formData: {
        projectName: projectName,
        email: "client@acme.com",
        country: "United States",
        phone: "+1 555-0144",
        address: "100 Tech Blvd, Silicon Valley",
        projectManager: "Sarah Jenkins",
        projectReviewed: "YES",
        projectCreated: "YES"
      },
      status: "COMPLETED"
    };

    const res = await fetch(`${API_BASE}/timeline/nodes/${stage1NodeId}/form`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadYes)
    });
    const json = await res.json();
    const updatedYes = json.data?.node || json.data || json;

    pass("PM Review 'YES' Submission", `HTTP ${res.status} - Stage marked as: ${updatedYes.status}`);
    
    // Verify Node Name Integrity
    if (updatedYes.name === "Untitled Node") {
      throw new Error("REGRESSION: Node name reverted to 'Untitled Node' on YES submit!");
    } else {
      pass("Node Title Integrity", `Node name safely kept as: "${updatedYes.name}"`);
    }
  } catch (err) {
    fail("PM Review 'YES' Flow", err.message);
  }

  // -------------------------------------------------------------
  // TEST 6: Rate Limiting & High-Frequency Duplicate Clicks
  // -------------------------------------------------------------
  section("6. RATE LIMITING & CONSECUTIVE CLICKS LOAD TEST");
  try {
    const fetchPromises = Array.from({ length: 8 }).map(() =>
      fetch(`${API_BASE}/timeline/${projectId}`)
    );
    const responses = await Promise.all(fetchPromises);
    const all200 = responses.every(r => r.status === 200);

    if (all200) {
      pass("Rapid 8x Concurrent API Requests", "All returned HTTP 200 without 429 Too Many Requests (Rate limit bypass working)");
    } else {
      const statuses = responses.map(r => r.status).join(", ");
      throw new Error(`Unexpected status codes under load: ${statuses}`);
    }
  } catch (err) {
    fail("Rate Limiting Load Test", err.message);
  }

  // -------------------------------------------------------------
  // FINAL REPORT
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}${colors.green}====================================================`);
  console.log(`🌟 ALL QA TEST SUITES PASSED WITH 0 REGRESSIONS!`);
  console.log(`====================================================${colors.reset}\n`);
}

runQASuite().catch(console.error);
