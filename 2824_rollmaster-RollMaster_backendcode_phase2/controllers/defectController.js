const db = require("../connection/dbConnection.js");
const { param } = require("../routes/apiRoute.js");
const Colors = require('../services/colors.js')

const normalizeFilterArray = (value, key) => {
  if (!Array.isArray(value)) {
    return value;
  }

  return value
    .map((item) => {
      if (item && typeof item === "object") {
        if (key && Object.prototype.hasOwnProperty.call(item, key)) {
          return item[key];
        }
        if (Object.prototype.hasOwnProperty.call(item, "item_id")) {
          return item.item_id;
        }
        if (Object.prototype.hasOwnProperty.call(item, "item_text")) {
          return item.item_text;
        }
      }
      return item;
    })
    .filter((item) => item !== undefined && item !== null && item !== "");
};

//delete defect
const defectdelete = async (req, res, next) => {
  const { defect_id,robro_roll_id } = req.body;
  if (defect_id && Array.isArray(defect_id) && defect_id.length > 0) {
    defect_id.forEach(async (defect) => {
      const updateQuery = `
      UPDATE kwis_defects_log
      SET delete_status = 1
      WHERE defect_id = ? AND robro_roll_id = ?;
  `;
      const values = [defect,robro_roll_id];
      db.addQuery("updateQuery", updateQuery);
      const updateQueryRe = await db.runQuery("updateQuery", values);
      if (!updateQueryRe.success) {
        return res.status(501).json({
          status: false,
          error: updateQueryRe.error,
        })
      }
    });
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

    return res.status(201).json({
      status: true,
      error: "All record delete successfully",
    });
  } else {
    return res.status(501).json({
      status: false,
      error: "defect_id not found",
    });
  }
};

//merge defect
const defectMerge = async (req, res, next) => {
  const {
    defect_id,
    cam_id,
    group_id,
    defect_type,
    x_axis,
    y_axis,
    cropped_image_path,
    full_image_path,
    top_left_y,
    defect_width_mm,
    defect_height_mm,
    confidence,
    robro_roll_id,
  } = req.body;
  if (defect_id && Array.isArray(defect_id) && defect_id.length > 0) {
        let getDefectId =
        "SELECT defect_id FROM kwis_defects_log WHERE robro_roll_id = ? ORDER BY defect_id DESC LIMIT 1";
      let value = [robro_roll_id];
      db.addQuery("getDefectId", getDefectId);
      const getDefectIdRe = await db.runQuery("getDefectId", value);
      if (!getDefectIdRe.success) {
        res.status(501).json({
          status: false,
          error: `getDefectIdRe${getDefectIdRe.error}`,
        });
        return;
      }

      const insert_defect_id = getDefectIdRe.data.length > 0 ? getDefectIdRe.data[0].defect_id + 1 : 1;
      const currentDate = new Date();
      const formattedTimestamp = formatTimestamp(currentDate);
      const insertQuery = `
                    INSERT INTO kwis_defects_log 
                    (defect_id,robro_roll_id, group_id, cam_id, defect_top_left_y_mm, defect_top_left_x_mm, defect_width_mm, defect_height_mm, defect_type,confidence,cropped_image_path,full_image_path,defect_top_left_x_px,defect_top_left_y_px,defect_height_px,defect_width_px,body_id,stopping_command_issued,operator_action,updated_at, merge_status,delete_status, is_enabled) 
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,0,?,1,0,1);
                `;
      db.addQuery("insertQuery", insertQuery);

      const defect_id_string = defect_id.join(",");

      const values = [
        insert_defect_id,
        robro_roll_id,
        group_id,
        cam_id,
        y_axis,
        x_axis,
        defect_width_mm,
        defect_height_mm,
        defect_type,
        confidence,
        cropped_image_path,
        full_image_path,
        0,
        0,
        0,
        0,
        0,
        formattedTimestamp
      ];
      const insertQueryRe = await db.runQuery("insertQuery", values);

      if (!insertQueryRe.success) {
        res.status(501).json({
          status: false,
          error: `insertQueryRe${insertQueryRe.error}`,
        });
        return;
      }
      const lastInsertIdQuery = "SELECT IFNULL(MAX(defect_id), 0) AS lastID FROM kwis_defects_log WHERE robro_roll_id = ?";
      db.addQuery("lastInsertIdQuery", lastInsertIdQuery);
      const lastInsertIdRe = await db.runQuery("lastInsertIdQuery", [robro_roll_id]);
      if (!lastInsertIdRe.success) {
        res.status(501).json({
          status: false,
          error: `lastInsertIdQuery${lastInsertIdRe.error}`,
        });
        return;
      }

      const lastID = lastInsertIdRe.data[0].lastID;
      // Split the defect_id_string back to an array and iterate over it
      const defect_ids = defect_id_string.split(",");

      const updatePromises = defect_ids.map((defects) => {
        return new Promise(async (resolve, reject) => {
          const updatequery =
            "UPDATE kwis_defects_log SET delete_status = 2 ,merge_id = ?, merge_status = 1 WHERE defect_id = ?";
          const updatevalue = [lastID,defects];

          db.addQuery("updatequery", updatequery);
          const updatequeryRe = await db.runQuery("updatequery", updatevalue);

          if (!updatequeryRe.success) {
            reject(`updatequeryRe${updatequeryRe.error}`);
          } else {
            resolve();
          }
        });
      });

      Promise.all(updatePromises)
        .then(() => {
          setTimeout(async () => {
              const getmergedefect = `SELECT kwis_defects_log.* 
                  FROM kwis_defects_log 
                  WHERE kwis_defects_log.defect_id = ? AND kwis_defects_log.robro_roll_id = ?`;
               
            const idvalue = [lastID, robro_roll_id];
       
            db.addQuery("getmergedefect", getmergedefect);
            const getmergedefectRe = await db.runQuery(
              "getmergedefect",
              idvalue
            );
            if (!getmergedefectRe.success) {
              return res
                .status(501)
                .json({ status: false, error: getmergedefectRe.error });
            }
            if (getmergedefectRe.data.length > 0) {
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

              return res.status(201).json({
                status: true,
                error: "defects merged successfully",
                new_defect_data: getmergedefectRe.data[0],
              });
            } else {
              return res.status(501).json({
                status: true,
                error: "no records found",
                new_defect_data: [],
              });
            }
          }, 100);
        })
        .catch((error) => {
          res.status(501).json({
            status: false,
            error: error,
          });
        });
    
  } else {
    res.status(501).json({
      status: false,
      error: "defect_id not found",
    });
  }
};

