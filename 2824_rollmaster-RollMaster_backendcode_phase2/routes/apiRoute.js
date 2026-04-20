let express = require("express");
const multer = require('multer');
const reviewRepaireJobLogController = require("../controllers/reviewRepairLogController.js");
const apiController = require("../controllers/apiController.js");
const defectController = require("../controllers/defectController.js");
const rollController = require("../controllers/rollController");
const authController = require("../controllers/authController.js");
const machineController = require("../controllers/machineController.js");
const repiarDetailsController = require("../controllers/repairDetailsController.js");
const modelController = require("../controllers/modelController.js");
const modelTrainingController = require("../controllers/modelTrainingController.js");
const rollWidthController = require("../controllers/rollWidthController.js");
const settingController = require("../controllers/settingController.js");
const userController = require("../controllers/userController.js");
const settingConfigurationController = require("../controllers/settingConfigurationController.js");
const createExcelController = require("../controllers/createExcelController.js");
const inspectionMachineController = require("../controllers/inspectionMachineController.js");
const router = express.Router();
const upload = multer();
const path = require('path');
const fs = require('fs');

// Setup multer storage (memory)
const storage1 = multer.memoryStorage();
const upload1 = multer({
  storage: storage1,
  limits: { fileSize: 500 * 1024 * 1024 } // 500 MB
});

router.post('/save-pdf', upload1.single('pdf'), (req, res) => {
  const fileBuffer = req.file.buffer;
  const filename = req.file.originalname;
  const roll_id = req.body.rollid;
  const savePath = path.join('/kwis_report/', roll_id , filename); // Save to current directory
  const folderPath = path.join('/kwis_report/', roll_id);

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // Need to create a directory in the Name of Roll id 


  fs.writeFile(savePath, fileBuffer, (err) => {
    if (err) {
      console.error('Error saving PDF:', err);
      return res.status(500).json({ success: false, message: 'Failed to save PDF' });
    }
    return res.status(200).json({ success: true, path: savePath });
  });
});

//login
router.post("/login",apiController.login);
router.post("/get_primary_roll_data",apiController.getPrimaryRollData);
router.post("/get_additional_roll_data",apiController.getAdditionalRollData);
router.post("/addRollIdName", apiController.addRollIdName);
router.post("/deleteRollAndDataById", apiController.deleteRollAndDataById);
router.post("/addActivityLog",apiController.addActivityLog)

// start/end review jobs
router.post("/startreviewjob", reviewRepaireJobLogController.startReviewJob);
router.post("/endreviewjob", reviewRepaireJobLogController.endReviewJob);

// start/end review jobs
router.post("/startrepairjob", reviewRepaireJobLogController.startRepairJob);
router.post("/endrepairjob", reviewRepaireJobLogController.endRepairJob);

//rolls routing
//get all rolls
router.post("/rolls",rollController.rolls);
//get roll details for rollid
router.get("/getRollDetails/:rollid",rollController.getRollDetails);
//get roll details for rollid
router.get("/rolldetails/:rollid",rollController.details);
//get Pie Chart data for rollid
router.get("/pie_chart_data/:rollid",rollController.getPieChartData);
//done review_flag for rollid 
router.post("/updateroll",rollController.updateRoll);
//get all roll width for rollid
router.post("/getAllRollWidth",rollController.getAllRollWidth);
//download pdf for rollid
router.post("/downloadPdf",rollController.downloadPdf);
//download pdf for rollid
router.post("/downloadExcel",rollController.downloadExcel)
//note 
router.post("/saveNote", rollController.saveNote);
router.get("/getNote/:robro_roll_id", rollController.getNote);
router.post("/UpdateDefectsName", rollController.UpdateDefectsName);
router.post("/updateDefectScore", rollController.updateDefectScore);
// router.post("/addDefectType", rollController.addDefectType);
router.get("/getUniquedefectsWithColor/:rollid",rollController.getUniquedefectsWithColor);
router.post("/getRollStatus", rollController.getRollStatus);
//get all inspection speed data
router.get("/getInspectionSpeedData/:rollid", rollController.getInspectionSpeedData);
//get Review roll id
router.get("/getReviewRollId", rollController.getReviewRollId);
//add splice details
router.post("/addUpdateSpliceDetails",rollController.addUpdateSpliceDetails);
// delete splice details
router.post("/deleteSpliceDetails", rollController.deleteSpliceDetails);
//get all repair speed data
router.get("/getRepairSpeedData/:rollid", rollController.getRepairSpeedData);
//get splice data
router.get("/getSpliceData/:rollid", rollController.getSpliceData);

