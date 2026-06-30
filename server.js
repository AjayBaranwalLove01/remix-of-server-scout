import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper to log errors securely (not exposing SQL details to client)
function handleError(res, err, userMessage = 'An internal database error occurred.') {
  console.error('SERVER ERROR:', err);
  res.status(500).json({ error: userMessage });
}

function priorityToDb(p) {
  if (p === 1 || p === '1' || p === 'High') return 1;
  if (p === 3 || p === '3' || p === 'Low') return 3;
  return 2; // Default to 2 (Medium)
}

// ----------------------------------------------------
// 1. SERVERS ENDPOINTS (with Search, Filters, Sorting, Pagination)
// ----------------------------------------------------

app.get('/api/servers', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 6,
      search = '',
      sortBy = 'Servername',
      sortOrder = 'ASC',
      status = 'All',
      domain = 'All',
      state = 'All',
      location = 'All',
      siteType = 'All',
      owner = 'All',
      os = 'All',
      patchCategory = 'All',
      businessGroup = 'All',
      virtualGuest = 'All',
      internetFacing = 'All',
      pciAsset = 'All',
      sociAsset = 'All',
      priority = 'All',
      isPatched = 'All'
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limit = parseInt(pageSize, 10);
    const offset = (pageNum - 1) * limit;

    const conditions = [];
    const params = {};

    // Global Search
    if (search.trim()) {
      conditions.push(`(
        Servername LIKE @search OR
        BuildName LIKE @search OR
        SerialNumber LIKE @search OR
        Owner LIKE @search OR
        Description LIKE @search OR
        PrimaryFunction LIKE @search OR
        SecondaryFunction LIKE @search OR
        BusinessFunction LIKE @search OR
        LOCATIONSTATE LIKE @search OR
        LOCATIONNAME LIKE @search OR
        OSName LIKE @search OR
        BusinessGroup LIKE @search OR
        Contact LIKE @search OR
        ProjEng LIKE @search
      )`);
      params.search = `%${search.trim()}%`;
    }

    // Status Filter
    if (status !== 'All') {
      conditions.push('Status = @status');
      params.status = status;
    }

    // Domain Filter
    if (domain !== 'All') {
      conditions.push('domain = @domain');
      params.domain = domain;
    }

    // State Filter
    if (state !== 'All') {
      conditions.push('LOCATIONSTATE = @state');
      params.state = state;
    }

    // Location Filter
    if (location !== 'All') {
      conditions.push('LOCATIONNAME = @location');
      params.location = location;
    }

    // Site Type Filter
    if (siteType !== 'All') {
      conditions.push('Site_Type = @siteType');
      params.siteType = siteType;
    }

    // Owner Filter
    if (owner !== 'All') {
      conditions.push('Owner = @owner');
      params.owner = owner;
    }

    // OS Filter
    if (os !== 'All') {
      conditions.push('OSName = @os');
      params.os = os;
    }

    // Patch Category Filter
    if (patchCategory !== 'All') {
      conditions.push('PatchCategory = @patchCategory');
      params.patchCategory = patchCategory;
    }

    // Business Group Filter
    if (businessGroup !== 'All') {
      conditions.push('BusinessGroup = @businessGroup');
      params.businessGroup = businessGroup;
    }

    // Virtual Guest Filter
    if (virtualGuest !== 'All') {
      conditions.push('VirtualGuest = @virtualGuest');
      params.virtualGuest = virtualGuest;
    }

    // Internet Facing Filter
    if (internetFacing !== 'All') {
      conditions.push('InternetFacing = @internetFacing');
      params.internetFacing = internetFacing;
    }

    // PCI Asset Filter
    if (pciAsset !== 'All') {
      conditions.push('PCIAsset = @pciAsset');
      params.pciAsset = pciAsset;
    }

    // SOCI Asset Filter
    if (sociAsset !== 'All') {
      conditions.push('SOCIAsset = @sociAsset');
      params.sociAsset = sociAsset;
    }

    // Priority Filter
    if (priority !== 'All') {
      if (priority === 'High') {
        conditions.push('(Priority = 1 OR CAST(Priority AS VARCHAR(20)) = \'High\')');
      } else if (priority === 'Medium') {
        conditions.push('(Priority = 2 OR CAST(Priority AS VARCHAR(20)) = \'Medium\')');
      } else if (priority === 'Low') {
        conditions.push('(Priority = 3 OR CAST(Priority AS VARCHAR(20)) = \'Low\')');
      }
    }

    // Is Patched Filter
    if (isPatched !== 'All') {
      conditions.push('IsPatched = @isPatched');
      params.isPatched = isPatched;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Whitelist columns for sorting to prevent SQL injection
    const allowedSortColumns = [
      'sdbID', 'Servername', 'SerialNumber', 'ManagementIP', 'DNSIP', 'OSName', 'Status', 
      'LOCATIONNAME', 'Priority', 'RecordUpdate', 'AddedDate', 'IsPatched', 'domain', 'VirtualGuest'
    ];
    let sortByCol = 'Servername';
    if (allowedSortColumns.includes(sortBy)) {
      sortByCol = sortBy;
    }
    const orderDir = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Count query
    const countSql = `SELECT COUNT(*) AS total FROM dbo.DetailAllServers ${whereClause}`;
    const countResult = await db.query(countSql, params);
    const total = countResult.recordset[0].total;

    // Paginated list query
    params.offset = offset;
    params.limit = limit;
    const listSql = `
      SELECT * FROM dbo.DetailAllServers
      ${whereClause}
      ORDER BY ${sortByCol} ${orderDir}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
    const listResult = await db.query(listSql, params);

    res.json({
      servers: listResult.recordset,
      total
    });
  } catch (err) {
    handleError(res, err, 'Failed to fetch servers.');
  }
});

// Dynamic values for dropdown filters
app.get('/api/servers/filters', async (req, res) => {
  try {
    const states = await db.query('SELECT DISTINCT LOCATIONSTATE FROM dbo.DetailAllServers WHERE LOCATIONSTATE IS NOT NULL AND LOCATIONSTATE <> \'\' ORDER BY LOCATIONSTATE');
    const locations = await db.query('SELECT DISTINCT LOCATIONNAME FROM dbo.DetailAllServers WHERE LOCATIONNAME IS NOT NULL AND LOCATIONNAME <> \'\' ORDER BY LOCATIONNAME');
    const owners = await db.query('SELECT DISTINCT Owner FROM dbo.DetailAllServers WHERE Owner IS NOT NULL AND Owner <> \'\' ORDER BY Owner');
    const oss = await db.query('SELECT DISTINCT OSName FROM dbo.DetailAllServers WHERE OSName IS NOT NULL AND OSName <> \'\' ORDER BY OSName');
    const domains = await db.query('SELECT DISTINCT sDomain FROM dbo.DetailAllServers WHERE sDomain IS NOT NULL AND sDomain <> \'\' ORDER BY sDomain');
    const groups = await db.query('SELECT DISTINCT BusinessGroup FROM dbo.DetailAllServers WHERE BusinessGroup IS NOT NULL AND BusinessGroup <> \'\' ORDER BY BusinessGroup');

    res.json({
      states: states.recordset.map(r => r.LOCATIONSTATE),
      locations: locations.recordset.map(r => r.LOCATIONNAME),
      owners: owners.recordset.map(r => r.Owner),
      oss: oss.recordset.map(r => r.OSName),
      domains: domains.recordset.map(r => r.sDomain),
      businessGroups: groups.recordset.map(r => r.BusinessGroup)
    });
  } catch (err) {
    handleError(res, err, 'Failed to fetch filters metadata.');
  }
});

app.get('/api/servers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM dbo.DetailAllServers WHERE sdbID = @id', { id });
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    handleError(res, err, 'Failed to fetch server record.');
  }
});

app.post('/api/servers', async (req, res) => {
  try {
    const data = req.body;
    let servername = data.servername ? data.servername.trim() : '';
    if (!servername) {
      // Generate standard placeholder
      let candidate = 'NEW-SERVER';
      const check = await db.query('SELECT COUNT(*) AS count FROM dbo.MasterRecords WHERE Servername = @candidate', { candidate });
      let i = 1;
      while (check.recordset[0].count > 0) {
        candidate = `NEW-SERVER-${i++}`;
        const recheck = await db.query('SELECT COUNT(*) AS count FROM dbo.MasterRecords WHERE Servername = @candidate', { candidate });
        if (recheck.recordset[0].count === 0) break;
      }
      servername = candidate;
    }

    // Location ID lookup
    let locationId = null;
    if (data.location) {
      const locRes = await db.query('SELECT ID FROM dbo.MASTERLocations WHERE Description = @desc', { desc: data.location });
      if (locRes.recordset.length > 0) {
        locationId = locRes.recordset[0].ID;
      }
    }

    const result = await db.runInTransaction(async (tx) => {
      // 1. Insert into MasterRecords
      const mrRequest = tx.request();
      mrRequest.input('recordtype', data.recordtype || 'Server');
      mrRequest.input('Servername', servername);
      mrRequest.input('BuildName', data.BuildName || '');
      mrRequest.input('SerialNumber', data.serialnumber || '');
      mrRequest.input('BuildDate', data.buildDate || '');
      mrRequest.input('BuildEngineer', data.buildEngineer || '');
      mrRequest.input('OSName', data.os || '');
      mrRequest.input('OSSupportEnds', data.osSupportEnds || '');
      mrRequest.input('Model', data.model || '');
      mrRequest.input('ManagementIP', data.ilo || '');
      mrRequest.input('DNSIP', data.dnsip || '');
      mrRequest.input('LocationID', locationId);
      mrRequest.input('sDomain', data.sdomain || '');
      mrRequest.input('zone', data.network || '');

      const mrSql = `
        INSERT INTO dbo.MasterRecords 
        (recordtype, Servername, BuildName, SerialNumber, BuildDate, BuildEngineer, OSName, OSSupportEnds, Model, ManagementIP, DNSIP, LocationID, sDomain, zone)
        VALUES
        (@recordtype, @Servername, @BuildName, @SerialNumber, @BuildDate, @BuildEngineer, @OSName, @OSSupportEnds, @Model, @ManagementIP, @DNSIP, @LocationID, @sDomain, @zone);
        SELECT SCOPE_IDENTITY() AS sdbID;
      `;
      const mrResult = await mrRequest.query(mrSql);
      const sdbID = mrResult.recordset[0].sdbID;

      // 2. Insert into xSummary
      const xsRequest = tx.request();
      xsRequest.input('Servername', servername);
      xsRequest.input('MaintenanceDayNew', data.day || 'Sunday');
      xsRequest.input('MaintenanceTimeNew', data.time || '00:00:00');
      xsRequest.input('PatchSequence', data.patchSequence || '');
      xsRequest.input('MaintenanceWindowComment', data.maintenanceComment || '');
      xsRequest.input('PCIAsset', data.pciAsset || 'No');
      xsRequest.input('InternetFacing', data.internetFacing || 'No');
      xsRequest.input('SOCIAsset', data.sociAsset || 'No');
      xsRequest.input('Essential8', data.essential8 || 'No');
      xsRequest.input('Priority', priorityToDb(data.priority || 'Medium'));
      xsRequest.input('IsPatched', data.isPatched || 'No');
      xsRequest.input('PatchCategory', data.patchCategory || 'Green');
      xsRequest.input('patchcomment', data.patchNotes || '');
      xsRequest.input('VirtualGuest', data.VirtualGuest || 'No');
      xsRequest.input('Owner', data.Owner || '');
      xsRequest.input('ChangeApprover', data.ChangeApprover || '');
      xsRequest.input('Description', data.serverDescription || '');
      xsRequest.input('Contact', data.patchContact || '');
      xsRequest.input('PrimaryFunction', data.PrimaryFunction || '');
      xsRequest.input('SecondaryFunction', data.SecondaryFunction || '');
      xsRequest.input('BusinessFunction', data.businessFunction || '');
      xsRequest.input('Decommissioned', data.Decommissioned || 'No');
      xsRequest.input('Status', data.status || 'Active');
      xsRequest.input('projeng', data.designEngineer || '');
      xsRequest.input('PrimaryAssigneeGroup', data.PrimaryAssigneeGroup || '');
      xsRequest.input('PrimaryAssigneeManagerName', data.PrimaryAssigneeManagerName || '');
      xsRequest.input('AffectedGroups', JSON.stringify(data.affectedGroups || []));
      xsRequest.input('BusinessGroup', data.BusinessGroup || '');
      xsRequest.input('PrimaryAssigneeGroupEmail', data.PrimaryAssigneeGroupEmail || '');

      const xsSql = `
        INSERT INTO dbo.xSummary 
        (Servername, MaintenanceDayNew, MaintenanceTimeNew, PatchSequence, MaintenanceWindowComment, PCIAsset, InternetFacing, SOCIAsset, Essential8, Priority, IsPatched, PatchCategory, patchcomment, VirtualGuest, Owner, ChangeApprover, Description, Contact, PrimaryFunction, SecondaryFunction, BusinessFunction, Decommissioned, Status, projeng, PrimaryAssigneeGroup, PrimaryAssigneeManagerName, AffectedGroups, BusinessGroup, PrimaryAssigneeGroupEmail)
        VALUES
        (@Servername, @MaintenanceDayNew, @MaintenanceTimeNew, @PatchSequence, @MaintenanceWindowComment, @PCIAsset, @InternetFacing, @SOCIAsset, @Essential8, @Priority, @IsPatched, @PatchCategory, @patchcomment, @VirtualGuest, @Owner, @ChangeApprover, @Description, @Contact, @PrimaryFunction, @SecondaryFunction, @BusinessFunction, @Decommissioned, @Status, @projeng, @PrimaryAssigneeGroup, @PrimaryAssigneeManagerName, @AffectedGroups, @BusinessGroup, @PrimaryAssigneeGroupEmail)
      `;
      await xsRequest.query(xsSql);

      return sdbID;
    });

    // Fetch newly created server view
    const newServer = await db.query('SELECT * FROM dbo.DetailAllServers WHERE sdbID = @sdbID', { sdbID: result });
    res.status(201).json(newServer.recordset[0]);
  } catch (err) {
    handleError(res, err, 'Failed to create server record.');
  }
});

app.put('/api/servers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Find current server
    const current = await db.query('SELECT Servername FROM dbo.MasterRecords WHERE sdbID = @id', { id });
    if (current.recordset.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }
    const oldServername = current.recordset[0].Servername;
    const newServername = data.servername ? data.servername.trim() : oldServername;

    // Location ID lookup
    let locationId = undefined;
    if (data.location !== undefined) {
      if (data.location) {
        const locRes = await db.query('SELECT ID FROM dbo.MASTERLocations WHERE Description = @desc', { desc: data.location });
        locationId = locRes.recordset.length > 0 ? locRes.recordset[0].ID : null;
      } else {
        locationId = null;
      }
    }

    await db.runInTransaction(async (tx) => {
      // 1. Update MasterRecords
      const mrRequest = tx.request();
      mrRequest.input('id', id);
      
      const mrFields = [];
      if (data.recordtype !== undefined) { mrRequest.input('recordtype', data.recordtype); mrFields.push('recordtype = @recordtype'); }
      if (data.servername !== undefined) { mrRequest.input('Servername', newServername); mrFields.push('Servername = @Servername'); }
      if (data.BuildName !== undefined) { mrRequest.input('BuildName', data.BuildName); mrFields.push('BuildName = @BuildName'); }
      if (data.serialnumber !== undefined) { mrRequest.input('SerialNumber', data.serialnumber); mrFields.push('SerialNumber = @SerialNumber'); }
      if (data.buildDate !== undefined) { mrRequest.input('BuildDate', data.buildDate); mrFields.push('BuildDate = @BuildDate'); }
      if (data.buildEngineer !== undefined) { mrRequest.input('BuildEngineer', data.buildEngineer); mrFields.push('BuildEngineer = @BuildEngineer'); }
      if (data.os !== undefined) { mrRequest.input('OSName', data.os); mrFields.push('OSName = @OSName'); }
      if (data.osSupportEnds !== undefined) { mrRequest.input('OSSupportEnds', data.osSupportEnds); mrFields.push('OSSupportEnds = @OSSupportEnds'); }
      if (data.model !== undefined) { mrRequest.input('Model', data.model); mrFields.push('Model = @Model'); }
      if (data.ilo !== undefined) { mrRequest.input('ManagementIP', data.ilo); mrFields.push('ManagementIP = @ManagementIP'); }
      if (data.dnsip !== undefined) { mrRequest.input('DNSIP', data.dnsip); mrFields.push('DNSIP = @DNSIP'); }
      if (locationId !== undefined) { mrRequest.input('LocationID', locationId); mrFields.push('LocationID = @LocationID'); }
      if (data.sdomain !== undefined) { mrRequest.input('sDomain', data.sdomain); mrFields.push('sDomain = @sDomain'); }
      if (data.network !== undefined) { mrRequest.input('zone', data.network); mrFields.push('zone = @zone'); }
      
      if (mrFields.length > 0) {
        const mrSql = `UPDATE dbo.MasterRecords SET ${mrFields.join(', ')} WHERE sdbID = @id`;
        await mrRequest.query(mrSql);
      }

      // 2. Update/Upsert xSummary (indexed by Servername)
      // Check if xSummary row exists
      const xsCheck = await tx.request().input('sname', newServername).query('SELECT COUNT(*) AS count FROM dbo.xSummary WHERE Servername = @sname');
      const hasXs = xsCheck.recordset[0].count > 0;

      const xsRequest = tx.request();
      xsRequest.input('sname', newServername);
      
      const xsFields = [];
      if (data.day !== undefined) { xsRequest.input('MaintenanceDayNew', data.day); xsFields.push('MaintenanceDayNew = @MaintenanceDayNew'); }
      if (data.time !== undefined) { xsRequest.input('MaintenanceTimeNew', data.time); xsFields.push('MaintenanceTimeNew = @MaintenanceTimeNew'); }
      if (data.patchSequence !== undefined) { xsRequest.input('PatchSequence', data.patchSequence); xsFields.push('PatchSequence = @PatchSequence'); }
      if (data.maintenanceComment !== undefined) { xsRequest.input('MaintenanceWindowComment', data.maintenanceComment); xsFields.push('MaintenanceWindowComment = @MaintenanceWindowComment'); }
      if (data.pciAsset !== undefined) { xsRequest.input('PCIAsset', data.pciAsset); xsFields.push('PCIAsset = @PCIAsset'); }
      if (data.internetFacing !== undefined) { xsRequest.input('InternetFacing', data.internetFacing); xsFields.push('InternetFacing = @InternetFacing'); }
      if (data.sociAsset !== undefined) { xsRequest.input('SOCIAsset', data.sociAsset); xsFields.push('SOCIAsset = @SOCIAsset'); }
      if (data.essential8 !== undefined) { xsRequest.input('Essential8', data.essential8); xsFields.push('Essential8 = @Essential8'); }
      if (data.priority !== undefined) { xsRequest.input('Priority', priorityToDb(data.priority)); xsFields.push('Priority = @Priority'); }
      if (data.isPatched !== undefined) { xsRequest.input('IsPatched', data.isPatched); xsFields.push('IsPatched = @IsPatched'); }
      if (data.patchCategory !== undefined) { xsRequest.input('PatchCategory', data.patchCategory); xsFields.push('PatchCategory = @PatchCategory'); }
      if (data.patchNotes !== undefined) { xsRequest.input('patchcomment', data.patchNotes); xsFields.push('patchcomment = @patchcomment'); }
      if (data.VirtualGuest !== undefined) { xsRequest.input('VirtualGuest', data.VirtualGuest); xsFields.push('VirtualGuest = @VirtualGuest'); }
      if (data.Owner !== undefined) { xsRequest.input('Owner', data.Owner); xsFields.push('Owner = @Owner'); }
      if (data.ChangeApprover !== undefined) { xsRequest.input('ChangeApprover', data.ChangeApprover); xsFields.push('ChangeApprover = @ChangeApprover'); }
      if (data.serverDescription !== undefined) { xsRequest.input('Description', data.serverDescription); xsFields.push('Description = @Description'); }
      if (data.patchContact !== undefined) { xsRequest.input('Contact', data.patchContact); xsFields.push('Contact = @Contact'); }
      if (data.PrimaryFunction !== undefined) { xsRequest.input('PrimaryFunction', data.PrimaryFunction); xsFields.push('PrimaryFunction = @PrimaryFunction'); }
      if (data.SecondaryFunction !== undefined) { xsRequest.input('SecondaryFunction', data.SecondaryFunction); xsFields.push('SecondaryFunction = @SecondaryFunction'); }
      if (data.businessFunction !== undefined) { xsRequest.input('BusinessFunction', data.businessFunction); xsFields.push('BusinessFunction = @BusinessFunction'); }
      if (data.Decommissioned !== undefined) { xsRequest.input('Decommissioned', data.Decommissioned); xsFields.push('Decommissioned = @Decommissioned'); }
      if (data.status !== undefined) { xsRequest.input('Status', data.status); xsFields.push('Status = @Status'); }
      if (data.designEngineer !== undefined) { xsRequest.input('projeng', data.designEngineer); xsFields.push('projeng = @projeng'); }
      if (data.PrimaryAssigneeGroup !== undefined) { xsRequest.input('PrimaryAssigneeGroup', data.PrimaryAssigneeGroup); xsFields.push('PrimaryAssigneeGroup = @PrimaryAssigneeGroup'); }
      if (data.PrimaryAssigneeManagerName !== undefined) { xsRequest.input('PrimaryAssigneeManagerName', data.PrimaryAssigneeManagerName); xsFields.push('PrimaryAssigneeManagerName = @PrimaryAssigneeManagerName'); }
      if (data.affectedGroups !== undefined) { xsRequest.input('AffectedGroups', JSON.stringify(data.affectedGroups || [])); xsFields.push('AffectedGroups = @AffectedGroups'); }
      if (data.BusinessGroup !== undefined) { xsRequest.input('BusinessGroup', data.BusinessGroup); xsFields.push('BusinessGroup = @BusinessGroup'); }
      if (data.PrimaryAssigneeGroupEmail !== undefined) { xsRequest.input('PrimaryAssigneeGroupEmail', data.PrimaryAssigneeGroupEmail); xsFields.push('PrimaryAssigneeGroupEmail = @PrimaryAssigneeGroupEmail'); }

      // Keep track of timestamps
      xsFields.push('RecordUpdate = GETDATE()');

      if (hasXs) {
        if (xsFields.length > 0) {
          const xsSql = `UPDATE dbo.xSummary SET ${xsFields.join(', ')} WHERE Servername = @sname`;
          await xsRequest.query(xsSql);
        }
      } else {
        // Insert empty/default summary row if missing
        const cols = ['Servername'];
        const vals = ['@sname'];
        for (const f of xsFields) {
          if (f.includes('RecordUpdate') || f.includes('SummaryRecordUpdate')) continue;
          const col = f.split(' = ')[0];
          cols.push(col);
          vals.push(`@${col}`);
        }
        const xsSql = `INSERT INTO dbo.xSummary (${cols.join(', ')}) VALUES (${vals.join(', ')})`;
        await xsRequest.query(xsSql);
      }
    });

    const updated = await db.query('SELECT * FROM dbo.DetailAllServers WHERE sdbID = @id', { id });
    res.json(updated.recordset[0]);
  } catch (err) {
    handleError(res, err, 'Failed to update server record.');
  }
});

app.delete('/api/servers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Deleting from MasterRecords cascades automatically to xSummary via FOREIGN KEY reference
    const check = await db.query('SELECT Servername FROM dbo.MasterRecords WHERE sdbID = @id', { id });
    if (check.recordset.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    await db.query('DELETE FROM dbo.MasterRecords WHERE sdbID = @id', { id });
    res.json({ success: true, message: `Server ${check.recordset[0].Servername} deleted successfully.` });
  } catch (err) {
    handleError(res, err, 'Failed to delete server record.');
  }
});

// ----------------------------------------------------
// 2. LOCATIONS ENDPOINTS
// ----------------------------------------------------

app.get('/api/locations', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM dbo.MASTERLocations ORDER BY Description');
    res.json(result.recordset);
  } catch (err) {
    handleError(res, err, 'Failed to fetch locations list.');
  }
});

app.post('/api/locations', async (req, res) => {
  try {
    const { location_name, status } = req.body;
    if (!location_name || !location_name.trim()) {
      return res.status(400).json({ error: 'Location name is required.' });
    }
    
    const check = await db.query('SELECT COUNT(*) AS count FROM dbo.MASTERLocations WHERE LOWER(Description) = LOWER(@desc)', { desc: location_name.trim() });
    if (check.recordset[0].count > 0) {
      return res.status(400).json({ error: 'Location already exists.' });
    }

    const insertRes = await db.query(`
      INSERT INTO dbo.MASTERLocations (Description, Status) 
      VALUES (@desc, @status);
      SELECT SCOPE_IDENTITY() AS ID;
    `, { desc: location_name.trim(), status: status || 'Active' });

    const newLoc = await db.query('SELECT * FROM dbo.MASTERLocations WHERE ID = @id', { id: insertRes.recordset[0].ID });
    res.status(201).json(newLoc.recordset[0]);
  } catch (err) {
    handleError(res, err, 'Failed to create location record.');
  }
});

app.put('/api/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { location_name, status } = req.body;

    const fields = [];
    const params = { id };
    if (location_name !== undefined) {
      if (!location_name.trim()) return res.status(400).json({ error: 'Location name is required.' });
      fields.push('Description = @desc');
      params.desc = location_name.trim();
    }
    if (status !== undefined) {
      fields.push('Status = @status');
      params.status = status;
    }

    if (fields.length > 0) {
      await db.query(`UPDATE dbo.MASTERLocations SET ${fields.join(', ')} WHERE ID = @id`, params);
    }

    const updated = await db.query('SELECT * FROM dbo.MASTERLocations WHERE ID = @id', { id });
    res.json(updated.recordset[0]);
  } catch (err) {
    handleError(res, err, 'Failed to update location.');
  }
});

app.delete('/api/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM dbo.MASTERLocations WHERE ID = @id', { id });
    res.json({ success: true });
  } catch (err) {
    handleError(res, err, 'Failed to delete location.');
  }
});

// ----------------------------------------------------
// 3. OS CATALOG ENDPOINTS
// ----------------------------------------------------

app.get('/api/os', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM dbo.MASTEROS ORDER BY OSName');
    res.json(result.recordset);
  } catch (err) {
    handleError(res, err, 'Failed to fetch OS catalog.');
  }
});

app.post('/api/os', async (req, res) => {
  try {
    const { os_name, os_support_end_date, status } = req.body;
    if (!os_name || !os_name.trim()) {
      return res.status(400).json({ error: 'OS name is required.' });
    }
    
    const check = await db.query('SELECT COUNT(*) AS count FROM dbo.MASTEROS WHERE LOWER(OSName) = LOWER(@os)', { os: os_name.trim() });
    if (check.recordset[0].count > 0) {
      return res.status(400).json({ error: 'OS already exists.' });
    }

    const insertRes = await db.query(`
      INSERT INTO dbo.MASTEROS (OSName, OSSupportEnds, Status) 
      VALUES (@os, @support, @status);
      SELECT SCOPE_IDENTITY() AS ID;
    `, { os: os_name.trim(), support: os_support_end_date || '', status: status || 'Active' });

    const newOs = await db.query('SELECT * FROM dbo.MASTEROS WHERE ID = @id', { id: insertRes.recordset[0].ID });
    res.status(201).json(newOs.recordset[0]);
  } catch (err) {
    handleError(res, err, 'Failed to add OS to catalog.');
  }
});

app.put('/api/os/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { os_name, os_support_end_date, status } = req.body;

    const fields = [];
    const params = { id };
    if (os_name !== undefined) {
      if (!os_name.trim()) return res.status(400).json({ error: 'OS name is required.' });
      fields.push('OSName = @os');
      params.os = os_name.trim();
    }
    if (os_support_end_date !== undefined) {
      fields.push('OSSupportEnds = @support');
      params.support = os_support_end_date;
    }
    if (status !== undefined) {
      fields.push('Status = @status');
      params.status = status;
    }

    if (fields.length > 0) {
      await db.query(`UPDATE dbo.MASTEROS SET ${fields.join(', ')} WHERE ID = @id`, params);
    }

    const updated = await db.query('SELECT * FROM dbo.MASTEROS WHERE ID = @id', { id });
    res.json(updated.recordset[0]);
  } catch (err) {
    handleError(res, err, 'Failed to update OS catalog item.');
  }
});

app.delete('/api/os/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM dbo.MASTEROS WHERE ID = @id', { id });
    res.json({ success: true });
  } catch (err) {
    handleError(res, err, 'Failed to delete OS catalog item.');
  }
});

// ----------------------------------------------------
// 4. SUPPORT GROUPS ENDPOINTS
// ----------------------------------------------------

app.get('/api/groups', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM dbo.support_groups ORDER BY name');
    // Parse JSON members array for frontend compatibility
    const groups = result.recordset.map(g => ({
      id: g.id,
      name: g.name,
      manager: g.manager,
      members: Array.isArray(g.members) ? g.members : (typeof g.members === 'string' ? JSON.parse(g.members || '[]') : [])
    }));
    res.json(groups);
  } catch (err) {
    handleError(res, err, 'Failed to fetch support groups.');
  }
});

// ----------------------------------------------------
// 5. DASHBOARD ENDPOINTS
// ----------------------------------------------------

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // 1. Get primary numeric totals and indicators
    const primaryCounts = await db.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN Status = 'Active' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN Status = 'Down' THEN 1 ELSE 0 END) AS down,
        SUM(CASE WHEN Status = 'Maintenance' THEN 1 ELSE 0 END) AS maintenance,
        SUM(CASE WHEN Decommissioned = 'Yes' OR Status = 'Decommissioned' THEN 1 ELSE 0 END) AS decommissioned,
        SUM(CASE WHEN IsPatched = 'Yes' THEN 1 ELSE 0 END) AS patched,
        SUM(CASE WHEN Priority = 1 OR CAST(Priority AS VARCHAR(20)) = 'High' THEN 1 ELSE 0 END) AS critical,
        SUM(CASE WHEN InternetFacing = 'Yes' THEN 1 ELSE 0 END) AS internetFacing,
        SUM(CASE WHEN PCIAsset = 'Yes' THEN 1 ELSE 0 END) AS pciAssets,
        SUM(CASE WHEN SOCIAsset = 'Yes' THEN 1 ELSE 0 END) AS sociAssets,
        SUM(CASE WHEN VirtualGuest = 'Yes' THEN 1 ELSE 0 END) AS virtualServers
      FROM dbo.DetailAllServers
    `);
    
    const counts = primaryCounts.recordset[0] || {};

    // 2. Fetch breakouts
    const states = await db.query(`
      SELECT COALESCE(LOCATIONSTATE, 'Unknown') AS label, COUNT(*) AS value 
      FROM dbo.DetailAllServers 
      GROUP BY LOCATIONSTATE
    `);
    
    const locations = await db.query(`
      SELECT COALESCE(LOCATIONNAME, 'Unknown') AS label, COUNT(*) AS value 
      FROM dbo.DetailAllServers 
      GROUP BY LOCATIONNAME
    `);
    
    const siteTypes = await db.query(`
      SELECT COALESCE(Site_Type, 'Unknown') AS label, COUNT(*) AS value 
      FROM dbo.DetailAllServers 
      GROUP BY Site_Type
    `);
    
    const oss = await db.query(`
      SELECT COALESCE(OSName, 'Unknown') AS label, COUNT(*) AS value 
      FROM dbo.DetailAllServers 
      GROUP BY OSName
    `);

    const owners = await db.query(`
      SELECT COALESCE(Owner, 'Unknown') AS label, COUNT(*) AS value 
      FROM dbo.DetailAllServers 
      GROUP BY Owner
    `);

    res.json({
      counts: {
        total: counts.total || 0,
        active: counts.active || 0,
        down: counts.down || 0,
        maintenance: counts.maintenance || 0,
        decommissioned: counts.decommissioned || 0,
        patched: counts.patched || 0,
        critical: counts.critical || 0,
        internetFacing: counts.internetFacing || 0,
        pciAssets: counts.pciAssets || 0,
        sociAssets: counts.sociAssets || 0,
        virtualServers: counts.virtualServers || 0,
        physicalServers: (counts.total || 0) - (counts.virtualServers || 0)
      },
      states: states.recordset,
      locations: locations.recordset,
      siteTypes: siteTypes.recordset,
      operatingSystems: oss.recordset,
      owners: owners.recordset
    });
  } catch (err) {
    handleError(res, err, 'Failed to fetch dashboard metrics.');
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve built static frontend files in production/offline
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route to serve the React application
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
    if (err) {
      res.status(404).send("Frontend assets not built. Run 'npm run build' on a machine with internet first.");
    }
  });
});