const filterDefects = async (req, res, next) => {
  const {
    roll_id,
    defect_type,
    defect_size,
    defect_size1,
    defect_size2,
    x_axis,
    x_axis1,
    y_axis,
    y_axis1,
    start_limit,
    end_limit,
    sortOrder,
    defect_status_filter,
    camera,
    group_id,
    enable_status,
    slitting_type,
    slitting_id,
    yLocationStart,
    yLocationEnd,
    xLocationStart,
    xLocationEnd,
    showUnmatched
  } = req.body;
  const normalizedDefectType = normalizeFilterArray(defect_type, "item_text");
  const normalizedCamera = normalizeFilterArray(camera, "item_id");
  const normalizedGroupId = normalizeFilterArray(group_id, "item_id");
  const limit = parseInt(end_limit - start_limit);
  const start_limit_int = parseInt(start_limit);

  if (!roll_id) {
    return res.status(501).json({
      status: false,
      error: "Roll_id not found",
    });
  }

  let sql = `SELECT kwis_defects_log.* FROM kwis_defects_log WHERE robro_roll_id = ?`

  let countdefect =
    `SELECT COUNT(kwis_defects_log.defect_id) AS total_count 
     FROM kwis_defects_log 
     WHERE kwis_defects_log.robro_roll_id = ?`;

  let slitting = `SELECT * FROM kwis_slitting_info WHERE robro_roll_id = ?`;

  let slittingparams = [roll_id]

  // if(slitting_type){
  //   slittingparams.push(slitting_type)
  //   slitting += ` AND slitting_type = ?`
  // }
  // if(slitting_id){
  //   slittingparams.push(slitting_id)
  //   slitting += ` AND slitting_id = ?`
  // }
  let params = [roll_id];
  let countparams = [roll_id];
  if (defect_status_filter?.length) {
    const filterGroups = {
      deleted: "(delete_status = 1)",
      merged: "(delete_status = 2 AND merge_status = 1)",
      spliced: "(delete_status = 0 AND kwis_defects_log.splice_id IS NOT NULL)",
      repaired: "(delete_status = 0 AND repair_status = 1)",
      suggest_for_deletion: "(delete_status = 0 AND suggest_for_deletion = 1)",
      suggest_for_rejection: "(delete_status = 0 AND suggest_for_rejection = 1)",
      na: "(delete_status = 0 AND (merge_status = 0 OR merge_status IS NULL) AND (repair_status = 0 OR repair_status IS NULL) AND (splice_id IS NULL OR splice_id = '') AND (suggest_for_deletion = 0 OR suggest_for_deletion IS NULL))",
      enable:"(delete_status = 0 AND is_enabled = 1)",
      disable:"(delete_status = 0 AND is_enabled = 0)"
    };

    const checkArray1 = ["deleted", "merged","spliced","repaired","suggest_for_deletion","suggest_for_rejection","na","enable","disable"].filter(val => defect_status_filter.includes(val));
      sql += " AND (" + checkArray1.map(val => filterGroups[val]).join(" OR ") + ") ";
      countdefect += " AND (" + checkArray1.map(val => filterGroups[val]).join(" OR ") + ") ";
  }
  else {
    sql += " AND delete_status = 0"
    countdefect += " AND delete_status = 0 "
  }
  if (normalizedDefectType && Array.isArray(normalizedDefectType) && normalizedDefectType.length > 0) {
    if(showUnmatched === 'true' || showUnmatched === true)
    {
      sql += " AND (";
      countdefect += " AND (";
      for (let i = 0; i < normalizedDefectType.length; i++) {
        if (i > 0) {
          sql += " AND ";
          countdefect += " AND ";
        }
        sql += "(kwis_defects_log.defect_type NOT LIKE ? OR kwis_defects_log.ai_suggestion = ?)";
        countdefect += "(kwis_defects_log.defect_type NOT LIKE ? OR kwis_defects_log.ai_suggestion = ?)";
        params.push(`${normalizedDefectType[i]}%`, normalizedDefectType[i]);
        countparams.push(`${normalizedDefectType[i]}%`, normalizedDefectType[i]);
      }
      sql += ")";
      countdefect += ")";
    }
    else
    {
      sql += " AND (";
      countdefect += " AND (";
      for (let i = 0; i < normalizedDefectType.length; i++) {
        if (i > 0) {
          sql += " OR ";
          countdefect += " OR ";
        }
        sql += "(kwis_defects_log.defect_type LIKE ? OR kwis_defects_log.ai_suggestion = ?)";
        countdefect += "(kwis_defects_log.defect_type LIKE ? OR kwis_defects_log.ai_suggestion = ?)";
        params.push(`${normalizedDefectType[i]}%`, normalizedDefectType[i]);
        countparams.push(`${normalizedDefectType[i]}%`, normalizedDefectType[i]);
      }
      sql += ")";
      countdefect += ")";
    }
    
  }
  
  if (Array.isArray(normalizedGroupId) && normalizedGroupId.length > 0) {
    const placeholders = normalizedGroupId.map(() => '?').join(',');
    sql += ` AND group_id IN (${placeholders})`;
    countdefect += ` AND group_id IN (${placeholders})`;
    params.push(...normalizedGroupId);
    countparams.push(...normalizedGroupId);
  }

  if (Array.isArray(normalizedCamera) && normalizedCamera.length > 0) {
    const placeholders = normalizedCamera.map(() => '?').join(',');
    sql += ` AND cam_id IN (${placeholders})`;
    countdefect += ` AND cam_id IN (${placeholders})`;
    params.push(...normalizedCamera);
    countparams.push(...normalizedCamera);
  } 
  
  if (defect_size) {
    if (defect_size == "<=") {
      if (showUnmatched === 'true' || showUnmatched === true) {
        sql += " AND NOT ((defect_width_mm * defect_height_mm) <= ?)";
        countdefect += " AND NOT ((defect_width_mm * defect_height_mm) <= ?)";
      } else {
        sql += " AND (defect_width_mm * defect_height_mm) <= ?";
        countdefect += " AND (defect_width_mm * defect_height_mm) <= ?";
      }
      params.push(parseFloat(defect_size1));
      countparams.push(parseFloat(defect_size1));
    }

    else if (defect_size == ">=") {
      if (showUnmatched === 'true' || showUnmatched === true) {
        sql += " AND NOT ((defect_width_mm * defect_height_mm) >= ?)";
        countdefect += " AND NOT ((defect_width_mm * defect_height_mm) >= ?)";
      } else {
        sql += " AND (defect_width_mm * defect_height_mm) >= ?";
        countdefect += " AND (defect_width_mm * defect_height_mm) >= ?";
      }
      params.push(parseFloat(defect_size1));
      countparams.push(parseFloat(defect_size1));
    }

    else if (defect_size == "<>") {
      if (showUnmatched === 'true' || showUnmatched === true) {
        sql += " AND NOT ((defect_width_mm * defect_height_mm) >= ? AND (defect_width_mm * defect_height_mm) <= ?)";
        countdefect += " AND NOT ((defect_width_mm * defect_height_mm) >= ? AND (defect_width_mm * defect_height_mm) <= ?)";
      } else {
        sql += " AND (defect_width_mm * defect_height_mm) >= ? AND (defect_width_mm * defect_height_mm) <= ?";
        countdefect += " AND (defect_width_mm * defect_height_mm) >= ? AND (defect_width_mm * defect_height_mm) <= ?";
      }
      params.push(parseFloat(defect_size1), parseFloat(defect_size2));
      countparams.push(parseFloat(defect_size1), parseFloat(defect_size2));
    }
  }

  if (y_axis || y_axis == 0) {
    if (y_axis !== "") {
      let yaxis = parseFloat(y_axis) * 1000;
      sql += " AND defect_top_left_y_mm >= ? ";
      countdefect += " AND defect_top_left_y_mm >= ? ";
      params.push(parseFloat(yaxis));
      countparams.push(parseFloat(yaxis));
    }
  }
  if (y_axis1 || y_axis1 == 0) {
    if (y_axis1 !== "") {
      let yaxis1 = parseFloat(y_axis1) * 1000;
      sql += " AND defect_top_left_y_mm <= ? ";
      countdefect += " AND defect_top_left_y_mm <= ? ";
      params.push(parseFloat(yaxis1));
      countparams.push(parseFloat(yaxis1));
    }
  }
  if (x_axis || x_axis == 0) {
    if (x_axis !== "") {
      let xaxis = parseFloat(x_axis) * 1000;
      sql += " AND defect_top_left_x_mm >= ? ";
      countdefect += " AND defect_top_left_x_mm >= ? ";
      params.push(parseFloat(xaxis));
      countparams.push(parseFloat(xaxis));
    }
  }
  if (x_axis1 || x_axis1 == 0) {
    if (x_axis1 !== "") {
      let xaxis1 = parseFloat(x_axis1) * 1000;
      sql += " AND defect_top_left_x_mm <= ? ";
      countdefect += " AND defect_top_left_x_mm <= ? ";
      params.push(parseFloat(xaxis1));
      countparams.push(parseFloat(xaxis1));
    }
  }

  if (yLocationStart) {
    if (yLocationStart !== "") {
      let yLocation = parseFloat(yLocationStart);
      sql += " AND defect_top_left_y_mm >= ? ";
      countdefect += " AND defect_top_left_y_mm >= ? ";
      params.push(parseFloat(yLocation));
      countparams.push(parseFloat(yLocation));
    }
  }
  if (yLocationEnd) {
    if (yLocationEnd !== "") {
      let yLocation1 = parseFloat(yLocationEnd);
      sql += " AND defect_top_left_y_mm <= ? ";
      countdefect += " AND defect_top_left_y_mm <= ? ";
      params.push(parseFloat(yLocation1));
      countparams.push(parseFloat(yLocation1));
    }
  }
  if (xLocationStart) {
    if (xLocationStart !== "") {
      let xLocation = parseFloat(xLocationStart);
      sql += " AND defect_top_left_x_mm >= ? ";
      countdefect += " AND defect_top_left_x_mm >= ? ";
      params.push(parseFloat(xLocation));
      countparams.push(parseFloat(xLocation));
    }
  }
  if (xLocationEnd) {
    if (xLocationEnd !== "") {
      let xLocation1 = parseFloat(xLocationEnd);
      sql += " AND defect_top_left_x_mm <= ? ";
      countdefect += " AND defect_top_left_x_mm <= ? ";
      params.push(parseFloat(xLocation1));
      countparams.push(parseFloat(xLocation1));
    }
  }
  
   // Enable/Disable filter
  if (enable_status === '0' || enable_status === 0) {
    sql += " AND is_enabled = 0";
    countdefect += " AND is_enabled = 0";
  } else if (enable_status === '1' || enable_status === 1) {
    sql += " AND is_enabled = 1";
    countdefect += " AND is_enabled = 1";
  }

   // Enable/Disable filter
  if (enable_status === '0' || enable_status === 0) {
    sql += " AND is_enabled = 0";
    countdefect += " AND is_enabled = 0";
  } else if (enable_status === '1' || enable_status === 1) {
    sql += " AND is_enabled = 1";
    countdefect += " AND is_enabled = 1";
  }

  sql += ` ORDER BY kwis_defects_log.defect_top_left_y_mm ${sortOrder} LIMIT ? OFFSET ?`;
  

  db.addQuery("countdefect", countdefect);
  db.addQuery("sql", sql);

  db.addQuery("slitting", slitting);


  params.push(limit);
  params.push(start_limit_int);
  const countdefectRe = await db.runQuery("countdefect", countparams);

  if (!countdefectRe?.success) {
    return res.status(501).json({ error: countdefectRe.error });
  } else {
    const sqlRe = await db.runQuery("sql", params);

    if (!sqlRe?.success) {
      return res.status(501).json({ error: sqlRe.error });
    }

    if (sqlRe?.data.length === 0) {
      return res.status(201).json({
        status: true,
        error: "No records found",
        data: [],
      });
    }
    let slitting_position_data = []
    let slittingRe = {data:[]}
    if(limit ===  50 && start_limit_int ===  0){
       slittingRe = await db.runQuery("slitting", slittingparams);
   
        if (!slittingRe?.success) {
          return res.status(501).json({ error: slittingRe.error });
        }
        
        if(slittingRe.data.length > 0){
          slitting_position_data = slittingRe.data;

          if(slitting_type){
            slitting_position_data = slitting_position_data.filter(item => item.slitting_type === slitting_type);
          }
          if(slitting_id){
             slitting_position_data = slitting_position_data.filter(item => item.slitting_id == slitting_id);
          }
        }
    } 

    return res.status(200).json({
      status: true,
      error: "Success",
      data: sqlRe.data,
      total_defect_filter_count: countdefectRe.data[0].total_count,
      slitting_info: slittingRe.data.length > 0 ? slittingRe.data : [],
      slitting_position_data: slitting_position_data.length>0 ? slitting_position_data : []
    });
  }
};

