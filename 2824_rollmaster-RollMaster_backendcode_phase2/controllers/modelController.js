const db = require("../connection/dbConnection.js");
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const axios = require("axios");
//save model details
const saveModel = async (req, res, next) => {
  let {
    model_name,
    model_file_path,
    name_file_path,
    optimised_model_file_path,
    model_type,
    metadata,
    kvp_backend_url,
    associated_app_id
  } = req.body;

  // Set default nulls before use
  model_file_path = model_file_path || null;
  name_file_path = name_file_path || null;
  optimised_model_file_path = optimised_model_file_path || null;
  model_type = model_type || "classifier";
  metadata = metadata || null;

  // Handle cases where associated_app_id might be a 'null' string, empty, or undefined
  if (associated_app_id === 'null' || associated_app_id === '' || associated_app_id === undefined) {
    associated_app_id = null;
  }

  // Validate inputs
  if (!model_name) {
    return res.status(400).json({ status: false, message: "model_name not found" });
  }

  if (!kvp_backend_url || kvp_backend_url === null || kvp_backend_url === "null") {
    const currentDate = new Date();
    const formattedTimestamp = formatTimestamp(currentDate);

    const insert_query = "INSERT INTO kvp_model_info (model_name, model_file_path, name_file_path,optimised_model_file_path, model_type, associated_app_id, metadata,updated_at) VALUES (?,?,?,?,?,?,?,?)";
    const insert_value = [model_name,model_file_path, name_file_path,optimised_model_file_path, model_type ,associated_app_id, metadata,formattedTimestamp];
    try {
        await db.addQuery("insert_query",insert_query);
        const result = await db.runQuery("insert_query", insert_value);
        if(!result.success){
            return res.status(501).json({
                status: false,
                message: result.error,
            })
        }
        res.status(200).json({
            status: true,
            message: "Model inserted successfully!!!",
            user_id: result
        });
    } catch (error) {
        res.status(501).json({ status: false, message: error.message });
    }
  }
  else
  {
    // const authHeader = req.headers["authorization"];
    // if (!authHeader) {
    //   return res.status(401).json({
    //     status: false,
    //     message: "Authorization header is missing",
    //   });
    // }
  
    // const token = authHeader.split(" ")[1];
  
    // Build payload
    const payload = {
      model_name,
      model_file_path,
      name_file_path,
      optimised_model_file_path,
      metadata,
      model_type: "classifier",
      associated_app_id
    };
  
    try {
      const externalApiUrl = `${kvp_backend_url}add_model`; // ensure no double slashes
      const externalApiResponse = await axios.post(
        externalApiUrl,
        payload 
      );
      // Continue only if external API succeeded
      if (externalApiResponse.status !== 200) {
        return res.status(400).json({
          status: false,
          message: "External API request failed",
          details: externalApiResponse.data,
        });
      }
      else {
        return res.status(200).json({
          status: true,
          message: `Model Inserted Successfully!!!`,
        });
      }
    } catch (error) {
      // console.error("External API error:", error);
      return res.status(500).json({
        status: false,
        message: "Error calling external API",
        error: error.response?.data || error.message,
      });
    }
  }
  
};

