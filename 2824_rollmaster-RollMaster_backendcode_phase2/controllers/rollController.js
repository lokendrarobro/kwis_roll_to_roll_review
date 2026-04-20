const db = require("../connection/dbConnection.js");
const createTableViewPdf = require("../services/createTableViewPdf.js");
const createImageViewPdf = require("../services/createImageViewPdf.js");
const createMapViewPdf = require("../services/createMapViewPdf.js");
const firstPagePdf = require("../services/firstPage.js");
const firstPageAiSuggestionPdf = require("../services/firstPageWithAiSuggestion.js");
const firstSheet = require("../services/firstSheet.js");
const createSheet = require("../services/createSheet.js");
const { PDFDocument, rgb } = require('pdf-lib');
const Colors = require('../services/colors.js');
const ExcelJS = require("exceljs");
const path = require("path");


//get all rolls data
const rolls = async (req, res, next) => {
  //get alll roll data with defect_count form defect_log table

  const { pageNumber, limit } = req.body;
  let OFFSET = (pageNumber - 1) * limit
  let rolls = `
  SELECT kwis_rolls_log.robro_roll_id, kwis_rolls_log.customer_roll_id 
  FROM kwis_rolls_log 
  GROUP BY kwis_rolls_log.robro_roll_id, kwis_rolls_log.customer_roll_id 
  ORDER BY kwis_rolls_log.customer_roll_id 
  LIMIT ? OFFSET ?`;

  db.addQuery("rolls", rolls);
  let params = [limit, OFFSET];
  const rows = await db.runQuery("rolls", params);
  if (!rows?.success) {
    res.status(501).json({ status: false, error: rows.error });
    return;
  }
  res.status(200).json({
    status: true,
    error: "success",
    data: rows.data,
  });
};
const getRollDetails = async (req, res, next) => {
  try {
    const rollid = req.params.rollid;
    const checkroll = "select * from kwis_rolls_log where robro_roll_id=?";
    await db.addQuery("checkroll", checkroll);

    const getRollSql = `
      SELECT kwis_rolls_log.*, 
      (SELECT COUNT(kwis_defects_log.defect_id) 
        FROM kwis_defects_log 
        WHERE kwis_rolls_log.robro_roll_id = kwis_defects_log.robro_roll_id) AS total_actual_defect_count,
      (SELECT COUNT(kwis_defects_log.defect_id) 
        FROM kwis_defects_log 
        WHERE kwis_rolls_log.robro_roll_id = kwis_defects_log.robro_roll_id) AS total_defect_with_delete 
      FROM  kwis_rolls_log 
      WHERE kwis_rolls_log.robro_roll_id = ?;
    `;
    await db.addQuery("getRollSql", getRollSql);


    const params = [rollid];
    const checkrollResult = await db.runQuery("checkroll", params);
    if (!checkrollResult.success) {
      return res.status(501).json({ status: false, error: checkrollResult.error });
    }

    if (checkrollResult.data.length === 0) {
      return res.status(201).json({
        status: false,
        message: "no record found",
        exist_status: "no",
      });
    }

    const getRollResult = await db.runQuery("getRollSql", params);
    if (!getRollResult.success) {
      return res.status(501).json({ status: false, error: getRollResult.error });
    }



    return res.status(200).json({
      status: true,
      message: "success",
      data: getRollResult.data,
      exist_status: "yes",
    });

  } catch (error) {
    console.error("Error:", error);
    return res.status(501).json({
      status: false,
      message: "An error occurred",
    });
  }
};

