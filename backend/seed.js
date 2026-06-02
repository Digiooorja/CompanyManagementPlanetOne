const sequelize = require("./database");
const User = require("./models/User");
const Project = require("./models/Project");
const Activity = require("./models/Activity");
const Document = require("./models/Document");
const Risk = require("./models/Risk");
const Block = require("./models/Block");
const Workflow = require("./models/Workflow");
const Department = require("./models/Department");
const Finance = require("./models/Finance");
const Notification = require("./models/Notification");
const Register = require("./models/Register");
const Report = require("./models/Report");
const Comment = require("./models/Comment");
const bcrypt = require("bcryptjs");

// Define associations for accurate database constraint generation during force sync
Activity.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project'
});

Finance.belongsTo(Activity, {
  foreignKey: 'activityId',
  as: 'activity'
});

Activity.hasMany(Finance, {
  foreignKey: 'activityId',
  as: 'financeItems'
});

Project.hasMany(Activity, {
  foreignKey: 'projectId',
  as: 'activities'
});

Project.belongsTo(Block, {
  foreignKey: 'blockId',
  as: 'blockDetails'
});

Block.hasMany(Project, {
  foreignKey: 'blockId',
  as: 'projects'
});

User.belongsTo(Department, {
  foreignKey: 'departmentId',
  as: 'departmentDetails'
});

Department.hasMany(User, {
  foreignKey: 'departmentId',
  as: 'users'
});

Comment.belongsTo(Activity, {
  foreignKey: 'activityId',
  as: 'activity'
});

Activity.hasMany(Comment, {
  foreignKey: 'activityId',
  as: 'comments'
});

Comment.belongsTo(User, {
  foreignKey: 'userId',
  as: 'author'
});

User.hasMany(Comment, {
  foreignKey: 'userId',
  as: 'comments'
});

Comment.belongsTo(Department, {
  foreignKey: 'departmentId',
  as: 'department'
});

Department.hasMany(Comment, {
  foreignKey: 'departmentId',
  as: 'comments'
});

