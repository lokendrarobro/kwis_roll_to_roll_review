import {
  Component,
  Renderer2,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  Input,
} from "@angular/core";
import { NavigationService } from "app/core/navigation/navigation.service";
import { IDropdownSettings } from "ng-multiselect-dropdown";
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
  AbstractControl,
} from "@angular/forms";
import { RollsService } from "app/services/rolls.service";
import { Router } from "@angular/router";
import { Subscription, takeUntil, Subject ,of} from "rxjs";
import * as ROSLIB from "roslib";
import { ToastrService } from "ngx-toastr";
import { UserService } from "app/core/user/user.service";
import { User } from "app/core/user/user.types";
import { catchError, debounceTime, switchMap, tap } from "rxjs/operators";
import { defaultFeatureActivityList } from "app/globalvariables/globalvariables";
import { CommonService } from "app/services/common.service";
import { TranslocoService } from "@ngneat/transloco";
import { ECharts } from 'echarts';
import { retry } from 'rxjs/operators';

@Component({
  selector: "app-repair",
  templateUrl: "./repair.component.html",
  styleUrls: ["./repair.component.scss"],
})
export class RepairComponent {
  @ViewChild("canvasElement", { static: true })
  canvasElement: ElementRef<HTMLCanvasElement>;
  canvasheight: any = "800";
  @ViewChild("canvasstripElement", { static: true })
  canvasstripElement: ElementRef<HTMLCanvasElement>;
  @ViewChild("canvasContainer") canvasContainer!: ElementRef;
  increase_array_count = 0;
  Setting = false;
  continueButtonId: boolean = false;
  current_repair_meter: any = 0;
  next_defect_positons: any = 0;
  next_stop_at: any = 0;
  send_nextdefect: any = 0;
  machine_mode: string = "stop";
  previous_machine_mode: string = "jogging";
  next_defect_repair_type: any = "";
  config_check: any = true;
  showconfigcheck: any = false;
  showStopMachineConfirm: any = false;
  ipaddress: any = `${(window as any).__env.roslibipaddress}`;
  startButtonId = true;
  machineRunningStatus: boolean = false;
  canvas_height: number = 0;
  canvas_width: number = 640;
  canvas_width_new: number = 640;
  map_default_width_for_repair: any = `${(window as any).__env.map_default_width}`;
  canvas_height_new: number = 0;
  canvas_strip_height: any = 0;
  canvas_strip_width: any = 0;
  private canvas: HTMLCanvasElement;
  private canvasstrip: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ctxstrip: CanvasRenderingContext2D;

  private panX: number = 0;
  private panY: number = 0;
  private frames: any[] = [];

  private zoomFactor: number = 1.0;
  private zoomFactorstrip: number = 1.0;
  private minZoom: number = 1.0;
  private maxZoom: number = 5;
  permeter_width: any = 0;
  permeter_height: any = 0;
  metercal = 1000;
  verticalscaleheight = 50;
  horizantalwidth = 50;
  vertical_width = 80;
  totalscalelength: number = 0;
  startmeter: any = 0;
  endmeter: any = 0;
  totalmeter: any;
  tempstrip_height: any = 0;
  imagebasepath: any =`${localStorage.getItem('api_path')?.replace('/api', '')}`+ 'uploads/';
  startLimitFilter: any = 0;
  endLimitFilter: any = 500;
  xscaletotalheight: any;
  yscaletotalheight: any = 0;

  yellowstripposX: any = 0;
  yellowstripposX1: any = 60;
  yellowstripposY: any = 0;
  yellowstripposY1: any = 0;
  totalnopages: any = 0;
  suggestForDeletion: boolean = false;
  next_defect_name: any;
  previous_current_repair_meter: any = 0;
  on_init_previous_meter: boolean = true;
  tempstripdata: any;
  checkdefect: any;

  startLimitstrip: number = 0;
  endLimitstrip: number = 500;
  temp_current_repair_meter: any = 0;
  previous_end_meter: any;
  tmep_start_meter: any;
  temp_end_meter: any;
  remaining_meter: any = 0;
  next_defect_data: any = 0;
  repairJobId;
  lastSpeedRecordTime = Date.now();
  fisrtDefectPosition:any;
  @Input() featurePermissions: any[] = [];
  module_id: any = 5;
  loggedInRole: any = localStorage.getItem('role_id');
  spliceDefectStatus: boolean = false;
  repairDefectStatus: boolean = false;
  suggetionForDeleteDefectStatus: boolean = false;
  rollRunningStatus: boolean  = false;
  editMachineConfigurationStatus: boolean = false;
  doneRepairStatus: boolean = false;
  remaining_defect_count = 12;
  // current_speed = '35 m/min';
  total_repaired = 28;
  total_override = 3;
  total_defects_splice = 7;
  total_defect_approved = 18;
  private repairMeterUpdateInterval: any = null; // Add this property to your class
  start_Splice_current_meter: any = 0;
  splice_meter: number = 0;
  splice_stop_at :any = 0;
  avg_speed: number = 0;
  lastAvgUpdateTime = 0;
  lastRecordTime = 0;
  repairCount: number = 0;
  spliceCount: number = 0;
  overrideCount: number = 0;
  apporvedDefectCount: number = 0;
  remainingDefectCount: number = 0;
  mergedZoomLevel = 1;
  mergedX = 0;
  mergedY = 0;
  mergedStart = { x: 0, y: 0 };
  mergedPanning = false;

  mergedImgWidth = 0;
  mergedImgHeight = 0;

  mergedContainerWidth = 0;
  mergedContainerHeight = 0;

  // Default origin
  mergedOrigin = "50% 50%";
  showInfo: boolean = true;
  next_defect_type: any = 'NA';
  next_operation:any = 'NA';
  machine_status: any = false;
  machineControlLoading = false;

 
  showSetting() {
    if (this.machineRunningStatus) {
      this.toastrService.warning("Machine is currently running. Cannot edit.");
    } else {
      this.Setting = true;
    }
  }
  hideSetting() {
    this.Setting = false;
  }
  private ros: ROSLIB.Ros;
  private listener: ROSLIB.Topic;
  private publisher: ROSLIB.Topic;
  dropdownList = [];
  selectedItems = [];
  checked_defect: any;
  dropdownSettings: IDropdownSettings = {};
  clickedFields: { [key: string]: boolean } = {};
  checkedItems: any = [];
  id: any;
  status: any;
  temp: any = [];
  temp1: any = [];
  private xAxisSubscription: Subscription | undefined;
  private yAxisSubscription: Subscription | undefined;
  private DefectSizeSubscription: Subscription | undefined;
  isTyping: boolean = false;
  Form: FormGroup = new FormGroup({
    inspection_table_width: new FormControl(""),
    splicing_offset: new FormControl(""),
    repairing_offset: new FormControl(""),
    jogging_offset: new FormControl(""),
    // correction_factor: new FormControl(""),
    repair_machine_id: new FormControl(""),
  });
  all_defects: any;
  all_defect_types: any;
  roll_id: string;
  totalAllDefects: any;
  AllDefectsData: any = [];
  selectedAll: boolean = false;
  customer_roll_id: string;
  role_data: any = [];
  nodeDataArray_strip: any = [];
  nodeDataArray: any = [];
  selectedDefectTypes: any = [];
  merge_defectType = "";
  allMergeDefectType: any = [];
  defectTypeSelected: boolean;
  displayDefectTypeError: boolean;
  AllDefectsData_permanent: any = [];
  startLimit: number = 0;
  endLimit: number = 500;
  user_id: any;
  user: User;
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  submitted: any = false;
  config_data: any = [];
  Repair_machine_id: any;
  showModal = false;
  showModal1 = false;
  showModal2 = false;

  showDefectPopup: boolean = false;
  showDefectInfoZoominZoomoutStatus: boolean = false;
  popupDefectData: any = [];
  isDropdownOpen=false;

  selectCheck = false;
  repairCheck = false;
  ignoreCheck = false;
  reverse_endmeter: any = 0;
  reverse_startmeter: any = 0;
  hiddenAllDefectsData: any = [];
  reverse_endmeterframe: any = 0;
  reverse_startmeterframe: any = 0;
  hiddenAllDefectsDataframe: any = [];
  cur: any = 0;
  allframesload: any = "false";
  alldataload: any = "false";
  roslibconnection_checked: any = "no";
  roslibconnection_alert: any = false;
  previousPositions: number[] = [0];
  previousTimes: number[] = [0];
  maxSamples: number = 4;
  showRepairPopup: any = false;
  showSpliceImages: any = false;
  chartOptionLine: any; // Your chart options
  chartOptionLineStatus: boolean = false;
  topicname: "currentmeterreading";
  datatype: "std_msgs/String";
  chartInstance!: ECharts;
  imageWidth: number = 4096;
  imageHeight: number = 1026;
  repairButtonStatus: boolean = false;
  holdInterval: any;
  holdTimeout: any;
  isHolding = false;
  spliceData: any = [];
  spliceButtonStatus: boolean = false;
  nextSpliceposition:any;
  spliceStatus : boolean = false;
  repairStatus : boolean = false;
  repairChartOption: any; // Your chart options
  repairChartOptionStatus: boolean = false;
  repairDefectrData : any = []
  repairImageIndex : any = 0;
  spliceRunningStatus : any = false;
  tableStaticHeight : number = 0;
  spliceArray : any = [];
  spliceStartMeter : number ;
  spliceEndMeter : number ;
  scatterPlotWidth : number = 0;
  RunningSpliceStartMeter : any;
  RunningSpliceData : any;
  buttonDisable : boolean = false;
  doneButtonVisible : boolean = false;
  allRepairDone : boolean = false;
  allSpliceDone : boolean = false;
  repairScatterData : any = [];
  remaining_distance_to_stop : any = 0.0;
  next_defect_position : any = 0.0;
  previous_stopping_done: boolean = true;
  meterDifference: any = 0; 
  meterJumpingPopup: boolean = false;
  backendDisconnectionPopup: boolean = false;
  allDefectsDoneAlertPopup: boolean = false;
  showOverrideConfirm: boolean = false;
  totalSpliceMeter: any = 0;

  constructor(
    private NavigationService: NavigationService,
    private cdr: ChangeDetectorRef,
    private _formBuilder: FormBuilder,
    private _RollsService: RollsService,
    private router: Router,
    private renderer: Renderer2,
    private toastrService: ToastrService,
    private _userService: UserService,
    private commonService: CommonService,
    private translocoService: TranslocoService
  ) {
    this.previousPositions = [0];
    this.previousTimes = [0];
    this.maxSamples = 4;
  }

  ngOnDestroy(): void {
    this.NavigationService.activeMainTab("true");
    if (this.xAxisSubscription) {
      this.xAxisSubscription.unsubscribe();
    }
    if (this.repairMeterUpdateInterval) {
      clearInterval(this.repairMeterUpdateInterval);
      this.repairMeterUpdateInterval = null;
    }
    if (this.yAxisSubscription) {
      this.yAxisSubscription.unsubscribe();
    }
    if (this.DefectSizeSubscription) {
      this.DefectSizeSubscription.unsubscribe();
    }
  }
  ngOnInit(): void {
    this.roll_id = localStorage.getItem("roll_id");
    setTimeout(() => {
      this.loggedInRole = localStorage.getItem('role_id');
      if (this.module_id && this.loggedInRole) {
        this.getAllFeaturePermission(this.module_id, this.loggedInRole);
      }
    }, 100);
    this.clearPreviousData();
    this.getFirstDefectPosition();
    this.previousPositions = [0];
    this.previousTimes = [0];
    this._userService.user$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((user: User) => {
        this.user = user;
        this.user_id = this.user.user_id;
      });
    this.Repair_machine_id = `${(window as any).__env.repair_machine_id}`;
    // this.Repair_machine_id = `test`;
    if (this.Repair_machine_id) {
      this.get_machine_data();
    }
    if (!this.roll_id) {
      this.router.navigate(["/roll-details"]);
    }
    this.NavigationService.activeMainTab("false");
    this.dropdownList = [];
    this.dropdownSettings = {
      singleSelection: false,
      idField: "item_id",
      textField: "item_text",
      selectAllText: this.translocoService.translate('select_all'),
      unSelectAllText: this.translocoService.translate('unselect_all'),
      itemsShowLimit: 3,
      allowSearchFilter: true,
    };
    this.Form = this._formBuilder.group({
      inspection_table_width: [
        "",
        [
          this.greaterThan("inspection_table_width"),
          Validators.required,
          Validators.pattern("^[0-9]+(.[0-9]+)?$"),
          Validators.max(1000),
        ],
      ],
      splicing_offset: [
        "",
        [
          this.greaterThan("splicing_offset"),
          Validators.required,
          Validators.pattern("^[0-9]+(.[0-9]+)?$"),
          Validators.max(1000),
        ],
      ],
      repairing_offset: [
        "",
        [
          this.greaterThan("repairing_offset"),
          Validators.required,
          Validators.pattern("^[0-9]+(.[0-9]+)?$"),
          Validators.max(1000),
        ],
      ],
      jogging_offset: [
        "",
        [
          this.greaterThan("jogging_offset"),
          Validators.required,
          Validators.pattern("^[0-9]+(.[0-9]+)?$"),
          Validators.min(1000),
          Validators.max(10000),
        ],
      ],
      repair_machine_id: [this.Repair_machine_id, [Validators.required]],
    });
    this.getSpliceData();
    this.getTotalSpliceMeter();
  }
  get f(): { [key: string]: AbstractControl } {
    return this.Form.controls;
  }
  clickcheck: any = 0;


