const db = require("../connection/dbConnection.js");
const multer = require("multer");
const path = require('path')
const fs = require('fs')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
  
    // Move uploads outside of the routes folder using process.cwd()
    const uploadPath = path.join(process.cwd(), "uploads", "pdflogo");

    // Ensure directory exists
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});


const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Allowed image file types
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPEG, PNG, GIF, WebP) are allowed!"), false);
    }
  },
});

const uploadPdfLogo = (req, res) => {
  return new Promise((resolve, reject) => {
    upload.single("logo")(req, res, (err) => {
      if (err) {
        console.error("File upload error:", err);
        return reject("File upload failed.");
      }
      if (!req.file) {
        return resolve('uploads/pdflogo/default_logo.jpg'); // No file uploaded, return null
      }
      const filePath = `uploads/pdflogo/${req.file.filename}`;
      resolve(filePath);
    });
  });
};

//Setting user tags api's
const addUserTag = async (req, res, next) => {
  try {
    const { tag_name } = req.body;
    if (!tag_name) {
      return res.status(501).json({ status: false, message: "User tag is required" });
    }

    // Check if the tag already exists
    let checkSql = "SELECT tag_name FROM kwis_custom_user_tag_info WHERE tag_name = ?";
    db.addQuery("checkUserTag", checkSql);
    const existingTag = await db.runQuery("checkUserTag", [tag_name]);

    if (existingTag?.data?.length > 0) {
      return res.status(501).json({ status: false, message: "User tag already exists" });
    }

    // Insert new tag if it doesn't exist
    let insertSql = "INSERT INTO kwis_custom_user_tag_info (tag_name) VALUES (?)";
    db.addQuery("insertUserTag", insertSql);
    const result = await db.runQuery("insertUserTag",[tag_name]);

    if (!result?.success) {
      res.status(501).json({
        status: false,
        message: result.error,
      });
      return;
    }
    res.status(200).json({
      status: true,
      message: "User tag added successfully"
    });
  } catch (error) {
    console.error("Error in addUserTag:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred while adding user tag",
      error: error.message,
    });
  }
};

const deleteTag = async (req, res) => {
  try {
    const { user_tag_id } = req.params;
    if (!user_tag_id) {
      return res.status(501).json({
        status: false,
        message: "User Tag user_tag_id is required",
      });
    }
  
    let sql = "DELETE FROM kwis_custom_user_tag_info WHERE user_tag_id = ?";
    db.addQuery("deleteModel", sql);
    let params = [user_tag_id];
  
    const result = await db.runQuery("deleteModel", params);
  
    if (!result?.success) {
      return res.status(500).json({
        status: false,
        message: result.error || "Failed to delete User Tag",
      });
    }
  
    res.status(200).json({
      status: true,
      message: "User Tag deleted successfully",
    });
   
  } catch (error) {
    console.error("Error in deleteTag:", error);
    res.status(500).json({ status: false, message: "Error deleting tag", error: error.message });
  }
};

const updateTag = async (req, res) => {
  try {
    const { user_tag_id,tag_name } = req.body;

    if (!user_tag_id || !tag_name) {
      return res.status(501).json({ status: false, message: "Id and User tag is required" });
    }

    let sql = "UPDATE kwis_custom_user_tag_info SET tag_name = ? WHERE user_tag_id = ?";
    db.addQuery("updateTag", sql);
    const result = await db.runQuery("updateTag", [tag_name, user_tag_id]);
    if (result?.success && result?.affectedRows === 0) {
      return res.status(404).json({ status: false, message: "Tag not found or not updated" });
    }
    if (!result?.success && result?.error) {
      return res.status(404).json({ status: false, message: result?.error });
    }
    res.status(200).json({ status: true, message: "User tag updated successfully" });
  } catch (error) {
    console.error("Error in updateTag:", error);
    res.status(500).json({ status: false, message: "Error updating tag", error: error.message });
  }
};