//get roll details for roll_id
const details = async (req, res, next) => {
  try {
    const rollid = req.params.rollid;

    const getRollSql = `
        SELECT
          rl.robro_roll_id,
          rl.machine_id,
          rl.roll_start_time,
          rl.roll_end_time,
          rl.inspected_length,
          rl.roll_length,
          rl.gsm,
          rl.width,
          rl.current_repair_meter,
          rl.customer_roll_id,
          rl.roll_status,
          rl.quality_code,

          MAX(d.max_defect_top_left_x_mm) AS max_defect_top_left_x_mm,
          CAST(MAX(d.avg_defects_per_1000_meter) AS UNSIGNED) AS avg_defects_per_1000_meter,

          CAST(COALESCE(MAX(d.defect_count), 0) AS UNSIGNED) AS defect_count,
          CAST(COALESCE(MAX(d.deleted_defect_count), 0) AS UNSIGNED) AS deleted_defect_count,
          CAST(COALESCE(MAX(d.repair_count), 0) AS UNSIGNED) AS repair_count,
          CAST(COALESCE(MAX(d.splice_count), 0) AS UNSIGNED) AS splice_count,
          COALESCE(MAX(sp.added_splice_count), 0) AS added_splice_count,
          CAST(COALESCE(MAX(d.ignored_count), 0) AS UNSIGNED) AS ignored_count,

          CASE
              WHEN COALESCE(MAX(d.defect_count), 0) > 0 AND rl.inspected_length > 0
              THEN 1000 / (100 / (rl.inspected_length / MAX(d.defect_count)))
              ELSE NULL
          END AS score,

          CASE
              WHEN COALESCE(MAX(d.defect_count), 0) > 0
              THEN rl.inspected_length / MAX(d.defect_count)
              ELSE NULL
          END AS avg_defect_distance,

          GROUP_CONCAT(DISTINCT cti.tag_name ORDER BY cti.tag_name SEPARATOR ', ') AS tag_names,
          GROUP_CONCAT(DISTINCT kjl.recipe ORDER BY kjl.recipe SEPARATOR ', ') AS recipes,

          MAX(krmi.loom_id) AS first_loom_id,

          MAX(review_times.start_review_time) AS start_review_time,
          MAX(review_times.end_review_time) AS end_review_time,
          MAX(review_times.reviewed_by) AS reviewed_by,

          MAX(repair_times.repair_start_time) AS repair_start_time,
          MAX(repair_times.repair_end_time) AS repair_end_time,
          MAX(repair_times.repaired_by) AS repaired_by,

          MAX(kms.repair_machine_id) AS repair_machine_id,
          MAX(inspection_info.inspected_by) AS inspected_by

      FROM kwis_rolls_log rl

      /* OPTIMIZED DEFECTS */
      LEFT JOIN (
          SELECT 
              d1.robro_roll_id,

              COUNT(*) AS defect_count,
              SUM(delete_status = 1) AS deleted_defect_count,
              SUM(repair_status = 1 AND suggest_for_deletion = 0 AND delete_status = 0) AS repair_count,
              SUM(delete_status = 0 AND splice_id IS NOT NULL) AS splice_count,
              SUM(suggest_for_deletion = 1 AND delete_status = 0) AS ignored_count,

              MAX(CASE WHEN delete_status = 0 THEN defect_top_left_x_mm END) AS max_defect_top_left_x_mm,

              (
                  SELECT AVG(cnt)
                  FROM (
                      SELECT COUNT(*) AS cnt
                      FROM kwis_defects_log d2
                      WHERE d2.robro_roll_id = d1.robro_roll_id
                        AND d2.delete_status = 0
                      GROUP BY FLOOR(d2.defect_top_left_y_mm / 1000000)
                  ) t
              ) AS avg_defects_per_1000_meter

          FROM kwis_defects_log d1
          WHERE d1.robro_roll_id = ?
          GROUP BY d1.robro_roll_id
      ) d ON rl.robro_roll_id = d.robro_roll_id

      /* SPLICE */
      LEFT JOIN (
          SELECT 
              robro_roll_id,
              COUNT(*) AS added_splice_count
          FROM kwis_splice_table
          WHERE robro_roll_id = ?
            AND splice_start_meter IS NOT NULL
            AND splice_end_meter IS NOT NULL
          GROUP BY robro_roll_id
      ) sp ON rl.robro_roll_id = sp.robro_roll_id

      /* REVIEW */
      LEFT JOIN (
          SELECT 
              krjl.robro_roll_id,
              MIN(start_time) AS start_review_time,
              MAX(end_time) AS end_review_time,
              GROUP_CONCAT(DISTINCT CONCAT(kui.first_name,' ',kui.last_name)) AS reviewed_by
          FROM kwis_review_job_log krjl
          LEFT JOIN kvp_user_info kui ON krjl.user_id = kui.user_id
          WHERE krjl.robro_roll_id = ?
          GROUP BY krjl.robro_roll_id
      ) review_times ON rl.robro_roll_id = review_times.robro_roll_id

      /* REPAIR */
      LEFT JOIN (
          SELECT 
              robro_roll_id,
              MIN(start_time) AS repair_start_time,
              MAX(end_time) AS repair_end_time,
              GROUP_CONCAT(DISTINCT CONCAT(kui.first_name,' ',kui.last_name)) AS repaired_by
          FROM kwis_roll_repair_job krj
          LEFT JOIN kvp_user_info kui ON krj.user_id = kui.user_id
          WHERE robro_roll_id = ?
          GROUP BY robro_roll_id
      ) repair_times ON rl.robro_roll_id = repair_times.robro_roll_id

      /* INSPECTION */
      LEFT JOIN (
          SELECT 
              robro_roll_id,
              GROUP_CONCAT(DISTINCT CONCAT(kui.first_name,' ',kui.last_name)) AS inspected_by
          FROM kwis_jobs_log kjl
          LEFT JOIN kvp_user_info kui ON kjl.user_id = kui.user_id
          WHERE robro_roll_id = ?
          GROUP BY robro_roll_id
      ) inspection_info ON rl.robro_roll_id = inspection_info.robro_roll_id

      /* TAGS */
      LEFT JOIN kwis_tag_settings ts ON rl.robro_roll_id = ts.robro_roll_id
      LEFT JOIN kwis_custom_user_tag_info cti ON ts.user_tag_id = cti.user_tag_id

      /* RECIPES + LOOM */
      LEFT JOIN kwis_jobs_log kjl ON rl.robro_roll_id = kjl.robro_roll_id
      LEFT JOIN kwis_roll_manufacturing_info krmi ON kjl.robro_roll_id = krmi.robro_roll_id

      /* REPAIR MACHINE */
      LEFT JOIN (
          SELECT robro_roll_id, MAX(machine_id) AS repair_machine_id
          FROM kwis_roll_repair_job
          WHERE robro_roll_id = ?
          GROUP BY robro_roll_id
      ) kms ON rl.robro_roll_id = kms.robro_roll_id

      WHERE rl.robro_roll_id = ?

      GROUP BY rl.robro_roll_id;

     `;
  
  const getBodyInfoSql = `SELECT
          r.robro_roll_id,

          /* ---------- PRIMARY ---------- */
          (
              SELECT JSON_ARRAYAGG(
                  JSON_OBJECT(
                      'primary_cut_length', p.cut_length,
                      'primary_body_count', p.primary_body_count,
                      'sum_primary_actual_cut_length', p.sum_primary_actual_cut_length
                  )
              )
              FROM (
                  SELECT
                      j.cut_length,
                      COUNT(b.body_id) AS primary_body_count,
                      SUM(b.actual_cut_length) AS sum_primary_actual_cut_length
                  FROM kwis_jobs_log j
                  LEFT JOIN kwis_body_log b
                      ON b.job_id = j.job_id
                    AND b.robro_roll_id = j.robro_roll_id
                    AND b.body_cut_type = 'P'
                  WHERE j.robro_roll_id = r.robro_roll_id
                    AND j.cut_length IS NOT NULL
                  GROUP BY j.cut_length
              ) p
          ) AS primary_body_data,

          /* ---------- SECONDARY ---------- */
          (
              SELECT JSON_ARRAYAGG(
                  JSON_OBJECT(
                      'secondary_cut_length', s.secondary_cut_length,
                      'secondary_body_count', s.secondary_body_count,
                      'sum_secondary_actual_cut_length', s.sum_secondary_actual_cut_length
                  )
              )
              FROM (
                  SELECT
                      j.secondary_cut_length,
                      COUNT(b.body_id) AS secondary_body_count,
                      SUM(b.actual_cut_length) AS sum_secondary_actual_cut_length
                  FROM kwis_jobs_log j
                  LEFT JOIN kwis_body_log b
                      ON b.job_id = j.job_id
                    AND b.robro_roll_id = j.robro_roll_id
                    AND b.body_cut_type = 'S'
                  WHERE j.robro_roll_id = r.robro_roll_id
                    AND j.secondary_cut_length IS NOT NULL
                  GROUP BY j.secondary_cut_length
              ) s
          ) AS secondary_body_data,

          /* ---------- TERTIARY ---------- */
          (
              SELECT JSON_ARRAYAGG(
                  JSON_OBJECT(
                      'tertiary_cut_length', t.tertiary_cut_length,
                      'tertiary_body_count', t.tertiary_body_count,
                      'sum_tertiary_actual_cut_length', t.sum_tertiary_actual_cut_length
                  )
              )
              FROM (
                  SELECT
                      j.tertiary_cut_length,
                      COUNT(b.body_id) AS tertiary_body_count,
                      SUM(b.actual_cut_length) AS sum_tertiary_actual_cut_length
                  FROM kwis_jobs_log j
                  LEFT JOIN kwis_body_log b
                      ON b.job_id = j.job_id
                    AND b.robro_roll_id = j.robro_roll_id
                    AND b.body_cut_type = 'T'
                  WHERE j.robro_roll_id = r.robro_roll_id
                    AND j.tertiary_cut_length IS NOT NULL
                  GROUP BY j.tertiary_cut_length
              ) t
          ) AS tertiary_body_data

      FROM (
          SELECT DISTINCT robro_roll_id
          FROM kwis_jobs_log
          WHERE robro_roll_id = ?
      ) r;
      `;


    const getWastageSql = `SELECT 
          COUNT(*) AS body_cut_type_D_count,
          SUM(actual_cut_length) AS total_wastage_length
      FROM kwis_body_log
      WHERE robro_roll_id = ? 
        AND body_cut_type = 'D';`

    await db.addQuery("getRollSql", getRollSql);
    await db.addQuery("getBodyInfoSql", getBodyInfoSql);
    await db.addQuery("getWastageSql", getWastageSql);

    const params = [rollid, rollid, rollid,rollid,rollid,rollid,rollid];
    const getRollResult = await db.runQuery("getRollSql", params);
    const getBodyInfoResult = await db.runQuery("getBodyInfoSql", params);

    if (!getRollResult.success ) {
      return res.status(501).json({ status: false, error: getRollResult.error });
    }
    if (!getRollResult.data || getRollResult.data.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Roll not found",
      });
    }

    if (!getBodyInfoResult.success) {
      return res.status(501).json({ status: false, error: getBodyInfoResult.error });
    }

    const getWastageResult = await db.runQuery("getWastageSql", params);
    getRollResult.data[0].total_wastage_length = (getWastageResult.data[0].total_wastage_length / 1000) || 0;
    getRollResult.data[0].body_cut_type_D_count = getWastageResult.data[0].body_cut_type_D_count || 0;
    const kg_wastage = getWastageResult.data[0].total_wastage_length > 0 ? ((getWastageResult.data[0].total_wastage_length/1000) * (getRollResult.data[0].width/1000) * getRollResult.data[0].gsm)/1000 : 0;
    getRollResult.data[0].kg_wastage = kg_wastage || 0; 
    

    //attach body info data
    getRollResult.data[0].body_info = getBodyInfoResult.data[0];
    
    const currentDate = new Date();
    const formattedTimestamp = formatTimestamp(currentDate);

    const updateTotalCount = `UPDATE kwis_rolls_log SET total_defects = ?, updated_at = ? WHERE robro_roll_id = ?;`;
    await db.addQuery("updateTotalCount", updateTotalCount);
    const params1 = [getRollResult.data[0].defect_count, formattedTimestamp, rollid];
    const updateTotalCountResult = await db.runQuery("updateTotalCount", params1);
    if (!updateTotalCountResult.success) {
      return res.status(501).json({ status: false, error: updateTotalCountResult.error });
    }

    return res.status(200).json({
      status: true,
      message: "success",
      data: getRollResult.data,
    });

  } catch (error) {
    console.error("Error:", error);
    return res.status(501).json({
      status: false,
      message: "An error occurred",
    });
  }
};