  focusOnElementByKey(key: string): void {
    if (this.machine_mode !== "stop") {
      this.toastrService.info("Please first stop the machine", "Info!");
      return;
    } else {
     
      const targetRect = this.AllDefectsData.find(
        (item) => item.defect_id === key
      );
      if (targetRect) {
        this.totalmeter = parseFloat(this.totalmeter.toFixed(2));
        if ((targetRect.defect_top_left_y_mm / this.metercal) > this.totalmeter - 1) {
          if(this.current_repair_meter > 10)
          {
            this.startmeter = 0;
            this.endmeter = this.startmeter + (this.config_data.repairing_offset/this.metercal) + (this.config_data.inspection_table_width/this.metercal) + (this.config_data.splicing_offset / this.metercal) + 2
          }
          else
          {
            this.startmeter = 0;
            this.endmeter = this.current_repair_meter - ((this.config_data.repairing_offset / this.metercal) )
          }
          
          // if(this.startmeter > 10)
          //   this.endmeter = this.startmeter + (this.config_data.repairing_offset/this.metercal) + (this.config_data.inspection_table_width/this.metercal) + (this.config_data.splicing_offset / this.metercal) + 2
          // else
          //   this.endmeter = this.current_repair_meter
        } else {
          let filterframe;
          if (targetRect.merge_status == 1) {
            filterframe = this.hiddenAllDefectsDataframe.filter(
              (frame_data) =>
                frame_data.defect_frame_id === targetRect.defect_end_frame_id
            );

            if(this.current_repair_meter > 10)
            {
              this.startmeter = parseFloat(
                (
                  // parseFloat(
                  //   (this.totalmeter - filterframe[0].frame_end_meter).toFixed(2)
                  // ) +
                  // parseFloat(
                  //   (this.config_data.correction_factor / this.metercal).toFixed(
                  //     2
                  //   )
                  // ) +
                  parseFloat(
                    (this.config_data.splicing_offset / this.metercal).toFixed(2)
                  )
                ).toFixed(2)
              );
            }
            else{
              this.startmeter = 0
            }

           
          } else {
            filterframe = this.hiddenAllDefectsDataframe.filter(
              (frame_data) =>
                frame_data.defect_frame_id === targetRect.defects_frame_id
            );
            if (this.current_repair_meter > 10) {
              this.startmeter = parseFloat(
                (
                  // parseFloat(
                  //   (this.totalmeter - filterframe[0].frame_end_meter).toFixed(2)
                  // ) +
                  // parseFloat(
                  //   (this.config_data.correction_factor / this.metercal).toFixed(
                  //     2
                  //   )
                  // ) +
                  parseFloat(
                    (this.config_data.repairing_offset / this.metercal).toFixed(2)
                  )
                ).toFixed(2)
              );
            }
            else{
              this.startmeter = 0;
            }           
          }
           if(this.startmeter > 10)
            this.endmeter = this.startmeter + (this.config_data.repairing_offset/this.metercal) + (this.config_data.inspection_table_width/this.metercal) + (this.config_data.splicing_offset / this.metercal) + 2
          else
            this.endmeter = this.current_repair_meter
        }
        let newstartmeter;
        if (targetRect.merge_status == 1) {
          newstartmeter =
            this.totalmeter -
            ((targetRect.defect_top_left_y_mm / this.metercal) +
              targetRect.defect_height_mm / this.metercal) -
            this.startmeter +
            // this.config_data.correction_factor / this.metercal +
            this.config_data.splicing_offset / this.metercal;
        } else {
          newstartmeter =
            this.totalmeter -
            ((targetRect.defect_top_left_y_mm / this.metercal) +
              targetRect.defect_height_mm / this.metercal) -
            this.startmeter +
            // this.config_data.correction_factor / this.metercal +
            this.config_data.repairing_offset / this.metercal;
        }
        const zoomfactordiffe = 250 / this.zoomFactor;
        const focusposty =
          newstartmeter * this.permeter_height +
          this.horizantalwidth +
          this.panY -
          zoomfactordiffe;
        const focuszoomposty = focusposty * this.zoomFactor;
        const focuspostx =
          (targetRect.defect_top_left_x_mm / this.metercal) * this.permeter_width +
          this.vertical_width +
          this.panX;

        const focuszoompostx = focuspostx * this.zoomFactor;
      }
    }
  }

  NoSpace(event: KeyboardEvent): void {
    // Prevent input of spaces
    if (event.key === " ") {
      event.preventDefault();
    }
  }
  async connectrosandsystem() {
    return new Promise<void>((resolve, reject) => {
      // Create ROS instance
      this.ros = new ROSLIB.Ros({
        url: "ws://" + this.ipaddress, // Replace with your ROS server URL
      });

      // Event listener for connection
      this.ros.on("connection", () => {
        console.log("Connected to ROS server");

        this.roslibconnection_checked = "yes";
        resolve(); // Resolve the promise when the connection is successful
      });

      // Event listener for error
      this.ros.on("error", (error) => {
        this.roslibconnection_checked = "no";
        this.toastrService.error(this.translocoService.translate('error_connecting_ros'), this.translocoService.translate('error'));
        console.error("Error connecting to ROS server:", error);
        reject(error); // Reject the promise if there's an error
        return false;
      });
    });
  }

  async closeConnection() {
    if (this.ros) {
      this.ros.close();
      console.log("Disconnected from ROS server");
      // Optionally reset any variables or states related to the connection
      this.roslibconnection_checked = "no";
    } else {
      console.log("No active ROS connection to close");
    }
  }

  startlisting(topicName, messageType) {
    this.listener = new ROSLIB.Topic({
      ros: this.ros,
      name: topicName,
      messageType: messageType, // Replace with your message type
    });
  }
  subscribeToTopic(topicName): Promise<any> {
    // Set up a flag to track if the subscription has succeeded

    return new Promise((resolve, reject) => {
      // Subscribe to the topic
      this.listener.subscribe((message) => {
        // Set the flag to indicate that subscription succeeded
        // Parse message data
        const jsonObject = JSON.parse(message.data);

        // Check if the topic name matches and the message is valid
        if (
          topicName === "currentmeterreading" &&
          jsonObject.machine_id === this.config_data.repair_machine_id
        ) {
          this.getCurrentMeter(message);
        }

        resolve(message.data);
      });
    });
  }
  getCurrentMeter(message) {
    try {
      let previous_defect_type = 'NA';
      const jsonObject = JSON.parse(message.data);

      if (
        !isNaN(jsonObject.current_meter) &&
        jsonObject.machine_id == this.config_data.repair_machine_id
      ) {
        this.previous_end_meter = this.endmeter;
        this.previous_current_repair_meter = this.current_repair_meter;
        this.machine_mode = jsonObject.machine_status;
        this.current_repair_meter = (jsonObject.current_meter * 1) / this.metercal;
        let meter_diff = 0;
        if (this.current_repair_meter >= this.previous_current_repair_meter){
          meter_diff = (this.current_repair_meter - this.previous_current_repair_meter) * this.metercal;
        } else {
          meter_diff = (this.previous_current_repair_meter - this.current_repair_meter) * this.metercal;
        }
        if (!this.on_init_previous_meter && meter_diff > 1000 ){
          this.meterDifference = ((this.current_repair_meter - this.previous_current_repair_meter)).toFixed(2);
          this.meterJumpingPopup = true;
          return;
        }
        
        this.on_init_previous_meter = false;
        this.machine_mode = jsonObject.machine_status;
        this.remaining_distance_to_stop = (jsonObject.remaining_distance_to_stop * 1) / this.metercal;
        this.next_defect_position = (jsonObject.next_defect_position * 1) / this.metercal;
        if(jsonObject.previous_stopping_done !== undefined)
        {
          this.previous_stopping_done = (jsonObject.previous_stopping_done );
          previous_defect_type = (jsonObject.previous_defect_type);
        }
        
        
        this.spliceArray = this.spliceData.filter((data)=>{
            return (((this.current_repair_meter) < (this.totalmeter - data.splice_end_meter)) || data.splice_status === 0 )
          })
          if(this.spliceArray.length > 0)
          { 
            this.spliceArray.sort((a, b) => b.splice_end_meter - a.splice_end_meter);
            this.RunningSpliceData = this.spliceArray?.[0];
            this.spliceStartMeter =  this.spliceArray?.[0]?.splice_start_meter;
            this.spliceEndMeter =  this.spliceArray?.[0]?.splice_end_meter;
          }
          
        if(this.spliceButtonStatus)
        { 
          //TODO: this condition is not needed because below we are checking the end of the splice is crossed the splice offset or not.
          this.spliceRunningStatus = (this.current_repair_meter - (this.config_data.splicing_offset / 1000)) < (this.totalmeter - this.RunningSpliceStartMeter)
          this.splice_meter = parseFloat((this.current_repair_meter - this.start_Splice_current_meter).toFixed(2))
        }
        if (this.current_repair_meter !== this.previous_current_repair_meter) {
          // if (this.current_repair_meter < this.totalmeter - 1) {
              this.startmeter = this.current_repair_meter - this.tableStaticHeight
              this.endmeter = this.current_repair_meter;
          // }
          this.remaining_meter = parseFloat((this.next_stop_at - this.current_repair_meter).toFixed(1))
          if(this.spliceStatus && this.previous_stopping_done && previous_defect_type === 'merged' && !this.allSpliceDone )
          {
            this.spliceButtonStatus = true;
            this.start_Splice_current_meter = this.current_repair_meter;
          }
          if(this.repairStatus && this.previous_stopping_done && previous_defect_type === 'not-merged' && !this.allRepairDone){
            this.repairButtonStatus = true;
            this.setRepairPopupUpDetails();
          }
          
          // else if(((this.remaining_meter).toFixed(1) === 0 || (this.remaining_meter).toFixed(1) === -0 || (this.remaining_meter).toFixed(1) === '-0' ||(this.remaining_meter).toFixed(1) === 0.0 || (this.remaining_meter).toFixed(1) === '0.0' || (this.remaining_meter).toFixed(1) === '-0.0'))
          // {
          //   this.repairButtonStatus = true;
          // }

          //TODO: need to check the splice button status 

          let filterarrayonload = [];

          //TODO: for get running splice meter
          const filteredSpliceArray = this.spliceArray.filter(
            splice => (this.totalmeter - splice.splice_end_meter) < this.current_repair_meter
          );

          this.nodeDataArray_strip.forEach((defect) => {
            const defectY =
              (defect.defect_top_left_y_mm / this.metercal) +
              (defect.defect_height_mm / this.metercal);

            const actualPos = this.totalmeter - defectY;

            // For get splice defect ids
            const inSplice = filteredSpliceArray.length > 0 ? filteredSpliceArray.some(splice =>
              {
                return splice.defect_ids.some(id => id === defect.defect_id) && this.totalmeter - defectY <= ((this.current_repair_meter - (this.config_data.splicing_offset / 1000)));
              }
            ): this.spliceArray.length > 0 && this.spliceArray[0].defect_ids.some(id => id === defect.defect_id) && this.totalmeter - defectY <= ((this.current_repair_meter - (this.config_data.splicing_offset / 1000)));
            
            if (inSplice) {
              filterarrayonload.push(defect);
              return;
            }
          });
            
          filterarrayonload.sort(
              (a, b) =>
                (b.defect_top_left_y_mm / this.metercal) +
                b.defect_height_mm / this.metercal -
                ((a.defect_top_left_y_mm / this.metercal) + a.defect_height_mm / this.metercal)
            );

          for (let i = 0; i < filterarrayonload.length; i++) {
            const checkdefect = this.AllDefectsData.filter(
              (defect_data) => defect_data.defect_id == filterarrayonload[i].defect_id
            );
             //splice defect add in splice array 
            if (checkdefect.length == 0) {
              this.AllDefectsData.push(filterarrayonload[i]);
            }
          }
          // this.AllDefectsData_permanent =
          // this.AllDefectsData_permanent.concat(filterarrayonload);
          this.defect_filter_by_start_end_meter1();
          
          this.checkdefect = this.nodeDataArray_strip.filter((value) => {
            let position =
              (this.totalmeter - (value.defect_top_left_y_mm / this.metercal)) *
              this.tempstrip_height;
            return (
              position >= this.yellowstripposY1 - 10 &&
              position <= this.yellowstripposY1 + 5
            );
          });
          this.checkdefect.forEach((value: any) => {
            const x = 0;
            const y =
              (this.totalmeter - (value.defect_top_left_y_mm / this.metercal)) *
              this.tempstrip_height;
            const width = 150;
            const height = 6;
          });
          const new_focus = this.current_repair_meter * this.tempstrip_height;
          this.yellowstripposY = new_focus;
          this.yellowstripposY1 = new_focus * 1 - 5;
          setTimeout(() => {
            this.draw();
          }, 300);
        }
        this.previous_current_repair_meter = this.current_repair_meter;
        this.sendnextdefect();
      }
      this.calculateSpeed();
    } catch (error) {
      console.error("Error subscribing to topic:", error);
    }
  }
  stopListening() {
    if (this.listener) {
      this.listener.unsubscribe();
      this.listener = null;
    }
  }
  clearPreviousData() {
    // Clear the previousPositions array
    while (this.previousTimes.length > 1) {
      this.previousTimes.pop();
    }
    while (this.previousPositions.length > 1) {
      this.previousPositions.pop();
    }

    // Clear the previousTimes array
  }

  calculateSpeed() {
    const currentTime = Date.now();
    const currentPosition = this.current_repair_meter;
  
    this.previousPositions.push(currentPosition);
    this.previousTimes.push(currentTime);
  
    // Keep sample size limited
    if (this.previousPositions.length > this.maxSamples) {
      this.previousPositions.shift();
      this.previousTimes.shift();
    }
  
    // Need at least 2 samples to calculate speed
    if (this.previousPositions.length < 2) return;
  
    // Calculate average speed
    const firstPos = this.previousPositions[0];
    const lastPos =
      this.previousPositions[this.previousPositions.length - 1];
  
    const firstTime = this.previousTimes[0];
    const lastTime =
      this.previousTimes[this.previousTimes.length - 1];
  
    const totalDist = lastPos - firstPos;
    const totalTime = (lastTime - firstTime) / 1000; // seconds
  
    if (totalTime <= 0) return;
  
    const avg_speed = Number((totalDist / totalTime).toFixed(2));
  
  
    /* -----------------------------
       Update avg_speed every 1 sec
    ----------------------------- */
    if (!this.lastAvgUpdateTime || currentTime - this.lastAvgUpdateTime >= 1000) {
      this.avg_speed = Number((avg_speed * 60).toFixed(2)); // convert to m/min for display
      this.lastAvgUpdateTime = currentTime;
    }
  
    /* -----------------------------
       Record speed every 5 sec
    ----------------------------- */
    if (!this.lastRecordTime || currentTime - this.lastRecordTime >= 10000) {
      this.recordRepairSpeed(avg_speed);
      this.lastRecordTime = currentTime;
    }
  }
  
