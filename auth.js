import ldap from 'ldapjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-server-scout-api';

/**
 * Authenticate a user against LDAP/Active Directory.
 * @param {string} username - The login name.
 * @param {string} password - The user's password.
 * @returns {Promise<{username: string, displayName: string, email: string, groups: string[], canWrite: boolean}>}
 */
export function authenticateUser(username, password) {
  return new Promise((resolve, reject) => {
    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      return reject(new Error('Username and password are required.'));
    }

    // 1. Local Mock LDAP Mode
    if (process.env.AD_MOCK === 'true') {
      const lowerUser = cleanUser.toLowerCase();
      if (lowerUser === 'adminuser' || lowerUser === 'admin') {
        return resolve({
          username: cleanUser,
          displayName: 'Mock Administrator',
          email: 'adminuser@scout.local',
          groups: ['ServerScout-Admins', 'ServerScout-Writers'],
          canWrite: true
        });
      } else if (lowerUser === 'readonlyuser' || lowerUser === 'user') {
        return resolve({
          username: cleanUser,
          displayName: 'Mock ReadOnly User',
          email: 'readonlyuser@scout.local',
          groups: ['ServerScout-Readers'],
          canWrite: false
        });
      } else {
        return reject(new Error('Invalid mock credentials. Hint: Use "adminuser" or "readonlyuser".'));
      }
    }

    // 2. Real LDAP Connection using direct ldapjs
    const client = ldap.createClient({
      url: process.env.AD_URL
    });

    const bindDn = process.env.AD_USER_DN_PATTERN
      ? process.env.AD_USER_DN_PATTERN.replace('{username}', cleanUser)
      : (cleanUser.includes('@') ? cleanUser : `${cleanUser}${process.env.AD_DOMAIN_SUFFIX || ''}`);

    client.bind(bindDn, password, (bindErr) => {
      if (bindErr) {
        client.destroy();
        console.error('LDAP authentication bind failed:', bindErr.message);
        return reject(new Error('Invalid username or password.'));
      }

      // Successfully authenticated!
      // Now, query the user details (name and email) and group membership.
      const searchClient = (process.env.AD_ADMIN_USER && process.env.AD_ADMIN_PASSWORD)
        ? ldap.createClient({ url: process.env.AD_URL })
        : null;

      const performSearch = (activeClient) => {
        // Query user details first
        activeClient.search(bindDn, { scope: 'base', filter: '(objectClass=*)' }, (userErr, userRes) => {
          let displayName = cleanUser;
          let email = `${cleanUser}${process.env.AD_DOMAIN_SUFFIX || '@scout.local'}`;

          if (!userErr) {
            userRes.on('searchEntry', (entry) => {
              const gn = entry.object.givenName;
              const sn = entry.object.sn;
              if (gn && sn) {
                const first = Array.isArray(gn) ? gn[0] : gn;
                const last = Array.isArray(sn) ? sn[0] : sn;
                displayName = `${first} ${last}`;
              } else {
                const cnVal = entry.object.cn || entry.object.displayName;
                if (cnVal) {
                  displayName = Array.isArray(cnVal) ? cnVal[0] : cnVal;
                }
              }

              const mailVal = entry.object.mail;
              if (mailVal) {
                email = Array.isArray(mailVal) ? mailVal[0] : mailVal;
              }
            });
          }

          // Next query group membership
          const searchOptions = {
            filter: `(|(member=${bindDn})(uniqueMember=${bindDn}))`,
            scope: 'sub',
            attributes: ['cn']
          };

          activeClient.search(process.env.AD_BASE_DN, searchOptions, (groupSearchErr, groupSearchRes) => {
            if (groupSearchErr) {
              console.error('LDAP group search failed:', groupSearchErr.message);
              if (searchClient) searchClient.destroy();
              client.destroy();
              return resolve({
                username: cleanUser,
                displayName,
                email,
                groups: [],
                canWrite: false
              });
            }

            const groups = [];
            groupSearchRes.on('searchEntry', (entry) => {
              const cn = entry.object.cn;
              if (cn) {
                if (Array.isArray(cn)) {
                  groups.push(...cn);
                } else {
                  groups.push(cn);
                }
              }
            });

            groupSearchRes.on('error', (streamErr) => {
              console.warn('LDAP group search stream warning:', streamErr.message);
            });

            groupSearchRes.on('end', () => {
              if (searchClient) searchClient.destroy();
              client.destroy();

              // Check write access
              const writeGroupsStr = process.env.AD_WRITE_GROUPS || 'ServerScout-Admins,ServerScout-Writers';
              const writeGroups = writeGroupsStr.split(',').map(g => g.trim().toLowerCase());
              
              const userGroupsLower = groups.map(g => g.toLowerCase());
              const canWrite = userGroupsLower.some(g => writeGroups.includes(g));

              resolve({
                username: cleanUser,
                displayName,
                email,
                groups,
                canWrite
              });
            });
          });
        });
      };

      if (searchClient) {
        searchClient.bind(process.env.AD_ADMIN_USER, process.env.AD_ADMIN_PASSWORD, (adminBindErr) => {
          if (adminBindErr) {
            console.warn('LDAP: Admin search bind failed. Falling back to standard user client:', adminBindErr.message);
            searchClient.destroy();
            performSearch(client);
          } else {
            performSearch(searchClient);
          }
        });
      } else {
        performSearch(client);
      }
    });
  });
}

/**
 * Generate a JWT token for the authenticated session.
 * @param {Object} userPayload - The authenticated user credentials.
 */
export function generateToken(userPayload) {
  return jwt.sign(
    {
      username: userPayload.username,
      displayName: userPayload.displayName,
      email: userPayload.email,
      canWrite: userPayload.canWrite,
      groups: userPayload.groups
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

/**
 * Verify a JWT token.
 * @param {string} token - The authorization header bearer token string.
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export default {
  authenticateUser,
  generateToken,
  verifyToken
};
