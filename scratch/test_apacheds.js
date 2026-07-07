import ldap from 'ldapjs';
import dotenv from 'dotenv';

dotenv.config();

// Get arguments from command line
const args = process.argv.slice(2);
const username = args[0];
const password = args[1];

if (!username || !password) {
  console.log('Usage: node scratch/test_apacheds.js <username> <password>');
  console.log('Example: node scratch/test_apacheds.js adminuser SecretPass123');
  process.exit(1);
}

const adUrl = process.env.AD_URL || 'ldap://localhost:389';
const baseDn = process.env.AD_BASE_DN || 'dc=scout,dc=local';
const userPattern = process.env.AD_USER_DN_PATTERN || 'cn={username},ou=users,dc=scout,dc=local';

const bindDn = userPattern.replace('{username}', username);

console.log('--------------------------------------------------');
console.log(`Connecting to LDAP server: ${adUrl}`);
console.log(`Attempting Bind DN:        ${bindDn}`);
console.log('--------------------------------------------------');

const client = ldap.createClient({ url: adUrl });

client.bind(bindDn, password, (err) => {
  if (err) {
    console.error('❌ AUTHENTICATION FAILED');
    console.error('Error details:', err.message);
    client.destroy();
    process.exit(1);
  }

  console.log('✅ BIND SUCCESS: Credentials are valid!');
  
  // Attempt search to verify base DN access
  console.log(`Searching directory base: ${baseDn}...`);
  client.search(bindDn, { scope: 'base', filter: '(objectClass=*)' }, (searchErr, res) => {
    if (searchErr) {
      console.log('⚠️ Bind was successful but user details query returned error:', searchErr.message);
      client.destroy();
      process.exit(0);
    }

    res.on('searchEntry', (entry) => {
      console.log('User object metadata returned:');
      console.log(JSON.stringify(entry.object, null, 2));
    });

    res.on('error', (streamErr) => {
      console.warn('⚠️ Search stream warning:', streamErr.message);
    });

    res.on('end', () => {
      console.log('--------------------------------------------------');
      console.log('Test completed successfully.');
      client.destroy();
      process.exit(0);
    });
  });
});
