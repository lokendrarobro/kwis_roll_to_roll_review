const db = require("../connection/dbConnection.js");
const jwt = require("jsonwebtoken");
const md5 = require("md5");
const fs = require('fs').promises;
const path = require('path');
const axios = require("axios");
const { decryptPassword } = require('../services/cryptoUtils.js');

const getPrimaryRollData = async (req, res, next) => {
  const {
    start_date,
    end_date,
    maxNumber,
    minNumber,
    draw,
    order,
    columns,
    search,
    data_status,
    tag_name,
    recipe,
    rollStatus
  } = req.body;
 
  const limit = parseInt(maxNumber - minNumber);
  const offset = parseInt(minNumber);
 
  const searchValue = `%${search.value || ""}%`;
  const orderColumn = columns[order[0].column].data;
  const orderDir = order[0].dir.toUpperCase();
 
  const startparts = start_date.split("/");
  const startDate = `${startparts[0]}-${startparts[1]}-${startparts[2]}`;
  const endparts = end_date.split("/");
  const endDate = `${endparts[0]}-${endparts[1]}-${endparts[2]}`;
  let statusConditionFirst = ""
  let statusCondition = "";
  let statusParam = [];
  let userTagCondition = "";
  let userTagCondition2 = "";
  statusCondition2 = "";

  let userTagParam = [];
  let recipeCondition = "";
  let recipeParam = [];

   // ----------------------------------------------------------------
  //  NEW: handle explicit roll status filters
  // ----------------------------------------------------------------
  let rollStatusCondition = "";
  let rollStatusParams = [];
  const rollStatusFilters = [];
  if (rollStatus) {
    if (rollStatus === "1" || rollStatus === 1) {
      rollStatusFilters.push(1, 5);
    } else {
      rollStatusFilters.push(rollStatus);
    }
  }

  if (rollStatusFilters.length > 0) {
    if (rollStatus === "null") {
      rollStatusCondition = ` AND rl.roll_status IS NULL`;
    } else {
      rollStatusCondition = ` AND rl.roll_status IN (${rollStatusFilters.map(() => "?").join(",")})`;
      rollStatusParams = [...rollStatusFilters];
    }
  }

  // If status is provided, filter by  review_status
  if (data_status && data_status.trim() !== "") {
    // if status is BACKUP OR ARCHIVE
    if (data_status == 'Live') {
      statusConditionFirst = ` AND kdaj.job_id IS NULL`
    } else {
      if (data_status == 'BACKUP' || data_status == 'ARCHIVE' || data_status == 'JOB RESTORED' || data_status == 'BACKUP DELETED' || data_status == 'BACKUP AVALIABLE') {
        let newStatus
        statusConditionFirst = `AND kdaj.backup_status = ?`;
        statusCondition = `LEFT JOIN
        kvp_data_archive_job AS kdaj
        ON kdaj.job_id = rl.robro_roll_id
        WHERE rl.roll_start_time BETWEEN ? AND ?
        AND  kdaj.backup_status = ?`;
        newStatus = data_status == 'BACKUP' ? 1 : data_status == 'BACKUP AVALIABLE' ? 2 : data_status == 'BACKUP DELETED' ? 3 : data_status == 'JOB RESTORED' ? 4 : 0;
        statusParam = [newStatus];
      } else {
        // if status is not BACKUP OR ARCHIVE
        statusConditionFirst = `AND rl.roll_status = ?`
        statusCondition = `WHERE rl.roll_start_time BETWEEN ? AND ?
        AND rl.roll_status = ?`;
        let roll_status = data_status === "INSPECTED" ? 1 : data_status === "REVIEWED" ? 2 : data_status === "REPAIR" ? 4 : data_status === "HALF REPAIR" ? 3 : 0
        statusParam = [roll_status];
        statusCondition2 = `WHERE DATE(rl.roll_start_time) BETWEEN ? AND ?
                        AND NOT EXISTS (
                          SELECT 1
                          FROM kvp_data_archive_job kdaj
                          WHERE kdaj.job_id = rl.robro_roll_id
                            AND kdaj.backup_status IN (0, 1)
                        )
                        AND rl.roll_status = ?`;
      }
    }

  } else {
    statusCondition = `LEFT JOIN
    kvp_data_archive_job AS kdaj
    ON kdaj.job_id = rl.robro_roll_id
    WHERE DATE(rl.roll_start_time) BETWEEN ? AND ?`;
    statusCondition2 = statusCondition
  }

  // If tag_name is provided, filter by tag_name
  if (tag_name) {
    // userTagCondition = "AND TRIM(rl.user_tag_id) = TRIM(?)"; // Ensure spaces are removed
    userTagCondition = `ts.user_tag_id IN (${tag_name}) AND `;
    // userTagParam = [tag_name];
    userTagCondition2 = `INNER JOIN kwis_tag_settings ts
                         ON rl.robro_roll_id = ts.robro_roll_id`
    statusCondition2 += ` AND ts.user_tag_id IN (${tag_name})`
  }

  // If recipe is provided, filter by recipe
  if (recipe && recipe !== "") {
    recipeCondition = ` AND kjl.recipe = ?`;
    recipeParam = [recipe];
  }

  const rollsLogParams = [
    startDate,
    endDate,
    searchValue,
    searchValue,
    searchValue,
    searchValue,
    searchValue,
    searchValue,
    searchValue,
    ...rollStatusParams,
    ...statusParam,
    ...recipeParam,
    limit,
    offset,
  ];

  const rollsLogQuery = `SELECT
                            rl.robro_roll_id,
                            rl.roll_start_time,
                            rl.roll_end_time,
                            rl.inspected_length,
                            rl.gsm,
                            rl.width,
                            rl.customer_roll_id,
                            rl.roll_status,
                            rl.total_defects,
                            (SELECT COUNT(*) FROM kwis_defects_log WHERE robro_roll_id = rl.robro_roll_id AND is_enabled = 1 AND delete_status = 0) AS enable_defects_count,
                            GROUP_CONCAT(DISTINCT ts.user_tag_id ORDER BY ts.user_tag_id ASC) AS tag_ids,
                            kdaj.backup_status,
                            GROUP_CONCAT(DISTINCT kjl.recipe ORDER BY kjl.recipe ASC) AS recipe
                            FROM
                            kwis_rolls_log AS rl
                            LEFT JOIN
                            kwis_tag_settings AS ts
                            ON rl.robro_roll_id = ts.robro_roll_id
                            LEFT JOIN
                            kvp_data_archive_job AS kdaj
                            ON kdaj.job_id = rl.robro_roll_id
                            LEFT JOIN
                            kwis_jobs_log AS kjl
                            ON rl.robro_roll_id = kjl.robro_roll_id
                            WHERE
                            ${userTagCondition}
                            rl.roll_start_time BETWEEN ? AND ?
                            AND (
                                rl.customer_roll_id LIKE ?
                                OR rl.roll_start_time LIKE ?
                                OR rl.roll_end_time LIKE ?
                                OR rl.inspected_length LIKE ?
                                OR rl.gsm LIKE ?
                                OR rl.width LIKE ?
                                OR rl.robro_roll_id LIKE ?
                            )
                            ${rollStatusCondition}
                            ${statusConditionFirst}
                            ${recipeCondition}
                            GROUP BY
                            rl.robro_roll_id,
                            rl.roll_start_time,
                            rl.roll_end_time,
                            rl.inspected_length,
                            rl.gsm,
                            rl.width,
                            rl.customer_roll_id,
                            rl.roll_status,
                            rl.total_defects,
                            kdaj.backup_status
                        ORDER BY ${orderColumn} ${orderDir}
                        LIMIT ? OFFSET ?
                        `;

  

  const totalCountsQuery = `SELECT 
                              COUNT(*) AS roll_count,
                              SUM(CASE WHEN roll_status = 2 THEN 1 ELSE 0 END) AS review_count,
                              SUM(CASE WHEN roll_status = 4 THEN 1 ELSE 0 END) AS repair_count,
                              SUM(CASE WHEN roll_status = 3 THEN 1 ELSE 0 END) AS half_repair_count,
                              SUM(CASE WHEN roll_status IN (1, 5) THEN 1 ELSE 0 END) AS inspected_count
                            FROM (
                                SELECT rl.robro_roll_id, rl.roll_status
                                FROM kwis_rolls_log rl
                                  ${userTagCondition2}
                                  ${data_status ? 'JOIN kvp_data_archive_job kdaj ON kdaj.job_id = rl.robro_roll_id' : ''}
                                  ${recipe ? 'JOIN kwis_jobs_log kjl ON rl.robro_roll_id = kjl.robro_roll_id' : ''}
                                WHERE rl.roll_start_time >= ? AND rl.roll_start_time <= ?
                                  ${rollStatusCondition}
                                  ${statusConditionFirst}
                                  ${recipeCondition}
                                  ${tag_name ? `AND ts.user_tag_id IN (${tag_name})` : ""}
                                GROUP BY rl.robro_roll_id, rl.roll_status
                            ) AS filtered;`;

  try {
    db.addQuery("rollsLogQuery", rollsLogQuery);
    db.addQuery("totalCountsQuery", totalCountsQuery);
    // console.log("rollsLogQuery : --->", rollsLogQuery);
    // console.log("rollsLogParams :-> ", rollsLogParams);

    const rollsLogResult = await db.runQuery("rollsLogQuery", rollsLogParams);

    // console.log("rollsLogResult :-> ", rollsLogResult);

    const totalCountsResult = await db.runQuery("totalCountsQuery", [
      startDate,
      endDate,
      ...rollStatusParams,
      ...statusParam,
      ...recipeParam
    ]);
    // console.log("totalCountsQuery :-> ", totalCountsQuery);

    if (!rollsLogResult.success) {
      return res.status(400).json({
        status: false,
        error: `Failed to fetch primary rolls log data: ${rollsLogResult.error}`,
      });
    }

    if (!totalCountsResult.success) {
      return res.status(400).json({
        status: false,
        error: `Failed to fetch total counts data: ${totalCountsResult.error}`,
      });
    }

    res.json({
      status: true,
      message: "Success",
      data: rollsLogResult.data,
      draw: draw,
      records: totalCountsResult.data[0].roll_count,
      TotalCount: [
        {
          rolls_count: totalCountsResult.data[0].roll_count || 0,
          roll_review: totalCountsResult.data[0].review_count || 0,
          roll_repair: totalCountsResult.data[0].repair_count || 0,
          roll_half_repair: totalCountsResult.data[0].half_repair_count || 0,
          roll_inspected: totalCountsResult.data[0].inspected_count || 0
        },
      ]
    });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};



const getAdditionalRollData = async (req, res, next) => {
   const {
    start_date,
    end_date,
    search,
    data_status,
    tag_name,
    recipe,
    rollStatus
  } = req.body;
 
  const searchValue = `%${search.value || ""}%`;
 
  const startparts = start_date.split("/");
  const startDate = `${startparts[0]}-${startparts[1]}-${startparts[2]}`;
  const endparts = end_date.split("/");
  const endDate = `${endparts[0]}-${endparts[1]}-${endparts[2]}`;
  let statusConditionFirst = ""
  let statusCondition = "";
  let statusParam = [];
  let userTagCondition = "";
  let userTagCondition2 = "";
  let statusCondition2 = "";

  let userTagParam = [];
  let recipeCondition = "";
  let recipeParam = [];

   // ----------------------------------------------------------------
  //  NEW: handle explicit roll status filters
  // ----------------------------------------------------------------
  let rollStatusCondition = "";
  let rollStatusParams = [];
  const rollStatusFilters = [];
  if (rollStatus) {
    if (rollStatus === "1" || rollStatus === 1) {
      rollStatusFilters.push(1, 5);
    } else {
      rollStatusFilters.push(rollStatus);
    }
  } 

  if (rollStatusFilters.length > 0) {
    if (rollStatus === "null"){
      rollStatusCondition = ` AND rl.roll_status IS NULL`;
    }else {
      rollStatusCondition = ` AND rl.roll_status IN (${rollStatusFilters.map(() => "?").join(",")})`;
      rollStatusParams = [...rollStatusFilters];
    }
  }

  // If status is provided, filter by  review_status
  if (data_status && data_status.trim() !== "") {
    // if status is BACKUP OR ARCHIVE
    if (data_status == 'Live') {
      statusConditionFirst = ` AND kdaj.job_id IS NULL`
    } else {
      if (data_status == 'BACKUP' || data_status == 'ARCHIVE' || data_status == 'JOB RESTORED' || data_status == 'BACKUP DELETED' || data_status == 'BACKUP AVALIABLE') {
        let newStatus
        statusConditionFirst = `AND kdaj.backup_status = ?`;
        statusCondition = `LEFT JOIN
        kvp_data_archive_job AS kdaj
        ON kdaj.job_id = rl.robro_roll_id
        WHERE rl.roll_start_time BETWEEN ? AND ?
        AND  kdaj.backup_status = ?`;
        newStatus = data_status == 'BACKUP' ? 1 : data_status == 'BACKUP AVALIABLE' ? 2 : data_status == 'BACKUP DELETED' ? 3 : data_status == 'JOB RESTORED' ? 4 : 0;
        statusParam = [newStatus];
      } else {
        // if status is not BACKUP OR ARCHIVE
        statusConditionFirst = `AND rl.roll_status = ?`
        statusCondition = `WHERE rl.roll_start_time BETWEEN ? AND ?
        AND rl.roll_status = ?`;
        let roll_status = data_status === "INSPECTED" ? 1 : data_status === "REVIEWED" ? 2 : data_status === "REPAIR" ? 4 : data_status === "HALF REPAIR" ? 3 : 0
        statusParam = [roll_status];
        statusCondition2 = `WHERE DATE(rl.roll_start_time) BETWEEN ? AND ?
                        AND NOT EXISTS (
                          SELECT 1
                          FROM kvp_data_archive_job kdaj
                          WHERE kdaj.job_id = rl.robro_roll_id
                            AND kdaj.backup_status IN (0, 1)
                        )
                        AND rl.roll_status = ?`;
      }
    }

  } else {
    statusCondition = `LEFT JOIN
    kvp_data_archive_job AS kdaj
    ON kdaj.job_id = rl.robro_roll_id
    WHERE DATE(rl.roll_start_time) BETWEEN ? AND ?`;
    statusCondition2 = statusCondition
  }

  // If tag_name is provided, filter by tag_name
  if (tag_name) {
    // userTagCondition = "AND TRIM(rl.user_tag_id) = TRIM(?)"; // Ensure spaces are removed
    userTagCondition = `ts.user_tag_id IN (${tag_name}) AND `;
    // userTagParam = [tag_name];
    userTagCondition2 = `INNER JOIN kwis_tag_settings ts
                         ON rl.robro_roll_id = ts.robro_roll_id`
    statusCondition2 += ` AND ts.user_tag_id IN (${tag_name})`
  }

  // If recipe is provided, filter by recipe
  if (recipe && recipe !== "") {
    recipeCondition = ` AND kjl.recipe = ?`;
    recipeParam = [recipe];
  }


  const totalCountsQuery = `
    SELECT 
    COUNT(DISTINCT k.robro_roll_id) AS roll_count,
    COUNT(DISTINCT CASE WHEN k.roll_status = 2 THEN k.robro_roll_id END) AS review_count,
    COUNT(DISTINCT CASE WHEN k.roll_status = 4 THEN k.robro_roll_id END) AS repair_count,
    COUNT(DISTINCT CASE WHEN k.roll_status = 3 THEN k.robro_roll_id END) AS half_repair_count,
    COUNT(DISTINCT CASE WHEN k.roll_status is null THEN k.robro_roll_id END) AS inspected_count,
    COUNT(DISTINCT CASE WHEN k.roll_status IN (1, 5) THEN k.robro_roll_id END) AS roll_review_inprogress
    FROM kwis_rolls_log k
    WHERE k.roll_start_time BETWEEN ? AND ?;
  `;

  const getAllRecipesQuery = `
    SELECT DISTINCT recipe 
    FROM kwis_jobs_log;
  `;

  const filteredRollsLogQuery = `
    SELECT COUNT(DISTINCT rl.robro_roll_id) AS totalRecords
      FROM
          kwis_rolls_log AS rl
      LEFT JOIN
          kwis_tag_settings AS ts
          ON rl.robro_roll_id = ts.robro_roll_id
      LEFT JOIN
          kwis_custom_user_tag_info AS cti
          ON ts.user_tag_id = cti.user_tag_id
      LEFT JOIN
          kvp_data_archive_job AS kdaj
          ON kdaj.job_id = rl.robro_roll_id
      LEFT JOIN
          kwis_jobs_log AS kjl
          ON rl.robro_roll_id = kjl.robro_roll_id
      WHERE
          ${userTagCondition}
          rl.roll_start_time BETWEEN ? AND ?
          AND (
              rl.customer_roll_id LIKE ?
              OR rl.roll_start_time LIKE ?
              OR rl.roll_end_time LIKE ?
              OR rl.inspected_length LIKE ?
              OR rl.gsm LIKE ?
              OR rl.width LIKE ?
              OR rl.robro_roll_id LIKE ?
          )
          ${rollStatusCondition}
          ${statusConditionFirst}
          ${recipeCondition};
      `
  const filteredRollsLogParams = [
    startDate,
    endDate,
    searchValue,
    searchValue,
    searchValue,
    searchValue,
    searchValue,
    searchValue,
    searchValue,
    ...rollStatusParams,
    ...statusParam,
    ...recipeParam
  ];
  // `;
  try {
    db.addQuery("totalCountsQuery", totalCountsQuery);
    db.addQuery("filteredRollsLogQuery", filteredRollsLogQuery);
    db.addQuery("getAllRecipesQuery", getAllRecipesQuery);

    const getAllRecipesResult = await db.runQuery("getAllRecipesQuery");

    if (!getAllRecipesResult.success) {
      return res.status(400).json({
        status: false,
        error: `Failed to fetch recipes data: ${getAllRecipesResult.error}`
      });
    }

    const totalCountsResult = await db.runQuery("totalCountsQuery", [
      startDate,
      endDate,
    ])
    if (!totalCountsResult.success) {
      return res.status(400).json({
        status: false,
        error: `Failed to fetch total counts data: ${totalCountsResult.error}`
      });
    }

    const filteredCountsResult = await db.runQuery("filteredRollsLogQuery", filteredRollsLogParams);
    res.json({
      status: true,
      message: "Success",
      TotalCount: [
        {
          rolls_count: totalCountsResult.data[0].roll_count || 0,
          roll_review: totalCountsResult.data[0].review_count || 0,
          roll_repair: totalCountsResult.data[0].repair_count || 0,
          roll_half_repair:  totalCountsResult.data[0].half_repair_count || 0,
          roll_inspected: totalCountsResult.data[0].inspected_count || 0,
          roll_review_inprogress: totalCountsResult.data[0].roll_review_inprogress || 0,
          filterRecords: filteredCountsResult.data[0].totalRecords || 0,
          recipes: getAllRecipesResult.data.map(item => item.recipe).filter(recipe => recipe !== null)
        },]
    });

  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};


const login = async (req, res, next) => {
  const { email, password } = req.body;
  const sql = "SELECT kvp_user_info.* , kvp_user_type_info.allowed_actions FROM kvp_user_info left join  kvp_user_type_info on kvp_user_info.user_type = kvp_user_type_info.user_type where email = ?;";
  const values = [email];
  try {
    await db.addQuery("sql", sql);
    const result = await db.runQuery("sql", values);
    if (!result?.success) {
      res.status(501).json({ status: false, error: result.error });
      return;
    }
    if (result.data.length > 0) {
      decryptedData = decryptPassword(result.data[0].password);
      if (decryptedData == password) {
        const user = {
          "id": result.data[0].id,
          "email": result.data[0].email
        };
        const expiresIn = 2592000;
        const secretKey = "ACS123";
        const token = jwt.sign(user, secretKey, { expiresIn });
        return res.status(200).json({ "status": true, "message": "Login successfully!!!", "token": token, "userDetails": result.data[0] });
      }
      else {
        return res.status(501).json({ "status": false, "message": "Password is invalid" });
      }
    } else {
      res.status(501).json({
        status: false,
        error: "Email and Password is invalid",
        data: [],
      });
    }
  } catch (error) {
    res.status(501).json({ status: false, message: error.message });
  }
};

const addRollIdName = async (req, res, next) => {
  //return res.status(200).json({ status: true, message: "Request received", data: req });
  const { robro_roll_id, customer_roll_id } = req.body;

  if (!robro_roll_id || !customer_roll_id) {
    return res.status(400).json({ status: false, message: "Missing required fields" });
  }
  const currentDate = new Date();
  const formattedTimestamp = formatTimestamp(currentDate);
  let updateUserQuery = "UPDATE kwis_rolls_log SET customer_roll_id = ?,updated_at = ? WHERE robro_roll_id = ?";
  let values = [customer_roll_id, formattedTimestamp, robro_roll_id]; // Include both values
  db.addQuery("updateUserQuery", updateUserQuery);
  const updateUserResult = await db.runQuery("updateUserQuery", values);
  try {
    if (!updateUserResult.success) {
      return res.status(500).json({ status: false, message: updateUserResult.error });
    }
    const affectedRows = updateUserResult.affectedRows || 0;

    if (affectedRows > 0) {
      return res.status(200).json({
        status: true,
        message: "Roll id updated successfully!",
        affectedRows: affectedRows,
      });
    } else {
      return res.status(404).json({
        status: false,
        message: "No user found or updated.",
      });
    }
  } catch (error) {
    return res.status(500).json({ status: false, message: "Internal server error", error: error.message });
  }
};

const deleteRollAndDataById = async (req, res) => {
  try {
    const { robro_roll_id, customer_roll_id } = req.body;

    const value = [robro_roll_id];

    const showProcessList = `SHOW PROCESSLIST;`
    db.addQuery("showProcessList", showProcessList);
    const showProcessListResult = await db.runQuery("showProcessList");
    // console.log("showProcessListResult:->", showProcessListResult);
    const blockingQueries = showProcessListResult.data.filter(
      (row) => row.State === "Locked" || row.Command === "Sleep"
    );
    // console.log("blockingQueries", blockingQueries);

    if (blockingQueries.length > 0) {
      for (const query of blockingQueries) {
        const processId = query.Id;
        console.log(`Killing query with Process ID: ${processId}`);

        const killQuery = `KILL ${processId};`;
        db.addQuery("killQuery", killQuery);
        const killResult = await db.runQuery("killQuery");

        if (!killResult.success) {
          console.error(`Failed to kill process ${processId}:`, killResult.error);
        } else {
          console.log(`Successfully killed process ${processId}`);
        }
      }

    } else {
      console.log("No blocking queries found.");
    }



    //============================== Table 1 ====================================================
    const deleteDataFromRollLog = `DELETE FROM kwis_rolls_log WHERE robro_roll_id = ?;`;
    db.addQuery("deleteDataFromRollLog", deleteDataFromRollLog);
    const deleteDataFromRollLogResult = await db.runQuery("deleteDataFromRollLog", value);

    if (!deleteDataFromRollLogResult.success) {
      return res.status(500).json({ status: false, message: deleteDataFromRollLogResult.error, table: "1" });
    }
    //============================== Table 2 ====================================================
    const deleteDataFromDfectLog = `DELETE FROM kwis_defects_log WHERE robro_roll_id = ?;`;
    db.addQuery("deleteDataFromDfectLog", deleteDataFromDfectLog);
    const deleteDataFromDfectLogResult = await db.runQuery("deleteDataFromDfectLog", value);

    if (!deleteDataFromDfectLogResult.success) {
      return res.status(500).json({ status: false, message: deleteDataFromDfectLogResult.error, table: "3" });
    }
    //============================== Table 3 ====================================================
    const deleteDataFromJobsLog = `DELETE FROM kwis_jobs_log WHERE robro_roll_id = ?;`;
    db.addQuery("deleteDataFromJobsLog", deleteDataFromJobsLog);
    const deleteDataFromJobsLogResult = await db.runQuery("deleteDataFromJobsLog", value);

    if (!deleteDataFromJobsLogResult.success) {
      return res.status(500).json({ status: false, message: deleteDataFromJobsLogResult.error, table: "5" });
    }
    //============================== Table 4 ====================================================
    const deleteDataFromRollWidthLog = `DELETE FROM kwis_roll_width_log WHERE robro_roll_id = ?;`;
    db.addQuery("deleteDataFromRollWidthLog", deleteDataFromRollWidthLog);
    const deleteDataFromRollWidthLogResult = await db.runQuery("deleteDataFromRollWidthLog", value);

    if (!deleteDataFromRollWidthLogResult.success) {
      return res.status(500).json({ status: false, message: deleteDataFromRollWidthLogResult.error, table: "6" });
    }
    const directoryPath = path.join(__dirname, '../uploads', 'images', 'kwis_roll_to_roll');
    // Check if directory exists
    await fs.access(directoryPath);

    const files = await fs.readdir(directoryPath, { withFileTypes: true });
    const folders = files.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);

    const filteredData = folders.filter(item => item.includes(customer_roll_id));

    if (filteredData.length > 0) {
      const folderPath = path.join(__dirname, '../uploads', 'images', 'kwis_roll_to_roll', filteredData[0]);
      await fs.rm(folderPath, { recursive: true, force: true });

      return res
        .status(200)
        .json({ status: true, message: "Data deleted successfully", filteredData: filteredData, folderDeleted: folderPath });
    } else {
      return res
        .status(200)
        .json({ status: true, message: "Data deleted successfully" });
    }
    // return res
    //   .status(200)
    //   .json({ status: true, message: "Data deleted successfully"});

  } catch (error) {
    return res.status(500).json({ status: false, message: "Internal server error", error: error.message });
  }
}


// Function to log app activity
const addActivityLog = async (req, res) => {
  const { data } = req.body;
  // Validation
  if (!data.message) {
    return res.status(400).json({
      status: false,
      message: 'Missing required fields',
    });
  }
  const app_id = 15;
  const severity = 1;
  const component_id = 1510;
  const code = -1;

  // SQL Query
  const sql = `
    INSERT INTO kvp_system_log 
    (component_id, app_id, message, severity, code, updated_at) 
    VALUES (?, ?, ?, ?, ?, NOW())
  `;

  const messageString = JSON.stringify(data.message); // Convert object to string
  const values = [component_id, app_id, messageString, severity, code];

  try {
    await db.addQuery("add_activity", sql);
    // Execute query
    const result = await db.runQuery("add_activity", values);

    if (result.success) {
      return res.status(200).json({
        status: true,
        message: 'Activity logged successfully',
        data: result.success,
      });
    } else {
      return res.status(500).json({
        status: false,
        message: 'Database error',
        error: result.error,
      });
    }

  } catch (error) {
    console.error("Activity Log Error:", error);
    return res.status(500).json({
      status: false,
      message: 'Database error',
      error: error.message,
    });
  }
};

// Function to add user activities to the Roll Master System
const addActivity = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const { kvp_backend_url, data } = req.body;

    if (!authHeader) {
      return res.status(401).json({
        status: false,
        msg: "Authorization header is missing",
      });
    }

    if (!kvp_backend_url || !data) {
      return res.status(400).json({
        status: false,
        msg: "kvp_backend_url or data is missing in the request body",
      });
    }


    const externalApiUrl = `${kvp_backend_url}add_activity_log`;

    const externalApiResponse = await axios.post(
      externalApiUrl,
      { data }
    );

    if (externalApiResponse.status === 200 && externalApiResponse.data?.status) {
      return res.status(200).json({
        status: true,
        msg: "Activity added successfully"
      });
    } else {
      return res.status(400).json({
        status: false,
        msg: "External API responded with an error",
        details: externalApiResponse.data,
      });
    }

  } catch (error) {
    console.error("Error calling external API:", error);
    return res.status(500).json({
      status: false,
      msg: "Error calling external API",
      error: error?.response?.data || error.message,
    });
  }
};

function formatTimestamp(date) {
  const formattedTimestamp = `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
      .getHours()
      .toString()
      .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
        .getSeconds()
        .toString()
        .padStart(2, "0")}`;
  return formattedTimestamp;
}

module.exports = {
  login,
  getPrimaryRollData,
  getAdditionalRollData,
  addRollIdName,
  deleteRollAndDataById,
  addActivity,
  addActivityLog
};
