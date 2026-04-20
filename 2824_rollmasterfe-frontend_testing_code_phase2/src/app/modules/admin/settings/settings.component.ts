import { ChangeDetectorRef, Component, HostListener, Input, ViewChild } from '@angular/core';
import { RollsService } from "app/services/rolls.service";
import { UserService } from 'app/core/user/user.service';
import { ToastrService } from 'ngx-toastr';
import { catchError, takeUntil, tap, take } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NavigationMockApi } from 'app/mock-api/common/navigation/api';
import { defaultFeatureActivityList } from 'app/globalvariables/globalvariables';
import { CommonService } from 'app/services/common.service';
import { error } from 'jquery';
import { User } from "app/core/user/user.types";
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { TranslocoService } from "@ngneat/transloco";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  @ViewChild('excelDropdown') excelDropdown!: any;
  dropdownSettings: IDropdownSettings = {};
  selectedReportTab: string = 'roll';
  activeTab = 'customer-config'; // Default active tab
  showDeleteModal = false;
  showEditModal=false;
  showDefectGradingList = false;
  addEditBtnDefectGrading: any = 'Add';
  showDeleteModalforPdf = false;
  showDeleteModalforQualitylist = false;
  showList: boolean = false;
  showPdfList: boolean = false;
  userTags: any = [];
  roles: any = [];
  addEditBtn:any = 'Add';
  addEditBtnQualitycode:any;
  modules: any = [];
  moduleVisibility:any=[];
  features: any;
  featurePermissions: any;
  module_name: any;
  selectedRole: string = '';
  checkedModules: { [key: number]: boolean } = {};
  checkedFeatures: { [key: number]: boolean } = {};
  moduleVisibilityMap: {[roleId: number]: Set<number> }={};
  getAllPdfLists:any=[];
  getAllQualityLists:any=[];
  deletePdfById:any;
  deleteQualitycodeById:any;
  newTagName: string = '';
  deleteTagId: any;
  isLoading: boolean;
  selectedTag: any;
  editTagId: any;
  editMode: boolean = false;
  userList: any = [];
  onlyMap:any=false;
  showFirstInput = true;
  showBothInputs = false;
  clickedFields: { [key: string]: boolean } = {};
  isTyping: boolean = false;
  all_model_data: any;
  drop_down_status:any = false;
  dropdownList = [];
  all_defect_types: any;
  ai_suggestion_data: any;
  pdfAddEditForm: FormGroup = new FormGroup({
    configName: new FormControl('', [
      Validators.required,
      Validators.pattern('^[a-zA-Z0-9_]*$')
    ]),
    logoImage:  new FormControl(''),
    onlyMap:  new FormControl(false),
    defectStatus:  new FormControl(false),
    defectInfo:  new FormControl(false),
    defectType:  new FormControl(false),
    defectIdReset:  new FormControl(false),
    aiSuggestion: new FormControl(false),
    locationFilter: new FormControl(false),
    id: new FormControl(''),
    sharing_configuration_type: new FormControl(''),
    country_code_selection: new FormControl('+91'),
    custom_country_code: new FormControl(''),
    mobile_number: new FormControl('', [
      Validators.pattern(/^\d{4,15}$/)
    ]),
    target_emails: new FormControl(''),
  });

  defectGradingForm: FormGroup = new FormGroup({
    measurement_unit: new FormControl(''),
    max_allowable_points: new FormControl('', [Validators.pattern('^[0-9]*$')]),
  });

  defectGradingRuleForm: FormGroup = new FormGroup({
    defect_category: new FormControl('', [Validators.required]),
    condition: new FormControl('', [Validators.required]),
    min_defect_size: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
    max_defect_size: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
    points: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
    rule_id: new FormControl(''),
  });

  qualityCodeAddEditForm: FormGroup = new FormGroup({
    quality_code:new FormControl('', [
      Validators.required,
      Validators.pattern('^[a-zA-Z0-9_]*$')
    ]),
    min_tolerance:  new FormControl('',Validators.pattern('^[0-9]*$')),
    max_tolerance:  new FormControl('',Validators.pattern('^[0-9]*$')),
    model_id: new FormControl("null"),
    defect_type: new FormControl("null"),
    defect_size: new FormControl("null"),
    defect_size1: new FormControl(""),
    defect_size2: new FormControl(""),
    quality_code_id: new FormControl(''),
  });
  kvp_backend_url: any;
  file:any;
  @Input() roleFeaturePermissions: any[] = [];
  module_id: any = 7;
  loggedInRole: any = localStorage.getItem('role_id');
  addCustomUserTagStatus: boolean = false;
  deleteCustomUserTagStatus: boolean = false;
  moduleVisiblityStatus: boolean = false;
  editPdfGenerationStatus: boolean = false;
  addPdfGenerationConfigStatus: boolean = false;
  deletePdfGenerationStatus: boolean = false;
  addQualityCodeConfigStatus: boolean = false;
  editCustomUserTagStatus: boolean = false;
  editQualityCodeConfigStatus: boolean = false;
  deleteQualityCodeConfigStatus: boolean = false;
  permissionModuleId: number; // Default module ID for permissions
  Setting: boolean = false;
  config_data: any = [];
  Repair_machine_id: any;
  config_check: any = true;
  defectGradingRulesData: any[] = [];
  editDefectGradingRuleIndex: number = -1;
  deleteDefectGradingRuleIndex: number = -1;
  showDeleteModalForDefectGrading: boolean = false;
  Form: FormGroup = new FormGroup({
    inspection_table_width: new FormControl(""),
    splicing_offset: new FormControl(""),
    repairing_offset: new FormControl(""),
    jogging_offset: new FormControl(""),
    // correction_factor: new FormControl(""),
    repair_machine_id: new FormControl(""),
  });
  inspectionForm: FormGroup = new FormGroup({
    machine_name: new FormControl(""),
    machine_ip: new FormControl(""),
    master_status: new FormControl("")
  });
  criticalDefectForm: FormGroup = new FormGroup({
    defect_type_name: new FormControl(""),
    color: new FormControl("")
  });
  criticalDefectData: any[] = [];
  addEditBtnCriticalDefect: string = 'Add';
  editCriticalDefectIndex: number = -1;
  deleteCriticalDefectIndex: number = -1;
  showDeleteModalForCriticalDefect: boolean = false;
  submitted: any = false;
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  user_id: any;
  user: User;
  emails: string[] = [];
  reportConfigurationForm = new FormGroup({
    configName: new FormControl('', [
      Validators.required,
      Validators.pattern('^[a-zA-Z0-9_]*$')   // only letters, numbers, underscore
    ]),
    frequency: new FormControl(1, [
      Validators.required,
      Validators.pattern('^[0-9]+$'),          // numbers only
      Validators.min(1),
      Validators.max(30)
    ]),
    targetEmails: new FormControl('', Validators.email),
    machineIds: new FormControl([], Validators.required),
    repairMachineId: new FormControl(''),
    days: new FormControl('',[
      Validators.required,
      Validators.min(1),
      Validators.max(100)
    ]),
    hour: new FormControl(''),
    minute: new FormControl(''),
    time: new FormControl('', Validators.required),
    rollsStatus: new FormControl(''),
    columnName: new FormControl([],Validators.required),
    dataStatus: new FormControl(''),
    recipe: new FormControl(''),
    userTag: new FormControl(''),
  });
  selectedStatusOption: any = { value: '', viewValue: '', type: "" };
  options = [
    { value: 'Live', viewValue: 'Live' },
    { value: 'ARCHIVE', viewValue: 'Archive' },
    { value: 'BACKUP', viewValue: 'Backup' },
    { value: 'BACKUP AVALIABLE', viewValue: 'Backup Available' },
    { value: 'BACKUP DELETED', viewValue: 'Backup Deleted' },
    { value: 'JOB RESTORED', viewValue: 'Job Restored' },
  ];
  mergedOptions: {
    type: any; value: string; viewValue: string
  }[] = [];
  status: any;
  tag_name: string;
  optionsForUserTag: {
    user_tag_id: any;
    id: any; value: string; tag_name: string
  }[] = [

    ];
  tagDropdownList: any = [];
  recipeNames: string[] = [];
  repairMachineIds: string[] = [];
  // machineIds: any = [];
  machineData: any = [];
  // machine_id: any;
  // machineDropdownList: any[] = [];
  machineDropdownSettings: any = {
    singleSelection: false,
    idField: 'id',
    textField: 'name',
    selectAllText: 'Select All',
    unSelectAllText: 'UnSelect All',
    itemsShowLimit: 5,
    allowSearchFilter: true
  };
  excelColumnSetting: any = {
    singleSelection: false,
    idField: 'id',
    textField: 'name',
    selectAllText: 'Select All',
    unSelectAllText: 'UnSelect All',
    itemsShowLimit: 5,
    allowSearchFilter: true,
    enableCheckAll: false
  };
  timeSlots: string[] = [];
  productionReportConfigData: any = [];
  originalConfigName: any = '';
  showDeleteModalforProductionReport: boolean = false;
  editPdfMode: boolean = false;
  allMachinesData: any = [];
  addEditBtnMachineConfig:any = 'Add';
  addEditBtnInspectionMachineConfig:any = 'Add';

  
  updateMachineId: any;
  deleteMachineConfigId: any;
  showDeleteModalForMachineConfig: any = false;
  allColumnNameArray = [
    // 1 Roll Details
    [
      { label: 'Roll Number', key: 'roll_number', sorting:true },
      { label: 'GSM', key: 'gsm', sorting:true },
      { label: 'Width', key: 'width', sorting:true },
      { label: 'Roll Length', key: 'roll_length', sorting:true },
      { label: 'Loom Number', key: 'loom_number', sorting:false },
      { label: 'Status of Roll', key: 'status_of_roll', sorting:true },
      { label: 'Data Status', key: 'data_status', sorting:false }
    ],
    // 2 Inspection Details
    [
      { label: 'Master Start Date/Time', key: 'master_start_datetime', sorting:true },
      { label: 'Master Start Date', key: 'master_start_date', sorting:true },
      { label: 'Master Start Time', key: 'master_start_time', sorting:true },
      { label: 'Master End Date/Time', key: 'master_end_datetime', sorting:true },
      { label: 'Master End Date', key: 'master_end_date', sorting:true },
      { label: 'Master End Time', key: 'master_end_time', sorting:true },
      { label: 'Inspected Length (M)', key: 'inspected_length_m', sorting:true },
      { label: 'Total Inspection Time(Min)', key: 'total_inspection_time_min', sorting:false },
      { label: 'Master Machine ID', key: 'master_machine_id', sorting:false },
      { label: 'Corrected Avg Master Speed', key: 'corrected_avg_master_speed', sorting:false },
      { label: 'Average Master Speed (mpm)', key: 'average_master_speed_mpm', sorting:false },
      { label: 'Total Defects Inspected', key: 'total_defects_inspected', sorting:true },
      { label: 'Avg defects per 1000 meter', key: 'avg_defects_per_1000_meter', sorting:false }
    ],
    // 3 Review Details
    [
      { label: 'Review Start Date/Time', key: 'review_start_datetime', sorting:false },
      { label: 'Review Start Date', key: 'review_start_date', sorting:false },
      { label: 'Review Start Time', key: 'review_start_time', sorting:false },
      { label: 'Review End Date/Time', key: 'review_end_datetime', sorting:false },
      { label: 'Review End Date', key: 'review_end_date', sorting:false },
      { label: 'Review End Time', key: 'review_end_time', sorting:false },
      { label: 'Total Review Time (Min)', key: 'total_review_time_min', sorting:false },
      { label: 'Total defects deleted during Review', key: 'total_defects_deleted_during_review', sorting:false },
      { label: 'AI Agent Feedback Count', key: 'review_agent_feedback_count', sorting:false }
    ],
    // 4 Repair Details
    [
      { label: 'Repair Machine ID', key: 'repair_machine_id', sorting:false },
      { label: 'Repair Start Date/Time', key: 'repair_start_datetime', sorting:false },
      { label: 'Repair Start Date', key: 'repair_start_date', sorting:false },
      { label: 'Repair Start Time', key: 'repair_start_time', sorting:false },
      { label: 'Repair End Date/Time', key: 'repair_end_datetime', sorting:false },
      { label: 'Repair End Date', key: 'repair_end_date', sorting:false },
      { label: 'Repair End Time', key: 'repair_end_time', sorting:false },
      { label: 'Repair Time Taken (min)', key: 'repair_time_taken_min', sorting:false },
      { label: 'Repair meter', key: 'repair_meter', sorting:false },
      { label: 'Average Repair Speed (mpm)', key: 'average_repair_speed_mpm', sorting:false },
      { label: 'Total defects approved for repair', key: 'total_defects_approved_for_repair', sorting:false },
      { label: 'Defects actually Repaired', key: 'defects_actually_repaired', sorting:false },
      { label: 'Defects actually Override', key: 'defects_actually_override', sorting:false },
      { label: 'Number of Splices done', key: 'number_of_splices_done', sorting:false },
      { label: 'Length removed during splicing (M)', key: 'length_removed_during_splicing_m', sorting:false }
    ],
    // 5 Defect Details
    [
      { label: 'Category Wise Defect Count', key: 'category_wise_defect_count',sorting:false },
      { label: 'Enable defects', key: 'enable_defects', sorting:false },
      { label: 'Disable defects', key: 'disable_defects', sorting:false }
    ],
    // 6 Body Details
    [
      { label: 'Primary Body', key: 'primary_body', sorting:false },
      { label: 'Secondary Body', key: 'secondary_body', sorting:false },
      { label: 'Tertiary Body', key: 'tertiary_body', sorting:false },
      { label: 'Wastage Information', key: 'wastage_information', sorting:false }
    ],
    // 7 Loom Report Data
    [
      { label: 'Loom ID', key: 'loom_id', sorting:false },
      { label: 'Total Rolls', key: 'total_rolls', sorting:false },
      { label: 'Total Length', key: 'total_length', sorting:false },
      { label: 'Total Defects', key: 'total_defects', sorting:false },
      { label: 'Total Wastage (KG)', key: 'total_wastage_kg', sorting:false },
      { label: 'Category Wise Defect Count', key: 'category_wise_defect_count', sorting:false }
    ],
    // 8 Defect Details
    [
      { label: 'Defect Type', key: 'defect_type', sorting:false },
      { label: 'Location X(CM)', key: 'location_x', sorting:false },
      { label: 'Location Y(M)', key: 'location_y', sorting:false },
      { label: 'Widht(MM)', key: 'width_mm', sorting:false },
      { label: 'Height(MM)', key: 'height_mm', sorting:false },
      { label: 'Operator Action', key: 'operator_action', sorting:false }
    ],
    // 9 Usage Report Data
    [
      { label: 'Date', key: 'date', sorting:false },
      { label: 'Machine ID', key: 'machine_id', sorting:false },
      { label: 'Machine On Hours', key: 'machine_on_hours', sorting:false },
      { label: 'Machine Off Hours', key: 'machine_off_hours', sorting:false },
      { label: 'Engaged Hours', key: 'engaged_hours', sorting:false },
      { label: 'Average Speed (MPM)', key: 'average_speed_mpm', sorting:false }
    ]
  ];
  columnNameArray:any = [];
  showColumnNameModal:boolean = false;
  selectedAll:any;
  reportType: any = 'all';
  excelColumnData: any = [
    { id: 1, name: 'Roll Details Column' },
    { id: 2, name: 'Inspection Details Column' },
    { id: 3, name: 'Review Details Column' },
    { id: 4, name: 'Repair Details Column' },
    { id: 5, name: 'Defects Summary Column' },
    { id: 6, name: 'Body Details Column' },
    { id: 7, name: 'Loom Report Column' },
    { id: 8, name: 'Defects Details Column'},
    { id: 9, name: 'Usage Report Column' }
  ];
  excelColumnNameArray: any = [];
  updateInspectionMachineId: any;
  deleteInsepctionMachineConfigId: any;
  showDeleteModalForInspectionMachineConfig: any = false;
  selectedConfigTab: string = 'repair_machine_config';
  addRepairMachineConfigStatus: boolean = false;
  editRepairMachineConfigStatus: boolean = false;
  deleteRepairMachineConfigStatus: boolean = false;
  addInspectionMachineConfigStatus: boolean = false;
  editInspectionMachineConfigStatus: boolean = false;
  deleteInspectionMachineConfigStatus: boolean = false;
  addProductionReportConfigStatus: boolean = false;
  editProductionReportConfigStatus: boolean = false;
  deleteProductionReportConfigStatus: boolean = false;
  selectedHour: string = '00';
  selectedMinute: string = '00';
  currentSortColumn: string = '';
  firstEnabledColumnStatus: boolean = false;
  clickTimer: any;
  selectColumnName:any = '';
  currentEditingCol: any = null;
  mobileList: any[] = [];
  emailList: string[] = [];
  mobileListError = false;
  emailListError = false;
  countryCodeDropdownOpen = false;
  countryCodeOptions = [
    { label: 'India', value: '+91' },
    { label: 'Spain', value: '+34' },
    { label: 'Indonesia', value: '+62' },
    { label: 'Russia', value: '+7' },
    { label: 'Turkey', value: '+90' },
    { label: 'Other', value: 'custom' }
  ];
  languages = ['English', 'Hindi', 'Russian', 'Turkish', 'Spanish', 'Indonesian'];
  selectedLanguage: string = 'English';
  languageMap: { [key: string]: string } = {
    'English': 'en',
    'Hindi': 'hi',
    'Russian': 'ru',
    'Turkish': 'tr',
    'Spanish': 'es',
    'Indonesian': 'id'
  };
  predefinedColors: string[] = [
    '#4169E1', '#40E0D0', '#DC143C', '#00BFFF', '#FF69B4', '#FF4040', '#6A5ACD', '#2E8B57',
    '#367588', '#B22222', '#009B77', '#E30B5D', '#43B3AE', '#1560BD', '#FF4500', '#FE6F5E',
    '#E52B50', '#007BA7', '#C54B8C', '#BF00FF'
  ];

  // Function to open the modal
  showSetting() {
    this.Setting = true;
    // Optionally, disable page scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  // Function to close the modal
  hideSetting() {
    this.Setting = false;
    // Re-enable page scroll when modal is closed
    document.body.style.overflow = 'auto';
  }

  constructor(
    private RollsService: RollsService,
    private UserService: UserService,
    private toastr: ToastrService,
    private _apiComponent: NavigationMockApi,
    private commonService: CommonService,
    private cdr: ChangeDetectorRef,
    private _formBuilder: FormBuilder,
    private translocoService: TranslocoService
  ) { }

  ngOnInit() {
    localStorage.removeItem('roll_id');
    localStorage.removeItem('robro_roll_id');
    localStorage.removeItem('api_path');
    this.RollsService.get_api_path();
    this.updateOptionsAndSettings();
    this.getlanguageChange();
    // this.onChangeValidationCheck();
    setTimeout(() => {
      this.loggedInRole = localStorage.getItem('role_id');
      if (this.module_id && this.loggedInRole) {
        this.getAllRoleFeaturePermission(this.module_id, this.loggedInRole);
      }
    }, 100);
    this.UserService.user$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((user: User) => {
        this.user = user;
        this.user_id = this.user.user_id;
      });
    this.getUserTagList();
    this.getrole();
    this.getAllModules();
    this.getModuleVisibilityApi("",'2', "");
    this.getAllPdfGenerationConfigs();
    this.getAllQualityCodes();
    this.getAllModelList();
    this.getAllDefectsbyRollId();
    this.fetchUserTags();
    this.fetchAllRecipes();
    this.getReportConfiguration();
    this.getAllMachines();
    this.getAllInspectionMachine();
    this.dropdownList = [];
    this.defectsDropDown = []
    this.getAllUniqueDefectTypes();
    this.getLanguageSettings();
    this.getCriticalDefectData();
    this.getDefectGradingData();
     this.Repair_machine_id = `${(window as any).__env.repair_machine_id}`;
    if (this.Repair_machine_id) {
    }
    this.Form = this._formBuilder.group({
      inspection_table_width: [
        "",
        [
          this.greaterThan1("inspection_table_width"),
          Validators.required,
          Validators.pattern("^[0-9]+(.[0-9]+)?$"),
          Validators.max(1000),
        ],
      ],
      splicing_offset: [
        "",
        [
          this.greaterThan1("splicing_offset"),
          Validators.required,
          Validators.pattern("^[0-9]+(.[0-9]+)?$"),
          Validators.max(10000),
        ],
      ],
      repairing_offset: [
        "",
        [
          this.greaterThan1("repairing_offset"),
          Validators.required,
          Validators.pattern("^[0-9]+(.[0-9]+)?$"),
          Validators.max(1000),
        ],
      ],
      jogging_offset: [
        "",
        [
          this.greaterThan1("jogging_offset"),
          Validators.required,
          Validators.pattern("^[0-9]+(.[0-9]+)?$"),
          Validators.min(1000),
          Validators.max(10000),
        ],
      ],
      repair_machine_id: [
        "",
        [
          Validators.required,
          Validators.pattern("^[a-zA-Z0-9_]*$"),
        ],
      ],
    });

    this.inspectionForm = this._formBuilder.group({
      machine_name: [
        "",
        [
          Validators.required,
          Validators.pattern("^[a-zA-Z0-9_]*$"),
        ],
      ],
      machine_ip: [
        '',
        [
          Validators.required,
          Validators.pattern('^(localhost|((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$')
        ]
      ],
      master_status: [
      false,
      []
    ]
    });
    this.criticalDefectForm = this._formBuilder.group({
      defect_type_name: ["", [Validators.required]],
      color: ["", [Validators.required]]
    });
    this.defectGradingForm = this._formBuilder.group({
      measurement_unit: [""],
      max_allowable_points: ["", [Validators.pattern("^[0-9]*$")]],
    });
    this.defectGradingRuleForm = this._formBuilder.group({
      defect_category: ["", [Validators.required]],
      condition: ["", [Validators.required]],
      min_defect_size: ["", [Validators.required, Validators.pattern("^[0-9]*$")]],
      max_defect_size: ["", [Validators.required, Validators.pattern("^[0-9]*$"), this.greaterThan('min_defect_size')]],
      points: ["", [Validators.required, Validators.pattern("^[0-9]*$")]],
      rule_id: [""],
    });
  }

  updateOptionsAndSettings() {
    this.dropdownSettings = {
      singleSelection: false,
      idField: 'item_id',
      textField: 'item_text',
      selectAllText: this.translocoService.translate('select_all'),
      unSelectAllText: this.translocoService.translate('unselect_all'),
      itemsShowLimit: 3,
      allowSearchFilter: true
    };

    this.machineDropdownSettings = {
      singleSelection: false,
      idField: 'id',
      textField: 'name',
      selectAllText: this.translocoService.translate('select_all'),
      unSelectAllText: this.translocoService.translate('unselect_all'),
      itemsShowLimit: 5,
      allowSearchFilter: true
    };

    this.excelColumnSetting = {
      singleSelection: false,
      idField: 'id',
      textField: 'name',
      selectAllText: this.translocoService.translate('select_all'),
      unSelectAllText: this.translocoService.translate('unselect_all'),
      itemsShowLimit: 5,
      allowSearchFilter: true,
      enableCheckAll: false
    };

    this.options = [
      { value: 'Live', viewValue: this.translocoService.translate('live') },
      { value: 'ARCHIVE', viewValue: this.translocoService.translate('archive') },
      { value: 'BACKUP', viewValue: this.translocoService.translate('backup') },
      { value: 'BACKUP AVALIABLE', viewValue: this.translocoService.translate('backup_available') },
      { value: 'BACKUP DELETED', viewValue: this.translocoService.translate('backup_deleted') },
      { value: 'JOB RESTORED', viewValue: this.translocoService.translate('job_restored') },
    ];

    this.mergedOptions = [
      ...this.options.map(opt => ({ value: opt.value, viewValue: opt.viewValue, type: 'status' })),
    ];

    this.excelColumnData = [
      { id: 1, name: this.translocoService.translate('roll_details') },
      { id: 2, name: this.translocoService.translate('inspection_info') },
      { id: 3, name: this.translocoService.translate('review_info') },
      { id: 4, name: this.translocoService.translate('repair_info') },
      { id: 5, name: this.translocoService.translate('defects_summary_info') },
      { id: 6, name: this.translocoService.translate('body_info') },
      { id: 7, name: this.translocoService.translate('loom_report') },
      { id: 8, name: this.translocoService.translate('defects_details_info') },
      { id: 9, name: this.translocoService.translate('usage_report_info') }
    ];

    this.allColumnNameArray = [
      // 1 Roll Details
      [
        { label: this.translocoService.translate('roll_id'), key: 'roll_number', sorting: true },
        { label: this.translocoService.translate('gsm'), key: 'gsm', sorting: true },
        { label: this.translocoService.translate('width'), key: 'width', sorting: true },
        { label: this.translocoService.translate('roll_length'), key: 'roll_length', sorting: true },
        { label: this.translocoService.translate('loom_number'), key: 'loom_number', sorting: true },
        { label: this.translocoService.translate('status'), key: 'status_of_roll', sorting: true },
        { label: this.translocoService.translate('data_status'), key: 'data_status', sorting: true }
      ],
      // 2 Inspection Details
      [
        { label: this.translocoService.translate('master_start_datetime'), key: 'master_start_datetime', sorting: true },
        { label: this.translocoService.translate('start_time'), key: 'master_start_time', sorting: true },
        { label: this.translocoService.translate('master_end_datetime'), key: 'master_end_datetime', sorting: true },
        { label: this.translocoService.translate('end_time'), key: 'master_end_time', sorting: true },
        { label: this.translocoService.translate('inspected_length'), key: 'inspected_length_m', sorting: true },
        { label: this.translocoService.translate('total_inspection_time'), key: 'total_inspection_time_min', sorting: true },
        { label: this.translocoService.translate('master_machine'), key: 'master_machine_id', sorting: true },
        { label: this.translocoService.translate('corrected_avg_master_speed'), key: 'corrected_avg_master_speed', sorting: true },
        { label: this.translocoService.translate('avg_inspection_speed'), key: 'average_master_speed_mpm', sorting: true },
        { label: this.translocoService.translate('total_defects'), key: 'total_defects_inspected', sorting: true },
        { label: this.translocoService.translate('avg_defects_per_1000_meter'), key: 'avg_defects_per_1000_meter', sorting: true }
      ],
      // 3 Review Details
      [
        { label: this.translocoService.translate('review_start_datetime'), key: 'review_start_datetime', sorting: true },
        { label: this.translocoService.translate('review_start_time'), key: 'review_start_time', sorting: true },
        { label: this.translocoService.translate('review_end_datetime'), key: 'review_end_datetime', sorting: true },
        { label: this.translocoService.translate('review_end_time'), key: 'review_end_time', sorting: true },
        { label: this.translocoService.translate('total_review_time'), key: 'total_review_time_min', sorting: true },
        { label: this.translocoService.translate('total_defect_deleted'), key: 'total_defects_deleted_during_review', sorting: true },
        { label: this.translocoService.translate('review_agent_feedback_count'), key: 'review_agent_feedback_count', sorting: true }
      ],
      // 4 Repair Details
      [
        { label: this.translocoService.translate('repair_machine_id'), key: 'repair_machine_id', sorting: true },
        { label: this.translocoService.translate('repair_start_datetime'), key: 'repair_start_datetime', sorting: true },
        { label: this.translocoService.translate('repair_start_time'), key: 'repair_start_time', sorting: true },
        { label: this.translocoService.translate('repair_end_datetime'), key: 'repair_end_datetime', sorting: true },
        { label: this.translocoService.translate('repair_end_time'), key: 'repair_end_time', sorting: true },
        { label: this.translocoService.translate('total_repair_time'), key: 'repair_time_taken_min', sorting: true },
        { label: this.translocoService.translate('repair_meter'), key: 'repair_meter', sorting: true },
        { label: this.translocoService.translate('avg_repair_speed'), key: 'average_repair_speed_mpm', sorting: true },
        { label: this.translocoService.translate('total_defect_approved'), key: 'total_defects_approved_for_repair', sorting: true },
        { label: this.translocoService.translate('total_defect_repaired'), key: 'defects_actually_repaired', sorting: true },
        { label: this.translocoService.translate('total_override'), key: 'defects_actually_override', sorting: true },
        { label: this.translocoService.translate('total_defects_splice'), key: 'number_of_splices_done', sorting: true },
        { label: this.translocoService.translate('length_removed_splicing'), key: 'length_removed_during_splicing_m', sorting: true }
      ],
      // 5 Defect Summary
      [
        { label: this.translocoService.translate('category_wise_defect_count'), key: 'category_wise_defect_count', sorting: false },
        { label: this.translocoService.translate('enable_defects'), key: 'enable_defects', sorting: true },
        { label: this.translocoService.translate('disable_defects'), key: 'disable_defects', sorting: true }
      ],
      // 6 Body Details
      [
        { label: this.translocoService.translate('primary_body'), key: 'primary_body', sorting: true },
        { label: this.translocoService.translate('secondary_body'), key: 'secondary_body', sorting: true },
        { label: this.translocoService.translate('tertiary_body'), key: 'tertiary_body', sorting: true },
        { label: this.translocoService.translate('wastage_information'), key: 'wastage_information', sorting: true }
      ],
      // 7 Loom Report Data
      [
        { label: this.translocoService.translate('loom_id'), key: 'loom_id', sorting: false },
        { label: this.translocoService.translate('total_rolls'), key: 'total_rolls', sorting: false },
        { label: this.translocoService.translate('total_length'), key: 'total_length', sorting: false },
        { label: this.translocoService.translate('total_defects'), key: 'total_defects', sorting: false },
        { label: this.translocoService.translate('total_wastage_kg'), key: 'total_wastage_kg', sorting: false },
        { label: this.translocoService.translate('category_wise_defect_count'), key: 'category_wise_defect_count', sorting: false }
      ],
      // 8 Defect Details Info
      [
        { label: this.translocoService.translate('defect_type'), key: 'defect_type', sorting:false },
        { label: this.translocoService.translate('location_x'), key: 'location_x', sorting:false },
        { label: this.translocoService.translate('location_y'), key: 'location_y', sorting:false },
        { label: this.translocoService.translate('width_mm'), key: 'width_mm', sorting:false },
        { label: this.translocoService.translate('height_mm'), key: 'height_mm', sorting:false },
        { label: this.translocoService.translate('operator_action'), key: 'operator_action', sorting:false }
      ],
      // 9 Usage Report Data
      [
        { label: this.translocoService.translate('date'), key: 'date', sorting:false },
        { label: this.translocoService.translate('machine_id'), key: 'machine_id', sorting:false },
        { label: this.translocoService.translate('machine_on_hours'), key: 'machine_on_hours', sorting:false },
        { label: this.translocoService.translate('machine_off_hours'), key: 'machine_off_hours', sorting:false },
        { label: this.translocoService.translate('engaged_hours'), key: 'engaged_hours', sorting:false },
        { label: this.translocoService.translate('average_speed_mpm'), key: 'average_speed_mpm', sorting:false }
      ]
    ];
  }

  preventSpace(event: KeyboardEvent): void {
    event.preventDefault();
  }
  preventNonNumeric(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (!/^\d$/.test(event.key) && !allowedKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  // get getModuleVisibility
  getModuleVisibilityApi(moduleId, roleId, type) {

    this.RollsService.getModuleVisibility().pipe(
      tap(response => {
        this.moduleVisibility = response?.data || [];
          if(moduleId && type){
          this.UserService.rolePermissions = response?.data
        }
        // Convert data into a map for quick lookup
        this.moduleVisibilityMap = {};
        Object.keys(this.moduleVisibility).forEach(roleId => {
          this.moduleVisibilityMap[+roleId] = new Set(
            this.moduleVisibility[roleId].map(item => item.module_id)
          );
        });
          if(moduleId && type) this._apiComponent.callNavbarPermission();
          // To Show Supervisor as default;
          this.selectedRole = roleId;
          this.setCheckedModulesForRole(roleId)
      }),
      catchError(error => {
        console.error('Error fetching modules visibility:', error);
        this.toastr.error('Failed to fetch module visibility. Please try again.', 'Error');
        return of([]); // Prevents observable from breaking
      }),
    ).subscribe();
  }
  // add and remove role and module

  onCheckboxChange(event: Event, moduleId: number, roleId: number) {
    const isChecked = (event.target as HTMLInputElement).checked;

    if (!this.selectedRole) {
      this.toastr.warning(this.translocoService.translate('please_select_role_first'), this.translocoService.translate('warning'));
      (event.target as HTMLInputElement).checked = false;
      event.preventDefault();
      return;
    }
    if(!this.moduleVisiblityStatus && ((event.target as HTMLInputElement).checked))
    {
       this.toastr.warning(this.translocoService.translate('no_permission_change_module_visibility'), this.translocoService.translate('warning'));
       (event.target as HTMLInputElement).checked = false;
      return;
    }
    if (!this.moduleVisiblityStatus) {
      this.toastr.warning(this.translocoService.translate('no_permission_change_module_visibility'), this.translocoService.translate('warning'));
      (event.target as HTMLInputElement).checked = true;
      event.preventDefault();
      return;
    }
    this.checkedModules[moduleId] = isChecked;
    if (isChecked) {
      const payload =
      {
        role_id: roleId,
        module_id: moduleId
      }
      this.RollsService.addModuleVisibility(payload).pipe(
        tap(response => {
          if (response?.status) {
            // added activity log
            const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 4 && item.module_id === 7);
            if (activityObject) {
              this.commonService.addActivityLog(activityObject)
            }
            this.getModuleVisibilityApi(moduleId,roleId, "add")
          } else {
            console.error('Something went wrong...!!', 'Error');
          }
        }),
        catchError(error => {
          console.error('Error update:', error);
          return of(null); // Prevents observable from breaking
        })
      ).subscribe();
    }
    else {
      const payload =
      {
        role_id: roleId,
        module_id: moduleId
      }
      this.RollsService.removeModuleVisibility(payload).pipe(
        tap(response => {
          if (response?.status) {
            // added activity log
            if(this.module_id === moduleId)
            {
              this.getAllRoleFeaturePermission(moduleId, this.loggedInRole);
            }
            const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 4 && item.module_id === 7);
            if (activityObject) {
              this.commonService.addActivityLog(activityObject)
            }
            this.getModuleVisibilityApi(moduleId,roleId, "remove");
          } else {
            console.error('Something went wrong...!!', 'Error');
          }
        }),
        catchError(error => {
          console.error('Error update:', error);
          return of(null); // Prevents observable from breaking
        })
      ).subscribe();
    }
  }
  openDeleteModal(id: number) {
    this.showDeleteModal = true;
    this.deleteTagId = id;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.deleteTagId = null;
  }

  openDeleteModalforPdf(id: number){
    this.showDeleteModalforPdf = true;
    this.deletePdfById = id;
  }
  closeDeleteModalforPdf() {
    this.showDeleteModalforPdf = false;
    this.deletePdfById = null;
  }
  openDeleteModalforQualitylist(id: number){
    this.showDeleteModalforQualitylist = true;
    this.deleteQualitycodeById = id;
  }
  closeDeleteModalforQualitylist() {
    this.showDeleteModalforQualitylist = false;
    this.deleteQualitycodeById = null;
  }

  openDeleteModalforProductionReport(configName: any){
    this.showDeleteModalforProductionReport = true;
    this.originalConfigName = configName;
  }
  closeDeleteModalforProductionReport() {
    this.showDeleteModalforProductionReport = false;
    this.originalConfigName = null;
  }

  openEditmodal(name) {
    if(!this.moduleVisiblityStatus)
    {
      this.toastr.warning(this.translocoService.translate('no_permission_edit_module_visibility'), this.translocoService.translate('warning'));
      return;
    }
    this.module_name = name
    this.showEditModal=true;
  }

  closeEditmodal() {
    this.module_name = ''
    this.showEditModal = false;
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.showPdfList = false;
    this.showList = false;
    this.showDefectGradingList = false;
  }

  toggleView() {
    this.showList = !this.showList;
    this.qualityCodeAddEditForm.reset();
    this.addEditBtnQualitycode='Add';
  }

  toggleMachine() {
    this.showList = !this.showList;
    this.Form.reset();
    this.addEditBtnMachineConfig='Add';
  }

  toggleInspectionMachine(){
    this.showList = !this.showList;
    if(this.selectedConfigTab === 'repair_machine_config'){
      this.Form.reset();
      this.addEditBtnMachineConfig='Add';
    }
    else{
      this.inspectionForm.reset();
      this.addEditBtnInspectionMachineConfig='Add';
    }
  }
  togglePdfView(type:any) {
    this.editPdfMode = !this.editPdfMode;
    this.showPdfList = !this.showPdfList;
    this.pdfAddEditForm.reset({
      country_code_selection: '+91',
      custom_country_code: ''
    });
    if(type === 'add'){
      this.addEditBtn='Add';
      this.reportConfigurationForm.patchValue({
        configName: '', 
        frequency: 1,
        targetEmails: '',
        machineIds: [],
        repairMachineId: '',
        days: '',
        time: '',
        hour: '',
        minute: '',
        rollsStatus: '',
        columnName: [],
        dataStatus: '',
        recipe: '',
        userTag: '',
      });
      this.emails = [];
    }
    else
    this.addEditBtn='Edit';
  }

  getUserTagList(): void {
    this.isLoading = true; // Start loading state

    this.RollsService.getUserTagList().pipe(
      tap(response => {
        this.userTags = response?.data || []; // Ensure fallback for undefined data
      }),
      catchError(error => {
        console.error('Error fetching tags:', error);
        this.toastr.error('Failed to fetch tags. Please try again.', 'Error');
        return of([]); // Prevents observable from breaking & returns empty array
      }),
      tap(() => this.isLoading = false) // Stop loading state
    ).subscribe();
  }

  getrole(): void {
    this.isLoading = true; // Start loading state

    this.RollsService.getrole().pipe(
      tap(response => {
        this.roles = response?.data || []; // Ensure fallback for undefined data
        this.roles = this.roles.filter(item => item.role_id !== 1)
      }),
      catchError(error => {
        console.error('Error fetching roles:', error);
        this.toastr.error('Failed to fetch roles. Please try again.', 'Error');
        return of([]); // Prevents observable from breaking & returns empty array
      }),
      tap(() => this.isLoading = false) // Stop loading state
    ).subscribe();
  }

  getAllModules(): void {
    this.isLoading = true; // Start loading state

    this.RollsService.getAllModules().pipe(
      tap(response => {
        this.modules = response?.data || []; // Ensure fallback for undefined data
        if(this.modules.length>0){
          this.modules.forEach(item =>{
            if(item.module_name === 'rolls'){
              item.icon = `home`
            }else if(item.module_name === 'review' || item.module_name === 'repair'){
              item.icon = `pie_chart`
            }else if(item.module_name === 'roll width'){
              item.icon = `receipt_long`
            }else if(item.module_name === 'model'){
              item.icon = `inventory`
            }else if(item.module_name === 'setting'){
              item.icon = `settings`
            }else if(item.module_name === 'roll details'){
              item.icon = `import_contacts`
            }else{
              
            }

          })
        }
      }),
      catchError(error => {
        console.error('Error fetching Modules:', error);
        this.toastr.error('Failed to fetch Modules. Please try again.', 'Error');
        return of([]); // Prevents observable from breaking & returns empty array
      }),
      tap(() => this.isLoading = false) // Stop loading state
    ).subscribe();
  }

  getFeatures(module_id): void {
    this.isLoading = true; // Start loading state
    this.RollsService.getFeatures(module_id).pipe(
      tap(response => {
        this.features = response?.data || []; // Ensure fallback for undefined 
        this.permissionModuleId = module_id; // Set the module ID for permissions
        this.getAllFeaturePermission(module_id, this.selectedRole);
      }),
      catchError(error => {
        console.error('Error fetching Modules:', error);
        this.toastr.error('Failed to fetch Modules. Please try again.', 'Error');
        return of([]); // Prevents observable from breaking & returns empty array
      }),
      tap(() => this.isLoading = false) // Stop loading state
    ).subscribe();
  }

  getAllFeaturePermission(module_id,role_id):void{
    this.isLoading = true; // Start loading state
    const payload = { module_id,role_id}
    this.RollsService.getAllFeaturePermission(payload).pipe(
      tap(response => {
        this.featurePermissions = response?.data || []; // Ensure fallback for undefined data
        this.setCheckedFeaturesForModule(module_id);
      }),
      catchError(error => {
        console.error('Error fetching Modules:', error);
        this.toastr.error('Failed to fetch Modules. Please try again.', 'Error');
        return of([]); // Prevents observable from breaking & returns empty array
      }),
      tap(() => this.isLoading = false) // Stop loading state
    ).subscribe();

  }

  addUserTag(): void {
    if (!this.newTagName) return;

    const payload = { tag_name: this.newTagName };

    this.RollsService.addUserTag(payload).pipe(
      tap(response => {
        if (response?.status) {
          // added activity log
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 1 && item.module_id === 7);
          if (activityObject) {
            this.commonService.addActivityLog(activityObject)
          }
          this.toastr.success(response.message, this.translocoService.translate('success_exclamation'));
          this.closeDeleteModal();
          this.newTagName = '';
          this.getUserTagList();
        } else {
          this.toastr.error(this.translocoService.translate('something_went_wrong'), this.translocoService.translate('error'));
        }
      }),
      catchError(error => {
        console.error('Error adding tag:', error);
        this.toastr.error(error.error.message, this.translocoService.translate('error'));
        return of(null); // Prevents observable from breaking
      })
    ).subscribe();
  }

  deleteUserTag(): void {
    if (!this.deleteTagId) return; // Prevents calling API if ID is missing
    this.newTagName = '';
    this.editMode = false;
    this.RollsService.deleteUserTag(this.deleteTagId).pipe(
      tap(response => {
        if (response?.status) {
          // added activity log
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 3 && item.module_id === 7);
          if (activityObject) {
            this.commonService.addActivityLog(activityObject)
          }
          this.toastr.success(response.message, this.translocoService.translate('success_exclamation'));
          this.closeDeleteModal();
          this.getUserTagList(); // Refresh only on success
        } else {
          this.toastr.error(this.translocoService.translate('something_went_wrong'), this.translocoService.translate('error'));
        }
      }),
      catchError(error => {
        console.error('Error deleting tag:', error);
        this.toastr.error(this.translocoService.translate('failed_fetch_tags'), this.translocoService.translate('error'));
        return of(null); // Prevents observable from breaking
      })
    ).subscribe();
  }

  editUserTag(tag: any) {
    this.editTagId = tag.user_tag_id;
    this.editMode = true;
    this.newTagName = tag.tag_name;
  }

  updateUserTag(): void {
    if (!this.newTagName) return;

    const payload = { user_tag_id: this.editTagId, tag_name: this.newTagName };

    this.RollsService.updateUserTag(payload).pipe(
      tap(response => {
        if (response?.status) {
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 2 && item.module_id === 7);
          if(activityObject){
            this.commonService.addActivityLog(activityObject)
          }
          this.toastr.success(response.message, this.translocoService.translate('success_exclamation'));
          this.closeDeleteModal();
          this.newTagName = '';
          this.editMode = false;
          this.getUserTagList();
        } else {
          this.toastr.error(this.translocoService.translate('something_went_wrong'), this.translocoService.translate('error'));
        }
      }),
      catchError(error => {
        console.error('Error update tag:', error);
        this.toastr.error(this.translocoService.translate('error_occurred_try_again'), this.translocoService.translate('error'));
        return of(null); // Prevents observable from breaking
      })
    ).subscribe();
  }

  //-------Pdf Configs Start-------------
  get selectedCountryCode(): string {
    const selectedCode = this.pdfAddEditForm.get('country_code_selection')?.value;
    const customCode = this.pdfAddEditForm.get('custom_country_code')?.value?.trim();
    return selectedCode === 'custom' ? customCode : selectedCode;
  }

  get selectedCountryCodeDisplay(): string {
    const selectedCode = this.pdfAddEditForm.get('country_code_selection')?.value;
    return selectedCode === 'custom' ? 'Other' : selectedCode;
  }

  normalizeMobileList(mobileData: any): any[] {
    if (!mobileData) {
      return [];
    }

    const parsedMobileData = Array.isArray(mobileData) ? mobileData : [mobileData];

    return parsedMobileData
      .map((mobile) => {
        if (mobile && typeof mobile === 'object') {
          const code = mobile.code || mobile.country_code || '';
          const number = mobile.number || mobile.mobile_number || '';
          return {
            country: mobile.country || 'Custom',
            code,
            number,
            full_number: mobile.full_number || `${code}${number}`
          };
        }

        if (typeof mobile === 'string') {
          return {
            country: 'Custom',
            code: '',
            number: mobile.replace(/^\+/, ''),
            full_number: mobile
          };
        }

        return null;
      })
      .filter((mobile) => mobile && mobile.full_number);
  }

  getMobileChipLabel(mobile: any): string {
    if (typeof mobile === 'string') {
      return mobile;
    }

    return mobile?.full_number || `${mobile?.code || ''}${mobile?.number || ''}`;
  }

  onCountryCodeSelectionChange() {
    const customCountryCodeControl = this.pdfAddEditForm.get('custom_country_code');
    if (this.pdfAddEditForm.get('country_code_selection')?.value !== 'custom') {
      customCountryCodeControl?.setValue('');
      customCountryCodeControl?.setErrors(null);
    }
  }

  toggleCountryCodeDropdown() {
    this.countryCodeDropdownOpen = !this.countryCodeDropdownOpen;
  }

  selectCountryCodeOption(optionValue: string) {
    this.pdfAddEditForm.get('country_code_selection')?.setValue(optionValue);
    this.countryCodeDropdownOpen = false;
    this.onCountryCodeSelectionChange();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.country-code-dropdown')) {
      this.countryCodeDropdownOpen = false;
    }
  }

  addPdfSave() {
    const sharingType = this.pdfAddEditForm.get('sharing_configuration_type')?.value;

    this.mobileListError = false;
    this.emailListError = false;

    // SMS selected but no mobile added
    if (sharingType === 'sms' && this.mobileList.length === 0) {
      this.mobileListError = true;
      return;
    }

    // Email selected but no email added
    if (sharingType === 'email' && this.emailList.length === 0) {
      this.emailListError = true;
      return;
    }

  
    if (this.pdfAddEditForm.invalid) {
      this.pdfAddEditForm.markAllAsTouched(); // Mark all fields as touched to trigger validation messages
      return; // Stop execution if form is invalid
    }

    // Create FormData to send file and other form data
    const formData = new FormData();
    formData.append("pdf_config_name", this.pdfAddEditForm.get('configName')?.value || '');
    formData.append("only_map", this.pdfAddEditForm.get('onlyMap')?.value ? '1' : '0');
    formData.append("defect_type_filter", this.pdfAddEditForm.get('defectType')?.value ? '1' : '0');
    formData.append("defect_status_filter", this.pdfAddEditForm.get('defectStatus')?.value ? '1' : '0');
    formData.append("defect_info_filter", this.pdfAddEditForm.get('defectInfo')?.value ? '1' : '0');
    formData.append("defect_id_reset", this.pdfAddEditForm.get('defectIdReset')?.value ? '1' : '0');
    formData.append("ai_suggestion",this.pdfAddEditForm.get('aiSuggestion')?.value ? '1' : '0');
    formData.append("location_filter", this.pdfAddEditForm.get('locationFilter')?.value ? '1' : '0');
    formData.append("status", '0');
    formData.append("sharing_configuration_type", this.pdfAddEditForm.get('sharing_configuration_type')?.value || '');
    formData.append("mobile_number", this.pdfAddEditForm.get('sharing_configuration_type')?.value === 'sms' ? JSON.stringify(this.mobileList) : null);
    formData.append("target_emails", this.pdfAddEditForm.get('sharing_configuration_type')?.value === 'email' ? JSON.stringify(this.emailList) : null);

    // Append file to FormData
    const file = this.pdfAddEditForm.get('logoImage')?.value;
    if (file) {
      formData.append("logo", file);
    }

    // Send FormData to API
    this.RollsService.addPdfGenerationConfig(formData).subscribe({
      next: (res) => {
        if (res && res.message) {
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 5 && item.module_id === 7);
          if(activityObject){
            this.commonService.addActivityLog(activityObject)
          }
          this.toastr.success(res.message, this.translocoService.translate('success'));
          this.getAllPdfGenerationConfigs();
          this.showPdfList = false;
          this.pdfAddEditForm.reset({
            country_code_selection: '+91',
            custom_country_code: ''
          });
        } else {
          this.toastr.error(res.message || this.translocoService.translate('something_went_wrong'), this.translocoService.translate('error'));
        }
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Upload failed';
        this.toastr.error(errorMessage, this.translocoService.translate('error'));
        console.error(err);
      }
    });
  }

 onFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;

    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const fileType = file.type;
      const fileSize = file.size;

      // Check file type (allow only PNG or JPG)
      const validTypes = ['image/png', 'image/jpeg'];
      if (!validTypes.includes(fileType)) {
        this.pdfAddEditForm.get('logoImage')?.setErrors({ invalidType: true });
        // alert('Only PNG or JPG images are allowed.');
        return;
      }

      // Check file size (max 25KB)
      const maxSizeInBytes = 25 * 1024;
      if (fileSize > maxSizeInBytes) {
        this.pdfAddEditForm.get('logoImage')?.setErrors({ maxSizeExceeded: true });
        // alert('File size should not exceed 25KB.');
        return;
      }

      // If valid, patch the file to the form control
      this.pdfAddEditForm.patchValue({ logoImage: file });
      this.pdfAddEditForm.get('logoImage')?.updateValueAndValidity();
    }
  }

  getAllPdfGenerationConfigs() {
    this.isLoading = true;
    const userId = localStorage.getItem('user_id');

    this.RollsService.getAllPdfGenerationConfigs().pipe(
      tap(response => {
        if (response?.status) {
          this.getAllPdfLists = response.data || [];
        } else {
          console.error('Error from API:', response.message);
        }
      }),
      catchError(error => {
        console.error('HTTP Error fetching PDFs:', error);
        this.toastr.error(this.translocoService.translate('failed_fetch_modules'), this.translocoService.translate('error'));
        return of([]);
      }),
      tap(() => this.isLoading = false)
    ).subscribe();
  }

  deletePdfGenerationConfig() {
    if (!this.deletePdfById) return; // Prevents calling API if ID is missing
    this.RollsService.deletePdfGenerationConfig(this.deletePdfById).pipe(
      tap(response => {
        if (response?.status) {
          // added activity log
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 7 && item.module_id === 7);
          if (activityObject) {
            this.commonService.addActivityLog(activityObject)
          }
          this.toastr.success(response.message, this.translocoService.translate('success_exclamation'));
          this.closeDeleteModalforPdf();
          this.getAllPdfGenerationConfigs(); // Refresh only on success
        } else {
          this.toastr.error(this.translocoService.translate('something_went_wrong'), this.translocoService.translate('error'));
        }
      }),
      catchError(error => {
        console.error('Error deleting pdf config:', error);
        this.toastr.error(this.translocoService.translate('error_occurred_try_again'), this.translocoService.translate('error'));
        return of(null); // Prevents observable from breaking
      })
    ).subscribe();

  }


  pdfConfigEdit(data:any){
    this.addEditBtn = 'Edit';
    this.showPdfList=true;
    this.pdfAddEditForm.patchValue({
      configName: data.pdf_config_name || "",
      onlyMap: data.only_map || "",
      defectStatus: data.defect_status_filter || "",
      defectInfo: data.defect_info_filter || "",
      defectType: data.defect_type_filter || "",
      defectIdReset: data.defect_id_reset || "",
      aiSuggestion: data.ai_suggestion || "",
      locationFilter: data.location_filter || "",
      id : data.id ,
      sharing_configuration_type: data.sharing_configuration_type || '', 
      // mobile_number: data.mobile_number || '',
      // target_emails: data.target_emails || '',
    });
    if (data.target_emails) {
      if (Array.isArray(data.target_emails)) {
        this.emailList = data.target_emails;
      } 
      else if (typeof data.target_emails === 'string') {
        this.emailList = data.target_emails.split(',');
      } 
      else {
        this.emailList = [];
      }

    } else {
      this.emailList = [];
    }
    if (data.mobile_number) {
      if (Array.isArray(data.mobile_number)) {
        this.mobileList = this.normalizeMobileList(data.mobile_number);
      } 
      else if (typeof data.mobile_number === 'string') {
        try {
          this.mobileList = this.normalizeMobileList(JSON.parse(data.mobile_number));
        } catch {
          this.mobileList = this.normalizeMobileList(data.mobile_number.split(','));
        }
      } 
      else {
        this.mobileList = [];
      }

    } else {
      this.mobileList = [];
    }
  }

  EditPdfSave(){
    const sharingType = this.pdfAddEditForm.get('sharing_configuration_type')?.value;

    this.mobileListError = false;
    this.emailListError = false;

    // SMS selected but no mobile added
    if (sharingType === 'sms' && this.mobileList.length === 0) {
      this.mobileListError = true;
      return;
    }

    // Email selected but no email added
    if (sharingType === 'email' && this.emailList.length === 0) {
      this.emailListError = true;
      return;
    }
    const formData = new FormData();
    formData.append("id", this.pdfAddEditForm.get('id')?.value || '');
    formData.append("pdf_config_name", this.pdfAddEditForm.get('configName')?.value || '');
    formData.append("only_map", this.pdfAddEditForm.get('onlyMap')?.value ? '1' : '0');
    formData.append("defect_type_filter", this.pdfAddEditForm.get('defectType')?.value ? '1' : '0');
    formData.append("defect_status_filter", this.pdfAddEditForm.get('defectStatus')?.value ? '1' : '0');
    formData.append("defect_info_filter", this.pdfAddEditForm.get('defectInfo')?.value ? '1' : '0');
    formData.append("defect_id_reset", this.pdfAddEditForm.get('defectIdReset')?.value ? '1' : '0');
    formData.append("ai_suggestion", this.pdfAddEditForm.get('aiSuggestion')?.value ? '1' : '0');
    formData.append("location_filter", this.pdfAddEditForm.get('locationFilter')?.value ? '1' : '0');
    formData.append("status", '0');
    formData.append("sharing_configuration_type", this.pdfAddEditForm.get('sharing_configuration_type')?.value || '');
    formData.append("mobile_number", this.pdfAddEditForm.get('sharing_configuration_type')?.value === 'sms' ? JSON.stringify(this.mobileList) : null);
    formData.append("target_emails", this.pdfAddEditForm.get('sharing_configuration_type')?.value === 'email' ? JSON.stringify(this.emailList) : null);

    // Append file to FormData
    const file = this.pdfAddEditForm.get('logoImage')?.value;
    if (file) {
      formData.append("logo", file);
    }

    this.RollsService.updatePdfGenerationConfig(formData).subscribe({
      next: (res) => {
        if (res && res.message) {
          // added activity log
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 6 && item.module_id === 7);
          if (activityObject) {
            this.commonService.addActivityLog(activityObject)
          }
          this.toastr.success(res.message, this.translocoService.translate('success'));
          this.getAllPdfGenerationConfigs();
          // this.modalService.dismissAll();
          this.showPdfList=false;
          this.pdfAddEditForm.reset({
            country_code_selection: '+91',
            custom_country_code: ''
          });
        } else {
          if (res.message) {
            this.toastr.error(res.message, this.translocoService.translate('error'));
          }
        }
      },
      error: (err) => {
        if (err.message) {
          this.toastr.error(err.message, this.translocoService.translate('error'));
        } else {
          console.log(err);
        }
      }
    })

  }

  cancleAddPdf(){
    this.showPdfList = false;
    this.currentSortColumn = '';
  }

  //-------Pdf Configs End-------------


  //-------Quality code Configs Start-------------
  addQualityCodeSave(){

    if (this.qualityCodeAddEditForm.invalid) {
      this.qualityCodeAddEditForm.markAllAsTouched(); // Mark all fields as touched to trigger validation messages
      return; // Stop execution if form is invalid
    }
    if(this.qualityCodeAddEditForm.valid){
      const payload={
        "quality_code":  this.qualityCodeAddEditForm.get('quality_code')?.value || '',
        "status":1,
        "filter_value_json":{
          "roll_width": {
            "min": this.qualityCodeAddEditForm.get('min_tolerance')?.value || '',
            "max": this.qualityCodeAddEditForm.get('max_tolerance')?.value || '',
          },
          "ai_filter": {
            "ai_agent": this.qualityCodeAddEditForm.get('model_id')?.value || '',
            "defect_type": this.qualityCodeAddEditForm.get('defect_type')?.value || '',
          },
          "size_filter": {
            "defect_size_unit": this.qualityCodeAddEditForm.get('defect_size')?.value || '',
            "min_value": this.qualityCodeAddEditForm.get('defect_size1')?.value || '',
            "max_value": this.qualityCodeAddEditForm.get('defect_size2')?.value || '',
          }
        }
      }
      this.RollsService.addQualityCode(payload).subscribe({
        next: (res) => {
          if (res && res.message) {
            // added activity log
            const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 8 && item.module_id === 7);
            if (activityObject) {
              this.commonService.addActivityLog(activityObject)
            }
            this.toastr.success(res.message, this.translocoService.translate('success'));
            this.getAllQualityCodes();
            this.showList = false;
            this.qualityCodeAddEditForm.reset();
          } else {
            this.toastr.error(res.message || this.translocoService.translate('something_went_wrong'), this.translocoService.translate('error'));
          }
        },
        error: (err) => {
          this.toastr.error(err.message || 'Upload failed', this.translocoService.translate('error'));
          console.error(err);
        }
      });



    }else{
      this.qualityCodeAddEditForm.markAllAsTouched()
      console.error("validation error");
    }
  }

  qualityCodeEdit(data:any){
    this.addEditBtnQualitycode = 'Edit';
    this.showList=true;
    if(data.filter_value_json.size_filter.defect_size_unit && data.filter_value_json.size_filter.defect_size_unit === '<>')
    {
      this.showBothInputs = true;
    }
    this.qualityCodeAddEditForm.patchValue({
      quality_code: data.quality_code || "",
      min_tolerance: data.filter_value_json.roll_width.min || "",
      max_tolerance: data.filter_value_json.roll_width.max || "",
      model_id: data.filter_value_json.ai_filter.ai_agent || "",
      defect_type: data.filter_value_json.ai_filter.defect_type || "",
      defect_size: data.filter_value_json.size_filter.defect_size_unit || "",
      defect_size1: data.filter_value_json.size_filter.min_value || "",
      defect_size2: data.filter_value_json.size_filter.max_value || "",
      quality_code_id:data.quality_code_id

    });
  }

  getAllQualityCodes() {
    this.isLoading = true;
    const userId = localStorage.getItem('user_id');

    this.RollsService.getAllQualityCodes().pipe(
      tap(response => {
        if (response?.status) {
          this.getAllQualityLists = response.data || [];
        } else {
          console.error('Error from API:', response.message);
        }
      }),
      catchError(error => {
        console.error('HTTP Error fetching quality list:', error);
        this.toastr.error(this.translocoService.translate('failed_fetch_modules'), this.translocoService.translate('error'));
        return of([]);
      }),
      tap(() => this.isLoading = false)
    ).subscribe();
  }

  deleteQualityCode() {
    if (!this.deleteQualitycodeById) return; // Prevents calling API if ID is missing
    this.RollsService.deleteQualityCode(this.deleteQualitycodeById).pipe(
      tap(response => {
        if (response?.status) {
          // added activity log
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 10 && item.module_id === 7);
          if (activityObject) {
            this.commonService.addActivityLog(activityObject)
          }
          this.toastr.success(response.message, this.translocoService.translate('success_exclamation'));
          this.closeDeleteModalforQualitylist();
          this.getAllQualityCodes(); // Refresh only on success
        } else {
          this.toastr.error(this.translocoService.translate('something_went_wrong'), this.translocoService.translate('error'));
        }
      }),
      catchError(error => {
        console.error('Error deleting quality code:', error);
        this.toastr.error(this.translocoService.translate('error_occurred_try_again'), this.translocoService.translate('error'));
        return of(null); // Prevents observable from breaking
      })
    ).subscribe();

  }

  EditQualityCodeSave() {
    const update = {
      "quality_code_id": this.qualityCodeAddEditForm.get('quality_code_id')?.value || '',
      "quality_code": this.qualityCodeAddEditForm.get('quality_code')?.value || '',
      "status": 0,
      "filter_value_json": {
        "roll_width": {
          "min": this.qualityCodeAddEditForm.get('min_tolerance')?.value || '',
          "max": this.qualityCodeAddEditForm.get('max_tolerance')?.value || '',
        },
        "ai_filter": {
          "ai_agent": this.qualityCodeAddEditForm.get('model_id')?.value || '',
          "defect_type": this.qualityCodeAddEditForm.get('defect_type')?.value || '',
        },
        "size_filter": {
          "defect_size_unit": this.qualityCodeAddEditForm.get('defect_size')?.value || '',
          "min_value": this.qualityCodeAddEditForm.get('defect_size1')?.value || '',
          "max_value": this.qualityCodeAddEditForm.get('defect_size2')?.value || '',
        }
      }
    };


    this.RollsService.updateQualityCode(update).subscribe({
      next: (res) => {
        if (res && res.message) {
          // added activity log
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 9 && item.module_id === 7);
          if (activityObject) {
            this.commonService.addActivityLog(activityObject)
          }
          this.toastr.success(res.message, this.translocoService.translate('success'));
          this.getAllQualityCodes();
          // this.modalService.dismissAll();
          this.showList = false;
          this.qualityCodeAddEditForm.reset();
        } else {
          if (res.message) {
            this.toastr.error(res.message, this.translocoService.translate('error'));
          }
        }
      },
      error: (err) => {
        if (err.message) {
          this.toastr.error(err.message, this.translocoService.translate('error'));
        } else {
          console.log(err);
        }
      }
    })

  }

  cancleQualityCode(){
    this.showList = false;
  }

  onChangeValidationCheck(){
    // Disable and clear validators
    this.qualityCodeAddEditForm.get('min_tolerance')?.disable();
    this.qualityCodeAddEditForm.get('max_tolerance')?.disable();
    this.qualityCodeAddEditForm.get('min_tolerance')?.clearValidators();
    this.qualityCodeAddEditForm.get('max_tolerance')?.clearValidators();
  }

  onOptionSelected(selectedOption: string) {
    // Reset visibility variables
    this.showFirstInput = true;
    this.showBothInputs = false;

    // Clear input field values for all options
    this.qualityCodeAddEditForm.get('defect_size1').setValue(null);
    this.qualityCodeAddEditForm.get('defect_size2').setValue(null);

    if (selectedOption === '') {
      this.showFirstInput = false;
      // Reset validators for all options
      this.qualityCodeAddEditForm.get('defect_size1').clearValidators();
      this.qualityCodeAddEditForm.get('defect_size1').updateValueAndValidity();
      this.qualityCodeAddEditForm.get('defect_size2').clearValidators();
      this.qualityCodeAddEditForm.get('defect_size2').updateValueAndValidity();
    }
    // Set visibility based on the selected option
    if (selectedOption === '<=' || selectedOption === '>=') {
      this.showFirstInput = true;
      this.qualityCodeAddEditForm.get('defect_size1').setValidators([Validators.required]);
      this.qualityCodeAddEditForm.get('defect_size1').updateValueAndValidity();
      this.qualityCodeAddEditForm.get('defect_size2').clearValidators();
      this.qualityCodeAddEditForm.get('defect_size2').updateValueAndValidity();
    }
    else if (selectedOption === '<>') {
      this.showBothInputs = true;
      this.qualityCodeAddEditForm.get('defect_size1').setValidators([Validators.required]);
      this.qualityCodeAddEditForm.get('defect_size1').updateValueAndValidity();
      this.qualityCodeAddEditForm.get('defect_size2').setValidators([Validators.required, this.greaterThan('defect_size1')]);
      this.qualityCodeAddEditForm.get('defect_size2').updateValueAndValidity();
    }
  }

  greaterThan(controlName: string) {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const comparisonControl = control.root.get(controlName);

      if (comparisonControl?.value && control?.value && +control.value <= +comparisonControl.value) {
        return { 'lessThan': true };
      }

      return null;
    };
  }

  isFieldClicked(fieldName: string): boolean {
    const control = this.qualityCodeAddEditForm.get(fieldName);
    return this.clickedFields[fieldName] && control && control.value !== '';
  }

  onInputFieldClick(fieldName: string): void {
    this.clickedFields[fieldName] = true;
  }

  onKeyPress(event: KeyboardEvent): void {
    this.isTyping = true;
    const allowedChars = /[0-9.]/;
    const inputChar = String.fromCharCode(event.charCode);

    if (!allowedChars.test(inputChar)) {
      event.preventDefault();
    }
  }

  loadModel(data: any) {
    this.drop_down_status = false;
    this.dropdownList = [];
    this.all_defect_types.forEach((item: { id: number, defect_name: string }) => {
      this.dropdownList = this.dropdownList.concat({ item_id: item.id, item_text: item.defect_name });
    });
    if(data)
    {
      const selectedModelId = data;
      const selectedModelData = this.all_model_data.find((model: any) => model.model_id === selectedModelId);

      if (selectedModelData) {
        const model_data = {
          file_path: selectedModelData.name_file_path
        };
        this.RollsService.read_model_file(model_data).subscribe({
          next:
            (response) => {
              this.ai_suggestion_data = response.data

              if(!this.drop_down_status)
              {
                this.setDropDownData();
                this.drop_down_status = true;
              }
            },
          error: (err) => {
            console.error('Error:', err);
          }
        });
      }
    }

  }

  setDropDownData()
  {
    this.ai_suggestion_data.forEach((item: { id: string, defect_name: string }) => {
      this.dropdownList = this.dropdownList.concat({ item_id:item , item_text: item});
    });
  }
  private getAllModelList() {
    const data = { "kvp_backend_url": localStorage.getItem('kvp_backend_url') };

    this.RollsService.getAllModelList(data).subscribe({
      next: (response: any) => {
        this.all_model_data = response.data;
        if (this.all_model_data.length > 0) {
          this.qualityCodeAddEditForm.patchValue({
            model_id: response.data[0].model_id,
          });
        } else {
          this.dropdownList = [];
        }
      },
      error: (error: any) => {
        console.error('Error fetching data from the API', error);
      },
      complete: () => {
        // Optional: Handle completion logic if needed
      }
    });
  }


  onItemSelect(item: any) {
  }
  onSelectAll(items: any) {
  }


  private getAllDefectsbyRollId() {
    this.dropdownList = [];
    this.RollsService.totaldefect().subscribe({
      next: (response: any) => {
        this.all_defect_types = response.data;
      },
      error: (error: any) => {
        console.error('Error fetching data from the API', error);
      }
    });
  }


  setCheckedModulesForRole(roleId: number) {
    // Reset checkedModules
    this.checkedModules = {};
    if (this.moduleVisibility && this.moduleVisibility[roleId]) {
      this.moduleVisibility[roleId].forEach((item: { module_id: number }) => {
        this.checkedModules[item.module_id] = true;
      });
    }
  }
  setCheckedFeaturesForModule(moduleId: number) {
    // Reset checkedModules
    this.checkedFeatures = {};
    if (this.featurePermissions && this.featurePermissions[moduleId]) {
      this.featurePermissions[moduleId].forEach((item: { feature_list_id: number }) => {
        this.checkedFeatures[item.feature_list_id] = true;
      });
    }
  }
  onFeatureToggle(event: Event, featureId: number, roleId: number,feature_name: string){
    const isChecked = (event.target as HTMLInputElement).checked;
    this.checkedFeatures[featureId] = isChecked;
    if (isChecked) {
      const payload =
      {
        role_id: roleId,
        feature_list_id: featureId
      }
      this.RollsService.addFeaturePermission(payload).pipe(
        tap(response => {
          if (response?.status) {
            if (this.module_id == this.permissionModuleId) {
              this.getAllRoleFeaturePermission(this.module_id, this.loggedInRole);
            }
          } else {
            console.error(this.translocoService.translate('something_went_wrong'), this.translocoService.translate('error'));
          }
        }),
        catchError(error => {
          console.error('Error update:', error);
          return of(null); // Prevents observable from breaking
        })
      ).subscribe();
    }
    else {
      const payload =
      {
        role_id: roleId,
        feature_list_id: featureId
      }
      this.RollsService.removeFeaturePermission(payload).pipe(
        tap(response => {
          if (response?.status) {
             if (this.module_id == this.permissionModuleId){
              this.getAllRoleFeaturePermission(this.module_id, this.loggedInRole);
            }
            if(feature_name === 'Module Visiblity') {
              this.closeEditmodal();
              this.getAllRoleFeaturePermission(this.module_id, this.loggedInRole);
            }
          } else {
            console.error(this.translocoService.translate('something_went_wrong'), this.translocoService.translate('error'));
          }
        }),
        catchError(error => {
          console.error('Error update:', error);
          return of(null); // Prevents observable from breaking
        })
      ).subscribe();
    }
  }
