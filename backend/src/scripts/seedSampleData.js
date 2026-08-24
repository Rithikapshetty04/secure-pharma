require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../../models/User");
const Organization = require("../../models/Organization");
const License = require("../../models/License");
const Verification = require("../../models/Verification");
const Product = require("../../models/Product");
const Batch = require("../../models/Batch");
const SupplyChainEvent = require("../../models/SupplyChainEvent");
const AuditLog = require("../../models/AuditLog");
const Notification = require("../../models/Notification");
const BlockchainService = require("../services/blockchainService");

const seedSampleData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for complete production seed...");

    // 1. Super Admin
    let superAdminOrg = await Organization.findOne({ name: "Federal Drug Control Agency" });
    if (!superAdminOrg) {
      superAdminOrg = await Organization.create({
        name: "Federal Drug Control Agency",
        type: "REGULATOR",
        address: "10903 New Hampshire Ave, Silver Spring MD",
        contactEmail: "superadmin@securepharma.gov",
        contactPhone: "+1 (800) 555-0199",
        registrationNumber: "FED-REG-001",
        status: "APPROVED",
      });
    }

    let superAdmin = await User.findOne({ email: "superadmin@securepharma.gov" });
    if (!superAdmin) {
      superAdmin = await User.create({
        name: "Dr. Arthur Vance (Chief Regulator)",
        email: "superadmin@securepharma.gov",
        password: await bcrypt.hash("SuperAdmin@123456", 10),
        role: "SUPER_ADMIN",
        organization: superAdminOrg._id,
        accountStatus: "APPROVED",
      });
    }

    // Keep admin@securepharma.gov alias
    let adminUser = await User.findOne({ email: "admin@securepharma.gov" });
    if (!adminUser) {
      adminUser = await User.create({
        name: "Administrator",
        email: "admin@securepharma.gov",
        password: await bcrypt.hash("Admin@123456", 10),
        role: "SUPER_ADMIN",
        organization: superAdminOrg._id,
        accountStatus: "APPROVED",
      });
    }

    // 2. Field Regulator
    let regulatorOrg = await Organization.findOne({ name: "State Pharmaceutical Inspection Bureau" });
    if (!regulatorOrg) {
      regulatorOrg = await Organization.create({
        name: "State Pharmaceutical Inspection Bureau",
        type: "REGULATOR",
        address: "300 Capitol Ave, Sacramento CA",
        contactEmail: "regulator@securepharma.gov",
        contactPhone: "+1 (916) 555-0144",
        registrationNumber: "STATE-REG-042",
        status: "APPROVED",
      });
    }

    let regulatorUser = await User.findOne({ email: "regulator@securepharma.gov" });
    if (!regulatorUser) {
      regulatorUser = await User.create({
        name: "Inspector Marcus Hayes",
        email: "regulator@securepharma.gov",
        password: await bcrypt.hash("Regulator@123456", 10),
        role: "REGULATOR",
        organization: regulatorOrg._id,
        accountStatus: "APPROVED",
      });
    }

    // 3. Manufacturer (Apex BioPharma)
    let mfgOrg = await Organization.findOne({ name: "Apex BioPharma Inc." });
    if (!mfgOrg) {
      mfgOrg = await Organization.create({
        name: "Apex BioPharma Inc.",
        type: "MANUFACTURER",
        address: "700 Technology Square, Cambridge MA",
        contactEmail: "mfg@apexbiopharma.com",
        contactPhone: "+1 (617) 555-0182",
        registrationNumber: "MA-CORP-98821",
        status: "APPROVED",
      });
    }

    let mfgLicense = await License.findOne({ licenseNumber: "MFG-FDA-99201" });
    if (!mfgLicense) {
      mfgLicense = await License.create({
        organization: mfgOrg._id,
        licenseNumber: "MFG-FDA-99201",
        licenseType: "MANUFACTURING",
        issuingAuthority: "Federal Drug Control Agency",
        issueDate: new Date("2024-01-15"),
        expiryDate: new Date("2028-01-15"),
        documentPath: "uploads/licenses/sample_mfg_license.pdf",
        documentHash: BlockchainService.generateDocumentHash("MFG-FDA-99201::ApexBioPharma"),
        verificationStatus: "APPROVED",
        verifiedBy: superAdmin._id,
        verifiedDate: new Date("2024-01-16"),
      });

      await Verification.create({
        license: mfgLicense._id,
        organization: mfgOrg._id,
        verificationType: "LICENSE_VERIFICATION",
        status: "APPROVED",
        verifiedBy: superAdmin._id,
        verificationDate: new Date("2024-01-16"),
        remarks: "Approved under cGMP standard inspection #9921.",
      });
    }

    let mfgUser = await User.findOne({ email: "mfg@apexbiopharma.com" });
    if (!mfgUser) {
      mfgUser = await User.create({
        name: "Dr. Elena Vance (Lead Production Chemist)",
        email: "mfg@apexbiopharma.com",
        password: await bcrypt.hash("Mfg@123456", 10),
        role: "MANUFACTURER",
        organization: mfgOrg._id,
        accountStatus: "APPROVED",
      });
    }

    // 4. Distributor (Nova Wholesale Logistics)
    let distOrg = await Organization.findOne({ name: "Nova Wholesale Logistics" });
    if (!distOrg) {
      distOrg = await Organization.create({
        name: "Nova Wholesale Logistics",
        type: "DISTRIBUTOR",
        address: "440 Logistics Pkwy, Chicago IL",
        contactEmail: "logistics@novalog.com",
        contactPhone: "+1 (312) 555-0177",
        registrationNumber: "IL-DIST-44012",
        status: "APPROVED",
      });
    }

    let distLicense = await License.findOne({ licenseNumber: "DIST-WHOLE-441" });
    if (!distLicense) {
      distLicense = await License.create({
        organization: distOrg._id,
        licenseNumber: "DIST-WHOLE-441",
        licenseType: "WHOLESALE",
        issuingAuthority: "Federal Drug Control Agency",
        issueDate: new Date("2024-02-01"),
        expiryDate: new Date("2027-02-01"),
        documentPath: "uploads/licenses/sample_dist_license.pdf",
        documentHash: BlockchainService.generateDocumentHash("DIST-WHOLE-441::NovaLogistics"),
        verificationStatus: "APPROVED",
        verifiedBy: superAdmin._id,
        verifiedDate: new Date("2024-02-02"),
      });

      await Verification.create({
        license: distLicense._id,
        organization: distOrg._id,
        verificationType: "LICENSE_VERIFICATION",
        status: "APPROVED",
        verifiedBy: superAdmin._id,
        verificationDate: new Date("2024-02-02"),
        remarks: "Good Distribution Practice (GDP) certification verified.",
      });
    }

    let distUser = await User.findOne({ email: "logistics@novalog.com" });
    if (!distUser) {
      distUser = await User.create({
        name: "Marcus Reid (Logistics Director)",
        email: "logistics@novalog.com",
        password: await bcrypt.hash("Dist@123456", 10),
        role: "DISTRIBUTOR",
        organization: distOrg._id,
        accountStatus: "APPROVED",
      });
    }

    // 5. Pharmacy (MedLife Central Pharmacy)
    let pharmOrg = await Organization.findOne({ name: "MedLife Central Pharmacy" });
    if (!pharmOrg) {
      pharmOrg = await Organization.create({
        name: "MedLife Central Pharmacy",
        type: "PHARMACY",
        address: "1200 Broadway Ave, New York NY",
        contactEmail: "care@medlifepharma.com",
        contactPhone: "+1 (212) 555-0155",
        registrationNumber: "NY-PHARM-88091",
        status: "APPROVED",
      });
    }

    let pharmLicense = await License.findOne({ licenseNumber: "PHARM-RETAIL-880" });
    if (!pharmLicense) {
      pharmLicense = await License.create({
        organization: pharmOrg._id,
        licenseNumber: "PHARM-RETAIL-880",
        licenseType: "PHARMACY",
        issuingAuthority: "New York State Board of Pharmacy",
        issueDate: new Date("2024-03-10"),
        expiryDate: new Date("2028-03-10"),
        documentPath: "uploads/licenses/sample_pharm_license.pdf",
        documentHash: BlockchainService.generateDocumentHash("PHARM-RETAIL-880::MedLife"),
        verificationStatus: "APPROVED",
        verifiedBy: superAdmin._id,
        verifiedDate: new Date("2024-03-11"),
      });

      await Verification.create({
        license: pharmLicense._id,
        organization: pharmOrg._id,
        verificationType: "LICENSE_VERIFICATION",
        status: "APPROVED",
        verifiedBy: superAdmin._id,
        verificationDate: new Date("2024-03-11"),
        remarks: "State Board of Pharmacy license active and in good standing.",
      });
    }

    let pharmUser = await User.findOne({ email: "care@medlifepharma.com" });
    if (!pharmUser) {
      pharmUser = await User.create({
        name: "PharmD. Chloe Bennett (Chief Pharmacist)",
        email: "care@medlifepharma.com",
        password: await bcrypt.hash("Pharm@123456", 10),
        role: "PHARMACY",
        organization: pharmOrg._id,
        accountStatus: "APPROVED",
      });
    }

    // 6. Products
    let product1 = await Product.findOne({ productCode: "AMOX-500MG" });
    if (!product1) {
      product1 = await Product.create({
        name: "Amoxicillin Trihydrate 500mg Capsules",
        genericName: "Amoxicillin",
        brandName: "AmoxApex",
        productCode: "AMOX-500MG",
        regulatoryApprovalNumber: "NDC-65123-401-10",
        manufacturer: mfgOrg._id,
        category: "Antibiotic / Anti-Infective",
        dosageForm: "Capsule",
        strength: "500mg",
        packageSize: "100 Capsules / Bottle",
        description: "Broad-spectrum bactericidal aminopenicillin for respiratory and systemic infections.",
        storageRequirements: "Store at 20°C to 25°C (68°F to 77°F). Excursions permitted between 15°C and 30°C.",
        status: "ACTIVE",
      });
    }

    let product2 = await Product.findOne({ productCode: "VAX-COV26-440" });
    if (!product2) {
      product2 = await Product.create({
        name: "BioShield mRNA Respiratory Vaccine",
        genericName: "mRNA-26 RSV/Flu Lipid Nanoparticle",
        brandName: "BioShield-Pro",
        productCode: "VAX-COV26-440",
        regulatoryApprovalNumber: "NDC-78901-002-05",
        manufacturer: mfgOrg._id,
        category: "Biological / Vaccine",
        dosageForm: "Injectable Suspension",
        strength: "50 mcg / 0.5 mL",
        packageSize: "10 Multi-Dose Vials / Box",
        description: "Next-generation multi-antigen mRNA formulation requiring cold chain integrity.",
        storageRequirements: "Ultra-cold storage between -80°C and -60°C. Thawed vials stable at 2°C to 8°C for 30 days.",
        status: "ACTIVE",
      });
    }

    // 7. Batches & QR Codes
    let batch1 = await Batch.findOne({ batchNumber: "BATCH-2026-TEST-001" });
    if (!batch1) {
      const qrId1 = "SP-BATCH-2026-TEST-001";
      const mfgDate1 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const expDate1 = new Date(Date.now() + 700 * 24 * 60 * 60 * 1000);

      const batchHash1 = BlockchainService.generateBatchHash({
        batchNumber: "BATCH-2026-TEST-001",
        productCode: product1.productCode,
        manufacturingDate: mfgDate1,
        expiryDate: expDate1,
        quantity: 15000,
        manufacturerId: mfgOrg._id,
      });

      batch1 = await Batch.create({
        batchNumber: "BATCH-2026-TEST-001",
        product: product1._id,
        manufacturer: mfgOrg._id,
        manufacturingDate: mfgDate1,
        expiryDate: expDate1,
        quantity: 15000,
        unit: "Bottles",
        status: "DELIVERED",
        storageRequirements: product1.storageRequirements,
        qrIdentifier: qrId1,
        batchHash: batchHash1,
      });

      // Events
      const tx1 = BlockchainService.generateSupplyChainEventHash({
        batchNumber: batch1.batchNumber,
        eventType: "MANUFACTURED",
        fromOrgId: mfgOrg._id,
        toOrgId: mfgOrg._id,
        location: "Cleanroom Facility #4, Cambridge MA",
        timestamp: mfgDate1,
      });

      const tx2 = BlockchainService.generateSupplyChainEventHash({
        batchNumber: batch1.batchNumber,
        eventType: "DISPATCHED",
        fromOrgId: mfgOrg._id,
        toOrgId: distOrg._id,
        location: "Apex BioPharma Logistics Terminal, MA",
        timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        previousHash: tx1,
      });

      const tx3 = BlockchainService.generateSupplyChainEventHash({
        batchNumber: batch1.batchNumber,
        eventType: "RECEIVED",
        fromOrgId: distOrg._id,
        toOrgId: distOrg._id,
        location: "Nova Central Distribution Hub, Chicago IL",
        timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        previousHash: tx2,
      });

      const tx4 = BlockchainService.generateSupplyChainEventHash({
        batchNumber: batch1.batchNumber,
        eventType: "DELIVERED",
        fromOrgId: distOrg._id,
        toOrgId: pharmOrg._id,
        location: "MedLife Central Pharmacy Dispensing Vault, New York NY",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        previousHash: tx3,
      });

      await SupplyChainEvent.create([
        {
          batch: batch1._id,
          eventType: "MANUFACTURED",
          fromOrganization: mfgOrg._id,
          toOrganization: mfgOrg._id,
          location: "Cleanroom Facility #4, Cambridge MA",
          user: mfgUser._id,
          quantity: 15000,
          notes: "Manufactured in compliance with cGMP Batch Record #8812.",
          uniqueEventId: "EVT-MFG-001",
          transactionHash: tx1,
          eventDate: mfgDate1,
        },
        {
          batch: batch1._id,
          eventType: "DISPATCHED",
          fromOrganization: mfgOrg._id,
          toOrganization: distOrg._id,
          location: "Apex BioPharma Logistics Terminal, MA",
          user: mfgUser._id,
          quantity: 15000,
          notes: "Dispatched via validated temperature-controlled cargo freight.",
          uniqueEventId: "EVT-DISP-002",
          transactionHash: tx2,
          eventDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        },
        {
          batch: batch1._id,
          eventType: "RECEIVED",
          fromOrganization: distOrg._id,
          toOrganization: distOrg._id,
          location: "Nova Central Distribution Hub, Chicago IL",
          user: distUser._id,
          quantity: 15000,
          notes: "Incoming pallet inspection passed. Cold chain logger confirmed 21.2°C.",
          uniqueEventId: "EVT-RECV-003",
          transactionHash: tx3,
          eventDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
        {
          batch: batch1._id,
          eventType: "DELIVERED",
          fromOrganization: distOrg._id,
          toOrganization: pharmOrg._id,
          location: "MedLife Central Pharmacy Dispensing Vault, New York NY",
          user: pharmUser._id,
          quantity: 15000,
          notes: "Received and stored in secured pharmacy storage vault. Ready for dispensing.",
          uniqueEventId: "EVT-DELV-004",
          transactionHash: tx4,
          eventDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ]);
    }

    // 8. Notifications
    await Notification.create([
      {
        recipientRole: "REGULATOR",
        type: "LICENSE_SUBMITTED",
        title: "License Verified",
        message: "Apex BioPharma manufacturing license renewal successfully verified.",
        isRead: false,
      },
      {
        recipientRole: "PHARMACY",
        type: "BATCH_RECEIVED",
        title: "Shipment Delivered",
        message: "Batch #BATCH-2026-TEST-001 (Amoxicillin 500mg) received at pharmacy vault.",
        isRead: false,
      },
      {
        recipientRole: "ALL",
        type: "GENERAL",
        title: "Platform Security Notice",
        message: "Secure Pharma 21 CFR Part 11 Compliance & Audit Ledger is active.",
        isRead: false,
      },
    ]);

    // 9. Audit Logs
    await AuditLog.create([
      {
        user: superAdmin._id,
        organization: superAdminOrg._id,
        action: "SYSTEM_INITIALIZED",
        entityType: "System",
        details: "Secure Pharma Enterprise Regulatory Platform initialized.",
        ipAddress: "127.0.0.1",
      },
    ]);

    console.log("Full production seed completed successfully!");
    console.log("Accounts created:");
    console.log("1. Super Admin:  superadmin@securepharma.gov / SuperAdmin@123456");
    console.log("2. Regulator:    regulator@securepharma.gov  / Regulator@123456");
    console.log("3. Manufacturer: mfg@apexbiopharma.com        / Mfg@123456");
    console.log("4. Distributor:  logistics@novalog.com       / Dist@123456");
    console.log("5. Pharmacy:     care@medlifepharma.com      / Pharm@123456");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Seeding error:", error.message);
    process.exit(1);
  }
};

seedSampleData();