const updateDefects = async (req, res, next) => {
  const { ai_suggestion_data, model_id, formData,robro_roll_id } = req.body;

  if (!ai_suggestion_data) {
    return res.status(400).json({
      status: false,
      error: "Required data missing",
    });
  }

  const aiSuggestionArray = Object.values(ai_suggestion_data);
  if (!aiSuggestionArray.length) {
    req.body = formData;
    return filterDefects(req, res);
  }

  const currentDate = new Date();
  const formattedTimestamp = formatTimestamp(currentDate);

  // Initialize CASE expressions
  const cases = {
    model_id: '',
    class: '',
    updated_at: ''
  };

  // Composite key list
  const compositeKeys = [];

  aiSuggestionArray.forEach(data => {
    const key = `WHEN defect_id = '${data.defect_id}' AND robro_roll_id = '${robro_roll_id}'`;

    cases.model_id += `${key} THEN '${model_id}' `;
    cases.class += `${key} THEN '${data.class}' `;
    cases.updated_at += `${key} THEN '${formattedTimestamp}' `;

    compositeKeys.push(`('${data.defect_id}', '${robro_roll_id}')`);
  });

  const updatedefectQuery = `
    UPDATE kwis_defects_log 
    SET 
      model_id = CASE ${cases.model_id} END,
      ai_suggestion = CASE ${cases.class} END,
      updated_at = CASE ${cases.updated_at} END
    WHERE (defect_id, robro_roll_id) IN (${compositeKeys.join(', ')});
  `;

  db.addQuery("updateDefectQuery", updatedefectQuery);

  const updatedefectResult = await db.runQuery("updateDefectQuery", []);

  if (!updatedefectResult.success) {
    return res.status(500).json({
      status: false,
      error: updatedefectResult.error,
    });
  }

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
  req.body = formData;
  filterDefects(req, res);
};

