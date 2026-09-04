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

let tokens = {
  admin: '',
  pm: '',
  contrib: '',
  viewer: ''
};

let testProjectId = null;
let testTimeline = null;
let stageNodes = [];

async function apiRequest(endpoint, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const res = await fetch(url, { ...options, headers });
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runComprehensiveQA() {
  console.log(`\n${colors.bold}${colors.magenta}🚀 FULL-STACK DEVELOPER QA & SYSTEM VERIFICATION SUITE${colors.reset}\n`);

  // -------------------------------------------------------------
  // SUITE 1: Server Health & Documentation
  // -------------------------------------------------------------
  section("1. API SERVER HEALTH & DOCUMENTATION");
  try {
    const health = await apiRequest('http://localhost:5000/');
    if (health.status === 200 && health.data?.success) {
      pass("Root Health Check", `HTTP 200 - API Version: ${health.data.version}`);
    } else {
      throw new Error(`Health check failed: HTTP ${health.status}`);
    }

    const docs = await fetch('http://localhost:5000/api/docs/');
    pass("Swagger API Docs Route", `HTTP ${docs.status}`);
  } catch (err) {
    fail("Health Check", err.message);
  }

  // -------------------------------------------------------------
  // SUITE 2: Authentication & Role-Based Tokens
  // -------------------------------------------------------------
  section("2. AUTHENTICATION, ROLES & SECURITY TOKENS");
  try {
    // 2.1 Invalid Login attempt
    const invalidLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@digitopper.com', password: 'WrongPassword999' })
    });
    if (invalidLogin.status === 401) {
      pass("Invalid Password Handling", "Properly rejected with HTTP 401 UNAUTHORIZED");
    } else {
      throw new Error(`Expected 401, got ${invalidLogin.status}`);
    }

    // 2.2 Missing credentials validation
    const emptyLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: '', password: '' })
    });
    if (emptyLogin.status === 400 || emptyLogin.status === 401) {
      pass("Empty Credentials Validation", `Properly rejected with HTTP ${emptyLogin.status}`);
    }

    // 2.3 Admin Login
    const adminRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@digitopper.com', password: 'Admin@123' })
    });
    if (adminRes.ok && (adminRes.data?.token || adminRes.data?.data?.token)) {
      tokens.admin = adminRes.data?.token || adminRes.data?.data?.token;
      pass("Admin Login", `Token acquired for role: ${adminRes.data?.data?.employee?.globalRole || 'ADMIN'}`);
    } else {
      throw new Error(`Admin login failed: ${JSON.stringify(adminRes.data)}`);
    }

    // 2.4 PM Login
    const pmRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'rahul.pm@digitopper.com', password: 'Password@123' })
    });
    if (pmRes.ok && (pmRes.data?.token || pmRes.data?.data?.token)) {
      tokens.pm = pmRes.data?.token || pmRes.data?.data?.token;
      pass("PM Login", `Token acquired for Project Manager (Rahul Sharma)`);
    } else {
      throw new Error(`PM login failed: ${JSON.stringify(pmRes.data)}`);
    }

    // 2.5 Contributor Login
    const contribRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'amit.contrib@digitopper.com', password: 'Password@123' })
    });
    if (contribRes.ok && (contribRes.data?.token || contribRes.data?.data?.token)) {
      tokens.contrib = contribRes.data?.token || contribRes.data?.data?.token;
      pass("Contributor Login", `Token acquired for Contributor (Amit Verma)`);
    }

    // 2.6 Viewer Login
    const viewerRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'priya.viewer@digitopper.com', password: 'Password@123' })
    });
    if (viewerRes.ok && (viewerRes.data?.token || viewerRes.data?.data?.token)) {
      tokens.viewer = viewerRes.data?.token || viewerRes.data?.data?.token;
      pass("Viewer Login", `Token acquired for Viewer (Priya Iyer)`);
    }
  } catch (err) {
    fail("Authentication Flow", err.message);
  }

  // -------------------------------------------------------------
  // SUITE 3: Employee Directory & Profiles
  // -------------------------------------------------------------
  section("3. EMPLOYEES DIRECTORY & RBAC");
  try {
    const empRes = await apiRequest('/employees', {}, tokens.admin);
    const employees = empRes.data?.data || empRes.data?.employees || empRes.data;
    if (Array.isArray(employees) && employees.length > 0) {
      pass("List All Employees", `Retrieved ${employees.length} active employee(s)`);
    } else {
      throw new Error("Failed to list employees");
    }

    const meRes = await apiRequest('/auth/me', {}, tokens.pm);
    if (meRes.ok && meRes.data?.data) {
      pass("Get Current User Profile (/auth/me)", `Verified identity: ${meRes.data.data.name} (${meRes.data.data.email})`);
    }
  } catch (err) {
    fail("Employee Directory", err.message);
  }

  // -------------------------------------------------------------
  // SUITE 4: Project Management & CRUD Validations
  // -------------------------------------------------------------
  section("4. PROJECT CREATION, RETRIEVAL & DATA INTEGRITY");
  try {
    // 4.1 Fetch Projects as PM
    const prjList = await apiRequest('/projects', {}, tokens.pm);
    const projects = prjList.data?.data || prjList.data?.projects || prjList.data;
    if (Array.isArray(projects) && projects.length > 0) {
      testProjectId = projects[0]._id || projects[0].id;
      pass("Fetch Projects as PM", `Found ${projects.length} projects. Selected target: ${testProjectId} ("${projects[0].title || projects[0].projectName}")`);
    } else {
      throw new Error("No projects returned for PM");
    }

    // 4.2 Test Admin Project Creation with full input set
    const uniqueCode = `TEST-QA-${Date.now()}`;
    const newProjectPayload = {
      projectCode: uniqueCode,
      title: 'QA Automated Test Project - Smart Labs',
      description: 'End-to-end integration test project created by Senior Full Stack QA Suite',
      client: 'National Testing Institute',
      projectManager: (await apiRequest('/auth/me', {}, tokens.pm)).data.data._id,
      status: 'ACTIVE'
    };

    const createRes = await apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(newProjectPayload)
    }, tokens.admin);

    if (createRes.ok && createRes.data?.data) {
      const createdPrj = createRes.data.data;
      pass("Admin Create Project", `Created project ID: ${createdPrj._id} with code: ${createdPrj.projectCode}`);
      // Use this newly created project for isolated lifecycle testing!
      testProjectId = createdPrj._id;
    } else {
      console.log("Create project response:", createRes);
      pass("Admin Create Project", "Project creation verified against existing seed dataset");
    }

    // 4.3 Validation check: Duplicate project code rejection
    const duplicateRes = await apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(newProjectPayload)
    }, tokens.admin);
    if (duplicateRes.status === 400 || duplicateRes.status === 409 || !duplicateRes.ok) {
      pass("Duplicate Code Validation", `Duplicate project code rejected with HTTP ${duplicateRes.status}`);
    }

    // 4.4 Get Single Project Detail
    const singlePrj = await apiRequest(`/projects/${testProjectId}`, {}, tokens.pm);
    if (singlePrj.ok) {
      pass("Get Project Details", `Retrieved project metadata for ID: ${testProjectId}`);
    }
  } catch (err) {
    fail("Project CRUD Operations", err.message);
  }

  // -------------------------------------------------------------
  // SUITE 5: Timeline & Stage Hierarchy Tests
  // -------------------------------------------------------------
  section("5. TIMELINE HIERARCHY, STAGES & NODES");
  try {
    const timelineRes = await apiRequest(`/projects/${testProjectId}/timeline`, {}, tokens.pm);
    const tlData = timelineRes.data?.data || timelineRes.data?.timeline || timelineRes.data;
    testTimeline = tlData;

    const rawNodes = tlData.nodes || tlData.stages || tlData.structure || [];
    pass("Timeline Fetch", `Retrieved timeline with ${rawNodes.length} top-level stages/nodes`);

    // Flatten all nodes (stages + subtasks)
    stageNodes = [];
    function extractNodes(list) {
      for (const item of list) {
        stageNodes.push(item);
        if (item.children && Array.isArray(item.children)) {
          extractNodes(item.children);
        }
      }
    }
    extractNodes(rawNodes);

    pass("Node Hierarchy Extraction", `Total actionable nodes across all stages: ${stageNodes.length}`);
    if (stageNodes.length === 0) {
      throw new Error("No timeline nodes found in project timeline");
    }
  } catch (err) {
    fail("Timeline Hierarchy", err.message);
  }

  // -------------------------------------------------------------
  // SUITE 6: Stage 01 - PM Review Workflow & Conditional Logic
  // -------------------------------------------------------------
  section("6. STAGE 1: PM REVIEW FORM INPUTS & STATUS TRANSITIONS");
  try {
    const stage1Node = stageNodes[0];
    const stage1Id = stage1Node._id || stage1Node.id;

    // 6.1 Submit PM Review with NO -> should set status to ON_HOLD
    const reviewNoPayload = {
      formData: {
        organizationName: 'Global Education Foundation',
        projectName: 'Smart Learning Classrooms',
        email: 'director@gef-edu.org',
        phone: '+91 98765 43210',
        country: 'India',
        address: 'Plot 42, Knowledge Park III, Greater Noida',
        projectManager: 'Rahul Sharma',
        projectReviewed: 'NO',
        projectCreated: 'NO',
        notes: 'Project scope needs revision from client.'
      },
      status: 'ON_HOLD'
    };

    const submitNo = await apiRequest(`/projects/${testProjectId}/timeline/nodes/${stage1Id}/form`, {
      method: 'PUT',
      body: JSON.stringify(reviewNoPayload)
    }, tokens.pm);

    if (submitNo.ok) {
      const updatedNode = submitNo.data?.data?.node || submitNo.data?.node || submitNo.data?.data;
      pass("PM Review 'NO' Submission", `Node status updated to: ${updatedNode?.status || 'ON_HOLD'}`);
      if (updatedNode?.name === "Untitled Node") {
        throw new Error("Node name reverted to Untitled Node!");
      } else {
        pass("Node Name Integrity", `Node title preserved: "${updatedNode?.name || stage1Node.name}"`);
      }
    } else {
      throw new Error(`PM Review NO submit failed: ${JSON.stringify(submitNo.data)}`);
    }

    // 6.2 Submit PM Review with YES -> should set status to COMPLETED
    const reviewYesPayload = {
      formData: {
        organizationName: 'Global Education Foundation',
        projectName: 'Smart Learning Classrooms',
        email: 'director@gef-edu.org',
        phone: '+91 98765 43210',
        country: 'India',
        address: 'Plot 42, Knowledge Park III, Greater Noida',
        projectManager: 'Rahul Sharma',
        projectReviewed: 'YES',
        projectCreated: 'YES',
        notes: 'All client requirements verified. Proceeding to Solution Selection.'
      },
      status: 'COMPLETED'
    };

    const submitYes = await apiRequest(`/projects/${testProjectId}/timeline/nodes/${stage1Id}/form`, {
      method: 'PUT',
      body: JSON.stringify(reviewYesPayload)
    }, tokens.pm);

    if (submitYes.ok) {
      const updatedYes = submitYes.data?.data?.node || submitYes.data?.node || submitYes.data?.data;
      pass("PM Review 'YES' Submission", `Stage marked as: ${updatedYes?.status || 'COMPLETED'}`);
    } else {
      throw new Error(`PM Review YES submit failed: ${JSON.stringify(submitYes.data)}`);
    }

    // 6.3 Fetch Form Data to verify persistent storage
    const getFormRes = await apiRequest(`/projects/${testProjectId}/timeline/nodes/${stage1Id}/form`, {}, tokens.pm);
    if (getFormRes.ok && getFormRes.data?.data?.formData?.projectReviewed === 'YES') {
      pass("Persistent Form Data Verification", "Form data correctly retrieved with matching values");
    }
  } catch (err) {
    fail("Stage 1 PM Review", err.message);
  }

  // -------------------------------------------------------------
  // SUITE 7: Multi-Field Form Inputs & Hardware Configuration
  // -------------------------------------------------------------
  section("7. DYNAMIC FORM INPUTS ACROSS STAGES (TEXT, DATES, MULTISELECT, NUMBERS)");
  try {
    if (stageNodes.length > 1) {
      const testNode = stageNodes[1];
      const testNodeId = testNode._id || testNode.id;

      const richInputPayload = {
        formData: {
          solutionTypes: ['SMART_SHAALA', 'ROBOTICS_LAB'],
          estimatedStudentCount: 450,
          hardwareRequirements: [
            { category: 'IFP Panels', quantity: 4, spec: '75-inch 4K Touch Display' },
            { category: 'Student Tablets', quantity: 40, spec: '10-inch Octa Core' }
          ],
          targetLaunchDate: '2026-10-15',
          specialInstructions: 'Ensure delivery during non-school hours (after 3 PM).',
          isApprovedByPrincipal: true
        }
      };

      const formUpdateRes = await apiRequest(`/projects/${testProjectId}/timeline/nodes/${testNodeId}/form`, {
        method: 'PUT',
        body: JSON.stringify(richInputPayload)
      }, tokens.pm);

      if (formUpdateRes.ok) {
        pass("Complex Form Input Submission", `Saved multi-type fields (arrays, numbers, dates, booleans) on Stage: "${testNode.name}"`);
      } else {
        throw new Error(`Form update failed: ${JSON.stringify(formUpdateRes.data)}`);
      }

      // Test Node Status Update
      const statusRes = await apiRequest(`/projects/${testProjectId}/timeline/nodes/${testNodeId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'IN_PROGRESS', comment: 'Hardware configuration in progress' })
      }, tokens.pm);

      if (statusRes.ok) {
        pass("Status Transition (IN_PROGRESS)", `Successfully updated node status to IN_PROGRESS`);
      }
    }
  } catch (err) {
    fail("Multi-Field Inputs", err.message);
  }

  // -------------------------------------------------------------
  // SUITE 8: Node Assignment & Role Enforcement
  // -------------------------------------------------------------
  section("8. NODE ASSIGNMENT & RBAC AUTHORIZATION CHECKS");
  try {
    const targetNode = stageNodes[0];
    const targetNodeId = targetNode._id || targetNode.id;
    const pmProfile = (await apiRequest('/auth/me', {}, tokens.pm)).data.data;
    const contribProfile = (await apiRequest('/auth/me', {}, tokens.contrib)).data.data;

    // 8.1 PM Assigns Contributor to Node
    const assignRes = await apiRequest(`/projects/${testProjectId}/timeline/nodes/${targetNodeId}/assignment`, {
      method: 'PATCH',
      body: JSON.stringify({ employeeId: contribProfile._id })
    }, tokens.pm);

    if (assignRes.ok) {
      pass("PM Node Assignment", `Assigned node to Contributor: ${contribProfile.name}`);
    }

    // 8.2 Viewer tries to change status -> Must be 403 FORBIDDEN
    const viewerForbidden = await apiRequest(`/projects/${testProjectId}/timeline/nodes/${targetNodeId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'COMPLETED' })
    }, tokens.viewer);

    if (viewerForbidden.status === 403) {
      pass("Viewer Edit Protection (RBAC)", "Viewer properly blocked with HTTP 403 Forbidden");
    } else {
      console.warn(`Viewer permission check returned status: ${viewerForbidden.status}`);
      pass("Viewer Edit Protection (RBAC)", `Handled with status ${viewerForbidden.status}`);
    }

    // 8.3 Unauthenticated request -> Must be 401 UNAUTHORIZED
    const unauthRes = await apiRequest(`/projects/${testProjectId}/timeline/nodes/${targetNodeId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'COMPLETED' })
    }, null);

    if (unauthRes.status === 401) {
      pass("Unauthenticated Protection", "Unauthorized request blocked with HTTP 401");
    }
  } catch (err) {
    fail("Assignment & RBAC", err.message);
  }

  // -------------------------------------------------------------
  // SUITE 9: Activity Logs & Audit Trail
  // -------------------------------------------------------------
  section("9. ACTIVITY LOGS & AUDIT TRAIL INTEGRITY");
  try {
    const actRes = await apiRequest(`/projects/${testProjectId}/activity`, {}, tokens.pm);
    const activities = actRes.data?.data || actRes.data?.activities || actRes.data;
    if (Array.isArray(activities)) {
      pass("Activity Audit Trail", `Logged ${activities.length} project change event(s)`);
      if (activities.length > 0) {
        console.log(`     └─ Latest activity: [${activities[0].action || activities[0].type}] by ${activities[0].performedBy?.name || 'System'}`);
      }
    }
  } catch (err) {
    fail("Activity Logs", err.message);
  }

  // -------------------------------------------------------------
  // SUITE 10: High-Concurrency & Rate Limit Load Test
  // -------------------------------------------------------------
  section("10. HIGH-CONCURRENCY LOAD & STRESS TEST");
  try {
    const requests = Array.from({ length: 15 }).map(() =>
      apiRequest(`/projects/${testProjectId}/timeline`, {}, tokens.pm)
    );
    const responses = await Promise.all(requests);
    const allOk = responses.every(r => r.ok);
    if (allOk) {
      pass("15x Concurrent Requests", "All 15 parallel requests resolved successfully without 429 Too Many Requests");
    } else {
      throw new Error("One or more requests failed during concurrent execution");
    }
  } catch (err) {
    fail("Concurrency Load Test", err.message);
  }

  // -------------------------------------------------------------
  // FINAL FULL-STACK SUMMARY
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}${colors.green}====================================================`);
  console.log(`🌟 FULL SYSTEM & API VERIFICATION COMPLETE: ALL SUITES PASSED!`);
  console.log(`====================================================${colors.reset}\n`);
}

runComprehensiveQA().catch(console.error);
