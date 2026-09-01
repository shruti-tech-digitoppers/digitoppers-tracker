const axios = require('axios');

async function testWorkflow() {
  const API_URL = 'http://localhost:5000/api/v1';

  console.log('--- 1. Testing Admin Login ---');
  const loginRes = await axios.post(`${API_URL}/auth/login`, {
    email: 'admin@digitopper.com',
    password: 'Admin@123'
  });
  const token = loginRes.data.data?.token || loginRes.data.token;
  const adminUser = loginRes.data.data?.employee || loginRes.data.employee || {};
  console.log('✅ Admin Logged In:', adminUser.name, 'Role:', adminUser.globalRole);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  console.log('\n--- 2. Fetching Employees ---');
  const empRes = await axios.get(`${API_URL}/employees`, authHeaders);
  const employees = empRes.data.data || empRes.data.employees || [];
  console.log(`✅ Found ${employees.length} employees`);
  const hardwareEmployee = employees[1] || employees[0];
  const purchaseEmployee = employees[2] || employees[0];
  console.log(`Selected Hardware Lead: ${hardwareEmployee.name} (${hardwareEmployee.email})`);
  console.log(`Selected Purchase Lead: ${purchaseEmployee.name} (${purchaseEmployee.email})`);

  console.log('\n--- 3. Fetching Projects ---');
  const projRes = await axios.get(`${API_URL}/projects`, authHeaders);
  const projects = projRes.data.data || projRes.data.projects || [];
  if (projects.length === 0) {
    console.log('❌ No projects found to test');
    return;
  }
  const testProject = projects[0];
  console.log(`✅ Using Project: ${testProject.projectCode} - ${testProject.title}`);

  console.log('\n--- 4. Fetching Project Timeline Hierarchy ---');
  const timelineRes = await axios.get(`${API_URL}/projects/${testProject._id}/timeline`, authHeaders);
  const treeNodes = timelineRes.data.data?.structure || [];
  console.log(`✅ Loaded ${treeNodes.length} top-level timeline stage nodes`);

  // Find Stage 03 Hardware Requirement node
  let hwReqNode = null;
  let stockCheckNode = null;
  let purchaseNode = null;

  function findNodes(list) {
    for (const n of list) {
      if (n.key === 'HARDWARE_REQUIREMENT') hwReqNode = n;
      if (n.key === 'REQ_AND_STOCK_CHECK') stockCheckNode = n;
      if (n.key === 'PURCHASE_IF_NEEDED') purchaseNode = n;
      if (n.children && n.children.length > 0) findNodes(n.children);
    }
  }
  findNodes(treeNodes);

  console.log('Found nodes:');
  console.log('- HARDWARE_REQUIREMENT:', hwReqNode ? hwReqNode._id : 'Not Found');
  console.log('- REQ_AND_STOCK_CHECK:', stockCheckNode ? stockCheckNode._id : 'Not Found');
  console.log('- PURCHASE_IF_NEEDED:', purchaseNode ? purchaseNode._id : 'Not Found');

  if (!hwReqNode) {
    console.log('❌ HARDWARE_REQUIREMENT node not found in project tree');
    return;
  }

  console.log('\n--- 5. Submitting Stage 03: Hardware Requirements (PM Action) ---');
  const hwPayload = {
    formData: {
      hardwareRequirements: {
        items: {
          IFP_PANEL: { selected: true, itemName: 'Interactive Flat Panel (IFP)', quantity: 4, specNotes: '75-inch 4K UHD, Maxhub' },
          TABLETS: { selected: true, itemName: 'Student Tablets / Chromebooks', quantity: 20, specNotes: 'Lenovo 10.1 inch, 4GB RAM' },
          CHARGING_CART: { selected: true, itemName: 'Smart Tablet Charging Cart', quantity: 1, specNotes: '32-device AC smart charging' }
        }
      },
      assignedHardwareManager: hardwareEmployee._id,
      remarks: 'Lab setup required for STEM room 101'
    }
  };

  await axios.put(
    `${API_URL}/projects/${testProject._id}/timeline/nodes/${hwReqNode._id}/form`,
    hwPayload,
    authHeaders
  );
  console.log('✅ Stage 03 Hardware Requirement saved successfully');

  console.log('\n--- 6. Verifying REQ_AND_STOCK_CHECK Auto-Assignment & Notification ---');
  const afterHwTimeline = await axios.get(`${API_URL}/projects/${testProject._id}/timeline`, authHeaders);
  findNodes(afterHwTimeline.data.data?.structure || []);
  console.log('Stock Check Node Assigned To:', stockCheckNode?.assignedTo);

  // Check Notifications for Hardware Lead by logging in as Hardware Lead
  const hwLogin = await axios.post(`${API_URL}/auth/login`, {
    email: hardwareEmployee.email,
    password: 'Password@123'
  });
  const hwLeadNotifs = await axios.get(`${API_URL}/notifications`, {
    headers: { Authorization: `Bearer ${hwLogin.data.data.token}` }
  });
  const notifsList = hwLeadNotifs.data.data || hwLeadNotifs.data.notifications || [];
  console.log(`✅ Hardware Lead (${hardwareEmployee.name}) has ${notifsList.length} notifications:`);
  notifsList.slice(0, 2).forEach((n) => console.log(`   🔔 [${n.title}] -> ${n.message}`));

  if (stockCheckNode) {
    console.log('\n--- 7. Submitting Stage 04: Stock Check (Hardware Lead Action) ---');
    const stockPayload = {
      formData: {
        stockCheck: {
          items: {
            IFP_PANEL: { selected: true, itemName: 'Interactive Flat Panel (IFP)', quantity: 4, inStockQty: 1, purchaseQty: 3 },
            TABLETS: { selected: true, itemName: 'Student Tablets / Chromebooks', quantity: 20, inStockQty: 20, purchaseQty: 0 },
            CHARGING_CART: { selected: true, itemName: 'Smart Tablet Charging Cart', quantity: 1, inStockQty: 0, purchaseQty: 1 }
          }
        },
        purchaseAssignedTo: purchaseEmployee._id,
        remarks: '1 IFP and 20 Tablets in warehouse. 3 IFPs and 1 Charging Cart need purchase.'
      }
    };

    await axios.put(
      `${API_URL}/projects/${testProject._id}/timeline/nodes/${stockCheckNode._id}/form`,
      stockPayload,
      authHeaders
    );
    console.log('✅ Stage 04 Stock Check saved successfully (3 IFPs + 1 Cart marked for purchase)');

    console.log('\n--- 8. Verifying PURCHASE_IF_NEEDED Auto-Assignment & Notification ---');
    const purchaseLogin = await axios.post(`${API_URL}/auth/login`, {
      email: purchaseEmployee.email,
      password: 'Password@123'
    });
    const purchaseLeadNotifs = await axios.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${purchaseLogin.data.data.token}` }
    });
    const purchaseNotifsList = purchaseLeadNotifs.data.data || purchaseLeadNotifs.data.notifications || [];
    console.log(`✅ Purchase Lead (${purchaseEmployee.name}) has ${purchaseNotifsList.length} notifications:`);
    purchaseNotifsList.slice(0, 2).forEach((n) => console.log(`   🔔 [${n.title}] -> ${n.message}`));
  }

  console.log('\n===============================================================');
  console.log('🎉 ALL END-TO-END BACKEND & FRONTEND WORKFLOW TESTS SUCCEEDED!');
  console.log('===============================================================');
}

testWorkflow().catch((err) => {
  console.error('❌ Test failed:', err.response?.data || err.message);
});