//get all model 
const getAllModel = async (req, res, next) => {
  // const authHeader = req.headers["authorization"];
  const kvp_backend_url = req.body.kvp_backend_url;

  // if (!authHeader) {
  //   return res.status(401).json({
  //     status: false,
  //     msg: "Authorization header is missing",
  //   });
  // }

  if (!kvp_backend_url || kvp_backend_url === null || kvp_backend_url === "null") {
    const getQuery = `
    SELECT kvp_model_info.*, kvp_model_training_info.status
    FROM kvp_model_info
    LEFT JOIN kvp_model_training_info 
      ON kvp_model_info.model_id = kvp_model_training_info.model_id 
      AND kvp_model_training_info.updated_at = (
        SELECT MAX(updated_at) 
        FROM kvp_model_training_info 
        WHERE model_id = kvp_model_info.model_id
      )
    ORDER BY kvp_model_info.updated_at DESC;
  `;

    const getValue = [];
    try {
      await db.addQuery("getQuery",getQuery);
      const result = await db.runQuery("getQuery", getValue);
      res.status(200).json({
        status: true,
        message: "success",
        data: result.data,
      });
    } catch (error) {
      res.status(501).json({
        status: false,
        message: error.message,
      });
    }
  }

  else {
    // const token = authHeader.split(" ")[1];

    try {
      const externalApiUrl = `${kvp_backend_url}get_all_model`;
      const externalApiResponse = await axios.get(
        externalApiUrl
      );

      if (externalApiResponse.status === 200) {
        return res.status(200).json({
          status: true,
          message: "success",
          data: externalApiResponse.data.data,
        });
      } else {
        return res.status(400).json({
          status: false,
          msg: "External API request failed",
          details: externalApiResponse.data,
        });
      }
    } catch (error) {
      return res.status(500).json({
        status: false,
        msg: "Error calling external API",
        error: error.message,
      });
    }
  }


};


const deleteModel = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const kvp_backend_url = req.body.kvp_backend_url;
  const { model_id } = req.body;

  if (!authHeader) {
    return res
      .status(401)
      .json({ status: false, msg: "Authorization header is missing" });
  }
  if (!model_id) {
    return res
      .status(400)
      .json({ status: false, msg: "model_id is required" });
  }
  if (!kvp_backend_url || kvp_backend_url === null || kvp_backend_url === "null") {
    // Queries
    const deleteSyncLogQuery = "DELETE FROM kvp_model_info_sync_log WHERE model_id = ?";
    const deleteQuery = "DELETE FROM kvp_model_info WHERE model_id = ?";
    const disableTriggersQuery = "SET FOREIGN_KEY_CHECKS = 0";
    const enableTriggersQuery = "SET FOREIGN_KEY_CHECKS = 1";

    try {
        // Disable triggers
        await db.addQuery("disableTriggersQuery",disableTriggersQuery)
        await db.runQuery("disableTriggersQuery",[]);

        // Delete child rows first
        await db.addQuery("deleteSyncLogQuery",deleteSyncLogQuery)
        await db.runQuery("deleteSyncLogQuery", [model_id]);

        // Delete the user
        await db.addQuery("deleteQuery",deleteQuery)
        const deleteResult = await db.runQuery("deleteQuery", [model_id]);

        // Re-enable triggers
        await db.addQuery("enableTriggersQuery",enableTriggersQuery)
        await db.runQuery("enableTriggersQuery",[]);

        if (deleteResult.affectedRows > 0) {
            return res.status(200).json({ status: true, message: "Model deleted successfully!!!" });
        } else {
            return res.status(501).json({ status: false, message: "Model not found" });
        }
    } catch (error) {
        console.error("Error executing SQL:", error.message);

        // Re-enable triggers in case of error
        await db.addQuery("enableTriggersQuery",enableTriggersQuery)
        await db.runQuery("enableTriggersQuery",[]);
        
        return res.status(501).json({ status: false, message: "Error deleting user" });
    }
  }
  else
  {
   try {
      // Call external backend API to delete the model
      const externalApiUrl = `${kvp_backend_url}delete_model`; // Adjust path if needed
      const externalApiResponse = await axios.post(
        externalApiUrl,
        { model_id }
      );
  
      if (externalApiResponse.status === 200) {
        return res.status(200).json({
          status: true,
          message: "Model deleted successfully from external API",
          data: externalApiResponse.data
        });
      } else {
        return res.status(400).json({
          status: false,
          msg: "External API deletion failed",
          details: externalApiResponse.data,
        });
      }
    } catch (error) {
      return res.status(500).json({
        status: false,
        msg: "Error calling external API for delete",
        error: error.message,
      });
    }
  }  
};


