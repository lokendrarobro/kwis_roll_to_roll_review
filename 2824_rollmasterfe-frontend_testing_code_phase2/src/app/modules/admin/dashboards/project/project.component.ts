import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  ChangeDetectorRef,
  inject,
  Input,
  HostListener,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { Router } from "@angular/router";
import { forkJoin, Subject, takeUntil } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { ProjectService } from "app/modules/admin/dashboards/project/project.service";
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
} from "@angular/forms";
import { RollsService } from "app/services/rolls.service";
import { DatePipe } from "@angular/common";
import { ToastrService } from "ngx-toastr";
import { timeout, catchError, tap , map, finalize } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import { AuthService } from "app/core/auth/auth.service";
import { NavigationMockApi } from "app/mock-api/common/navigation/api";
import { UserService } from "app/core/user/user.service";
import { firstValueFrom } from 'rxjs';
import { CommonService } from "app/services/common.service";
import { defaultFeatureActivityList } from "app/globalvariables/globalvariables";
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import dayjs from 'dayjs/esm';
import utc from 'dayjs/plugin/utc';
import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { TranslocoService } from "@ngneat/transloco";

dayjs.extend(utc);
const today = new Date();
const month = today.getMonth();
const year = today.getFullYear();
const firstDayOfLastMonth = new Date();
class DataTablesResponse {
  data: any = [];
  draw: number;
  recordsFiltered: number;
  recordsTotal: number;
}