//check roll exists
router.post("/checkRollExists",rollController.checkRollExists);
router.get("/fetchAllQualityCodes", rollController.getAllQualityCodes);
// get total splice meter for rollid
router.get("/getTotalSpliceMeter/:rollid", rollController.getTotalSpliceMeter);

//defects routing
//get all defect for rollid
router.post("/defect",defectController.defects);
//get all defect for rollid for datatable
router.post("/defect_for_datatable",defectController.getdefectfordatatable);
//get defect type for rollid
router.get("/defecttypes/:rollid",defectController.defectTypes);
router.get("/getAllUniqueDefectTypes", defectController.getAllUniqueDefectTypes);
//get defect details by defectid for rollid
router.get("/defectdetails/:rollid/:defectid",defectController.defectDetails);
//get total defect type
// router.get("/totaldefect",defectController.totalDefect);
//delete defect by defectid
router.post("/defectdelete",defectController.defectdelete);
//get all defect for rollid with filter
router.post("/getfilterdefect",upload.none(),defectController.filterDefects);
//merge defect
router.post("/merge",defectController.defectMerge);
// get defect for current meter
router.post('/get_current_meter_defect',defectController.current_meter_filter_Defects);
//update defect
router.post('/update_defect',upload.none(),defectController.updateUserSuggestion);
//update defect ai suggestion
router.post('/update_ai_suggestion',defectController.updateDefects)
//get first defect data
router.post('/getFirstDefectPosition',defectController.getFirstDefectPosition)
//insert defect 
router.post('/save_defect',defectController.saveDefect)
//get_colours
router.get('/get_colour',defectController.getColours)
//get slitting data
router.get('/getSlittingData/:roll_id', defectController.getSlittingData);
router.post('/update_defect_status',defectController.updateStatus);
router.get("/getUniqueCameraIds/:rollid",rollController.getUniqueCameraIds);
router.post('/unDeleteDefect',defectController.unDeleteDefects);
router.post('/updateSpliceMeter',defectController.updateSpliceMeter);

//auth routing
//refresh token api
router.post("/refreshtoken",authController.refreshtoken);
//refresh token api review
router.post("/refreshtokenreview",authController.refreshtokenreview)
//check token expire 
router.get("/checkexpire",authController.checkExpire)

//user routing
//get role
router.get('/getrole',userController.getrole);
//get customer logo status
router.get('/getCustomerLogoStatus',userController.getCustomerLogoStatus);

//machine routing
// save machine data
router.post("/savemachine",upload.none(),machineController.savemachine);
// update machine data
router.post("/updatemachine",upload.none(),machineController.updateMachine);
// get all machine data
router.get("/getAllMachines",machineController.getAllMachines);
// get machine data 
router.get("/getmachine/:repair_machine_id",machineController.getmachine);
// delete machine data
router.post("/deleteMachine",upload.none(),machineController.deleteMachine);


//model routing
// save model data
router.post("/saveModel",upload.none(),modelController.saveModel);
// get all model data 
router.post("/getAllModel",modelController.getAllModel);
//get all defect for model_id with filter
// delete model
router.post("/deleteModel",modelController.deleteModel);
router.post("/getFilterDefectByModelId",upload.none(),modelController.getFilterDefectByModelId);
//read model file 
router.post("/readModelFile",modelController.readModelFile);
router.post("/deleteDefectUserSuggestion",modelController.deleteDefectUserSuggestion);