//get defect data for particular model id
const getFilterDefectByModelId = async (req, res, next) => {
  const {
    model_id,
    start_limit,
    end_limit,
  } = req.body;

  const limit = parseInt(end_limit - start_limit);
  const start_limit_int = parseInt(start_limit);

  if (!model_id) {
    return res.status(501).json({
      status: false,
      error: "Model_id not found",
    });
  }

  // Base SQL query
  let sql = `
    SELECT dl.defect_id, dl.robro_roll_id, dl.defect_type, dl.cropped_image_path,dl.model_id, dl.ai_suggestion, dl.user_suggestion 
    FROM kwis_defects_log dl 
  `;

  // Count query
  let countdefect = `
    SELECT count(dl.defect_id) as total_count 
    FROM kwis_defects_log dl 
  `;

  let params = [model_id];
  let countparams = [model_id];

    sql += " WHERE dl.model_id = ? AND dl.user_suggestion IS NOT NULL ";
    countdefect += " WHERE dl.model_id = ? AND dl.user_suggestion IS NOT NULL ";

  // Add ordering, limits, and offsets to the SQL query
  sql += " ORDER BY dl.defect_id ASC LIMIT ? OFFSET ?";
  db.addQuery("countdefect", countdefect);
  db.addQuery("sql", sql);
  params.push(limit);
  params.push(start_limit_int);
  // Execute the count query
  const countdefectRe = await db.runQuery("countdefect", countparams);
  if (!countdefectRe?.success) {
    return res.status(501).json({ error: countdefectRe.error });
  }

  // Execute the main query
  const sqlRe = await db.runQuery("sql", params);
  if (!sqlRe?.success) {
    return res.status(501).json({ error: sqlRe.error });
  }

  // If no records found, return a message
  if (sqlRe?.data.length === 0) {
    return res.status(200).json({
      status: false,
      error: "no records found",
      data: [],
    });
  }

  // Return the result with the filtered defect count
  return res.status(200).json({
    status: true,
    error: "success",
    data: sqlRe.data,
    total_defect_filter_count: countdefectRe.data[0].total_count,
  });
};

//read model file data
const readModelFile = async (req, res, next) => {
  const { file_path } = req.body;
  // const downloadsPath = path.join(os.homedir(), file_path);
  fs.readFile(file_path, 'utf8')
    .then(data => {
      const splitArray = data.split('\n');
      const fileContent = splitArray.filter(value => value.trim() !== '');
      res.status(200).json({
        status: true,
        data: fileContent,
      });
    })
    .catch(err => {
      if (err.code === 'ENOENT') {
        res.status(501).json({
          status: false,
          error: "File not found in Downloads folder!",
        });
      } else {
        res.status(501).json({
          status: false,
          error: err,
        });
      }
    });
};

const deleteDefectUserSuggestion = async (req, res, next) => {
  const { checkedItems,rollIds } = req.body; 
  const defect_ids = checkedItems;
  if (!defect_ids || !Array.isArray(defect_ids) || defect_ids.length === 0) {
    return res.status(400).json({ status: false, message: "defect_ids array required" });
  }

  const sql = `
    UPDATE kwis_defects_log
    SET user_suggestion = NULL
    WHERE defect_id IN (${defect_ids.map(() => '?').join(',')})
  `;

  try {
    await db.addQuery("deleteDefectUserSuggestion", sql);
    const result = await db.runQuery("deleteDefectUserSuggestion", defect_ids);
    const currentDate = new Date();
    const formattedTimestamp = formatTimestamp(currentDate);
    const updateRollQuery = "UPDATE kwis_rolls_log SET updated_at = ? WHERE robro_roll_id IN (?)";
    const updateRollValue = [formattedTimestamp,[rollIds]]

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
      message: "User suggestions deleted for selected defects",
      affectedRows: result.affectedRows
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
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
  saveModel,
  getAllModel,
  deleteModel,
  getFilterDefectByModelId,
  readModelFile,
  deleteDefectUserSuggestion
};