type RecipeOption = {
  recipe: string;
};
@Component({
  selector: "project",
  templateUrl: "./project.component.html",
  styleUrls: ["./project.component.css"],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectComponent implements OnInit, OnDestroy {
  editRollId!: FormGroup;
  data: any = [];
  showLoading = false;
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  rolls_data: any = [];
  total_count: any = [];
  Role_data: any = [];
  startLimit: any = 0;
  rollId: any;
  optionsForUserTagstatus: { value: string; tag_id: number }[] = [
  ];
  endLimit: any = 1000;
  start_Date: any;
  end_Date: any;
  api_path: any;
  addUsertag: string = '';
  showModalfortag: boolean;
  selectedOption: string = ''; // Default selection set to first option
  selectedStatusOption: any = { value: '', viewValue: '', type: "" };
  options = [
    { value: 'Live', viewValue: 'Live' },
    { value: 'ARCHIVE', viewValue: 'Archive' },
    { value: 'BACKUP', viewValue: 'Backup' },
    { value: 'BACKUP AVALIABLE', viewValue: 'Backup Available' },
    { value: 'BACKUP DELETED', viewValue: 'Backup Deleted' },
    { value: 'JOB RESTORED', viewValue: 'Job Restored' },

  ];
  selectedOptionforUserTag: string = '';
  mergedOptions: {
    type: any; value: string; viewValue: string
  }[] = [

    ];
  optionsForUserTag: {
    user_tag_id: any;
    id: any; value: string; tag_name: string
  }[] = [

    ];

  selectedTypeSingle: string = '';
  showAdvancedFilters = false;
  recipeList: any[] = [];

  advancedFilters: any = {
    rollStatus: '', 
    dataStatus: '',
    tagQuery: '',
    tagSelected: ''
  };

  userTagForm: FormGroup

  robro_roll_id: any;
  status: any;
  tag_name: string;
  toggleShowRecords = false;
  showModal: boolean;
  rollName: any;
  rollNameError: string = "";
  roRollId: any;
  showMenu: boolean = false;
  itemIndex: number;
  isPopupOpen: boolean = false;
  note: string = '';
  isNoteTooLong: boolean = false;
  private fb = inject(FormBuilder);
  showDeleteModal: boolean;
  userRole: string;
  selectedRollData: any
  delete_roll: string
  errorDeleteRoll: string
  machineIds: any = [];
  machineData: any = JSON.parse(localStorage.getItem('machineData'))
  machine_id: any;
  machineDropdownList: any[] = [];
  machineDropdownSettings: any = {
    singleSelection: false,
    idField: 'id',
    textField: 'name',
    selectAllText: 'Select All',
    unSelectAllText: 'UnSelect All',
    itemsShowLimit: 5,
    allowSearchFilter: true,
    enableCheckAll: false
  };
  @Input() featurePermissions: any[] = [];
  module_id: any = 1;
  loggedInRole: any = localStorage.getItem('role_id');
  changeMasterStatus: boolean = false;
  editRollIdStatus: boolean = false;
  applyFilterStatus: boolean = false;
  add_editNoteStatus: boolean = false;
  add_editUserTagStatus: boolean = false;
  rollListDetailsStatus: boolean = false;
  deleteRollStauts: boolean = false;
  tagDropdownSettings: NgMultiSelectDropDownModule = {};
  tagDropdownList: any = [];
  selected: { startDate: dayjs.Dayjs; endDate: dayjs.Dayjs };
  // Recipe dropdown variables (now dynamic)
  recipeNames: RecipeOption[] = [];
  selectedRecipe: string = '';

  recoverID: any;
  showRefreshPopup: boolean = false;
  previous_machine_id: any = localStorage.getItem('machine_id') || 1; // Default to 1 if not set
  selectedMachines: any = [];
  apiPaths: any[] = []
  defaultMachineData: any = [];
  masterMachineData: any = JSON.parse(localStorage.getItem('master_machine_data'));
  showColumnModulePopup: boolean = false;
  reportConfigList: any = [];
  reportConfigIndex: any = 0;
  languageList: any = [];
  showInspectionCountStatus: boolean = false;
  showReviewInprogressCountStatus: boolean = false;
  showReviewCountStatus: boolean = false;
  showRepairCountStatus: boolean = false;
  showHalfRepairCountStatus: boolean = false;
  exportReportStatus: boolean = false;
  allColumnNameArray = [
    {
      report_type: "roll_details",
      column_name: [
        { name: 'Roll Number', key: 'roll_number', checked: true },
        { name: 'GSM', key: 'gsm', checked: true },
        { name: 'Width', key: 'width', checked: true },
        { name: 'Roll Length', key: 'roll_length', checked: true },
        { name: 'Loom Number', key: 'loom_number', checked: true },
        { name: 'Status of Roll', key: 'status_of_roll', checked: true },
        { name: 'Data Status', key: 'data_status', checked: true }
      ]
    },
    {
      report_type: "inspection_details",
      column_name: [
        { name: 'Master Start Date/Time', key: 'master_start_datetime', checked: true },
        { name: 'Master Start Date', key: 'master_start_date', checked: true },
        { name: 'Master Start Time', key: 'master_start_time', checked: true },
        { name: 'Master End Date/Time', key: 'master_end_datetime', checked: true },
        { name: 'Master End Date', key: 'master_end_date', checked: true },
        { name: 'Master End Time', key: 'master_end_time', checked: true },
        { name: 'Inspected Length (M)', key: 'inspected_length_m', checked: true },
        { name: 'Total Inspection Time(Min)', key: 'total_inspection_time_min', checked: true },
        { name: 'Master Machine ID', key: 'master_machine_id', checked: true },
        { name: 'Corrected Avg Master Speed', key: 'corrected_avg_master_speed', checked: true },
        { name: 'Average Master Speed (mpm)', key: 'average_master_speed_mpm', checked: true },
        { name: 'Total Defects Inspected', key: 'total_defects_inspected', checked: true },
        { name: 'Avg defects per 1000 meter', key: 'avg_defects_per_1000_meter', checked: true }
      ]
    },
    {
      report_type: "review_details",
      column_name: [
        { name: 'Review Start Date/Time', key: 'review_start_datetime', checked: true },
        { name: 'Review Start Date', key: 'review_start_date', checked: true },
        { name: 'Review Start Time', key: 'review_start_time', checked: true },
        { name: 'Review End Date/Time', key: 'review_end_datetime', checked: true },
        { name: 'Review End Date', key: 'review_end_date', checked: true },
        { name: 'Review End Time', key: 'review_end_time', checked: true },
        { name: 'Total Review Time (Min)', key: 'total_review_time_min', checked: true },
        { name: 'Total defects deleted during Review', key: 'total_defects_deleted_during_review', checked: true },
        { name: 'AI Agent Feedback Count', key: 'review_agent_feedback_count', checked:true }
      ]
    },
    {
      report_type: "repair_details",
      column_name: [
        { name: 'Repair Machine ID', key: 'repair_machine_id', checked: true },
        { name: 'Repair Start Date/Time', key: 'repair_start_datetime', checked: true },
        { name: 'Repair Start Date', key: 'repair_start_date', checked: true },
        { name: 'Repair Start Time', key: 'repair_start_time', checked: true },
        { name: 'Repair End Date/Time', key: 'repair_end_datetime', checked: true },
        { name: 'Repair End Date', key: 'repair_end_date', checked: true },
        { name: 'Repair End Time', key: 'repair_end_time', checked: true },
        { name: 'Repair Time Taken (min)', key: 'repair_time_taken_min', checked: true },
        { name: 'Repair meter', key: 'repair_meter', checked: true },
        { name: 'Average Repair Speed (mpm)', key: 'average_repair_speed_mpm', checked: true },
        { name: 'Total defects approved for repair', key: 'total_defects_approved_for_repair', checked: true },
        { name: 'Total Defects Repaired', key: 'defects_actually_repaired', checked: true },
        { name: 'Total Defects Override', key: 'defects_actually_override', checked:true },
        { name: 'Number of Splices done', key: 'number_of_splices_done', checked: true },
        { name: 'Length removed during splicing (M)', key: 'length_removed_during_splicing_m', checked: true }
      ]
    },
    {
      report_type: "defects_summary",
      column_name: [
        { name: 'Category Wise Defect Count', key: 'category_wise_defect_count', checked: true },
        { name: 'Enable defects', key: 'enable_defects', checked: true },
        { name: 'Disable defects', key: 'disable_defects', checked: true }
      ]
    },
    {
      report_type: "body_details",
      column_name: [
        { name: 'Primary Body', key: 'primary_body', checked: true },
        { name: 'Secondary Body', key: 'secondary_body', checked: true },
        { name: 'Tertiary Body', key: 'tertiary_body', checked: true },
        { name: 'Wastage Information', key: 'wastage_information', checked: true }
      ]
    },
    {
      report_type: "loom_report_data",
      column_name: [
        { name: 'Loom ID', key: 'loom_id', checked:true },
        { name: 'Total Rolls', key: 'total_rolls', checked:true },
        { name: 'Total Length', key: 'total_length', checked:true },
        { name: 'Total Defects', key: 'total_defects', checked:true },
        { name: 'Total Wastage (KG)', key: 'total_wastage_kg', checked:true },
        { name: 'Category Wise Defect Count', key: 'category_wise_defect_count', checked:true }
      ]
    },
    {
      report_type: "defects_details",
      column_name: [
        { name: 'Defect Type', key: 'defect_type',  checked:true },
        { name: 'Location X(CM)', key: 'location_x',  checked:true },
        { name: 'Location Y(M)', key: 'location_y',  checked:true },
        { name: 'Widht(MM)', key: 'width_mm',  checked:true },
        { name: 'Height(MM)', key: 'height_mm',  checked:true },
        { name: 'Operator Action', key: 'operator_action',  checked:true }
      ]
    },
    {
      report_type: "usage_report_data",
      column_name: [
        { name: 'Date', key: 'date', checked:true },
        { name: 'Machine ID', key: 'machine_id', checked:true },
        { name: 'Machine On Hours', key: 'machine_on_hours', checked:true },
        { name: 'Machine Off Hours', key: 'machine_off_hours', checked:true },
        { name: 'Engaged Hours', key: 'engaged_hours', checked:true },
        { name: 'Average Speed (MPM)', key: 'average_speed_mpm', checked:true }
      ]
    }
  ]
  exportButtonDisabled: boolean = false;

  // Reference to the menu
  @ViewChild('menuRef') menuRef!: ElementRef;

  constructor(
    private _projectService: ProjectService,
    private _router: Router,
    private http: HttpClient,
    private RollsService: RollsService,
    private datePipe: DatePipe,
    private toastrService: ToastrService,
    private cdr: ChangeDetectorRef,
    private _authService: AuthService,
    private navigationMockApi: NavigationMockApi,
    private _UserService: UserService,
    private commonService: CommonService,
    private translocoService: TranslocoService
  ) {
    this.editRollId = this.fb.group({
      rollIdNew: ["", [Validators.required]],
    });
    this.navigationMockApi.callNavbarPermission();
    localStorage.removeItem('api_path');
    // this.RollsService.get_api_path();
  }
  preventSpecialChars(event: KeyboardEvent) {
    const regex = /^[a-zA-Z0-9\/]*$/; // Only letters and numbers allowed
    const inputChar = String.fromCharCode(event.keyCode);

    if (!regex.test(inputChar)) {
      event.preventDefault(); // Block the character from appearing in the input
    }
  }
  dtOptionsList: DataTables.Settings = {};
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject<any>();

  ngOnInit(): void {
    this.updateOptionsAndSettings();
    this.defineUserTag();
    this.fetchUserTags();
    // this.fetchAllRecipes(); // Fetch recipes on init
    this.getReportConfiguration();
    this.getLanguageConfiguration();
    this.getlanguageChange();

    setTimeout(() => {
      this.loggedInRole = localStorage.getItem('role_id');
      if (this.module_id && this.loggedInRole) {
        this.getAllFeaturePermission(this.module_id, this.loggedInRole);
      }
    }, 100);
    localStorage.removeItem("roll_id");
    localStorage.removeItem("total_defect_count");
    localStorage.removeItem("inspected_length");
    this.machine_id = localStorage.getItem("machine_id")
    const machineData = JSON.parse(localStorage.getItem('selectMachine'))
    if(machineData)
    this.selectedMachines = machineData

    // Get the data
    const storedStartDate = localStorage.getItem("start_date");
    const storedEndDate = localStorage.getItem("end_date");

    if (storedStartDate && storedEndDate) {
      this.start_Date = storedStartDate;
      this.end_Date = storedEndDate;
      this.selected = {
        startDate: dayjs(this.start_Date),
        endDate: dayjs(this.end_Date)
      };
      this.campaignOne.setValue({
        start: new Date(this.start_Date),
        end: new Date(this.end_Date),
      });
    } else {
      const todayStart = dayjs().startOf('day');
      const todayEnd = dayjs().endOf('day');
      // Default to the last month's range if no stored date range is found
      this.start_Date = this.datePipe.transform(new Date(firstDayOfLastMonth), "yyyy/MM/dd");
      this.end_Date = this.datePipe.transform(new Date(), "yyyy/MM/dd");

      this.selected = {
        startDate: todayStart,
        endDate: todayEnd
      };
      this.campaignOne.setValue({
        start: new Date(firstDayOfLastMonth),
        end: new Date(),
      });
    }
    this._projectService.data$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((data) => {
      });
    if (this.campaignOne.valid) {
      this.start_Date = this.datePipe.transform(
        this.campaignOne.value.start,
        "yyyy/MM/dd"
      );
      this.end_Date = this.datePipe.transform(
        this.campaignOne.value.end,
        "yyyy/MM/dd"
      );
    }
    this.machineIds = this.machineData
    const machineDataIndex = this.machineData.findIndex((machine: any) => machine.master_machine_status === 1);
    if (machineDataIndex !== -1) {
      this.machineIds[machineDataIndex]['name'] = `${this.machineData[machineDataIndex].name}`;
    }
    this.machineDropdownList = this.machineIds;
    this.dataTableForRoll();
    
    this.selectedMachines.forEach((selectedMachine: any, index: number) => {

          const machineData = this.machineData.find(
            (data: any) => data.id === selectedMachine.id
          );
          if (!machineData) return;

          const api_path = `${(window as any).__env.hypertext}${machineData.ip}${machineData.port}api/`;

          this.apiPaths.push({
            machine_id: machineData.id,
            api_path: api_path
          });
        })
  }

  updateOptionsAndSettings() {
    this.options = [
      { value: 'Live', viewValue: this.translocoService.translate('live') },
      { value: 'ARCHIVE', viewValue: this.translocoService.translate('archive') },
      { value: 'BACKUP', viewValue: this.translocoService.translate('backup') },
      { value: 'BACKUP AVALIABLE', viewValue: this.translocoService.translate('backup_available') },
      { value: 'BACKUP DELETED', viewValue: this.translocoService.translate('backup_deleted') },
      { value: 'JOB RESTORED', viewValue: this.translocoService.translate('job_restored') },
    ];

    this.machineDropdownSettings = {
      ...this.machineDropdownSettings,
      selectAllText: this.translocoService.translate('select_all'),
      unSelectAllText: this.translocoService.translate('unselect_all'),
    };

    this.tagDropdownSettings = {
      singleSelection: false,
      idField: 'item_id',
      textField: 'item_text',
      selectAllText: this.translocoService.translate('select_all'),
      unSelectAllText: this.translocoService.translate('unselect_all'),
      itemsShowLimit: 5,
      allowSearchFilter: true
    };
  }

  defineUserTag() {
    this.userTagForm = this.fb.group({
      selectedOptionfortag: [[
        { item_id: 1, item_text: this.translocoService.translate('repair_needed') },
        { item_id: 2, item_text: this.translocoService.translate('critical_defect') },
        { item_id: 3, item_text: this.translocoService.translate('surface_issue') },
        { item_id: 4, item_text: this.translocoService.translate('color_mismatch') },
        { item_id: 5, item_text: this.translocoService.translate('minor_scratch') },
        { item_id: 6, item_text: this.translocoService.translate('edge_tear') }
      ]]
    });
  }
  onSubmit() {

    if (this.userTagForm.valid) {
      const userTag = this.userTagForm.value.selectedOptionfortag.map(item => item.item_id);
      const payload = { robro_roll_id: this.robro_roll_id, newTagIds: userTag };

      this.RollsService.saveUserTag(payload).subscribe({
        next: (response: any) => {
          if (response.status === true) {
            this.showModalfortag = false;
            this.defineUserTag();
            // this.data = []
            this.applyFilter();
            const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 5 && item.module_id === 1);
            if (activityObject) {
              this.commonService.addActivityLog(activityObject)
            }
            this.cdr.detectChanges();
          }

        },
        error: (error) => {
          console.error("Error:", error);
        },

      });
    }
  }

  get_api_path() {
    this.RollsService.backend_api_variables.subscribe((data: any) => {
      if (!data) return;
      if (this.selectedMachines.length == 0) {
        // Find the machine from the dropdown list by matching id or name
        const selectedMachine = this.machineDropdownList.find(
          (m: any) => m.name == data.machine_name || m.id == data.machine_id
        );

        if (selectedMachine) {
          this.defaultMachineData = selectedMachine;
          // Set as selected — this will automatically mark it as checked in the dropdown
          this.selectedMachines = [selectedMachine];
          localStorage.setItem("selectMachine", JSON.stringify(this.selectedMachines))
          // Construct the API path
          this.api_path = `${(window as any).__env.hypertext}${data.machine_ip}${data.machine_port}api/`;
          this.RollsService.full_api_path.next(this.api_path);
          this.apiPaths.push({
            machine_id: data.machine_id,
            api_path: this.api_path
          });
        } else {
          console.warn("Machine not found in dropdown list");
          this.selectedMachines = [];
        }
      }
      else if (this.selectedMachines.length > 0 && localStorage.getItem('selectMachine')) {
        localStorage.setItem("selectMachine", JSON.stringify(this.selectedMachines))
        const selectedMachine = this.machineDropdownList.find(
          (m: any) => m.name == this.selectedMachines[0]?.name || m.id == this.selectedMachines[0]?.id);
        if (selectedMachine) {
          this.defaultMachineData = selectedMachine
        }
      }
      else {
        const selectedMachine = this.machineDropdownList.find(
          (m: any) => m.name == this.selectedMachines[0]?.name || m.id == this.selectedMachines[0]?.id);
        if (selectedMachine) {
          this.defaultMachineData = selectedMachine;
          // Set as selected — this will automatically mark it as checked in the dropdown
          this.selectedMachines = [selectedMachine];
          localStorage.setItem("selectMachine", JSON.stringify(this.selectedMachines))
          // Construct the API path
          this.api_path = `${(window as any).__env.hypertext}${data.machine_ip}${data.machine_port}api/`;
          this.RollsService.full_api_path.next(this.api_path);
        } else {
          console.warn("Machine not found in dropdown list");
          this.selectedMachines = [];
        }
      }
      this.cdr.detectChanges()
    });

    this.RollsService.user_role.subscribe((data) => (this.userRole = data));
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
            ...this.options.map(opt => ({ value: opt.value, viewValue: opt.viewValue, type: 'status' }))
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

  private normalizeRecipes(recipes: any[]): RecipeOption[] {
    if (!Array.isArray(recipes)) {
      return [];
    }

    const uniqueRecipes = Array.from(
      new Set(
        recipes
          .map((item: any) => {
            if (typeof item === 'string') {
              return item.trim();
            }

            if (item && typeof item.recipe === 'string') {
              return item.recipe.trim();
            }

            return '';
          })
          .filter((recipe: string) => recipe !== '')
      )
    );

    return uniqueRecipes.map((recipe: string) => ({ recipe }));
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Track by function for ngFor loops
   *
   * @param index
   * @param item
   */
  trackByFn(index: number, item: any): any {
    return item.id || index;
  }

  campaignOne = new FormGroup({
    start: new FormControl(new Date(firstDayOfLastMonth), Validators.required),
    end: new FormControl(new Date(), Validators.required),
  });
  campaignTwo = new FormGroup({
    start: new FormControl(new Date(year, month, 15)),
    end: new FormControl(new Date(year, month, 19)),
  });

  onDateRangeChange(event: any) {
    if (event && event.startDate && event.endDate) {
      this.selected = event;

      // Format selected date/time exactly as user picked
      const formattedStart = dayjs(event.startDate).format("YYYY/MM/DD HH:mm:ss");
      const formattedEnd = dayjs(event.endDate).format("YYYY/MM/DD HH:mm:ss");

      this.start_Date = formattedStart;
      this.end_Date = formattedEnd;

      // Now safely convert to Date (parsed from formatted string to avoid shift)
      this.campaignOne.setValue({
        start: dayjs(formattedStart, "YYYY/MM/DD HH:mm:ss").toDate(),
        end: dayjs(formattedEnd, "YYYY/MM/DD HH:mm:ss").toDate()
      });
    }
  }

  applyFilter() {
    if (this.campaignOne.valid) {
      this.start_Date = dayjs(this.campaignOne.value.start).format("YYYY/MM/DD HH:mm:ss");
      this.end_Date = dayjs(this.campaignOne.value.end).format("YYYY/MM/DD HH:mm:ss");

      localStorage.setItem("start_date", this.start_Date);
      localStorage.setItem("end_date", this.end_Date);
    }

    // Store selected recipe for persistence (optional)
    localStorage.setItem("selectedRecipe", this.selectedRecipe);

    this.toggleShowRecords = false;
    $("#example").DataTable().draw();

    const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 2 && item.module_id === 1);
    if (activityObject) {
      this.commonService.addActivityLog(activityObject);
    }
  }

  async redirect_to(robro_roll_id, defect_count,api_path) {
    // added activity log
    const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 7 && item.module_id === 1);
    if (activityObject) {
      this.commonService.addActivityLog(activityObject)
    }
    try {
      // Get role permissions and roles in parallel
      const [rolePermissions, roles] = await Promise.all([
        firstValueFrom(this._UserService.rolePermissions$),
        firstValueFrom(this._UserService.roles$)
      ]);

      const matchedRole = roles.find(role =>
        role.role_name === localStorage.getItem('role').toLowerCase()
      );
      const roleId = matchedRole ? Number(matchedRole.role_id) : null;
      const navbar_permissions = rolePermissions[roleId] || [];

      const permission_module = navbar_permissions.find(
        module => module.module_id == 2
      );

      if (!permission_module) {
        this.toastrService.error("User not allowed to see this module", this.translocoService.translate('error'));
        return; // This now properly stops further execution
      }
      localStorage.setItem("api_path",api_path)
      this.RollsService.refreshApiPath();
      const data = {
        robro_roll_id: robro_roll_id
      }
      this.RollsService.getRollstatus(data).subscribe(
        (response) => {
        },
        (error) => {

        }
      )
      this.RollsService.show();
      localStorage.setItem("robro_roll_id", robro_roll_id);
      localStorage.setItem("roll_id", robro_roll_id);
      localStorage.setItem("total_defect_count", defect_count);
      this.rollId = robro_roll_id;
      this.RollsService.hide();
      this._router.navigate(["/roll-details"]);
    } catch (error) {
      console.error("Error during redirect_to flow:", error);
      this.RollsService.hide();
    }
  }
  ngAfterViewInit() {
      this.get_api_path();
      this.dataTableForRoll();
  }
  selectAll: boolean = false;
  secondLoaderStatus: any = false;
  getLoaderState11(){
    return this.RollsService.loaderState;
  }
  triggerRecover() {
    let arraysOfIds = [this.recoverID]
    let condition = {
      jobId: this.recoverID
    }

    if (arraysOfIds.length > 0) {
      this.RollsService.show();
      this.showRefreshPopup = false;
      this.secondLoaderStatus = true;
      this.RollsService.restoreJob(condition).subscribe({
        next: (res: any) => {
          this.secondLoaderStatus = false;
          this.showRefreshPopup = false;
          this.RollsService.hide();
          if (res.status) {
            this.toastrService.success(res.message, this.translocoService.translate('success'));
            // this.ngOnInit();
            // this.data = [];
            this.applyFilter();
            // this.dataTableForRoll();
          } else {
            this.toastrService.error(`Error: ${res.message}`, this.translocoService.translate('error'));
          }
        },
        error: (error) => {
          this.secondLoaderStatus = false;
          this.showRefreshPopup = false;
          this.RollsService.hide();
          this.toastrService.error(this.translocoService.translate('restore_failed'), this.translocoService.translate('error'));
        }
      });
    } else {
      this.toastrService.error(this.translocoService.translate('please_select_roll'), this.translocoService.translate('error'));
    }
  }
  
  dataTableForRoll() {
    const table = $('#example').DataTable();
    if (table) {
      table.clear().destroy();
    }

    this.dtOptionsList = {
      pagingType: 'full_numbers',
      pageLength: 50,
      lengthMenu: [25, 50, 100, 150],
      order: [[1, 'asc']],
      serverSide: true,
      processing: true,
      searching: true,
      // Debouncing search input to avoind firing one ajax request per keystroke (500ms)
      searchDelay: 1000,
      // Optional: enable DataTables smart search behavior
      search: { smart: true },
      columns: [
        { data: 'robro_roll_id', orderable: false },
        { data: 'customer_roll_id' },
        { data: 'roll_start_time' },
        { data: 'roll_end_time', orderable: false },
        { data: 'inspected_length' },
        { data: 'enable_defects_count' },
        { data: 'gsm' },
        { data: 'width' },
        { data: 'robro_roll_id' },
        { data: 'roll_status' },
        { data: 'backup_status', orderable: false },
        { data: 'tag_names', orderable: false }
      ],

      ajax: (dataTablesParameters: any, callback) => {

        this.RollsService.show();

        if (!this.apiPaths?.length) {
          callback({
            draw: dataTablesParameters.draw,
            recordsTotal: 0,
            recordsFiltered: 0,
            data: []
          });
          this.RollsService.hide();
          return;
        }

        /* ================= BASE PARAMS ================= */
        const baseParams = {
          roll_id: this.rollId,
          start_date: this.start_Date,
          end_date: this.end_Date,
          rollStatus: this.advancedFilters.rollStatus,
          data_status: this.advancedFilters.dataStatus,
          tag_name: this.advancedFilters.tagSelected,
          recipe: this.selectedRecipe,
          search: dataTablesParameters.search || '',
          order: dataTablesParameters.order,
          columns: dataTablesParameters.columns
        };

        /* =====================================================
          STEP 1 : FETCH TOTAL COUNTS
        ====================================================== */

        let filteredRecords = 0;
        let totalRecords = 0;
        const additionalRequests = this.apiPaths.map((path: any) =>
          this.http
            .post(`${path.api_path}get_additional_roll_data`, baseParams)
            .pipe(catchError(() => of(null)))
        );

        forkJoin(additionalRequests).subscribe({

          next: (additionalResponses: any[]) => {

            const TotalCountPerRoll: number[] = [];
            const filteredRecordsPerRoll: number[] = [];
            const allRecipes: any[] = [];

            this.total_count = {
              roll_repair: 0,
              roll_review: 0,
              roll_half_repair: 0,
              rolls_count: 0,
              roll_inspected: 0,
              roll_review_inprogress:0
            };

            additionalResponses.forEach((res: any) => {
              const t = res?.TotalCount?.[0];

              const count = t?.rolls_count || 0;
              TotalCountPerRoll.push(count);

              const filteredCount = t.filterRecords || 0;
              filteredRecordsPerRoll.push(filteredCount);
              if (!t) return;
              // filteredRecords += res.filterRecords ||  0;
              totalRecords += t.rolls_count || 0;
              filteredRecords += t.filterRecords || 0;
              this.total_count.roll_repair += t.roll_repair || 0;
              this.total_count.roll_review += t.roll_review || 0;
              this.total_count.roll_half_repair += t.roll_half_repair || 0;
              this.total_count.rolls_count += t.rolls_count || 0;
              this.total_count.roll_inspected += t.roll_inspected || 0;
              this.total_count.roll_review_inprogress+= t.roll_review_inprogress || 0;
              allRecipes.push(...(t?.recipes || []));
            });
            this.recipeNames = this.normalizeRecipes(allRecipes);
            this.cdr.detectChanges();

            /* =====================================================
              STEP 2: GLOBAL PAGINATION LOGIC
            ====================================================== */

            let globalStart = dataTablesParameters.start;
            let remaining = dataTablesParameters.length;

            const primaryRequests = this.apiPaths.map((path: any, index: number) => {

              const rollTotal = filteredRecordsPerRoll[index] || 0;

              if (globalStart >= rollTotal) {
                globalStart -= rollTotal;
                return of({ data: [] });
              }

              if (remaining <= 0) {
                return of({ data: [] });
              }

              const minNumber = globalStart;
              const take = Math.min(rollTotal - globalStart, remaining);
              const maxNumber = minNumber + take;

              globalStart = 0;
              remaining -= take;

              const params = {
                ...baseParams,
                minNumber,
                maxNumber
              };

              return this.http
                .post(`${path.api_path}get_primary_roll_data`, params)
                .pipe(catchError(() => of({ data: [] })));
            });

            forkJoin(primaryRequests).subscribe({

              next: (primaryResponses: any[]) => {
                const allData = primaryResponses.flatMap((resp: any, index: number) => {
                  
                  return (resp?.data || []).map((row: any) => ({
                    ...row,
                    api_path: this.apiPaths[index].api_path
                  }));
                });
                this.data = allData;
                callback({
                  draw: dataTablesParameters.draw,
                  recordsTotal: totalRecords,
                  recordsFiltered: filteredRecords,
                  // data: allData
                });

                this.RollsService.hide();
              },

              error: () => {
                this.RollsService.hide();
                callback({
                  draw: dataTablesParameters.draw,
                  recordsTotal: 0,
                  recordsFiltered: 0,
                  data: []
                });
              }
            });
          },

          error: () => {
            this.RollsService.hide();
            callback({
              draw: dataTablesParameters.draw,
              recordsTotal: 0,
              recordsFiltered: 0,
              data: []
            });
          }
        });
      }

      
    };
  }

  getLoaderState() {
    return this.RollsService.loaderState;
  }

  get_user_for_edit(data) {
    this.showModal = true;
    this.roRollId = data.robro_roll_id;
  }
  add_user_tag(data) {
    if (data && data.tag_names) {
      let tag_names = data.tag_names;
      let tagArray: string[] = [];

      if (tag_names) {
        // Split, trim, and convert to lowercase for case-insensitive comparison
        tagArray = tag_names.split(',').map(t => t.trim().toLowerCase());
      }
      const selectedOptionfortag = this.tagDropdownList.filter(item => {
        // Compare item_text (tag name) in lowercase
        return tagArray.includes(item.item_text.toLowerCase());
      });
      this.userTagForm.patchValue({ selectedOptionfortag: selectedOptionfortag });
    } else {
      this.userTagForm.patchValue({ selectedOptionfortag: '' }); // No default 'critical'
    }
    this.showModalfortag = true;
  }

  // Function to handle validation on input change
  onRollNameChange() {
    // If the field is empty, show "Please enter a roll name"
    if (!this.rollName || this.rollName.trim() === "") {
      this.rollNameError = this.translocoService.translate('please_enter_roll_id');
    }
    // If the input length is less than 4 characters, show an error
    else if (this.rollName.length < 4) {
      this.rollNameError = this.translocoService.translate('roll_id_min_chars');
    }
    // If the input is valid, clear the error
    else {
      this.rollNameError = "";
    }
  }

  save() {
    // Skip the save if there's a validation error
    if (!this.rollName || this.rollName.trim() === "") {
      this.rollNameError = this.translocoService.translate('please_enter_roll_id');
    }
    // If the input length is less than 4 characters, show an error
    else if (this.rollName.length < 4) {
      this.rollNameError = this.translocoService.translate('roll_id_min_chars');
    } else {
      const payload = {
        robro_roll_id: this.roRollId,
        customer_roll_id: this.rollName,
      };

      this.RollsService.addRollIdName(payload).subscribe((response: any) => {
        if (response.status === true) {
          // this.data = [];
          this.applyFilter();
          // added activity log
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 3 && item.module_id === 1);
          if (activityObject) {
            this.commonService.addActivityLog(activityObject)
          }
          this.rollName = "";
          this.showModal = false; // Close modal after successful API call
        }
      });
    }
  }

  clear() {
    this.rollName = "";
    this.rollNameError = "";
  }

  toggleMenu(i, data) {
    localStorage.setItem("robro_roll_id", data?.robro_roll_id)
    this.robro_roll_id = data?.robro_roll_id;
    this.itemIndex = i;
    this.showMenu = !this.showMenu;

  }
  openNotePopup(robro_roll_id) {
    this.isPopupOpen = true;
    this.note = '';
    this.RollsService.get_notes(robro_roll_id).subscribe(
      (response: any) => {
        if (response.status) {
          this.note = response.data.note;
          this.cdr.detectChanges();
        }
      },
      (error) => {
        console.error('Error fetching note:', error);
        this.toastrService.error(this.translocoService.translate('error_fetching_note'), this.translocoService.translate('error'));
      }
    );
  }
  // close note opoup
  closeNotePopup() {
    this.isPopupOpen = false;
  }

  // save note function
  saveNote() {
    if (this.isNoteTooLong) {
      return;
    }

    const data = {
      robro_roll_id: localStorage.getItem("robro_roll_id"),
      note: this.note
    };

    this.RollsService.add_notes(data).subscribe(
      (response: any) => {
        this.note = '';
        this.toastrService.success(this.translocoService.translate('note_saved_success'), this.translocoService.translate('success'));
        // added activity log
        const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 4 && item.module_id === 1);
        if (activityObject) {
          this.commonService.addActivityLog(activityObject)
        }
      },
      (error) => {
        console.error('Error saving note:', error);
        this.toastrService.error(this.translocoService.translate('error_saving_note'), this.translocoService.translate('error'));
      }
    );

    this.closeNotePopup();
  }

  // remove error if note is not empty
  updateNoteValidation() {
    this.isNoteTooLong = this.note.length > 5000;
  }
  deleteRoll(data) {
    this.showDeleteModal = true;
    this.selectedRollData = data
  }
  delete_this_roll() {
    if (this.delete_roll !== "DELETE") {
      this.errorDeleteRoll = this.translocoService.translate('please_enter_delete');
      return;
    }
    this.showDeleteModal = false
    this.RollsService.deleteRollAndDataById({ robro_roll_id: this.selectedRollData.robro_roll_id, customer_roll_id: this.selectedRollData.customer_roll_id }).subscribe((response: any) => {
      if (response.status === true) {
        this.delete_roll = "";
        this.errorDeleteRoll = ""
        this.toastrService.success(this.translocoService.translate('roll_deleted_success'), this.translocoService.translate('success'));
        // this.data = []
        this.applyFilter();
        // added activity log
        const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 6 && item.module_id === 1);
        if (activityObject) {
          this.commonService.addActivityLog(activityObject)
        }
      }
    })
  }
  setMachineData(event?: any) {
    Promise.resolve().then(() => {
      const selected: any = Array.isArray(this.selectedMachines) ? this.selectedMachines : [];

      if (!selected.length) {
        this.selectedMachines = this.defaultMachineData ? [this.defaultMachineData] : [];
        this.toastrService.warning(this.translocoService.translate('select_one_machine'), this.translocoService.translate('warning'));
        return;
      }
     
      if (selected.length > 1) {
        const last = selected[selected.length - 1];
        const machineId = Number(last);
        this.apiPaths = [];
        let connectedCount = 0;
        let failedCount = 0;
        let completedCount = 0;

        let connectedMachines: string[] = [];
        let failedMachines: string[] = [];
        const totalmachine = selected.length;
        selected.forEach((selectedMachine: any, index: number) => {
 
          const machineData = this.machineData.find(
            (data: any) => data.id === selectedMachine.id
          );
          if (!machineData) return;
 
          const api_path = `${(window as any).__env.hypertext}${machineData.ip}${machineData.port}api/`;

          this.apiPaths.push({
            machine_id: machineData.id,
            api_path: api_path
          });

          this.RollsService.connection_check(api_path)
            .pipe(
              timeout(1000),
              catchError((error) => {
                if (error.name === 'TimeoutError') {
                  return throwError(() => new Error("Timeout"));
                }
                return throwError(() => error);
              })
            )
            .subscribe(
              (response: any) => {
                if (response && response.message) {
                  connectedCount++;
                  connectedMachines.push(selectedMachine.name);
                }
              },
              (error: any) => {
                failedCount++;
                completedCount++;
                failedMachines.push(selectedMachine.name);


                // remove failed machine
                this.selectedMachines.splice(index, 1);
                this.selectedMachines = [...this.selectedMachines];
                this.apiPaths.splice(index,1);
                this.cdr.detectChanges();
                if (completedCount === totalmachine) {
                  // Build final message
                  // const successList = connectedMachines.length > 0
                  //   ? this.translocoService.translate('connected_machines_summary', { count: connectedMachines.length, machines: connectedMachines.join(', ') })
                  //   : this.translocoService.translate('connected_machines_zero');
 
                  // const failedList = failedMachines.length > 0
                  //   ? this.translocoService.translate('failed_machines_summary', { count: failedMachines.length, machines: failedMachines.join(', ') })
                  //   : '';
                  const successList =
                    connectedMachines.length > 0
                      ? `${this.translocoService.translate('connected')} (${connectedMachines.length}): ${connectedMachines.join(', ')}`
                      : this.translocoService.translate('connected_zero');

                  const failedList =
                    failedMachines.length > 0
                      ? `${this.translocoService.translate('failed')} (${failedMachines.length}): ${failedMachines.join(', ')}`
                      : '';

                  // FINAL SINGLE TOASTER
                  this.toastrService.success(
                    `${successList}\n
                    ${failedList}`,
                    this.translocoService.translate('machine_connection_summary'),
                    { enableHtml: true }
                  ); // Note: "Machine Connection Summary" is hardcoded in toastr title, can be translated if needed: this.translocoService.translate('machine_connection_summary')

                  // Save selected machines
                  localStorage.setItem("selectMachine", JSON.stringify(this.selectedMachines));

                  // apply filter only if any machine is connected
                  if (connectedCount > 0) {
                    this.applyFilter();
                  }
                }
              },
              () => {
                completedCount++;
                // When all machines done
                if (completedCount === totalmachine) {
                  // Build final message
                  // const successList = connectedMachines.length > 0
                  //   ? this.translocoService.translate('connected_machines_summary', { count: connectedMachines.length, machines: connectedMachines.join(', ') })
                  //   : this.translocoService.translate('connected_machines_zero');
 
                  // const failedList = failedMachines.length > 0
                  //   ? this.translocoService.translate('failed_machines_summary', { count: failedMachines.length, machines: failedMachines.join(', ') })
                  //   : '';
                  const successList =
                    connectedMachines.length > 0
                      ? `${this.translocoService.translate('connected')} (${connectedMachines.length}): ${connectedMachines.join(', ')}`
                      : this.translocoService.translate('connected_zero');

                  const failedList =
                    failedMachines.length > 0
                      ? `${this.translocoService.translate('failed')} (${failedMachines.length}): ${failedMachines.join(', ')}`
                      : '';

                  // FINAL SINGLE TOASTER
                  this.toastrService.success(
                    `${successList}\n
                    ${failedList}`,
                    this.translocoService.translate('machine_connection_summary'),
                    { enableHtml: true }
                  ); // this.translocoService.translate('machine_connection_summary')

                  // Save selected machines
                  localStorage.setItem("selectMachine", JSON.stringify(this.selectedMachines));

                  // apply filter only if any machine is connected
                  if (connectedCount > 0) {
                    this.applyFilter();
                  }
                }
              }
            );
        });

      }
      else if (selected.length === 1) {
        this.apiPaths = [];
        const selectedMachineId = (selected[0] && typeof selected[0] === 'object') ? selected[0].id : selected[0];
        const selectedMachine = this.machineIds.find((machine: any) => machine.id == selectedMachineId);
        this.selectedMachines = [selectedMachine];
        this.RollsService.backend_api_variables.next({
          machine_ip: selectedMachine.ip,
          machine_port: selectedMachine.port,
          machine_id: this.machine_id
        })
        if (selectedMachine) {
          localStorage.setItem('machine_ip', selectedMachine.ip);
          localStorage.setItem('machine_port', selectedMachine.port);
          localStorage.setItem('machine_id', this.machine_id);
          this.RollsService.backend_api_variables.next({
            machine_ip: selectedMachine.ip,
            machine_port: selectedMachine.port,
            machine_id: this.machine_id
          })
          const api_path = `${(window as any).__env.hypertext}${selectedMachine.ip}${selectedMachine.port}api/`;
          this.apiPaths.push({
            machine_id: selectedMachine.id,
            api_path: api_path
          });
          this.RollsService.connection_check(api_path).pipe(
            timeout(1000), // 5 seconds timeout
            catchError(error => {
              if (error.name === 'TimeoutError') {
                return throwError(() => new Error(`${this.translocoService.translate('system_not_connected_to')} ${selectedMachine.name}`));
              }
              return throwError(() => error);
            })
          ).subscribe(
            (response: any) => {
              if (response.message) {
                this.toastrService.success(`${this.translocoService.translate('system_connected_success')} ${selectedMachine.name}`, this.translocoService.translate('machine_connection_summary'));
                this.previous_machine_id = this.machine_id; // Update previous_machine_id
                // added activity log
                const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 1 && item.module_id === 1);
                if (activityObject) {
                  this.commonService.addActivityLog(activityObject)
                }
                // this.ngOnInit();

                // this.data = [];
                this.applyFilter();
              }
            },
            (error: any) => {
              this.toastrService.error(error.message || error, this.translocoService.translate('error'));
              const defaultMachine = this.machineIds.find((m: any) => m.id == this.previous_machine_id);
              if (defaultMachine) {
                this.machine_id = defaultMachine.id;
              }
            }
          );

        } else {
          console.error('Selected machine not found');
        }
      }

    });
  } 


  getAllFeaturePermission(module_id: number, role_id: number): void {
    const payload = { module_id, role_id };

    this.RollsService.getAllFeaturePermission(payload).pipe(
      tap(response => {
        this.featurePermissions = response?.data || [];
        this.setFeaturePermission(); // Call after featurePermissions is set
      }),
      catchError(error => {
        return of([]); // Prevent app crash on error
      })
    ).subscribe();
  }


  setFeaturePermission(): void {
    if (this.featurePermissions) {

      //  Convert all objects to arrays
      Object.keys(this.featurePermissions).forEach(key => {
        if (!Array.isArray(this.featurePermissions[key])) {
          this.featurePermissions[key] = Object.values(this.featurePermissions[key]);
        }
      });

      //  Now safe to loop
      for (const key in this.featurePermissions) {
        const featurePermissionsData = this.featurePermissions[key];

        if (Array.isArray(featurePermissionsData) && featurePermissionsData.length > 0) {
          this.changeMasterStatus = featurePermissionsData.some(f => f.feature_name === 'Change Master');
          this.editRollIdStatus = featurePermissionsData.some(f => f.feature_name === 'Edit Roll ID');
          this.applyFilterStatus = featurePermissionsData.some(f => f.feature_name === 'Apply Filter');
          this.add_editNoteStatus = featurePermissionsData.some(f => f.feature_name === 'Add/Edit Note');
          this.add_editUserTagStatus = featurePermissionsData.some(f => f.feature_name === 'Add/Edit User Tag');
          this.rollListDetailsStatus = featurePermissionsData.some(f => f.feature_name === 'Roll List Details');
          this.deleteRollStauts = featurePermissionsData.some(f => f.feature_name === 'Delete Roll');
          this.exportReportStatus = featurePermissionsData.some(f => f.feature_name === 'Export Report');
          this.showInspectionCountStatus = featurePermissionsData.some(f => f.feature_name === 'Show Count Rolls Inspected');
          this.showReviewInprogressCountStatus = featurePermissionsData.some(f => f.feature_name === 'Show Count Rolls Review Inprogress');
          this.showReviewCountStatus = featurePermissionsData.some(f => f.feature_name === 'Show Count Rolls Reviewed');
          this.showRepairCountStatus = featurePermissionsData.some(f => f.feature_name === 'Show Count Rolls Repaired');
          this.showHalfRepairCountStatus = featurePermissionsData.some(f => f.feature_name === 'Show Count Rolls Half-Repaired');
        }
      }
      this.cdr.detectChanges();
    }
  }

  setUserTags(user_tags: string): string {
    if (!user_tags) {
      return '';
    }

    const tagsArr = user_tags.split(',');

    return tagsArr
      .map(id => {
        const tag = this.optionsForUserTag.find(
          t => t.user_tag_id === Number(id.trim())
        );
        return tag ? tag.tag_name : '';
      })
      .filter(name => name !== '')
      .map(name =>
        `<span class="bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300 whitespace-nowrap mb-1">${name}</span>`
      )
      .join(' ');
  }

  // Fetch all recipes from backend and update recipeNames
  fetchAllRecipes() {
    this.RollsService.getAllRecipes().subscribe(
      (response) => {
        if (response.status && Array.isArray(response.data)) {
          this.recipeNames = this.normalizeRecipes(response.data);
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

  openRecoverPopup(id: any) {
    this.recoverID = id;
    this.showRefreshPopup = true
  }

  isHidden: boolean = false
  onClickMultiSelect() {
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    const clickedInside = this.menuRef?.nativeElement?.contains(event.target);
    if (!clickedInside) {
      this.showMenu = false;
    }
  }

  rangeLabel: string = 'This week';
  allRanges: any = {
    'Today': [
      dayjs().startOf('day'),     // 00:00:00
      dayjs().endOf('day')        // 23:59:59
    ],
    'Yesterday': [
      dayjs().subtract(1, 'day').startOf('day'),
      dayjs().subtract(1, 'day').endOf('day')
    ],
    'Last 7 Days': [
      dayjs().subtract(6, 'day').startOf('day'),
      dayjs().endOf('day')
    ],
    'Last 30 Days': [
      dayjs().subtract(29, 'day').startOf('day'),
      dayjs().endOf('day')
    ],
    'This Month': [
      dayjs().startOf('month').startOf('day'),
      dayjs().endOf('month').endOf('day')
    ],
    'Last Month': [
      dayjs().subtract(1, 'month').startOf('month').startOf('day'),
      dayjs().subtract(1, 'month').endOf('month').endOf('day')
    ],
    'Last 3 Months': [
      dayjs().subtract(3, 'month').startOf('month').startOf('day'),
      dayjs().subtract(1, 'month').endOf('month').endOf('day')
    ]
  };

  // ---- Add these methods to component class ----
  toggleAdvanced() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  onRecipeChange(event: any) {
    const recipeId = event.target.value;
    // handle recipe filter logic here
  }


  anyAdvancedSelected(): boolean {
    const af = this.advancedFilters || {};
    return !!(
      (af.rollStatus && af.rollStatus !== '') ||
      (af.dataStatus && af.dataStatus !== '') ||
      (this.selectedRecipe && this.selectedRecipe !== '') ||
      (af.tagSelected && af.tagSelected !== '')
    );
  }

  // clear all advanced filters
  clearAdvancedFilters() {
    // reset advancedFilters object
    this.advancedFilters = {
      rollStatus: '',
      dataStatus: '',
      tagSelected: ''
    };
    // reset recipe separately
    this.selectedRecipe = '';
    // If you store other advanced state, reset them here
    // hide the panel optionally
    this.showAdvancedFilters = false;
    // if you want to re-apply (refresh data)
    // this.data = [];
    this.applyFilter();
  }

  // clear a single chip
  removeChip(field: 'rollStatus' | 'dataStatus' | 'selectedRecipe' | 'tagSelected') {
    switch (field) {
      case 'rollStatus':
        this.advancedFilters.rollStatus = '';
        break;
      case 'dataStatus':
        this.advancedFilters.dataStatus = '';
        break;
      case 'selectedRecipe':
        this.selectedRecipe = '';
        break;
      case 'tagSelected':
        this.advancedFilters.tagSelected = '';
        break;
    }
    // Optionally re-fetch or apply filters after removal:
    // this.applyFilter();
  }

  // human readable labels for rollStatus values
  getRollStatusLabel(val: any): string {
    const map: Record<string, string> = {
      'null': this.translocoService.translate('inspected'),
      '1': this.translocoService.translate('review_inprogress'),
      '2': this.translocoService.translate('reviewed'),
      '3': this.translocoService.translate('half_repaired'),
      '4': this.translocoService.translate('repaired'),
      '': this.translocoService.translate('all_status')
    };
    return map[String(val)] || String(val);
  }

  // human readable for data status (uses mergedOptions array)
  getDataStatusLabel(value: any): string {
    const opt = (this.mergedOptions || []).find((o: any) => String(o.value) === String(value));
    return opt ? opt.viewValue : String(value);
  }

  // get text for tagSelected (map id -> item_text)
  getTagText(id: any): string {
    const tag = (this.tagDropdownList || []).find((t: any) => String(t.item_id) === String(id));
    return tag ? tag.item_text : String(id);
  }

  async createExcelSheet() {
    this.exportButtonDisabled = true; // Disable button to prevent multiple clicks
    let defaultReportConfig = false;
    let number_of_days ;
    let reportConfigData:{
      report_config_name: string,
      filters: object
    }
    let inspection_machine_id = [];
    let inspection_machine_ips = [];
    let inspection_machine_name = [];
    let apiPaths = [];
    number_of_days = this.getDaysBetween(this.start_Date, this.end_Date)
    if (!this.apiPaths || this.apiPaths.length === 0) {
      this.toastrService.error(this.translocoService.translate('no_connected_machines'), this.translocoService.translate('error'));
      return;
    }
    if(this.reportConfigList[this.reportConfigIndex].is_default){
      defaultReportConfig = true;
    }
    else{
      reportConfigData = this.reportConfigList[this.reportConfigIndex];
    }
    const apiPathArray = defaultReportConfig ? this.apiPaths : apiPaths;
    const requests = apiPathArray.map((data,index) => {
      const machineData = this.machineData.find(
        (data1: any) => data1.id == data.machine_id
      );
      inspection_machine_id.push(machineData?.id || null);
      inspection_machine_ips.push(machineData?.ip || null);
      inspection_machine_name.push(machineData?.name || null);
    });

    const payload = {
      report_config_name : defaultReportConfig ? "Default Excel Config" : reportConfigData?.report_config_name,
      filter: defaultReportConfig ? 
      {
        recipe: this.selectedRecipe || null,
        tag_name: this.advancedFilters.tagSelected || null,
        data_status: this.advancedFilters.dataStatus || null,
        roll_status: this.advancedFilters.rollStatus || null,
        number_of_days: number_of_days,
        column_name_array: this.allColumnNameArray,
        repair_machine_id: null,
        sorting_column_name: 'master_start_datetime',
        inspection_machine_id: inspection_machine_id,
        inspection_machine_ips: inspection_machine_ips,
        inspection_machine_name: inspection_machine_name
      } : reportConfigData?.filters || {},
      defaultReportConfig : defaultReportConfig,
      startDate : this.start_Date,
      endDate : this.end_Date
    }

    // Send the payload to the backend for processing
    this.RollsService.getExcelBinaryData(payload).subscribe({
      next: (response) => {
        const startFileDate = this.formatDateForFile(this.start_Date);
        const endFileDate = this.formatDateForFile(this.end_Date);
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = `period_${startFileDate}_to_${endFileDate}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toastrService.success(
          this.translocoService.translate('excel_merged_success'),
          this.translocoService.translate('success')
        );
        this.exportButtonDisabled = false; // Re-enable button after success
        this.showColumnModulePopup = false; // Close column module popup if open
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error generating Excel report:', error);
        this.toastrService.error(
          this.translocoService.translate('error_generating_excel_report'),
          this.translocoService.translate('error')
        );
        this.exportButtonDisabled = false; // Re-enable button on error
        this.showColumnModulePopup = false; // Close column module popup if open
        this.cdr.detectChanges();
      }
    });
  }

  // Helper: extract machine name from IP
  getMachineName(apiPath: string): string {
    const match = apiPath.match(/\/\/([^/:]+)/);
    return match ? match[1].replace(/\./g, '.') : this.translocoService.translate('machine_fallback');
  }

  formatDateForFile(dateStr: string) {
    const date = new Date(dateStr);

    const day = String(date.getDate()).padStart(2, "0");

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day}_${month}_${year}`;
  }

  showColumnModule(){
    this.showColumnModulePopup = true;
  }

  closeColumnModule(){
    this.showColumnModulePopup = false;
  }

  getReportConfiguration(): void {
    this.reportConfigList = [];
  
    const payload = {
      component_name: 'report_config',
    };
  
    this.RollsService.getSystemConfiguration(payload).subscribe({
      next: (response: any) => {
        const data = response?.data || [];
  
        // Always start with Default Config
        this.reportConfigList = [{
          report_config_name: this.translocoService.translate('default_config'),
          status: 1,
          is_default: true
        }];
  
        if (data.length > 0 && data[0].configuration_data?.report_config) {
          this.reportConfigList.push(
            ...data[0].configuration_data.report_config
          );
        }
  
        const defaultConfigIndex = this.reportConfigList.findIndex(
          (item: any) => item.status === 1
        );
  
        this.reportConfigIndex =
          defaultConfigIndex !== -1 ? defaultConfigIndex : 0;
      },
      error: (err) => {
        console.error("Config fetch failed, using default only", err);
  
        // Even on error, show Default Config
        this.reportConfigList = [{
          report_config_name: this.translocoService.translate('default_config'),
          status: 1,
          is_default: true
        }];
        this.reportConfigIndex = 0;
      }
    });
  }

  getLanguageConfiguration(): void {
    this.languageList = [];

    const payload = { component_name: 'app_language' };

    this.RollsService.getSystemConfiguration(payload).subscribe((response: any) => {
      if (response.status && response.data && response.data.length > 0) {
        const configData = response.data[0].configuration_data;
        const data = typeof configData === 'string' ? JSON.parse(configData) : configData;
        const langCode = data?.app_language;

        if (langCode) {
          this.translocoService.setActiveLang(langCode);
          localStorage.setItem('activeLang', langCode);
        }
      }
    }, (err) => {
      console.error("Language config fetch failed", err);
    });
  }

  changeConfiguration(index:number){
    this.reportConfigIndex = index;
  }

  formatDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');

    return `${yyyy}/${mm}/${dd} ${hh}:${mi}:${ss}`;
  }

  styleHeader(sheet: any) {
    const headerRow = sheet.getRow(1);

    headerRow.eachCell((cell: any) => {
      cell.font = {
        name: 'Calibri',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F497D' }
      };

      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true
      };

      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    headerRow.height = 20;
  }

  getlanguageChange() {
    this.translocoService.langChanges$.subscribe(() => {
      this.updateOptionsAndSettings();
    });
  }

  getDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // difference in milliseconds
    const diffTime = end.getTime() - start.getTime();

    // convert to days
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays + 1;
  }
}