const getPieChartData = async (req, res, next) => {
  try {
    const rollid = req.params.rollid;

    const defectSql = `SELECT type, COUNT(*) AS count
                      FROM (
                      SELECT 
                      SUBSTRING_INDEX(defect_type, ' ', 1) AS type
                      FROM kwis_defects_log
                      WHERE robro_roll_id = ?
                      AND delete_status = 0
                      ) t
                      GROUP BY type;`

    await db.addQuery("defectSql", defectSql);
    const params = [rollid];
    const defectResult = await db.runQuery("defectSql", params);
    if (!defectResult.success) {
      return res.status(501).json({ status: false, error: defectResult.error });
    }

    return res.status(200).json({
      status: true,
      message: "success",
      defects: defectResult.data,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(501).json({
      status: false,
      message: "An error occurred",
    });
  }
};


//update roll details
const updateRoll = async (req, res, next) => {
  const { roll_id, status, current_repair_meter = 0 } = req.body;
  let currentmeter;
  if (current_repair_meter || current_repair_meter == 0) {
    currentmeter = current_repair_meter.toString();
  }

  const date = new Date();
  const end_time = `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
      .getHours()
      .toString()
      .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
        .getSeconds()
        .toString()
        .padStart(2, "0")}`;
  const updated_at = end_time;

  let updateQuery;
  let values = [updated_at];
  let message;
  if (!roll_id) {
    return res.status(501).json({ status: false, meassge: "id not found" });
  }
  if (status === "REVIEWED") {
    updateQuery =
      "UPDATE kwis_rolls_log SET roll_status = 2,  updated_at = ? WHERE robro_roll_id = ?";
    await db.addQuery("updateQuery", updateQuery);
    message = "Reviewed";
  } else if (status === "REPAIR") {
    if (!currentmeter) {
      return res
        .status(501)
        .json({ status: false, meassge: "current_repair_meter is requried!!!!" });
    }
    updateQuery =
      "UPDATE kwis_rolls_log SET roll_status = 4, updated_at = ?, current_repair_meter=? WHERE robro_roll_id = ?";
    await db.addQuery("updateQuery", updateQuery);
    message = "Repair";
    values.push(parseFloat(current_repair_meter));
  } else if (status === "HALF_REPAIR") {
    if (!currentmeter) {
      return res
        .status(501)
        .json({ status: false, meassge: "current_repair_meter is requried!!!!" });
    }
    updateQuery =
      "UPDATE kwis_rolls_log SET roll_status = 3, updated_at = ?, current_repair_meter=? WHERE robro_roll_id = ?";
    await db.addQuery("updateQuery", updateQuery);
    message = "Half Repair";
    values.push(parseFloat(current_repair_meter));
  } else if (status === "START_REVIEW") {
    updateQuery =
      "UPDATE kwis_rolls_log SET roll_status = 5, updated_at = ? WHERE robro_roll_id = ?";
    await db.addQuery("updateQuery", updateQuery);
    message = "Start Review";
  }

  values.push(roll_id);
  const result = await db.runQuery("updateQuery", values);

  if (!result?.success) {
    return console.error(result.error);
  }

  return res.status(200).json({
    status: true,
    error: `Roll ${message} successfully`,
  });
};

//get all roll width data
const getAllRollWidth = async (req, res, next) => {
  const { roll_id } = req.body;

  if (!roll_id) {
    return res
      .status(501)
      .json({ status: false, message: "roll_id not found" });
  }

  let sql = "select * from kwis_roll_width_log where robro_roll_id = ? ORDER BY running_meter ASC";
  db.addQuery("getRole", sql);
  let params = [roll_id];
  const result = await db.runQuery("getRole", params);

  if (!result?.success) {
    res.status(501).json({
      status: false,
      message: result.error,
    });
    return;
  }
  res.status(200).json({
    status: true,
    message: "success",
    data: result.data,
  });
};

// note
const saveNote = async (req, res, next) => {
  const { robro_roll_id, note } = req.body;

  if (!robro_roll_id) {
    return res.status(501).json({ status: false, message: "robro_roll_id is missing" });
  }
  const currentDate = new Date();
  const formattedTimestamp = formatTimestamp(currentDate);
  const updatedNote = note || "";
  let sql = "UPDATE kwis_rolls_log SET note = ?,updated_at = ? WHERE robro_roll_id = ?";
  db.addQuery("updateNote", sql);
  let params = [updatedNote, formattedTimestamp, robro_roll_id];
  const result = await db.runQuery("updateNote", params);

  if (!result?.success) {
    res.status(501).json({
      status: false,
      message: result.error,
    });
    return;
  }

  res.status(200).json({
    status: true,
    message: "Note added successfully",
    data: result.data,
  });
};

const getNote = async (req, res, next) => {
  const { robro_roll_id } = req.params;
  if (!robro_roll_id) {
    return res.status(400).json({ status: false, message: "robro_roll_id is missing" });
  }
  try {
    let sql = "SELECT note FROM kwis_rolls_log WHERE robro_roll_id = ?";
    db.addQuery("getNote", sql);
    const result = await db.runQuery("getNote", [robro_roll_id]);
    if (!result?.data || result.data.length === 0) {
      return res.status(404).json({ status: false, message: "No note found for the given robro_roll_id" });
    }
    res.status(200).json({
      status: true,
      message: "Note fetched successfully",
      data: result.data[0],
    });
  } catch (error) {
    console.error("Error in getNote:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred while fetching the note",
      error: error.message,
    });
  }
};

const saveUserTag = async (req, res, next) => {
  const { robro_roll_id, newTagIds } = req.body; // Renamed tag_id to newTagIds for clarity

  // 1. Validate Input
  if (!robro_roll_id || !Array.isArray(newTagIds)) {
    return res.status(400).json({
      status: false,
      message: "Invalid request: robro_roll_id and tag_id (array) are required.",
    });
  }

  try {
    // Start a transaction (assuming db object has transaction methods like beginTransaction, commit, rollback)
    // If your db connection doesn't support explicit transactions this way, you'll need to adjust.
    // await db.beginTransaction();

    // 2. Get Existing Tags for the given roll from kwis_tag_settings
    const getExistingTagsSql = `SELECT user_tag_id FROM kwis_tag_settings WHERE robro_roll_id = ?`;
    db.addQuery('getExistingTags', getExistingTagsSql);
    const existingTagsResult = await db.runQuery('getExistingTags', [robro_roll_id]);

    if (!existingTagsResult?.success) {
      // await db.rollback();
      return res.status(500).json({
        status: false,
        message: "Failed to retrieve existing tags.",
        error: existingTagsResult?.error || "Unknown error",
      });
    }

    const existingTagIds = existingTagsResult.data.map(row => row.user_tag_id);
    const existingTagIdsSet = new Set(existingTagIds);
    const newTagIdsSet = new Set(newTagIds);

    // 3. Determine Tags to Add (newTagIds not in existingTagIds)
    const tagsToAdd = newTagIds.filter(id => !existingTagIdsSet.has(id));

    // 4. Determine Tags to Remove (existingTagIds not in newTagIds)
    const tagsToRemove = existingTagIds.filter(id => !newTagIdsSet.has(id));

    // 5. Perform Deletes for tags no longer selected
    if (tagsToRemove.length > 0) {
      // Dynamically build the IN clause for deletion
      const deleteSql = `DELETE FROM kwis_tag_settings WHERE robro_roll_id = ? AND user_tag_id IN (${tagsToRemove.map(() => '?').join(',')})`;
      db.addQuery('deleteTags', deleteSql); // Re-registering query if it's dynamic
      const deleteResult = await db.runQuery('deleteTags', [robro_roll_id, ...tagsToRemove]);

      if (!deleteResult?.success) {
        // await db.rollback();
        return res.status(500).json({
          status: false,
          message: "Failed to remove old tags.",
          error: deleteResult?.error || "Unknown error",
        });
      }
    }

    // 6. Perform Inserts for newly selected tags
    if (tagsToAdd.length > 0) {
      // Prepare values for bulk insert: (robro_roll_id, tag_id), (robro_roll_id, tag_id), ...
      const insertValues = tagsToAdd.map(tagId => `(?, ?)`).join(',');
      const insertSql = `INSERT INTO kwis_tag_settings (robro_roll_id, user_tag_id) VALUES ${insertValues}`;
      db.addQuery('insertTags', insertSql); // Re-registering query if it's dynamic

      // Flatten the parameters array: [robro_roll_id, tag1, robro_roll_id, tag2, ...]
      const insertParams = [];
      tagsToAdd.forEach(tagId => {
        insertParams.push(robro_roll_id);
        insertParams.push(tagId);
      });

      const insertResult = await db.runQuery('insertTags', insertParams);

      if (!insertResult?.success) {
        // await db.rollback();
        return res.status(500).json({
          status: false,
          message: "Failed to add new tags.",
          error: insertResult?.error || "Unknown error",
        });
      }
    }

    // await db.commit();
    const currentDate = new Date();
    const formattedTimestamp = formatTimestamp(currentDate);
    const updateRollQuery = "UPDATE kwis_rolls_log SET updated_at = ? WHERE robro_roll_id = ?";
    const updateRollValue = [formattedTimestamp,robro_roll_id]

    db.addQuery("updateRollQuery",updateRollQuery);
    const updateRollRe = await db.runQuery("updateRollQuery",updateRollValue);

    if(!updateRollRe.success){
      return res.status(501).json({
        status: false,
        error: updateRollRe.error,
      })
    }
    res.status(200).json({
      status: true,
      message: "User tags updated successfully.",
    });

  } catch (error) {
    // await db.rollback();
    console.error("Error in saveUserTag:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred while updating user tags.",
      error: error.message,
    });
  }
}
const UpdateDefectsName = async (req, res, next) => {
  const { defect_id, defect_type,robro_roll_id } = req.body;
 
  // Validate required fields
  if (!defect_id || !defect_type) {
    return res.status(400).json({ status: false, message: "Missing required fields" });
  }
 
  // SQL update query
  const sql = `UPDATE kwis_defects_log SET defect_type = ? WHERE defect_id = ? AND robro_roll_id = ?`;
 
  db.addQuery("updateDefectType", sql);
  const params = [defect_type, defect_id, robro_roll_id];

  // Run the query
  const result = await db.runQuery("updateDefectType", params);
 
  if (!result?.success) {
    return res.status(500).json({
      status: false,
      message: result.error || "Failed to update defect type",
    });
  }

  const currentDate = new Date();
  const formattedTimestamp = formatTimestamp(currentDate);
  const updateRollQuery = "UPDATE kwis_rolls_log SET updated_at = ? WHERE robro_roll_id = ?";
  const updateRollValue = [formattedTimestamp,robro_roll_id]

  db.addQuery("updateRollQuery",updateRollQuery);
  const updateRollRe = await db.runQuery("updateRollQuery",updateRollValue);

  if(!updateRollRe.success){
    return res.status(501).json({
      status: false,
      error: updateRollRe.error,
    })
  }
 
  // Return success
  return res.status(200).json({
    status: true,
    message: "Defect type updated successfully",
    data: result.data,
  });
};

