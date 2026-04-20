const db = require("../connection/dbConnection.js");

const COMPONENT_NAME = "machine_config";
const APP_ID = 15;
const COMPONENT_ID = 1067;

const syncMachineConfigCopy = async (updatedBy = "system") => {
  const getInspectionSql = "SELECT * FROM kwis_inspection_machine_config";
  const getRepairSql = "SELECT * FROM kwis_machine_setup";

  await db.addQuery("sync2_getInspectionMachineConfig", getInspectionSql);
  const inspectionResult = await db.runQuery("sync2_getInspectionMachineConfig", []);
  if (!inspectionResult.success) {
    throw new Error(inspectionResult.error || "Failed to fetch inspection machine config");
  }

  await db.addQuery("sync2_getRepairMachineConfig", getRepairSql);
  const repairResult = await db.runQuery("sync2_getRepairMachineConfig", []);
  if (!repairResult.success) {
    throw new Error(repairResult.error || "Failed to fetch repair machine config");
  }

  const configurationData = {
    inspection_machine: (inspectionResult.data || []).map((row) => ({
      machine_name: row.name || "",
      machine_ip: row.ip || "",
      machine_port: row.port || ":8889/",
      master_status: row.master_machine_status === 1 || row.master_machine_status === true,
    })),
    repair_machine: (repairResult.data || []).map((row) => ({
      repair_machine_id: row.repair_machine_id || null,
      repair_table_width: row.inspection_table_width !== undefined ? Number(row.inspection_table_width) : null,
      repair_offset: row.repairing_offset !== undefined ? Number(row.repairing_offset) : null,
      splice_offset: row.splicing_offset !== undefined ? Number(row.splicing_offset) : null,
      jogging_offset: row.jogging_offset !== undefined ? Number(row.jogging_offset) : null,
    })),
  };

  const getConfigSql = "SELECT * FROM kvp_system_configuration WHERE component_name = ? AND app_id = ?";
  await db.addQuery("sync2_getMachineConfigSystem", getConfigSql);
  const configResult = await db.runQuery("sync2_getMachineConfigSystem", [COMPONENT_NAME, APP_ID]);
  if (!configResult.success) {
    throw new Error(configResult.error || "Failed to fetch machine_config setting");
  }

  if (configResult.data.length > 0) {
    const updateSql = "UPDATE kvp_system_configuration SET configuration_data = ?, updated_by = ? WHERE component_name = ? AND app_id = ?";
    await db.addQuery("sync2_updateMachineConfigSystem", updateSql);
    const updateResult = await db.runQuery("sync2_updateMachineConfigSystem", [
      JSON.stringify(configurationData),
      String(updatedBy || "system"),
      COMPONENT_NAME,
      APP_ID,
    ]);
    if (!updateResult.success) {
      throw new Error(updateResult.error || "Failed to update machine_config setting");
    }
  } else {
    const insertSql = "INSERT INTO kvp_system_configuration (component_name, app_id, component_id, configuration_data, updated_by) VALUES (?,?,?,?,?)";
    await db.addQuery("sync2_insertMachineConfigSystem", insertSql);
    const insertResult = await db.runQuery("sync2_insertMachineConfigSystem", [
      COMPONENT_NAME,
      APP_ID,
      COMPONENT_ID,
      JSON.stringify(configurationData),
      String(updatedBy || "system"),
    ]);
    if (!insertResult.success) {
      throw new Error(insertResult.error || "Failed to insert machine_config setting");
    }
  }
};

//save machine details
const savemachine = async (req, res, next) => {
  let {
    inspection_table_width,
    splicing_offset,
    repairing_offset,
    jogging_offset,
    // correction_factor,
    user_id,
    repair_machine_id,
    updated_by,
  } = req.body;

  // Replace undefined or empty values with null
  inspection_table_width = inspection_table_width || null;
  splicing_offset = splicing_offset || null;
  repairing_offset = repairing_offset || null;
  jogging_offset = jogging_offset || null;
  // correction_factor = correction_factor || null;
  user_id = user_id || null;
  repair_machine_id = repair_machine_id || null;

  try {

    const insertMachinequery = `INSERT INTO kwis_machine_setup 
        (inspection_table_width, splicing_offset, repairing_offset, jogging_offset,  
        user_id, repair_machine_id, created_by, updated_by,created_at,updated_at) 
      VALUES (?,?,?,?,?,?,?,?,?,?)`;
    db.addQuery("insertMachinequery", insertMachinequery);

    let values = [];

    const date = new Date();
    const formattedTimestamp = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
      .getHours()
      .toString()
      .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;

      const machinevalue = [
        inspection_table_width,
        splicing_offset,
        repairing_offset,
        jogging_offset,
        // correction_factor,
        parseInt(user_id),
        repair_machine_id,
        user_id,
        user_id,
        formattedTimestamp,
        formattedTimestamp,
      ];
      try {
        let lastInsertId = await insertAndUpdate(
          insertMachinequery,
          machinevalue,
          "insert"
        );

        await syncMachineConfigCopy(updated_by || user_id || "system");

        return res.status(200).json({
          status: true,
          message: `machine inserted id : ${lastInsertId}`,
        });
      } catch (error) {
         return res
            .status(501)
            .json({ status: false, message: error });
      }
  } catch (error) {
    return res.status(501).json({ status: false, message: error.message });
  }
};

