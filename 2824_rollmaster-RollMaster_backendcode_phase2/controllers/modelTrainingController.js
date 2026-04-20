const db = require("../connection/dbConnection.js");
const axios = require('axios');
//save model training
const saveModelTraining = async (req, res, next) => {
  let { model_id, status, user_id } = req.body;
  const authHeader = req.headers["authorization"];
  const kvp_backend_url = req.body.kvp_backend_url;

  if (!kvp_backend_url || kvp_backend_url === null || kvp_backend_url === "null") {
    const date = new Date();
    const formattedTimestamp = formatTimestamp(date);

    const insertModelTrainingQuery = `
      INSERT INTO kvp_model_training_info 
      (model_id, start_time, status, user_id, updated_at) 
      VALUES (?, ?, ?, ?, ?)`;

    const modelTrainingValue = [
      model_id,
      formattedTimestamp,
      status,
      user_id,
      formattedTimestamp,
    ];

    await db.addQuery("insertModelTrainingQuery",insertModelTrainingQuery)
    const result = await db.runQuery("insertModelTrainingQuery", modelTrainingValue);

    const lastInsertIdQuery = "SELECT LAST_INSERT_ID() AS lastID";
    await db.addQuery("lastInsertIdQuery",lastInsertIdQuery)
    const lastInsertIdRe = await db.runQuery("lastInsertIdQuery",[]);
    if (!lastInsertIdRe.data?.[0]?.lastID) {
      return res.status(500).json({
        status: false,
        message: `Failed to fetch last insert ID: ${lastInsertIdRe.error || 'Unknown error'}`,
      });
    }

    const lastID = lastInsertIdRe.data[0].lastID;

    return res.status(200).json({
      status: true,
      message: 'Model Training started successfully!',
      training_id: lastID,
    });

  }
  else
  {
    const payload = {
      "model_id":model_id,
      "status":status,
      "user_id":user_id
    }
    try {
      // Call external API to get model training data
      const externalApiUrl = `${kvp_backend_url}save_model_training_info`; // adjust endpoint path if needed
      const externalApiResponse = await axios.post(externalApiUrl,payload,
      );
  
      if (externalApiResponse.status === 200) {
        return res.status(200).json({
          status: true,
          message: "Fetched model training info successfully",
          training_id: externalApiResponse.data.training_id, // or adjust based on external response
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

const getModelTraining = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const kvp_backend_url = req.body.kvp_backend_url;

  if (!kvp_backend_url || kvp_backend_url === null || kvp_backend_url === "null") {
    const getQuery = "SELECT * FROM kvp_model_training_info";
    const getValue = [];
  
    try {
      await db.addQuery("getQuery",getQuery)
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
  else
  {

    try {
      // Call external API to get model training data
      const externalApiUrl = `${kvp_backend_url}get_model_training_info`; // adjust endpoint path if needed
      const externalApiResponse = await axios.get(externalApiUrl);
  
      if (externalApiResponse.status === 200) {
        return res.status(200).json({
          status: true,
          message: "Fetched model training info successfully",
          data: externalApiResponse.data.data, // or adjust based on external response
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



//end model training
const endModelTraining = async (req, res, next) => {
  let { training_id, status, user_id } = req.body;
  const authHeader = req.headers["authorization"];
  const kvp_backend_url = req.body.kvp_backend_url;


  if (!kvp_backend_url || kvp_backend_url === null || kvp_backend_url === "null") {
    try {
      const endModelTrainingquery = `UPDATE kvp_model_training_info SET status = ?,user_id=?,end_time = ? ,updated_at=? WHERE training_id = ?;`;

      const date = new Date();
      const formattedTimestamp = formatTimestamp(date);

      const modeltrainingvalue = [
        status,
        user_id,
        formattedTimestamp,
        formattedTimestamp,
        training_id,
      ];
  
      await db.addQuery("endModelTrainingquery",endModelTrainingquery)
      let endModelTrainingResult = await db.runQuery(
        "endModelTrainingquery",
        modeltrainingvalue
      );
      console.log(endModelTrainingResult)
        const affectedRows = endModelTrainingResult.affectedRows; 
        if (affectedRows > 0) {
          return res.status(200).json({
            status: true,
            message: `Model Training End successfully!!`,
            affectedRows: affectedRows,
          });
        } else {
          return res.status(501).json({
            status: false,
            message: `No Model Training found or updated!!`,
          });
        }
      // }
    } catch (error) {
      return res.status(501).json({ status: false, message: error.message });
    }
  }
  else
  {
    const payload = {
      "training_id":training_id,
      "status":status,
      "user_id":user_id
    }
    try {
      // Call external API to get model training data
      const externalApiUrl = `${kvp_backend_url}end_model_training`; // adjust endpoint path if needed
      const externalApiResponse = await axios.post(externalApiUrl,payload);
  
      if (externalApiResponse.status === 200) {
        return res.status(200).json({
          status: true,
          message: "Model Training End successfully",
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
  saveModelTraining,
  getModelTraining,
  endModelTraining,
};