const updateDefectScore = async (req, res, next) => {
  const { defect_id, robro_roll_id, is_score } = req.body;

  if (!defect_id || !robro_roll_id) {
    return res.status(400).json({ status: false, message: "Missing required fields" });
  }

  const sql = `UPDATE kwis_defects_log SET is_score = ? WHERE defect_id = ? AND robro_roll_id = ?`;
  db.addQuery("updateDefectScore", sql);
  const params = [is_score, defect_id, robro_roll_id];

  const result = await db.runQuery("updateDefectScore", params);

  if (!result?.success) {
    return res.status(500).json({
      status: false,
      message: result.error || "Failed to update defect score",
    });
  }

  const currentDate = new Date();
  const formattedTimestamp = formatTimestamp(currentDate);
  const updateRollQuery = "UPDATE kwis_rolls_log SET updated_at = ? WHERE robro_roll_id = ?";
  const updateRollValue = [formattedTimestamp, robro_roll_id];

  db.addQuery("updateRollQuery", updateRollQuery);
  const updateRollRe = await db.runQuery("updateRollQuery", updateRollValue);

  if (!updateRollRe.success) {
    return res.status(501).json({ status: false, error: updateRollRe.error });
  }

  return res.status(200).json({
    status: true,
    message: "Defect score updated successfully",
    data: { is_score }
  });
};
 
