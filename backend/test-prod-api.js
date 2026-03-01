async function test() {
  try {
    const regRes = await fetch('https://foodsystempdv.onrender.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantName: 'Test Tenant',
        name: 'Test',
        document: '0000',
        email: 'test400@test.com',
        password: '123'
      })
    });

    // Attempt login if register failed (might already exist)
    const loginRes = await fetch('https://foodsystempdv.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test400@test.com', password: '123' })
    });

    const loginData = await loginRes.json();
    const token = loginData.token;

    const catRes = await fetch('https://foodsystempdv.onrender.com/api/categories?type=INVENTORY', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const catData = await catRes.text();
    console.log("Status:", catRes.status, "Output:", catData);
  } catch (err) {
    console.log("Error:", err.message);
  }
}
test();
