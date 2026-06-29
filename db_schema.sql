-- Create MASTERLocations table
IF OBJECT_ID('dbo.MASTERLocations', 'U') IS NOT NULL
    DROP TABLE dbo.MASTERLocations;

CREATE TABLE dbo.MASTERLocations
(
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Description VARCHAR(50) NOT NULL UNIQUE,
    Site_Type VARCHAR(50) NULL,
    State VARCHAR(5) NULL,
    Address VARCHAR(200) NULL,
    Contact VARCHAR(50) NULL,
    Contact_Phone VARCHAR(30) NULL,
    Switchboard VARCHAR(20) NULL,
    Notes VARCHAR(250) NULL,
    Status VARCHAR(15) NOT NULL DEFAULT 'Active'
);

-- Create MASTEROS table
IF OBJECT_ID('dbo.MASTEROS', 'U') IS NOT NULL
    DROP TABLE dbo.MASTEROS;

CREATE TABLE dbo.MASTEROS (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    OSName VARCHAR(100) NOT NULL UNIQUE,
    OSSupportEnds VARCHAR(50) NOT NULL DEFAULT '',
    Status VARCHAR(15) NOT NULL DEFAULT 'Active'
);

-- Create SupportGroups table
IF OBJECT_ID('dbo.SupportGroups', 'U') IS NOT NULL
    DROP TABLE dbo.SupportGroups;

CREATE TABLE dbo.SupportGroups (
    ID VARCHAR(50) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL UNIQUE,
    Manager VARCHAR(100) NOT NULL,
    Members NVARCHAR(MAX) NOT NULL DEFAULT '[]' -- JSON array of member names
);

-- Create MasterRecords table (General details)
IF OBJECT_ID('dbo.MasterRecords', 'U') IS NOT NULL
    DROP TABLE dbo.MasterRecords;

CREATE TABLE dbo.MasterRecords (
    sdbID INT IDENTITY(1,1) PRIMARY KEY,
    recordtype VARCHAR(50) NULL DEFAULT 'Server',
    Servername VARCHAR(100) NOT NULL UNIQUE,
    BuildName VARCHAR(100) NULL,
    SerialNumber VARCHAR(50) NULL,
    BuildDate VARCHAR(50) NULL,
    BuildEngineer VARCHAR(50) NULL,
    OSName VARCHAR(100) NULL,
    OSSP VARCHAR(50) NULL,
    OSSupportEnds VARCHAR(50) NULL,
    Model VARCHAR(100) NULL,
    CPUs VARCHAR(20) NULL,
    RAM VARCHAR(20) NULL,
    ManagementIP VARCHAR(50) NULL, -- Maps to ilo
    DNSIP VARCHAR(50) NULL,        -- Maps to ip_address / dnsip
    IPTest VARCHAR(50) NULL,
    IPAddresses VARCHAR(250) NULL,
    VirtualGuest VARCHAR(10) NULL DEFAULT 'No',
    Owner VARCHAR(100) NULL,
    ChangeApprover VARCHAR(100) NULL,
    Description VARCHAR(MAX) NULL, -- Maps to server_description
    Outage VARCHAR(50) NULL,
    Contact VARCHAR(100) NULL,     -- Maps to patch_contact
    PrimaryFunction VARCHAR(100) NULL,
    SecondaryFunction VARCHAR(100) NULL,
    BusinessFunction VARCHAR(100) NULL,
    Decommissioned VARCHAR(5) NULL DEFAULT 'No',
    Status VARCHAR(50) NULL DEFAULT 'Active',
    Zone VARCHAR(50) NULL,        -- Maps to network
    ProjEng VARCHAR(100) NULL,     -- Maps to design_engineer
    PrimaryAssigneeGroup VARCHAR(100) NULL,
    PrimaryAssigneeManagerName VARCHAR(100) NULL,
    AffectedGroups VARCHAR(MAX) NULL DEFAULT '[]', -- JSON string
    BusinessGroup VARCHAR(100) NULL,
    PrimaryAssigneeGroupEmail VARCHAR(100) NULL,
    
    -- Relations & custom fields
    LocationID INT NULL FOREIGN KEY REFERENCES dbo.MASTERLocations(ID),
    domain VARCHAR(100) NULL,      -- Maps to sdomain
    notes VARCHAR(MAX) NULL,
    software_installed_url VARCHAR(250) NULL,
    backup_details_url VARCHAR(250) NULL,
    primary_group_id VARCHAR(50) NULL REFERENCES dbo.SupportGroups(ID)
);

-- Create xSummary table (Summary details)
IF OBJECT_ID('dbo.xSummary', 'U') IS NOT NULL
    DROP TABLE dbo.xSummary;

