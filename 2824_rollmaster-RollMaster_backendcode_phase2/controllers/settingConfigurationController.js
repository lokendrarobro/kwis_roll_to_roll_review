const db = require("../connection/dbConnection.js");

const addSystemConfigurationInfo = async (req, res, next) => {
  try {
    const {
      app_id,
      configuration_data,
      component_id,
      component_name,
      updated_by
    } = req.body;
    let sql;
    let values;
    let message = '';
   
    if (!app_id || !configuration_data || !updated_by) {
      return res.status(500).json({ status: false, message: "required field is missing" });
    }
    else {
      let getConfigurationData = "SELECT * FROM kvp_system_configuration WHERE component_name = ? AND app_id = ?";
      await db.addQuery("getConfigurationData", getConfigurationData);
      const getConfigurationDataResult = await db.runQuery("getConfigurationData", [component_name, app_id]);
      if (getConfigurationDataResult.data.length > 0) {
        sql = `UPDATE kvp_system_configuration SET configuration_data = ? WHERE component_name = ? AND app_id = ?`;
        values = [configuration_data, component_name, app_id];
        message = "Updated"
      }
      else {
        sql = "INSERT INTO kvp_system_configuration (component_name, app_id, component_id,configuration_data, updated_by) VALUES (?,?,?,?,?);"
        values = [component_name, app_id, component_id, configuration_data, updated_by];
        message = "Inserted"
      }
    }

    await db.addQuery("addSystemConfigurationInfo", sql);
    const result = await db.runQuery("addSystemConfigurationInfo", values);
    if (result.affectedRows === 0) {
      res.status(200).json({ status: true, message: "No Rows Updated" });
    }
    else {
      res.status(200).json({ status: true, message: `Setting ${message} Successfully` });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: "Internal server error", error });
  }
};

const getSystemConfiguration = async (req, res) => {
  const { component_name } = req.body;
  try {
    const sql = `SELECT * FROM kvp_system_configuration WHERE component_name = ?`;
    const value = [component_name];

    await db.addQuery("getSystemConfiguration", sql);
    const result = await db.runQuery("getSystemConfiguration", value);
    if (result.data.length === 0) {
      return res.status(200).json({
        status: true,
        message: "No configuration found, using default",
        data: []
      });
    }
    else {
      res.status(200).json({ status: true, message: "Setting Configuration Fetched", data: result.data })
    }
    // const setting = JSON.parse(result[0].configuration_data);

  } catch (error) {
    return res.status(500).json({ status: false, message: "Internal server error", error })
  }
}


function formatTimestamp(date) {
  const formattedTimestamp = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  return formattedTimestamp;
}


module.exports = {
  addSystemConfigurationInfo,
  getSystemConfiguration
}
