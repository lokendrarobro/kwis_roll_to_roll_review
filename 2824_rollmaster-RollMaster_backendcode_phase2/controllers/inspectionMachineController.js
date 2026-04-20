const db = require("../connection/dbConnection.js");

const COMPONENT_NAME = "machine_config";
const APP_ID = 15;
const COMPONENT_ID = 1067;

const syncMachineConfigCopy = async (updatedBy = "system") => {
  const getInspectionSql = "SELECT * FROM kwis_inspection_machine_config";
  const getRepairSql = "SELECT * FROM kwis_machine_setup";

  await db.addQuery("sync_getInspectionMachineConfig", getInspectionSql);
  const inspectionResult = await db.runQuery("sync_getInspectionMachineConfig", []);
  if (!inspectionResult.success) {
    throw new Error(inspectionResult.error || "Failed to fetch inspection machine config");
  }

  await db.addQuery("sync_getRepairMachineConfig", getRepairSql);
  const repairResult = await db.runQuery("sync_getRepairMachineConfig", []);
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
  await db.addQuery("sync_getMachineConfigSystem", getConfigSql);
  const configResult = await db.runQuery("sync_getMachineConfigSystem", [COMPONENT_NAME, APP_ID]);
  if (!configResult.success) {
    throw new Error(configResult.error || "Failed to fetch machine_config setting");
  }

  if (configResult.data.length > 0) {
    const updateSql = "UPDATE kvp_system_configuration SET configuration_data = ?, updated_by = ? WHERE component_name = ? AND app_id = ?";
    await db.addQuery("sync_updateMachineConfigSystem", updateSql);
    const updateResult = await db.runQuery("sync_updateMachineConfigSystem", [
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
    await db.addQuery("sync_insertMachineConfigSystem", insertSql);
    const insertResult = await db.runQuery("sync_insertMachineConfigSystem", [
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

//get all machine data
const getInspectionMachineData = async (req, res, next) => {
  let getMachineQuery =
    "select * from kwis_inspection_machine_config";
  db.addQuery("getMachineQuery", getMachineQuery);
    let value = [];
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

//insert machine data
const saveInspectionMachineData = async (req, res, next) => {
  let {
    machine_name,
    ip_address,
    port,
    master_machine_status,
    updated_by
  } = req.body;

  try {
    const insertMachinequery = `INSERT INTO kwis_inspection_machine_config 
        (name, ip, port, master_machine_status) 
      VALUES (?,?,?,?)`;
    db.addQuery("insertMachinequery", insertMachinequery);

    let values = [machine_name,ip_address,port,master_machine_status];

    const Result =await db.runQuery("insertMachinequery",values);

    if (!Result.success) {
      return res
        .status(501)
        .json({ status: false, message: Result.error });
    }

    await syncMachineConfigCopy(updated_by || "system");

    res.status(200).json({
      status: true,
      message: "Machine Details Saved Successfully!!!"
    });
  } catch (error) {
    return res.status(501).json({ status: false, message: error.message });
  }
};

//update masterIp
const updateInspectionMachineIp = async (req, res) => {
  try {
    const { machine_id,machine_ip, updated_by } = req.body;

    if (!machine_id || !machine_ip) {
      return res.status(501).json({ status: false, message: "Required value is missing" });
    }

    let sql = "UPDATE kwis_inspection_machine_config SET ip = ? WHERE id = ?";
    db.addQuery("updateSql", sql);
    const result = await db.runQuery("updateSql", [machine_ip, machine_id]);
    if (result?.success && result?.affectedRows === 0) {
      return res.status(404).json({ status: false, message: "machine id not found or not updated." });
    }
    if (!result?.success && result?.error) {
      return res.status(404).json({ status: false, message: result?.error });
    }

    await syncMachineConfigCopy(updated_by || "system");

    res.status(200).json({ status: true, message: "Machine Data Updated Successfully" });
  } catch (error) {
    res.status(500).json({ status: false, message: "Error Updating Machine", error: error.message });
  }
};

//update master machine
const updateInspectionMachineData = async (req, res) => {
  try {
      let {
        machine_name,
        ip_address,
        port,
        master_machine_status,
        machine_id,
        updated_by
      } = req.body;


    if (!machine_id) {
      return res.status(501).json({ status: false, message: "machine_id is required" });
    }

    let sql = "UPDATE kwis_inspection_machine_config SET name = ?, ip = ?, port = ?, master_machine_status = ? WHERE id = ?";
    db.addQuery("updateSql", sql);
    const result = await db.runQuery("updateSql", [
      machine_name, 
      ip_address,
      port,
      master_machine_status,
      machine_id
    ]);
    if (result?.success && result?.affectedRows === 0) {
      return res.status(404).json({ status: false, message: "machine id not found or not updated." });
    }
    if (!result?.success && result?.error) {
      return res.status(404).json({ status: false, message: result?.error });
    }

    await syncMachineConfigCopy(updated_by || "system");

    res.status(200).json({ status: true, message: "Machine Data Updated Successfully" });
  } catch (error) {
    res.status(500).json({ status: false, message: "Error Updating Machine", error: error.message });
  }
};

//delete machine details
const deleteInspectionMachine = async (req, res, next) => {
  const { machine_id, updated_by } = req.body;

  let deleteMachineQuery =
    "DELETE FROM kwis_inspection_machine_config WHERE id=?";
  let value = [machine_id];
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

  await syncMachineConfigCopy(updated_by || "system");

  return res.status(200).json({
    status: true,
    message: `machine deleted id : ${machine_id}`,
  });
};

module.exports = {
  getInspectionMachineData,
  saveInspectionMachineData,
  updateInspectionMachineIp,
  updateInspectionMachineData,
  deleteInspectionMachine
};
