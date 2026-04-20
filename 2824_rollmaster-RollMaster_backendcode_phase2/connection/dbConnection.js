const { MysqlModule } = require("@robrosystems/mysql_module");
const md5 = require("md5");
const createTable = require("./createAllTable.js");
const path = require('path');
const fs = require('fs');

// Initialize MysqlModule
const mysqlModule = new MysqlModule();

// database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Robro@123",
  database: process.env.DB_NAME || "robrodb",
  // password:  "Acs@12345",
  // database: "Rollmaster_updated_database_client",
  port: process.env.DB_PORT || 3306,
};

// Connect to the database


const connectdb = async () => {
  try {
    // Connect to the database
    await mysqlModule.connect(dbConfig);
    console.log("Connected to MySQL database");

    // Create the tables and triggers
    await createTable.createAllTables(mysqlModule);
    console.log("Tables and triggers created successfully");

    const insertRolePermissionQuery = `
      INSERT INTO kwis_role_modules_permission (role_module_permission_id, role_id, module_id)
      VALUES (?, ?, ?)
    `;

    const selectRolePermissionQuery = `
      SELECT COUNT(*) as count FROM kwis_role_modules_permission WHERE role_module_permission_id = ?
    `;
    
    const insertFeaturesPermissionQuery = `
      INSERT INTO kwis_role_feature_permission (feature_list_id, role_id)
      VALUES (?, ?)
    `;

    const selectFeaturesPermissionQuery = `
      SELECT COUNT(*) as count FROM kwis_role_feature_permission WHERE feature_list_id = ?
    `;

    const insertRoleQuery = `
    INSERT INTO kwis_role (role_id, role_name, status)
    VALUES (?, ?, ?)
  `;
   const selectRoleQuery = `
    SELECT COUNT(*) as count FROM kwis_role WHERE role_id = ?
  `;
  
 const insertModuleQuery = `
    INSERT INTO kwis_module (module_id, module_name, status)
    VALUES (?, ?, ?)
  `;
  
   const selectModuleQuery = `
    SELECT COUNT(*) as count FROM kwis_module WHERE module_id = ?
  `;

  const insertFeatureQuery = `
    INSERT INTO kwis_feature_list (feature_id, module_id, feature_name)
    VALUES (?, ?, ?)
  `;

  const selectFeatureQuery = `
    SELECT COUNT(*) as count FROM kwis_feature_list WHERE feature_id = ?
  `;

  const insertDefaultPdfConfig = `INSERT INTO kwis_pdf_config (pdf_config_name, logo, only_map, defect_type_filter,defect_status_filter, defect_info_filter, status, isdisabled, sharing_configuration_type, mobile_number) VALUES (?,?,?,?,?,?,?,?,?,?)`;

  const insertDefaultQualityCodeConfig = `INSERT INTO kwis_quality_code_info (quality_code, filter_value_json, status, isdisabled) VALUES (?,?,?,?)`;
  
  const selectDefaultPdfData = `SELECT * FROM kwis_pdf_config WHERE pdf_config_name = ?`;

  const selectDefaultQualityCodeData = `SELECT * FROM kwis_quality_code_info WHERE quality_code = ?`;
    mysqlModule.addQuery("insert_role_permission", insertRolePermissionQuery);
    mysqlModule.addQuery("check_role_permission", selectRolePermissionQuery);
    mysqlModule.addQuery("insert_feature_permission", insertFeaturesPermissionQuery);
    mysqlModule.addQuery("check_feature_permission", selectFeaturesPermissionQuery);
    mysqlModule.addQuery("insert_role", insertRoleQuery);
    mysqlModule.addQuery("check_role", selectRoleQuery);
    mysqlModule.addQuery("insert_module", insertModuleQuery);
    mysqlModule.addQuery("check_module", selectModuleQuery);
    mysqlModule.addQuery("insert_feature", insertFeatureQuery);
    mysqlModule.addQuery("check_feature", selectFeatureQuery);
    mysqlModule.addQuery("insertDefaultPdfConfig", insertDefaultPdfConfig);
    mysqlModule.addQuery("insertDefaultQualityCodeConfig",insertDefaultQualityCodeConfig);
    mysqlModule.addQuery("selectDefaultPdfData", selectDefaultPdfData);
    mysqlModule.addQuery("selectDefaultQualityCodeData", selectDefaultQualityCodeData);

    // Users data to insert
    const users = [
      [
        "Supervisor",
        "",
        "user@robrosystems.com",
        md5("Rollmaster@123"), // hashed password
        9926236449.0,
        1,
        1,
        "2023-12-27 10:43:31",
        "2023-12-27 10:43:31",
        1,
        1,
        "https://rollmaster.itsabacus.net/uploads/profile_picture/roll_master_default_image.jpg",
      ],
      [
        "robro",
        "systems",
        "robro@robrosystems.com",
        md5("Rollmaster@123"), // hashed password
        9329922481.0,
        1,
        1,
        "2024-04-11 07:00:25",
        "2024-04-11 07:00:25",
        null,
        null,
        "https://rollmaster.itsabacus.net/uploads/profile_picture/roll_master_default_image.jpg",
      ],
    ];

    // Role permission data to insert
    const modulePermissions = [
      [1, 1, 1],
      [2, 1, 2],
      [3, 1, 3],
      [4, 1, 4],
      [5, 1, 5],
      [6, 1, 6],
      [7, 1, 7],
      [8, 2, 1],
      [9, 2, 2],
      [10, 2, 3],
      [11, 2, 4],
      [12, 2, 5],
      [13, 2, 6],
      [14, 2, 7],
      [15, 3, 1],
      [16, 3, 2],
      [17, 3, 3],
      [18, 3, 4],
      [19, 3, 5],
      [20, 3, 6],
      [21, 3, 7]
    ];

    // Role permission data to insert
    const featuresPermissions = [
  [1, 1],
  [2, 1],
  [3, 1],
  [4, 1],
  [5, 1],
  [6, 1],
  [7, 1],
  [8, 1],
  [9, 1],
  [10, 1],
  [11, 1],
  [12, 1],
  [13, 1],
  [14, 1],
  [15, 1],
  [16, 1],
  [17, 1],
  [18, 1],
  [19, 1],
  [20, 1],
  [21, 1],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1],
  [26, 1],
  [27, 1],
  [28, 1],
  [29, 1],
  [30, 1],
  [31, 1],
  [32, 1],
  [33, 1],
  [34, 1],
  [35, 1],
  [36, 1],
  [37, 1],
  [38, 1],
  [39, 1],
  [40, 1],
  [41, 1],
  [42, 1],
  [43, 1],
  [44, 1],
  [45, 1],
  [46, 1],
  [47, 1],
  [48, 1],
  [49, 1],
  [50, 1],
  [51, 1],
  [52, 1],
  [53, 1],
  [54, 1],
  [55, 1],
  [56, 1],
  [57, 1],
  [58, 1],
  [59, 1],
  [60, 1],
  [61, 1],
  [62, 1],
  [63, 1],
  [64, 1],
  [65, 1],
  [66, 1],
  [67, 1],
  
  [1, 2],
  [2, 2],
  [3, 2],
  [4, 2],
  [5, 2],
  [6, 2],
  [7, 2],
  [8, 2],
  [9, 2],
  [10, 2],
  [11, 2],
  [12, 2],
  [13, 2],
  [14, 2],
  [15, 2],
  [16, 2],
  [17, 2],
  [18, 2],
  [19, 2],
  [20, 2],
  [21, 2],
  [22, 2],
  [23, 2],
  [24, 2],
  [25, 2],
  [26, 2],
  [27, 2],
  [28, 2],
  [29, 2],
  [30, 2],
  [31, 2],
  [32, 2],
  [33, 2],
  [34, 2],
  [35, 2],
  [36, 2],
  [37, 2],
  [38, 2],
  [39, 2],
  [40, 2],
  [41, 2],
  [42, 2],
  [43, 2],
  [44, 2],
  [45, 2],
  [46, 2],
  [47, 2],
  [48, 2],
  [49, 2],
  [50, 2],
  [51, 2],
  [52, 2],
  [53, 2],
  [54, 2],
  [55, 2],
  [56, 2],
  [57, 2],
  [58, 2],
  [59, 2],
  [60, 2],
  [61, 2],
  [62, 2],
  [63, 2],
  [64, 2],
  [65, 2],
  [66, 2],
  [67, 2],

  [1, 3],
  [2, 3],
  [3, 3],
  [4, 3],
  [5, 3],
  [6, 3],
  [7, 3],
  [8, 3],
  [9, 3],
  [10, 3],
  [11, 3],
  [12, 3],
  [13, 3],
  [14, 3],
  [15, 3],
  [16, 3],
  [17, 3],
  [18, 3],
  [19, 3],
  [20, 3],
  [21, 3],
  [22, 3],
  [23, 3],
  [24, 3],
  [25, 3],
  [26, 3],
  [27, 3],
  [28, 3],
  [29, 3],
  [30, 3],
  [31, 3],
  [32, 3],
  [33, 3],
  [34, 3],
  [35, 3],
  [36, 3],
  [37, 3],
  [38, 3],
  [39, 3],
  [40, 3],
  [41, 3],
  [42, 3],
  [43, 3],
  [44, 3],
  [45, 3],
  [46, 3],
  [47, 3],
  [48, 3],
  [49, 3],
  [50, 3],
  [51, 3],
  [52, 3],
  [53, 3],
  [54, 3],
  [55, 3],
  [56, 3],
  [57, 3],
  [58, 3],
  [59, 3],
  [60, 3],
  [61, 3],
  [62, 3],
  [63, 3],
  [64, 3],
  [65, 3],
  [66, 3],
  [67, 3]
];

    // Predefined set of 50 colors
    const predefinedColors = [
      "#0072BD", "#D95319", "#EDB120", "#7E2F8E", "#77AC30", 
      "#4DBEEE", "#A2142F", "#4C4C4C", "#999999", "#FF0000", 
      "#FF8000", "#BFBF00", "#00FF00", "#0000FF", "#AA00FF", 
      "#555500", "#77DD77", "#FFDAB9", "#FFB6C1", "#87CEEB", 
      "#E6E6FA", "#FF6347", "#40E0D0", "#DAA520", "#6495ED", 
      "#FF7F50", "#3CB371", "#CCCCFF", "#C71585", "#4682B4", 
      "#ADFF2F", "#7FFF00", "#FA8072", "#FFD700", "#8A2BE2", 
      "#5F9EA0", "#D2691E", "#8B0000", "#FF69B4", "#BA55D3", 
      "#8FBC8F", "#00FA9A", "#B0C4DE", "#9370DB", "#8A2BE2", 
      "#CD5C5C", "#FF4500", "#20B2AA", "#FF1493", "#696969"
    ];

    const predefinedcolorNames = [
      "French Blue", "Flame", "Urobilin Yellow", "Cadmium Violet", "Green", 
      "Picton Blue", "Dark Red", "Charcoal", "Gray", "Red", 
      "Orange", "Lemon Yellow", "Lime Green", "Blue", "Purple", 
      "Olive", "Pastel Green", "Peach Puff", "Light Pink", "Sky Blue", 
      "Lavender", "Tomato", "Turquoise", "Goldenrod", "Cornflower Blue", 
      "Coral", "Medium Sea Green", "Periwinkle", "Magenta", "Steel Blue", 
      "Green Yellow", "Chartreuse", "Salmon", "Gold", "Blue Violet", 
      "Cadet Blue", "Chocolate", "Dark Red", "Hot Pink", "Medium Orchid", 
      "Dark Sea Green", "Spring Green", "Light Steel Blue", "Medium Purple", "Blue Violet", 
      "Indian Red", "Orange Red", "Light Sea Green", "Deep Pink", "Dim Gray"
    ];

    const defaultLogoPath = path.join(__dirname, '../services/robro_logo.png');
    logoBuffer = fs.readFileSync(defaultLogoPath);
    
    const DefaultPdf = ["DefaultPdf", logoBuffer,0,0,0,0,1,1,undefined,undefined];

    const DefaultQualityCode = ["DefaultQualityCode",'{"roll_width":{"width":"","min":"","max":""},"ai_filter":{"ai_agent":"","defect_type":""},"size_filter":{"defect_size_unit":"","min_value":"","max_value":""}}',1,1];

    const DefaultPdfName = ['DefaultPdf'];
    
    const DefaultQualityCodeName = ['DefaultQualityCode'];

    // const defaultDefectNames = Array.from({ length: 50 }, (_, i) => `D${i + 1}`);

    // const numDefects = parseInt(process.env.NUM_DEFECTS || 50);

     // Read defect names from the environment variable (comma-separated), or use default names if not provided
    //  let defectNames = process.env.DEFECT_NAMES ? process.env.DEFECT_NAMES.split(',') : defaultDefectNames.slice(0, numDefects);
    //  defectNames.push('incorrect_width')
     
    // Validate the input
    // if (defectNames.length !== numDefects + 1) {
    //   console.error('Error: The number of defect names provided does not match NUM_DEFECTS.');
    // }

    // if (numDefects > predefinedColors.length) {
    //   console.error('Error: The number of defects exceeds the available colors.');
    // }

    // Prepare the defectTypes array
    // const defectTypes = defectNames.map((name, index) => {
    //   return [index + 1, name.trim(), predefinedcolorNames[index % predefinedcolorNames.length] , predefinedColors[index % predefinedColors.length]];
    // });
    
     // Role data to insert
     const roles = [
      [1, 'admin', 1],
      [2, 'supervisor', 1],
      [3, 'operator', 1],
    ];

    // Module data to insert
    const modules = [
      [1, 'rolls', 1],
      [2, 'roll details', 1],
      [3, 'review', 1],
      [4, 'roll width', 1],
      [5, 'repair', 1],
      [6, 'model', 1],
      [7, 'setting', 1]
    ];

    const features = [
      [1,1,'Change Master'],
      [2,1,'Apply Filter'],
      [3,1,'Edit Roll ID'],
      [4,1,'Add/Edit Note'],
      [5,1,'Add/Edit User Tag'],
      [6,1,'Delete Roll'],
      [7,1,'Roll List Details'],
      [8,2,'Download Pdf'],
      [9,2,'Add/Edit Note'],
      [10,2,'Start Review'],
      [11,2,'Start Repair'],
      [12,3,'Done Review'],
      [13,3,'Apply Filter'],
      [14,3,'Delete Defects'],
      [15,3,'Merge Defects'],
      [16,3,'Show Defect Info/Zoom in/Zoom out'],
      [17,3,'Roll width Tab'],
      [18,3,'Load More Defects'],
      [19,3,'Change Defect Type'],
      [20,4,'Apply Filter'],
      [21,4,'View Graph'],
      [22,4,'View Image'],
      [23,4,'Show Only Variation Points'],
      [24,4,'Add As Defect'],
      [25,5,'Splice Defect'],
      [26,5,'Repair Defect'],
      [27,5,'Suggetion For Delete Defect'],
      [28,5,'Done Repair'],
      [29,5,'Roll Running Status(start,stop,continue)'],
      [30,6,'Apply Filter'],
      [31,6,'Add Model'],
      [32,6,'Delete Model'],
      [33,6,'Train Model'],
      [34,7,'Add Custom User Tag'],
      [35,7,'Edit Custom User Tag'],
      [36,7,'Delete Custom User Tag'],
      [37,7,'Module Visiblity'],
      [38,7,'Add Pdf Generation Config'],
      [39,7,'Edit Pdf Generation'],
      [40,7,'Delete Pdf Generation'],
      [41,7,'Add Quality Code Config'],
      [42,7,'Edit Quality Code Config'],
      [43,7,'Delete Quality Code Config'],
      [44,1,'Export Report'],
      [45,1,'Show Count Rolls Inspected'],
      [46,1,'Show Count Rolls Reviewed'],
      [47,1,'Show Count Rolls Half-Repaired'],
      [48,1,'Show Count Rolls Repaired'],
      [49,2,'Show Inspection Info'],
      [50,2,'Show Review Info'],
      [51,2,'Show Repair Info'],
      [52,2,'Show Inspection Speed Graph'],
      [53,2,'Show Repair Speed Graph'],
      [54,3,'Add/Edit Note'],
      [55,3,'Update Ai Suggestion'],
      [56,3,'Undelete Defect'],
      [57,3,'Add Splice Details'],
      [58,7,'Add Repair Machine Config'],
      [59,7,'Edit Repair Machine Config'],
      [60,7,'Delete Repair Machine Config'],
      [61,7,'Add Inspection Machine Config'],
      [62,7,'Edit Inspection Machine Config'],
      [63,7,'Delete Inspection Machine Config'],
      [64,7,'Add Production Report Config'],
      [65,7,'Edit Production Report Config'],
      [66,7,'Delete Production Report Config'],
      [67,1,'Show Count Rolls Review Inprogress']
    ]

    // Insert role_permission data into the table
    const insertRolePermissionPromises = modulePermissions.map(
      async (modulePerm) => {
        const [id] = modulePerm;
        const result = await mysqlModule.runQuery("check_role_permission", [
          id,
        ]);
        if (result.data[0].count === 0) {
          return mysqlModule.runQuery("insert_role_permission", modulePerm);
        }
      }
    );

    // Insert feature permissions 
 const insertFeaturesPermissionPromises = featuresPermissions.map(
  async (featurePerm) => {
    const [feature_list_id, role_id] = featurePerm;
    const result = await mysqlModule.runQuery("check_feature_permission", [feature_list_id]);

    if (result.data[0].count === 0) {
      return mysqlModule.runQuery("insert_feature_permission", [feature_list_id, role_id]);
    } else { }
  }
);

    // Insert role data into the table
    const insertRolePromises = roles.map(async (role) => {
      const [id] = role;
      const result = await mysqlModule.runQuery("check_role", [id]);
      if (result.data[0].count === 0) {
        return mysqlModule.runQuery("insert_role", role);
      } 
    });

    // Insert module data into the table
    const insertModulePromises = modules.map(async (module) => {
      const [id] = module;
      const result = await mysqlModule.runQuery("check_module", [id]);
      if (result.data[0].count === 0) {
        return mysqlModule.runQuery("insert_module", module);
      }
    });

    // Insert feature data into the table
    const insertFeaturePromises = features.map(async (feature) => {
      const [id] = feature;
      const result = await mysqlModule.runQuery("check_feature", [id]);
      if (result.data[0].count === 0) {
        return mysqlModule.runQuery("insert_feature", feature);
      }
    });

    const insertDefaultPdfPromise = DefaultPdfName.map(async (item) => {
      const result = await mysqlModule.runQuery("selectDefaultPdfData",[item]);
      if (result.data.length === 0) {
        return mysqlModule.runQuery("insertDefaultPdfConfig", DefaultPdf);
      }
    })

    const insertDefaultQualityCodePromise = DefaultQualityCodeName.map(async (item) => {
      const result = await mysqlModule.runQuery("selectDefaultQualityCodeData",[item]);
      if (result.data.length === 0) {
        return mysqlModule.runQuery("insertDefaultQualityCodeConfig", DefaultQualityCode);
      }
    })

    

    // Wait for all insertions to complete
    await Promise.all([
      ...insertRolePermissionPromises,
      ...insertFeaturesPermissionPromises,
      ...insertRolePromises,
      ...insertModulePromises,
      ...insertFeaturePromises,
      ...insertDefaultPdfPromise,
      ...insertDefaultQualityCodePromise
    ]);
    
    console.log("Data insertion complete");

    // Return mysqlModule object
    return mysqlModule;
  } catch (err) {
    console.error("Error:", err);
    throw err; // Rethrow the error to propagate it to the caller
  }
};

connectdb();
module.exports = mysqlModule;