const downloadPdf = async (req, res, next) => {
  try {
    const { roll_id, total_defect_count, userName,version, image_view, map_view, defect_type_filter, defect_status_filter, logo, length_in_meter_per_page,defect_id_reset,ai_suggestion,inspected_length,location_filter,xLocationStart,xLocationEnd,yLocationStart,yLocationEnd,slittingData,default_pdf_Status   } = req.body;
    let end_limit;
    if (total_defect_count > 2000) {
      end_limit = 2000;
    } else {
      end_limit = total_defect_count;
    }
    let sql = `SELECT * FROM kwis_defects_log WHERE robro_roll_id = ?`;
    let values = [roll_id];

    if(xLocationStart !== null && xLocationStart !== '')
    {
      sql += ` AND defect_top_left_x_mm >= ?`;
      values.push(xLocationStart);
    }

    if(xLocationEnd !== null && xLocationEnd !== '')
    {
      sql += ` AND defect_top_left_x_mm <= ?`;
      values.push(xLocationEnd);
    }

    if(yLocationStart !== null && yLocationStart !== '')
    {
      sql += ` AND defect_top_left_y_mm >= ?`;
      values.push(yLocationStart);
    }

    if(yLocationEnd !== null && yLocationEnd !== '')
    {
      sql += ` AND defect_top_left_y_mm <= ?`;
      values.push(yLocationEnd);
    }

    if (defect_status_filter.length === 0) {
      sql += ` AND delete_status = 0 `;
    }

    if (defect_type_filter.length > 0) {
      const likeClauses = defect_type_filter.map(type => `defect_type LIKE '${type}%'`);
      sql += ` AND (${likeClauses.join(' OR ')})`;
    }

    if (defect_status_filter.length > 0) {
      const filterGroups = {
        deleted: "(delete_status = 1)",
        merged: "(delete_status = 2 AND merge_status = 1)",
        spliced: "(delete_status = 0 AND kwis_defects_log.splice_id IS NOT NULL)",
        repaired: "(delete_status = 0 AND repair_status = 1)",
        suggest_for_deletion: "(delete_status = 0 AND suggest_for_deletion = 1)",
        na: "(delete_status = 0 AND (merge_status = 0 OR merge_status IS NULL) AND (repair_status = 0 OR repair_status IS NULL) AND (splice_id IS NULL OR splice_id = '') AND (suggest_for_deletion = 0 OR suggest_for_deletion IS NULL))",
        enable: "(delete_status = 0 AND is_enabled = 1)",
        disable: "(delete_status = 0 AND is_enabled = 0)"
      };

      const checkArray1 = ["deleted", "merged", "spliced", "repaired", "suggest_for_deletion", "na", "enable", "disable"].filter(val => defect_status_filter.includes(val));
      sql += " AND (" + checkArray1.map(val => filterGroups[val]).join(" OR ") + ")";
    }
    sql = `SELECT COUNT(*) AS total_count FROM ( ${sql} ) AS subquery`;
    db.addQuery("sql", sql);
    let total_data_count = await db.runQuery("sql", values)

    let firstPagePdfdata;
    if(ai_suggestion || default_pdf_Status)
    {
      firstPagePdfdata = await firstPageAiSuggestionPdf(roll_id, logo, userName,version,total_data_count.data[0].total_count,defect_type_filter,defect_status_filter,location_filter,xLocationStart,xLocationEnd,yLocationStart,yLocationEnd,slittingData);
    }
    else
    {
      firstPagePdfdata = await firstPagePdf(roll_id, logo, userName,version,total_data_count.data[0].total_count,defect_type_filter,defect_status_filter,location_filter,xLocationStart,xLocationEnd,yLocationStart,yLocationEnd,slittingData);
    }
    
    let page_num = firstPagePdfdata.pageNumber
     let start_range = 0;
      let end_range = length_in_meter_per_page;
      // let page_num = 2
      let numnumber_of_defects = 0;
      let pdfContent = []
      getAllMapView(roll_id, logo, userName,version, firstPagePdfdata.customer_roll_id, start_range, end_range, total_data_count.data[0].total_count, page_num+1 , numnumber_of_defects, pdfContent, length_in_meter_per_page,defect_status_filter,defect_type_filter,inspected_length,xLocationStart,xLocationEnd,yLocationStart,yLocationEnd).then(async (mapPdfContent) => { // Use async here
        if (map_view) {
            const mergedPdf = await mergePDFs(firstPagePdfdata, mapPdfContent ,ai_suggestion); // Await the merged PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=Roll_Details.pdf');

            return res.status(200).end(mergedPdf); // Send the resolved mergedPdf as the response

        }else{
          if (image_view) {
            getpdfData(roll_id, logo, 0, end_limit, [],page_num, userName,version, firstPagePdfdata.customer_roll_id, defect_type_filter, defect_status_filter, total_data_count.data[0].total_count,defect_id_reset,xLocationStart,xLocationEnd,yLocationStart,yLocationEnd)
              .then(async (imagePdfContent) => { // Use async here
                let allBuffersToMerge = [firstPagePdfdata.content];
                // const mergedPdf = await mergePDFs(firstPagePdfdata, pdfContent, ai_suggestion); // Await the merged PDF

                if (mapPdfContent && mapPdfContent.length > 0) {
                  allBuffersToMerge.push(...mapPdfContent);
                }
                if (total_data_count.data[0].total_count === 0) {
                  const pdfDoc1 = await PDFDocument.load(imagePdfContent[0]);
                  // Remove the second page (index 1)
                  pdfDoc1.removePage(1); // Removes the second page

                  const removePagePdf = await PDFDocument.create();

                  // Copy pages from the modified first PDF (without the second page)
                  const pages1 = await removePagePdf.copyPages(pdfDoc1, pdfDoc1.getPageIndices());
                  pages1.forEach((page) => removePagePdf.addPage(page));

                  imagePdfContent = await removePagePdf.save();
                  allBuffersToMerge.push(...[imagePdfContent]);
                }
                else
                  allBuffersToMerge.push(...imagePdfContent);
                const mergedPdf = await finalMergePDFs(allBuffersToMerge, firstPagePdfdata.isNoteOverflow, ai_suggestion);


                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename=Roll_Details.pdf');

                return res.status(200).end(mergedPdf); // Send the resolved mergedPdf as the response
              })
              .catch((error) => {
                return res.status(501).json({ message: 'PDF generation failed' });
              });
          }
          else {
            const pdf = await createTableViewPdf(roll_id, logo, userName, version, firstPagePdfdata.customer_roll_id, page_num, defect_type_filter, defect_status_filter, defect_id_reset, xLocationStart, xLocationEnd, yLocationStart, yLocationEnd); // Call the service function to generate the PDF
            if (pdf.success) {
              let pdfContent = pdf.content;
              if (pdf.pageNumber == 2 || total_data_count.data[0].total_count === 0) {
                const pdfDoc1 = await PDFDocument.load(pdf.content);
                // Remove the second page (index 1)
                pdfDoc1.removePage(1); // Removes the second page

                const removePagePdf = await PDFDocument.create();

                // Copy pages from the modified first PDF (without the second page)
                const pages1 = await removePagePdf.copyPages(pdfDoc1, pdfDoc1.getPageIndices());
                pages1.forEach((page) => removePagePdf.addPage(page));

                pdfContent = await removePagePdf.save();
              }
              let allBuffersToMerge = [firstPagePdfdata.content];
              // const mergedPdf = await mergePDFs(firstPagePdfdata, pdfContent, ai_suggestion); // Await the merged PDF

              if (mapPdfContent && mapPdfContent.length > 0) {
                allBuffersToMerge.push(...mapPdfContent);
              }
              // const mergedPdf = await mergePDFs(firstPagePdfdata, [pdfContent], ai_suggestion);
              allBuffersToMerge.push(...[pdfContent]);
              const mergedPdf = await finalMergePDFs(allBuffersToMerge, firstPagePdfdata.isNoteOverflow, ai_suggestion);
              // Set headers for downloading the PDF
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', 'attachment; filename=Roll_Details.pdf');

              return res.end(mergedPdf, 'binary'); // Send the binary PDF content as the response
            } else {
              return res.status(404).json({ message: 'PDF generation failed' });
            }
          }
        }
      })
      .catch((error) => {
        return res.status(501).json({ message: error });
      });

  } catch (error) {
     next(err); // Pass errors to the error handler
  }
}
const getAllMapView = async (roll_id,logo, userName,version, customer_roll_id, start_range, end_range, total_defect_count, page_num, number_of_defects, pdfContent, length_in_meter_per_page,defect_status_filter,defect_type_filter,inspected_length,xLocationStart,xLocationEnd,yLocationStart,yLocationEnd) => {
  return new Promise(async (resolve, reject) => {
    try {
      const allMapViews = await createMapViewPdf(roll_id, logo, userName,version, customer_roll_id, start_range, end_range, total_defect_count, page_num,defect_status_filter,defect_type_filter,inspected_length,xLocationStart,xLocationEnd,yLocationStart,yLocationEnd);
      if (allMapViews.success) {
        number_of_defects += allMapViews.number_of_defects;
        start_range = end_range;
        if(inspected_length - end_range < length_in_meter_per_page){
          end_range = inspected_length;
        }else{  
        end_range += length_in_meter_per_page;
        }
        page_num += 1

        const pdfDoc1 = await PDFDocument.load(allMapViews.content);
        // Remove the second page (index 1)
        pdfDoc1.removePage(1); // Removes the second page

        const removePagePdf = await PDFDocument.create();

        // Copy pages from the modified first PDF (without the second page)
        const pages1 = await removePagePdf.copyPages(pdfDoc1, pdfDoc1.getPageIndices());
        pages1.forEach((page) => removePagePdf.addPage(page));

        pdfContentRemove = await removePagePdf.save();
        pdfContent.push(pdfContentRemove);
        if(total_defect_count - number_of_defects !== 0){
          getAllMapView(roll_id,logo, userName,version, customer_roll_id, start_range, end_range, total_defect_count, page_num, number_of_defects, pdfContent, length_in_meter_per_page,defect_status_filter,defect_type_filter,inspected_length,xLocationStart,xLocationEnd,yLocationStart,yLocationEnd)
          .then(resolve)  // Resolve after the recursion completes
          .catch(reject); // Handle any errors in the recursion;
        }else{
          resolve(pdfContent)
        }
      }
      else{
        resolve(false)
      }
      // resolve(allMapViews);
    } catch (err) {
      reject(err);
    }
  });
}
function getpdfData(roll_id, logoPath, start_limit, end_limit, pdfContent, pageNumber, userName,version, customer_roll_id, defect_type_filter, defect_status_filter, total_count,defect_id_reset,xLocationStart,xLocationEnd,yLocationStart,yLocationEnd) {
  return new Promise(async (resolve, reject) => {
    try {
      const pdf = await createImageViewPdf(roll_id, logoPath, start_limit, end_limit, pageNumber, userName,version, customer_roll_id, defect_type_filter, defect_status_filter,defect_id_reset,xLocationStart,xLocationEnd,yLocationStart,yLocationEnd); // Call the service function to generate the PDF
      if (pdf.success) {
        pdfContent.push(pdf.content); // Push the binary PDF content to pdfContent
        const pageValue = pdf.pageNumber;
        start_limit = end_limit;
        if(total_count === pdf.dataCount){
          total_count = end_limit
        }
        if (total_count - end_limit > 2000) {
          end_limit += 2000;
          // Recursively call the function and chain promises
          getpdfData(roll_id, logoPath, start_limit, end_limit, pdfContent, pageValue, userName,version, customer_roll_id, defect_type_filter, defect_status_filter,total_count, defect_id_reset,xLocationStart,xLocationEnd,yLocationStart,yLocationEnd)
            .then(resolve)  // Resolve after the recursion completes
            .catch(reject); // Handle any errors in the recursion
        } else if (total_count - end_limit === 0) {
          resolve(pdfContent);  // Base case: all data processed, resolve the final content
        } else {
          end_limit = total_count;
          // Handle the case where fewer than 2 items are left
          getpdfData(roll_id, logoPath, start_limit, end_limit, pdfContent, pageValue, userName,version, customer_roll_id, defect_type_filter, defect_status_filter,total_count, defect_id_reset,xLocationStart,xLocationEnd,yLocationStart,yLocationEnd)
            .then(resolve)  // Resolve after this final batch completes
            .catch(reject); // Handle any errors in the recursion
        }
      } else {
        reject(new Error('PDF generation failed')); // Reject if PDF generation fails
      }
    } catch (err) {
      reject(err); // Reject in case of any errors during the process
    }
  });
}
// Function to merge two PDFs using pdf-lib
async function mergePDFs(pdf1Buffer, pdfContent, ai_suggestion) {
  const pdfDoc1 = await PDFDocument.load(pdf1Buffer.content);
  if(!ai_suggestion || !pdf1Buffer?.isNoteOverflow)
  {
    // Remove the second page (index 1)
    pdfDoc1.removePage(1); // Removes the second page
  }

  const mergedPdf = await PDFDocument.create();

  // Copy pages from the modified first PDF (without the second page)
  const pages1 = await mergedPdf.copyPages(pdfDoc1, pdfDoc1.getPageIndices());
  pages1.forEach((page) => mergedPdf.addPage(page));

  // Add pages from the second PDF (pdfContent)
  for (let i = 0; i < pdfContent.length; i++) {
    if(pdfContent[i])
    {
      const pdfDoc2 = await PDFDocument.load(pdfContent[i]);
      const pages = await mergedPdf.copyPages(pdfDoc2, pdfDoc2.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    }
  }

  // Save the merged PDF as bytes
  const mergedPdfBytes = await mergedPdf.save();
  return mergedPdfBytes; // Return the merged PDF as Buffer/Uint8Array
}

async function finalMergePDFs(pdfBuffers,isNoteOverflow, ai_suggestion) {
  const mergedPdf = await PDFDocument.create();
  let i = 0;
  for (let buffer of pdfBuffers) {
    if (!buffer) continue;
    const pdf = await PDFDocument.load(buffer);
     if(i == 0 && (!ai_suggestion || !isNoteOverflow)){
      pdf.removePage(1);
    }
 
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
    i++;
  }
 
  return await mergedPdf.save();
}

const getUniquedefectsWithColor = async (req, res, next) => {
  try {
    const rollid = req.params.rollid;

    const defectSql =  "SELECT DISTINCT SUBSTRING_INDEX(defect_type, ' ', 1) AS defect_type FROM kwis_defects_log WHERE robro_roll_id = ?;";

    await db.addQuery("defectSql", defectSql);
    const params = [rollid];
    const defectResult = await db.runQuery("defectSql", params);
    if (!defectResult.success) {
      return res.status(501).json({ status: false, error: defectResult.error });
    }
    
    defectResult.data = defectResult.data.map((defect, index) => {
      const randomColor = Colors[Math.floor(Math.random() * Colors.length)];
      return {
          ...defect,
          id: index,
          color: randomColor.colour_code
      };
  });
    return res.status(200).json({
      status: true,
      message: "success",
      defects: defectResult.data,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(501).json({
      status: false,
      message: "An error occurred",
    });
  }
};


const getRollStatus = async (req, res, next) => {
  const { robro_roll_id } = req.body;
  if (!robro_roll_id) return res.status(400).json({ status: false, message: "Missing required fields" });

  const selectSql = "SELECT roll_status FROM kwis_rolls_log WHERE robro_roll_id = ?";
  db.addQuery("selectRollQuery", selectSql);
  const params = [robro_roll_id];
  let result = await db.runQuery("selectRollQuery", params);
  if (!result?.success) return res.status(501).json({ status: false, message: result.error });
  const currentDate = new Date();
  const formattedTimestamp = formatTimestamp(currentDate);
  if (result.data[0].roll_status === 0 || result.data[0].roll_status === null) {
    const updateSql = `UPDATE kwis_rolls_log SET roll_status = 1,updated_at = '${formattedTimestamp}' WHERE robro_roll_id = ?`;
    db.addQuery("updateSql", updateSql);
    await db.runQuery("updateSql", params);
    result = await db.runQuery("selectRollQuery", params);
  }

  const statusMap = ["Inspected", "Reviewed", "Half Repair", "Repair"];
  const status = statusMap[result.data[0].roll_status - 1] || "Unknown";

  res.status(200).json({ status: true, message: `Roll is ${status}` });
}; 
 
const getUniqueCameraIds = async (req, res, next) => {
  try {
    const rollid = req.params.rollid;

    const sql = `
      SELECT DISTINCT group_id, cam_id
      FROM kwis_defects_log
      WHERE robro_roll_id = ? AND cam_id IS NOT NULL
      ORDER BY group_id, cam_id
    `;

    await db.addQuery("getUniqueCameraIds", sql);
    const params = [rollid];

    const result = await db.runQuery("getUniqueCameraIds", params);

    if (!result.success) {
      return res.status(500).json({ status: false, error: result.error });
    }

    // Group cam_ids by group_id
    const groupedData = result.data.reduce((acc, row) => {
      if (!acc[row.group_id]) acc[row.group_id] = [];
      acc[row.group_id].push(row.cam_id);
      return acc;
    }, {});

    // Extract all unique camera IDs (flat)
    const allCameras = [
      ...new Set(result.data.map(row => row.cam_id))
    ];

    return res.status(200).json({
      status: true,
      groups: Object.keys(groupedData).map(groupId => ({
        group_id: groupId,
        cam_ids: groupedData[groupId]
      })),
      cameras: allCameras
    });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred",
    });
  }
};

const getInspectionSpeedData = async (req, res, next) => {
  try {
    const rollid = req.params.rollid;
 
    const sql = `
      SELECT *,current_speed * 60 AS current_speed FROM kwis_inspection_speed_log
      WHERE robro_roll_id = ?
    `;
 
    await db.addQuery("sql", sql);
    const params = [rollid];
 
    const result = await db.runQuery("sql", params);
 
    if (!result.success) {
      return res.status(500).json({ status: false, error: result.error });
    }
 
    return res.status(200).json({
      status: true,
      data: result.data
    });
 
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred",
    });
  }
};

