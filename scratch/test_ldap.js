import ldap from 'ldapjs';
import dotenv from 'dotenv';

dotenv.config();

const username = 'adminuser';
const password = 'AdminPassword123';

const cleanUser = username.trim();
const bindDn = process.env.AD_USER_DN_PATTERN
  ? process.env.AD_USER_DN_PATTERN.replace('{username}', cleanUser)
  : (cleanUser.includes('@') ? cleanUser : `${cleanUser}${process.env.AD_DOMAIN_SUFFIX || ''}`);

console.log('-------------------------------------------');
console.log('User DN for auth bind:', bindDn);
console.log('-------------------------------------------');

const client = ldap.createClient({ url: process.env.AD_URL });

client.bind(bindDn, password, (bindErr) => {
  if (bindErr) {
    console.error('BIND ERROR:', bindErr.message);
    client.destroy();
    return;
  }
  console.log('BIND SUCCESS: Authenticated successfully!');
  
  console.log('\nQuerying user attributes for:', bindDn);
  client.search(bindDn, { scope: 'base', filter: '(objectClass=*)' }, (searchErr, res) => {
    if (searchErr) {
      console.error('Search initiation failed:', searchErr.message);
      client.destroy();
      return;
    }
    
    res.on('searchEntry', (entry) => {
      console.log('User Entry parsed object:');
      console.log(JSON.stringify(entry.object, null, 2));
    });
    
    res.on('error', (streamErr) => {
      console.error('Stream error:', streamErr.message);
    });
    
    res.on('end', () => {
      client.destroy();
    });
  });
});