updateStatusForPdfConfig(id:any,event:any){
const isCheck=event.target.checked
const payload={"id":id, "status":isCheck}
    this.RollsService.updatePdfConfigStatus(payload).subscribe({
      next: (res) => {
        if (res && res.message) {
          this.toastr.success(res.message, this.translocoService.translate('success'));
          this.getAllPdfGenerationConfigs();
          // this.modalService.dismissAll();
      this.showPdfList=false;
          this.pdfAddEditForm.reset();
        } else {
          if (res.message) {
            this.toastr.error(res.message, this.translocoService.translate('error'));
          } else {
          }
        }
      },
      error: (err) => {
        if (err.message) {
          this.toastr.error(err.message, this.translocoService.translate('error'));
        } else {
          console.log(err);
        }
      }
    })

  }
  getAllRoleFeaturePermission(module_id: number, role_id: number): void {
    const payload = { module_id, role_id };

    this.RollsService.getAllFeaturePermission(payload).pipe(
      tap(response => {
        this.roleFeaturePermissions = response?.data || [];
        this.setFeaturePermission(); // Call after roleFeaturePermissions is set
        this.cdr.detectChanges();
      }),
      catchError(error => {
        console.error('Error fetching feature permissions:', error);
        return of([]); // Prevent app crash on error
      })
    ).subscribe();
  }


  setFeaturePermission(): void {
    if (this.roleFeaturePermissions && Object.keys(this.roleFeaturePermissions).length > 0) {
      for (const key in this.roleFeaturePermissions) {
        const roleFeaturePermissionsData = this.roleFeaturePermissions[key]
        if (Array.isArray(roleFeaturePermissionsData) && roleFeaturePermissionsData.length > 0) {
          this.addCustomUserTagStatus = roleFeaturePermissionsData.some(data => data.feature_name === 'Add Custom User Tag');
          this.deleteCustomUserTagStatus = roleFeaturePermissionsData.some(data => data.feature_name === 'Delete Custom User Tag');
          this.moduleVisiblityStatus = roleFeaturePermissionsData.some(data => data.feature_name === 'Module Visiblity');
          this.addPdfGenerationConfigStatus = roleFeaturePermissionsData.some(data => data.feature_name === 'Add Pdf Generation Config');
          this.editPdfGenerationStatus = roleFeaturePermissionsData.some(data => data.feature_name === 'Edit Pdf Generation');
          this.deletePdfGenerationStatus = roleFeaturePermissionsData.some(data => data.feature_name === 'Delete Pdf Generation');
          this.addQualityCodeConfigStatus = roleFeaturePermissionsData.some(data => data.feature_name === 'Add Quality Code Config');
          this.editCustomUserTagStatus = roleFeaturePermissionsData.some(data => data.feature_name === 'Edit Custom User Tag');
          this.editQualityCodeConfigStatus = roleFeaturePermissionsData.some(data => data.feature_name === 'Edit Quality Code Config');
          this.deleteQualityCodeConfigStatus = roleFeaturePermissionsData.some(data => data.feature_name === 'Delete Quality Code Config');
          this.addInspectionMachineConfigStatus = roleFeaturePermissionsData.some(data => data.feature_name === 'Add Inspection Machine Config');
          this.editInspectionMachineConfigStatus = roleFeaturePermissionsData.some(data => data.feature_name === 'Edit Inspection Machine Config');
          this.deleteInspectionMachineConfigStatus = roleFeaturePermissionsData.some(data => data.feature_name === 'Delete Inspection Machine Config');
          this.addRepairMachineConfigStatus = roleFeaturePermissionsData.some(data => data.feature_name === 'Add Repair Machine Config');
          this.editRepairMachineConfigStatus = roleFeaturePermissionsData.some(data => data.feature_name === 'Edit Repair Machine Config');
          this.deleteRepairMachineConfigStatus = roleFeaturePermissionsData.some(data => data.feature_name === 'Delete Repair Machine Config');
          this.addProductionReportConfigStatus = roleFeaturePermissionsData.some(data => data.feature_name === 'Add Production Report Config');
          this.editProductionReportConfigStatus = roleFeaturePermissionsData.some(data => data.feature_name === 'Edit Production Report Config');
          this.deleteProductionReportConfigStatus = roleFeaturePermissionsData.some(data => data.feature_name === 'Delete Production Report Config');
        }
      }
    }
    else {
      this.addCustomUserTagStatus = false;
      this.deleteCustomUserTagStatus = false;
      this.moduleVisiblityStatus = false;
      this.addPdfGenerationConfigStatus = false;
      this.editPdfGenerationStatus = false;
      this.deletePdfGenerationStatus = false;
      this.addQualityCodeConfigStatus = false;
      this.editCustomUserTagStatus = false;
      this.editQualityCodeConfigStatus = false;
      this.deleteQualityCodeConfigStatus = false;
    }
    
  }
  defectsDropDown:any = [];
  getAllUniqueDefectTypes(){
    this.defectsDropDown = [];
    this.RollsService.getAllUniqueDefectTypes().subscribe(res =>{
      if(res?.status){
        this.all_defect_types = res?.data || [];
        this.all_defect_types.forEach((item, index) => {
          this.defectsDropDown.push({ item_id: index, item_text: item.defect_type });
        });
      }else{
        console.error('Something went wrong...!!', 'Error');
      }
    },error =>{
      console.error('Error fetching data from the API', error);
    })
  }

  get_machine_data() {
    this.RollsService
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
        }
      });
  }

  onSubmit(status:any): void {
    this.submitted = true;
    if (this.Form.invalid) {
      return;
    }
    const userId = localStorage.getItem('user_id');
    // const correctionFactorValue = this.Form.get("correction_factor").value || 0;
    const formData = new FormData();
    formData.append("user_id", userId);
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
    // formData.append("correction_factor", correctionFactorValue);
    formData.append(
      "repair_machine_id",
      this.Form.get("repair_machine_id").value
    );
    if(status === 'Add'){
      this.RollsService.saveMachine(formData).subscribe((response: any) => {
        if (response.status) {
          this.toastr.success(this.translocoService.translate('machine_config_saved_success'), this.translocoService.translate('success_exclamation'));
          this.getAllMachines();
          this.toggleInspectionMachine();
          // added activity log
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 11 && item.module_id === 7);
          if (activityObject) {
            this.commonService.addActivityLog(activityObject)
          }
        } else {
          this.toastr.error(this.translocoService.translate('something_went_wrong'), this.translocoService.translate('error'));
        }
      },
      (error: any) => {
          console.error("Error editing roll:", error);
          this.toastr.error(error.error.message, this.translocoService.translate('error'));
      }
    );
    }
    else if (status === 'Edit') {
      formData.append("repair_machine_setup_id", this.updateMachineId);
      this.RollsService.updateMachine(formData).subscribe((response: any) => {
        if (response.status) {
          this.toastr.success(this.translocoService.translate('machine_config_updated_success'), this.translocoService.translate('success_exclamation'));
          this.getAllMachines();
          this.toggleInspectionMachine();
          // added activity log
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 12 && item.module_id === 7);
          if (activityObject) {
            this.commonService.addActivityLog(activityObject)
          }
        } else {
          this.toastr.error(this.translocoService.translate('something_went_wrong'), this.translocoService.translate('error'));
        }
      },
        (error: any) => {
          console.error("Error editing roll:", error);
          this.toastr.error(error.error.message, this.translocoService.translate('error'));
        }
      );
    }
    
  }

  get f(): { [key: string]: AbstractControl } {
    return this.Form.controls;
  }

  get inspectionF(): { [key: string]: AbstractControl } {
    return this.inspectionForm.controls;
  }

  isCustomColorSelected(): boolean {
    const selectedColor = this.criticalDefectForm.get('color')?.value;
    return selectedColor && !this.predefinedColors.includes(selectedColor);
  }

  get criticalDefectF(): { [key: string]: AbstractControl } {
    return this.criticalDefectForm.controls;
  }

  getCriticalDefectData(): void {
    const payload = { component_name: 'critical_defect_config' };
    this.RollsService.getSystemConfiguration(payload).subscribe({
      next: (response: any) => {
        if (response.status && response.data.length > 0) {
          let configData = response.data[0].configuration_data;
          if (typeof configData === 'string') {
            try { configData = JSON.parse(configData); } catch (e) { this.criticalDefectData = []; return; }
          }
          this.criticalDefectData = configData?.critical_defects || [];
        } else { this.criticalDefectData = []; }
      },
      error: () => { this.criticalDefectData = []; }
    });
  }

  getDefectGradingData(): void {
    const payload = { component_name: 'defect_grading_config' };
    this.RollsService.getSystemConfiguration(payload).subscribe({
      next: (response: any) => {
        if (response.status && response.data.length > 0) {
          let configData = response.data[0].configuration_data;
          if (typeof configData === 'string') {
            try {
              configData = JSON.parse(configData);
            } catch (e) {
              configData = {};
            }
          }
          this.defectGradingRulesData = configData?.grading_rules || [];
          this.defectGradingForm.patchValue({
            measurement_unit: configData?.measurement_unit || '',
            max_allowable_points: configData?.max_allowable_points || ''
          });
          if (this.defectGradingRulesData.length > 0) {
            this.defectGradingForm.get('measurement_unit')?.disable();
            this.defectGradingForm.get('max_allowable_points')?.disable();
          } else {
            this.defectGradingForm.get('measurement_unit')?.enable();
            this.defectGradingForm.get('max_allowable_points')?.enable();
          }
        } else {
          this.defectGradingRulesData = [];
          this.defectGradingForm.get('measurement_unit')?.enable();
          this.defectGradingForm.get('max_allowable_points')?.enable();
        }
      },
      error: () => {
        this.defectGradingRulesData = [];
        this.defectGradingForm.get('measurement_unit')?.enable();
        this.defectGradingForm.get('max_allowable_points')?.enable();
      }
    });
  }

  saveDefectGradingConfig(updatedRules: any[], successKey?: string) {
    const headerValues = this.defectGradingForm.getRawValue();
    const payload = {
      app_id: 15,
      component_id: 1520,
      component_name: 'defect_grading_config',
      configuration_data: JSON.stringify({
        measurement_unit: headerValues.measurement_unit,
        max_allowable_points: headerValues.max_allowable_points,
        grading_rules: updatedRules
      }),
      updated_by: this.user_id
    };

    this.RollsService.addSystemConfiguration(payload).subscribe((response: any) => {
      if (response.status) {
        this.toastr.success(successKey ? this.translocoService.translate(successKey) : response.message, this.translocoService.translate('success'));
        this.getDefectGradingData();
        this.showDefectGradingList = false;
      } else {
        this.toastr.error(response.message, this.translocoService.translate('error'));
      }
    });
  }

  onDefectGradingHeaderSave() {
    if (this.defectGradingForm.get('measurement_unit')?.disabled) {
      return;
    }
    if (this.defectGradingForm.invalid) {
      this.defectGradingForm.markAllAsTouched();
      return;
    }
    this.saveDefectGradingConfig(this.defectGradingRulesData);
  }

  toggleCriticalDefect() {
    this.showList = !this.showList;
    this.criticalDefectForm.reset({ color: '' });
    this.submitted = false;
    this.editCriticalDefectIndex = -1;
    this.addEditBtnCriticalDefect = 'Add';
  }

  cancelCriticalDefect() {
    this.showList = false;
  }

  onCriticalDefectSubmit(status: any) {
    this.submitted = true;
    if (this.criticalDefectForm.invalid) return;

    const newName = this.criticalDefectForm.value.defect_type_name;
    const newColor = this.criticalDefectForm.value.color;

    const isDuplicate = this.criticalDefectData.some(
      (item, index) => item.defect_type_name.toLowerCase() === newName.toLowerCase() && index !== this.editCriticalDefectIndex
    );

    if (isDuplicate) {
      this.toastr.error(this.translocoService.translate('defect_type_name_exists'), this.translocoService.translate('error'));
      return;
    }

    const isColorDuplicate = this.criticalDefectData.some(
      (item, index) => item.color.toLowerCase() === newColor.toLowerCase() && index !== this.editCriticalDefectIndex
    );

    if (isColorDuplicate) {
      this.toastr.error(this.translocoService.translate('color_already_exists'), this.translocoService.translate('error'));
      return;
    }

    const newDefect = { defect_type_name: newName, color: newColor };
    let updatedData = [...this.criticalDefectData];
    if (status === 'Edit' && this.editCriticalDefectIndex > -1) {
      updatedData[this.editCriticalDefectIndex] = newDefect;
    } else {
      updatedData.push(newDefect);
    }

    this.saveCriticalDefectConfig(updatedData, status === 'Edit' ? 'updated_successfully' : undefined);
  }

  saveCriticalDefectConfig(updatedData: any[], successKey?: string) {
    const payload = {
      app_id: 15,
      component_id: 1521,
      component_name: 'critical_defect_config',
      configuration_data: JSON.stringify({ critical_defects: updatedData }),
      updated_by: this.user_id
    };

    this.RollsService.addSystemConfiguration(payload).subscribe((response: any) => {
      if (response.status) {
        this.toastr.success(successKey ? this.translocoService.translate(successKey) : response.message, this.translocoService.translate('success'));
        this.getCriticalDefectData();
        this.showList = false;
      } else {
        this.toastr.error(response.message, this.translocoService.translate('error'));
      }
    });
  }

  editCriticalDefect(data: any, index: number) {
    this.addEditBtnCriticalDefect = 'Edit';
    this.editCriticalDefectIndex = index;
    this.showList = true;
    this.criticalDefectForm.patchValue({
      defect_type_name: data.defect_type_name,
      color: data.color
    });
  }

  openDeleteModalforCriticalDefect(index: number) {
    this.deleteCriticalDefectIndex = index;
    this.showDeleteModalForCriticalDefect = true;
  }

  closeDeleteModalforCriticalDefect() {
    this.showDeleteModalForCriticalDefect = false;
    this.deleteCriticalDefectIndex = -1;
  }

  deleteCriticalDefect() {
    if (this.deleteCriticalDefectIndex === -1) return;
    const updatedData = [...this.criticalDefectData];
    updatedData.splice(this.deleteCriticalDefectIndex, 1);
    this.saveCriticalDefectConfig(updatedData, 'deleted_successfully');
    this.closeDeleteModalforCriticalDefect();
  }

  greaterThan1(controlName: string) {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const comparisonControl = control.root.get(controlName);
      if (comparisonControl && comparisonControl.value == 0) {
        return { lessThan: true };
      }

      return null;
    };
  }

  addReportConfiguration(type: string): void {
    if(this.emails.length === 0){
      this.reportConfigurationForm.get('targetEmails')?.setErrors({ required: true });
      this.reportConfigurationForm.updateValueAndValidity();
    }
    if (this.reportConfigurationForm.invalid) {
      this.reportConfigurationForm.markAllAsTouched(); // Mark all fields as touched to trigger validation messages
      return; // Stop execution if form is invalid
    }
    if(this.productionReportConfigData && this.productionReportConfigData.length > 0 && type === 'add')
    {
      const existingConfigNames = this.productionReportConfigData.map((config: any) => config.report_config_name);
      const newConfigName = this.reportConfigurationForm.get('configName')?.value || '';
      if (existingConfigNames.includes(newConfigName)) {
        this.toastr.error(this.translocoService.translate('error'), this.translocoService.translate('config_name_exists'));
        return; // Stop execution if duplicate name found
      }
    }
    else if(this.productionReportConfigData && this.productionReportConfigData.length > 0 && type === 'edit')
    {
      const existingConfigNames = this.productionReportConfigData
        .filter((config: any) => config.report_config_name !== this.originalConfigName) // Exclude the original name
        .map((config: any) => config.report_config_name);
      const newConfigName = this.reportConfigurationForm.get('configName')?.value || '';
      if (existingConfigNames.includes(newConfigName)) {
        this.toastr.error(this.translocoService.translate('error'), this.translocoService.translate('config_name_exists'));
        return; // Stop execution if duplicate name found
      }
    }
    let inspection_machine_id: any[] = [];
    let inspection_machine_ips: any[] = [];
    let inspection_machine_name: any[] = [];
    const machineIdsControl = this.reportConfigurationForm.get('machineIds');
    const machineIds = machineIdsControl ? machineIdsControl.value : [];
    const backend_url = `${(window as any).__env.hypertext}localhost:8889/`;
    const time = `${this.reportConfigurationForm.get('time')?.value}`;
    machineIds.forEach((selectedMachine: any, index: number) => {
          const machineData = this.machineData.find(
            (data: any) => data.id === selectedMachine.id
          ); 
          inspection_machine_id.push(machineData.id);
          inspection_machine_name.push(machineData.name);
          inspection_machine_ips.push(machineData.ip);
    })
    const configuration_data = {
      report_config_name : this.reportConfigurationForm.get('configName')?.value || '',
      frequency : this.reportConfigurationForm.get('frequency')?.value || '',
      target_emails : this.emails,
      backend_url : backend_url,
      filters : {
        inspection_machine_id : inspection_machine_id,
        inspection_machine_name : inspection_machine_name,
        inspection_machine_ips : inspection_machine_ips,
        number_of_days : this.reportConfigurationForm.get('days')?.value || '',
        time : time || '',
        repair_machine_id : this.reportConfigurationForm.get('repairMachineId')?.value || '',
        roll_status : this.reportConfigurationForm.get('rollsStatus')?.value || '',
        column_name_array : this.excelColumnNameArray,
        data_status : this.reportConfigurationForm.get('dataStatus')?.value || '',
        recipe : this.reportConfigurationForm.get('recipe')?.value || '',
        tag_name : this.reportConfigurationForm.get('userTag')?.value || '',
        sorting_column_name : this.currentSortColumn
      },
      status: 0
    }
    const configuration_data_array: any[] = [];
    if(this.productionReportConfigData && this.productionReportConfigData.length > 0 && type === 'add'){
      configuration_data_array.push(...this.productionReportConfigData);
      configuration_data_array.push(configuration_data);
    }
    else if(this.productionReportConfigData && this.productionReportConfigData.length > 0 && type === 'edit'){
      this.productionReportConfigData.forEach((config: any,index:any) => {
       
        if (config.report_config_name === this.originalConfigName) {
          configuration_data_array.push(...this.productionReportConfigData);
          configuration_data_array[index] = configuration_data 
        }
      });
    }
    else{
      configuration_data_array.push(configuration_data);
    }

      const configuration_data_object = {
        report_config : configuration_data_array
      };

     const data = {
        app_id: 10,
        configuration_data: JSON.stringify(configuration_data_object),
        component_id: 1066,
        component_name: 'report_config',
        updated_by: this.user_id
      }
      this.RollsService.addSystemConfiguration(data).subscribe(
        (response: any) => {
          if (response.status)
          {
            this.toastr.success(this.translocoService.translate('success'), response.message)
            this.reportConfigurationForm.reset();
            this.emails = [];
            this.getReportConfiguration();
            if(type === 'edit'){
              const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 18 && item.module_id === 7);
              if (activityObject) {
                this.commonService.addActivityLog(activityObject)
              }
              this.togglePdfView('add');
              this.showPdfList = false;
            }
            else if(type === 'add'){
              const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 17 && item.module_id === 7);
              if (activityObject) {
                this.commonService.addActivityLog(activityObject)
              }
              this.selectedHour = '00';
              this.selectedMinute = '00';
              this.reportConfigurationForm.patchValue({
                configName: '', 
                frequency: 1,
                targetEmails: '',
                machineIds: [],
                repairMachineId: '',
                days: '',
                time: '',
                rollsStatus: '',
                columnName: [],
                dataStatus: '',
                recipe: '',
                userTag: '',
              });
              this.showPdfList = false;
              this.currentSortColumn = '';
              this.firstEnabledColumnStatus = false;
            }
          }
          else
            this.toastr.error(this.translocoService.translate('error'), response.message)
        },
        (error: any) => {
          this.toastr.error(this.translocoService.translate('error'), error.message)
          console.error("Unexpected error in updateModuleSettings", error);
        }
      );
  }

  getReportConfiguration(): void {
    try {
      const payload = {
        component_name: 'report_config',
      }
      this.RollsService.getSystemConfiguration(payload).subscribe((response: any) => {
        const data = response?.data || [];
        if(data.length > 0) {
          this.productionReportConfigData = data[0].configuration_data?.report_config ? data[0].configuration_data?.report_config : [];
        }
      })
    } catch (error) {
      console.log("Something went wrong", error)
    }
  }

  // Add email when pressing + button
  addEmail() {
    const email = this.reportConfigurationForm.get('targetEmails')?.value?.trim();
    if (!email) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.reportConfigurationForm.get('targetEmails')?.setErrors({ invalid: true });
      return;
    }

    // Avoid duplicates (optional)
    if (!this.emails.includes(email)) {
      this.emails.push(email);
    }

    // Clear input
    this.reportConfigurationForm.get('targetEmails')?.reset();
  }

  // Remove email chip
  removeEmail(index: number) {
    this.emails.splice(index, 1);
  }


  onSelectionChange(event: any) {
    this.selectedStatusOption = { value: '', viewValue: '', type: "" }
    const selectedValue = event.target.value;
    this.selectedStatusOption = this.mergedOptions.find(opt => opt.value === selectedValue);
    if (this.selectedStatusOption) {
      if (this.selectedStatusOption.type === 'status') {
        this.status = selectedValue;
        this.tag_name = ''; // Reset tag_name if a status is selected
      } else if (this.selectedStatusOption.type === 'tag_name') {
        // this.tag_name = selectedValue;
        this.tag_name = this.selectedStatusOption.id
        this.status = ''; // Reset status if a tag_name is selected
      }
    } else {
      this.status = '';
      this.tag_name = '';
      this.selectedStatusOption = { value: '', viewValue: '', type: "" }
    }
  }

  fetchUserTags() {
    this.RollsService.getUserTagList().subscribe(
      (response) => {
        if (response.status) {
          this.optionsForUserTag = response.data;
          this.optionsForUserTag.forEach(item => {
            this.tagDropdownList.push({ item_id: item.user_tag_id, item_text: item.tag_name })
          })
          this.mergedOptions = [
            ...this.options.map(opt => ({ value: opt.value, viewValue: opt.viewValue, type: 'status' })),
          ];
        }
        else {
          this.mergedOptions = [
            ...this.options.map(opt => ({ value: opt.value, viewValue: opt.viewValue, type: 'status' }))
          ];
        }
      },
      (error) => {
        this.mergedOptions = [
          ...this.options.map(opt => ({ value: opt.value, viewValue: opt.viewValue, type: 'status' }))
        ];
        console.error("Error fetching user tags:", error);
      }
    );
  }
  // Fetch all recipes from backend and update recipeNames
  fetchAllRecipes() {
    this.RollsService.getAllRecipes().subscribe(
      (response) => {
        if (response.status && Array.isArray(response.data)) {
          this.recipeNames = response.data; // or map to correct property
        } else {
          this.recipeNames = [];
        }
      },
      (error) => {
        this.recipeNames = [];
        console.error('Error fetching recipes:', error);
      }
    );
  }

  onRecipeChange(event: any) {
    const recipeId = event.target.value;
    // handle recipe filter logic here
  }

  reportConfigurationUpdate(configName:any){
    this.addEditBtn = 'Edit';
    this.originalConfigName = configName;
    
    this.productionReportConfigData.forEach((config: any) => {
      if(config.report_config_name === configName){
        const [hour, minute] = config.filters.time.split(":");
        let column_name_array = []
        Array.isArray(config.filters.column_name_array) && config.filters.column_name_array.length > 0 ?
        config.filters.column_name_array.map((value:any) => {
          const report_type = value.report_type
          const columnid = report_type === 'roll_details' ? 1 : (report_type === 'inspection_details' ? 2 : (report_type === 'review_details' ? 3 : (report_type === 'repair_details' ? 4 : (report_type === 'defects_summary' ? 5 : (report_type === 'body_details' ? 6 : (report_type === 'loom_report_data' ? 7  : (report_type === 'defects_details' ? 8 : (report_type === 'usage_report_data' ? 9 : ''))))))));
          const column_name_obj = {
            id : columnid,
            name : this.excelColumnData[Number(columnid) - 1].name
          }
          column_name_array.push(column_name_obj)
        }): [];
        this.reportConfigurationForm.patchValue({
          configName: config.report_config_name || '',
          frequency: config.frequency || '',
          machineIds: config.filters.inspection_machine_id?.map((id: any,index:any) => {
            return { id: id, name: config.filters.inspection_machine_name[index], ip: config.filters.inspection_machine_ips[index] };
          }) || [],
          days: config.filters.number_of_days || '',
          time: config.filters.time || '',
          repairMachineId: config.filters.repair_machine_id || '',
          rollsStatus: config.filters.roll_status || '',
          columnName: Array.isArray(column_name_array) ? column_name_array : (column_name_array ? [column_name_array] : []),
          dataStatus: config.filters.data_status || '',
          recipe: config.filters.recipe || '',
          userTag: config.filters.tag_name || '',
        });
        this.currentSortColumn = config.filters.sorting_column_name || '';
        this.selectedHour = hour || '00';
        this.selectedMinute = minute || '00';
        this.emails = config.target_emails || [];
        this.excelColumnNameArray = config.filters.column_name_array || []
        this.togglePdfView('edit');
      }
    });
  }

  deleteProductionReportConfig(){
    const index = this.productionReportConfigData.findIndex(
      (config: any) => config.report_config_name === this.originalConfigName
    );

    if (index !== -1) {
      this.productionReportConfigData.splice(index, 1);
    }
    const configuration_data_object = {
      report_config : this.productionReportConfigData
    };
    const data = {
      app_id: 10,
      configuration_data: JSON.stringify(configuration_data_object),
      component_id: 1066,
      component_name: 'report_config',
      updated_by: this.user_id
    }
    this.RollsService.addSystemConfiguration(data).subscribe(
      (response: any) => {
        if (response.status)
        {
            this.toastr.success(this.translocoService.translate('success'), response.message)
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 19 && item.module_id === 7);
          if (activityObject) {
            this.commonService.addActivityLog(activityObject)
          }
          this.reportConfigurationForm.reset();
          this.emails = [];
          this.getReportConfiguration();
          this.closeDeleteModalforProductionReport();
        }
        else
            this.toastr.error(this.translocoService.translate('error'), response.message)
      },
      (error: any) => {
        this.toastr.error(this.translocoService.translate('error'), error.message)
        console.error("Unexpected error in updateModuleSettings", error);
      }
    );  
  }

  disableEnter(event: KeyboardEvent) {
    event.preventDefault();  // Stop ENTER from submitting form
  }

  getAllMachines() {
    this.RollsService.getAllMachines().subscribe(
      (response: any) => {
        if (response.status) {
          this.allMachinesData = response.data || [];
          this.repairMachineIds = this.allMachinesData.length > 0 ? this.allMachinesData.map((item:any) => item.repair_machine_id) : [];
        } else {
          console.error('Error from API:', response.message);
        }
      },
      (error: any) => {
        console.error('HTTP Error fetching machine list:', error);
      }
    );
  }

  cancleMachineConfig(){
    this.showList = false;
  }

  machineConfig(data:any){
    this.addEditBtnMachineConfig = 'Edit';
    this.showList=true;
    this.updateMachineId = data.repair_machine_setup_id;
    this.Form.patchValue({
      inspection_table_width: data.inspection_table_width,
      splicing_offset: data.splicing_offset,
      repairing_offset: data.repairing_offset,
      jogging_offset: data.jogging_offset,
      // correction_factor: data.correction_factor,
      repair_machine_id: data.repair_machine_id,
    });
  }

  openDeleteModalforMachineConfig(id:any){
    this.deleteMachineConfigId = id;
    this.showDeleteModalForMachineConfig = true;
  }

  closeDeleteModalForMachineConfig(){
    this.showDeleteModalForMachineConfig = false;
  }

  deleteMachineConfig(){
    const data = {
      repair_machine_setup_id: this.deleteMachineConfigId,
      updated_by: this.user_id
    };
    this.RollsService.deleteMachine(data).subscribe({
      next: (res) => {
        if (res && res.message) {
          this.toastr.success(res.message, this.translocoService.translate('success'));
          this.getAllMachines();
          this.closeDeleteModalForMachineConfig();
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 13 && item.module_id === 7);
          if (activityObject) {
            this.commonService.addActivityLog(activityObject)
          }
        } else {
          if (res.message) {
            this.toastr.error(res.message, this.translocoService.translate('error'));
          } else {
          }
        }
      },
      error: (err) => {
        if (err.message) {
          this.toastr.error(err.message, this.translocoService.translate('error'));
        } else {
          console.log(err);
        }
      }
    })
  } 

   changeColumnConfiguration()
  {
    if(!this.reportConfigurationForm.get("columnName").value)
    {
      this.reportType = 'all';
      this.columnNameArray = [];
      return;
    }
    const selectColumnValue = Number(this.reportConfigurationForm.get("columnName").value)
    this.reportType = selectColumnValue === 1 ? 'roll_details' : (selectColumnValue === 2 ? 'inspection_details' : (selectColumnValue === 3 ? 'review_details' : (selectColumnValue === 4 ? 'repair_details' : (selectColumnValue === 5 ? 'defects_summary' :  (selectColumnValue === 6 ? 'body_details' : (selectColumnValue === 7 ? 'loom_report_data' : (selectColumnValue === 8 ? 'defects_details' : (selectColumnValue === 9 ? 'usage_report_data' : ''))))))));
    this.columnNameArray = this.allColumnNameArray[selectColumnValue - 1].map(col => ({
      name: col.label,
      key: col.key,
      checked: false,
      sorting: col.sorting
    }));
    this.showColumnNameModal = true;
  }

  onSelectAllChange() {

    this.columnNameArray.forEach(col => {

      // Prevent unchecking current sort column
      if (!this.selectedAll && col.key === this.currentSortColumn) {
        this.toastr.warning("Cannot unselect the current sorting column. Please change sorting column before unselecting this.", this.translocoService.translate('warning'));
        col.checked = true;
      } else {
        col.checked = this.selectedAll;
      }

    });

    const index = this.excelColumnNameArray.findIndex(
      (data: any) => data.report_type === this.reportType
    );

    if (index !== -1) {
      this.excelColumnNameArray[index].column_name = this.columnNameArray;
    } else {
      this.excelColumnNameArray.push({
        report_type: this.reportType,
        column_name: this.columnNameArray
      });
    }

    const firstEnabledColumn = this.columnNameArray.find(col => col.checked && col.sorting);

    if (!this.firstEnabledColumnStatus && this.currentSortColumn === '' && firstEnabledColumn && firstEnabledColumn?.sorting) {
        this.currentSortColumn = firstEnabledColumn.key;
        this.firstEnabledColumnStatus = true
      }
  }

  closeColumnModal() {
    this.showColumnNameModal = false;
    // Select All uncheck
    this.selectedAll = false;
  }

  setExcelColumn(event: any, type: 'select' | 'deselect') {
    const id = Number(event.id)
    this.reportType = id === 1 ? 'roll_details' : (id === 2 ? 'inspection_details' : (id === 3 ? 'review_details' : (id === 4 ? 'repair_details' : (id === 5 ? 'defects_summary' : (id === 6 ? 'body_details' : (id === 7 ? 'loom_report_data' : (id === 8 ? 'defects_details' : (id === 9 ? 'usage_report_data' : ''))))))))
    if (type === 'deselect') {
      const deselectIdIndex = this.excelColumnNameArray.findIndex((data:any) => data.report_type === this.reportType)
      if(deselectIdIndex !== -1)
      {
        // console.log(this.currentSortColumn, 'current sort column')
        
        const deselectColumn = this.excelColumnNameArray[deselectIdIndex].column_name.find(col => col.key === this.currentSortColumn)
        if(deselectColumn && this.currentSortColumn === deselectColumn.key && this.excelColumnNameArray.length > 1){
          this.currentSortColumn = this.excelColumnNameArray[0].column_name[0].key
        }
        this.excelColumnNameArray.splice(deselectIdIndex,1)
        console.log(this.excelColumnNameArray, 'updated excel column array after deselection')
        if(this.excelColumnNameArray.length === 0){
          this.currentSortColumn = '';
          this.firstEnabledColumnStatus = false;
        }
      }
    }
    if (type === 'select') { 
       this.columnNameArray = this.allColumnNameArray[Number(id) - 1].map(col => ({
        name: col.label,
        key: col.key,
        checked: false,
        sorting: col.sorting
      }));
      this.showColumnNameModal = true;
      //dropdown force close
      if (this.excelDropdown) {
        this.excelDropdown.closeDropdown();
      }
    }
  }

  updateStatusForReportConfig(report_config_name){
    const configuration_data_array: any[] = [];
    const defaultConfigIndex = this.productionReportConfigData.findIndex((data:any) => data.status === 1);
    let configuration_data_object;
    for (let index = 0; index < this.productionReportConfigData.length; index++) {
      const config = this.productionReportConfigData[index];

      if (config.report_config_name === report_config_name && index !== defaultConfigIndex) {
        configuration_data_array.push(...this.productionReportConfigData);

        configuration_data_array[index].status = 1;
        defaultConfigIndex !== -1 ? configuration_data_array[defaultConfigIndex].status = 0 : '';

        configuration_data_object = {
          report_config: configuration_data_array
        };
        break;
      } 
      else if (config.report_config_name === report_config_name) {
        configuration_data_array.push(...this.productionReportConfigData);
        configuration_data_array[index].status = 0;
        configuration_data_object = {
          report_config: configuration_data_array
        };
        break;
      }
    }

     const data = {
        app_id: 10,
        configuration_data: JSON.stringify(configuration_data_object),
        component_id: 1066,
        component_name: 'report_config',
        updated_by: this.user_id
      }
      this.RollsService.addSystemConfiguration(data).subscribe(
        (response: any) => {
          if (response.status)
          {
            this.toastr.success(this.translocoService.translate('success'), this.translocoService.translate('status_updated_success'))
            this.getReportConfiguration();
          }
          else
            this.toastr.error(this.translocoService.translate('error'), response.message)
        },
        (error: any) => {
          this.toastr.error(this.translocoService.translate('error'), error.message)
          console.error("Unexpected error in updateModuleSettings", error);
        }
      );
  }

  onInspectionSubmit(status:any): void {
    this.submitted = true;
    if (this.inspectionForm.invalid) {
      return;
    }
    const payloadData:{
      machine_name : any,
      ip_address : any,
      port : any,
      master_machine_status : any,
      machine_id : any,
      updated_by : any
    } = {
      machine_name: this.inspectionForm.get("machine_name").value,
      ip_address: this.inspectionForm.get("machine_ip").value,
      port: ":8889/",
      master_machine_status: this.inspectionForm.get("master_status").value || 0,
      machine_id: undefined,
      updated_by: this.user_id
    }
    if(status === 'Add'){
      this.RollsService.saveInspectionMachine(payloadData).subscribe(async (response: any) => {
        if (response.status) {
          this.toastr.success(this.translocoService.translate('inspection_machine_saved_success'), this.translocoService.translate('success_exclamation'));
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 14 && item.module_id === 7);
          if (activityObject) {
            this.commonService.addActivityLog(activityObject)
          }
          this.inspectionForm.patchValue({
            machine_name: '',
            machine_ip: '',
            master_status: false
          });
          const updatedList = await this.getAllInspectionMachine();
          this.toggleInspectionMachine();
          this.changeLocalMachineData(updatedList);
        } else {
          this.toastr.error(this.translocoService.translate('something_went_wrong'), this.translocoService.translate('error'));
        }
      },
      (error: any) => {
          console.error("Error editing roll:", error);
          this.toastr.error(error.error.message, this.translocoService.translate('error'));
      }
    );
    }
    else if (status === 'Edit') {
      payloadData.machine_id = this.updateInspectionMachineId;
      this.RollsService.updateInspectionMachine(payloadData).subscribe(async (response: any) => {
        if (response.status) {
          this.toastr.success(response.message, this.translocoService.translate('success_exclamation'));
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 15 && item.module_id === 7);
          if (activityObject) {
            this.commonService.addActivityLog(activityObject)
          }
          const updatedList = await this.getAllInspectionMachine();
          this.toggleInspectionMachine();
          this.changeLocalMachineData(updatedList);
        } else {
          this.toastr.error(this.translocoService.translate('something_went_wrong'), this.translocoService.translate('error'));
        }
      },
        (error: any) => {
          console.error("Error editing roll:", error);
          this.toastr.error(error.error.message, this.translocoService.translate('error'));
        }
      );
    }
    
  }

  getAllInspectionMachine(): Promise<any> {
  return new Promise((resolve, reject) => {
    this.RollsService.getAllInspectionMachine().subscribe({
      next: (res) => {
        this.machineData = res.data || [];
        resolve(this.machineData);
      },
      error: (err) => {
        reject(err);
      }
    });
  });
}


  editInspectionMachineConfig(data:any){
    if(data.master_machine_status){
      this.inspectionForm.get('machine_ip')?.disable();
      this.inspectionForm.get('master_status')?.disable();
    }
    else{
      this.inspectionForm.get('machine_ip')?.enable();
      this.inspectionForm.get('master_status')?.enable();
    }
    this.addEditBtnInspectionMachineConfig = 'Edit';
    this.showList=true;
    this.updateInspectionMachineId = data.id;
    this.inspectionForm.patchValue({
      machine_name: data.name,
      machine_ip: data.ip,
      master_status: data.master_machine_status
    });
  }

  openDeleteModalforInspectionMachineConfig(id:any){
    const data = this.machineData.find((item: any) => item.id === id);
    if (data.master_machine_status === 1) {
      this.toastr.warning(
        this.translocoService.translate('master_machine_cannot_delete'),
        this.translocoService.translate('warning')
      );
      return;
    }
    this.deleteInsepctionMachineConfigId = id;
    this.showDeleteModalForInspectionMachineConfig = true;
  }

  closeDeleteModalForInspectionMachineConfig(){
    this.showDeleteModalForInspectionMachineConfig = false;
  }

  deleteInspectionMachineConfig(){
    const data = {
      machine_id: this.deleteInsepctionMachineConfigId,
      updated_by: this.user_id
    };
    this.RollsService.deleteInspectionMachine(data).subscribe({
      next: async (res) => {
        if (res && res.message) {
          this.toastr.success(res.message, this.translocoService.translate('success'));
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 16 && item.module_id === 7);
          if (activityObject) {
            this.commonService.addActivityLog(activityObject)
          }
          const updatedList = await this.getAllInspectionMachine();
          this.closeDeleteModalForInspectionMachineConfig();
          this.changeLocalMachineData(updatedList);
        } else {
          if (res.message) {
            this.toastr.error(res.message, this.translocoService.translate('error'));
          } else {
          }
        }
      },
      error: (err) => {
        if (err.message) {
          this.toastr.error(err.message, this.translocoService.translate('error'));
        } else {
          console.log(err);
        }
      }
    })
  } 

  changeLocalMachineData(updatedList: any[]) {

    // Deep copy so original machineData safe rahe
    const localMachineList = updatedList.map(item => ({ ...item }));

    localStorage.setItem('machineData', JSON.stringify(localMachineList));

    const selectedMachine = localStorage.getItem('selectMachine');

    if (selectedMachine) {
      const selectedMachineData = JSON.parse(selectedMachine);

      const selected = localMachineList.find(
        item => item.id === selectedMachineData[0].id
      );

      if (selected) {
        // Prevent multiple stars
        const machineName =  selected.master_machine_status === 1 ? (
          selected.name.endsWith('*') ? selected.name : selected.name + '*'
        ) : selected.name;

        const selectedMachineForStorage = {
          ...selected,
          name: machineName
        };

        localStorage.setItem('selectMachine', JSON.stringify([selectedMachineForStorage]));
        localStorage.setItem('machine_id', selected.id);
        localStorage.setItem('machine_name', machineName);
        localStorage.setItem('machine_ip', selected.ip);
      }
    }

    const machine_ips = localMachineList.map(item => item.ip);
    localStorage.setItem('machine_ips', JSON.stringify(machine_ips));

    const machine_names = localMachineList.map(item => item.name);
    localStorage.setItem('machine_names', JSON.stringify(machine_names));

    const master_machine = localMachineList.find(
      item => item.master_machine_status === 1
    );

    if (master_machine) {
      localStorage.setItem('master_machine_data', JSON.stringify(master_machine));
    }
  }

  showPicker = false;

  hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, '0')
  );

  minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, '0')
  );

  togglePicker() {
    this.showPicker = !this.showPicker;
  }

  selectHour(h: string) {
    this.selectedHour = h;
    this.selectedMinute = '00'; // Reset minute to '00' when hour is selected
  }

  selectMinute(m: string) {
    this.selectedMinute = m;
    this.showPicker = false;

    // form value set
    this.reportConfigurationForm.patchValue({
      time: `${this.selectedHour}:${this.selectedMinute}`
    });
  }

  enableEdit(col: any) {
    if (this.currentEditingCol && this.currentEditingCol !== col) {
      this.disableEdit(this.currentEditingCol);
    }

    col.isEditing = true;
    this.selectColumnName = col.name;
    this.currentEditingCol = col;
  }

  disableEdit(col: any) {
    col.isEditing = false;
    if (!col.hasOwnProperty('originalName') && col.name !== this.selectColumnName) {
      col.originalName = this.selectColumnName;
    }
    this.currentEditingCol = null;
  }

  
  sortData(col: any) {
    // console.log("Sorting by column:", col);
    if(col.checked && col.sorting) {
      this.currentSortColumn = col.key;
    }
    else if(col.checked && !col.sorting) {
      this.toastr.warning("Sorting is not enabled for this column. Please select another column for sorting.", "Warning");
    }
  }

  handleToggle(event: Event, col: any) {
    if (col.key === this.currentSortColumn && col.checked) {
      event.preventDefault(); // browser ko toggle karne se roko
      this.toastr.warning("Cannot unselect the current sorting column. Please change sorting column before unselecting this.", this.translocoService.translate('warning'));
      return;
    }

    col.checked = !col.checked;

    const checkReportTypeIndex = this.excelColumnNameArray.findIndex(
      (data: any) => data.report_type === this.reportType
    );

    if (checkReportTypeIndex !== -1) {
      this.excelColumnNameArray[checkReportTypeIndex].column_name = this.columnNameArray;
    } else {
      this.excelColumnNameArray.push({
        report_type: this.reportType,
        column_name: this.columnNameArray
      });
    }
    const firstEnabledColumn = this.columnNameArray.find(col => col.checked && col.sorting);
    if (!this.firstEnabledColumnStatus && this.currentSortColumn === '' && firstEnabledColumn && firstEnabledColumn?.sorting) {
        this.currentSortColumn = firstEnabledColumn.key;
        this.firstEnabledColumnStatus = true
      }

  }

  onRowClick(event: MouseEvent, col: any) {

    // Agar edit mode me hai to sort mat karo
    if (col.isEditing) return;

    // Agar toggle ya input area se click aaya ho to ignore karo
    const target = event.target as HTMLElement;
    if (target.closest('input') || target.closest('label')) {
      return;
    }

    // Double click detect karne ke liye delay use karo
    if (this.clickTimer) {
      clearTimeout(this.clickTimer);
      this.clickTimer = null;
      return; // second click of double click → ignore
    }

    this.clickTimer = setTimeout(() => {
      this.sortData(col);
      this.clickTimer = null;
    }, 250);
  }

  drop(event: CdkDragDrop<any[]>) {

    if (event.previousIndex === event.currentIndex) return;

    moveItemInArray(
      this.columnNameArray,
      event.previousIndex,
      event.currentIndex
    );

    //  IMPORTANT: force new reference
    this.columnNameArray = [...this.columnNameArray];

    const index = this.excelColumnNameArray.findIndex(
      (data: any) => data.report_type === this.reportType
    );

    if (index !== -1) {
      this.excelColumnNameArray[index].column_name = [
        ...this.columnNameArray
      ];
    }
  }

  onAddClick(type: 'mobile_number' | 'target_emails') {

    const sharingType = this.pdfAddEditForm.get('sharing_configuration_type')?.value;

    if (sharingType === 'sms' && type === 'mobile_number') {

      const control = this.pdfAddEditForm.get('mobile_number');
      const selectedCountry = this.pdfAddEditForm.get('country_code_selection')?.value;
      const customCountryCodeControl = this.pdfAddEditForm.get('custom_country_code');
      const selectedCountryConfig = this.countryCodeOptions.find(option => option.value === selectedCountry);
      const value = control?.value?.trim();
      const countryCode = this.selectedCountryCode?.trim();

      if (!value) {
        control?.setErrors({ required: true });
        control?.markAsTouched();
        return;
      }

      const mobileRegex = /^\d{4,15}$/;
      if (!mobileRegex.test(value)) {
        control?.setErrors({ pattern: true });
        control?.markAsTouched();
        return;
      }

      if (!countryCode) {
        customCountryCodeControl?.setErrors({ required: true });
        customCountryCodeControl?.markAsTouched();
        return;
      }

      const countryCodeRegex = /^\+[1-9]\d{0,3}$/;
      if (!countryCodeRegex.test(countryCode)) {
        customCountryCodeControl?.setErrors({ pattern: true });
        customCountryCodeControl?.markAsTouched();
        return;
      }

      const fullNumber = `${countryCode}${value}`;
      const mobileEntry = {
        country: selectedCountry === 'custom' ? 'Custom' : (selectedCountryConfig?.label || 'Custom'),
        code: countryCode,
        number: value,
        full_number: fullNumber
      };

      // Duplicate prevent
      if (!this.mobileList.some(mobile => this.getMobileChipLabel(mobile) === fullNumber)) {
        this.mobileList.push(mobileEntry);
        this.mobileListError = false;
      }

      control?.setValue('');
      control?.setErrors(null);
      customCountryCodeControl?.setErrors(null);
      if (selectedCountry === 'custom') {
        customCountryCodeControl?.setValue('');
      }
    }

    if (sharingType === 'email' && type === 'target_emails') {

      const control = this.pdfAddEditForm.get('target_emails');
      const value = control?.value?.trim();

      if (!value) {
        control?.setErrors({ required: true });
        control?.markAsTouched();
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        control?.setErrors({ pattern: true });
        control?.markAsTouched();
        return;
      }

      if (!this.emailList.includes(value)) {
        this.emailList.push(value);
        this.emailListError = false;
      }

      control?.setValue('');
      control?.setErrors(null);
    }
  }

  removeMobile(index: number) {
    this.mobileList.splice(index, 1);
  }

  removeEmail1(index: number) {
    this.emailList.splice(index, 1);
  }

  allowOnlyNumbers(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;

    // Allow only numbers (0-9)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  allowCountryCodeInput(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    const input = event.target as HTMLInputElement;

    if (charCode === 43 && input.selectionStart === 0 && !input.value.includes('+')) {
      return;
    }

    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  limitCountryCodeLength() {
    const control = this.pdfAddEditForm.get('custom_country_code');
    let value = control?.value || '';

    if (!value.startsWith('+')) {
      value = `+${value.replace(/\+/g, '')}`;
    }

    if (value.length > 5) {
      value = value.slice(0, 5);
    }

    control?.setValue(value, { emitEvent: false });
  }

  limitMobileLength() {
    const control = this.pdfAddEditForm.get('mobile_number');
    let value = control?.value || '';

    if (value.length > 15) {
      control?.setValue(value.slice(0, 15));
    }
  }

  saveLanguageSettings(language: string) {
    const code = this.languageMap[language];
    if (!code) return;

    this.translocoService.setActiveLang(code);
    localStorage.setItem('activeLang', code);

    const payload = {
      app_id: 10,
      component_id: 1067,
      component_name: 'app_language',
      configuration_data: JSON.stringify({ app_language: code }),
      updated_by: this.user_id
    };

    this.RollsService.addSystemConfiguration(payload).subscribe(
      (response: any) => {
        if (response.status) {
          this.toastr.success(this.translocoService.translate('success'), response.message);
          this._apiComponent.callNavbarPermission();
        } else {
          this.toastr.error(this.translocoService.translate('error'), response.message);
        }
      },
      (error) => {
        this.toastr.error(this.translocoService.translate('error'), error.message);
      }
    );
  }

  getLanguageSettings() {
    const payload = {
      component_name: 'app_language',
      // NOTE: This app_id should ideally be dynamic rather than hardcoded.
      app_id: 10
    };
    this.RollsService.getSystemConfiguration(payload).subscribe((response: any) => {
      if (response.status && response.data && response.data.length > 0) {
        const configData = response.data[0].configuration_data;
        const data = typeof configData === 'string' ? JSON.parse(configData) : configData;
        const langCode = data?.app_language;
        const langName = Object.keys(this.languageMap).find(key => this.languageMap[key] === langCode);
        if (langName && langCode) {
          this.selectedLanguage = langName;
          this.translocoService.setActiveLang(langCode);
          localStorage.setItem('activeLang', langCode);
        }
      }
    });
  }

  getlanguageChange() {
    this.translocoService.langChanges$.subscribe((lang) => {
      this.translocoService.selectTranslation(lang).pipe(take(1)).subscribe(() => {
        this.updateOptionsAndSettings();
      });
    });
  }

  toggleDefectGradingView() {
    const header = this.defectGradingForm.getRawValue();
    const unit = header.measurement_unit;
    const points = header.max_allowable_points;

    if (!unit || !points) {
      this.toastr.warning(this.translocoService.translate('fill_both_grading_fields'), this.translocoService.translate('warning'));
      return;
    }

    this.showDefectGradingList = !this.showDefectGradingList;
    this.defectGradingRuleForm.reset({
      defect_category: '',
      condition: '',
      min_defect_size: '',
      max_defect_size: '',
      points: '',
      rule_id: ''
    });
    this.editDefectGradingRuleIndex = -1;
    this.addEditBtnDefectGrading = 'Add';
    this.onDefectGradingConditionChange('');
  }

  onDefectGradingConditionChange(value: any) {
    const maxControl = this.defectGradingRuleForm.get('max_defect_size');
    if (value === '<>') {
      maxControl?.setValidators([Validators.required, Validators.pattern("^[0-9]*$"), this.greaterThan('min_defect_size')]);
    } else {
      maxControl?.clearValidators();
      maxControl?.setValidators([Validators.pattern("^[0-9]*$")]);
      maxControl?.setValue('');
    }
    maxControl?.updateValueAndValidity();
  }

  private checkRulesOverlap(r1: any, r2: any): boolean {
    const getBounds = (r: any) => {
      let start = +r.min_defect_size;
      let end = +r.min_defect_size;
      if (r.condition === '<=') { start = 0; end = +r.min_defect_size; }
      else if (r.condition === '>=') { start = +r.min_defect_size; end = Infinity; }
      else if (r.condition === '<>') { start = +r.min_defect_size; end = +r.max_defect_size; }
      return { start, end };
    };

    const b1 = getBounds(r1);
    const b2 = getBounds(r2);

    // Ranges [A, B] and [C, D] overlap if A <= D and C <= B
    return b1.start <= b2.end && b2.start <= b1.end;
  }

  saveDefectGradingRule() {
    if (this.defectGradingRuleForm.invalid) {
      this.defectGradingRuleForm.markAllAsTouched();
      return;
    }

    const newRule = this.defectGradingRuleForm.value;

    const isOverlap = this.defectGradingRulesData.some((rule, index) => {
      if (this.editDefectGradingRuleIndex === index) return false;
      if (rule.defect_category.trim().toLowerCase() !== newRule.defect_category.trim().toLowerCase()) return false;
      return this.checkRulesOverlap(newRule, rule);
    });

    if (isOverlap) {
      this.toastr.error(this.translocoService.translate('defect_size_range_overlap'), this.translocoService.translate('error'));
      return;
    }

    let updatedRules = [...this.defectGradingRulesData];

    if (this.editDefectGradingRuleIndex > -1) {
      updatedRules[this.editDefectGradingRuleIndex] = newRule;
    } else {
      // Find the maximum existing ID and increment it, or start at 1
      const maxId = updatedRules.reduce((max, rule) => 
        Math.max(max, parseInt(rule.rule_id || 0)), 0
      );
      newRule.rule_id = (maxId + 1).toString();
      updatedRules.push(newRule);
    }

    this.saveDefectGradingConfig(updatedRules);
  }

  defectGradingEdit(data: any, index: number) {
    this.addEditBtnDefectGrading = 'Edit';
    this.editDefectGradingRuleIndex = index;
    this.showDefectGradingList = true;
    this.defectGradingRuleForm.patchValue(data);
    this.onDefectGradingConditionChange(data.condition);
  }

  openDeleteModalForDefectGrading(index: number) {
    this.deleteDefectGradingRuleIndex = index;
    this.showDeleteModalForDefectGrading = true;
  }

  closeDeleteModalForDefectGrading() {
    this.showDeleteModalForDefectGrading = false;
    this.deleteDefectGradingRuleIndex = -1;
  }

  deleteDefectGradingRule() {
    if (this.deleteDefectGradingRuleIndex === -1) return;
    const updatedRules = [...this.defectGradingRulesData];
    updatedRules.splice(this.deleteDefectGradingRuleIndex, 1);
    this.saveDefectGradingConfig(updatedRules, 'deleted_successfully');
    this.closeDeleteModalForDefectGrading();
  }

  cancelDefectGrading() {
    this.showDefectGradingList = false;
  }
}