const getReviewRollId = async (req, res, next) => {
  try {
    const sql = `
      SELECT robro_roll_id from kwis_rolls_log
      WHERE roll_status = 5
    `;
 
    await db.addQuery("sql", sql);
 
    const result = await db.runQuery("sql", []);
 
    if (!result.success) {
      return res.status(500).json({ status: false, error: result.error });
    }
 
    return res.status(200).json({
      status: true,
      data: result.data
    });
 
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred",
    });
  }
};

const addUpdateSpliceDetails = async (req, res) => {
  const { rollId, start_meter, end_meter, mode, splice_id  } = req.body;

  if (!rollId || !start_meter || !end_meter || !mode) {
    return res.status(500).json({
      status: false,
      message: "Required feilds missing"
    })
  }
  try {
    if (mode === "add") {
      // ---------- ADD NEW SPLICE ----------
      const insertQuery =
        "INSERT INTO kwis_splice_table (robro_roll_id, splice_start_meter, splice_end_meter, splice_status) VALUES (?,?,?,0)";

      const insertValues = [rollId, start_meter, end_meter];

      await db.addQuery("insertQuery", insertQuery);
      const result = await db.runQuery("insertQuery", insertValues);

      if (!result.success) {
        return res.status(500).json({
          status: false,
          message: result.error,
        });
      }

      const currentDate = new Date();
      const formattedTimestamp = formatTimestamp(currentDate);
      const updateRollQuery = "UPDATE kwis_rolls_log SET updated_at = ? WHERE robro_roll_id = ?";
      const updateRollValue = [formattedTimestamp,rollId]

      db.addQuery("updateRollQuery",updateRollQuery);
      const updateRollRe = await db.runQuery("updateRollQuery",updateRollValue);

      if(!updateRollRe.success){
        return res.status(501).json({
          status: false,
          error: updateRollRe.error,
        })
      }

      return res.status(200).json({
        status: true,
        message: "Splice Inserted Successfully!",
        data: result,
      });
    } else if (mode === "update") {
      // ---------- UPDATE EXISTING SPLICE ----------
      if (!splice_id) {
        return res.status(500).json({
          status: false,
          message: "splice_id is required for update",
        });
      }

      const updateQuery =
        "UPDATE kwis_splice_table SET splice_start_meter=?, splice_end_meter=? WHERE splice_id=? AND robro_roll_id=?";

      const updateValues = [start_meter, end_meter, splice_id, rollId];

      await db.addQuery("updateQuery", updateQuery);
      const result = await db.runQuery("updateQuery", updateValues);

      if (!result.success) {
        return res.status(500).json({
          status: false,
          message: result.error,
        });
      }

      const currentDate = new Date();
      const formattedTimestamp = formatTimestamp(currentDate);
      const updateRollQuery = "UPDATE kwis_rolls_log SET updated_at = ? WHERE robro_roll_id = ?";
      const updateRollValue = [formattedTimestamp,rollId]

      db.addQuery("updateRollQuery",updateRollQuery);
      const updateRollRe = await db.runQuery("updateRollQuery",updateRollValue);

      if(!updateRollRe.success){
        return res.status(501).json({
          status: false,
          error: updateRollRe.error,
        })
      }

      return res.status(200).json({
        status: true,
        message: "Splice Updated Successfully!",
        data: result,
      });
    } else {
      return res.status(500).json({
        status: false,
        message: "Invalid mode. Use 'add' or 'update'.",
      });
    }


  } catch {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
 
}

const deleteSpliceDetails = async (req, res) => {
  const { splice_id, rollId } = req.body;

  // Validate inputs
  if (!splice_id || !rollId) {
    return res.status(500).json({
      status: false,
      message: "splice_id and rollId are required"
    });
  }

  try {
    const deleteQuery =
      "DELETE FROM kwis_splice_table WHERE splice_id = ? AND robro_roll_id = ?";

    const deleteValues = [splice_id, rollId];

    await db.addQuery("deleteQuery", deleteQuery);
    const result = await db.runQuery("deleteQuery", deleteValues);

    if (!result.success) {
      return res.status(500).json({
        status: false,
        message: result.error,
      });
    }

    // If no rows deleted → splice_id not found
    if (result.data.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: "Splice not found or already deleted",
      });
    }

    const currentDate = new Date();
    const formattedTimestamp = formatTimestamp(currentDate);
    const updateRollQuery = "UPDATE kwis_rolls_log SET updated_at = ? WHERE robro_roll_id = ?";
    const updateRollValue = [formattedTimestamp,rollId]

    db.addQuery("updateRollQuery", updateRollQuery);
    const updateRollRe = await db.runQuery("updateRollQuery", updateRollValue);

    if (!updateRollRe.success) {
      return res.status(501).json({
        status: false,
        error: updateRollRe.error,
      })
    }

    return res.status(200).json({
      status: true,
      message: "Splice Deleted Successfully!",
      data: result
    });

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message
    });
  }
};


