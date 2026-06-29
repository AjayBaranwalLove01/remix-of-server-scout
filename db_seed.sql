-- Seed MASTERLocations
INSERT INTO dbo.MASTERLocations (Description, State, Site_Type, Status) VALUES
('Sydney DC1 — Rack A14', 'NSW', 'Data Center', 'Active'),
('Sydney DC1 — Rack A15', 'NSW', 'Data Center', 'Active'),
('Sydney DC2 — Rack B07', 'NSW', 'Data Center', 'Active'),
('Sydney DC1 — Rack C03', 'NSW', 'Data Center', 'Active'),
('Sydney DC1 — Rack A16', 'NSW', 'Data Center', 'Active'),
('Sydney DC1 — Rack A02', 'NSW', 'Data Center', 'Active'),
('Sydney DC1 — DMZ Cage', 'NSW', 'Data Center', 'Active'),
('Sydney DC2 — Rack B11', 'NSW', 'Data Center', 'Active'),
('Sydney DC2 — Rack C09', 'NSW', 'Data Center', 'Active'),
('Sydney DC1 — Rack A19', 'NSW', 'Data Center', 'Active'),
('Melbourne DC1 — Rack F04', 'VIC', 'Data Center', 'Active'),
('Brisbane Office — Room 2', 'QLD', 'Branch Office', 'Active');

-- Seed MASTEROS
INSERT INTO dbo.MASTEROS (OSName, OSSupportEnds, Status) VALUES
('Windows Server 2022', '2031-10-14', 'Active'),
('Windows Server 2019', '2029-01-09', 'Active'),
('Windows Server 2016', '2027-01-12', 'Active'),
('Windows Server 2012 R2', '2023-10-10', 'Active');

-- Seed SupportGroups
INSERT INTO dbo.SupportGroups (ID, Name, Manager, Members) VALUES
('sg-infra', 'Infrastructure Operations', 'Sarah Whitman', '["Liam Chen", "Priya Kapoor", "Marcus Reed", "Hana Suzuki", "Diego Alvarez"]'),
('sg-security', 'Security & Compliance', 'Jonas Becker', '["Amira Khan", "Ravi Subramanian", "Elena Petrov", "Tom Whitley"]'),
('sg-database', 'Database Engineering', 'Olivia Martens', '["Wei Zhang", "Noah Fitzgerald", "Yara Haddad", "Felix Bauer"]'),
('sg-network', 'Network & Connectivity', 'Daniel Okafor', '["Mei Lin", "Carlos Vega", "Anya Sokolov", "Ben Hartman"]'),
('sg-app', 'Application Support', 'Rachel Goldberg', '["Theo Russo", "Sana Iqbal", "Kenji Watanabe", "Lara Novak", "Owen Briggs"]');

-- Seed MasterRecords and xSummary for initial servers

-- Server 1
INSERT INTO dbo.MasterRecords (Servername, SerialNumber, ManagementIP, DNSIP, Model, OSName, OSSupportEnds, LocationID, domain, Description, Contact, ProjEng, primary_group_id, AffectedGroups, Status, VirtualGuest, Owner, recordtype, Decommissioned)
VALUES
('PRD-WEB-AU01', 'MXQ8421KZL', '10.42.1.11', '10.20.4.21', 'HPE ProLiant DL380 Gen10', 'Windows Server 2022', '2031-10-14', 1, 'corp.example.com', 'Front-end web server hosting customer portal behind load balancer.', 'Sarah Whitman', 'Marcus Reed', 'sg-infra', '[{"groupId":"sg-security","selectedMembers":["Amira Khan","Tom Whitley"]},{"groupId":"sg-app","selectedMembers":["Theo Russo"]}]', 'Active', 'No', 'Sarah Whitman', 'Server', 'No');

INSERT INTO dbo.xSummary (Servername, MaintenanceDay, MaintenanceTime, PatchSequence, MaintenanceWindowComment, PCIAsset, InternetFacing, SOCIAsset, Essential8, Priority, IsPatched, PatchCategory, patch_notes)
VALUES
('PRD-WEB-AU01', 'Saturday', '22:00', 'Wave 1', 'Quarterly window only.', 'Yes', 'Yes', 'Yes', 'ML2', 'High', 'Yes', 'Critical', 'October patch cycle complete. November pending.');


