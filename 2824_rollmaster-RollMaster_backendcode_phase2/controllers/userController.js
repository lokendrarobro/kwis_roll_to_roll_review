const db = require("../connection/dbConnection.js");
const fs = require("fs");
const path = require("path");

const getrole =async (req, res, next) => {
  let getRoleQuery = "select * from kwis_role";
  let params = [];

  db.addQuery("getRoleQuery", getRoleQuery);

  const getRoleResult =await db.runQuery("getRoleQuery");

  if (!getRoleResult.success) {
    return res
      .status(501)
      .json({ status: false, message: getRoleResult.error });
  }

  res.status(200).json({
    status: true,
    message: "success",
    data: getRoleResult.data,
  });
};

const getCustomerLogoStatus = async (req, res, next) => {
   const folderPath = path.join(__dirname, "../uploads/customer_logo");

  // Check if folder exists
  if (!fs.existsSync(folderPath)) {
    return res.status(404).json({
      status: false,
      message: "Folder does not exist"
    });
  }

  try {
    const files = fs.readdirSync(folderPath);

    return res.json({
      status: true,
      files: files,
      isEmpty: files.length === 0,
      message: files.length > 0 ? "Files found" : "Folder is empty"
    });

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error reading folder",
      error: error.message
    });
  }
};


module.exports = {
  getrole,
  getCustomerLogoStatus
};
