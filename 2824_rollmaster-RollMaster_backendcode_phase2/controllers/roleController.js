const db = require("../connection/dbConnection.js");

//get all rolls data
const getrole = async (req, res, next) => {
  let sql = "select * from kwis_role";
  db.addQuery("getRole", sql);
  let params = [];
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



module.exports = {
  getrole,
};