//model training routing
// start model training
router.post("/startModelTraining",upload.none(),modelTrainingController.saveModelTraining);
// get all model training data 
router.post("/getAllModelTraining",modelTrainingController.getModelTraining);
// end model training  
router.post("/endModelTraining",modelTrainingController.endModelTraining);


//roll_repair_details routing
//save roll_repair_details
router.post("/saverepairspeed",repiarDetailsController.saveRepairSpeed);


//rolls_width routing
router.post("/getFilterRollWidth",upload.none(),rollWidthController.filterRollWidth);
router.post("/getRollWidthData",upload.none(),rollWidthController.paginationRollWidth);
//Rolls page add user tag and get all user tags
router.post("/saveUserTag", rollController.saveUserTag);

//Settings page - user tags
router.post("/addUserTag",settingController.addUserTag);
router.put("/updateUserTag",settingController.updateTag);
router.get("/getUserTagList",settingController.getUserTagsList);
router.get("/getAllRecipes",settingController.getAllRecipes);

router.delete("/deleteUserTag/:user_tag_id",settingController.deleteTag);

//Settings page - module visibility
router.get("/getAllModules",settingController.getAllModules);
router.post("/addModuleVisibility",settingController.addModuleVisibility);
router.post("/removeModuleVisibility",settingController.removeModuleVisibility);
router.get("/getModuleVisibility",settingController.getModuleVisibility);
router.get("/getFeatures/:module_id",settingController.getFeatures)
router.post("/addFeaturePermission",settingController.addFeaturePermission)
router.post("/removeFeaturePermission",settingController.removeFeaturePermission)
router.post("/getAllFeaturePermission",settingController.getAllFeaturePermission)

//Settings page - pdg generation config
router.post("/addPdfGenerationConfig",upload1.single('logo'),settingController.addPdfGenerationConfig);
router.post("/updatePdfGenerationConfig",upload1.single('logo'),settingController.updatePdfGenerationConfig);
router.get("/getAllPdfGenerationConfigs",settingController.getAllPdfGenerationConfigs);
router.get("/getPdfGenerationConfigById/:id",settingController.getPdfGenerationConfigById);
router.delete("/deletePdfGenerationConfig/:id",settingController.deletePdfGenerationConfig);
router.put("/updatePdfConfigStatus",settingController.updatePdfConfigStatus);

//Setting page - Quality code
router.post("/addQualityCode",settingController.addQualityCode);
router.put("/updateQualityCode",settingController.updateQualityCode);
router.get("/getAllQualityCodes",settingController.getAllQualityCodes);
router.get("/getQualityCodeByName/:quality_code",settingController.getQualityCodeByName);
router.delete("/deleteQualityCode/:quality_code_id",settingController.deleteQualityCode);

router.post("/addFeaturePermission",settingController.addFeaturePermission)
router.post("/removeFeaturePermission",settingController.removeFeaturePermission)
router.post("/getAllFeaturePermission",settingController.getAllFeaturePermission)
router.put("/updatePdfConfigStatus",settingController.updatePdfConfigStatus);

//Setting Configuration routes
router.post("/addSystemConfigurationSetting",settingConfigurationController.addSystemConfigurationInfo)
router.post("/getSystemConfigurationSetting",settingConfigurationController.getSystemConfiguration)

//create excel sheet
router.post("/getExcelBinaryData", createExcelController.getExcelBinaryData);
router.post("/createExcelSheetForEmail", createExcelController.createExcelSheetForEmail);
router.post("/CheckRollUpdates", createExcelController.CheckRollUpdates);

router.get("/getInspectionMachineData",inspectionMachineController.getInspectionMachineData);
router.post("/saveInspectionMachineData",inspectionMachineController.saveInspectionMachineData);
router.post("/updateInspectionMachineIp",inspectionMachineController.updateInspectionMachineIp);
router.post("/updateInspectionMachineData",inspectionMachineController.updateInspectionMachineData);
router.post("/deleteInspectionMachine",inspectionMachineController.deleteInspectionMachine);

module.exports = router;