  // Only purpose of this function is to record the speed in the db
  recordRepairSpeed(speed: number) {
    // console.log("Recording speed:", speed, "m/s");

    const payload = {
      current_meter: this.current_repair_meter,
      current_speed: speed,
      repair_job_id: this.repairJobId,
      robro_roll_id: this.roll_id,
    };

    this._RollsService.postRepairSpeed(payload)
      .pipe(retry(3)) // 3 baar retry karega
      .subscribe({
        next: (response) => { },
        error: (err) => {
          // this.toastrService.error( "Backend is not running. Please start the backend first." );
          this.backendDisconnectionPopup = true;
          this.StopMachineConfirm();
        },
      });
  }

  closeBackendDisconnectionPopup(){
    this.backendDisconnectionPopup = false;
  }

  closeAllDefectsDoneAlertPopup(){
    this.allDefectsDoneAlertPopup = false;
  }

  // Function to publish a message on a user-specified topic
  publishMessageOnTopic(topicName, messageType, data): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.roslibconnection_checked == "yes") {
        // Check if there is an existing publisher, unregister if present
        if (this.publisher) {
          this.publisher.unadvertise();
        }

        // Create a new publisher for the specified topic
        this.publisher = new ROSLIB.Topic({
          ros: this.ros,
          name: topicName,
          messageType: messageType, // Replace with your message type
        });

        // Create a message object
        const messageToSend = new ROSLIB.Message({
          data: data,
        });
        // Publish the message on the topic
        this.publisher.publish(messageToSend);
      } else {
        this.toastrService.warning("Please connect first with roslib!", "Warning!");
        console.log("please connect first with roslib");
      }

      // Resolve the promise once the message is published
      resolve();
    });
  }

  async controlMachine(status: "start" | "stop") {
    if (this.machineControlLoading) {
      return;
    }

    this.machineControlLoading = true;

    try {
      if (this.roslibconnection_checked !== "yes") {
        await this.connectrosandsystem();
      }

      await this.publishMessageOnTopic(
        "controlmachine",
        "std_msgs/String",
        JSON.stringify({ status })
      );
    } catch (error) {
      console.error("Error controlling machine:", error);
      this.toastrService.error("Failed to control machine. Please try again.", "Error");
    } finally {
      this.machineControlLoading = false;
    }
  }

  onKeyPress(event: KeyboardEvent, allowMinus: boolean = false): void {
    this.isTyping = true;
    let allowedChars = /[0-9.]/;

    if (allowMinus) {
      allowedChars = /[0-9.-]/;
    }

    const inputChar = String.fromCharCode(event.charCode);
    const inputValue = (<HTMLInputElement>event.target).value;

    // Allowing '-' only at the beginning
    if (
      inputChar === "-" &&
      (inputValue.indexOf("-") !== -1 ||
        (<HTMLInputElement>event.target).selectionStart !== 0)
    ) {
      event.preventDefault();
      return;
    }
    if (!allowedChars.test(inputChar)) {
      event.preventDefault();
    }
  }
  greaterThan(controlName: string) {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const comparisonControl = control.root.get(controlName);
      if (comparisonControl && comparisonControl.value == 0) {
        return { lessThan: true };
      }

      return null;
    };
  }
  // Additional method to check if the form is valid
  isFormValid() {
    return this.Form.valid;
  }
  onInputFieldClick(fieldName: string): void {
    this.clickedFields[fieldName] = true;
  }

  isFieldClicked(fieldName: string): boolean {
    return this.clickedFields[fieldName];
  }

  onItemSelect(item: any) {}
  onSelectAll(items: any) {}
  onSubmit(): void {
    this.submitted = true;
    if (this.Form.invalid) {
      return;
    }
    const formData = new FormData();
    formData.append("user_id", this.user_id);
    formData.append(
      "inspection_table_width",
      this.Form.get("inspection_table_width").value
    );
    formData.append("splicing_offset", this.Form.get("splicing_offset").value);
    formData.append(
      "repairing_offset",
      this.Form.get("repairing_offset").value
    );
    formData.append("jogging_offset", this.Form.get("jogging_offset").value);
    formData.append(
      "repair_machine_id",
      this.Form.get("repair_machine_id").value
    );
    this._RollsService.saveMachine(formData).subscribe((response: any) => {
      if (response.status) {
        const data = {
          inspection_table_width: parseInt(
            this.Form.get("inspection_table_width").value
          ),
          splicing_offset: parseInt(this.Form.get("splicing_offset").value),
          repairing_offset: parseInt(this.Form.get("repairing_offset").value),
          jogging_offset: parseInt(this.Form.get("jogging_offset").value),
          repair_machine_id: this.Form.get("repair_machine_id").value,
        };
        this.publishMessageOnTopic(
          "machine_setup_details",
          "std_msgs/String",
          JSON.stringify(data)
        );
        this.toastrService.success(this.translocoService.translate('roll_edited_success'), this.translocoService.translate('success_exclamation'));
        // added activity log
        const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 6 && item.module_id === 6);
        if (activityObject) {
          this.commonService.addActivityLog(activityObject)
        }

        if (this.roslibconnection_checked == "no") {
          this.toastrService.info(this.translocoService.translate('ros_not_connected'), this.translocoService.translate('info'));
        }
        this.hideSetting();
        this.get_machine_data();
        setTimeout(() => {
          this.draw();
        }, 300);
      } else {
        this.toastrService.error(this.translocoService.translate('something_went_wrong'), this.translocoService.translate('error'));
      }
    });
  }

  get_machine_data() {
    this._RollsService
      .get_machine_data(this.Repair_machine_id)
      .subscribe((response) => {
        if (response.data.length === 0) {
          // Checking if length is 0
          this.config_check = false;
        } else {
          this.config_check = true;
        }

        if (response.status) {
          this.config_data = response.data[0];
          this.Form.patchValue({
            inspection_table_width: this.config_data.inspection_table_width,
            splicing_offset: this.config_data.splicing_offset,
            repairing_offset: this.config_data.repairing_offset,
            jogging_offset: this.config_data.jogging_offset,
            // correction_factor: this.config_data.correction_factor,
            repair_machine_id: this.config_data.repair_machine_id,
          });
          this.tableStaticHeight = (this.config_data.repairing_offset/this.metercal) + (this.config_data.inspection_table_width / this.metercal) + (this.config_data.splicing_offset / this.metercal) + 2
        }
      });
  }
  ngAfterViewInit(): void {
    this.getRollsDataByIdFirst();
    // this.connectrosandsystem();
  }
  loaderOff() {
    if (this.alldataload == "true") {
      this._RollsService.hide();
      this.defect_filter_by_start_end_meter1();
      this.spliceArray = this.spliceData.filter((data)=>{
        return (((this.current_repair_meter) < (this.totalmeter - data.splice_end_meter)) || ((this.current_repair_meter - this.tableStaticHeight) < (this.totalmeter - data.splice_start_meter)) && data.splice_status === 0)
      })
      this.spliceArray.sort((a, b) => b.splice_end_meter - a.splice_end_meter);
      this.RunningSpliceData = this.spliceArray?.[0];
      this.spliceStartMeter =  this.spliceArray?.[0]?.splice_start_meter;
      this.spliceEndMeter =  this.spliceArray?.[0]?.splice_end_meter;
      this.spliceRunningStatus = (this.current_repair_meter - this.tableStaticHeight) > (this.totalmeter - this.RunningSpliceStartMeter)
      this.spliceRunningStatus
      let filterarrayonload = [];
      this.nodeDataArray_strip.forEach((defect) => {
            const defectY =
              (defect.defect_top_left_y_mm / this.metercal) +
              (defect.defect_height_mm / this.metercal);

            const actualPos = this.totalmeter - defectY;
            const filteredSpliceArray = this.spliceArray.filter(
              splice => (this.totalmeter - splice.splice_end_meter) < this.current_repair_meter
            );
            const inSplice = filteredSpliceArray.length > 0 ? filteredSpliceArray.some(splice =>
              {
                return splice.defect_ids.some(id => id === defect.defect_id) && this.totalmeter - defectY <= ((this.current_repair_meter - (this.config_data.splicing_offset / 1000)));
              }
            ): this.spliceArray.length > 0 && this.spliceArray[0].defect_ids.some(id => id === defect.defect_id) && this.totalmeter - defectY <= ((this.current_repair_meter - (this.config_data.splicing_offset / 1000)));
            
            if (inSplice) {
              filterarrayonload.push(defect);
              return;
            }
          });

      filterarrayonload.sort(
        (a, b) =>
          (b.defect_top_left_y_mm / this.metercal) +
          b.defect_height_mm / this.metercal -
          ((a.defect_top_left_y_mm / this.metercal) + a.defect_height_mm / this.metercal)
      );

      this.AllDefectsData = filterarrayonload;
      setTimeout(() => {
        this.draw();
      }, 900);
    }
  }

  private draw(): void {
    //Draw strip
    const spliceArray = this.spliceData.filter((data)=>{
          return ((this.current_repair_meter) < (this.totalmeter - data.splice_end_meter)) || ((this.current_repair_meter - this.tableStaticHeight) < (this.totalmeter - data.splice_start_meter))
    })
    const repairstartoffset =
      this.current_repair_meter -  (this.config_data.repairing_offset / 1000)
    const repairstartoffsetYaxis = parseFloat(
      (
        (repairstartoffset)
      ).toFixed(2)
    );

    const repairendoffset =
      this.current_repair_meter -  ((this.config_data.repairing_offset / 1000) + this.config_data.inspection_table_width / 1000);
    const repairendoffsetYaxis = parseFloat(
      (
        (repairendoffset) 
      ).toFixed(2)
    );
  
    const splicestartoffset = 
        this.current_repair_meter - (this.config_data.splicing_offset / 1000)
    const splicestartoffsetYaxis = parseFloat(
      (
        (splicestartoffset)
      ).toFixed(2)
    );

    let yellow_line_data = [];
    let splice_area_data: any[] = [];

    yellow_line_data.push(
      {
        yAxis: repairstartoffsetYaxis,
        lineStyle: { color: 'blue', type: 'solid',width:2  },
        label: { show: false, position: 'end' }
      },
      {
        yAxis: repairendoffsetYaxis,
        lineStyle: { color: 'blue', type: 'solid',width:2 },
        label: { show: false, position: 'end' }
      },
      {
        yAxis: splicestartoffsetYaxis,
        lineStyle: { color: 'orange', type: 'solid',width:2 },
        label: { show: false, position: 'end' }
      }
    );

    if(spliceArray.length> 0)
    {
      spliceArray.forEach((data: any) => {
        const spliceStartY = parseFloat(
          (this.totalmeter - data.splice_end_meter).toFixed(2)
        );

        const spliceEndY = parseFloat(
          (this.totalmeter - data.splice_start_meter).toFixed(2)
        );
        const dotLineYaxisStartValue = parseFloat((this.totalmeter - data.splice_end_meter).toFixed(2))
        const dotStartLinedata = {
          yAxis: dotLineYaxisStartValue,
          lineStyle: { color: 'green', type: 'dotted', width: 2 },
          // label: { show: false, position: 'end' }
          label: {
            show: true,
            position: 'insideStart',
            triggerEvent: true,
            formatter: function () {
              return '{scissorStart|}'; // Only icon, no text
            },
            rich: {
              scissorStart: {
                height: 24,
                width: 24,
                align: 'center',
                backgroundColor: {
                  image: 'assets/icons/cut-with-scissors.png'
                },
                rotate: 90 // rotate 90 degrees
              }
            }
          }
        }
        yellow_line_data.push(dotStartLinedata)
        const dotLineYaxisEndValue = parseFloat((this.totalmeter - data.splice_start_meter).toFixed(2))
        const dotEndLinedata = {
          yAxis: dotLineYaxisEndValue,
          lineStyle: { color: 'red', type: 'dotted', width: 2 },
          // label: { show: false, position: 'end' }
          label: {
            show: true,
            position: 'insideStart',
            formatter: function () {
              return '{scissorStart|}'; // Only icon, no text
            },
            rich: {
              scissorStart: {
                height: 24,
                width: 24,
                align: 'center',
                backgroundColor: {
                  image: 'assets/icons/cut-with-scissors.png'
                },
                rotate: 90 // rotate 90 degrees
              }
            }
          }
        }
        yellow_line_data.push(dotEndLinedata)
        // SHADED AREA between start & end
        splice_area_data.push([
          {
            yAxis: spliceStartY,
            itemStyle: {
              color: 'rgba(255, 0, 0, 0.12)' // light red
            }
          },
          {
            yAxis: spliceEndY
          }
        ]);

      })
    }
    let markLineData = {
      silent: true, // The lines will not have any interaction.
      symbol: 'none',
      data: [...yellow_line_data]
    };
    let markAreaData = {
      silent: true,
      itemStyle: {
        color: 'rgba(255, 0, 0, 0.12)'
      },
      data: splice_area_data
    };
 
    if (this.nodeDataArray.length > 0) {
      for (const item of this.nodeDataArray) {
        const scatterData = this.nodeDataArray.map(item => ({
          value: [
            (item.defect_top_left_x_mm) / 1000,   // X coordinate (width)
            +((this.totalmeter - (item.defect_top_left_y_mm / 1000))).toFixed(2), // Y coordinate (length)
            item.defect_height_mm * item.defect_width_mm    // area
          ],
          Defect_ID: item.defect_id,
          itemStyle: { color: "#e63946" } // red tone for defects
        }));

        // Chart configuration
        this.chartOptionLine = {
          backgroundColor: "#fff",
          grid: {
            left: 60,
            right: 30,
            top: 50,
            bottom: 50,
            containLabel: true
          },
          xAxis: {
            // name: 'Fabric Width (m)',
            name: this.translocoService.translate('fabric_width_m'),
            type: 'value',
            min: 0,                     // lower limit
            max: this.scatterPlotWidth,
            nameLocation: 'middle',
            nameGap: 25,
            position: 'top',
            splitLine: { show: true, lineStyle: { type: 'dashed', color: '#ddd' } },
            axisLine: { lineStyle: { color: '#000' } },
            nameTextStyle: { fontWeight: 'bold', color: '#000' }
          },
          yAxis: {
            // name: 'Fabric Length (m)',
            name: this.translocoService.translate('fabric_length_m'),
            type: 'value',
            // inverse: true,
            min: this.startmeter,                     // lower limit
            max: this.endmeter,
            nameLocation: 'middle',
            nameGap: 60,
            axisLine: { lineStyle: { color: '#000' } },
            splitLine: { show: true, lineStyle: { type: 'dashed', color: '#ddd' } },
            axisLabel: { formatter: (v: number) => v.toFixed(1) },
            nameTextStyle: { fontWeight: 'bold', color: '#000' }
          },
          tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(0,0,0,0.7)',
            textStyle: { color: '#fff' },
            formatter: (params: any) => {
              const [x, y] = params.data.value;
              return `X: ${x.toFixed(2)} m<br>Y: ${y.toFixed(2)} m<br>ID: D${params.data.Defect_ID}`;
            }
          },
          series: [
            {
              type: 'scatter',
              data: scatterData,
              symbolSize: (data) => {
                const area = data[2] || 1;
                return area <= 20000 ? 8 :
                  area <= 40000 ? 10 :
                    area <= 80000 ? 12 :
                      area <= 150000 ? 14 : 20;
              },
              emphasis: { focus: 'series' },
              animation: false,
              markLine: (yellow_line_data.length > 0) ?  {
                ...markLineData,
                animation: false,
              }  : null,
              markArea: splice_area_data.length ? markAreaData : null,
            },
            {
              type: 'line',
              markLine: {
                symbol: 'none',
                silent: true,
                lineStyle: { color: 'blue', width: 2 }
              }
            }
          ]
        };

        this.chartOptionLineStatus = true;
      
      }
    }
    else {
      
      this.chartOptionLine = {
        backgroundColor: "#fff",
        grid: {
          left: 60,
          right: 30,
          top: 50,
          bottom: 50,
          containLabel: true
        },
        xAxis: {
          name: this.translocoService.translate('fabric_width_m'),
          type: 'value',
          min: 0,                     // lower limit
          max: this.scatterPlotWidth,
          nameLocation: 'middle',
          nameGap: 25,
          position: 'top',
          splitLine: { show: true, lineStyle: { type: 'dashed', color: '#ddd' } },
          axisLine: { lineStyle: { color: '#000' } },
          nameTextStyle: { fontWeight: 'bold', color: '#000' }
        },
        yAxis: {
          name: this.translocoService.translate('fabric_length_m'),
          type: 'value',
          // inverse: true,
          min: this.startmeter,                     // lower limit
          max: this.endmeter,
          nameLocation: 'middle',
          nameGap: 60,
          axisLine: { lineStyle: { color: '#000' } },
          splitLine: { show: true, lineStyle: { type: 'dashed', color: '#ddd' } },
          axisLabel: { formatter: (v: number) => v.toFixed(1) },
          nameTextStyle: { fontWeight: 'bold', color: '#000' }
        },
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(0,0,0,0.7)',
          textStyle: { color: '#fff' },
          formatter: (params: any) => {
            const [x, y] = params.data.value;
            return `X: ${x.toFixed(2)} m<br>Y: ${y.toFixed(2)} m<br>ID: D${params.data.Defect_ID}`;
          }
        },
        dataZoom: [
          // { type: 'slider', yAxisIndex: 0, right: 10, start: 0, end: 100 },
          // { type: 'inside', yAxisIndex: 0 }
        ],
        series: [
          {
            type: 'scatter',
            data: [],
            symbolSize: (data) => {
              const area = data[2] || 1;
              return area <= 20000 ? 8 :
                area <= 40000 ? 10 :
                  area <= 80000 ? 12 :
                    area <= 150000 ? 14 : 20;
            },
            emphasis: { focus: 'series' },
            animation: false,
            markLine: (yellow_line_data.length > 0) ?  {
              ...markLineData,
              animation: false,
            } : null,
          },
          {
            // blue vertical reference lines
            type: 'line',
            markLine: {
              symbol: 'none',
              silent: true,
              lineStyle: { color: 'blue', width: 2 }
            }
          }
        ]
      };

      this.chartOptionLineStatus = true;
     
    }
  }
   
  selectCheckbox() {
    this.selectCheck = true;
  }
  RepairCheckbox() {
    this.repairCheck = true;
  }
  IgnoreCheckbox() {
    this.ignoreCheck = true;
  }
 
  closeCheckbox() {
    this.selectCheck = false;
  }
  closeRepairCheckbox() {
    this.repairCheck = false;
  }
  closeIgnoreCheckbox() {
    this.ignoreCheck = false;
  }
  onCheckboxChange(id: number): void {
    const index = this.checkedItems.indexOf(id);
    if (index === -1) {
      this.checkedItems.push(id); // If not present in the array, add it
    } else {
      this.checkedItems.splice(index, 1); // If already present, remove it
    }
  }
  onSelectAllChange(): void {
    if (this.selectedAll) {
      // If "Select All" is checked, add all item ids to the checkedItems array
      this.checkedItems = this.AllDefectsData.map((item) => item.defect_id);
    } else {
      // If "Select All" is unchecked, clear the checkedItems array
      this.checkedItems = [];
    }
  }
  isChecked(id: number): boolean {
    return this.selectedAll || this.checkedItems.includes(id);
  }

  getRollsDataByIdFirst() {
    this._RollsService.get_rollsdatabyid(this.roll_id).subscribe((response) => {
      if (response.status) {
        this.role_data = response.data[0];
        this.totalmeter = response.data[0].inspected_length;
        let totalwidth = this.canvas_width - this.vertical_width;
        let rollheight = this.role_data.inspected_length;
        this.apporvedDefectCount = this.role_data.defect_count - this.role_data.deleted_defect_count;
        this.remainingDefectCount = (this.apporvedDefectCount - (this.role_data.repair_count + this.role_data.ignored_count + this.role_data.splice_count));
        this.repairCount = this.role_data.repair_count;
        this.overrideCount = this.role_data.ignored_count;
        this.spliceCount = this.role_data.splice_count;
        this.scatterPlotWidth = parseFloat(((this.role_data.max_defect_top_left_x_mm / 1000) + 0.1).toFixed(2)) 

        this.permeter_height = 360;

        let temper_width = this.map_default_width_for_repair / this.metercal;
        this.permeter_width = totalwidth / temper_width;
        let new_roll_height = this.permeter_height;
        this.canvas_height = new_roll_height;
        this.canvas_height_new = new_roll_height;
        this.totalscalelength = this.map_default_width_for_repair / this.metercal;
        this.yscaletotalheight = rollheight;
        this.tempstrip_height = this.canvas_strip_height / rollheight;
        if (this.role_data.roll_status == 3) {
          this.continueButtonId = true;
          this.startButtonId = false;
        }
        if (this.role_data.roll_status == 2) {
          this.continueButtonId = false;
          this.startButtonId = true;
        }

        if (this.role_data.current_repair_meter > 0) {
          this.current_repair_meter = this.role_data.current_repair_meter;
          this.cur = this.current_repair_meter;
          this.reverse_endmeter = this.totalmeter;
          this.reverse_startmeter = this.totalmeter - this.current_repair_meter;
          this.reverse_endmeterframe = this.totalmeter;
          this.reverse_startmeterframe = this.totalmeter - this.current_repair_meter;
        } else {
          this.reverse_endmeterframe = this.totalmeter;
          this.reverse_startmeterframe = this.totalmeter - 500;
          this.reverse_endmeter = this.totalmeter;
          this.reverse_startmeter = this.totalmeter - this.current_repair_meter;
          this.current_repair_meter = 0;
        }
      
        const new_focus = this.current_repair_meter * this.tempstrip_height;
        this.yellowstripposY = new_focus;
        this.yellowstripposY1 = new_focus * 1 - 5;
        this.startmeter = this.current_repair_meter - this.tableStaticHeight
        this.endmeter = this.current_repair_meter;
        setTimeout(() => {
          this.draw();
        }, 300);
        this.tmep_start_meter = parseFloat(
          (
            parseFloat(
              (this.config_data.repairing_offset / this.metercal).toFixed(1)
            ) 
            // parseFloat(
            //   (this.config_data.correction_factor / this.metercal).toFixed(1)
            // ) +
            // parseFloat(
            //   (
            //     this.config_data.inspection_table_width /
            //     this.metercal /
            //     2
            //   ).toFixed(1)
            // )
          ).toFixed(1)
        );
        this.temp_end_meter = this.tmep_start_meter + 1;
        this._RollsService.show();
        this.get_all_defect_by_roll_id(this.roll_id);
        this.loadAllframes();
      } else {
        this.toastrService.error(`Error getting ${this.roll_id} roll data.`, "Error!");
      }
    });
  }
  update_roll() {
    if (this.AllDefectsData.length > 0) {
      this.toastrService.error(this.translocoService.translate('check_all_defects_first'), this.translocoService.translate('error'));
      return false;
    }

    if (this.repairMeterUpdateInterval) {
      clearInterval(this.repairMeterUpdateInterval);
    }

    let payload = {
      repair_job_id: this.repairJobId,
      job_end_meter: this.current_repair_meter,
      current_meter: this.current_repair_meter,
      robro_roll_id: this.roll_id
    };
    const data1 = {
              roll_id: this.roll_id,
              status: "REPAIR",
              current_repair_meter: this.current_repair_meter,
    };
    try{
      const stopdata = {
        status: "stop",
      };
      this.publishMessageOnTopic(
        "stopmachine",
        "std_msgs/String",
        JSON.stringify(stopdata)
      );

      this._RollsService.postEndRepairJob(payload).subscribe({
        next: (data: any) => {
          if (data?.status) {
            this.toastrService.success(data?.message);
            this.stopListening();
            this._RollsService.update_roll(data1).subscribe((response) => {
              this.toastrService.success(
                this.translocoService.translate('roll_repair_success'),
                this.translocoService.translate('success_exclamation')
              );
              // added activity log
              const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 4 && item.module_id === 6);
              if (activityObject) {
                this.commonService.addActivityLog(activityObject)
              }
              this.router.navigate(["/dashboards/roll"]);
            });
          } else {
            this.toastrService.success(data?.error);
          }
        },
        error: (err) => {
          let errorMessage = "Something went wrong";
          if (err.status === 0) {
            errorMessage = "Master machine is not reachable.";
          }
          this.toastrService.error(errorMessage, "Error!");
        },
      });
    }
    catch(err){
      console.log(err)
    }
  }
  onCheckboxMerge(defect_type): void {
    this.selectedDefectTypes = Array.from(
      this.AllDefectsData.filter((defect_data) =>
        this.checkedItems.includes(defect_data.defect_id)
      )
        .map((defect_data) => ({
          defect_id: defect_data.defect_type_id,
          defect_name: defect_data.defect_name,
        }))
        .reduce((uniqueDefects, defect) => {
          // Check if an item with the same defect_id already exists
          const existingItem = uniqueDefects.find(
            (item) => item.defect_id === defect.defect_id
          );

          // If not, add the item to the uniqueDefects array
          if (!existingItem) {
            uniqueDefects.push(defect);
          }

          return uniqueDefects;
        }, [])
    );
  }

  defect_type: string = "";

  splice_repair_defect(status: number) {
      this.buttonDisable = true;
      if(!this.spliceRunningStatus && this.spliceButtonStatus && this.AllDefectsData.length === 0)
      {
        this.canvas_refresh('splice_status');
        this.buttonDisable = false;
        return;
      }
      else if(this.checkedItems.length === 0)
      {
        this.selectCheckbox();
        this.toastrService.warning(this.translocoService.translate('please_select_at_least_one_defect'));
        this.buttonDisable = false;
        return;
      }
      let defect_status = '';
      status === 1 ? defect_status = 'repair_status' : (status === 3 ? defect_status = 'suggest_for_deletion' : defect_status = 'splice_status');
      const data = {
        machine_id: this.config_data.repair_machine_id,
        robro_roll_id: this.role_data.robro_roll_id,
        user_id: this.user_id,
        defect_id: this.checkedItems,
        status: defect_status,
        roll_repair_job_id: this.repairJobId,
      };

      if(status === 2)
      {
        data['splice_id'] = this.RunningSpliceData.splice_id
      }

      this._RollsService.splice_repair_defect(data).subscribe((response) => {
        if (response.status) {
          // added activity log
          const activityObject = status === 2 ? defaultFeatureActivityList.find(item => item.feature_id === 1 && item.module_id === 6) : status === 1 ? defaultFeatureActivityList.find(item => item.feature_id === 2 && item.module_id === 6) : defaultFeatureActivityList.find(item => item.feature_id === 3 && item.module_id === 6);
          if (activityObject) {
            this.commonService.addActivityLog(activityObject)
          }
          this.selectedAll = false;
          this.suggestForDeletion = false;
          this.toastrService.success(response.message, this.translocoService.translate('success_exclamation'));

          this.canvas_refresh(defect_status);
          if(defect_status === 'repair_status'){
            this.setRepairPopupUpDetails();
          }
          this.change_next_defect_position();
          this.checkedItems = [];
          this.buttonDisable = false;
        } else if(!response.status){
          this.toastrService.error(response.error, "Error!");
        }
      });
  }
  checboxchecked(defect_id) {
    const checkbox = this.renderer.selectRootElement("#checkbox_" + defect_id);
    // Click the checkbox
    this.renderer.setProperty(checkbox, "checked", true);
    this.renderer.setProperty(checkbox, "click", true);
    this.onImageClick(defect_id);
    this.isChecked(defect_id);
  }
  onImageClick(id: number): void {
    const index = this.checkedItems.indexOf(id);
    if (index === -1) {
      this.checkedItems.push(id); // If not present in the array, add it
    } else {
      const index = this.checkedItems.indexOf(id);
      const checkbox = this.renderer.selectRootElement("#checkbox_" + id);
      // Click the checkbox
      this.renderer.setProperty(checkbox, "checked", false);
      this.checkedItems.splice(index, 1);
    }
  }

  canvas_refresh(status:any) {
    for (const itemId of this.checkedItems) {
      const index = this.AllDefectsData.findIndex(
        (defect_data) => defect_data.defect_id === itemId
      );

      if (index !== -1) {
        const index1 = this.nodeDataArray.findIndex(
          (defect__canvas_data) => defect__canvas_data.defect_id === itemId
        );

        const index12 = this.nodeDataArray_strip.findIndex(
          (defect__canvas_data1) => defect__canvas_data1.defect_id === itemId
        );

        const index13 = this.hiddenAllDefectsData.findIndex(
          (defect__canvas_data2) => defect__canvas_data2.defect_id === itemId
        )

        const index14 = this.repairScatterData.findIndex(
          (defect__canvas_data3) => defect__canvas_data3.Defect_ID === itemId
        )

        if (index1 !== -1) {
          this.nodeDataArray.splice(index1, 1); // Remove 1 element starting from the found index
        }
        if (index12 !== -1) {
          this.nodeDataArray_strip.splice(index12, 1); // Remove 1 element starting from the found
        }
        if(index13 !== -1){
          this.hiddenAllDefectsData.splice(index13, 1);
        }
        if(index14 !== -1){
          this.repairScatterData.splice(index14, 1);
        }
        this.AllDefectsData.splice(index, 1); // Remove 1 element starting from the found index
        if(status === 'splice_status')
        {
          this.spliceCount = this.spliceCount + 1;
          this.remainingDefectCount = this.remainingDefectCount - 1 ;
        }
      }

      const repairIndex = this.repairDefectrData.findIndex(
        (defect_data) => defect_data.defect_id === itemId
      );
      if (repairIndex !== -1) {
        const index1 = this.nodeDataArray.findIndex(
          (defect__canvas_data) => defect__canvas_data.defect_id === itemId
        );

        const index12 = this.nodeDataArray_strip.findIndex(
          (defect__canvas_data1) => defect__canvas_data1.defect_id === itemId
        );
        const index13 = this.hiddenAllDefectsData.findIndex(
          (defect__canvas_data2) => defect__canvas_data2.defect_id === itemId
        )

        const index14 = this.repairScatterData.findIndex(
          (defect__canvas_data3) => defect__canvas_data3.Defect_ID === itemId
        )
        if (index1 !== -1) {
          this.nodeDataArray.splice(index1, 1); // Remove 1 element starting from the found index
        }
        if (index12 !== -1) {
          this.nodeDataArray_strip.splice(index12, 1); // Remove 1 element starting from the found
        }
        if(index13 !== -1){
          this.hiddenAllDefectsData.splice(index13, 1);
        }
        if(index14 !== -1){
          this.repairScatterData.splice(index14, 1);
        }
        this.repairDefectrData.splice(repairIndex, 1); // Remove 1 element starting from the found index
        if(status === "repair_status")
        {
          this.repairCount = this.repairCount + 1;
          this.remainingDefectCount = this.remainingDefectCount - 1;
        }
        else if(status === "suggest_for_deletion")
        {
          this.overrideCount = this.overrideCount + 1;
          this.remainingDefectCount = this.remainingDefectCount - 1;
        }
      }
    }

    let spliceachknoledge = true;
    if(this.repairButtonStatus && this.repairDefectrData.length == 0){
      this.repairButtonStatus = false;
      //TODO: this marks as repair button status false and disappear.
      if(this.spliceButtonStatus === true)
      {
        spliceachknoledge = false
      }
    }
    if (this.spliceButtonStatus && this.AllDefectsData.length === 0 && !this.spliceRunningStatus && spliceachknoledge) {
      const data = {
        splice_id: this.RunningSpliceData.splice_id,
        splice_meter: this.splice_meter,
        robro_roll_id: this.roll_id
      };

      this._RollsService.updateSpliceMeter(data).subscribe((response) => {
        if (response.status) {
          this.spliceButtonStatus = false;
          this.getTotalSpliceMeter();
          this.RunningSpliceData.splice_status = 1;
          if (!this.repairButtonStatus && !this.spliceButtonStatus) {
            const acknowledgedata = {
              status: true
            };
            this.publishMessageOnTopic(
              "defectstopack",
              "std_msgs/String",
              JSON.stringify(acknowledgedata)
            );
            if(this.allSpliceDone && this.allRepairDone)
            {
              this.doneButtonVisible = true;
              this.allDefectsDoneAlertPopup = true;
            }
          }
        } else {
          this.toastrService.error(response.error, "Error!");
        }
      });
    } else { 
      // TODO: this will execute when the repair status is true
      if (!this.repairButtonStatus && !this.spliceButtonStatus) {
        const acknowledgedata = {
          status: true
        };
        this.publishMessageOnTopic(
          "defectstopack",
          "std_msgs/String",
          JSON.stringify(acknowledgedata)
        );
        if(this.allSpliceDone && this.allRepairDone)
          {
            this.doneButtonVisible = true;
            this.allDefectsDoneAlertPopup = true;
          }
      }
    }

    setTimeout(() => {
      this.draw();
    }, 150);
  }

  getLoaderState() {
    return this._RollsService.loaderState;
  }
  async startMachine(methodType) {
    await this.closeConnection();
    try {
      await this.connectrosandsystem();
      if (!this.config_check) {
        this.showconfigcheck = true;
        return false;
      }
      if (this.roslibconnection_checked == "no") {
        this.roslibconnection_alert = true;
        return false;
      }
      const data = {
        inspection_table_width: parseInt(
          this.Form.get("inspection_table_width").value
        ),
        splicing_offset: parseInt(this.Form.get("splicing_offset").value),
        repairing_offset: parseInt(this.Form.get("repairing_offset").value),
        jogging_offset: parseInt(this.Form.get("jogging_offset").value),
        // correction_factor: parseInt(this.Form.get("correction_factor").value),
        repair_machine_id: this.Form.get("repair_machine_id").value,
      };
      await this.publishMessageOnTopic(
        "machine_setup_details",
        "std_msgs/String",
        JSON.stringify(data)
      );
      // added activity log
      const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 5 && item.module_id === 6);
      if (activityObject) {
        this.commonService.addActivityLog(activityObject)
      }
      this.previous_stopping_done = true;
      if (methodType == "start") {
        this.previousPositions = [0];
        this.previousTimes = [0];
        this.machineRunningStatus = true; // Machine is now running
        this._userService.updateMachineStatus(true);
        this.startButtonId = false;
        const startmachine = {
          status: "start",
          total_meter: this.totalmeter,
        };
        await this.publishMessageOnTopic(
          "startmachine",
          "std_msgs/String",
          JSON.stringify(startmachine)
        );
      } else if (methodType == "continue") {
        this.previousPositions = [0];
        this.previousTimes = [0];
        this.machineRunningStatus = true; // Machine is now running
        this._userService.updateMachineStatus(true);
        this.continueButtonId = false;
        const continuedata = {
          status: "continue",
          total_meter: this.role_data.inspected_length,
          current_meter: this.current_repair_meter * this.metercal,
        };

        await this.publishMessageOnTopic(
          "continuemachine",
          "std_msgs/String",
          JSON.stringify(continuedata)
        );
      }
      this._userService.user$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((user: User) => {
          this.user_id = user.user_id;
        });

      let payload = {
        machine_id: this.config_data.repair_machine_id,
        roll_id: this.role_data.robro_roll_id,
        user_id: this.user_id,
        // correction_factor: this.config_data.correction_factor,
        job_start_meter: this.current_repair_meter,
        current_meter : this.current_repair_meter,
      };

      // Start interval to update current_repair_meter every 1 minute
      if (this.repairMeterUpdateInterval) {
        clearInterval(this.repairMeterUpdateInterval);
      }
      this.repairMeterUpdateInterval = setInterval(() => {
        const data = {
          roll_id: this.role_data.robro_roll_id,
          status:  "HALF_REPAIR",
          current_repair_meter: this.current_repair_meter,
        };
        this._RollsService.update_roll(data).subscribe();
      }, 60000); // 60000 ms = 1 minute

      this._RollsService.postStartRepairJob(payload).subscribe({
        next: (data) => {
          if (data?.status) {
            this.repairJobId = data?.repair_job_id;
            this.toastrService.success(data.message);
          } else {
            this.toastrService.error(data?.error);
          }
        },
        error: (err) => {
          let errorMessage = "Something went wrong";
          if (err.status === 0) {
            errorMessage = "Master machine is not reachable.";
          }
          this.toastrService.error(errorMessage, "Error!");
        },
      });
      this.startlisting("currentmeterreading", "std_msgs/String");
      this.subscribeToTopic("currentmeterreading");
      setTimeout(() => {
        this.sendnextdefect();
      }, 2000);
    } catch (error) {
      this.roslibconnection_alert = true;
      return false;
      // Handle the error appropriately, such as showing an error message to the user
    }
  }

  stopMachine() {
    this.temp_current_repair_meter = this.current_repair_meter;
    this.showStopMachineConfirm = true;
    this.on_init_previous_meter = true;
    // Machine is now stopped
  }

  navigateBack() {
    if (this.machineRunningStatus) {
      this.toastrService.warning(this.translocoService.translate('machine_running_navigate'));
    } else {
      this.router.navigate(["/roll-details"]);
    }
  }
  async sendnextdefect() {
    try {
      this.startButtonId = false;
      let filterarray = [];
      let data = {};

      //TODO: this validate the splice end meter is less then the splice stopping location.
      this.spliceArray = this.spliceData.filter((data)=>{
        return ((parseFloat((this.current_repair_meter - (this.config_data.splicing_offset / 1000) + 0.05).toFixed(2)) < parseFloat((this.totalmeter - data.splice_end_meter).toFixed(2))) && data.splice_status === 0)
      })
      this.spliceArray.sort((a, b) => b.splice_end_meter - a.splice_end_meter);

      if (
        this.previous_stopping_done
      ) {
        console.log ("Previous Stopping Done: ", this.previous_stopping_done);
        this.previous_stopping_done = false;


        // TODO: When the machine is started for the first time, if a splice is in continuation or there is a repair defect position, then the splice button will be shown for splice, and a popup will open for repair.
        if (!this.machine_status) {
          let remainingDefect = [];

          // TODO: This validation for the defect position is greater than roll inspected meter - current repair meter
          remainingDefect = this.hiddenAllDefectsData.filter(
            (defect_data1) => {
              return ((parseFloat(((defect_data1.defect_top_left_y_mm / this.metercal) +
                (defect_data1.defect_height_mm / this.metercal)).toFixed(2))) + 0.05) >
                this.totalmeter - (this.current_repair_meter - (this.config_data.repairing_offset / 1000))
            }
          );
          if (remainingDefect.length > 0) {
            
            // TODO: For get repairstartoffest line position
            const repairstartoffset =
              this.current_repair_meter - (this.config_data.repairing_offset / 1000)
            const repairstartoffsetYaxis = parseFloat(
              (
                (repairstartoffset)
              ).toFixed(2)
            );

            // TODO: For get repairendoffest line position
            const repairendoffset =
              this.current_repair_meter - ((this.config_data.repairing_offset / 1000) + this.config_data.inspection_table_width / 1000);
            const repairendoffsetYaxis = parseFloat(
              (
                (repairendoffset)
              ).toFixed(2)
            );

            //TODO: The splice end meter is less than the current repair meter  OR The splice start meter is less then the current repair meter (after subtracting table height) And the splice is still pending (splice_status === 0)
            const spliceArray = this.spliceData.filter((data) => {
              return (((this.current_repair_meter) < (this.totalmeter - data.splice_end_meter)) || ((this.current_repair_meter - this.tableStaticHeight) < (this.totalmeter - data.splice_start_meter)) && data.splice_status === 0)
            })
            let spliceFilterData = [];
            let nonSpliceFilterData = [];
            remainingDefect.forEach((defect) => {
              const defectY =
                (defect.defect_top_left_y_mm / this.metercal) +
                (defect.defect_height_mm / this.metercal);

              const actualPos = parseFloat(((this.totalmeter - defectY) - 0.05).toFixed(2));

              const filteredSpliceArray = spliceArray.filter(
                splice => (this.totalmeter - splice.splice_end_meter) < this.current_repair_meter 
              );

              // TODO : For get splice defect
              const inSplice = filteredSpliceArray.length > 0 && filteredSpliceArray.some(splice =>
                {
                  return splice.defect_ids.some(id => id === defect.defect_id)
                }
              );
              if (inSplice) {
                spliceFilterData.push(defect);
                return;
              }


              if (actualPos <= repairstartoffsetYaxis &&
                actualPos >= repairendoffsetYaxis) {
                nonSpliceFilterData.push(defect);
              }
            });

            // TODO : If repair defect array length is greather than 0 then open repair popup
            if (nonSpliceFilterData.length > 0) {
              this.repairButtonStatus = true;
              this.setRepairPopupUpDetails();
            }

            //TODO: this condition checking current splice start is crossed the splice stopping position but the end it not crossed 
            if (spliceFilterData.length > 0 && this.RunningSpliceData && this.RunningSpliceData.splice_end_meter > this.totalmeter - this.current_repair_meter + (this.config_data.splicing_offset / 1000) && this.RunningSpliceData.splice_start_meter < this.totalmeter - this.current_repair_meter + (this.config_data.splicing_offset / 1000) && this.RunningSpliceData.splice_status === 0) {
              const meterDiff = parseFloat((this.RunningSpliceData.splice_end_meter - this.RunningSpliceData.splice_start_meter).toFixed(2))
              this.start_Splice_current_meter = this.current_repair_meter - meterDiff
              this.spliceButtonStatus = true;
            }
          }
          this.machine_status = true
        }
        
        // this.splice_stop_at = 0;
        
        //TODO: after stopping for the splice this will be empty if i don't have any splice further.
        this.spliceStartMeter =  this.spliceArray?.[0]?.splice_start_meter;
        this.spliceEndMeter =  this.spliceArray?.[0]?.splice_end_meter;
        if (this.spliceArray.length > 0 || (this.spliceButtonStatus)) {
          
          const filteredSpliceArray = this.spliceArray.length > 0 && this.spliceArray[0].splice_id === this.RunningSpliceData?.splice_id ? this.spliceArray.filter(
            splice => (this.totalmeter - splice.splice_end_meter) < this.current_repair_meter + (this.config_data.repairing_offset/this.metercal) + (this.config_data.inspection_table_width/this.metercal) + (this.config_data.splicing_offset / this.metercal) + 2
          ): [this.RunningSpliceData];
          filterarray = this.hiddenAllDefectsData.filter((d) => {
            const defectY =
              parseFloat(((d.defect_top_left_y_mm / this.metercal) +
              (d.defect_height_mm / this.metercal)).toFixed(2));


               // TODO : For get splice defect
              const inSplice = filteredSpliceArray.length > 0 ? (filteredSpliceArray.some(splice =>
                {
                  return splice.defect_ids.some(id => id === d.defect_id)
                }) ||
                this.spliceArray.some(splice =>
                  {
                    return splice.defect_ids.some(id => id === d.defect_id)
                  })
              ): this.spliceArray.length > 0 && this.spliceArray[0].defect_ids.some(id => id === d.defect_id);

              if(this.next_defect_repair_type === "merged")
              {
                return !(inSplice) && (defectY - ((this.config_data.inspection_table_width/this.metercal) / 2)) <
                this.totalmeter - (this.current_repair_meter -  (this.config_data.repairing_offset / 1000));
              }
            return !(inSplice) && (defectY)  <
                this.totalmeter - (this.current_repair_meter -  (this.config_data.repairing_offset / 1000));
          });

        } 
        else {

          // TODO: this filter is basically to get all the defects which are behined the table start.
          filterarray = this.hiddenAllDefectsData.filter(
            (defect_data1) => {
              return ((parseFloat(((defect_data1.defect_top_left_y_mm / this.metercal) +
              (defect_data1.defect_height_mm / this.metercal)).toFixed(2))) + 0.05) <
                this.totalmeter - (this.current_repair_meter -  (this.config_data.repairing_offset / 1000) )
            }
          );
        }
        filterarray.sort(
          (a, b) =>
            (b.defect_top_left_y_mm / this.metercal) +
            b.defect_height_mm / this.metercal -
            ((a.defect_top_left_y_mm / this.metercal) + a.defect_height_mm / this.metercal)
        );
        this.spliceArray.sort(
          (a, b) =>
            (b.splice_end_meter/this.metercal) - (a.splice_start_meter/this.metercal)
        )

        // TODO: Splicing offset is less than splice end meter
        if(this.spliceArray.length > 0 && ((this.current_repair_meter - (this.config_data.splicing_offset / 1000)) < (this.totalmeter - this.spliceEndMeter)))
        {
            this.splice_stop_at = this.totalmeter - this.spliceArray[0].splice_end_meter
        }
        if (filterarray.length > 0) {
          let next_index = 0;
          for (let i = 0; i < filterarray.length; i++) {
            // const next_defect_array = this.AllDefectsData.filter(
            //   (defect_data) =>
            //     defect_data.defect_id === filterarray[i].defect_id
            // );

            // TODO: defect position + repairing start offset + inspection table width / 2 is greater than endmeter for defect next defect position
            if (
              (this.totalmeter -
                ((filterarray[i].defect_top_left_y_mm / this.metercal)+
                  filterarray[i].defect_height_mm / this.metercal) +
                // this.config_data.correction_factor / this.metercal +
                this.config_data.repairing_offset / this.metercal + 
                (this.config_data.inspection_table_width / this .metercal ) / 2 >
                this.endmeter)
            ) {
              this.repairStatus = true;
              next_index = i;
              break;
            }
          }
          this.next_stop_at =this.totalmeter -
              ((filterarray[next_index].defect_top_left_y_mm / this.metercal) +
                filterarray[next_index].defect_height_mm / this.metercal) +
              // this.config_data.correction_factor / this.metercal +
              this.config_data.repairing_offset / this.metercal +
              ((this.config_data.inspection_table_width / this.metercal) / 2);
            this.send_nextdefect =
              this.totalmeter -
              ((filterarray[next_index].defect_top_left_y_mm / this.metercal) +
                filterarray[next_index].defect_height_mm / this.metercal);
                this.next_defect_type = filterarray[next_index].defect_type
          
        
          this.next_defect_positons = this.next_stop_at;
          this.remaining_meter = this.next_stop_at - this.current_repair_meter;
          if(+(this.remaining_meter).toFixed(1) == 0){
            this.repairButtonStatus = true;
            // this.setRepairPopupUpDetails()
          }
          this.next_defect_name = `D${filterarray[next_index].defect_id}`;
          this.next_defect_data = filterarray[next_index];
          // if (filterarray[next_index].merge_status == 1) {
          //   this.next_defect_repair_type = "merged";
          //   this.next_operation = "Splice"
          // } else {
            this.next_defect_repair_type = "not-merged";
            this.next_operation = "Repair"
          // }
        }

        //current repair meter is greater than last defect position 
        else if(filterarray.length === 0)
        {
          this.allRepairDone = true;
        }
        if(this.spliceArray.length === 0)
        {
          this.allSpliceDone = true;
        }

        //splice stopping position is less than repair defect stopping position so we will send splice position to roslib machine
        if(filterarray.length === 0 || this.spliceArray.length > 0 && this.splice_stop_at > 0 && ((this.splice_stop_at + (this.config_data.splicing_offset/this.metercal)) < (this.send_nextdefect + (this.config_data.repairing_offset/this.metercal)) + ((this.config_data.inspection_table_width / this.metercal) / 2)))
        {
          this.spliceStatus = true;
          this.repairStatus = false;
          this.send_nextdefect = this.splice_stop_at
          this.next_defect_repair_type = "merged"
          this.next_operation = "Splice"
          this.next_stop_at = this.splice_stop_at + (this.config_data.splicing_offset / this.metercal)
          this.remaining_meter = this.next_stop_at - this.current_repair_meter;
         
        }
          if(this.RunningSpliceData && this.RunningSpliceData.splice_status === 0){
            this.RunningSpliceStartMeter = this.RunningSpliceData.splice_start_meter
          }
          else{
            this.RunningSpliceStartMeter = this.spliceArray && this.spliceArray.length > 0 && this.spliceArray[0].splice_start_meter;
            this.RunningSpliceData = this.spliceArray  && this.spliceArray.length > 0  && this.spliceArray[0];
          }

          // TODO: data that goes for next stopping.
          data = {
          new_defect_position: Math.round(this.send_nextdefect * this.metercal),
          defect_type: this.next_defect_repair_type,
        };

        if(this.allRepairDone && this.spliceArray.length === 0)
        {
          if (this.doneButtonVisible) {
            this.allDefectsDoneAlertPopup = true;
          }
          
          if(this.current_repair_meter > this.totalmeter)
          {
            data = {
              new_defect_position: Math.round(this.current_repair_meter * this.metercal + 10 * this.metercal),
              defect_type: this.next_defect_repair_type,
            }; 
          }
          else
          {
            data = {
              new_defect_position: Math.round(this.totalmeter * this.metercal),
              defect_type: this.next_defect_repair_type,
            }; 
          }
        }

        this.increase_array_count++;

        await this.publishMessageOnTopic(
          "nextdefectpostion",
          "std_msgs/String",
          JSON.stringify(data)
        );
      } 
      
      this.previous_machine_mode = this.machine_mode;
        // this.splice_stop_at = null;
        // this.send_nextdefect = null;

      if(this.allSpliceDone && this.allRepairDone){
        this.next_defect_type = 'NA';
        this.next_operation = 'NA';
        
      }

      // this.spliceArray = []
    } catch (error) {
      console.error("Error send next defect:", error);
    }
  }

  ii = 0;
  async sendCurrentMeter() {
    try {
      let machine_status = "";
      if (
        this.cur * this.metercal <
        Math.round(this.next_defect_positons * this.metercal) +
        this.config_data.jogging_offset
      ) {
        machine_status = "running";
      } else if (
        this.cur * this.metercal >
        Math.round(this.next_defect_positons * this.metercal) +
        this.config_data.jogging_offset &&
        this.cur * this.metercal <
        Math.round(this.next_defect_positons * this.metercal) + 2000
      ) {
        machine_status = "jogging";
      } else if (
        this.cur * this.metercal >
        Math.round(this.next_defect_positons * this.metercal) + 2000
      ) {
        machine_status = "stop";
      }
      const data = {
        current_repair_meter: this.cur * this.metercal,
        machine_status: machine_status,
        machine_id: this.config_data.repair_machine_id,
      };

      await this.publishMessageOnTopic(
        "currentmeterreading",
        "std_msgs/String",
        JSON.stringify(data)
      );

      if (this.cur < this.totalmeter) {
        if (this.cur > 48.1) {
          this.ii++;
        }
        setTimeout(() => {
          this.sendCurrentMeter();
          if (this.cur < 48.11 || (this.ii > 20 && this.ii < 50)) {
            this.cur = parseFloat((this.cur + 0.1).toFixed(1));
          }
          // this.cur++;
        }, 400);
      }
    } catch (error) {
      console.error("Error  send current meter:", error);
    }
  }
  closeBoxconfigcheck() {
    this.showconfigcheck = false;
  }
  closeRoslibBox() {
    this.roslibconnection_alert = false;
    // this.connectrosandsystem();
  }
  closeRoslibBox1() {
    this.roslibconnection_alert = false;
  }

  closemeterJumpingPopup(){
    this.meterJumpingPopup = false;
  }

  closeStopMachineConfirm() {
    this.temp_current_repair_meter = 0;
    this.showStopMachineConfirm = false;
  }

  StopMachineConfirm() {
    this._userService.updateMachineStatus(false);
    this.machineRunningStatus = false;
    if (this.repairMeterUpdateInterval) {
      clearInterval(this.repairMeterUpdateInterval);
      this.repairMeterUpdateInterval = null;
    }
    const data = {
      roll_id: this.roll_id,
      status: "HALF_REPAIR",
      current_repair_meter: this.temp_current_repair_meter,
    };
    const stopdata = {
      status: "stop",
    };
    this.publishMessageOnTopic(
      "stopmachine",
      "std_msgs/String",
      JSON.stringify(stopdata)
    );
    this._RollsService.update_roll(data).subscribe((response) => {
      this.showStopMachineConfirm = false;
      this.stopListening();
      this.machine_mode = "stop";
      this.previous_machine_mode = "jogging";
      this.toastrService.success(this.translocoService.translate('roll_paused_user'), this.translocoService.translate('success_exclamation'));
    });
    let payload = {
      repair_job_id: this.repairJobId,
      job_end_meter: this.temp_current_repair_meter,
      current_meter: this.temp_current_repair_meter,
    };

    this._RollsService.postEndRepairJob(payload).subscribe({
      next: (data: any) => {
        if (data?.status) {
          this.toastrService.success(data?.message);
        } else {
          this.toastrService.success(data?.error);
        }
      },
      error: (err) => {
        let errorMessage = "Something went wrong";
        if (err.status === 0) {
          errorMessage = "Master machine is not reachable.";
        }
        this.toastrService.error(errorMessage, "Error!");
      },
    });

    this.startButtonId = false;
    this.continueButtonId = true;
    // added activity log
    const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 5 && item.module_id === 6);
    if (activityObject) {
      this.commonService.addActivityLog(activityObject)
    }
  }
  loadAllframes() {
    const framedata = {
      roll_id: this.roll_id,
      startmeter: this.reverse_startmeterframe,
      endmeter: this.reverse_endmeterframe,
    };
              this.loaderOff();
      
  }

  get_all_defect_by_roll_id(robro_roll_id): void {
    const defectCountString = localStorage.getItem("total_defect_count");
    const defectCount = defectCountString ? parseInt(defectCountString, 10) : 0;
    // Check if defect_count is less than or equal to the end limit
    if (defectCount <= this.endLimitstrip) {
      // Fetch and save the remaining defects
      const data = {
        roll_id: robro_roll_id,
        start_limit: this.startLimitstrip,
        end_limit: this.endLimitstrip,
      };
      this._RollsService.get_current_meter_defect(data).subscribe({
        next: (response: any) => {
          if (response.status) {
            if (typeof response.data !== "string") {
              this.hiddenAllDefectsData = this.hiddenAllDefectsData.concat(
                response.data
              );
              this.nodeDataArray_strip = this.nodeDataArray_strip.concat(
                response.data
              );
              this.startLimitstrip = 0;
              this.endLimitstrip = 500;
              this.alldataload = "true";
              this.loaderOff();
            }
          }
        },
        error: (err: any) => {
          console.error("Error fetching data from the API", err);
        },
      });
    } else {
      // Fetch and save data within the limit
      const data1 = {
        roll_id: robro_roll_id,
        start_limit: this.startLimitstrip,
        end_limit: this.endLimitstrip,
      };
      this._RollsService.get_current_meter_defect(data1).subscribe({
        next: (response: any) => {

          if (response.status) {
            if (typeof response.data !== "string") {
              this.temp = this.temp.concat(response.data);
              this.startLimitstrip = this.endLimitstrip;
              this.endLimitstrip = Math.min(
                this.endLimitstrip + 500,
                defectCount
              );
              this.nodeDataArray_strip = this.nodeDataArray_strip.concat(
                response.data
              );
              // Recursive call with updated limits
              this.hiddenAllDefectsData = this.hiddenAllDefectsData.concat(
                response.data
              );
              setTimeout(() => {
                this.get_all_defect_by_roll_id(this.roll_id);
              }, 300);
            }
          }
        },
        error: (error: any) => {
          console.error("Error fetching data from the API", error);
        },
      });
    }
  }

  yellowStripChange() {
    this.checkdefect = this.nodeDataArray_strip.filter((value) => {
      let position =
        (this.totalmeter - (value.defect_top_left_y_mm / this.metercal)) *
        this.tempstrip_height;
      return (
        position >= this.yellowstripposY1 - 15 &&
        position <= this.yellowstripposY1 + 25
      );
    });
    this.checkdefect.forEach((value: any) => {
      const x = 0;
      const y = (this.totalmeter - (value.defect_top_left_y_mm / this.metercal)) *
      this.tempstrip_height;
      const width = 150;
      const height = 6;
    })
   
    const new_focus = this.startmeter * this.tempstrip_height;
    this.yellowstripposY = new_focus;
    this.yellowstripposY1 = new_focus * 1 - 5;
    setTimeout(() => {
      this.draw();
    }, 150);
  }
  defect_filter_by_start_end_meter2(): void {
    this.nodeDataArray = [];

    let filterarray = this.nodeDataArray_strip.filter(
      (defect_data1) =>
        parseFloat(
          (
            parseFloat(
              (
                this.totalmeter -
                ((defect_data1.defect_top_left_y_mm / this.metercal) +
                  parseFloat(
                    (defect_data1.defect_height_mm / this.metercal).toFixed(2)
                  ))
              ).toFixed(2)
            )
          ).toFixed(2)
        ) >= this.startmeter &&
        parseFloat(
          (
            parseFloat(
              (
                this.totalmeter -
                ((defect_data1.defect_top_left_y_mm / this.metercal) +
                  parseFloat(
                    (defect_data1.defect_height_mm / this.metercal).toFixed(2)
                  ))
              ).toFixed(2)
            ) 
          ).toFixed(2)
        ) < this.endmeter
    );

    this.frames = [];
    this.nodeDataArray = filterarray;
  }
  defect_filter_by_start_end_meter1(): void {
    this.nodeDataArray = [];

    let filterarray = this.nodeDataArray_strip.filter(
      (defect_data1) =>
        this.totalmeter -
        ((defect_data1.defect_top_left_y_mm / this.metercal) +
          defect_data1.defect_height_mm / this.metercal) 
         >=
        this.startmeter &&
        this.totalmeter -
        ((defect_data1.defect_top_left_y_mm / this.metercal) +
          defect_data1.defect_height_mm / this.metercal) 
        <
        this.endmeter 
    );

    this.frames = [];
    this.nodeDataArray = filterarray;
  }
  async change_next_defect_position() {

    //This checks whether the next defect ID is already included in the checkedItems array so we will change next defect position  
    const filterarray1 = this.checkedItems.filter(
      (checked_Data) => checked_Data == this.next_defect_data.defect_id
    );

    if (filterarray1.length > 0) {
      let filterarray = [];
      let remainingDefect = [];

      // TODO: This validation for the defect position is greater than roll inspected meter - current repair meter
      remainingDefect = this.hiddenAllDefectsData.filter(
        (defect_data1) => {
          return ((parseFloat(((defect_data1.defect_top_left_y_mm / this.metercal) +
            (defect_data1.defect_height_mm / this.metercal)).toFixed(2))) + 0.05) >
            this.totalmeter - (this.current_repair_meter - (this.config_data.repairing_offset / 1000))
        }
      );
      if (remainingDefect.length > 0) {
        // TODO: For get repairstartoffest line position
        const repairstartoffset =
          this.current_repair_meter - (this.config_data.repairing_offset / 1000)
        const repairstartoffsetYaxis = parseFloat(
          (
            (repairstartoffset)
          ).toFixed(2)
        );

        // TODO: For get repairendoffest line position
        const repairendoffset =
          this.current_repair_meter - ((this.config_data.repairing_offset / 1000) + this.config_data.inspection_table_width / 1000);
        const repairendoffsetYaxis = parseFloat(
          (
            (repairendoffset)
          ).toFixed(2)
        );

        //TODO: The splice end meter is less than the current repair meter  OR The splice start meter is less then the current repair meter (after subtracting table height) And the splice is still pending (splice_status === 0)
        const spliceArray = this.spliceData.filter((data) => {
          return (((this.current_repair_meter) < (this.totalmeter - data.splice_end_meter)) || ((this.current_repair_meter - this.tableStaticHeight) < (this.totalmeter - data.splice_start_meter)) && data.splice_status === 0)
        })
        let spliceFilterData = [];
        let nonSpliceFilterData = [];
        remainingDefect.forEach((defect) => {
          const defectY =
            (defect.defect_top_left_y_mm / this.metercal) +
            (defect.defect_height_mm / this.metercal);

          const actualPos = parseFloat(((this.totalmeter - defectY) - 0.05).toFixed(2));

          const filteredSpliceArray = spliceArray.filter(
            splice => (this.totalmeter - splice.splice_end_meter) < this.current_repair_meter
          );

          // TODO : For get splice defect
          const inSplice = filteredSpliceArray.length > 0 && (filteredSpliceArray.some(splice => {
            return splice.defect_ids.some(id => id === defect.defect_id)
          }) ||
            this.spliceArray.some(splice => {
              return splice.defect_ids.some(id => id === defect.defect_id)
            })
          );

          if (inSplice) {
            spliceFilterData.push(defect);
            return;
          }


          if (actualPos <= repairstartoffsetYaxis &&
            actualPos >= repairendoffsetYaxis) {
            nonSpliceFilterData.push(defect);
          }
        });

        // TODO : If repair defect array length is greather than 0 then open repair popup
        if (nonSpliceFilterData.length > 0) {
          this.repairButtonStatus = true;
          this.setRepairPopupUpDetails();
        }
        if (spliceFilterData.length > 0 && this.spliceStatus && ((this.remaining_meter).toFixed(1) === 0 || (this.remaining_meter).toFixed(1) === -0 || (this.remaining_meter).toFixed(1) === '-0' || (this.remaining_meter).toFixed(1) === 0.0 || (this.remaining_meter).toFixed(1) === '0.0' || (this.remaining_meter).toFixed(1) === '-0.0')) {
          this.spliceButtonStatus = true;
        }
      }

      // this.splice_stop_at = 0;
      this.spliceArray = this.spliceData.filter((data) => {
        return (((this.current_repair_meter - (this.config_data.splicing_offset / 1000) + 0.05) < (this.totalmeter - data.splice_end_meter)) && data.splice_status === 0)
      })
      this.spliceArray.sort((a, b) => b.splice_end_meter - a.splice_end_meter);
      this.spliceStartMeter = this.spliceArray?.[0]?.splice_start_meter;
      this.spliceEndMeter = this.spliceArray?.[0]?.splice_end_meter;

      if (this.spliceArray.length > 0 || (this.spliceButtonStatus)) {
        const filteredSpliceArray = this.spliceArray.length > 0 && this.spliceArray[0].splice_id === this.RunningSpliceData?.splice_id ? this.spliceArray.filter(
          splice => (this.totalmeter - splice.splice_end_meter) < this.current_repair_meter + (this.config_data.repairing_offset / this.metercal) + (this.config_data.inspection_table_width / this.metercal) + (this.config_data.splicing_offset / this.metercal) + 2
        ) : [this.RunningSpliceData];

        filterarray = this.hiddenAllDefectsData.filter((d) => {
          const defectY =
            parseFloat(((d.defect_top_left_y_mm / this.metercal) +
              (d.defect_height_mm / this.metercal)).toFixed(2));

              // TODO : For get splice defect
          const inSplice = filteredSpliceArray.length > 0 ? (filteredSpliceArray.some(splice => {
            return splice.defect_ids.some(id => id === d.defect_id)
          }) ||
            this.spliceArray.some(splice => {
              return splice.defect_ids.some(id => id === d.defect_id)
            })
          ) : this.spliceArray.length > 0 && this.spliceArray[0].defect_ids.some(id => id === d.defect_id);


          if (this.next_defect_repair_type === "merged") {
            return !(inSplice) && (defectY - ((this.config_data.inspection_table_width / this.metercal) / 2)) <
              this.totalmeter - (this.current_repair_meter - (this.config_data.repairing_offset / 1000));
          }
          return !(inSplice) && (defectY) <
            this.totalmeter - (this.current_repair_meter - (this.config_data.repairing_offset / 1000));
        });

      }
      else {
          // TODO: this filter is basically to get all the defects which are behined the table start.
        filterarray = this.hiddenAllDefectsData.filter(
          (defect_data1) => {
            return ((parseFloat(((defect_data1.defect_top_left_y_mm / this.metercal) +
              (defect_data1.defect_height_mm / this.metercal)).toFixed(2))) + 0.05) <
              this.totalmeter - (this.current_repair_meter - (this.config_data.repairing_offset / 1000))
          }
        );
      }
      filterarray.sort(
        (a, b) =>
          (b.defect_top_left_y_mm / this.metercal) +
          b.defect_height_mm / this.metercal -
          ((a.defect_top_left_y_mm / this.metercal) + a.defect_height_mm / this.metercal)
      );
      this.spliceArray.sort(
        (a, b) =>
          (b.splice_end_meter / this.metercal) - (a.splice_start_meter / this.metercal)
      )

      // TODO: Splicing offset is less than splice end meter
      if (this.spliceArray.length > 0 && ((this.current_repair_meter - (this.config_data.splicing_offset / 1000) + 0.05) < (this.totalmeter - this.spliceEndMeter))) {
        this.splice_stop_at = this.totalmeter - this.spliceArray[0].splice_end_meter
      }

      if (filterarray.length > 0) {
        let next_index = 0;
        for (let i = 0; i < filterarray.length; i++) {
          // const next_defect_array = this.AllDefectsData.filter(
          //   (defect_data) =>
          //     defect_data.defect_id === filterarray[i].defect_id
          // );

          // TODO: defect position + repairing start offset + inspection table width / 2 is greater than endmeter for defect next defect position
          if (
            (this.totalmeter -
              ((filterarray[i].defect_top_left_y_mm / this.metercal) +
                filterarray[i].defect_height_mm / this.metercal) +
              // this.config_data.correction_factor / this.metercal +
              this.config_data.repairing_offset / this.metercal +
              (this.config_data.inspection_table_width / this.metercal) / 2 >
              this.endmeter)
          ) {
            this.repairStatus = true;
            next_index = i;
            break;
          }
        }

        this.next_stop_at = this.totalmeter -
          ((filterarray[next_index].defect_top_left_y_mm / this.metercal) +
            filterarray[next_index].defect_height_mm / this.metercal) +
          // this.config_data.correction_factor / this.metercal +
          this.config_data.repairing_offset / this.metercal +
          ((this.config_data.inspection_table_width / this.metercal) / 2);
        this.send_nextdefect =
          this.totalmeter -
          ((filterarray[next_index].defect_top_left_y_mm / this.metercal) +
            filterarray[next_index].defect_height_mm / this.metercal);
        this.next_defect_type = filterarray[next_index].defect_type


        this.next_defect_positons = this.next_stop_at;
        this.remaining_meter = this.next_stop_at - this.current_repair_meter;
        if (+(this.remaining_meter).toFixed(1) == 0) {
          this.repairButtonStatus = true;
        }
        this.next_defect_name = `D${filterarray[next_index].defect_id}`;
        this.next_defect_data = filterarray[next_index];
        this.next_defect_repair_type = "not-merged";
        this.next_operation = "Repair"
      }

         //current repair meter is greater than last defect position 
      else if (filterarray.length === 0 && this.current_repair_meter > (this.totalmeter - this.fisrtDefectPosition)) {
        this.allRepairDone = true;
      }
      if (this.spliceArray.length === 0) {
        this.allSpliceDone = true;
      }

      //splice stopping position is less than repair defect stopping position so we will send splice position to roslib machine
      if (filterarray.length === 0 || (this.spliceArray.length > 0 && this.splice_stop_at > 0 && ((this.splice_stop_at + (this.config_data.splicing_offset / this.metercal)) < (this.send_nextdefect + (this.config_data.repairing_offset / this.metercal))))) {
        this.spliceStatus = true;
        this.repairStatus = false;
        this.send_nextdefect = this.splice_stop_at
        this.next_defect_repair_type = "merged"
        this.next_operation = "Splice"
        this.next_stop_at = this.splice_stop_at + (this.config_data.splicing_offset / this.metercal)
        this.remaining_meter = this.next_stop_at - this.current_repair_meter;

      }
      if (this.RunningSpliceData && this.RunningSpliceData.splice_status === 0) {
        this.RunningSpliceStartMeter = this.RunningSpliceData.splice_start_meter
      }
      else {
        this.RunningSpliceStartMeter = this.spliceArray && this.spliceArray.length > 0 && this.spliceArray[0].splice_start_meter;
        this.RunningSpliceData = this.spliceArray && this.spliceArray.length > 0 && this.spliceArray[0];
      }
      let data = {
        new_defect_position: Math.round(this.send_nextdefect * this.metercal),
        defect_type: this.next_defect_repair_type,
      };


      if (this.allRepairDone && this.spliceArray.length === 0) {
        if (this.current_repair_meter > this.totalmeter) {
          data = {
            new_defect_position: Math.round(this.current_repair_meter * this.metercal + 10 * this.metercal),
            defect_type: this.next_defect_repair_type,
          };
        }
        else {
          data = {
            new_defect_position: Math.round(this.totalmeter * this.metercal),
            defect_type: this.next_defect_repair_type,
          };
        }

       
        await this.publishMessageOnTopic(
          "nextdefectpostion",
          "std_msgs/String",
          JSON.stringify(data)
        );

        this.previous_machine_mode = this.machine_mode;
        // this.splice_stop_at = null;
        // this.send_nextdefect = null;

        if (this.allSpliceDone && this.allRepairDone) {
          this.next_defect_type = 'NA';
          this.next_operation = 'NA';

        }
      }
    }
  }

  async getFirstDefectPosition()
  {
    const data ={
      roll_id : this.roll_id
    }
    this._RollsService.get_first_defect_position(data).subscribe({
      next: (response) => {
        if(response.data.length > 0){
          this.fisrtDefectPosition = response.data[0].defect_top_left_y_mm / this.metercal;
        }
      },
      error: (err) => {},
    });
  }
  getAllFeaturePermission(module_id: number, role_id: number): void {
    const payload = { module_id, role_id };

    this._RollsService.getAllFeaturePermission(payload).pipe(
      tap(response => {
        this.featurePermissions = response?.data || [];
        this.setFeaturePermission(); // Call after featurePermissions is set
        this.cdr.detectChanges();
      }),
      catchError(error => {
        console.error('Error fetching feature permissions:', error);
        return of([]); // Prevent app crash on error
      })
    ).subscribe();
  }

  zoomLevel: number = 1;
  pointX: number = 0;
  pointY: number = 0;
  start = { x: 0, y: 0 };
  panning = false;
  zoomImage(event: WheelEvent): void {
    event.preventDefault();
  
    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
  
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
  
    const x = (mouseX - this.pointX) / this.zoomLevel;
    const y = (mouseY - this.pointY) / this.zoomLevel;
  
    const delta = event.deltaY < 0 ? 1.2 : 1 / 1.2;
    this.zoomLevel = Math.min(Math.max(this.zoomLevel * delta, 1), 5);
  
    this.pointX = mouseX - x * this.zoomLevel;
    this.pointY = mouseY - y * this.zoomLevel;
  }

  onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.panning = true;
    this.start = {
      x: event.clientX - this.pointX,
      y: event.clientY - this.pointY,
    };
  }
  
  onMouseMove(event: MouseEvent): void {
    if (!this.panning) return;
    this.pointX = event.clientX - this.start.x;
    this.pointY = event.clientY - this.start.y;
  }
  
  onMouseUp(): void {
    this.panning = false;
  }

  imagePopupOpen(data: any) {
    if (data.full_image_path == null || data.full_image_path == 'null' || data.full_image_path == undefined || data.full_image_path == 'undefined' || data.full_image_path == '') {
      this.toastrService.warning(this.translocoService.translate('frame_id_not_exists'));
      return;
    }
    if (this.popupDefectData?.defect_id) {
      this.clearHighlight();
    }
    this.isDropdownOpen = false;
    this.popupDefectData = data;
    this.showDefectPopup = true;
    const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 5 && item.module_id === 3);
    if(activityObject){
      this.commonService.addActivityLog(activityObject)
    }
  }
  clearHighlight() {
    if (this.chartInstance) {
      this.chartInstance.dispatchAction({
        type: 'hideTip',
        seriesIndex: 0
      });
    }
  }
  closeDefectImagePopup() {
    this.showDefectPopup = false;
    this.zoomLevel = 1;
    this.pointX = 0;
    this.pointY = 0;
  }

  setFeaturePermission(): void {
    if (this.featurePermissions) {
      for (const key in this.featurePermissions) {
        const featurePermissionsData = this.featurePermissions[key]
        if (Array.isArray(featurePermissionsData) && featurePermissionsData.length > 0) {
          this.spliceDefectStatus = featurePermissionsData.some(data => data.feature_name === 'Splice Defect');
          this.repairDefectStatus = featurePermissionsData.some(data => data.feature_name === 'Repair Defect');
          this.suggetionForDeleteDefectStatus = featurePermissionsData.some(data => data.feature_name === 'Suggetion For Delete Defect');
          this.rollRunningStatus = featurePermissionsData.some(data => data.feature_name === 'Roll Running Status(start,stop,continue)');
          this.editMachineConfigurationStatus = featurePermissionsData.some(data => data.feature_name === 'Edit Machine Configuration');
          this.doneRepairStatus = featurePermissionsData.some(data => data.feature_name === 'Done Repair');
          this.showDefectInfoZoominZoomoutStatus = featurePermissionsData.some(data => data.feature_name === 'Show Defect Info/Zoom in/Zoom out');
        }
      }

    }
  }

  @ViewChild('cardSlider', { static: false }) cardSlider: ElementRef;
  isDragging = false;
  startX: number;
  scrollLeftStart: number;

  scrollLeft() {
    this.cardSlider.nativeElement.scrollBy({ left: -200, behavior: 'smooth' });
  }

  scrollRight() {
    this.cardSlider.nativeElement.scrollBy({ left: 200, behavior: 'smooth' });
  }

  startDragging(event: MouseEvent) {
    this.isDragging = true;
    this.startX = event.pageX - this.cardSlider.nativeElement.offsetLeft;
    this.scrollLeftStart = this.cardSlider.nativeElement.scrollLeft;
  }

  stopDragging() {
    this.isDragging = false;
  }

  onDrag(event: MouseEvent) {
    if (!this.isDragging) return;
    event.preventDefault();
    const x = event.pageX - this.cardSlider.nativeElement.offsetLeft;
    const walk = (x - this.startX) * 1.2;
    this.cardSlider.nativeElement.scrollLeft = this.scrollLeftStart - walk;
  }

  openDefectImage(): void {
    this.showRepairPopup = true;
  }

  closeDefectImage(): void {
    this.showRepairPopup = false;
  }
  openSpliceImage(): void {
    this.showSpliceImages = true;
  }

  closeSpliceImage(): void {
    this.showSpliceImages = false;
  }

  onImageLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    this.imageWidth = img.naturalWidth;
    this.imageHeight = img.naturalHeight;
  }
  startHold(topicname: string,status: boolean) {
    this.holdTimeout = setTimeout(() => {
      this.isHolding = true;
      this.onHoldAction(topicname,status); 
    },0);
  }

  stopHold(topicname: string,status: boolean) {
    clearTimeout(this.holdTimeout);

    if (this.isHolding) {
      const correctiondata = {
      "status" : status
    }
      this.publishMessageOnTopic(
        topicname
        , "std_msgs/String",
        JSON.stringify(correctiondata)
      );
    }

    this.isHolding = false;
  }

  onHoldAction(topicname: string,status: boolean) {
    const correctiondata = {
      "status" : status
    }
    this.publishMessageOnTopic(
      topicname
      , "std_msgs/String",
      JSON.stringify(correctiondata)
    );
  }

  correctionActive = false;
  forwardActive = false;

  toggleCommand(topicname: string) {

    let status = false;

    if (topicname === 'correctioncommand') {
      this.correctionActive = !this.correctionActive;
      status = this.correctionActive;
    }

    if (topicname === 'forwardmachine') {
      this.forwardActive = !this.forwardActive;
      status = this.forwardActive;
    }

    const correctiondata = {
      status: status
    };

    this.publishMessageOnTopic(
      topicname,
      "std_msgs/String",
      JSON.stringify(correctiondata)
    );
  }

  getSpliceData(): void {
    this._RollsService.getSpliceData(this.roll_id).subscribe({
      next: (response: any) => {
        if (response.status) {
          this.spliceData = response.data;
        } else {
          this.toastrService.error(response.error, "Error!");
        }
      },
      error: (error: any) => {
        console.error("Error fetching splice data from the API", error);
      },
    });
  }

  setRepairPopupUpDetails(){
    this.stopHold('forwardmachine', false)
    this.repairDefectrData = []
    const repair_table_end = this.current_repair_meter;
    const repairstartoffset =
      this.current_repair_meter -  (this.config_data.repairing_offset / 1000)
    const repairstartoffsetYaxis = parseFloat(
      (
        (repairstartoffset)
      ).toFixed(2)
    );
    const repairendoffset =
      this.current_repair_meter -  ((this.config_data.repairing_offset / 1000) + this.config_data.inspection_table_width / 1000);
    const repairendoffsetYaxis = parseFloat(
      (
        (repairendoffset) 
      ).toFixed(2)
    );
    const repair_table_start = repairendoffsetYaxis - 1
    let filterarrayonload;
    const spliceArray = this.spliceData.filter((data)=>{
        return (((this.current_repair_meter) < (this.totalmeter - data.splice_end_meter)) || ((this.current_repair_meter - this.tableStaticHeight) < (this.totalmeter - data.splice_start_meter)) && data.splice_status === 0)
    })
    spliceArray.sort((a, b) => b.splice_end_meter - a.splice_end_meter);
    let spliceFilterData = [];
    let nonSpliceFilterData = [];
    this.nodeDataArray_strip.forEach((defect) => {
      const defectY =
        parseFloat(((defect.defect_top_left_y_mm / this.metercal) +
        (defect.defect_height_mm / this.metercal)).toFixed(2));

      const actualPos = parseFloat(((this.totalmeter - defectY) - 0.05).toFixed(2));
      const filteredSpliceArray = spliceArray.filter(
        splice => (this.totalmeter - splice.splice_end_meter) < this.current_repair_meter
      );
      const inSplice = filteredSpliceArray.length > 0 && (filteredSpliceArray.some(splice =>
        {
          return splice.defect_ids.some(id => id === defect.defect_id)
        }) ||
        this.spliceArray.some(splice =>
          {
            return splice.defect_ids.some(id => id === defect.defect_id)
          })
      );
      if (inSplice) {
        spliceFilterData.push(defect);
        return;
      }

     
      if (actualPos <= repairstartoffsetYaxis) {
        nonSpliceFilterData.push(defect);
      } 
    });
     filterarrayonload = [...nonSpliceFilterData];
    filterarrayonload.sort(
      (a, b) =>
        (b.defect_top_left_y_mm / this.metercal +
          b.defect_height_mm / this.metercal) -
        (a.defect_top_left_y_mm / this.metercal +
          a.defect_height_mm / this.metercal)
    );

    this.repairDefectrData = filterarrayonload;
   
    let yellow_line_data = [];
    yellow_line_data.push(
      {
        yAxis: repairstartoffsetYaxis,
        lineStyle: { color: 'green', type: 'solid',width:2  },
        label: { show: false, position: 'end' }
      },
      {
        yAxis: repairendoffsetYaxis,
        lineStyle: { color: 'green', type: 'solid',width:2 },
        label: { show: false, position: 'end' }
      }
    );
    let markLineData = {
      silent: true, // The lines will not have any interaction.
      symbol: 'none',
      data: [...yellow_line_data]
    };
   
    this.repairScatterData = filterarrayonload.map(item => ({
          value: [
            (item.defect_top_left_x_mm) / 1000,   // X coordinate (width)
            +((this.totalmeter - (item.defect_top_left_y_mm / 1000))).toFixed(2), // Y coordinate (length)
            item.defect_height_mm * item.defect_width_mm    // area
          ],
          Defect_ID: item.defect_id,
          itemStyle: { color: "#e63946" } // red tone for defects
        }));
        
    // Chart configuration
        this.repairChartOption = {
          backgroundColor: "#fff",
          grid: {
            left: 60,
            right: 30,
            top: 50,
            bottom: 50,
            containLabel: true
          },
          xAxis: {
            name: 'Fabric Width (m)',
            type: 'value',
            min: 0,                     // lower limit
            max: this.scatterPlotWidth,
            nameLocation: 'middle',
            nameGap: 25,
            position: 'top',
            splitLine: { show: true, lineStyle: { type: 'dashed', color: '#ddd' } },
            axisLine: { lineStyle: { color: '#000' } },
            nameTextStyle: { fontWeight: 'bold', color: '#000' }
          },
          yAxis: {
            name: 'Fabric Length (m)',
            type: 'value',
            // inverse: true,
            min: repair_table_start,                     // lower limit
            max: repair_table_end,
            nameLocation: 'middle',
            nameGap: 60,
            axisLine: { lineStyle: { color: '#000' } },
            splitLine: { show: true, lineStyle: { type: 'dashed', color: '#ddd' } },
            axisLabel: { formatter: (v: number) => v.toFixed(1) },
            nameTextStyle: { fontWeight: 'bold', color: '#000' }
          },
          tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(0,0,0,0.7)',
            textStyle: { color: '#fff' },
            formatter: (params: any) => {
              const [x, y] = params.data.value;
              return `X: ${x.toFixed(2)} m<br>Y: ${y.toFixed(2)} m<br>ID: D${params.data.Defect_ID}`;
            }
          },
          dataZoom: [
          ],
          series: [
            {
              type: 'scatter',
              data: this.repairScatterData,
              symbolSize: (data) => {
                const area = data[2] || 1;
                return area <= 20000 ? 8 :
                  area <= 40000 ? 10 :
                    area <= 80000 ? 12 :
                      area <= 150000 ? 14 : 20;
              },
              emphasis: { focus: 'series' },
              animation: false,
              markLine: (yellow_line_data.length > 0) ?  {
                ...markLineData,
                animation: false,
              } : null,
            },
            {
              // blue vertical reference lines
              type: 'line',
              markLine: {
                symbol: 'none',
                silent: true,
                lineStyle: { color: 'blue', width: 2 }
              }
            }
          ]
        };

        this.repairChartOptionStatus = true;
        this.repairImageIndex = 0;
  }
  onMergedImageLoad(event: any) {
    const img = event.target;
    this.imageWidth = img.naturalWidth;
    this.imageHeight = img.naturalHeight;
    this.mergedImgWidth = img.naturalWidth;
    this.mergedImgHeight = img.naturalHeight;

    const parent = img.parentElement?.parentElement;
    if (parent) {
      this.mergedContainerWidth = parent.clientWidth;
      this.mergedContainerHeight = parent.clientHeight;
    }
  }


  mergedZoom(event: WheelEvent) {
    event.preventDefault();

    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    this.mergedOrigin = `${(mouseX / rect.width) * 100}% ${(mouseY / rect.height) * 100}%`;

    const delta = event.deltaY < 0 ? 1.15 : 1 / 1.15;
    const newZoom = this.mergedZoomLevel * delta;

    this.mergedZoomLevel = Math.min(Math.max(newZoom, 1), 5);

    const x = (mouseX - this.mergedX) / this.mergedZoomLevel;
    const y = (mouseY - this.mergedY) / this.mergedZoomLevel;

    this.mergedX = mouseX - x * this.mergedZoomLevel;
    this.mergedY = mouseY - y * this.mergedZoomLevel;

    this.lockMergedPosition();
  }

  mergedMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.mergedPanning = true;

    this.mergedStart = {
      x: event.clientX - this.mergedX,
      y: event.clientY - this.mergedY
    };
  }

  mergedMouseMove(event: MouseEvent) {
    if (!this.mergedPanning) return;

    this.mergedX = event.clientX - this.mergedStart.x;
    this.mergedY = event.clientY - this.mergedStart.y;
  }

  mergedMouseUp() {
    this.mergedPanning = false;
  }

  // Boundary Lock
  lockMergedPosition() {
    const w = this.mergedImgWidth * this.mergedZoomLevel;
    const h = this.mergedImgHeight * this.mergedZoomLevel;

    const minX = this.mergedContainerWidth - w;
    const minY = this.mergedContainerHeight - h;

    if (w <= this.mergedContainerWidth) {
      this.mergedX = (this.mergedContainerWidth - w) / 2;
    } else {
      this.mergedX = Math.min(0, Math.max(this.mergedX, minX));
    }

    if (h <= this.mergedContainerHeight) {
      this.mergedY = (this.mergedContainerHeight - h) / 2;
    } else {
      this.mergedY = Math.min(0, Math.max(this.mergedY, minY));
    }
  }

  onRepairImageLoad(index:any)
  {
    this.repairImageIndex = index;
    this.mergedZoomLevel = 1;
    this.mergedX = 0;
    this.mergedY = 0;
    this.mergedStart = { x: 0, y: 0 };
    this.mergedPanning = false;

    this.mergedImgWidth = 0;
    this.mergedImgHeight = 0;

    this.mergedContainerWidth = 0;
    this.mergedContainerHeight = 0;

    // Default origin
    this.mergedOrigin = "50% 50%";

  }

  toggleInfo() {
    this.showInfo = !this.showInfo;
  }
    showOverrideModal() {
    if (this.checkedItems.length === 0) {
      this.selectCheckbox();
      this.toastrService.warning(this.translocoService.translate('please_select_at_least_one_defect'));
      return;
    }
    this.showOverrideConfirm = true;
  }

  closeOverrideModal() {
    this.showOverrideConfirm = false;
  }

  confirmOverride() {
    this.splice_repair_defect(3);
    this.closeOverrideModal();
  }


  getTotalSpliceMeter() {
    this._RollsService.getTotalSpliceMeter(this.roll_id).subscribe({
      next: (response: any) => {
        if (response.status) {
          this.totalSpliceMeter = response.splice_meter;
        }
      },
      error: (error: any) => {
        console.error("Error fetching total splice meter from the API", error);
      },
    });
  }
}