const getUserTagsList = async (req, res, next) => {
  try {
    // let sql = "SELECT ut.id, ut.tag_name , CASE WHEN krl.user_tag_id IS NOT NULL THEN 1 ELSE 0 END AS status FROM kwis_custom_user_tag_info ut LEFT JOIN kwis_rolls_log krl ON ut.id = krl.user_tag_id GROUP BY ut.id;"
    let sql = `SELECT user_tag_id, tag_name From kwis_custom_user_tag_info WHERE status = ?`;
    // let sql = "SELECT id, tag_name FROM kwis_custom_user_tag_info";

    db.addQuery("getUserTagsList", sql);
    const result = await db.runQuery("getUserTagsList",[1]);
   
    if (!result?.data || result.data.length === 0) {
      return res.status(201).json({ status: true, message: "No user tags found",data:result.data });
    }

    res.status(200).json({
      status: true,
      message: "User tags fetched successfully",
      data: result.data,
    });
  } catch (error) {
    console.error("Error in getUserTagsList:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred while fetching user tags",
      error: error.message,
    });
  }
};


const addModuleVisibility = async (req,res) => {
  const {role_id,module_id} = req.body;

  if (!role_id || !module_id) {
    return res.status(501).json({ status: false, message: "role_id or module_id is missing" });
  }
    // Add user module visibility
    let sql = "INSERT INTO kwis_role_modules_permission (role_id,module_id) VALUES (?,?)";
    db.addQuery("addVisibility", sql);
    let params = [role_id, module_id];
    const result = await db.runQuery("addVisibility", params);
  
    if (!result?.success) {
      res.status(501).json({
        status: false,
        message: result.error,
      });
      return;
    }
    res.status(200).json({
      status: true,
      message: "Module visibility added successfully"
    });
}

const removeModuleVisibility = async (req, res) => {
  const { role_id, module_id } = req.body;

  if (!role_id || !module_id) {
    return res.status(501).json({ status: false, message: "role_id or module_id is missing" });
  }

  let sql = "DELETE FROM kwis_role_modules_permission WHERE role_id = ? AND module_id = ?";
  db.addQuery("removeVisibility", sql);
  let params = [role_id, module_id];
  const result = await db.runQuery("removeVisibility", params);

  if (!result?.success) {
    return res.status(500).json({ status: false, message: result.error });
  }
    // New code to delete from role_permission
    // const deletePermissionsSQL = `
    // DELETE FROM kwis_role_feature_permission 
    // WHERE role_id = ?
  // `;
    const deletePermissionsSQL = `
    DELETE FROM kwis_role_feature_permission 
    WHERE feature_list_id IN (
      SELECT feature_id 
      FROM kwis_feature_list 
      WHERE module_id = ?
    ) AND role_id = ?
  `;
  //   const deletePermissionsSQL = `
  //   DELETE FROM kwis_role_permission 
  //   WHERE feature_list_id IN (
  //     SELECT id 
  //     FROM kwis_feature_list 
  //     WHERE module_id = ?
  //   ) AND role_id = ?
  // `;
  db.addQuery("deletePermissions", deletePermissionsSQL); // Add the new query to your db object
  const deleteParams = [module_id, role_id];
  const deleteResult = await db.runQuery("deletePermissions", deleteParams);

  if (!deleteResult?.success) {
    // Consider whether to rollback the kwis_role_modules_permission deletion here
    return res.status(500).json({ status: false, message: "Failed to delete permissions: " + deleteResult.error });
  }
  res.status(200).json({ status: true, message: "Module visibility removed successfully" });
};

const getModuleVisibility = async (req, res) => {
  let sql = "SELECT role_module_permission_id, role_id, module_id FROM kwis_role_modules_permission";
  db.addQuery("getAllVisibility", sql);
  const result = await db.runQuery("getAllVisibility");

  if (!result?.success) {
    return res.status(500).json({ status: false, message: result.error });
  }

  // Grouping data by role_id
  const groupedData = result.data.reduce((acc, row) => {
    if (!acc[row.role_id]) {
      acc[row.role_id] = [];
    }
    acc[row.role_id].push({ id: row.role_module_permission_id, module_id: row.module_id });
    return acc;
  }, {});

  res.status(200).json({ status: true, data: groupedData });
};

const getAllModules = async (req,res) => {
  try {
    const sql = `SELECT * FROM kwis_module`
    db.addQuery("getModules", sql);
    const result = await db.runQuery("getModules");
  
    if (!result?.success) {
      return res.status(500).json({ status: false, message: result.error });
    }
    res.status(200).json({ status: true, data: result.data });
    
  } catch (error) {
    return res.status(500).json({ status: false, message: result.error });    
  }
}

const getFeatures = async (req,res) => {
  const { module_id } = req.params;
  const qry = "SELECT * FROM kwis_feature_list WHERE module_id = ?"
  db.addQuery("getFeatures",qry);
  const features = await db.runQuery("getFeatures",[module_id]);
  if(!features?.success) {
    return res.status(500).json({status: false, message: features.error})
  }
  res.status(200).json({status: true, count: features.data.length, data: features.data })
}

