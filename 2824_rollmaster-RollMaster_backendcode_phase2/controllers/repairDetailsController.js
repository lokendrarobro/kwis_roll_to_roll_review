const db = require("../connection/dbConnection.js");

//get all machine data
const getmachine = async (req, res, next) => {
  const machine_id = req.params.machineid;
  let getMachineQuery = "select * from kwis_machine_setup where repair_machine_setup_id=?";
  let value = [machine_id];

  db.addQuery("getMachineQuery", getMachineQuery);
  const getmachineResult =await db.runQuery("getMachineQuery", value);

  if (!getmachineResult.success) {
      return res
        .status(501)
        .json({ status: false, message: getmachineResult.error });
  } else if (getmachineResult.data.length > 0) {
    return res
      .status(200)
      .json({ status: true, message: "success", data: getmachineResult.data });
  } else {
    return res
      .status(501)
      .json({ status: false, message: "no records found", data: [] });
  }
};

const saveRepairSpeed = async(req, res, next)=>{
  const { current_meter, current_speed ,repair_job_id, robro_roll_id} = req.body;
  const date = new Date();
 const updated_at= `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
    .getHours()
    .toString()
    .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
    .getSeconds()
    .toString()
    .padStart(2, "0")}`
  let values =[current_meter,current_speed,repair_job_id, robro_roll_id,updated_at]
  
  let insertRepairSpeed='INSERT INTO kwis_repair_speed_log (current_meter, current_speed, repair_job_id,robro_roll_id,updated_at)VALUES (?,?,?,?,?)';
  db.addQuery("insertRepairSpeed", insertRepairSpeed);
  const repairSpeedResult= await db.runQuery("insertRepairSpeed",values);
  if(!repairSpeedResult.success){
    return res
      .status(501)
      .json({ status: false, message: repairSpeedResult.error });
  }else{
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
    return res
      .status(200)
      .json({ status: true, message: 'success' });
  }
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
  getmachine,
  saveRepairSpeed
};