const getRepairSpeedData = async (req, res, next) => {
  try {
    const rollid = req.params.rollid;
 
    const sql = `SELECT *,current_speed * 60 AS current_speed FROM kwis_repair_speed_log WHERE robro_roll_id = ?`;
 
    await db.addQuery("sql", sql);
    const params = [rollid];
 
    const result = await db.runQuery("sql", params);
 
    if (!result.success) {
      return res.status(500).json({ status: false, error: result.error });
    }
 
    return res.status(200).json({
      status: true,
      data: result.data
    });
 
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred",
    });
  }
};

const getSpliceData = async (req, res) => {
  try {
    const rollid = req.params.rollid;

    const sql = `
      SELECT s.*,
          JSON_ARRAYAGG(d.defect_id) AS defect_ids
      FROM kwis_splice_table s
      LEFT JOIN kwis_defects_log d
          ON d.robro_roll_id = s.robro_roll_id
        AND (d.defect_top_left_y_mm/1000) BETWEEN s.splice_start_meter AND s.splice_end_meter 
        AND d.splice_id is null
      WHERE s.robro_roll_id = ? and s.splice_status = 0
      GROUP BY s.splice_id;
    `; 

    await db.addQuery("sql", sql);
    const params = [rollid];

    const result = await db.runQuery("sql", params);

    if (!result.success) {
      return res.status(500).json({ status: false, error: result.error });
    }

    return res.status(200).json({
      status: true,
      data: result.data
    });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred",
    });
  }
}