const addPdfGenerationConfig = async (req, res) => {
  try {
    let logoBuffer;
    if (req.file?.buffer) {
      logoBuffer = req.file.buffer;
    } else {
      // Default logo read from file system
      const defaultLogoPath = path.join(__dirname, '../services/robro_logo.png');
      logoBuffer = fs.readFileSync(defaultLogoPath);
    }
    const {
      pdf_config_name,
      only_map,
      defect_type_filter,
      defect_status_filter,
      defect_info_filter,
      defect_id_reset,
      ai_suggestion,
      location_filter,
      status,
      sharing_configuration_type = null,
      mobile_number = null,
      target_emails = null
    } = req.body;

    // Validate pdf_config_name
    if (!pdf_config_name || typeof pdf_config_name !== "string") {
      return res.status(501).json({ status: false, message: "pdf_config_name is required and must be a string" });
    }
     // Check uniqueness
    const checkSql = `SELECT id FROM kwis_pdf_config WHERE pdf_config_name = ? LIMIT 1`;
    db.addQuery("checkPdfConfigName", checkSql);
    const checkResult = await db.runQuery("checkPdfConfigName", [pdf_config_name]);

    if (checkResult?.success && checkResult.data.length > 0) {
      return res.status(501).json({ status: false, message: "pdf_config_name must be unique" });
    }
    // Validate boolean fields
    const booleanFields = { only_map, defect_type_filter, defect_status_filter, defect_info_filter, status };
    for (const [key, value] of Object.entries(booleanFields)) {
      if (value === undefined || (value !== 0 && value !== 1 && value !== "0" && value !== "1" && typeof value !== "boolean")) {
        return res.status(501).json({ status: false, message: `${key} must be a boolean (0 or 1)` });
      }
    }

    // Convert to integers
    const parsedValues = {
      only_map: Number(only_map),
      defect_type_filter: Number(defect_type_filter),
      defect_status_filter: Number(defect_status_filter),
      defect_info_filter: Number(defect_info_filter),
      defect_id_reset: Number(defect_id_reset),
      ai_suggestion: Number(ai_suggestion),
      location_filter: Number(location_filter),
      status: Number(status),
    };
    // Insert into database
    const insertSql = `INSERT INTO kwis_pdf_config (pdf_config_name, logo, only_map, defect_type_filter, defect_status_filter, defect_info_filter,defect_id_reset,ai_suggestion, location_filter,status, sharing_configuration_type, mobile_number, target_emails) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.addQuery("addPdfConfig", insertSql);
    const result = await db.runQuery("addPdfConfig", [
      pdf_config_name,
      logoBuffer,
      parsedValues.only_map,
      parsedValues.defect_type_filter,
      parsedValues.defect_status_filter,
      parsedValues.defect_info_filter,
      parsedValues.defect_id_reset,
      parsedValues.ai_suggestion,
      parsedValues.location_filter,
      parsedValues.status,
      sharing_configuration_type ? sharing_configuration_type : null,
      mobile_number !== 'null' ? mobile_number : null,
      target_emails !== 'null' ? target_emails : null
    ]);

    if (!result?.success) {
      return res.status(500).json({ status: false, message: result.error });
    }
    // Set default status if it's the first row
    const getCountSql = `SELECT COUNT(*) AS total FROM kwis_pdf_config`;
    db.addQuery("getCount",getCountSql);
    const countResult = await db.runQuery('getCount',[]);
    if (!countResult?.success) {
      return res.status(500).json({ status: false, message: countResult.error });
    }
    if(countResult.data[0].total === 1)
    {
      const updateSql = `UPDATE kwis_pdf_config SET status = 1 WHERE id = ?`
      db.addQuery("updateDefaultPdfConfig",updateSql)
      const updateResult = await db.runQuery("updateDefaultPdfConfig",[1]);
      if(!updateResult?.success)
      {
        return res.status(500).json({ status: false, message: updateResult.error });
      }
    }

    res.status(200).json({ status: true, message: "Configuration added successfully", insertId: result.insertId });
  } catch (error) {
    console.error("Error in addPdfGenerationConfig:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

const updatePdfGenerationConfig = async (req, res) => {
  try {
    let logoBuffer;
    let logoBufferStatus = false;
    const { id, pdf_config_name, only_map, defect_type_filter, defect_status_filter, defect_info_filter,defect_id_reset,ai_suggestion,location_filter, sharing_configuration_type, mobile_number, target_emails } = req.body;

    // Validate ID
    if (!id) {
      return res.status(501).json({ status: false, message: "ID is required" });
    }

    // Check if ID exists
    const checkSql = `SELECT * FROM kwis_pdf_config WHERE id = ?`;
    db.addQuery("checkPdfConfigId", checkSql);
    const checkResult = await db.runQuery("checkPdfConfigId", [id]);

    if (!checkResult?.success || checkResult.data.length === 0) {
      return res.status(404).json({ status: false, message: "Configuration not found" });
    }

    if (checkResult.data[0].logo !== null && req.file?.buffer) {
      logoBuffer = req.file.buffer;
      logoBufferStatus = true;
    }
    else if (req.file?.buffer) {
      // User uploaded a new logo
      logoBuffer = req.file.buffer;
      logoBufferStatus = true;
    }

    // Validate pdf_config_name uniqueness if changed
    if (pdf_config_name) {
      const nameCheckSql = `SELECT id FROM kwis_pdf_config WHERE pdf_config_name = ? AND id != ?`;
      db.addQuery("checkPdfConfigNameUnique", nameCheckSql);
      const nameCheckResult = await db.runQuery("checkPdfConfigNameUnique", [pdf_config_name, id]);

      if (nameCheckResult?.success && nameCheckResult.data.length > 0) {
        return res.status(501).json({ status: false, message: "pdf_config_name must be unique" });
      }
    }

    // Validate boolean fields
    const booleanFields = { only_map, defect_type_filter, defect_status_filter, defect_info_filter };
    for (const [key, value] of Object.entries(booleanFields)) {
      if (value !== undefined && value !== 0 && value !== 1 && value !== "0" && value !== "1" && typeof value !== "boolean") {
        return res.status(501).json({ status: false, message: `${key} must be a boolean (0 or 1)` });
      }
    }

    // Convert values to integer (MySQL TINYINT stores 0/1)
    const parsedValues = {
      only_map: only_map !== undefined ? Number(only_map) : checkResult.data[0].only_map,
      defect_type_filter: defect_type_filter !== undefined ? Number(defect_type_filter) : checkResult.data[0].defect_type_filter,
      defect_status_filter: defect_status_filter !== undefined ? Number(defect_status_filter) : checkResult.data[0].defect_status_filter,
      defect_info_filter: defect_info_filter !== undefined ? Number(defect_info_filter) : checkResult.data[0].defect_info_filter,
      defect_id_reset: defect_id_reset !== undefined ? Number(defect_id_reset) : checkResult.data[0].defect_id_reset,
      ai_suggestion: ai_suggestion !== undefined ? Number(ai_suggestion) : checkResult.data[0].ai_suggestion,
      location_filter: location_filter !== undefined ? Number(location_filter) : checkResult.data[0].location_filter,
    };

    let sql = `UPDATE kwis_pdf_config SET pdf_config_name = ?, only_map = ?, defect_type_filter = ?, defect_status_filter = ?, defect_info_filter = ?,defect_id_reset = ?,ai_suggestion = ?,location_filter = ?, sharing_configuration_type = ?, mobile_number = ?, target_emails = ?`;
    let values = [
      pdf_config_name || checkResult.data[0].pdf_config_name,
      parsedValues.only_map,
      parsedValues.defect_type_filter,
      parsedValues.defect_status_filter,
      parsedValues.defect_info_filter,
      parsedValues.defect_id_reset,
      parsedValues.ai_suggestion,
      parsedValues.location_filter,
      sharing_configuration_type || checkResult.data[0].sharing_configuration_type,
      mobile_number !== 'null' ? mobile_number : null,
      target_emails !== 'null' ? target_emails : null
    ]
    if(logoBufferStatus)
    {
      sql += `, logo = ?`;
      values.push(logoBuffer);
    }

    sql += ` WHERE id = ?`;
    values.push(id);
    // console.log(sql)
    db.addQuery("updatePdfConfig", sql);
    const result = await db.runQuery("updatePdfConfig", values);

    if (!result?.success) {
      return res.status(500).json({ status: false, message: result.error });
    }

    res.status(200).json({ status: true, message: "Configuration updated successfully" });
  } catch (error) {
    console.error("Error in updatePdfGenerationConfig:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

const getAllPdfGenerationConfigs = async (req, res) => {
  try {
    const sql = `SELECT * FROM kwis_pdf_config`;
    db.addQuery("getAllPdfConfigs", sql);
    const result = await db.runQuery("getAllPdfConfigs");

    if (!result?.success) {
      return res.status(500).json({ status: false, message: result.error });
    }

    res.status(200).json({ status: true, message: "PDF generation config list fetched", count:result.data.length, data: result.data });
  } catch (error) {
    console.error("Error in getAllPdfGenerationConfigs:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

const getPdfGenerationConfigById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(501).json({ status: false, message: "ID is required" });
    }

    const sql = `SELECT * FROM kwis_pdf_config WHERE id = ?`;
    db.addQuery("getPdfConfigById", sql);
    const result = await db.runQuery("getPdfConfigById", [id]);

    if (!result?.success || result.data.length === 0) {
      return res.status(404).json({ status: false, message: "Configuration not found" });
    }

    res.status(200).json({ status: true, message: "PDF generation config fetched", data: result.data[0] });
  } catch (error) {
    console.error("Error in getPdfGenerationConfigById:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

const deletePdfGenerationConfig = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(501).json({ status: false, message: "ID is required" });
    }

    // Check if the record exists
    const checkSql = `SELECT id FROM kwis_pdf_config WHERE id = ?`;
    db.addQuery("checkPdfConfigExists", checkSql);
    const checkResult = await db.runQuery("checkPdfConfigExists", [id]);

    if (!checkResult?.success || checkResult.data.length === 0) {
      return res.status(404).json({ status: false, message: "Configuration not found" });
    }

    // Delete record
    const deleteSql = `DELETE FROM kwis_pdf_config WHERE id = ?`;
    db.addQuery("deletePdfConfig", deleteSql);
    const deleteResult = await db.runQuery("deletePdfConfig", [id]);

    if (!deleteResult?.success) {
      return res.status(500).json({ status: false, message: deleteResult.error });
    }
    const getCount = `SELECT COUNT(*) AS total FROM kwis_pdf_config`;
    db.addQuery("getCount",getCount);
    const countResult = await db.runQuery('getCount',[]);
    if (!countResult?.success) {
      return res.status(500).json({ status: false, message: countResult.error });
    }
    if(countResult.data[0].total == 1)
    {
      const updateQuery = `UPDATE kwis_pdf_config SET status = 1 WHERE id = ?`
      db.addQuery("updateDefaultPdfConfig",updateQuery)
      const result = await db.runQuery("updateDefaultPdfConfig",[1]);
      if(!result?.success)
      {
        return res.status(500).json({ status: false, message: result.error });
      }
    }
    res.status(200).json({ status: true, message: "Configuration deleted successfully" });
  } catch (error) {
    console.error("Error in deletePdfGenerationConfig:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};


const addQualityCode = async (req, res) => {
  const { quality_code, filter_value_json, status } = req.body;

  if (!quality_code || !filter_value_json || status === undefined) {
    return res.status(501).json({ status: false, message: "quality_code, status, and filter_value_json are required" });
  }

  let parsedJson;
  try {
    parsedJson = typeof filter_value_json === "string" ? JSON.parse(filter_value_json) : filter_value_json;
  } catch (error) {
    return res.status(501).json({ status: false, message: "Invalid JSON format in filter_value_json" });
  }
  // Check if the quality code already exists
  const checkSql = `SELECT id FROM kwis_quality_code_info WHERE quality_code = ?`;
  db.addQuery("checkQualityCode", checkSql);
  const checkResult = await db.runQuery("checkQualityCode", [quality_code]);

  if (checkResult?.success && checkResult.data.length > 0) {
    return res.status(501).json({ status: false, message: "Quality Code with this name already exists" });
  }
  const sql = `INSERT INTO kwis_quality_code_info (quality_code, status, filter_value_json) VALUES (?, ?, ?)`;
  db.addQuery("addQualityCode", sql);
  const result = await db.runQuery("addQualityCode", [quality_code, status, JSON.stringify(parsedJson)]);

  if (!result?.success) {
    return res.status(500).json({ status: false, message: result.error });
  }

  res.status(200).json({ status: true, message: "Quality Code added successfully" });
};

const updateQualityCode = async (req, res) => {
  const { quality_code_id, quality_code, filter_value_json, status } = req.body;

  if (!quality_code_id || !quality_code || !filter_value_json || status == undefined) {
    return res.status(501).json({ status: false, message: "quality_code_id, quality_code, status and filter_value_json are required" });
  }

  let parsedJson;
  try {
    parsedJson = typeof filter_value_json === "string" ? JSON.parse(filter_value_json) : filter_value_json;
  } catch (error) {
    return res.status(501).json({ status: false, message: "Invalid JSON format in filter_value_json" });
  }
  // Ensure the new name is unique
  const checkSql = `SELECT COUNT(*) AS count FROM kwis_quality_code_info WHERE quality_code = ? AND quality_code_id != ?`;
  db.addQuery("checkQualityCodeUpdate", checkSql);
  const checkResult = await db.runQuery("checkQualityCodeUpdate", [quality_code, quality_code_id]);

  if (checkResult?.success && checkResult.data[0].count > 0) {
    return res.status(501).json({ status: false, message: "Quality Code with this name already exists" });
  }
  const updateSql = `UPDATE kwis_quality_code_info SET quality_code = ?, status = ?, filter_value_json = ? WHERE quality_code_id = ?`;
  db.addQuery("updateQualityCode", updateSql);
  const updateResult = await db.runQuery("updateQualityCode", [quality_code, status, JSON.stringify(parsedJson), quality_code_id]);

  if (!updateResult?.success) {
    return res.status(500).json({ status: false, message: updateResult.error });
  }

  res.status(200).json({ status: true, message: "Quality Code updated successfully" });
};

const getAllQualityCodes = async (req, res) => {
  const { user_id } = req.params;
  const sql = `SELECT * FROM kwis_quality_code_info`;
  db.addQuery("getAllQualityCodes", sql);
  const result = await db.runQuery("getAllQualityCodes",[user_id]);

  if (!result?.success) {
    return res.status(500).json({ status: false, message: result.error });
  }
  const parsedData = result.data.map((item) => ({
    ...item,
    filter_value_json: item.filter_value_json // Convert string to JSON
  }));
  res.status(200).json({ status: true, count: parsedData.length,data: parsedData });
};

const getQualityCodeByName = async (req, res) => {
  const { quality_code } = req.params;

  if (!quality_code) {
    return res.status(501).json({ status: false, message: "Quality name is required" });
  }

  const sql = `SELECT * FROM kwis_quality_code_info WHERE quality_code = ?`;
  db.addQuery("getQualityCodeByName", sql);
  const result = await db.runQuery("getQualityCodeByName", [quality_code]);

  if (!result?.success || result.data.length === 0) {
    return res.status(200).json({ status: false, message: "Quality Code not found",data:[] });
  }
  const parsedData = result.data.map((item) => ({
    ...item,
    filter_value_json: item.filter_value_json // Convert string to JSON
  }));
  res.status(200).json({ status: true, data: parsedData});
};

const deleteQualityCode = async (req, res) => {
  const { quality_code_id } = req.params;

  if (!quality_code_id) {
    return res.status(501).json({ status: false, message: "ID is required" });
  }

  const sql = `DELETE FROM kwis_quality_code_info WHERE quality_code_id = ?`;
  db.addQuery("deleteQualityCode", sql);
  const result = await db.runQuery("deleteQualityCode", [quality_code_id]);

  if (!result?.success) {
    return res.status(500).json({ status: false, message: result.error });
  }

  res.status(200).json({ status: true, message: "Quality Code deleted successfully" });
};

const addFeaturePermission = async (req,res) => {
  const {role_id,feature_list_id} = req.body;

  if (!role_id || !feature_list_id) {
    return res.status(501).json({ status: false, message: "role_id or feature_list_id is missing" });
  }
    // Add user module visibility
    let sql = "INSERT INTO kwis_role_feature_permission (role_id,feature_list_id) VALUES (?,?)";
    db.addQuery("addFeature", sql);
    let params = [role_id, feature_list_id];
    const result = await db.runQuery("addFeature", params);
  
    if (!result?.success) {
      res.status(501).json({
        status: false,
        message: result.error,
      });
      return;
    }
    res.status(200).json({
      status: true,
      message: "Feature permission added successfully"
    });
}

const removeFeaturePermission = async (req, res) => {
  const { role_id, feature_list_id } = req.body;

  if (!role_id || !feature_list_id) {
    return res.status(501).json({ status: false, message: "role_id or feature_list_id is missing" });
  }

  let sql = "DELETE FROM kwis_role_feature_permission WHERE role_id = ? AND feature_list_id = ?";
  db.addQuery("removeFeature", sql);
  let params = [role_id, feature_list_id];
  const result = await db.runQuery("removeFeature", params);

  if (!result?.success) {
    return res.status(500).json({ status: false, message: result.error });
  }
  res.status(200).json({ status: true, message: "Feature permission removed successfully" });
};

const getAllFeaturePermission = async (req, res) => {
  const { module_id, role_id } = req.body;
  let sql = `
    SELECT rp.role_feature_permission_id, rp.role_id, rp.feature_list_id,fl.module_id,fl.feature_name 
    FROM kwis_role_feature_permission rp
    LEFT JOIN kwis_feature_list fl ON rp.feature_list_id = fl.feature_id
    WHERE fl.module_id = ? AND rp.role_id = ?
  `;

  db.addQuery("getAllFeatures", sql);
  const result = await db.runQuery("getAllFeatures",[module_id,role_id]);
  if (!result?.success) {
    return res.status(500).json({ status: false, message: result.error });
  }
  // Grouping data by role_id
  const groupedData = result.data.reduce((acc, row) => {
    if (!acc[row.module_id]) {
      acc[row.module_id] = [];
    }
    acc[row.module_id].push({ id: row.role_feature_permission_id, role_id: row.role_id, feature_list_id:row.feature_list_id,module_id:row.module_id,feature_name:row.feature_name });
    return acc;
  }, {});
  res.status(200).json({ status: true, data: groupedData });
};

const updatePdfConfigStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    if (!id || status === "undefined") {
      return res.status(501).json({ status: false, message: "id and status are required" });
    }
    // Check if the provided ID exists
    const checkSql = `SELECT COUNT(*) AS count FROM kwis_pdf_config WHERE id = ?`;
    db.addQuery("checkPdfExists", checkSql);
    const checkResult = await db.runQuery("checkPdfExists", [id]);
    if (!checkResult?.success || checkResult.data[0].count === 0) {
      return res.status(404).json({ status: false, message: "PDF config not found" });
    }
    if (status) {
      // Set all statuses to false
      const resetSql = `UPDATE kwis_pdf_config SET status = false`;
      db.addQuery("resetPdfStatus", resetSql);
      const resetResult = await db.runQuery("resetPdfStatus");
      if (!resetResult?.success) {
        return res.status(500).json({ status: false, message: resetResult.error });
      }
    }

    // Update the specified PDF config
    const updateSql = `UPDATE kwis_pdf_config SET status = ? WHERE id = ?`;
    db.addQuery("updatePdfStatus", updateSql);
    const updateResult = await db.runQuery("updatePdfStatus", [status, id]);
    if (!updateResult?.success) {
      return res.status(500).json({ status: false, message: updateResult.error });
    }
    res.status(200).json({ status: true, message: "PDF config status updated successfully" });
  } catch (error) {
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Get all recipes from kwis_jobs_log table
const getAllRecipes = async (req, res) => {
  try {
    const sql = `SELECT DISTINCT recipe FROM kwis_jobs_log`;
    db.addQuery("getAllRecipes", sql);
    const result = await db.runQuery("getAllRecipes");

    if (!result?.success || !result.data || result.data.length === 0) {
      return res.status(200).json({ status: true, message: "No recipes found", data: [] });
    }

    res.status(200).json({
      status: true,
      message: "Recipes fetched successfully",
      count: result.data.length,
      data: result.data,
    });
  } catch (error) {
    console.error("Error in getAllRecipes:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred while fetching recipes",
      error: error.message,
    });
  }
};


module.exports = {
  addUserTag,
  updateTag,
  getUserTagsList,
  deleteTag,
  addModuleVisibility,
  removeModuleVisibility,
  getModuleVisibility,
  addFeaturePermission,
  removeFeaturePermission,
  getAllFeaturePermission,
  getAllModules,
  getFeatures,
  addPdfGenerationConfig,
  updatePdfGenerationConfig,
  getAllPdfGenerationConfigs,
  getPdfGenerationConfigById,
  deletePdfGenerationConfig,
  updatePdfConfigStatus,
  addQualityCode,
  updateQualityCode,
  getAllQualityCodes,
  getQualityCodeByName,
  deleteQualityCode,
  getAllRecipes // Export the new API
};