// Start listening and ensure schema integrity
app.listen(PORT, async () => {
  console.log(`Server is running in development mode on port ${PORT}`);
  try {
    // Self-healing database check: ensure MASTEROS table exists
    const checkOS = await db.query("SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'MASTEROS'");
    if (checkOS.recordset[0].count === 0) {
      console.log('dbo.MASTEROS table is missing. Creating table...');
      await db.query(`
        CREATE TABLE dbo.MASTEROS (
            ID INT IDENTITY(1,1) PRIMARY KEY,
            OSName VARCHAR(100) NOT NULL UNIQUE,
            OSSupportEnds VARCHAR(50) NOT NULL,
            Status VARCHAR(15) NOT NULL DEFAULT 'Active'
        )
      `);
      console.log('dbo.MASTEROS table created successfully.');
      
      await db.query(`
        INSERT INTO dbo.MASTEROS (OSName, OSSupportEnds, Status) VALUES
        ('Windows Server 2022', '2031-10-14 00:00:00', 'Active'),
        ('Windows Server 2019', '2029-01-09 00:00:00', 'Active'),
        ('Windows Server 2016 Std Ed', '2027-01-12 00:00:00', 'Active'),
        ('RHEL 8', '2029-05-31 00:00:00', 'Active'),
        ('RHEL 9', '2032-05-31 00:00:00', 'Active')
      `);
      console.log('dbo.MASTEROS seeded.');
    }
  } catch (err) {
    console.error('Self-healing database initialization failed:', err);
  }
});