-- Server 2
INSERT INTO dbo.MasterRecords (Servername, SerialNumber, ManagementIP, DNSIP, Model, OSName, OSSupportEnds, LocationID, domain, Description, Contact, ProjEng, primary_group_id, AffectedGroups, Status, VirtualGuest, Owner, recordtype, Decommissioned)
VALUES
('PRD-DB-AU01', 'MXQ8422PMR', '10.42.1.12', '10.20.4.22', 'HPE ProLiant DL560 Gen10', 'Windows Server 2019', '2029-01-09', 2, 'corp.example.com', 'Primary node of Always-On availability group.', 'Olivia Martens', 'Noah Fitzgerald', 'sg-database', '[{"groupId":"sg-infra","selectedMembers":["Liam Chen"]}]', 'Active', 'No', 'Olivia Martens', 'Server', 'No');

INSERT INTO dbo.xSummary (Servername, MaintenanceDay, MaintenanceTime, PatchSequence, MaintenanceWindowComment, PCIAsset, InternetFacing, SOCIAsset, Essential8, Priority, IsPatched, PatchCategory, patch_notes)
VALUES
('PRD-DB-AU01', 'Sunday', '01:00', 'Wave 3', 'Always patch secondary first.', 'Yes', 'No', 'Yes', 'ML3', 'High', 'Yes', 'Critical', 'Cumulative update KB5039217 applied.');


-- Server 3
INSERT INTO dbo.MasterRecords (Servername, SerialNumber, ManagementIP, DNSIP, Model, OSName, OSSupportEnds, LocationID, domain, Description, Contact, ProjEng, primary_group_id, AffectedGroups, Status, VirtualGuest, Owner, recordtype, Decommissioned)
VALUES
('PRD-APP-AU02', 'MXQ8423JKM', '10.42.1.13', '10.20.5.31', 'Dell PowerEdge R750', 'Windows Server 2022', '2031-10-14', 3, 'corp.example.com', 'Hosts order-API microservices for retail channel.', 'Rachel Goldberg', 'Sana Iqbal', 'sg-app', '[{"groupId":"sg-infra","selectedMembers":["Marcus Reed"]}]', 'Maintenance', 'No', 'Rachel Goldberg', 'Server', 'No');

INSERT INTO dbo.xSummary (Servername, MaintenanceDay, MaintenanceTime, PatchSequence, MaintenanceWindowComment, PCIAsset, InternetFacing, SOCIAsset, Essential8, Priority, IsPatched, PatchCategory, patch_notes)
VALUES
('PRD-APP-AU02', 'Saturday', '23:00', 'Wave 2', 'In maintenance for memory upgrade.', 'Yes', 'No', 'Yes', 'ML2', 'High', 'No', 'Important', 'Holding patches until hardware change closes.');


-- Server 4
INSERT INTO dbo.MasterRecords (Servername, SerialNumber, ManagementIP, DNSIP, Model, OSName, OSSupportEnds, LocationID, domain, Description, Contact, ProjEng, primary_group_id, AffectedGroups, Status, VirtualGuest, Owner, recordtype, Decommissioned)
VALUES
('DEV-WEB-AU01', 'MXQ8424TBN', '10.42.2.11', '10.30.4.21', 'HPE ProLiant DL360 Gen10', 'Windows Server 2019', '2029-01-09', 4, 'dev.example.com', 'Dev sandbox for portal team.', 'Liam Chen', 'Marcus Reed', 'sg-infra', '[]', 'Active', 'No', 'Liam Chen', 'Server', 'No');

INSERT INTO dbo.xSummary (Servername, MaintenanceDay, MaintenanceTime, PatchSequence, MaintenanceWindowComment, PCIAsset, InternetFacing, SOCIAsset, Essential8, Priority, IsPatched, PatchCategory, patch_notes)
VALUES
('DEV-WEB-AU01', 'Wednesday', '20:00', 'Wave 4', 'Open patching window weekdays.', 'Yes', 'No', 'Yes', 'ML1', 'Low', 'Yes', 'Standard', 'Latest CU applied.');