const defects = async (req, res, next) => {
  const { roll_id, start_limit, end_limit } = req.body;

  if (!roll_id) {
    return res
      .status(501)
      .json({ status: false, error: "roll_id not defined" });
  }

  const limit = end_limit - start_limit;

  let getdefectforrollid = `SELECT * FROM kwis_defects_log WHERE robro_roll_id = ? AND delete_status = 0 ORDER BY defect_top_left_y_mm ASC LIMIT ? OFFSET ?;`

  db.addQuery("getdefectforrollid", getdefectforrollid);
  let params = [roll_id, limit, start_limit];

  const limitRe = await db.runQuery("getdefectforrollid", params);

  if (!limitRe?.success) {
    res.status(501).json({
      status: false,
      error: limitRe.error,
    });
    return;
  }
  return res.status(200).json({
    status: true,
    error: "success",
    data: limitRe.data,
  });
};

const getdefectfordatatable = async (req, res, next) => {
  const { roll_id, maxNumber, minNumber, draw, order, columns, search } =
    req.body;
 
  const limit = maxNumber - minNumber;
 
  let getDefectsQuery = 
    `SELECT kwis_defects_log.*
    FROM kwis_defects_log
    WHERE robro_roll_id = ? AND delete_status = 0 `;
 
  let countQuery = 
    `SELECT COUNT(kwis_defects_log.defect_id) AS total_defect
    FROM kwis_defects_log
    WHERE kwis_defects_log.robro_roll_id = ?
      AND kwis_defects_log.delete_status = 0 `;
 
  let params = [roll_id];
  let countparam = [roll_id];
 
  // SEARCH FIX (supports D)
  if (search && search.value) {
    let searchValue = `%${search.value}%`;
    let defectIdSearch = null;
 
    if (search.value.startsWith("D")) {
      defectIdSearch = search.value.substring(1);
    }
 
    getDefectsQuery += 
      ` AND (
        kwis_defects_log.confidence LIKE ? OR
        kwis_defects_log.defect_top_left_y_mm LIKE ? OR
        kwis_defects_log.defect_width_mm LIKE ? OR
        kwis_defects_log.defect_height_mm LIKE ? OR
        kwis_defects_log.updated_at LIKE ? OR
        ${defectIdSearch ? "kwis_defects_log.defect_id = ?" : "1=0"} OR
        kwis_defects_log.defect_type LIKE ?
      )`
    ;
 
    countQuery += 
      ` AND (
        kwis_defects_log.confidence LIKE ? OR
        kwis_defects_log.defect_top_left_y_mm LIKE ? OR
        kwis_defects_log.defect_width_mm LIKE ? OR
        kwis_defects_log.defect_height_mm LIKE ? OR
        kwis_defects_log.updated_at LIKE ? OR
        ${defectIdSearch ? "kwis_defects_log.defect_id = ?" : "1=0"} OR
        kwis_defects_log.defect_type LIKE ?
      )`
    ;
 
    params.push(
      searchValue,
      searchValue,
      searchValue,
      searchValue,
      searchValue,
      ...(defectIdSearch ? [defectIdSearch] : []),
      searchValue
    );
 
    countparam.push(
      searchValue,
      searchValue,
      searchValue,
      searchValue,
      searchValue,
      ...(defectIdSearch ? [defectIdSearch] : []),
      searchValue
    );
  }
 
  // SORTING
  if (order && order.length > 0 && columns) {
    const orderColumn = columns[order[0].column].data;
    const orderDir = order[0].dir.toUpperCase();
 
    if (orderColumn === "area_mm") {
      getDefectsQuery += 
        ` ORDER BY (defect_width_mm * defect_height_mm) ${orderDir}`
      ;
    } else if (orderColumn === "local_defect_id") {
      getDefectsQuery += 
        ` ORDER BY defect_id ${orderDir}`
      ;
    } else {
      getDefectsQuery += 
        ` ORDER BY ${orderColumn} ${orderDir}`
      ;
    }
  }
 
  // PAGINATION
  getDefectsQuery +=  ` LIMIT ? OFFSET ?`;

  db.addQuery("getDefectsQuery", getDefectsQuery);
  db.addQuery("countQuery", countQuery);
 
  params.push(limit, minNumber);
 
  const countQueryRe = await db.runQuery("countQuery", countparam);
 
  if (!countQueryRe?.success) {
    return res.status(501).json({
      status: false,
      error: countQueryRe.error,
    });
  }
 
  const getDefectsQueryRe = await db.runQuery("getDefectsQuery", params);
 
  if (!getDefectsQueryRe?.success) {
    return res.status(501).json({
      status: false,
      error: getDefectsQueryRe.error,
    });
  }
 
  return res.status(200).json({
    status: true,
    error: "success",
    draw: draw,
    data: getDefectsQueryRe.data,
    recordsTotal: countQueryRe.data[0].total_defect,
    recordsFiltered: countQueryRe.data[0].total_defect,
    message:
      countQueryRe.data[0].total_defect === 0 ? "No Data Found" : "",
  });
};

const defectTypes = async (req, res, next) => {
  const rollid = req.params.rollid; // Retrieve rollid from the URL parameter
  let sql =
    "SELECT DISTINCT SUBSTRING_INDEX(defect_type, ' ', 1) AS defect_type FROM kwis_defects_log WHERE robro_roll_id = ?;";
  let params = [rollid]; // Pass rollid as a parameter
  await db.addQuery("defectTypes", sql);
  const defectTypesResult = await db.runQuery("defectTypes", params);

  if (!defectTypesResult.success) {
    res.status(501).json({ status: false, error: err.error });
    return;
  } else if (defectTypesResult.data.length > 0) {
    return res.status(200).json({
      status: true,
      error: "success",
      data: defectTypesResult.data,
    });
  } else {
    res.status(501).json({
      status: false,
      error: "no records found",
      data: [],
    });
  }
};