const updateMachine = async (req, res, next) => {
   let {
    inspection_table_width,
    splicing_offset,
    repairing_offset,
    jogging_offset,
    // correction_factor,
    user_id,
    repair_machine_id,
    repair_machine_setup_id,
    updated_by,
  } = req.body;

  // Replace undefined or empty values with null
  inspection_table_width = inspection_table_width || null;
  splicing_offset = splicing_offset || null;
  repairing_offset = repairing_offset || null;
  jogging_offset = jogging_offset || null;
  // correction_factor = correction_factor || null;
  user_id = user_id || null;
  repair_machine_id = repair_machine_id || null;

   try {
    const updateMachineQuery = `UPDATE kwis_machine_setup 
        SET inspection_table_width=?,splicing_offset=?,repairing_offset=?,jogging_offset=?,
        user_id=? ,repair_machine_id=?,updated_by=?,updated_at=? 
        WHERE repair_machine_setup_id=?`;
    db.addQuery("updateMachineQuery", updateMachineQuery);


    const date = new Date();
    const formattedTimestamp = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
      .getHours()
      .toString()
      .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;


        const machinevalue = [
          inspection_table_width,
          splicing_offset,
          repairing_offset,
          jogging_offset,
          // correction_factor,
          user_id,
          repair_machine_id,
          user_id,
          formattedTimestamp,
          repair_machine_setup_id,
        ];

        try {
          await insertAndUpdate(
            updateMachineQuery,
            machinevalue,
            "update"
          );

          await syncMachineConfigCopy(updated_by || user_id || "system");

          return res.status(200).json({
            status: true,
            message: `machine updated id : ${repair_machine_setup_id}`,
          });
        } catch (error) {
          console.log("error", error);
          return res
            .status(501)
            .json({ status: false, message: error });
        }
  } catch (error) {
    return res.status(501).json({ status: false, message: error.message });
  }


}

async function insertAndUpdate(query, value, mode) {
  return new Promise(async (resolve, reject) => {
    db.addQuery("insert_update_query", query);
    const insert_update_result = await db.runQuery(
      "insert_update_query",
      value
    );
    if (!insert_update_result.success) {
      reject(insert_update_result.error);
    }
    if (mode == "insert") {
      const lastInsertIdQuery = "SELECT LAST_INSERT_ID() AS lastID";
      db.addQuery("lastInsertIdQuery", lastInsertIdQuery);
      const lastInsertIdRe = await db.runQuery("lastInsertIdQuery");
      if (!lastInsertIdRe.success) {
        reject(lastInsertIdRe.error);
      }
      const lastID = lastInsertIdRe.data[0].lastID;
      resolve(lastID);
    } else {
      resolve(value[9]);
    }
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

const getAllMachines = async (req, res, next) => {
  let getMachineQuery =
    "select * from kwis_machine_setup";
  let value = [];
  db.addQuery("getMachineQuery", getMachineQuery);

  const getMachineResult = await db.runQuery("getMachineQuery", value);
  if (!getMachineResult.success) {
    return res
      .status(501)
      .json({ status: false, message: getMachineResult.error });
  }

  if (getMachineResult.data.length > 0) {
    return res.status(200).json({
      status: true,
      message: "success",
      data: getMachineResult.data,
    });
  } else {
    return res
      .status(200)
      .json({ status: false, message: "no records found", data: [] });
  }
};


//get all machine data
const getmachine = async (req, res, next) => {
  const repair_machine_id = req.params.repair_machine_id;
  let getMachineQuery =
    "select * from kwis_machine_setup where repair_machine_id=?";
  let value = [repair_machine_id];
  db.addQuery("getMachineQuery", getMachineQuery);

  const getMachineResult = await db.runQuery("getMachineQuery", value);
  if (!getMachineResult.success) {
    return res
      .status(501)
      .json({ status: false, message: getMachineResult.error });
  }

  if (getMachineResult.data.length > 0) {
    return res.status(200).json({
      status: true,
      message: "success",
      data: getMachineResult.data,
    });
  } else {
    return res
      .status(200)
      .json({ status: false, message: "no records found", data: [] });
  }
};

//delete machine details
const deleteMachine = async (req, res, next) => {
  const {repair_machine_setup_id, user_id, updated_by} = req.body;

  let deleteMachineQuery =
    "DELETE FROM kwis_machine_setup WHERE repair_machine_setup_id=?";
  let value = [repair_machine_setup_id];
  db.addQuery("deleteMachineQuery", deleteMachineQuery);

  const deleteMachineResult = await db.runQuery(
    "deleteMachineQuery",
    value
  );
  if (!deleteMachineResult.success) {
    return res
      .status(501)
      .json({ status: false, message: deleteMachineResult.error });
  }

  await syncMachineConfigCopy(updated_by || user_id || "system");

  return res.status(200).json({
    status: true,
    message: `machine deleted id : ${repair_machine_setup_id}`,
  });
};

module.exports = {
  savemachine,
  updateMachine,
  getAllMachines,
  getmachine,
  deleteMachine
};