-- Server 5
INSERT INTO dbo.MasterRecords (Servername, SerialNumber, ManagementIP, DNSIP, Model, OSName, OSSupportEnds, LocationID, domain, Description, Contact, ProjEng, primary_group_id, AffectedGroups, Status, VirtualGuest, Owner, recordtype, Decommissioned)
VALUES
('PRD-FILE-AU01', 'MXQ8425LWP', '10.42.1.14', '10.20.4.40', 'Dell PowerEdge R740xd', 'Windows Server 2016', '2027-01-12', 5, 'corp.example.com', 'DFS namespace host for HQ file shares.', 'Sarah Whitman', 'Priya Kapoor', 'sg-infra', '[{"groupId":"sg-security","selectedMembers":["Elena Petrov"]}]', 'Active', 'No', 'Sarah Whitman', 'Server', 'No');

INSERT INTO dbo.xSummary (Servername, MaintenanceDay, MaintenanceTime, PatchSequence, MaintenanceWindowComment, PCIAsset, InternetFacing, SOCIAsset, Essential8, Priority, IsPatched, PatchCategory, patch_notes)
VALUES
('PRD-FILE-AU01', 'Sunday', '02:00', 'Wave 5', 'Patch only after hours, large user base.', 'Yes', 'No', 'Yes', 'ML1', 'Medium', 'No', 'Important', 'Behind by 2 cycles. Schedule catch-up.');


-- Server 6
INSERT INTO dbo.MasterRecords (Servername, SerialNumber, ManagementIP, DNSIP, Model, OSName, OSSupportEnds, LocationID, domain, Description, Contact, ProjEng, primary_group_id, AffectedGroups, Status, VirtualGuest, Owner, recordtype, Decommissioned)
VALUES
('PRD-DC-AU01', 'MXQ8426QHV', '10.42.1.15', '10.20.1.10', 'HPE ProLiant DL360 Gen10', 'Windows Server 2022', '2031-10-14', 6, 'corp.example.com', 'Primary AD DS DC for corp domain.', 'Jonas Becker', 'Amira Khan', 'sg-security', '[{"groupId":"sg-infra","selectedMembers":["Sarah Whitman"]}]', 'Active', 'No', 'Jonas Becker', 'Server', 'No');

INSERT INTO dbo.xSummary (Servername, MaintenanceDay, MaintenanceTime, PatchSequence, MaintenanceWindowComment, PCIAsset, InternetFacing, SOCIAsset, Essential8, Priority, IsPatched, PatchCategory, patch_notes)
VALUES
('PRD-DC-AU01', 'Saturday', '21:00', 'Wave 1', 'Coordinated with secondary DC.', 'Yes', 'No', 'Yes', 'ML3', 'High', 'Yes', 'Critical', 'All current.');


-- Server 7
INSERT INTO dbo.MasterRecords (Servername, SerialNumber, ManagementIP, DNSIP, Model, OSName, OSSupportEnds, LocationID, domain, Description, Contact, ProjEng, primary_group_id, AffectedGroups, Status, VirtualGuest, Owner, recordtype, Decommissioned)
VALUES
('PRD-DMZ-AU01', 'MXQ8427RXC', '10.42.3.11', '203.0.113.21', 'Dell PowerEdge R650', 'Windows Server 2022', '2031-10-14', 7, 'dmz.example.com', 'Edge reverse proxy. Currently offline.', 'Daniel Okafor', 'Mei Lin', 'sg-network', '[{"groupId":"sg-security","selectedMembers":["Jonas Becker","Tom Whitley"]},{"groupId":"sg-infra","selectedMembers":["Sarah Whitman"]}]', 'Down', 'No', 'Daniel Okafor', 'Server', 'No');

INSERT INTO dbo.xSummary (Servername, MaintenanceDay, MaintenanceTime, PatchSequence, MaintenanceWindowComment, PCIAsset, InternetFacing, SOCIAsset, Essential8, Priority, IsPatched, PatchCategory, patch_notes)
VALUES
('PRD-DMZ-AU01', 'Friday', '23:30', 'Wave 1', 'Outage — investigation in progress.', 'Yes', 'Yes', 'Yes', 'ML2', 'High', 'No', 'Critical', 'Pending patch once back online.');


