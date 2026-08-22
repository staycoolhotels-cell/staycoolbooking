const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.substring(1, value.length - 1);
    env[key] = value.trim();
  }
});

const ACCOUNT_ID = 'acc_TSiBm2uD6sbTRI';
const PRODUCT_ID = 'acc_prd_TSiBsuDCMhTBph';

async function updateRazorpayBank() {
  const authString = Buffer.from(`${env['RAZORPAY_KEY_ID']}:${env['RAZORPAY_KEY_SECRET']}`).toString('base64');
  
  const patchPayload = {
    tnc_accepted: true,
    settlements: {
      beneficiary_name: 'Narne.Venkataramana',
      account_number: '32394071757',
      ifsc_code: 'SBIN0004104'
    }
  };

  console.log('Sending PATCH to Razorpay product endpoint with new account number 32394071757...');
  const res = await fetch(`https://api.razorpay.com/v2/accounts/${ACCOUNT_ID}/products/${PRODUCT_ID}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authString}`
    },
    body: JSON.stringify(patchPayload)
  });

  const data = await res.json();
  console.log('Razorpay PATCH Response Status:', res.status);
  console.log('Razorpay PATCH Response Data:', JSON.stringify(data, null, 2));
}

updateRazorpayBank();