const defectDetails = async (req, res, next) => {
  const rollid = req.params.rollid; // Retrieve roll id from the URL parameter
  const defectid = req.params.defectid; // Retrieve defect id from the URL parameter
  let sql =
    "select * from kwis_defects_log where robro_roll_id = ? and defect_id = ? and delete_flag=0";
  let params = [rollid, defectid]; // Pass parameters

  await db.addQuery("defectDetails", sql);

  const defectDetailsResult = await db.runQuery("defectDetails", params);

  if (!defectDetailsResult.success) {
    res.status(501).json({ status: false, error: defectDetailsResult.error });
    return;
  } else if (defectDetailsResult.data.length > 0) {
    return res.status(200).json({
      status: true,
      error: "success",
      data: defectDetailsResult.data,
    });
  } else {
    res.status(501).json({
      status: true,
      error: "no records found",
      data: [],
    });
  }
};

//get defect with current_meter filter
const current_meter_filter_Defects = async (req, res, next) => {
  const { roll_id, start_meter, end_meter, start_limit, end_limit } = req.body;
  const limit = parseInt(end_limit - start_limit);
  const start_limit_int = parseInt(start_limit);
  if (!roll_id) {
    return res.status(501).json({
      status: false,
      error: "Roll_id not found",
    });
  }

  // let sql =
  //   "SELECT * FROM  kwis_defects_log WHERE robro_roll_id = ? AND  delete_status = 0 AND splice_status = 0 AND repair_status = 0 AND suggest_for_deletion = 0";

  let sql = `SELECT *
                      FROM kwis_defects_log kdl
                      WHERE kdl.robro_roll_id = ?
                        AND kdl.delete_status = 0
                        AND kdl.repair_status = 0
                        AND kdl.suggest_for_deletion = 0
                        AND kdl.splice_id IS NULL`

  // let countdefect =
  //   "select count(kwis_defects_log.defect_id) as total_count from kwis_defects_log WHERE robro_roll_id = ? AND delete_status = 0 AND splice_status = 0 AND repair_status = 0 AND suggest_for_deletion = 0";

  let countdefect = `SELECT COUNT(kdl.defect_id) AS total_count
                      FROM kwis_defects_log kdl
                      WHERE kdl.robro_roll_id = ?
                        AND kdl.delete_status = 0
                        AND kdl.repair_status = 0
                        AND kdl.suggest_for_deletion = 0
                        AND kdl.splice_id IS NULL`

  let params = [roll_id];
  let countparams = [roll_id];

  if (start_meter || start_meter == 0) {
    if (start_meter != "") {
      let startmeter = parseFloat(start_meter) * 1000;
      sql += " AND defect_top_left_y_mm >= ? ";
      countdefect += " AND defect_top_left_y_mm >= ? ";
      params.push(parseFloat(startmeter));
      countparams.push(parseFloat(startmeter));
    }
  }
  if (end_meter || end_meter == 0) {
    if (end_meter != "") {
      let endmeter = parseFloat(end_meter) * 1000;
      sql += " AND defect_top_left_y_mm <= ? ";
      countdefect += " AND defect_top_left_y_mm <= ? ";
      params.push(parseFloat(endmeter));
      countparams.push(parseFloat(endmeter));
    }
  }

  sql +=
    " ORDER BY defect_top_left_y_mm DESC  LIMIT ? OFFSET ?";
  params.push(limit);
  params.push(start_limit_int);
  
  db.addQuery("sql", sql);
  db.addQuery("countdefect", countdefect);
  const countdefectRe = await db.runQuery("countdefect", countparams);

  if (!countdefectRe?.success) {
    return res.status(501).json({ error: countdefectRe.error });
  } else {
    const sqlRe = await db.runQuery("sql", params);

    if (!sqlRe?.success) {
      res.status(501).json({ error: sqlRe.error });
      return;
    }

    if (sqlRe.data.length === 0) {
      return res.status(200).json({
        status: true,
        error: "no records found",
        data: [],
        total_defect_filter_count: countdefectRe.data[0].total_count,
      });
    }

    return res.status(200).json({
      status: true,
      error: "success",
      data: sqlRe.data,
      total_defect_filter_count: countdefectRe.data[0].total_count,
    });
  }
};

//update model_id and ai_suggestion for defect
const updateUserSuggestion = async (req, res, next) => {
  const { defect_id, user_suggestion,robro_roll_id,model_id} = req.body;

  if (!defect_id) {
    return res.status(501).json({ status: false, meassge: "defect id not found" });
  }
  const updatedefectQuery =
    "UPDATE kwis_defects_log SET user_suggestion=?,updated_at=?,model_id=? WHERE defect_id = ? AND robro_roll_id = ?";
  const currentDate = new Date();
  const formattedTimestamp = formatTimestamp(currentDate);
  const values = [user_suggestion, formattedTimestamp,model_id ,defect_id, robro_roll_id];

  db.addQuery("updatedefectQuery", updatedefectQuery);

  const updatedefectResult = await db.runQuery("updatedefectQuery", values);

  if (!updatedefectResult.success) {
    return res
      .status(501)
      .json({ status: false, message: updatedefectResult.error });
  }

  const affectedRows = updatedefectResult.affectedRows; // Get the number of affected rows

  if (affectedRows > 0) {
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
    return res.status(200).json({
      status: true,
      message: `Defect Updated successfully!!`,
      affectedRows: affectedRows,
    });
  } else {
    return res.status(501).json({
      status: false,
      message: `No defect found or updated!!`,
    });
  }
};

const getFirstDefectPosition = async (req, res, next) => {
  const { roll_id } = req.body;
  let getdefectforrollid =
    "select kwis_defects_log.defect_top_left_y_mm,kwis_defects_log.defect_id from kwis_defects_log where robro_roll_id = ? AND delete_status = 0 AND repair_status = 0 AND suggest_for_deletion = 0 AND splice_id IS NULL ORDER BY defect_top_left_y_mm ASC LIMIT 1";
  db.addQuery("getdefectforrollid", getdefectforrollid);
  let params = [roll_id];

  const limitRe = await db.runQuery("getdefectforrollid", params);


  if (!limitRe?.success) {
    res.status(501).json({
      status: false,
      error: limitRe.error,
    });
    return;
  }
  return res.status(200).json({
    status: true,
    error: "success",
    data: limitRe.data,
  });
}

