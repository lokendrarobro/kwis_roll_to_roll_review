import { Injectable,OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, } from 'rxjs';
import * as CryptoJS from 'crypto-js';
// import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class RollsService{
  // robro API

  ip_address_path = new BehaviorSubject<string>("") ;
  full_api_path = new BehaviorSubject<string>("");
  backend_api_variables = new BehaviorSubject<object>(
    {
      machine_ip:null,
      machine_port:null,
      machine_id:null,
      machine_name:null
    }
  );
  master_api_path = new BehaviorSubject<string>("");
  master_ip_path = new BehaviorSubject<string>("");
  user_role = new BehaviorSubject<string>("");
  constructor(private _httpClient: HttpClient,) {
  }

  initialize() {
    this.get_api_path();
  }

  get_api_path() {
    const ip = localStorage.getItem('machine_ip');
    const port = localStorage.getItem('machine_port');
    const selectedMachine = localStorage.getItem('machine_id');
    const machineName = localStorage.getItem('machine_name');
    const userRole = localStorage.getItem('role')
    const apiPath = localStorage.getItem('api_path');
    const masterMachineData = localStorage.getItem('master_machine_data');
    if(masterMachineData) {
      const masterMachineDataObj = JSON.parse(masterMachineData);
      const api_path = `http://${masterMachineDataObj.ip}${masterMachineDataObj.port}api/`;
      const ip_path = `http://${masterMachineDataObj.ip}:`
      this.master_ip_path.next(ip_path);
      this.master_api_path.next(api_path);
    }
    if(ip || port || selectedMachine) {
      this.backend_api_variables.next({
        machine_ip:ip,
        machine_port:port,
        machine_id:selectedMachine,
        machine_name:machineName
      })
      let api_path ;
      let ip_api_path;
      if(apiPath)
      {
        api_path = apiPath
        ip_api_path = apiPath.replace(/:\d+\/api\/?/i, "");
      }
      else
      {
        api_path = `http://${ip}${port}api/`;
        ip_api_path = `http://${ip}:`
      }
  
      this.ip_address_path.next(ip_api_path);
      this.full_api_path.next(api_path)
      this.user_role.next(userRole)

      return this.full_api_path.getValue();
    }
  }

  refreshApiPath() {
    const api_path = localStorage.getItem("api_path");
    this.full_api_path.next(api_path)
  }
  connection_check(api_path:any): Observable<any> {
    return this._httpClient.get(api_path);
  }

  get_all_rolls_id(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'rolls', data);
  }

  defecttypes(id: string): Observable<any> {
    const urlWithId = `${this.full_api_path.getValue()}+defecttypes/${id}`;
    return this._httpClient.get(urlWithId);
  }
  totaldefect(): Observable<any> {
    return this._httpClient.get(this.full_api_path.getValue() + 'totaldefect');
  }
  defectdelete(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'defectdelete', data);
  }
  get_rollsdatabyid(id: string): Observable<any> {
    // console.log(this.full_api_path)
    const urlWithId = `${this.full_api_path.getValue()}rolldetails/${id}`;
    return this._httpClient.get(urlWithId);
  }

  getRollsdata(id: string): Observable<any> {
    const urlWithId = `${this.full_api_path.getValue()}getRollDetails/${id}`;
    return this._httpClient.get(urlWithId);
  }

  get_pie_chart_data(id: string): Observable<any> {
    const urlWithId = `${this.full_api_path.getValue()}pie_chart_data/${id}`;
    return this._httpClient.get(urlWithId);
  }

  get_primary_roll_data(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'get_primary_roll_data', data);
  }

  get_additional_roll_data(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'get_additional_roll_data', data);
  }

  get_filter_defect(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'getfilterdefect', data);
  }
  update_roll(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'updateroll', data);
  }
  getframe(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'getframe', data);
  }
  getframefordefect(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'getframefordefect', data);
  }

  merge_defect(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'merge', data);
  }

  get_all_defects_by_roll_id(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'defect', data);
  }

  private loaderSubject = new BehaviorSubject<boolean>(false);
  loaderState = this.loaderSubject.asObservable();
  show() {
    this.loaderSubject.next(true);
  }

  hide() {
    this.loaderSubject.next(false);
  }


  saveMachine(data): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'savemachine', data);
  }

  updateMachine(data): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'updatemachine', data);
  }

  get_machine_data(id: string): Observable<any> {
    const urlWithId = `${(this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue())}getmachine/${id}`;
    return this._httpClient.get(urlWithId);
  }

  splice_repair_defect(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'update_defect_status', data);
  }
  get_current_meter_defect(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'get_current_meter_defect', data);
  }

  postStartReviewJob(data: any): Observable<any> {

    return this._httpClient.post(this.full_api_path.getValue() + 'startreviewjob', data);
  }

  postEndReviewJob(data) {
    return this._httpClient.post(this.full_api_path.getValue() + 'endreviewjob', data);
  }

  postStartRepairJob(data: any): Observable<any> {

    return this._httpClient.post(this.full_api_path.getValue() + 'startrepairjob', data);
  }

  postEndRepairJob(data) {
    return this._httpClient.post(this.full_api_path.getValue() + 'endrepairjob', data);
  }

  postRepairSpeed(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'saverepairspeed', data);
  }
  // getAllModelList(data): Observable<any> {
  //   return this._httpClient.post(this.full_api_path.getValue() + 'getAllModel',data);
  // }

  getAllModelList(data: { kvp_backend_url: string}): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'getAllModel', data);
  }

  
  getModelAllDefects(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'getFilterDefectByModelId', data);
  }

  get_all_roll_width_data(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'getAllRollWidth', data);
  }
  update_user_suggestion_defect(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'update_defect', data);
  }
  add_model(data): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'saveModel', data);
  }
  deleteDefectUserSuggestion(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'deleteDefectUserSuggestion', data);
  }
  // deleteModel(data): Observable<any> {
  //   return this._httpClient.post(this.full_api_path.getValue() + 'deleteModel', data);
  // }
  deleteModel(data: { kvp_backend_url: string, model_id: string }): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'deleteModel', data);
  }

  createPdf(data: any) {
    return this._httpClient.post(this.full_api_path.getValue() + 'downloadPdf', data, { responseType: 'blob' });
  }
  start_model_training(data): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'startModelTraining', data);
  }

  // get_all_model_training(): Observable<any> {
  //   return this._httpClient.get(this.full_api_path.getValue() + 'getAllModelTraining');
  // }
  get_all_model_training(data: { kvp_backend_url: string}): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'getAllModelTraining', data);
  }

  // robro API
  add_model_info(data): Observable<any> {
    return this._httpClient.post(`${(this.master_ip_path.getValue() ? this.master_ip_path.getValue(): this.ip_address_path.getValue())}3000/api/add_model_info`, data);
  }
  load_model(data): Observable<any> {
    return this._httpClient.post(`${(this.master_ip_path.getValue() ? this.master_ip_path.getValue(): this.ip_address_path.getValue())}3011/load_model`, data);
  }
  start_training(data): Observable<any> {
    return this._httpClient.post(`${(this.master_ip_path.getValue() ? this.master_ip_path.getValue(): this.ip_address_path.getValue())}3012/train_model`, data);
  }
  interrupt_training(data): Observable<any> {
    return this._httpClient.post(`${(this.master_ip_path.getValue() ? this.master_ip_path.getValue(): this.ip_address_path.getValue())}3012/interrupt_training`, data);
  }
  predict_defect_type(data): Observable<any> {
    return this._httpClient.post(`${(this.master_ip_path.getValue() ? this.master_ip_path.getValue(): this.ip_address_path.getValue())}3011/predict`, data);
  }

  upload_pdf(data): Observable<any> {
    return this._httpClient.post(`${this.ip_address_path.getValue()}3000/api/upload-pdf`, data);
  }

  send_sms_to_user(data): Observable<any> {
    return this._httpClient.post(`${this.ip_address_path.getValue()}3000/api/send-sms`, data);
  }
  send_email_to_user(data): Observable<any> {
    return this._httpClient.post(`${this.ip_address_path.getValue()}3000/api/send-email`, data);
  }

  update_defect(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'update_ai_suggestion', data);
  }
  end_model_training(data): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'endModelTraining', data);
  }
  read_model_file(data): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'readModelFile', data);
  }
  get_first_defect_position(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'getFirstDefectPosition', data);
  }
  get_filter_roll_width(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'getFilterRollWidth', data);
  }
  get_pagination_roll_width(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'getRollWidthData', data);
  }
  save_defect(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'save_defect', data);
  }
  addRollIdName(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'addRollIdName', data);
  }
  add_notes(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'saveNote', data);
  }
  get_notes(robro_roll_id):Observable<any> {
    const getNoteWithId = `${this.full_api_path.getValue()}getNote/${robro_roll_id}`;
    return this._httpClient.get(getNoteWithId);
  }
  saveUserTag(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'saveUserTag', data);
  }
  UpdateDefectsName(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'UpdateDefectsName', data);
  }
  updateDefectScore(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'updateDefectScore', data);
  }
  // addDefectType(data): Observable<any> {
  //   return this._httpClient.post(this.full_api_path.getValue() + 'addDefectType', data);
  // }

  getUniqueCameraIds(id: string): Observable<any> {
    const urlWithId = `${this.full_api_path.getValue()}getUniqueCameraIds/${id}`;
    return this._httpClient.get(urlWithId);
  }
  
  deleteRollAndDataById(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'deleteRollAndDataById', data);
  }
  addUserTag(data): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'addUserTag', data);
  }
  getUserTagList(): Observable<any> {
    return this._httpClient.get((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'getUserTagList');
  }
  getAllRecipes(): Observable<any> {
      return this._httpClient.get((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'getAllRecipes');
  }
  updateUserTag(data): Observable<any> {
    return this._httpClient.put((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'updateUserTag', data);
  }
  getUserTagById(data): Observable<any> {
    return this._httpClient.get((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'getUserTagById', data);
  }
  deleteUserTag(id): Observable<any> {
    return this._httpClient.delete((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + `deleteUserTag/${id}`);
  }
  getrole(): Observable<any> {
    return this._httpClient.get((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'getrole');
  }
  getAllModules(): Observable<any> {
    return this._httpClient.get((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'getAllModules');
  }
  addModuleVisibility(data): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'addModuleVisibility', data);
  }
  removeModuleVisibility(data): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'removeModuleVisibility', data);
  }
  getModuleVisibility(): Observable<any> {
    return this._httpClient.get((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'getModuleVisibility');
  }
  getFeatures(id): Observable<any> {
    return this._httpClient.get((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + `getFeatures/${id}`);
  }
  addFeaturePermission(data): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'addFeaturePermission', data);
  }
  removeFeaturePermission(data): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'removeFeaturePermission', data);
  }
  getAllFeaturePermission(data): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + `getAllFeaturePermission`,data);
  }

  getAllPdfGenerationConfigs(): Observable<any> {
    return this._httpClient.get((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + `getAllPdfGenerationConfigs`);
  }
  deletePdfGenerationConfig(id): Observable<any> {
    return this._httpClient.delete((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + `deletePdfGenerationConfig/${id}`);
  }
  addPdfGenerationConfig(data): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'addPdfGenerationConfig', data);
  }

  updatePdfGenerationConfig(data): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'updatePdfGenerationConfig', data);
  }

  updatePdfConfigStatus(data): Observable<any> {
    return this._httpClient.put((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'updatePdfConfigStatus', data);
  }
  addQualityCode(data): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'addQualityCode', data);
  }
  updateQualityCode(data): Observable<any> {
    return this._httpClient.put((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'updateQualityCode', data);
  }
  getAllQualityCodes(): Observable<any> {
    return this._httpClient.get((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + `getAllQualityCodes`);
  }
  getQualityCodeByName(quality_code): Observable<any> {
    return this._httpClient.get((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + `getQualityCodeByName/${quality_code}`);
  }
  deleteQualityCode(quality_code_id): Observable<any> {
    return this._httpClient.delete((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + `deleteQualityCode/${quality_code_id}`);
  }
  getColourCode():Observable<any>{
    return this._httpClient.get(this.full_api_path.getValue() + 'get_colour');
   }

   getUniquedefectsWithColor(id: string): Observable<any> {
    const urlWithId = `${this.full_api_path.getValue()}getUniquedefectsWithColor/${id}`;
    return this._httpClient.get(urlWithId);
  }
  getRollstatus(data):Observable<any>{
    return this._httpClient.post(this.full_api_path.getValue() + 'getRollStatus',data);
   }
   addActivityLog(data): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'addActivityLog', data);
  }
  savePdfToServer(formData: FormData): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + 'save-pdf', formData); // Adjust URL as per backend route
  }

  getAllUniqueDefectTypes(): Observable<any> {
    return this._httpClient.get(this.full_api_path.getValue() + 'getAllUniqueDefectTypes'); // Adjust URL as per backend route
  }
  
  restoreJob(data): Observable<any> {
    // Use the selected master IP and port from localStorage
    const ip = localStorage.getItem('machine_ip') || 'localhost';
    const port = ':5602/';
    const url = `http://${ip}${port}api/restoreJobs`;
    console.log('Restore Job URL:', url); // Debugging line
    return this._httpClient.post(url, data);
  }

  getInspectionSpeedData(id:any): Observable<any> {
    return this._httpClient.get(this.full_api_path.getValue() + `getInspectionSpeedData/${id}`); // Adjust URL as per backend route
  }

  getSlittingData(roll_id: string): Observable<any> {
    return this._httpClient.get(this.full_api_path.getValue() + `getSlittingData/${roll_id}`); // Adjust URL as per backend route
  }

  getReviewRollId(): Observable<any> {
    return this._httpClient.get(this.full_api_path.getValue() + `getReviewRollId`); // Adjust URL as per backend route
  }

  createExcelSheet(payload: any, baseUrl: string) {
    return this._httpClient.post(`${baseUrl}createExcelSheet`, payload, { responseType: 'blob' });
  }

  addUpdateSpliceDetails(data:any): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + `addUpdateSpliceDetails`,data);
  }

  deleteSpliceDetails(data:any): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + `deleteSpliceDetails`,data);
  }

  getRepairSpeedData(id:any): Observable<any> {
    return this._httpClient.get(this.full_api_path.getValue() + `getRepairSpeedData/${id}`);
  }

  getSpliceData(roll_id: string): Observable<any> {
    return this._httpClient.get(this.full_api_path.getValue() + `getSpliceData/${roll_id}`); 
  }
  
  updateSpliceMeter(data: any): Observable<any> {
    return this._httpClient.post(this.full_api_path.getValue() + `updateSpliceMeter`,data);
  }

  getCustomerLogoStatus(): Observable<any> {
    return this._httpClient.get((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + `getCustomerLogoStatus`);
  }

  addSystemConfiguration(data:any): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + `addSystemConfigurationSetting`,data);
  }

  getSystemConfiguration(data:any): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + `getSystemConfigurationSetting`,data);
  }

  getAllMachines(): Observable<any> {
    const url = `${(this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue())}getAllMachines`;
    return this._httpClient.get(url); 
  }

  deleteMachine(data:any): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'deleteMachine', data);
  }

  saveInspectionMachine(data:any): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'saveInspectionMachineData', data);
  }

  getAllInspectionMachine(): Observable<any> {
    return this._httpClient.get((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'getInspectionMachineData');
  }

  updateInspectionMachine(data:any): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'updateInspectionMachineData', data);
  }

  deleteInspectionMachine(data:any): Observable<any> {
    return this._httpClient.post((this.master_api_path.getValue() ? this.master_api_path.getValue(): this.full_api_path.getValue()) + 'deleteInspectionMachine', data);
  }

  downloadExcel(data:any): Observable<Blob> {
    return this._httpClient.post(
      this.full_api_path.getValue() + `downloadExcel`,
      data,
      { responseType: 'blob' }
    );
  }

  getExcelBinaryData(data:any): Observable<Blob> {
    return this._httpClient.post(
      this.full_api_path.getValue() + `getExcelBinaryData`,
      data,
      { responseType: 'blob' }
    );
  }

  getTotalSpliceMeter(rollid: string): Observable<any> {
    const urlWithId = `${this.full_api_path.getValue()}getTotalSpliceMeter/${rollid}`;
    return this._httpClient.get(urlWithId);
  }
}
