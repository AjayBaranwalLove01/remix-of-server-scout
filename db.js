import mssql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    enableArithAbort: true
  },
  pool: {
    max: 15,
    min: 2,
    idleTimeoutMillis: 30000
  }
};

let poolPromise;

// Returns the connection pool promise, creating it if it doesn't exist
export function getPool() {
  if (!poolPromise) {
    poolPromise = new mssql.ConnectionPool(config)
      .connect()
      .then(pool => {
        console.log('Connected to MS SQL Server connection pool.');
        return pool;
      })
      .catch(err => {
        console.error('Database connection pool creation failed: ', err);
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
}

/**
 * Execute a parameterized query against MS SQL Server.
 * Never concatenates strings to protect against SQL Injection.
 * @param {string} sql - The SQL statement.
 * @param {Object} params - The parameter name-value pairs (e.g. { name: 'value' }).
 * @returns {Promise<mssql.IResult<any>>}
 */
export async function query(sql, params = {}) {
  try {
    const pool = await getPool();
    const request = pool.request();
    
    // Bind parameters dynamically
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) {
        request.input(key, mssql.Variant, null);
      } else {
        request.input(key, value);
      }
    }
    
    const result = await request.query(sql);
    return result;
  } catch (err) {
    console.error('SQL Execution Error:', err.message);
    console.error('Query:', sql);
    // Mask raw database errors from being sent to client directly (handled in server.js)
    throw new Error('Database query execution failed.');
  }
}

/**
 * Execute a transaction containing multiple operations.
 * @param {function(mssql.Transaction): Promise<any>} callback - A callback that accepts the transaction object.
 */
export async function runInTransaction(callback) {
  const pool = await getPool();
  const transaction = new mssql.Transaction(pool);
  try {
    await transaction.begin();
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (err) {
    console.error('Transaction failed, rolling back:', err);
    try {
      await transaction.rollback();
    } catch (rollbackErr) {
      console.error('Failed to rollback transaction:', rollbackErr);
    }
    throw err;
  }
}

export default {
  query,
  getPool,
  runInTransaction
};