const checkRollExists = async (req, res, next) => {
  try {
    const { customer_roll_id } = req.body;

    if (!customer_roll_id) {
      return res.status(400).json({
        status: false,
        message: "customer_roll_id is missing",
      });
    }

    // Direct existence check query
    const checkSql = `
      SELECT EXISTS (
        SELECT 1 FROM kwis_rolls_log WHERE customer_roll_id = ?
      ) AS roll_exists;
    `;

    db.addQuery("checkRollExistQuery", checkSql);
    const result = await db.runQuery("checkRollExistQuery", [customer_roll_id]);

    if (!result?.success) {
      return res.status(501).json({
        status: false,
        message: result.error || "Database query failed",
      });
    }

    // Parse result
    const exists = !!result.data[0].roll_exists;

    return res.status(200).json({
      status: true,
      exists,
      message: exists
        ? "customer_roll_id exists"
        : "customer_roll_id not found",
    });
  } catch (err) {
    console.error("Error checking roll:", err);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};


const getAllQualityCodes = async (req, res, next) => {
  try {
    const rollid = req.params.rollid;
 
    const sql = `
      SELECT quality_code
      FROM kwis_quality_code_info;
    `;

    await db.addQuery("getAllQualityCodes", sql);
    const params = [rollid];

    const result = await db.runQuery("getAllQualityCodes", params);

    if (!result.success) {
      return res.status(500).json({ status: false, error: result.error });
    }
 
    return res.status(200).json({
      status: true,
      quality_code: result.data.map(row => row.quality_code),
    });
 
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred",
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


const downloadExcel = async (req, res, next) => {
  try {
    const { roll_id, total_defect_count = 32 } = req.body;
    if (!roll_id) {
      return res.status(400).json({ status: false, message: "roll_id is missing" });
    }

    const workbook = new ExcelJS.Workbook();

    // First sheet
    const sheet1 = workbook.addWorksheet("Report 1 A");
    await firstSheet(workbook, sheet1, roll_id);

    // Second sheet with paginated data
    const sheet2 = workbook.addWorksheet("Report 2 B");
    const limit = 10;
    let start = 0, end = Math.min(total_defect_count, limit), addHeader = true;

    while (start < total_defect_count) {
      await createSheet(workbook, sheet2, roll_id, start, end, addHeader);
      addHeader = false;
      start = end;
      end = Math.min(start + limit, total_defect_count);
    }

    // Send response
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=example.xlsx");

    const filePath = path.join(__dirname, "../uploads/Xlsx", `Report_${roll_id}.xlsx`);

    // Save file on server
    await workbook.xlsx.writeFile(filePath);
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("Error creating Excel file: ",err);
    if (!res.headersSent) {
      return res.status(500).json({
        status: false,
        message: "Error creating Excel file",
        error: err.message
      });
    }
  }
};


const getTotalSpliceMeter = async (req, res) => {
  try {
    const rollid = req.params.rollid;

    const sql = `
      SELECT 
          SUM(splice_meter) AS total_splice_length
      FROM 
          kwis_splice_table
      WHERE 
          splice_status = 1 AND robro_roll_id = ?;
    `; 

    await db.addQuery("sql", sql);
    const params = [rollid];

    const result = await db.runQuery("sql", params);

    if (!result.success) {
      return res.status(500).json({ status: false, error: result.error });
    }

    return res.status(200).json({
      status: true,
      splice_meter: result.data[0].total_splice_length || 0
    });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred",
    });
  }
}


module.exports = {
  rolls,
  getRollDetails,
  details,
  updateRoll,
  getAllRollWidth,
  saveNote,
  getNote,
  saveUserTag,
  UpdateDefectsName,
  updateDefectScore,
  downloadPdf,
  getPieChartData,
  getUniquedefectsWithColor,
  getRollStatus,
  getUniqueCameraIds,
  getInspectionSpeedData,
  getReviewRollId,
  addUpdateSpliceDetails,
  deleteSpliceDetails,
  getRepairSpeedData,
  getSpliceData,
  checkRollExists,
  getAllQualityCodes,
  downloadExcel,
  getTotalSpliceMeter
};
