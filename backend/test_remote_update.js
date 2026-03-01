const jwt = require('jsonwebtoken');
const axios = require('axios');
const token = jwt.sign(
    { userId: '11111111-1111-1111-1111-111111111111', tenantId: '4fe045cb-405e-428d-8332-1efcafdf17c9', role: 'OWNER' },
    'supersecretjwtkey_change_in_production'
);

axios.put('https://foodsystempdv.onrender.com/api/users/552b2780-9b70-495b-b7b5-0ab83b34065c', 
  { name: 'Fabiolla Modified', email: 'eufaluba@gmail.com', role: 'MANAGER' }, 
  { headers: { Authorization: `Bearer ${token}` } }
).then(console.log).catch(e => console.error(e.response ? e.response.data : e.message));
