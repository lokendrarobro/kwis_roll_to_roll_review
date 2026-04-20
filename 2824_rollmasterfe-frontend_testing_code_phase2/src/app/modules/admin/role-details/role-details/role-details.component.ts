import { Component,ElementRef, OnInit, ViewChild, HostListener, Input, ChangeDetectorRef, Renderer2, Inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { of, Subject, takeUntil } from "rxjs";
import { debounceTime } from 'rxjs/operators';
import * as $ from "jquery";
import { IDropdownSettings } from "ng-multiselect-dropdown";
import { EChartsOption } from "echarts";
import { UserService } from "app/core/user/user.service";
import { catchError,tap } from 'rxjs/operators';
import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart,
  ChartComponent,
} from "ng-apexcharts";
import { Router } from "@angular/router";
import { ActivatedRoute } from "@angular/router";
import { RollsService } from "app/services/rolls.service";
import { DecimalPipe } from "@angular/common";
import { User } from "app/core/user/user.types";
import { ToastrService } from "ngx-toastr";
import { TranslocoService } from "@ngneat/transloco";
import { defectStatusFilterList } from "app/globalvariables/globalvariables";
import { defaultFeatureActivityList } from "app/globalvariables/globalvariables";
import { CommonService } from "app/services/common.service";
import { DOCUMENT } from '@angular/common';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  plotOptions?: {
    pie?: {
      colors?: string[];
    };
  };
};
class DataTablesResponse {
  data: any = [];
  draw: number;
  recordsFiltered: number;
  recordsTotal: number;
}
@Component({
  selector: "app-role-details",
  templateUrl: "./role-details.component.html",
  styleUrls: ["./role-details.component.scss"],
})
export class RoleDetailsComponent implements OnInit {
  @ViewChild('dropdownRef') dropdownRef!: ElementRef;
  @ViewChild("chart") chart: ChartComponent;
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  chartOption: EChartsOption;
  chartData = [];
  showDeleteModal = false;
  showEditModal=false;
  dtOptionsList: DataTables.Settings = {};
  dropdownList = [];
  selectedItems = [];
  clickedFields: { [key: string]: boolean } = {};
  checkedItems: number[] = [];
  public chartOptions: Partial<ChartOptions>;
  rolls: any[];
  defects: any = [];
  message:any;
  rolls_data_by_id: any = {};
  startLimit: number = 0;
  endLimit: number = 1000;
  rollId: any;
  temp: any = [];
  imagebasepath: any =`${localStorage.getItem('api_path')?.replace('/api', '')}`+ 'uploads/';
  repairbutton: any;
  user: User;
  exist_status: any;
  secondLoaderStatus: any = false;
  public data: Object = [];
  note:any;
  isnote:boolean=false;
  isNoteAvailable:boolean=false;
  isNoteTooLong: boolean = false;
  api_path: any;
  isEditing: boolean;
  originalNote: any;
  isDropdownOpen = false;
  selectedOption: any;
  dropdownOptions = ['Name 1', 'Name 2', 'Name 3'];
  PdfGenerationConfigsData:any=[];
  isLengthPerPage:boolean=true
  isPdfGeneratedClicked: boolean = false;
  // PdfGenerationForm:FormGroup
  lengthPerPage: number | null = null;
  inputSubject = new Subject<number>();
  errorMessage: string = '';
  defectStatusDropdownList: any = [];
  defectInfo:string='image_formate';
  dropdownSettingsForDefectStatus: IDropdownSettings;
  dropdownSettingsForDefectType: IDropdownSettings;
  dropdownListForDefectType: any = [];
  selectedItemsForDefectStatus: any = [];
  selectedItemsForDefectType: any = [];
  isDropdownOpenforQualityCode = false;
  robroRollId: any;
  toastr: any;
  selectedQualityCode: number | null = null;
  colourCodeData:any = [];
  roll_details_quality_name:any;
  ReviewButtonStatus: boolean = false;
  RepairButtonStatus: boolean = false;
  sNumber:number = 0;
  @Input() featurePermissions: any[] = [];
  module_id:any = 2;
  loggedInRole:any = localStorage.getItem('role_id'); 
  startRepairStatus: boolean = false;
  startReviewStatus: boolean = false;
  downloadPdfStatus: boolean = false;
  add_editNoteStatus: boolean = false;
  defectStatusFilterList: any = [];
  validationErrors: string[] = [];
  dropdownListForDefectStatus : any = []
  inspectionSpeedData : any = [];
  chartOptionLine: any; // Your chart options
  inspectionchartStatus: boolean = false;
  showXLocationDropdown: boolean = false;
  xLocationList: any[] = []; // X location values ka array
  selectedLocation: any = {};
  locationFilterInfo: string = ''; // Default value or ''
  showYLocationDropdown: boolean = false;
  yLocationList: any[] = []; // X location values ka array
  slittingData: any = [];
  xLocationStart:any = '';
  xLocationEnd:any = '';
  yLocationStart:any = '';
  yLocationEnd:any = '';
  metercal: number = 1000; // Conversion factor for mm to meters
  slitting_type: any = '';
  default_pdf_Status: boolean = false;
  childRollId: any = '';
  validationStatus: boolean = false;
  reviewButtonStatus: boolean = false;
  repairSpeedData : any = [];
  repairchartOption: any; // Your chart options
  repairchartStatus: boolean = false;
  showInspectionInfoStatus: boolean = false;
  showRepairInfoStatus: boolean = false;
  showReviewInfoStatus: boolean = false;
  showInspectionSpeedGraphStatus: boolean = false;
  showRepairSpeedGraphStatus: boolean = false;
  repair_machine_status: boolean = (window as any).__env.repair_machine_id;
  lengthPerPageError: boolean = false;
  minimumLength: number = 0;
  selectedExportType: string = 'excel'; // Default selected export type
  criticalDefectData: any[] = [];
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) {
      this.isDropdownOpenforQualityCode = false;
    }
  }
  
  toggleDropdownForQualityCode() {
    this.isDropdownOpenforQualityCode = !this.isDropdownOpenforQualityCode;
    if (this.isDropdownOpenforQualityCode) {
      this.isDropdownOpen = false;
    }
  }
  

  constructor(
    private RollsService: RollsService,
    private http: HttpClient,
    private _UserService: UserService,
    private router: Router,
    private toastrService: ToastrService,
    private commonService: CommonService,
     private cdr: ChangeDetectorRef,
     private renderer: Renderer2,
     @Inject(DOCUMENT) private document: Document,
     private translocoService: TranslocoService
  ) {
    this.inputSubject.pipe().subscribe(value => {
      this.minimumLength = this.rolls_data_by_id.inspected_length*0.1;
      this.minimumLength = Math.floor(this.minimumLength)
      if(value>=this.minimumLength){
        this.errorMessage = "";
        this.lengthPerPage = value;
        this.lengthPerPageError = false;
      }else{
        this.lengthPerPage = null;
        this.errorMessage = this.translocoService.translate('please_enter_value_greater_than_or_equal_to') + ` ${this.minimumLength}`;
        this.lengthPerPageError = true;
      }
    });
    this.get_api_path(),
    this.get_module_permission();
   
    
  }

  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject<any>();

  ngOnInit(): void {
    // Show the loading spinner or overlay
    this.dropdownSettingsForDefectStatus = {
      singleSelection: false,
      idField: 'item_value',
      textField: 'item_name',
      selectAllText: this.translocoService.translate('select_all'),
      unSelectAllText: this.translocoService.translate('unselect_all'),
      itemsShowLimit: 3,
      allowSearchFilter: true
    };
    this.dropdownSettingsForDefectType = {
      singleSelection: false,
      idField: 'item_id',
      textField: 'item_text',
      selectAllText: this.translocoService.translate('select_all'),
      unSelectAllText: this.translocoService.translate('unselect_all'),
      itemsShowLimit: 3,
      allowSearchFilter: true
    };
    
    this.dropdownListForDefectStatus.push(
    { item_value: 'enable', item_text: this.translocoService.translate('enable') },
    { item_value: 'disable', item_text: this.translocoService.translate('disable') }
  );
    this.RollsService.show();
    this.getNote();
    setTimeout(() => {
      this.loggedInRole = localStorage.getItem('role_id');
      if (this.module_id && this.loggedInRole) {
        this.getAllFeaturePermission(this.module_id, this.loggedInRole);
      }
    }, 100);
    // Subscribe to the user service to get the current user
    this._UserService.user$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((user: User) => {
        this.user = user;
        
        this.repairbutton = this.user.role_id;
      });
    // Initialize DataTable options
    this.dtOptions = {
      pageLength: 50,
      lengthMenu: [5, 10, 25, 50, 100],
      pagingType: "full_numbers",
      order: [[1, "asc"]],
      processing: true,
    };

    // Get roll ID and existence status from localStorage
    this.rollId = localStorage.getItem("roll_id");
    this.dtTrigger.next("");

    this.exist_status = localStorage.getItem("exist_status");

     if (this.rollId) {
      this.getCriticalDefectData();
    } else {
      this.router.navigate(["/dashboards/roll"]);
    }

    // If roll_id is present, get the data and check if it exists
    if (this.rollId) {
      this.dataTableForDefect();
    } else {
      //   // If roll_id is not present, redirect to the dashboards/roll page
      this.router.navigate(["/dashboards/roll"]);
    }
    this.getAllPdfGenerationConfigs();
    this.getInspectionSpeedData();
    this.getRepairSpeedData();
    this.getSlittingData();
    this.getReviewRollId();
  }

   getCriticalDefectData(): void {
    const payload = { component_name: 'critical_defect_config' };
    this.RollsService.getSystemConfiguration(payload).subscribe({
      next: (response: any) => {
        if (response.status && response.data.length > 0) {
          let configData = response.data[0].configuration_data;
          if (typeof configData === 'string') {
            try {
              configData = JSON.parse(configData);
            } catch (e) {
              this.criticalDefectData = [];
            }
          }
          this.criticalDefectData = configData?.critical_defects || [];
        } else {
          this.criticalDefectData = [];
        }
        this.get_rollsdatabyid(this.rollId);
        this.drawPieChart();
      },
      error: () => {
        this.criticalDefectData = [];
        this.get_rollsdatabyid(this.rollId);
        this.drawPieChart();
      }
    });
  }

  toggleEdit() {
    this.isEditing = true;
    this.originalNote = this.note;
    
  }

  openEditmodal() {
    // if (this.selectedOption?.pdf_config_name === 'DefaultPdf')
    // this.default_pdf_Status = true;
    this.showEditModal=true;
    // this.validationErrors = [];
    this.renderer.addClass(this.document.body, 'overflow-hidden');
  }
  closeEditmodal() {
    this.showEditModal = false;
    this.selectedExportType = 'excel';
    this.renderer.removeClass(this.document.body, 'overflow-hidden');
  }
  
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
        this.isEditing = false;
        const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 2 && item.module_id === 2);
        if(activityObject){
          this.commonService.addActivityLog(activityObject)
        }
        this.note = this.note;
        this.toastrService.success(this.translocoService.translate('note_saved_successfully'), this.translocoService.translate('success'));
        this.isNoteAvailable = true;
      },
      (error) => {
        console.error('Error saving note:', error);
        this.toastrService.error(this.translocoService.translate('error_saving_note'), this.translocoService.translate('error'));
      }
    );
  }

  updateNoteValidation() {
    this.isNoteTooLong = this.note.length > 5000;
  }

  cancelEdit() {
    this.isEditing = false;
    this.note = this.originalNote;
  }

  getNote() {
    const robro_roll_id = localStorage.getItem("robro_roll_id");
    if (!robro_roll_id) {
      this.toastrService.error(this.translocoService.translate('robro_roll_id_is_missing'), this.translocoService.translate('error'));
      return;
    }
  
    this.RollsService.get_notes(robro_roll_id).subscribe(
      (response: any) => {
        if (response.status) {
          this.note = response.data.note;  // Assigning fetched note to the variable
          this.isnote=true;
          if( response.data.note){
            this.isNoteAvailable=true
          }
        } 
      },
      (error) => {
        console.error('Error fetching note:', error);
        this.toastrService.error(this.translocoService.translate('error_fetching_note'), this.translocoService.translate('error'));
      }
    );
  }

  get_api_path() {
    this.RollsService.full_api_path.subscribe((data: any) => {
      this.api_path = data
    })
  }
  dataTableForDefect() {

    this.data = [];

    this.dtOptionsList = {
      pagingType: "full_numbers",
      pageLength: 50,
      lengthMenu: [25, 50, 100, 150],
      order: [[1, "asc"]],
      serverSide: true,
      processing: true,
      searching: true,
      ajax: (dataTablesParameters: any, callback) => {
        this.sNumber = dataTablesParameters.start;
        dataTablesParameters.roll_id = this.rollId;
        dataTablesParameters.minNumber = dataTablesParameters.start;
        dataTablesParameters.maxNumber =
          dataTablesParameters.start + dataTablesParameters.length;

        // Handle sorting
        if (
          dataTablesParameters.order &&
          dataTablesParameters.order.length > 0
        ) {
          const orderColumn =
            dataTablesParameters.columns[dataTablesParameters.order[0].column]
              .data;
          const orderDir = dataTablesParameters.order[0].dir;
          dataTablesParameters.sortColumn = orderColumn;
          dataTablesParameters.sortOrder = orderDir;
        }

        // Handle searching
        dataTablesParameters.searchKeyword = dataTablesParameters.search.value;

        this.http
          .post<DataTablesResponse>(
            `${this.api_path}defect_for_datatable`,
            dataTablesParameters
          )
          .subscribe(
            (resp: any) => {
              if (resp.status == true) {
                this.data = resp.data;
                this.message=resp.message;
                this.defects = resp.data.length;
                this.RollsService.hide();
              }
              callback({
                recordsTotal: resp.recordsTotal,
                recordsFiltered: resp.recordsFiltered,
                data: [],
              });
            },
            (error) => {
              console.error("Error making AJAX request:", error);
              callback({
                recordsTotal: 0,
                recordsFiltered: 0,
                data: [], // Empty data or handle error data appropriately
              });
            }
          );
      },
      columns: [
        { data: "defect_id", searchable: false, orderable: false },
        { data: "defect_top_left_y_mm" },
        { data: "defect_type" },
        { data: "cropped_image_path", searchable: false, orderable: false },
        { data: "defect_width_mm" },
        { data: "defect_height_mm" },
        { data: "area_mm"},
        { data: "confidence" },
        { data: "updated_at" },
        { data: "local_defect_id" },
      ],
    };

  }
  get_all_defect_by_roll_id(robro_roll_id): void {
    const nodeDataArray = [];
    const defectCountString = localStorage.getItem("total_defect_count");
    const defectCount = defectCountString ? parseInt(defectCountString, 10) : 0;
    // Check if defect_count is less than or equal to the end limit
    if (defectCount <= this.endLimit) {
      // Fetch and save the remaining defects
      const data = {
        roll_id: robro_roll_id,
        start_limit: this.startLimit,
        end_limit: this.endLimit,
      };
      this.RollsService.get_all_defects_by_roll_id(data).subscribe(
        (response: any) => {
          if (response.status) {
            if (typeof response.data != "string") {
              this.temp = this.temp.concat(response.data);
              this.setdatablevalue();
            } else {
              this.defects = [];
            }
          }
        },
        (error) => {
          console.error("Error fetching data from the API", error);
        }
      );
    } else {
      // Fetch and save data within the limit
      const data1 = {
        roll_id: robro_roll_id,
        start_limit: this.startLimit,
        end_limit: this.endLimit,
      };
      this.RollsService.get_all_defects_by_roll_id(data1).subscribe(
        (response: any) => {
          if (response.status) {
            if (typeof response.data != "string") {
              this.temp = this.temp.concat(response.data);
              this.startLimit = this.endLimit;
              this.endLimit = Math.min(this.endLimit + 1000, defectCount);
              // Recursive call with updated limits
              setTimeout(() => {
                // this.get_all_defect_by_roll_id(this.rollId);
              }, 300);
            }
          }
        },
        (error) => {
          console.error("Error fetching data from the API", error);
        }
      );
    }
  }

  setdatablevalue() {
    this.defects = this.temp;
    this.RollsService.hide();
  }

  redirect_page(page_name) {
    if (page_name == "review") {
      // added activity log
      const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 3 && item.module_id === 2);
      if (activityObject) {
        this.commonService.addActivityLog(activityObject)
      }
      this.router.navigate(["/review"]);
    } else if (page_name == "repair") {
      // added activity log
      const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 4 && item.module_id === 2);
      if (activityObject) {
        this.commonService.addActivityLog(activityObject)
      }
      this.router.navigate(["/repair"]);
    }
  }
  onInputFieldClick(fieldName: string): void {
    this.clickedFields[fieldName] = true;
  }

  isFieldClicked(fieldName: string): boolean {
    return this.clickedFields[fieldName];
  }

  get_rollsdatabyid(roll_id) {
    this.RollsService.get_rollsdatabyid(roll_id).subscribe((response) => {
      // defect_count
      if (
        response.status == true &&
        response.data &&
        response.data.length > 0
      ) {
        this.rolls_data_by_id = response.data[0];
        this.selectedQualityCode= response.data[0].quality_code;
        if (typeof response.data !== "string") {
          let total_defectcount = this.rolls_data_by_id.defect_count;
          let inspected_length =
            this.rolls_data_by_id.inspected_length.toFixed(2);
          localStorage.setItem("total_defect_count", total_defectcount);
          localStorage.setItem("inspected_length", inspected_length);
          this.getQualityCodeByName(this.selectedQualityCode);
          this.setDefectFilterList();
        } else {
          this.defects = [];
        }

      } else {
        this.router.navigate(["/dashboards/roll"]);
      }
    });
  }
  
  get primaryBodyList() {
    return (this.rolls_data_by_id?.body_info?.primary_body_data || [])
      .filter(item => item.primary_cut_length > 0);
  }

  get secondaryBodyList() {
    return (this.rolls_data_by_id?.body_info?.secondary_body_data || [])
      .filter(item => item.secondary_cut_length > 0);
  }

  get tertiaryBodyList() {
    return (this.rolls_data_by_id?.body_info?.tertiary_body_data || [])
      .filter(item => item.tertiary_cut_length > 0);
  }
  
  drawPieChart() {
    let total_defectcount: any = localStorage.getItem("total_defect_count");
    this.RollsService.getColourCode().subscribe((res)=>{
      this.colourCodeData = res.data;
      this.RollsService.get_pie_chart_data(this.rollId).subscribe((response) => {
        // defect_count
        if (response.status == true) {
  
          const graph_data: any[] = [];
          this.chartData = [];
          const temp_defectcount = response.defects;
          this.dropdownListForDefectType = temp_defectcount.map(data => {
            return { item_id: data.type, item_text: data.type };
          });

          // Identify all colors used in the system configuration to prevent using them as fallbacks
          const configuredColors = new Set<string>();
          (this.criticalDefectData || []).forEach(d => {
            if (d.color) configuredColors.add(d.color.toLowerCase());
          });

          // Filter out configured colors from the available pool of fallback colors
          const availableFallbackColors = (this.colourCodeData || [])
            .map(c => c.colour_code)
            .filter(c => c && !configuredColors.has(c.toLowerCase()));

          let fallbackColorIndex = 0;
          temp_defectcount.forEach((item,index) => {
            let temp_series = parseFloat(
              (
                (item.count * 100) /
                total_defectcount
              ).toFixed(2)
            );
            let color = '';
            const configMatch = this.criticalDefectData.find(d => d.defect_type_name.toLowerCase() === item.type.toLowerCase());

            if (configMatch && configMatch.color) {
              color = configMatch.color;
            } else {
              color = availableFallbackColors[fallbackColorIndex] || '#CCCCCC';
              fallbackColorIndex++;
            }
            const defects_name = {
              value: temp_series,
              name: item.type,
              itemStyle: { color: color },
            };
            this.chartData.push({
              value: temp_series,
              name: item.type,
              color_code: color,
              count: item.count
            });
  
            graph_data.push(defects_name);
  
          });
          let sortedChartData = [...this.chartData]; // Create a new array to avoid modifying the original array
          sortedChartData.sort((a, b) => b.value - a.value);
          this.chartData = sortedChartData;
          let graph_data1: any[] = [];
          graph_data1 = [...graph_data]; // Create a new array to avoid modifying the original array
          graph_data1.sort((a, b) => b.value - a.value);
          this.chartOption = {
            tooltip: {
              trigger: "item",
              formatter: "{a} <br/>{b}: {c} ({d}%)",
            },
            series: [
              {
                name: "",
                type: "pie",
                radius: ["0%", "100%"], // Set the inner radius to 0% for a solid circle
                avoidLabelOverlap: false,
                label: {
                  show: false,
                  position: "center",
                },
                emphasis: {
                  label: {
                    show: true,
                    fontSize: "30",
                    fontWeight: "bold",
                  },
                },
                labelLine: {
                  show: false,
                },
                data: graph_data1,
              },
            ],
          };
  
        } else {
          this.router.navigate(["/dashboards/roll"]);
        }
      });
    })
   
  }
  getLoaderState() {
    return this.RollsService.loaderState;
  }

  getLoaderState1() {
    return this.RollsService.loaderState;
  }

  // Add this small helper somewhere in your component
  private downloadToBrowser(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  createPdf(data: any) {
    this.secondLoaderStatus = true;
    this.RollsService.show();

    const file_name = `${this.rollId}_${Date.now()}.pdf`;

    this.RollsService.createPdf(data).subscribe(
      (blob: Blob) => {
        if (!blob || blob.size === 0) {
          this.secondLoaderStatus = false;
          this.RollsService.hide();
          console.error('Received empty Blob');
          this.toastrService.error(this.translocoService.translate('PDF generation returned empty file'), this.translocoService.translate('Error'));
          return;
        }

        // 1) FRONTEND: download to browser's Downloads (Docker will mount this)
        try {
          this.downloadToBrowser(blob, file_name);
          this.toastrService.success(this.translocoService.translate('PDF downloaded') + `: ${file_name}`, this.translocoService.translate('Saved locally'));
        } catch (e: any) {
          console.error('Client download failed:', e);
          this.toastrService.error(this.translocoService.translate('Failed to download the PDF locally'), this.translocoService.translate('Error'));
          // continue to server upload anyway
        }

        // 2) BACKEND: keep your upload + SMS flow unchanged
        const formData = new FormData();
        const file = new File([blob], file_name, { type: 'application/pdf' });
        formData.append('pdf', file);
        formData.append('rollid', this.rollId.toString());

        this.RollsService.savePdfToServer(formData).subscribe(
          (res: any) => {
            this.secondLoaderStatus = false;

            if (res.success) {
              // ===== RESET HERE — right after PDF successfully saved on server =====
              this.validationStatus = false;
              this.selectedItemsForDefectStatus = [];
              this.selectedItemsForDefectType = [];
              this.defectInfo = 'image_formate';
              this.isPdfGeneratedClicked = false;
              this.isLengthPerPage = true;
              this.lengthPerPage = null;
              this.validationErrors = [];
              this.xLocationStart = '';
              this.xLocationEnd = '';
              this.yLocationStart = '';
              this.yLocationEnd = '';
              this.selectedLocation = {};
              this.locationFilterInfo = '';
              this.showXLocationDropdown = false;
              this.xLocationList = [];
              this.showYLocationDropdown = false;
              this.yLocationList = [];
              this.slitting_type = '';
              this.errorMessage = "";
              this.validationStatus = false;
              const selected = this.PdfGenerationConfigsData.find(option => option.status === 1);
              if (selected) {
                this.selectedOption = selected;
              }
              // ===== keep your existing upload + sms flow =====
              const uploadData = { localFilePath: res.path };
              const sharing_configuration_type = data.sharing_configuration_type;
              const mobile_numbers = data.mobile_number;
              const email_ids = data.target_emails;

              if (sharing_configuration_type === 'sms' || sharing_configuration_type === 'email' ) {
                this.RollsService.upload_pdf(uploadData).subscribe(
                  (response: any) => {
                    if (response.publicUrl) {
                      const sendSmsData = {
                        numbers: Array.isArray(mobile_numbers) ? mobile_numbers.join(',') : mobile_numbers,   // fallback if already string
                        message: `Your Roll Report (ID: ${this.rollId}) is ready. View or download it here: ${response.publicUrl}`
                      };

                      const sendEmailData = {
                        "to": email_ids,
                        "subject": `Roll Report - Roll ID ${this.rollId}`,
                        "body": `
                          Hello,

                          The report for <strong>Roll ID ${this.rollId}</strong> is now available.

                          Click the link below to download:
                          <br/><br/>
                          <a href="${response.publicUrl}">${response.publicUrl}</a>

                          <br/><br/>
                          Thank you,<br/>
                          Robro Systems
                          `
                      };

                      if (sharing_configuration_type === 'sms') {
                        this.RollsService.send_sms_to_user(sendSmsData).subscribe(
                          (response: any) => {
                            if (response.status === 'success') {
                              this.toastrService.success('SMS sent successfully');
                            } else {
                              // this.toastrService.error('Error Occurred');
                            }
                            this.RollsService.hide();
                          },
                          (error: any) => {
                            this.toastrService.error(error.message, 'Error');
                            this.RollsService.hide();
                          }
                        );
                      }
                      if (sharing_configuration_type === 'email') {
                        this.RollsService.send_email_to_user(sendEmailData).subscribe(
                          (response: any) => {
                            if (response.status === 'success') {
                              this.toastrService.success('Email sent successfully');
                            } else {
                              // this.toastrService.error('Error Occurred');
                            }
                            this.RollsService.hide();
                          },
                          (error: any) => {
                            this.toastrService.error(error.message, 'Error');
                            this.RollsService.hide();
                          }
                        );
                      }
                     
                    } else {
                      // this.toastrService.error('Pdf Upload Failed.');
                      this.RollsService.hide();
                    }
                  },
                  (error: any) => {
                    console.error(error);
                    this.RollsService.hide();
                  }
                );
              } else {
                this.RollsService.hide();
              }

              const activityObject = defaultFeatureActivityList.find(
                (item) => item.feature_id === 1 && item.module_id === 2
              );
              if (activityObject) {
                this.commonService.addActivityLog(activityObject);
              }

              this.toastrService.success(this.translocoService.translate('PDF saved on server at') + ': ' + res.path, this.translocoService.translate('Success!'));
            } else {
              this.RollsService.hide();
              this.toastrService.error(this.translocoService.translate('PDF save failed'), this.translocoService.translate('Error'));
            }
          },
          (err) => {
            this.secondLoaderStatus = false;
            this.RollsService.hide();
            console.error('Error saving PDF to server:', err);
            this.toastrService.error(this.translocoService.translate('Error saving PDF to server'), this.translocoService.translate('Error'));
          }
        );
      },
      (error) => {
        this.secondLoaderStatus = false;
        this.RollsService.hide();
        console.error('Error generating PDF:', error);
        this.toastrService.error(this.translocoService.translate('Error generating PDF'), this.translocoService.translate('Error'));
      }
    );
  }



  getQualityCodeByName(quality_code) {
    this.RollsService.getQualityCodeByName(quality_code).subscribe((res) => {
      if(res.data.length == 0){
        return;
      }
      this.roll_details_quality_name = res.data[0].quality_code
    });
  }
  getAllPdfGenerationConfigs(){
    this.RollsService.getAllPdfGenerationConfigs().subscribe((response) => {

      if(response.status){
        this.PdfGenerationConfigsData = response.data
        if(this.PdfGenerationConfigsData.length > 0){
          const selected = this.PdfGenerationConfigsData.find(option => option.status === 1);
          if (selected) {
            this.selectedOption = selected;
          }
          let statusArr = response.data.map(data => data.status)
          let checkStatus = statusArr.includes(1)
          if(!checkStatus){
            this.PdfGenerationConfigsData.forEach(data => {
              if(data.isdisabled === 1){
                data.status = 1
                this.selectedOption = data;
              }
            })
          }
        }
      }
    })
  }
  onRadioChange(selectedOption:any){
    this.selectedItemsForDefectStatus = [];
    this.selectedItemsForDefectType = [];
    this.defectInfo = 'image_formate';
    this.isPdfGeneratedClicked = false;
    this.isLengthPerPage = true;
    this.lengthPerPage = null;
    this.validationErrors = [];
    this.xLocationStart = '';
    this.xLocationEnd = '';
    this.yLocationStart = '';
    this.yLocationEnd = '';
    this.selectedLocation = {};
    this.locationFilterInfo = '';
    this.showXLocationDropdown = false;
    this.xLocationList = [];
    this.showYLocationDropdown = false;
    this.yLocationList = [];
    this.slitting_type = '';
    this.errorMessage = "";
    this.validationStatus = false;
    this.selectedOption = selectedOption;
    this.PdfGenerationConfigsData.forEach((option: any) => {
      if (option.id === selectedOption.id) {
        option.status = 1;
      } else {
        option.status = 0;
      }
    })
  this.openEditmodal()
  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.dropdownRef && !this.dropdownRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }
  validateNumberInput(event: any) {
    const value = Number(event.target.value);

    if (!isNaN(value)) {
      if (value > this.rolls_data_by_id.inspected_length) {
        this.errorMessage = this.translocoService.translate('value_must_not_be_greater_than') + ` ${this.rolls_data_by_id.inspected_length}.`;
      } else {
        this.errorMessage = '';
        this.inputSubject.next(value); // Emit only if valid
      }
    }
  }

  onItemSelect(item: any) { }
  onSelectAll(items: any) { }
  onItemSelectDefectType(item: any) { }
  onSelectAllDefectType(item: any) { }

  generatePdf(status) {
    if(this.selectedExportType === 'excel'){
      this.downloadExcel();
      return;
    }
    this.validationErrors = [];
    this.errorMessage = '';
    let finalValue = false;
    let imageViewStatus = false;
    finalValue = this.selectedOption['only_map'] ? true : this.defectInfo === "" || this.defectInfo === 'image_formate' || this.defectInfo === null ? true : false;
    imageViewStatus = this.defectInfo === 'image_formate' || this.defectInfo === "table_formate" ? true : false;
    if (!status) {
      this.selectedOption = this.PdfGenerationConfigsData[0];
    }

    if (this.selectedOption?.pdf_config_name !== 'DefaultPdf') {
      // Validation: check if user has selected anything
      const noDefectStatus =
        this.selectedOption?.defect_status_filter === 1 &&
        (!this.selectedItemsForDefectStatus || this.selectedItemsForDefectStatus.length === 0);

      const noDefectType =
        this.selectedOption?.defect_type_filter === 1 &&
        (!this.selectedItemsForDefectType || this.selectedItemsForDefectType.length === 0);
      const noDefectInfo = !this.defectInfo || this.defectInfo === 'image_formate';
      // const noMapLength = this.selectedOption?.only_map && this.isLengthPerPage && !this.lengthPerPage;
      const noDefectReset = this.selectedOption?.defect_id_reset ? true : false;
      const noAiSuggestion = this.selectedOption?.ai_suggestion ? true : false;
      const noLocationFilter =
        this.selectedOption?.location_filter === 1 &&
        (
          !this.locationFilterInfo ||
          (this.locationFilterInfo === 'x_axis' && (this.xLocationStart === '' || this.xLocationEnd === '')) ||
          (this.locationFilterInfo === 'y_axis' && (this.yLocationStart === '' || this.yLocationEnd === ''))
        );
      // If all are unselected, show error
      if (
        noDefectStatus &&
        noDefectType &&
        noDefectInfo &&
        noDefectReset &&
        noAiSuggestion &&
        noLocationFilter &&
        !this.selectedOption?.only_map
      ) {
        // Agar location filter ke alawa kuch bhi select nahi kiya
        this.validationErrors.push(
          this.translocoService.translate("please_select_at_least_one_filter_to_generate_pdf")
        );
        this.validationStatus = true;
        return;
      } else {
        this.defectInfo = this.defectInfo === 'image_formate' ? 'image_formate' : this.defectInfo;
      }
    }

    if (this.selectedOption?.pdf_config_name !== 'DefaultPdf') {
      const data = [this.selectedOption?.defect_status_filter, this.selectedOption?.defect_type_filter, this.selectedOption?.defect_info_filter, this.selectedOption?.location_filter];
      const activeFilters = data.filter(v => v === 1).length;
      if (activeFilters >= 2) {
        this.validationStatus = true;
      }

    }
    if ((!this.validationStatus) && !this.lengthPerPage && this.selectedOption['only_map'] && this.isLengthPerPage) {
      if(this.lengthPerPageError)
        this.validationErrors.push(this.translocoService.translate('Please enter a value greater than or equal to') + ` ${this.minimumLength}`)
      else{
        this.validationErrors.push(this.translocoService.translate("Please enter length per page."));
      }
      return;
    }

    if ((!this.validationStatus) && this.lengthPerPage > this.rolls_data_by_id.inspected_length) {
      this.validationErrors.push(this.translocoService.translate("Length per page cannot exceed inspected length of the roll."));
      return;
    }


    if ((!this.validationStatus) && this.selectedOption?.defect_status_filter && this.selectedItemsForDefectStatus.length === 0) {
      this.validationErrors.push(this.translocoService.translate("Please select defect status."));
      return;
    }

    if ((!this.validationStatus) && this.selectedOption?.defect_info_filter && !imageViewStatus) {
      this.validationErrors.push(this.translocoService.translate("Please select defect Info."));
      return;
    }

    if ((!this.validationStatus) && this.selectedOption?.defect_type_filter && this.selectedItemsForDefectType.length === 0) {
      this.validationErrors.push(this.translocoService.translate("Please select defect type."));
      return;
    }
    if ((!this.validationStatus) && this.selectedOption['location_filter'] && this.locationFilterInfo === '') {
      this.validationErrors.push(this.translocoService.translate("Please select location filter."));
      return;
    }

    if ((!this.validationStatus) && this.selectedOption['location_filter'] && this.locationFilterInfo === 'x_axis') {
      if (this.xLocationStart === '' || this.xLocationEnd === '') {
        this.validationErrors.push(this.translocoService.translate("Please select both start and end X locations."));
        return;
      }
      else if (this.xLocationList.length === 0 && (!this.selectedLocation || Object.keys(this.selectedLocation).length === 0)) {
        this.validationErrors.push(this.translocoService.translate("Child Roll Id Name I required."));
        return;
      }
      if (this.xLocationStart !== '' && this.xLocationEnd !== '' && (parseFloat(this.xLocationStart) > parseFloat(this.xLocationEnd))) {
        this.validationErrors.push(this.translocoService.translate("X Location Start must be less than or equal to X Location End."));
        return;
      }
    }

    if ((!this.validationStatus) && this.selectedOption['location_filter'] && this.locationFilterInfo === 'y_axis') {
      if (this.yLocationStart === '' || this.yLocationEnd === '') {
        this.validationErrors.push(this.translocoService.translate("Please select both start and end Y locations."));
        return;
      }
      else if (this.yLocationList.length === 0 && (!this.selectedLocation || Object.keys(this.selectedLocation).length === 0)) {
        this.validationErrors.push(this.translocoService.translate("Child Roll Id Name I required."));
        return;
      }
      if (this.yLocationStart !== '' && this.yLocationEnd !== '' && (parseFloat(this.yLocationStart) > parseFloat(this.yLocationEnd))) {
        this.validationErrors.push(this.translocoService.translate("Y Location Start must be less than or equal to Y Location End."));
        return;
      }
    }

    this.isPdfGeneratedClicked = true;
    // Close the modal and dropdown
    this.showEditModal = false;

    this.closeEditmodal();
    this.isDropdownOpen = false;
    this.selectedLocation['type'] = this.slitting_type; // Add the type property here
    const data = {
      roll_id: this.rollId,
      total_defect_count: this.rolls_data_by_id.defect_count,
      userName: this.user.first_name + ' ' + this.user.last_name,
      version: localStorage.getItem('version'),
      image_view: finalValue,
      map_view: this.selectedOption['only_map'] === 1 ? true : false,
      defect_type_filter: this.selectedItemsForDefectType.map(data => data.item_id),
      defect_status_filter: this.selectedItemsForDefectStatus.map(data => data.item_value),
      logo: this.selectedOption['logo'],
      defect_id_reset: this.selectedOption['defect_id_reset'] === 1 ? true : false,
      ai_suggestion: this.selectedOption['ai_suggestion'] === 1 ? true : false,
      length_in_meter_per_page: this.isLengthPerPage ? this.lengthPerPage >= this.rolls_data_by_id.inspected_length ? this.rolls_data_by_id.inspected_length : this.lengthPerPage ? this.lengthPerPage : this.rolls_data_by_id.inspected_length : this.rolls_data_by_id.inspected_length,
      inspected_length: this.rolls_data_by_id.inspected_length,
      location_filter: this.selectedOption['location_filter'] === 1 ? true : false,
      xLocationStart: this.xLocationStart === '' ? '' : this.xLocationStart,
      xLocationEnd: this.xLocationEnd === '' ? '' : this.xLocationEnd,
      yLocationStart: this.yLocationStart === '' ? '' : this.yLocationStart,
      yLocationEnd: this.yLocationEnd === '' ? '' : this.yLocationEnd,
      slittingData: this.selectedLocation ? this.selectedLocation : {},
      default_pdf_Status: this.default_pdf_Status,
      sharing_configuration_type: this.selectedOption?.sharing_configuration_type,
      mobile_number: this.selectedOption?.mobile_number,
      target_emails: this.selectedOption?.target_emails
    };
    this.createPdf(data);
  }

  get_module_permission() {
    this._UserService.rolePermissions$.subscribe((rolePermissions) => {
      this._UserService.roles$.subscribe((roles) => {
        const matchedRole = roles.find(role => role.role_name === localStorage.getItem('role').toLowerCase());
        const roleId = matchedRole ? Number(matchedRole.role_id) : null
        let navbar_permissions = rolePermissions[roleId] || [];
        if (navbar_permissions.length > 0) {
            const review_permission_module = navbar_permissions.find(module => module.module_id == 3)
            if (review_permission_module) {
              this.ReviewButtonStatus = true;
            }
            const repair_permission_module = navbar_permissions.find(module => module.module_id == 5)
            if (repair_permission_module) {
              this.RepairButtonStatus = true;
            }
          }
      });
    });
  }
   getAllFeaturePermission(module_id: number, role_id: number): void {
    const payload = { module_id, role_id };
  
    this.RollsService.getAllFeaturePermission(payload).pipe(
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
  
  
    setFeaturePermission(): void {
      if (this.featurePermissions) {
        for (const key in this.featurePermissions) {
          const featurePermissionsData = this.featurePermissions[key]
          if (Array.isArray(featurePermissionsData) && featurePermissionsData.length > 0) {
            this.downloadPdfStatus = featurePermissionsData.some(data => data.feature_name === 'Download Pdf');
            this.add_editNoteStatus = featurePermissionsData.some(data => data.feature_name === 'Add/Edit Note');
            this.startRepairStatus = featurePermissionsData.some(data => data.feature_name === 'Start Repair');
            this.startReviewStatus = featurePermissionsData.some(data => data.feature_name === 'Start Review');
            this.showInspectionInfoStatus = featurePermissionsData.some(data => data.feature_name === 'Show Inspection Info');
            this.showRepairInfoStatus = featurePermissionsData.some(data => data.feature_name === 'Show Repair Info');
            this.showReviewInfoStatus = featurePermissionsData.some(data => data.feature_name === 'Show Review Info');
            this.showInspectionSpeedGraphStatus = featurePermissionsData.some(data => data.feature_name === 'Show Inspection Speed Graph');
            this.showRepairSpeedGraphStatus = featurePermissionsData.some(data => data.feature_name === 'Show Repair Speed Graph');
          }
        }

      }
    }

    setDefectFilterList() {
    this.defectStatusFilterList = defectStatusFilterList;
  }
  getInspectionSpeedData() {
    this.RollsService.getInspectionSpeedData(this.rollId).subscribe((response) => {
      if(response.status){
          this.inspectionSpeedData = response.data;
          this.drawInspectionGraph();
      }
    })
  }

  drawInspectionGraph(): void {
    let line_graph_Data: any[] = [];
    let x_axis_data: any[] = [];
    let maxYValue: any;

    let minYValue = this.inspectionSpeedData.reduce((min, current) => {
      return current.current_speed < min ? current.current_speed : min;
    }, Infinity);
    
    this.inspectionSpeedData.filter((data: any) => {
      let graphobj: any = {
        value: (data.current_speed).toFixed(2)
      }
      maxYValue = Math.ceil(Math.max(maxYValue || 0, data.current_speed));
      line_graph_Data.push(graphobj);
      x_axis_data.push(parseFloat(data.running_meter).toFixed(2));
    });

    if (line_graph_Data.length > 0) {
      
      this.inspectionchartStatus = true;
      let drawMinMaxLine = false;
      let minLineValue;
      let maxLineValue;
      setTimeout(() => {
        this.chartOptionLine = {
          tooltip: {
            trigger: "item",
            formatter: (params) =>
              `${params.seriesName} <br/>${params.data.value} m/min`,
          },
          xAxis: {
            type: "category",
            data: x_axis_data || [],
            axisLabel: {
              rotate: 45, 
              hideOverlap: true, 
            },
          },
          yAxis: {
            type: "value",
            min: Math.max(0, Math.ceil(minYValue || 0) - 2),
            max: maxYValue || 100,
          },
          series: [
            {
              name: "Speed",
              type: "line",
              data: (line_graph_Data || []).map((graph_value) => ({
                value: Number(graph_value.value).toFixed(2),
                itemStyle: {
                  color: graph_value?.filter_status ? "#ff0000" : "#0000ff",
                },
              })),
              symbol: "circle",
              symbolSize: 8,
              smooth: true,
              markLine: drawMinMaxLine
                ? {
                    data: [
                      {
                        yAxis: minLineValue,
                        lineStyle: {
                          color: "#ff0000",
                          type: "solid",
                          width: 2,
                        },
                        label: {
                          show: true,
                          formatter: "Min",
                          position: "end",
                          color: "#ff0000",
                        },
                      },
                      {
                        yAxis: maxLineValue,
                        lineStyle: {
                          color: "#ff0000",
                          type: "solid",
                          width: 2,
                        },
                        label: {
                          show: true,
                          formatter: "Max",
                          position: "end",
                          color: "#ff0000",
                        },
                      },
                    ],
                  }
                : null,
            },
          ],
          dataZoom: [
            {
              type: "slider",
              show: true,
              start: 0, 
              end: 10, 
              xAxisIndex: 0, 
            },
            {
              type: "inside",
              xAxisIndex: 0,
              start: 0,
              end: 20,
              zoomLock: true,
            },
          ],
          grid: {
            containLabel: true, 
            left: "5%",
            right: "5%",
            bottom: "10%",
          },
        };
      }, 100);
    }
  }


  // Method to handle Location Axis Type change
onLocationAxisTypeChange(event: any) {
  this.xLocationStart = '';
  this.xLocationEnd = '';
  this.yLocationStart = '';
  this.yLocationEnd = '';
  this.childRollId = '';
  if (this.locationFilterInfo === 'x_axis') { // 'image_formate' = X Axis Location
    this.slitting_type = 'Width';
    this.showXLocationDropdown = true;
    if(this.slittingData && this.slittingData.length > 0) {
      const widthData = this.slittingData.find(item => item.slitting_type === "Width")?.data || [];
      if(widthData && widthData.length > 0) {
        this.xLocationList = widthData;
      } else {
        this.xLocationList = [];
      }
    }
    this.showYLocationDropdown = false;
    this.selectedLocation = null;
  }
  else if (this.locationFilterInfo === 'y_axis') { 
    this.slitting_type = 'Length';
    this.showYLocationDropdown = true;
     if(this.slittingData && this.slittingData.length > 0) {
      const lengthData = this.slittingData.find(item => item.slitting_type === "Length")?.data || [];
      if(lengthData && lengthData.length > 0) {
        this.yLocationList = lengthData;
      } else {
        this.yLocationList = [];
      }
    }
    this.showXLocationDropdown = false;
    this.selectedLocation = null;
  }
  else {
    this.showXLocationDropdown = false;
    this.selectedLocation = null;
    this.showYLocationDropdown = false;
  }
}

  getSlittingData() {
    this.RollsService.getSlittingData(this.rollId).subscribe((response) => {
      if(response.status){
        this.slittingData = response.data;
      }
    })
  }

  get isXStartInvalid(): boolean {
    return this.xLocationStart < 0;
  }

  get isXEndInvalid(): boolean {
    return this.xLocationEnd > this.rolls_data_by_id.width*this.metercal;
  }

  get isXRangeInvalid(): boolean {
    return this.xLocationStart > this.xLocationEnd;
  }

  get isYStartInvalid(): boolean {
    return this.yLocationStart < 0;
  }

  get isYRangeInvalid(): boolean {
    if(this.yLocationEnd === '' || this.yLocationEnd === null || this.yLocationEnd === undefined) {
      return false; // Allow empty value for yLocationEnd
    }
    return this.yLocationStart > this.yLocationEnd;
  }

  get isYEndInvalid(): boolean {
    return this.yLocationEnd > this.rolls_data_by_id.inspected_length*this.metercal;
  } 

  onLocationChange(axis) {

    if(axis === 'yAxis') {
      this.yLocationStart = this.selectedLocation['y_roll_start_mm'];
      this.yLocationEnd = this.selectedLocation['y_roll_end_mm'];  
    }
    else if(axis === 'xAxis') {
      this.xLocationStart = this.selectedLocation['x_roll_start_mm'];
      this.xLocationEnd = this.selectedLocation['x_roll_end_mm'];
    }
  }

  logChildRollId() {
    if (!this.selectedLocation) {
      this.selectedLocation = {}; // ensure it's initialized
    }

    this.selectedLocation['child_roll_id'] = this.childRollId;
  }
  update_roll() {
    if(!this.reviewButtonStatus && this.rolls_data_by_id.roll_status < 2)
    {
      this.toastrService.warning(this.translocoService.translate("please_first_complete_your_ongoing_review"),this.translocoService.translate("warning"))
      return;
    }
    if (this.rolls_data_by_id.roll_status < 2) {
      const data1 = {
        roll_id: this.rollId,
        status: 'START_REVIEW',
      }
      this.RollsService.update_roll(data1).subscribe(
        (response) => {
          console.log("Start Review Successfully");
        });
    }
    this.redirect_page('review')
  }

  getReviewRollId() {
    if (localStorage.getItem('role') === 'ADMIN') {
      this.reviewButtonStatus = true;
      return;
    }

    this.RollsService.getReviewRollId().subscribe({
      next: (res: any) => {
        const data = res?.data?.[0];
        this.reviewButtonStatus = !res.status || !res.data?.length || data?.robro_roll_id == this.rollId;
      },
      error: () => (this.reviewButtonStatus = true),
    });
  }

  getRepairSpeedData() {
    this.RollsService.getRepairSpeedData(this.rollId).subscribe((response) => {
      if(response.status){
          this.repairSpeedData = response.data;
          this.drawRepairGraph();
      }
    })
  }

  drawRepairGraph(): void {
    let line_graph_Data: any[] = [];
    let x_axis_data: any[] = [];
    let maxYValue: any;

    let minYValue = this.repairSpeedData.reduce((min, current) => {
      return current.current_speed < min ? current.current_speed : min;
    }, Infinity);
    
    this.repairSpeedData.filter((data: any) => {
      let graphobj: any = {
        value: (data.current_speed).toFixed(2)
      }
      maxYValue = Math.ceil(Math.max(maxYValue || 0, data.current_speed));
      line_graph_Data.push(graphobj);
      x_axis_data.push(parseFloat(data.current_meter).toFixed(2));
    });

    if (line_graph_Data.length > 0) {
      
      this.repairchartStatus = true;
      let drawMinMaxLine = false;
      let minLineValue;
      let maxLineValue;
      setTimeout(() => {
        this.repairchartOption = {
          tooltip: {
            trigger: "item",
            formatter: (params) =>
              `${params.seriesName} <br/>${params.data.value} m/min`,
          },
          xAxis: {
            type: "category",
            data: x_axis_data || [],
            axisLabel: {
              rotate: 45, 
              hideOverlap: true, 
            },
          },
          yAxis: {
            type: "value",
            min: Math.max(0, Math.ceil(minYValue || 0) - 2),
            max: maxYValue || 100,
          },
          series: [
            {
              name: "Speed",
              type: "line",
              data: (line_graph_Data || []).map((graph_value) => ({
                value: Number(graph_value.value).toFixed(2),
                itemStyle: {
                  color: graph_value?.filter_status ? "#ff0000" : "#0000ff",
                },
              })),
              symbol: "circle",
              symbolSize: 8,
              smooth: true,
              markLine: drawMinMaxLine
                ? {
                    data: [
                      {
                        yAxis: minLineValue,
                        lineStyle: {
                          color: "#ff0000",
                          type: "solid",
                          width: 2,
                        },
                        label: {
                          show: true,
                          formatter: "Min",
                          position: "end",
                          color: "#ff0000",
                        },
                      },
                      {
                        yAxis: maxLineValue,
                        lineStyle: {
                          color: "#ff0000",
                          type: "solid",
                          width: 2,
                        },
                        label: {
                          show: true,
                          formatter: "Max",
                          position: "end",
                          color: "#ff0000",
                        },
                      },
                    ],
                  }
                : null,
            },
          ],
          dataZoom: [
            {
              type: "slider",
              show: true,
              start: 0, 
              end: 10, 
              xAxisIndex: 0, 
            },
            {
              type: "inside",
              xAxisIndex: 0,
              start: 0,
              end: 20,
              zoomLock: true,
            },
          ],
          grid: {
            containLabel: true, 
            left: "5%",
            right: "5%",
            bottom: "10%",
          },
        };
      }, 100);
    }
  }

  getDuration(start: string, end: string): string {
    if (!start || !end) return this.translocoService.translate('null');

    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffMs = endTime.getTime() - startTime.getTime();

    if (diffMs <= 0) return '0s';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    let duration = '';
    if (hours > 0) duration += `${hours}h `;
    if (minutes > 0) duration += `${minutes}m `;
    duration += `${seconds}s`;

    return duration.trim();
  }

  getEfficiency(start: string, end: string): number | null {
    const roll = this.rolls_data_by_id;

    // if (!roll?.inspected_length || !roll?.roll_start_time || !roll?.roll_end_time) {
    //   return null;
    // }

    const start_date = new Date(start).getTime();
    const end_date = new Date(end).getTime();

    // Total time in minutes
    const totalTimeMinutes = (end_date - start_date) / (1000 * 60);

    if (totalTimeMinutes <= 0) {
      return null;
    }

    // Formula: ((inspected_length / total_inspection_time_in_minutes) / 100) * 100

    const masterEfficiency = ((roll.inspected_length / totalTimeMinutes)/100) * 100;

    return masterEfficiency; // this will give meters per minute
  }

  getAverage(start: string, end: string): number | null {
    const roll = this.rolls_data_by_id;

    // if (!roll?.inspected_length || !roll?.roll_start_time || !roll?.roll_end_time) {
    //   return null;
    // }

    const start_date = new Date(start).getTime();
    const end_date = new Date(end).getTime();

    // Total time in minutes
    const totalTimeMinutes = (end_date - start_date) / (1000 * 60);

    if (totalTimeMinutes <= 0) {
      return null;
    }

    // Formula: ((inspected_length / total_inspection_time_in_minutes) / 100) * 100
    const masterEfficiency = (roll.inspected_length / totalTimeMinutes);

    return masterEfficiency; // this will give meters per minute
  }

  get isInspectionAvailable(): boolean {
    return !!(
      this.inspectionchartStatus &&
      this.inspectionSpeedData &&
      this.inspectionSpeedData.length > 0
    );
  }

  get isRepairAvailable(): boolean {
    return !!(
      this.repairchartStatus &&
      this.repairSpeedData &&
      this.repairSpeedData.length > 0
    );
  }

  toggleLengthPerPage(){
    this.lengthPerPage = null;
    this.validationErrors = [];
  }

  downloadExcel() {
    const data = {
      roll_id: this.rollId,
      total_defect_count: this.rolls_data_by_id.defect_count
    };

    this.RollsService.downloadExcel(data).subscribe({
      next: (res: Blob) => {
        const blob = new Blob([res], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Report_${this.rollId}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },

      error: async (error) => {
        console.error('Download error:', error);

        if (error.error instanceof Blob) {
          try {
            const text = await error.error.text();
            const json = JSON.parse(text);
            this.toastrService.error(json.error || 'Download failed', 'Error');
          } catch (e) {
            this.toastrService.error('Error downloading Excel file', 'Error');
          }
        } else {
          this.toastrService.error(error.error || 'Download failed', 'Error');
        }
      }
    });
  }

}