CREATE TABLE dbo.xSummary (
    Servername VARCHAR(100) PRIMARY KEY REFERENCES dbo.MasterRecords(Servername) ON UPDATE CASCADE ON DELETE CASCADE,
    MaintenanceDay VARCHAR(50) NULL,
    MaintenanceTime VARCHAR(50) NULL,
    PatchSequence VARCHAR(50) NULL,
    MaintenanceWindowComment VARCHAR(250) NULL,
    PCIAsset VARCHAR(5) NULL DEFAULT 'No',
    InternetFacing VARCHAR(5) NULL DEFAULT 'No',
    SOCIAsset VARCHAR(5) NULL DEFAULT 'No',
    Essential8 VARCHAR(10) NULL DEFAULT 'ML0',
    Priority VARCHAR(20) NULL DEFAULT 'Medium',
    SummaryRecordUpdate DATETIME NULL DEFAULT GETDATE(),
    IsPatched VARCHAR(5) NULL DEFAULT 'No',
    CheckedKBName VARCHAR(100) NULL,
    KBCheckTime DATETIME NULL,
    PatchCategory VARCHAR(100) NULL,
    RecordUpdate DATETIME NULL DEFAULT GETDATE(),
    AddedDate DATETIME NULL DEFAULT GETDATE(),
    
    -- Telemetry & updates
    cpu_usage VARCHAR(50) NULL DEFAULT '',
    memory_usage VARCHAR(50) NULL DEFAULT '',
    disk_usage VARCHAR(50) NULL DEFAULT '',
    monitoring_summary VARCHAR(250) NULL DEFAULT '',
    last_scan_date VARCHAR(50) NULL DEFAULT '',
    uptime VARCHAR(50) NULL DEFAULT '',
    patch_summary VARCHAR(250) NULL DEFAULT '',
    last_collated VARCHAR(100) NULL DEFAULT '',
    patch_notes VARCHAR(MAX) NULL DEFAULT ''
);

-- Create DetailAllServers view
IF OBJECT_ID('dbo.DetailAllServers', 'V') IS NOT NULL
    DROP VIEW dbo.DetailAllServers;
GO

CREATE VIEW dbo.DetailAllServers AS
SELECT 
    mr.sdbID,
    mr.sdbID AS id,
    mr.recordtype,
    mr.Servername,
    mr.BuildName,
    mr.SerialNumber,
    mr.BuildDate,
    mr.BuildEngineer,
    mr.OSName,
    mr.OSSP,
    mr.OSSupportEnds,
    mr.Model,
    mr.CPUs,
    mr.RAM,
    mr.ManagementIP,
    mr.DNSIP,
    mr.IPTest,
    mr.IPAddresses,
    mr.VirtualGuest,
    mr.Owner,
    mr.ChangeApprover,
    mr.Description,
    mr.Outage,
    mr.Contact,
    mr.PrimaryFunction,
    mr.SecondaryFunction,
    mr.BusinessFunction,
    mr.Decommissioned,
    mr.Status,
    mr.Zone,
    mr.ProjEng,
    mr.PrimaryAssigneeGroup,
    mr.PrimaryAssigneeManagerName,
    mr.AffectedGroups,
    mr.BusinessGroup,
    mr.PrimaryAssigneeGroupEmail,
    
    -- Joined Location fields
    loc.Description AS LOCATIONNAME,
    loc.State AS LOCATIONSTATE,
    loc.Site_Type AS Site_Type,
    
    -- Extra fields from mr
    mr.LocationID,
    mr.domain,
    mr.notes,
    mr.software_installed_url,
    mr.backup_details_url,
    mr.primary_group_id,

    -- Summary fields from xs
    xs.MaintenanceDay,
    xs.MaintenanceTime,
    xs.PatchSequence,
    xs.MaintenanceWindowComment,
    xs.PCIAsset,
    xs.InternetFacing,
    xs.SOCIAsset,
    xs.Essential8,
    xs.Priority,
    xs.SummaryRecordUpdate,
    xs.IsPatched,
    xs.CheckedKBName,
    xs.KBCheckTime,
    xs.PatchCategory,
    xs.RecordUpdate,
    xs.AddedDate,
    xs.cpu_usage,
    xs.memory_usage,
    xs.disk_usage,
    xs.monitoring_summary,
    xs.last_scan_date,
    xs.uptime,
    xs.patch_summary,
    xs.last_collated,
    xs.patch_notes
FROM dbo.MasterRecords mr
LEFT JOIN dbo.xSummary xs ON mr.Servername = xs.Servername
LEFT JOIN dbo.MASTERLocations loc ON mr.LocationID = loc.ID;
GO

-- Create performance and unique indexes
CREATE UNIQUE INDEX idx_masterrecords_servername ON dbo.MasterRecords(Servername);
CREATE INDEX idx_masterrecords_managementip ON dbo.MasterRecords(ManagementIP);
CREATE INDEX idx_masterrecords_dnsip ON dbo.MasterRecords(DNSIP);
CREATE INDEX idx_masterrecords_status ON dbo.MasterRecords(Status);
CREATE INDEX idx_masterrecords_owner ON dbo.MasterRecords(Owner);