const saveDefect = async (req, res, next) => {
  const { defects } = req.body;

  // If defects is not an array, fallback to single defect for backward compatibility
  const defectList = Array.isArray(defects)
    ? defects
    : [{
        roll_width_id: req.body.roll_width_id,
        robro_roll_id: req.body.robro_roll_id,
        defect_top_left_y_mm: req.body.defect_top_left_y_mm,
        defect_width_mm: req.body.defect_width_mm,
        defect_height_mm: req.body.defect_height_mm,
        cropped_image_path: req.body.cropped_image_path,
        defect_type: req.body.defect_type
      }];
      const robro_roll_id = req.body.defects[0].robro_roll_id
  let insertedCount = 0;
  for (const defect of defectList) {
    // Get last defect_id for this robro_roll_id
    let getDefectId =
      "SELECT defect_id FROM kwis_defects_log WHERE robro_roll_id = ? ORDER BY defect_id DESC LIMIT 1";
    let value = [defect.robro_roll_id];
    db.addQuery("getDefectId", getDefectId);
    const getDefectIdRe = await db.runQuery("getDefectId", value);
    if (!getDefectIdRe.success) {
      return res.status(501).json({
        status: false,
        error: `getDefectIdRe${getDefectIdRe.error}`,
      });
    }

    let insert_defect_id = getDefectIdRe.data.length > 0 ? getDefectIdRe.data[0].defect_id + 1 : 1;
    const currentDate = new Date();
    const formattedTimestamp = formatTimestamp(currentDate);

    const insertQuery = "INSERT INTO kwis_defects_log (defect_id, robro_roll_id, defect_top_left_y_mm, defect_top_left_x_mm, confidence, defect_width_mm, defect_height_mm, defect_type, cropped_image_path, delete_status, updated_at) VALUES (?,?,?,?,?,?,?,?,?,0,?)";
    const values = [
      insert_defect_id,
      defect.robro_roll_id,
      defect.defect_top_left_y_mm,
      0,
      0,
      defect.defect_width_mm,
      defect.defect_height_mm,
      defect.defect_type,
      defect.cropped_image_path,
      formattedTimestamp
    ];
    db.addQuery("insertQuery", insertQuery);
    const insertQueryRe = await db.runQuery("insertQuery", values);

    if (!insertQueryRe.success) {
      return res.status(501).json({
        status: false,
        error: `insertQueryRe${insertQueryRe.error}`,
      });
    }
    insertedCount++;

    // Update roll_width status for each defect
    const updateQuery = "UPDATE kwis_roll_width_log SET status=?,updated_at=? WHERE roll_width_id = ?";
    const updatevalues = [1, formattedTimestamp, defect.roll_width_id];
    db.addQuery("updateQuery", updateQuery);
    const updateQueryRe = await db.runQuery("updateQuery", updatevalues);
    if (!updateQueryRe.success) {
      console.error(updateQueryRe.error);
    }
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
  return res.status(201).json({
    status: true,
    message: `${insertedCount} Defect(s) Inserted Successfully!`,
  });
}

const getColours = async (req, res, next) => {
  const Colors = [
    { colour_name: "Royal Blue", colour_code: "#4169E1" },
    { colour_name: "Turquoise", colour_code: "#40E0D0" },
    { colour_name: "Crimson", colour_code: "#DC143C" },
    { colour_name: "Deep Sky Blue", colour_code: "#00BFFF" },
    { colour_name: "Hot Pink", colour_code: "#FF69B4" },
    { colour_name: "Coral Red", colour_code: "#FF4040" },
    { colour_name: "Slate Blue", colour_code: "#6A5ACD" },
    { colour_name: "Sea Green", colour_code: "#2E8B57" },
    { colour_name: "Teal Blue", colour_code: "#367588" },
    { colour_name: "Medium Crimson", colour_code: "#B22222" },
    { colour_name: "Persian Green", colour_code: "#009B77" },
    { colour_name: "Raspberry", colour_code: "#E30B5D" },
    { colour_name: "Verdigris", colour_code: "#43B3AE" },
    { colour_name: "Denim", colour_code: "#1560BD" },
    { colour_name: "Orange Red", colour_code: "#FF4500" },
    { colour_name: "Bittersweet", colour_code: "#FE6F5E" },
    { colour_name: "Amaranth", colour_code: "#E52B50" },
    { colour_name: "Cerulean", colour_code: "#007BA7" },
    { colour_name: "Mulberry", colour_code: "#C54B8C" },
    { colour_name: "Electric Purple", colour_code: "#BF00FF" },
    { colour_name: "Vivid Tangerine", colour_code: "#FFA089" },
    { colour_name: "Maximum Blue", colour_code: "#47ABCC" },
    { colour_name: "Blue Jeans", colour_code: "#5DADEC" },
    { colour_name: "Majorelle Blue", colour_code: "#6050DC" },
    { colour_name: "Medium Persian Blue", colour_code: "#0067A5" },
    { colour_name: "Jungle Green", colour_code: "#29AB87" },
    { colour_name: "Medium Ruby", colour_code: "#AA4069" },
    { colour_name: "Bright Maroon", colour_code: "#C32148" },
    { colour_name: "Scarlet", colour_code: "#FF2400" },
    { colour_name: "Dark Tangerine", colour_code: "#FFA62B" },
    { colour_name: "Tangerine", colour_code: "#F28500" },
    { colour_name: "Vermilion", colour_code: "#E34234" },
    { colour_name: "Deep Peach", colour_code: "#FFCBA4" },
    { colour_name: "Steel Teal", colour_code: "#5F8A8B" },
    { colour_name: "Bright Lilac", colour_code: "#D891EF" },
    { colour_name: "French Raspberry", colour_code: "#C72C48" },
    { colour_name: "Rosewood", colour_code: "#65000B" },
    { colour_name: "Electric Blue", colour_code: "#7DF9FF" },
    { colour_name: "Paradise Pink", colour_code: "#E63E62" },
    { colour_name: "Warm Red", colour_code: "#F9423A" },
    { colour_name: "Dark Coral", colour_code: "#CD5B45" },
    { colour_name: "Mango", colour_code: "#FFC324" },
    { colour_name: "Carrot Orange", colour_code: "#ED9121" },
    { colour_name: "Royal Purple", colour_code: "#7851A9" },
    { colour_name: "Medium Violet", colour_code: "#9F00C5" },
    { colour_name: "Indigo", colour_code: "#4B0082" },
    { colour_name: "Dark Sky Blue", colour_code: "#8AB8FE" },
    { colour_name: "Shamrock Green", colour_code: "#009E60" },
    { colour_name: "Malachite", colour_code: "#0BDA51" },
    { colour_name: "Blotchy Blue", colour_code: "#6B7A9C" },
    { colour_name: "Faded Crimson", colour_code: "#A45B6A" },
    { colour_name: "Streaked Pink", colour_code: "#F3AFC0" },
    { colour_name: "Patchy Orange", colour_code: "#E69258" },
    { colour_name: "Muddled Green", colour_code: "#678D58" },
    { colour_name: "Dull Purple", colour_code: "#7A5980" },
    { colour_name: "Washed Coral", colour_code: "#FF9F9F" },
    { colour_name: "Burnt Yellow", colour_code: "#D89B00" },
    { colour_name: "Blurry Violet", colour_code: "#A88BD0" },
    { colour_name: "Dusty Teal", colour_code: "#5C8C85" },
    { colour_name: "Cracked Rose", colour_code: "#D96088" },
    { colour_name: "Scuffed Blue", colour_code: "#5E7BA0" },
    { colour_name: "Tarnished Gold", colour_code: "#D4AF37" },
    { colour_name: "Flickering Red", colour_code: "#D2383F" },
    { colour_name: "Oxidized Copper", colour_code: "#6C8C6B" },
    { colour_name: "Peeling Orange", colour_code: "#E3743D" },
    { colour_name: "Bleeding Maroon", colour_code: "#8E2730" },
    { colour_name: "Frostbitten Blue", colour_code: "#90C3D4" },
    { colour_name: "Spotted Pink", colour_code: "#F9B1C1" },
    { colour_name: "Greasy Green", colour_code: "#7F9257" },
    { colour_name: "Smudged Grey", colour_code: "#8A8D8F" },
    { colour_name: "Splotchy Lavender", colour_code: "#BCA5D3" },
    { colour_name: "Stained Lemon", colour_code: "#F7E87A" },
    { colour_name: "Uneven Azure", colour_code: "#3D7EA6" },
    { colour_name: "Rust Red", colour_code: "#B7410E" },
    { colour_name: "Flaky Peach", colour_code: "#FFBC9A" },
    { colour_name: "Streaky Cyan", colour_code: "#77CEDF" },
    { colour_name: "Tarnished Plum", colour_code: "#893B78" },
    { colour_name: "Blotchy Mint", colour_code: "#A1CDA8" },
    { colour_name: "Dingy Tangerine", colour_code: "#F1993A" },
    { colour_name: "Overexposed Pink", colour_code: "#FFC2D1" },
    { colour_name: "Underexposed Navy", colour_code: "#1C2E47" },
    { colour_name: "Grimy Yellow", colour_code: "#E6CB53" },
    { colour_name: "Fuzzy Lilac", colour_code: "#C4A1E0" },
    { colour_name: "Blurred Rose", colour_code: "#DE7399" },
    { colour_name: "Frayed Burgundy", colour_code: "#872341" },
    { colour_name: "Pale Moss", colour_code: "#B4C79C" },
    { colour_name: "Dirty Denim", colour_code: "#4E6E81" },
    { colour_name: "Rusty Orange", colour_code: "#C75127" },
    { colour_name: "Cloudy Teal", colour_code: "#85A8A6" },
    { colour_name: "Foggy Blue", colour_code: "#A6C8DC" },
    { colour_name: "Wilted Green", colour_code: "#749766" },
    { colour_name: "Stale Crimson", colour_code: "#A84550" },
    { colour_name: "Dimmed Gold", colour_code: "#B59F3B" },
    { colour_name: "Tired Purple", colour_code: "#9479B2" },
    { colour_name: "Ashen Red", colour_code: "#B05C5C" },
    { colour_name: "Hazey Indigo", colour_code: "#6C5D99" },
    { colour_name: "Muted Sky", colour_code: "#9AB5CE" },
    { colour_name: "Ghost Pink", colour_code: "#F2D3E2" }
  ];
  
  if(req == 'backend')
  {
    return Colors;
  }
  else
  {
    return res.status(201).json({
      status: true,
      message:"success",
      data: Colors,
    });  
  }
}

const updateStatus = async (req, res, next) => {
  let {
    machine_id,
    robro_roll_id,
    user_id,
    defect_id,
    splice_id,
    status
  } = req.body;
  const checkheader =
    "select id from kwis_roll_repair_job where machine_id = ? and robro_roll_id = ?";
  const headervalue = [machine_id, robro_roll_id];
  if (!machine_id) {
    return res
      .status(501)
      .json({ status: false, message: "machine_id not found" });
  }
  if (!robro_roll_id) {
    return res
      .status(501)
      .json({ status: false, message: "robro_roll_id not found" });
  }

  if (!defect_id || !Array.isArray(defect_id) || !defect_id.length > 0) {
    return res
      .status(501)
      .json({ status: false, message: "defect_id not found" });
  }
  defect_id = defect_id === undefined || defect_id == "" ? null : defect_id;
  user_id = user_id === undefined || user_id === "" ? null : user_id;
  status = status === undefined || status === "" ? null : status;

  db.addQuery("checkheader", checkheader);

  const checkHeaderResult = await db.runQuery("checkheader", headervalue);

  if (!checkHeaderResult.success) {
    return res
      .status(501)
      .json({ status: false, message: checkHeaderResult.error });
  } else {
    
    let updatedRowsCount;
    if (status == "splice_status") {
      msg = "Splice";
      updatedRowsCount = await updateSpliceDefectsStatus(defect_id,robro_roll_id,splice_id);
    } else if (status == "repair_status") {
      msg = "Repair";
      updatedRowsCount = await updateDefectsStatus(defect_id, robro_roll_id,status);
    } else if( status == "suggest_for_deletion") {
      msg = "Override";
      updatedRowsCount = await updateDefectsStatus(defect_id, robro_roll_id,status);
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
    return res.status(201).json({
      status: true,
      message: `${updatedRowsCount} Defect ${msg} successfully!!!`,
    });
  }
};

async function updateDefectsStatus(defect_id,robro_roll_id,status) {
  const currentDate = new Date();
  const formattedTimestamp = await formatTimestamp(currentDate);
  let totalInsertedRows = 0;
  for (let index = 0; index < defect_id.length; index++) {
    let updatedRowsCount ;
    if( status == "splice_status") {
      updatedRowsCount = await updateSpliceDefect(defect_id[index],robro_roll_id,formattedTimestamp);
    } else if (status == "repair_status" || status == "suggest_for_deletion") {
      updatedRowsCount = await updateDefect(defect_id[index],robro_roll_id,formattedTimestamp,status);
    } 
    totalInsertedRows += updatedRowsCount;
  }

  return totalInsertedRows;
}

async function updateDefect(defect_id,robro_roll_id,updated_at,status) {
  const detailsUpdate =
    `UPDATE kwis_defects_log SET ${status} = 1, updated_at=? WHERE defect_id = ? AND robro_roll_id = ?`;
  const params = [updated_at,defect_id,robro_roll_id];
  db.addQuery("detailsUpdate", detailsUpdate);
  try {
    await new Promise(async(resolve, reject) => {
      const detailsUpdateResult =await db.runQuery("detailsUpdate", params);
      if (!detailsUpdateResult.success) {
        reject(detailsUpdateResult.error);
      } else {
        resolve(detailsUpdateResult.affectedRows);
      }
    });

    return 1;
  } catch (err) {
    console.error(err.message);
    return 0;
  }
}

async function updateSpliceDefectsStatus(defect_id,robro_roll_id,splice_id) {
  const currentDate = new Date();
  const formattedTimestamp = await formatTimestamp(currentDate);
  let totalInsertedRows = 0;
  for (let index = 0; index < defect_id.length; index++) {
    let updatedRowsCount = await updateSpliceDefect(defect_id[index],robro_roll_id,splice_id);
    totalInsertedRows += updatedRowsCount;
  }
  if(defect_id.length === 0)
  {
    updateSpliceMeter(splice_id,splice_meter)
  }
  return totalInsertedRows;
}

async function updateSpliceDefect(defect_id, robro_roll_id,splice_id) {
  const currentDate = new Date();
  const formattedTimestamp = await formatTimestamp(currentDate);
  try {
    await new Promise(async (resolve, reject) => {
        const detailsUpdate =
          `UPDATE kwis_defects_log SET splice_id = ?,updated_at=? WHERE defect_id = ? AND robro_roll_id = ?`;
        const params = [splice_id,formattedTimestamp, defect_id, robro_roll_id];
        db.addQuery("detailsUpdate", detailsUpdate);
        const detailsUpdateResult = await db.runQuery("detailsUpdate", params);
        if (!detailsUpdateResult.success) {
          reject(detailsUpdateResult.error);
        }
        resolve(detailsUpdateResult.affectedRows);
    });

    return 1;
  } catch (err) {
    console.error(err.message);
    return 0;
  }
}

const updateSpliceMeter = async (req, res, next) => {
  const {
    splice_id,
    splice_meter,
    robro_roll_id
  } = req.body
  const detailsUpdate =
          `UPDATE kwis_splice_table SET splice_meter = ?, splice_status = 1 WHERE splice_id = ?`;
  const params = [splice_meter,splice_id];
  try {
        db.addQuery("detailsUpdate", detailsUpdate);
        const detailsUpdateResult = await db.runQuery("detailsUpdate", params);
         if (!detailsUpdateResult?.success) {
      return res.status(500).json({ status: false, message: detailsUpdateResult.error });
    }

    const currentDate = new Date();
    const formattedTimestamp = formatTimestamp(currentDate);
    const updateRollQuery = "UPDATE kwis_rolls_log SET updated_at = ? WHERE robro_roll_id = ?";
    const updateRollValue = [formattedTimestamp,robro_roll_id]

    db.addQuery("updateRollQuery", updateRollQuery);
    const updateRollRe = await db.runQuery("updateRollQuery", updateRollValue);

    if (!updateRollRe.success) {
      return res.status(501).json({
        status: false,
        error: updateRollRe.error,
      })
    }
    res.status(200).json({
      status: true,
      message: "Splice Data updated successfully.",
      data: detailsUpdateResult.affectedRows,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "An error occurred while updating splice data.",
      error: error.message,
    });
  }
}

async function unDeleteDefects(req, res, next){
 
  const { defect_ids,robro_roll_id } = req.body; // Extract defect_ids from the object

  // Validate that defect_ids exists and is a non-empty array
  if (!defect_ids || !Array.isArray(defect_ids)) {
    return res.status(400).json({ status: false, message: "Invalid request body: 'defect_ids' must be an array." });
  }

  if (defect_ids.length === 0) {
    return res.status(400).json({ status: false, message: "'defect_ids' array cannot be empty." });
  }

  const updateQuery = `
    UPDATE kwis_defects_log
    SET delete_status = 0,
        updated_at = ?
    WHERE defect_id IN (?) AND robro_roll_id = ?;
  `;

  const currentDate = new Date();
  const formattedTimestamp = formatTimestamp(currentDate); // Uses the existing formatTimestamp function

  const values = [formattedTimestamp, defect_ids, robro_roll_id];

  try {
    db.addQuery("unDeleteDefectsQuery", updateQuery);
    const result = await db.runQuery("unDeleteDefectsQuery", values);

    if (!result.success) {
      console.error("Error undeleting defects:", result.error);
      return res.status(500).json({ status: false, message: "Failed to undelete defects.", error: result.error });
    }

    if (result.affectedRows > 0) {
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
      return res.status(200).json({ status: true, message: `${result.affectedRows} defect(s) undeleted successfully.` });
    } else {
      return res.status(404).json({ status: false, message: "No defects found matching the provided IDs or they were already undeleted." });
    }
  } catch (error) {
    console.error("Server error in unDeleteDefects:", error);
    return res.status(500).json({ status: false, message: "An internal server error occurred.", error: error.message });
  }
}

const getAllUniqueDefectTypes = async (req, res, next) => {
  try {
    const sql = "SELECT DISTINCT SUBSTRING_INDEX(defect_type, ' ', 1) AS defect_type FROM kwis_defects_log WHERE defect_type IS NOT NULL AND defect_type != '' ORDER BY defect_type ASC";
    db.addQuery("getAllUniqueDefectTypes", sql);
    const result = await db.runQuery("getAllUniqueDefectTypes");

    if (!result?.success) {
      return res.status(500).json({ status: false, message: result.error });
    }

    res.status(200).json({
      status: true,
      message: "Unique defect types fetched successfully.",
      data: result.data,
    });
  } catch (error) {
    console.error("Error in getAllUniqueDefectTypes:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred while fetching unique defect types.",
      error: error.message,
    });
  }
};


const getSlittingData = async (req, res, next) => {
  const { roll_id } = req.params; // Retrieve roll_id from the URL parameter
  if (!roll_id) {
    return res.status(501).json({ status: false, error: "roll_id not defined" });
  } 
  let getSlittingDataQuery = `
                SELECT 
              slitting_type,
              JSON_ARRAYAGG(
                JSON_OBJECT(
                  'slitting_id', slitting_id,
                  'robro_roll_id', robro_roll_id,
                  'child_roll_id', child_roll_id,
                  'x_roll_start_mm', x_roll_start_mm,
                  'x_roll_end_mm', x_roll_end_mm,
                  'y_roll_start_mm', y_roll_start_mm,
                  'y_roll_end_mm', y_roll_end_mm
                )
              ) AS data
            FROM kwis_slitting_info
            GROUP BY slitting_type;
      `;
  db.addQuery("getSlittingDataQuery", getSlittingDataQuery);
  const slittingDataResult = await db.runQuery("getSlittingDataQuery"); 
  if (!slittingDataResult.success) {
    return res.status(501).json({ status: false, error: slittingDataResult.error });
  }
  if (slittingDataResult.data.length > 0) {
    return res.status(200).json({
      status: true,
      error: "success",
      data: slittingDataResult.data,
    });
  }
  return res.status(200).json({
    status: true,
    error: "no records found",
    data: [],
  }); 
}

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
  defects,
  defectTypes,
  defectDetails,
  defectdelete,
  filterDefects,
  defectMerge,
  updateDefects,
  current_meter_filter_Defects,
  getdefectfordatatable,
  updateUserSuggestion,
  getFirstDefectPosition,
  saveDefect,
  getColours,
  updateStatus,
  unDeleteDefects,
  getAllUniqueDefectTypes,
  getSlittingData,
  updateSpliceMeter
};
