const db = require("../connection/dbConnection.js");

const startReviewJob = async (req, res, next) => {
  const { roll_id, user_id } = req.body;

  // Get current time for start_time and updated_at
  // const start_time = new Date().toISOString().slice(0, 19).replace("T", " ");
  const date = new Date();
  const start_time = `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
    .getHours()
    .toString()
    .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;
  // const updated_at = new Date().toISOString().slice(0, 19).replace("T", " ");
  const updated_at = start_time;
  // Retrieve rollid from the URL parameter
  let start_review_job = `INSERT INTO kwis_review_job_log (user_id, start_time, robro_roll_id, updated_at) 
        VALUES (?,?,?,?);`;

  db.addQuery("start_review_job", start_review_job);

  let params = [user_id, start_time, roll_id, updated_at];

  const lastInsertIdQuery = "SELECT LAST_INSERT_ID() AS lastID";
  db.addQuery("lastInsertIdQuery", lastInsertIdQuery);

  try {
    // Execute the query
    const start_review_result = await db.runQuery("start_review_job", params);

    // Check if the query was successful
    if (!start_review_result.success) {
      res.status(501).json({ status: false, error: start_review_result.error });
      return;
    }

    const lastInsertIdRe = await db.runQuery("lastInsertIdQuery");

    // Return the inserted ID
    const insertedId = lastInsertIdRe.data[0].lastID;

    const currentDate = new Date();
    const formattedTimestamp = formatTimestamp(currentDate);
    const updateRollQuery = "UPDATE kwis_rolls_log SET updated_at = ? WHERE robro_roll_id = ?";
    const updateRollValue = [formattedTimestamp,roll_id]

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
      message: "Review job started successfully!",
      review_job_id: insertedId,
    });
  } catch (error) {
    // Handle any errors that may occur
    res.status(501).json({ status: false, error: "Internal Server Error!" });
  }
};

const endReviewJob = async (req, res, next) => {
  const { review_job_id,robro_roll_id } = req.body;

  // SQL query to update the end_time for a specific roll_id where end_time is NULL
  let end_review_job = `
    UPDATE kwis_review_job_log 
    SET end_time = ? ,  updated_at = ?
    WHERE review_job_id = ?;
  `;

  // Get the current timestamp for end_time
  // const end_time = new Date().toISOString().slice(0, 19).replace("T", " ");
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

  // Prepare parameters
  let params = [end_time, updated_at, review_job_id];

  // Add query to the query queue
  db.addQuery("end_review_job", end_review_job);

  // Execute the query
  const end_review_result = await db.runQuery("end_review_job", params);

  if (!end_review_result?.success) {
    res.status(501).json({ status: false, error: end_review_result.error });
    return;
  }

  // Check if the update was successful
  if (end_review_result?.affectedRows > 0) {

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
      message: "Review job ended successfully!",
      job_end_id: review_job_id,
    });
  } else {
    res.status(501).json({
      status: false,
      error: "No matching review job found or already ended!",
    });
  }
};

const startRepairJob = async (req, res, next) => {
  const { user_id, machine_id, roll_id, job_start_meter, current_meter } = req.body;

  // Get current time for start_time and updated_at
  // const start_time = new Date().toISOString().slice(0, 19).replace("T", " ");
  // const updated_at = new Date().toISOString().slice(0, 19).replace("T", " ");
  const date = new Date();
  const start_time = `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
    .getHours()
    .toString()
    .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;

  const updated_at = start_time;

  const startRepairJobQuery = `
  INSERT INTO kwis_roll_repair_job (user_id, machine_id, robro_roll_id, job_start_meter, start_time, updated_at, current_meter)
  VALUES (?, ?, ?, ?, ?, ?, ?);
`;

  db.addQuery("startRepairJobQuery", startRepairJobQuery);

  const params = [
    user_id,
    machine_id,
    roll_id,
    job_start_meter,
    start_time,
    updated_at,
    current_meter,
  ];

  const lastInsertIdQuery = "SELECT LAST_INSERT_ID() AS lastID";
  db.addQuery("lastInsertIdQuery", lastInsertIdQuery);

  try {
    // Execute the query
    const startRepairJobResult = await db.runQuery(
      "startRepairJobQuery",
      params
    );

    // Check if the query was successful
    if (!startRepairJobResult?.success) {
      res
        .status(501)
        .json({ status: false, error: startRepairJobResult.error });
      return;
    }
    const lastInsertIdRe = await db.runQuery("lastInsertIdQuery");

    // Return the inserted ID
    const insertedId = lastInsertIdRe.data[0].lastID;
    const currentDate = new Date();
    const formattedTimestamp = formatTimestamp(currentDate);
    const updateRollQuery = "UPDATE kwis_rolls_log SET updated_at = ? WHERE robro_roll_id = ?";
    const updateRollValue = [formattedTimestamp,roll_id]

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
      message: "Repair job started successfully!",
      repair_job_id: insertedId,
    });
  } catch (error) {
    // Handle any errors that may occur
    res.status(501).json({ status: false, error: `${error.message}` });
  }
};

const endRepairJob = async (req, res, next) => {
  const { repair_job_id, job_end_meter, current_meter, robro_roll_id } = req.body;

  const endRepairJobQuery = `
    UPDATE kwis_roll_repair_job
    SET end_time = ?, updated_at = ?, job_end_meter = ?, current_meter = ?
    WHERE id = ?;
  `;

  // Get the current timestamp for end_time
  // const end_time = new Date().toISOString().slice(0, 19).replace("T", " ");
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

  const params = [end_time, updated_at, job_end_meter, current_meter, repair_job_id];

  db.addQuery("end_repair_job", endRepairJobQuery);

  const end_repair_job_result = await db.runQuery("end_repair_job", params);

  if (!end_repair_job_result?.success) {
    return res
      .status(501)
      .json({ status: false, error: end_repair_job_result.error });
  }

  if (end_repair_job_result.affectedRows === 0) {
    return res.status(501).json({
      status: false,
      error: "No repair job found with the given roll_id and null end_time.",
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
  res.status(200).json({ status: true, message: "Repair job ended successfully" });
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
  startReviewJob,
  endReviewJob,
  startRepairJob,
  endRepairJob,
};