async function seedDatabase() {
  try {
    // Disable foreign key checks for clean force sync
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    // Sync database
    await sequelize.sync({ force: true });
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log("Database synced!");

    // 0. Create Departments
    const departments = await Department.bulkCreate([
      { id: 1, name: "Operations", description: "Core exploration and drilling operations" },
      { id: 2, name: "Finance", description: "Financial tracking and budget approvals" },
      { id: 3, name: "HSE", description: "Health, Safety, and Environment management" },
      { id: 4, name: "Engineering", description: "Infrastructure and pipeline design" },
      { id: 5, name: "Management", description: "Executive administration and governance" }
    ]);
    console.log("Departments created successfully!");

    // 1. Create Users
    const defaultPasswordHash = await bcrypt.hash("Password123!", 10);
    const users = await User.bulkCreate([
      {
        id: 1,
        username: "sarah_johnson",
        email: "sarah.johnson@company.com",
        password: defaultPasswordHash,
        firstName: "Sarah",
        lastName: "Johnson",
        role: "Manager",
        departmentId: 1 // Operations
      },
      {
        id: 2,
        username: "mike_chen",
        email: "mike.chen@company.com",
        password: defaultPasswordHash,
        firstName: "Mike",
        lastName: "Chen",
        role: "Manager",
        departmentId: 4 // Engineering
      },
      {
        id: 3,
        username: "emma_davis",
        email: "emma.davis@company.com",
        password: defaultPasswordHash,
        firstName: "Emma",
        lastName: "Davis",
        role: "User",
        departmentId: 2 // Finance
      },
      {
        id: 4,
        username: "john_wilson",
        email: "john.wilson@company.com",
        password: defaultPasswordHash,
        firstName: "John",
        lastName: "Wilson",
        role: "User",
        departmentId: 3 // HSE
      },
      {
        id: 5,
        username: "lisa_anderson",
        email: "lisa.anderson@company.com",
        password: defaultPasswordHash,
        firstName: "Lisa",
        lastName: "Anderson",
        role: "User",
        departmentId: 1 // Operations
      },
      {
        id: 6,
        username: "adarsh_pandey",
        email: "adarshpandey1927@gmail.com",
        password: defaultPasswordHash,
        firstName: "Adarsh",
        lastName: "Pandey",
        role: "Admin",
        departmentId: 5 // Management
      }
    ]);
    console.log("Users created successfully!");

    // 2. Create Blocks
    const blocks = await Block.bulkCreate([
      {
        id: 1,
        name: "Deep Water",
        description: "Large offshore deep water block with ongoing exploration and production operations.",
        status: "Active",
        licenceStart: "2024-01-05",
        licenceExpiry: "2034-01-04",
        operator: "BlueOcean Energy",
        workingInterest: "42%",
        area: "3,100 sq km",
        location: "North Sea Deep Water"
      },
      {
        id: 2,
        name: "Shallow Water",
        description: "Nearshore shallow water block with survey and development phase activities.",
        status: "Active",
        licenceStart: "2025-05-10",
        licenceExpiry: "2030-05-09",
        operator: "Coastal Energy",
        workingInterest: "35%",
        area: "1,900 sq km",
        location: "Gulf of Mexico Coastal"
      },
      {
        id: 3,
        name: "On Shore",
        description: "Onshore block focused on pipeline infrastructure and field development.",
        status: "Active",
        licenceStart: "2024-09-15",
        licenceExpiry: "2029-09-14",
        operator: "TerraField Resources",
        workingInterest: "28%",
        area: "4,200 sq km",
        location: "Permian Basin"
      }
    ]);
    console.log("Blocks created successfully!");

    // 3. Create Projects
    const projects = await Project.bulkCreate([
      {
        id: 1,
        name: "DWTCP Deep Water",
        blockId: blocks[0].id,
        block: "Deep Water",
        status: "Active",
        startDate: "2026-03-01",
        endDate: "2026-12-31",
        budget: 15000000,
        spent: 11250000,
        completion: 75,
        manager: "Sarah Johnson",
        description: "Development and completion of exploration well A-1 including drilling, casing, and initial production testing."
      },
      {
        id: 2,
        name: "Shallow Water",
        blockId: blocks[1].id,
        block: "Shallow Water",
        status: "Completed",
        startDate: "2024-11-15",
        endDate: "2025-03-20",
        budget: 3500000,
        spent: 3480000,
        completion: 100,
        manager: "Mike Chen",
        description: "Phase 2 seismic survey operations in shallow water areas."
      },
      {
        id: 3,
        name: "Onshore",
        blockId: blocks[2].id,
        block: "On Shore",
        status: "Planning",
        startDate: "2026-07-01",
        endDate: "2027-02-28",
        budget: 18000000,
        spent: 2700000,
        completion: 15,
        manager: "Emma Davis",
        description: "Onshore drilling operations for exploration and development."
      },
      {
        id: 4,
        name: "Pipeline Construction",
        blockId: blocks[2].id,
        block: "On Shore",
        status: "Active",
        startDate: "2025-06-15",
        endDate: "2026-06-30",
        budget: 25000000,
        spent: 8750000,
        completion: 35,
        manager: "John Wilson",
        description: "Pipeline construction and installation project for crude oil transport."
      },
      {
        id: 5,
        name: "Facility Upgrade",
        blockId: blocks[0].id,
        block: "Deep Water",
        status: "In Progress",
        startDate: "2025-09-01",
        endDate: "2026-03-31",
        budget: 12000000,
        spent: 6000000,
        completion: 50,
        manager: "Lisa Anderson",
        description: "Upgrade and modernization of production facilities and infrastructure."
      }
    ]);
    console.log("Projects created successfully!");

    // 4. Create initial workflows
    const workflows = await Workflow.bulkCreate([
      {
        id: 1,
        title: "AFE Amendment - Block A",
        type: "Finance Approval",
        submittedBy: "Sarah Johnson",
        submitDate: "2026-04-30",
        currentStep: "Executive Approval",
        status: "Awaiting Action",
        priority: "High",
        dueDate: "2026-05-05",
        description: "Request for AFE amendment to increase budget allocation for Onshore drilling operations due to unexpected geological conditions.",
        amount: 5200000,
        steps: [
          { step: "Submitted", status: "Completed", date: "2026-04-30 14:30", user: "Sarah Johnson", action: "Submitted for approval", comment: null },
          { step: "Manager Review", status: "Completed", date: "2026-04-30 16:45", user: "Mike Chen", action: "Approved", comment: "Reviewed and approved. Budget justification is sound." },
          { step: "Finance Review", status: "Completed", date: "2026-05-01 10:15", user: "Emma Davis", action: "Approved", comment: "Financial analysis completed. Funds available." },
          { step: "Executive Approval", status: "Pending", date: null, user: "John Smith", action: null, comment: null },
          { step: "Final Processing", status: "Not Started", date: null, user: "System", action: null, comment: null }
        ]
      },
      {
        id: 2,
        title: "Drilling Contract Review",
        type: "Contract Approval",
        submittedBy: "Mike Chen",
        submitDate: "2026-04-29",
        currentStep: "Legal Review",
        status: "In Progress",
        priority: "High",
        dueDate: "2026-05-06",
        description: "Review of drilling contract terms and vendor compliance before execution.",
        amount: 12000000,
        steps: [
          { step: "Submitted", status: "Completed", date: "2026-04-29 09:00", user: "Mike Chen", action: "Submitted for approval", comment: null },
          { step: "Legal Review", status: "In Progress", date: "2026-04-29 14:30", user: "Legal Team", action: null, comment: null }
        ]
      },
      {
        id: 3,
        title: "HSE Incident Report",
        type: "HSE Review",
        submittedBy: "Emma Davis",
        submitDate: "2026-04-28",
        currentStep: "Management Acknowledgment",
        status: "Awaiting Action",
        priority: "Critical",
        dueDate: "2026-05-02",
        description: "Incident report requiring HSE approval and management sign-off.",
        amount: 0,
        steps: [
          { step: "Submitted", status: "Completed", date: "2026-04-28 11:20", user: "Emma Davis", action: "Submitted for approval", comment: null },
          { step: "HSE Review", status: "Completed", date: "2026-04-28 16:00", user: "HSE Team", action: "Approved", comment: "HSE review complete." },
          { step: "Management Acknowledgment", status: "Pending", date: null, user: "Management", action: null, comment: null }
        ]
      },
      {
        id: 4,
        title: "Environmental Permit Renewal",
        type: "Regulatory Approval",
        submittedBy: "James Wilson",
        submitDate: "2026-04-27",
        currentStep: "Internal Review",
        status: "In Progress",
        priority: "Medium",
        dueDate: "2026-05-10",
        description: "Permit renewal application for environmental approvals and regulatory compliance.",
        amount: 0,
        steps: [
          { step: "Submitted", status: "Completed", date: "2026-04-27 08:30", user: "James Wilson", action: "Submitted for approval", comment: null },
          { step: "Internal Review", status: "In Progress", date: "2026-04-28 10:00", user: "Internal Team", action: null, comment: null }
        ]
      },
      {
        id: 5,
        title: "Well Completion Report",
        type: "Technical Review",
        submittedBy: "Lisa Brown",
        submitDate: "2026-04-25",
        currentStep: "Completed",
        status: "Approved",
        priority: "Medium",
        dueDate: "2026-05-01",
        description: "Final technical report for well completion and operations handover.",
        amount: 0,
        steps: [
          { step: "Submitted", status: "Completed", date: "2026-04-25 15:10", user: "Lisa Brown", action: "Submitted for approval", comment: null },
          { step: "Technical Review", status: "Completed", date: "2026-04-26 10:30", user: "Technical Team", action: "Approved", comment: "No issues found." },
          { step: "Completed", status: "Completed", date: "2026-05-01 09:45", user: "Operations", action: "Finalized", comment: "Report complete." }
        ]
      }
    ]);
    console.log("Workflows created successfully!");

    // 3. Create Activities with new fields
    const activities = await Activity.bulkCreate([
      // Project 1 Activities
      {
        id: 1,
        projectId: 1,
        name: "Site Preparation",
        status: "Completed",
        assignedTo: "Mike Chen",
        progress: 100,
        plannedStartDate: "2026-03-01",
        plannedEndDate: "2026-04-15",
        actualStartDate: "2026-03-01",
        actualEndDate: "2026-04-12",
        plannedCost: 500000,
        actualCost: 475000
      },
      {
        id: 2,
        projectId: 1,
        name: "Well Drilling",
        status: "Active",
        assignedTo: "Sarah Johnson",
        progress: 65,
        plannedStartDate: "2026-04-16",
        plannedEndDate: "2026-09-30",
        actualStartDate: "2026-04-16",
        actualEndDate: null,
        plannedCost: 8500000,
        actualCost: 5500000
      },
      {
        id: 3,
        projectId: 1,
        name: "Testing and Completion",
        status: "Active",
        assignedTo: "Mike Chen",
        progress: 0,
        plannedStartDate: "2026-10-01",
        plannedEndDate: "2026-12-31",
        actualStartDate: null,
        actualEndDate: null,
        plannedCost: 6000000,
        actualCost: 0
      },
      // Project 2 Activities
      {
        id: 4,
        projectId: 2,
        name: "Seismic Survey",
        status: "Completed",
        assignedTo: "Emma Davis",
        progress: 100,
        plannedStartDate: "2024-11-15",
        plannedEndDate: "2025-02-15",
        actualStartDate: "2024-11-15",
        actualEndDate: "2025-02-10",
        plannedCost: 1800000,
        actualCost: 1800000
      },
      {
        id: 5,
        projectId: 2,
        name: "Data Analysis",
        status: "Completed",
        assignedTo: "John Wilson",
        progress: 100,
        plannedStartDate: "2025-02-16",
        plannedEndDate: "2025-03-20",
        actualStartDate: "2025-02-16",
        actualEndDate: "2025-03-20",
        plannedCost: 1700000,
        actualCost: 1680000
      },
      // Project 3 Activities
      {
        id: 6,
        projectId: 3,
        name: "Planning and Design",
        status: "Active",
        assignedTo: "Emma Davis",
        progress: 25,
        plannedStartDate: "2026-07-01",
        plannedEndDate: "2026-09-30",
        actualStartDate: "2026-07-01",
        actualEndDate: null,
        plannedCost: 2700000,
        actualCost: 675000
      },
      // Project 4 Activities
      {
        id: 7,
        projectId: 4,
        name: "Pipeline Design",
        status: "Completed",
        assignedTo: "John Wilson",
        progress: 100,
        plannedStartDate: "2025-06-15",
        plannedEndDate: "2025-09-30",
        actualStartDate: "2025-06-15",
        actualEndDate: "2025-09-25",
        plannedCost: 5000000,
        actualCost: 4900000
      },
      {
        id: 8,
        projectId: 4,
        name: "Subsea Installation",
        status: "Active",
        assignedTo: "Sarah Johnson",
        progress: 40,
        plannedStartDate: "2025-10-01",
        plannedEndDate: "2026-05-31",
        actualStartDate: "2025-10-01",
        actualEndDate: null,
        plannedCost: 18000000,
        actualCost: 3850000
      },
      // Project 5 Activities
      {
        id: 9,
        projectId: 5,
        name: "Facility Assessment",
        status: "Completed",
        assignedTo: "Lisa Anderson",
        progress: 100,
        plannedStartDate: "2025-09-01",
        plannedEndDate: "2025-10-31",
        actualStartDate: "2025-09-01",
        actualEndDate: "2025-10-28",
        plannedCost: 500000,
        actualCost: 480000
      },
      {
        id: 10,
        projectId: 5,
        name: "Equipment Procurement",
        status: "Active",
        assignedTo: "Mike Chen",
        progress: 75,
        plannedStartDate: "2025-11-01",
        plannedEndDate: "2026-01-31",
        actualStartDate: "2025-11-01",
        actualEndDate: null,
        plannedCost: 8000000,
        actualCost: 5520000
      },
      {
        id: 11,
        projectId: 5,
        name: "Installation and Testing",
        status: "Active",
        assignedTo: "Emma Davis",
        progress: 0,
        plannedStartDate: "2026-02-01",
        plannedEndDate: "2026-03-31",
        actualStartDate: null,
        actualEndDate: null,
        plannedCost: 3500000,
        actualCost: 0
      }
    ]);
    console.log("Activities created successfully!");

    // 5. Create Documents
    const documents = await Document.bulkCreate([
      {
        id: 1,
        title: "Well Design Specification",
        content: "Technical specifications for well A-1 drilling operations",
        author: "Sarah Johnson",
        projectId: 1,
        documentType: "Technical",
        uploadDate: "2026-02-15",
        status: "Approved"
      },
      {
        id: 2,
        title: "Project Charter",
        content: "DWTCP Deep Water project charter and objectives",
        author: "Sarah Johnson",
        projectId: 1,
        documentType: "Report",
        uploadDate: "2026-02-01",
        status: "Approved"
      },
      {
        id: 3,
        title: "Risk Register",
        content: "Initial risk assessment and mitigation strategies",
        author: "Lisa Anderson",
        projectId: 1,
        documentType: "HSE",
        uploadDate: "2026-02-20",
        status: "Approved"
      },
      {
        id: 4,
        title: "Seismic Survey Report",
        content: "Final report on seismic survey operations",
        author: "Emma Davis",
        projectId: 2,
        documentType: "Report",
        uploadDate: "2025-03-25",
        status: "Approved"
      },
      {
        id: 5,
        title: "Onshore Project Plan",
        content: "Detailed project plan for onshore drilling operations",
        author: "Emma Davis",
        projectId: 3,
        documentType: "Report",
        uploadDate: "2026-06-15",
        status: "Review"
      },
      {
        id: 6,
        title: "Pipeline Design Document",
        content: "Subsea pipeline design and specifications",
        author: "John Wilson",
        projectId: 4,
        documentType: "Technical",
        uploadDate: "2025-07-01",
        status: "Approved"
      },
      {
        id: 7,
        title: "Installation Procedure Manual",
        content: "Step-by-step installation procedures for pipeline",
        author: "John Wilson",
        projectId: 4,
        documentType: "Technical",
        uploadDate: "2025-09-15",
        status: "Approved"
      },
      {
        id: 8,
        title: "Facility Assessment Report",
        content: "Comprehensive assessment of existing facilities",
        author: "Lisa Anderson",
        projectId: 5,
        documentType: "Report",
        uploadDate: "2025-10-31",
        status: "Approved"
      },
      {
        id: 9,
        title: "Equipment Specification",
        content: "Technical specifications for procurement equipment",
        author: "Mike Chen",
        projectId: 5,
        documentType: "Technical",
        uploadDate: "2025-10-15",
        status: "Approved"
      },
      {
        id: 10,
        title: "Budget Summary",
        content: "Project budget breakdown and financial summary",
        author: "Sarah Johnson",
        projectId: 1,
        documentType: "Finance",
        uploadDate: "2026-03-01",
        status: "Approved"
      }
    ]);
    console.log("Documents created successfully!");

    // 6. Create Risks
    const risks = await Risk.bulkCreate([
      {
        id: 1,
        projectId: 1,
        title: "Weather Delays",
        description: "Adverse weather conditions could delay offshore operations",
        severity: "High",
        probability: "Medium",
        status: "Active",
        owner: "Sarah Johnson"
      },
      {
        id: 2,
        projectId: 1,
        title: "Equipment Shortage",
        description: "Potential shortage of specialized drilling equipment",
        severity: "High",
        probability: "Low",
        status: "Mitigated",
        owner: "Mike Chen"
      },
      {
        id: 3,
        projectId: 1,
        title: "Budget Overrun",
        description: "Project costs could exceed allocated budget",
        severity: "Medium",
        probability: "Medium",
        status: "Active",
        owner: "Lisa Anderson"
      },
      {
        id: 4,
        projectId: 2,
        title: "Data Quality Issues",
        description: "Seismic data may require reprocessing due to noise",
        severity: "Low",
        probability: "Low",
        status: "Closed",
        owner: "Emma Davis"
      },
      {
        id: 5,
        projectId: 3,
        title: "Regulatory Approval Delay",
        description: "Environmental and regulatory approvals may be delayed",
        severity: "High",
        probability: "Medium",
        status: "Active",
        owner: "Emma Davis"
      },
      {
        id: 6,
        projectId: 4,
        title: "Subsea Challenges",
        description: "Complex subsea conditions may impact pipeline installation",
        severity: "High",
        probability: "High",
        status: "Mitigated",
        owner: "John Wilson"
      },
      {
        id: 7,
        projectId: 4,
        title: "Supply Chain Disruption",
        description: "Delays in material supply could impact project schedule",
        severity: "Medium",
        probability: "Medium",
        status: "Active",
        owner: "Mike Chen"
      },
      {
        id: 8,
        projectId: 5,
        title: "Operational Interruption",
        description: "Need to maintain operations during facility upgrade",
        severity: "High",
        probability: "High",
        status: "Active",
        owner: "Lisa Anderson"
      },
      {
        id: 9,
        projectId: 5,
        title: "Technical Integration Issues",
        description: "New equipment integration with existing systems",
        severity: "Medium",
        probability: "Medium",
        status: "Mitigated",
        owner: "Emma Davis"
      },
      {
        id: 10,
        projectId: 1,
        title: "Safety Incidents",
        description: "Potential for safety incidents in high-risk drilling operations",
        severity: "High",
        probability: "Low",
        status: "Active",
        owner: "Sarah Johnson"
      }
    ]);
    console.log("Risks created successfully!");

    console.log("Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