-- Server 8
INSERT INTO dbo.MasterRecords (Servername, SerialNumber, ManagementIP, DNSIP, Model, OSName, OSSupportEnds, LocationID, domain, Description, Contact, ProjEng, primary_group_id, AffectedGroups, Status, VirtualGuest, Owner, recordtype, Decommissioned)
VALUES
('PRD-MON-AU01', 'MXQ8428GYB', '10.42.1.16', '10.20.6.55', 'HPE ProLiant DL380 Gen10', 'Windows Server 2019', '2029-01-09', 8, 'corp.example.com', 'Hosts Splunk forwarder + telemetry agents.', 'Rachel Goldberg', 'Owen Briggs', 'sg-app', '[{"groupId":"sg-security","selectedMembers":["Ravi Subramanian"]}]', 'Active', 'No', 'Rachel Goldberg', 'Server', 'No');

INSERT INTO dbo.xSummary (Servername, MaintenanceDay, MaintenanceTime, PatchSequence, MaintenanceWindowComment, PCIAsset, InternetFacing, SOCIAsset, Essential8, Priority, IsPatched, PatchCategory, patch_notes)
VALUES
('PRD-MON-AU01', 'Sunday', '03:00', 'Wave 3', 'Avoid daytime patching.', 'Yes', 'No', 'Yes', 'ML2', 'Medium', 'Yes', 'Important', 'Disk usage trending up — review retention policy.');


-- Server 9
INSERT INTO dbo.MasterRecords (Servername, SerialNumber, ManagementIP, DNSIP, Model, OSName, OSSupportEnds, LocationID, domain, Description, Contact, ProjEng, primary_group_id, AffectedGroups, Status, VirtualGuest, Owner, recordtype, Decommissioned)
VALUES
('TST-APP-AU01', 'MXQ8429FVS', '10.42.4.11', '10.40.4.21', 'Dell PowerEdge R650', 'Windows Server 2022', '2031-10-14', 9, 'test.example.com', 'UAT environment for order-API releases.', 'Theo Russo', 'Sana Iqbal', 'sg-app', '[]', 'Active', 'No', 'Theo Russo', 'Server', 'No');

INSERT INTO dbo.xSummary (Servername, MaintenanceDay, MaintenanceTime, PatchSequence, MaintenanceWindowComment, PCIAsset, InternetFacing, SOCIAsset, Essential8, Priority, IsPatched, PatchCategory, patch_notes)
VALUES
('TST-APP-AU01', 'Tuesday', '19:00', 'Wave 4', 'Mirror of PRD-APP-AU02.', 'Yes', 'No', 'Yes', 'ML1', 'Low', 'Yes', 'Standard', 'Synced with prod patch level.');


-- Server 10
INSERT INTO dbo.MasterRecords (Servername, SerialNumber, ManagementIP, DNSIP, Model, OSName, OSSupportEnds, LocationID, domain, Description, Contact, ProjEng, primary_group_id, AffectedGroups, Status, VirtualGuest, Owner, recordtype, Decommissioned)
VALUES
('PRD-BACKUP-AU01', 'MXQ8430DKE', '10.42.1.17', '10.20.7.10', 'HPE Apollo 4200 Gen10', 'Windows Server 2019', '2029-01-09', 10, 'corp.example.com', 'Veeam B&R repository server, 360TB usable.', 'Olivia Martens', 'Felix Bauer', 'sg-database', '[{"groupId":"sg-infra","selectedMembers":["Hana Suzuki"]}]', 'Active', 'No', 'Olivia Martens', 'Server', 'No');

INSERT INTO dbo.xSummary (Servername, MaintenanceDay, MaintenanceTime, PatchSequence, MaintenanceWindowComment, PCIAsset, InternetFacing, SOCIAsset, Essential8, Priority, IsPatched, PatchCategory, patch_notes)
VALUES
('PRD-BACKUP-AU01', 'Sunday', '04:00', 'Wave 5', 'Pause jobs before patch.', 'Yes', 'No', 'Yes', 'ML2', 'Medium', 'Yes', 'Important', 'All current.');
