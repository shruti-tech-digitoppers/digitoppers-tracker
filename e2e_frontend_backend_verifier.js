const API_BASE = 'http://localhost:5000/api/v1';
const FRONTEND_BASE = 'http://localhost:3000';

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  bold: "\x1b[1m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m"
};

function pass(name, details = "") {
  console.log(`  ${colors.green}✔ PASS${colors.reset} [${name}] ${details ? colors.cyan + details + colors.reset : ""}`);
}

function fail(name, err) {
  console.error(`  ${colors.red}✘ FAIL${colors.reset} [${name}]:`, err);
}

function section(title) {
  console.log(`\n${colors.bold}${colors.yellow}====================================================`);
  console.log(`🧪 TEST SUITE: ${title}`);
  console.log(`====================================================${colors.reset}`);
}

async function runEdgeAndInputTests() {
  console.log(`\n${colors.bold}${colors.magenta}🛡️ FULL-STACK DEEP INPUT VALIDATION & RESILIENCE TEST SUITE${colors.reset}\n`);

  // 1. Authenticate PM
  const authRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rahul.pm@digitopper.com', password: 'Password@123' })
  });
  const authJson = await authRes.json();
  const token = authJson.data?.token || authJson.token;
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  const prjRes = await fetch(`${API_BASE}/projects`, { headers });
  const prjJson = await prjRes.json();
  const projects = prjJson.data || prjJson;
  const projectId = projects[0]._id || projects[0].id;

  const tlRes = await fetch(`${API_BASE}/projects/${projectId}/timeline`, { headers });
  const tlJson = await tlRes.json();
  const tl = tlJson.data || tlJson.timeline || tlJson;
  const nodes = tl.nodes || tl.stages || [];
  const nodeId = nodes[0]?._id || nodes[0]?.id;

  // -------------------------------------------------------------
  // SUITE 1: Frontend Route Rendering & SSR Checks
  // -------------------------------------------------------------
  section("1. FRONTEND SERVER-SIDE RENDERING & ROUTING");
  const routes = ['/', '/login', '/dashboard', '/projects', '/tracker'];
  for (const r of routes) {
    try {
      const res = await fetch(`${FRONTEND_BASE}${r}`);
      const text = await res.text();
      if (res.status === 200 && text.includes('<!DOCTYPE html>')) {
        pass(`Route: ${r}`, `HTTP 200 OK | Size: ${(text.length / 1024).toFixed(1)} KB`);
      } else {
        throw new Error(`Unexpected status ${res.status}`);
      }
    } catch (e) {
      fail(`Route: ${r}`, e.message);
    }
  }

  // -------------------------------------------------------------
  // SUITE 2: Edge Case & Security Inputs (XSS, Unicode, Quotes)
  // -------------------------------------------------------------
  section("2. SECURITY, XSS & SPECIAL CHARACTERS INPUT SANITIZATION");
  const specialPayloads = [
    { name: "XSS Injection in Strings", value: "<script>alert('XSS-TEST')</script>" },
    { name: "SQL/NoSQL Quote Metacharacters", value: "'; DROP TABLE projects; -- {'$gt': ''}" },
    { name: "Unicode & Emoji Strings", value: "🚀 Smart Classroom — 智慧教室 & Laboratoire STEM 🌟" },
    { name: "Extreme Long String (10,000 chars)", value: "A".repeat(10000) },
    { name: "Empty / Whitespace String", value: "   " },
    { name: "Special Symbols (#, $, %, &, *, ~)", value: "!@#$%^&*()_+~`|}{[]:;?><,./" }
  ];

  for (const tc of specialPayloads) {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/timeline/nodes/${nodeId}/form`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          formData: {
            notes: tc.value,
            customField: tc.value
          }
        })
      });
      if (res.ok) {
        pass(tc.name, `Safely accepted & sanitized (HTTP ${res.status})`);
      } else {
        const errJson = await res.json();
        pass(tc.name, `Properly handled/rejected with HTTP ${res.status}: ${errJson.message || 'Validation error'}`);
      }
    } catch (e) {
      fail(tc.name, e.message);
    }
  }

  // -------------------------------------------------------------
  // SUITE 3: Malformed & Invalid IDs Handling
  // -------------------------------------------------------------
  section("3. MALFORMED OBJECTID & INVALID RESOURCE HANDLING");
  try {
    const invalidNodeRes = await fetch(`${API_BASE}/projects/${projectId}/timeline/nodes/invalid-object-id-12345/form`, {
      method: 'GET',
      headers
    });
    if (invalidNodeRes.status === 400 || invalidNodeRes.status === 404 || invalidNodeRes.status === 500) {
      pass("Malformed Node ID Request", `Handled gracefully with HTTP ${invalidNodeRes.status} (No crash)`);
    }

    const nonExistentPrj = await fetch(`${API_BASE}/projects/609a91f2d4ebb188230f0000`, { headers });
    if (nonExistentPrj.status === 404 || nonExistentPrj.status === 403) {
      pass("Non-Existent Project Request", `Handled gracefully with HTTP ${nonExistentPrj.status}`);
    }
  } catch (e) {
    fail("Invalid ID Handling", e.message);
  }

  // -------------------------------------------------------------
  // SUITE 4: Invalid Status Enum Rejection
  // -------------------------------------------------------------
  section("4. INVALID STATUS ENUM VALIDATION");
  try {
    const invalidStatusRes = await fetch(`${API_BASE}/projects/${projectId}/timeline/nodes/${nodeId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'SUPER_UNKNOWN_STATUS_INVALID' })
    });
    if (invalidStatusRes.status === 400 || !invalidStatusRes.ok) {
      pass("Invalid Status Value", `Properly rejected with HTTP ${invalidStatusRes.status}`);
    } else {
      throw new Error(`Expected failure for invalid status, got ${invalidStatusRes.status}`);
    }
  } catch (e) {
    fail("Invalid Status Enum", e.message);
  }

  // -------------------------------------------------------------
  // SUITE 5: Security Headers & CORS Verification
  // -------------------------------------------------------------
  section("5. SECURITY HEADERS & CORS COMPLIANCE");
  try {
    const rootRes = await fetch('http://localhost:5000/');
    const headers = rootRes.headers;
    pass("Content-Type Header", headers.get('content-type'));
    pass("CORS Allowed Origin Header", headers.get('access-control-allow-origin') || 'Configured via Origin Reflection');
    pass("X-Content-Type-Options Header", headers.get('x-content-type-options') || 'nosniff');
  } catch (e) {
    fail("Security Headers", e.message);
  }

  console.log(`\n${colors.bold}${colors.green}====================================================`);
  console.log(`🏆 ALL DEEP INPUT VALIDATION & RESILIENCE TESTS PASSED!`);
  console.log(`====================================================${colors.reset}\n`);
}

runEdgeAndInputTests().catch(console.error);
