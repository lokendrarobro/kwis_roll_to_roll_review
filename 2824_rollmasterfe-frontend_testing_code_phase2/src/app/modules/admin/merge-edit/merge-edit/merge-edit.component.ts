// 16 feb backup

import { Component, OnDestroy, Renderer2, OnInit, ViewChild, ElementRef, ChangeDetectorRef, NgZone, Input, inject} from '@angular/core';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { FormGroup, FormControl, Validators, FormBuilder, AbstractControl, ValidationErrors } from '@angular/forms';
import { RollsService } from 'app/services/rolls.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, takeUntil, Subject,of, debounceTime } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { ECharts } from 'echarts';
import { defectStatusFilterList } from 'app/globalvariables/globalvariables';
import { defaultFeatureActivityList } from "app/globalvariables/globalvariables";
import { CommonService } from "app/services/common.service";
import { catchError,tap } from 'rxjs/operators';
import { Colors } from "../../../../globalvariables/globalvariables"
import { TranslocoService } from "@ngneat/transloco";
interface PredictRes {
  url: string;
  class: string;
}
@Component({
  selector: 'app-merge-edit',
  templateUrl: './merge-edit.component.html',
  styleUrls: ['./merge-edit.component.scss']
})
export class MergeEditComponent implements OnInit, OnDestroy {
  @ViewChild('diagramDiv') diagramDiv: ElementRef;
  @ViewChild('canvasContainer') canvasContainer!: ElementRef;
  @ViewChild('canvasElement', { static: true }) canvasElement: ElementRef<HTMLCanvasElement>;
  @ViewChild('listdefectContainer') listdefectContainer!: ElementRef;
  canvasheight: any = '800';
  @ViewChild('canvasstripElement', { static: true }) canvasstripElement: ElementRef<HTMLCanvasElement>;
  @ViewChild('noteTextarea') noteTextarea!: ElementRef<HTMLTextAreaElement>;
  canvas_strip_height: any = 0;
  canvas_strip_width: any = 0;
  private canvas: HTMLCanvasElement;
  // private canvasstrip: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ctxstrip: CanvasRenderingContext2D;

  private frames: any[] = [];
  private zoomFactor: number = 1.0;
  private minZoom: number = 1;
  private maxZoom: number = 5;
  showFirstInput: boolean = false;
  showBothInputs: boolean = false;
  dropdownList = [];
  defectStatusFilterList = [];
  checked_defect: any;
  dropdownSettings: IDropdownSettings = {};
  defectStatusFilterSetting: IDropdownSettings = {};
  clickedFields: { [key: string]: boolean } = {};
  checkedItems: any = [];
  id: any;
  status: any;
  permeter_width: any = 0;
  permeter_height: any = 0;
  metercal = 1000;
  verticalscaleheight = 50;
  horizantalwidth = 50;
  vertical_width = 80;
  temp: any = [];
  temp1: any = [];
  submitted: any = false;
  showFilter: boolean = false;
  isExpanded: boolean = false;
  rollWidthData: any = [];
  add_value: number = 20;
  drop_down_status:any = false;
  predictApiStatus: boolean = true;
  isPopupOpen: boolean = false;
  notes: string = '';
  options: any;
  popupDefectData: any = [];
  showDefectPopup: boolean = false;
  showChangeDefectNamePopup: boolean=false;
  searchTerm: string = "";
  defectsNameList: any[] = []; // Stores the full defect list
  filteredDefects: any[] = []; // Stores the filtered list
  showDropdown: boolean = false;
  selectedDefect: string = '';
  selectedDefectId: string = '';
  isPopupOpenDefect= false;
  selectedSuggestion: string = '';
  chartInstance!: ECharts;
  isNoteTooLong: boolean = false;
  currentDefectId: any;
  selected_defect:any={};
  index_no:any;
  isDropdownOpen=false;
  imageWidth: number = 4096;
  imageHeight: number = 1026;
  showImageAdjusterPopup: boolean = false;
  private readonly imageAdjusterComponentName: string = 'image_adjuster';
  private imageAdjusterSave$ = new Subject<void>();
  private isApplyingImageAdjusterConfig: boolean = false;
  imageAdjustments = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    gamma: 1
  };
  imageAdjusterFilter: string = this.buildImageFilter();
  all_cam_ids: string[] = [];   // from API
  cameraOptions: any[] = [];   // shown in dropdown
  selectedCameras: string[] = [];
  private xAxisSubscription: Subscription | undefined;
  private yAxisSubscription: Subscription | undefined;
  private DefectSizeSubscription: Subscription | undefined;
  isTyping: boolean = false;
  Form: FormGroup = new FormGroup({
    defect_type: new FormControl(""),
    defect_size: new FormControl(""),
    defect_size1: new FormControl(""),
    defect_size2: new FormControl(""),
    x_axis: new FormControl(""),
    x_axis1: new FormControl(""),
    y_axis: new FormControl(""),
    y_axis1: new FormControl(""),
    model_id: new FormControl(""),
    sortOrder:new FormControl(""),
    defect_status_filter:new FormControl(""),
    group_id:new FormControl(""),
    camera:new FormControl(""),
    slitting_type:new FormControl(""),
    slitting_id:new FormControl(""),
    selectedLocation:new FormControl(""),
    yLocationStart:new FormControl(""),
    yLocationEnd:new FormControl(""),
    xLocationStart:new FormControl(""),
    xLocationEnd:new FormControl(""),
    showUnmatched:new FormControl("")
  });
  all_defects: any;
  all_defect_types: any = [];
  criticalDefectData: any[] = [];
  colourCodeData: any[] = [];
  roll_id: string;
  totalAllDefects: any;
  AllDefectsData: any = [];
  AllDefectsPredictData: any = [];
  selectedAll: boolean = false;
  customer_roll_id: string;
  role_data: any = [];
  nodeDataArray_strip: any = [];
  nodeDataArray: any = [];
  nodeDataArray1: any = [];
  selectedDefectTypes: any = [];
  merge_defectType = '';
  allMergeDefectType: any = [];
  defectTypeSelected: boolean;
  displayDefectTypeError: boolean;
  AllDefectsData_permanent: any = [];
  startLimit: number = 0;
  endLimit: number = 100;
  startLimitstrip: number = 0;
  endLimitstrip: number = 500;
  startmeter: any = 0;
  endmeter: any = 1;
  totalmeter: any;
  isLeftExpanded: boolean = true;  // Left sidebar default state
  isRightExpanded: boolean = false; // Right sidebar default state
  kvp_backend_url: any;
  roll_quality_code_detail: any;
  isAllDefectsAreDeleted:boolean = false;
  RollWidthButtonStatus: boolean = false;
  @Input() featurePermissions: any[] = [];
  module_id:any = 3;
  loggedInRole:any = localStorage.getItem('role_id'); 
  doneReviewStatus: boolean = false;
  applyFilterStatus: boolean = false;
  deleteDefectsStatus: boolean = false;
  mergeDefectsStatus: boolean = false;
  showDefectInfoZoominZoomoutStatus: boolean = false;
  rollwidthTabStatus: boolean = false;
  loadMoreDefectsStatus: boolean = false;
  changeDefectTypeStatus: boolean = false;
  colors = Colors;
  selectedGrid: string = '3x2';
  gridOptions = ['2x2', '3x2'];

  onImageLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    this.imageWidth = img.naturalWidth;
    this.imageHeight = img.naturalHeight;
  }

  buildImageFilter(): string {
    return `url('#merge-edit-gamma-filter') brightness(${this.imageAdjustments.brightness}%) contrast(${this.imageAdjustments.contrast}%) saturate(${this.imageAdjustments.saturation}%)`;
  }

  updateImageFilter(): void {
    this.imageAdjusterFilter = this.buildImageFilter();
    this.scheduleImageAdjusterSave();
  }

  toggleImageAdjusterPopup(): void {
    this.showImageAdjusterPopup = !this.showImageAdjusterPopup;
  }

  resetImageAdjustments(): void {
    this.imageAdjustments = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      gamma: 1
    };
    this.selectedGrid = '3x2';
    this.updateImageFilter();
  }

  private scheduleImageAdjusterSave(): void {
    if (this.isApplyingImageAdjusterConfig) {
      return;
    }
    this.imageAdjusterSave$.next();
  }

  private persistImageAdjusterSettings(): void {
    const updatedBy = this.user_id ?? localStorage.getItem('user_id') ?? 'system';
    const configurationPayload = {
      imageAdjustments: {
        brightness: this.imageAdjustments.brightness,
        contrast: this.imageAdjustments.contrast,
        saturation: this.imageAdjustments.saturation,
        gamma: this.imageAdjustments.gamma
      },
      selectedGrid: this.selectedGrid
    };

    const data = {
      app_id: 15,
      configuration_data: JSON.stringify(configurationPayload),
      component_id: 1501,
      component_name: this.imageAdjusterComponentName,
      updated_by: updatedBy
    };

    this._RollsService.addSystemConfiguration(data).subscribe({
      next: () => {},
      error: (error) => {
        console.error('Failed to save image adjuster settings', error);
      }
    });
  }

  private loadImageAdjusterSettings(): void {
    const payload = {
      component_name: this.imageAdjusterComponentName,
    };

    this._RollsService.getSystemConfiguration(payload).subscribe({
      next: (response: any) => {
        const data = response?.data || [];
        if (!data.length || !data[0]?.configuration_data) {
          return;
        }

        const rawConfig = data[0].configuration_data;
        let config: any = rawConfig;
        if (typeof rawConfig === 'string') {
          try {
            config = JSON.parse(rawConfig);
          } catch (error) {
            console.error('Invalid image adjuster configuration JSON', error);
            return;
          }
        }

        this.isApplyingImageAdjusterConfig = true;
        const adjustments = config?.imageAdjustments || {};
        this.imageAdjustments = {
          brightness: this.clampNumber(adjustments.brightness, 0, 300, 100),
          contrast: this.clampNumber(adjustments.contrast, 0, 300, 100),
          saturation: this.clampNumber(adjustments.saturation, 0, 300, 100),
          gamma: this.clampNumber(adjustments.gamma, 0, 10, 1)
        };

        const grid = config?.selectedGrid;
        if (grid === '2x2' || grid === '3x2' || grid === '5x2') {
          this.selectedGrid = grid;
        }

        this.updateImageFilter();
        this.updateGridOptions();
        this.isApplyingImageAdjusterConfig = false;
      },
      error: (error) => {
        console.error('Failed to load image adjuster settings', error);
      }
    });
  }

  private clampNumber(value: any, min: number, max: number, fallback: number): number {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return fallback;
    }
    return Math.min(Math.max(numericValue, min), max);
  }
  toggleLeft(): void {
    this.isLeftExpanded = !this.isLeftExpanded;
    this.updateGridOptions();
  }
  toggleRight(): void {
    this.isRightExpanded = !this.isRightExpanded;
    this.updateGridOptions();
    this.getNote();
  }
  tempstrip_height: any = 0;
  imagebasepath: any =`${localStorage.getItem('api_path')?.replace('/api', '')}`+ 'uploads/';
  
  map_default_width: any = `${(window as any).__env.map_default_width}`;
  map_default_width_error: any = false;
  startLimitFilter: any = 0;
  endLimitFilter: any = 50;
  canvas_height: number = 0;
  canvas_height_new: number = 0;
  canvas_width: number = 600;
  canvas_width_new: number = 600;
  xscaletotalheight: any;
  totalscalelength: number = 0;
  yscaletotalheight: any = 0;

  yellowstripposX: any = 0;
  yellowstripposX1: any = 60;
  yellowstripposY: any = 0;
  yellowstripposY1: any = 0;
  totalnopages: any = 0;
  datadirection: string = 'load';
  defectdirection: string = 'next';
  perDefectCount: any = 0;
  TotalFilterDefectCount: any = 0;
  checkdefect: any;
  startmeterframe: any = 0;
  endmeterframe: any = 500;
  hiddenAllDefectsDataframe: any = [];
  allframesload: any = 'false';
  alldataload: any = 'false';
  startcheckvalue: number = 0;
  endcheckvalue: number = 0;
  InspectedLengthString: any = 0;
  InspectedLength: any = 0;
  defectforstrip: any = [];
  reviewJobId: any
  defectsVisible: any = true;
  predict_function_check = 0;
  user_id
  formData
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  hoveredDefect: any;
  all_model_data: any;
  ai_suggestion_data: any;
  opt2: string[] = ['ON', 'OFF']; // Array of options
  selectedIndex2: number | null = 0;
  maxAllowablePoints: number = 0;
  measurementUnit: string = 'mm';
  pointOptions: number[] = [];
  defectGradingRules: any[] = [];
  showLoadMoreButton: boolean = false;
  data_number_to_show_button: number = 500;
  robro_roll_id: any;
  showXLocationDropdown: boolean = false;
  xLocationList: any[] = []; 
  showYLocationDropdown: boolean = false;
  yLocationList: any[] = []; // X location values ka array
  allGroups: { group_id: number, cam_ids: number[] }[] = []; // stores API data
  groupOptions: { item_id: number, item_text: string }[] = []; // for group dropdown
  allCameras: number[] = [];
  showUnmatched: boolean = false;
  role:any = localStorage.getItem('role').toLowerCase();
  spliceForm!: FormGroup;
  showSpliceModal = false;
  spliceData: any = [];
  isSpliceEditMode: boolean = false;
  selectedSpliceId: number | null = null;
  showDeleteConfirm = false;
  spliceDefectIds: any[] = [];
  showDefect: any = false;
  addEditNoteStatus: boolean = false;
  updateAiSuggestionStatus: boolean = false;
  undeleteDefectStatus: boolean = false;
  addSpliceStatus: boolean = false;

  constructor(private NavigationService: NavigationService,
    private cdr: ChangeDetectorRef,
    private _formBuilder: FormBuilder,
    private _RollsService: RollsService,
    private router: Router,
    private renderer: Renderer2,
    private toastrService: ToastrService,
    private _UserService: UserService,
    private route: ActivatedRoute,
    private commonService: CommonService,
    private ngZone: NgZone,
    private translocoService: TranslocoService
  ) { 
    this.get_module_permission(); 
  }

  onOptionSelected(selectedOption: string) {
    // Reset visibility variables
    this.showFirstInput = true;
    this.showBothInputs = false;

    // Clear input field values for all options
    this.Form.get('defect_size1').setValue(null);
    this.Form.get('defect_size2').setValue(null);

    if (selectedOption === '') {
      this.showFirstInput = false;
      // Reset validators for all options
      this.Form.get('defect_size1').clearValidators();
      this.Form.get('defect_size1').updateValueAndValidity();
      this.Form.get('defect_size2').clearValidators();
      this.Form.get('defect_size2').updateValueAndValidity();
    }
    // Set visibility based on the selected option
    if (selectedOption === '<=' || selectedOption === '>=') {
      this.showFirstInput = true;
      this.Form.get('defect_size1').setValidators([Validators.required]);
      this.Form.get('defect_size1').updateValueAndValidity();
      this.Form.get('defect_size2').clearValidators();
      this.Form.get('defect_size2').updateValueAndValidity();
    }
    else if (selectedOption === '<>') {
      this.showBothInputs = true;
      this.Form.get('defect_size1').setValidators([Validators.required]);
      this.Form.get('defect_size1').updateValueAndValidity();
      this.Form.get('defect_size2').setValidators([Validators.required, this.greaterThan('defect_size1')]);
      this.Form.get('defect_size2').updateValueAndValidity();
    }
    this.cdr.detectChanges();
  }
  ngOnDestroy(): void {
    this.NavigationService.activeMainTab('true');
    if (this.xAxisSubscription) {
      this.xAxisSubscription.unsubscribe();
    }
    if (this.yAxisSubscription) {
      this.yAxisSubscription.unsubscribe();
    }
    if (this.DefectSizeSubscription) {
      this.DefectSizeSubscription.unsubscribe();
    }
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
  navigationId:any=null;
  ngOnInit(): void {
     setTimeout(() => {
      this.loggedInRole = localStorage.getItem('role_id');
      if (this.module_id && this.loggedInRole) {
        this.getAllFeaturePermission(this.module_id, this.loggedInRole);
      }
    }, 100);
    this.roll_id = localStorage.getItem("roll_id");
    this.InspectedLengthString = localStorage.getItem("inspected_length");
    this.InspectedLength = this.InspectedLengthString ? parseFloat(this.InspectedLengthString) : 0;
    this.InspectedLength = this.InspectedLength.toFixed(1);
    if (!this.roll_id) {
      this.router.navigate(['/roll-details']);
    }
    this.NavigationService.activeMainTab('false');
    this.dropdownList = [];
    this.dropdownSettings = {
      singleSelection: false,
      idField: 'item_id',
      textField: 'item_text',
      selectAllText: this.translocoService.translate('select_all'),
      unSelectAllText: this.translocoService.translate('unselect_all'),
      itemsShowLimit: 3,
      allowSearchFilter: true
    };
    this.defectStatusFilterSetting = {
      singleSelection: false,
      idField: 'item_value',
      textField: 'item_name',
      selectAllText: this.translocoService.translate('select_all'),
      unSelectAllText: this.translocoService.translate('unselect_all'),
      itemsShowLimit: 3,
      allowSearchFilter: true
    };
    this.Form = this._formBuilder.group(
      {
        defect_type: [''],
        model_id: [''],
        defect_size: [''],
        defect_size1: ['', Validators.pattern("^[0-9]+(\.[0-9]+)?$")],
        defect_size2: ['', [this.greaterThan('defect_size1'), Validators.pattern("^[0-9]+(\.[0-9]+)?$")]],
        x_axis: ['', Validators.pattern("^[0-9]+(\.[0-9]+)?$")],
        x_axis1: ['', [this.greaterThan('x_axis'), Validators.pattern("^[0-9]+(\.[0-9]+)?$")]],
        y_axis: ['', Validators.pattern("^[0-9]+(\.[0-9]+)?$")],
        y_axis1: ['', [this.greaterThan('y_axis'), Validators.pattern("^[0-9]+(\.[0-9]+)?$")]],
        sortOrder: ['Asc'],
        defect_status_filter:[''],
        group_id :[''],
        camera :[''],
        slitting_type:[''],
        slitting_id:[''],
         selectedLocation:[''],
        yLocationStart:[''],
        yLocationEnd:[''],
        xLocationStart:[''],
        xLocationEnd:[''],
        showUnmatched:[false]
      }
    );
    this.imageAdjusterSave$
      .pipe(debounceTime(400), takeUntil(this._unsubscribeAll))
      .subscribe(() => this.persistImageAdjusterSettings());
    this.spliceForm = this._formBuilder.group(
      {
        start_meter: ['', [Validators.required]],
        end_meter: ['', [Validators.required]],
        inspected_length:[''],
        exiting_splice_data:['']
      },
      { validators: this.meterRangeValidator } // ✅ form-level validator
    );
    this.loadImageAdjusterSettings();
    this.getUniqueCamIds();
    this.getCriticalDefectData();
    this.Form.get('defect_size')?.valueChanges.subscribe((value) => {
      // Reset validation messages when the select value changes
      this.Form.get('defect_size2')?.setErrors(null);
    });
    // Subscribe to changes in x_axis and trigger validation for x_axis1
    this.xAxisSubscription = this.Form.get('x_axis')?.valueChanges.subscribe(() => {
      this.Form.get('x_axis1')?.updateValueAndValidity();
    });
    this.yAxisSubscription = this.Form.get('y_axis')?.valueChanges.subscribe(() => {
      this.Form.get('y_axis1')?.updateValueAndValidity();
    });
    this.DefectSizeSubscription = this.Form.get('defect_size1')?.valueChanges.subscribe(() => {
      this.Form.get('defect_size2')?.updateValueAndValidity();
    });
    this.getRollWidth();
    this.getSpliceData();
    this.getDefectGradingData();
    this._UserService.user$.pipe((takeUntil(this._unsubscribeAll)))
      .subscribe((user: User) => {
        this.user_id = user.user_id;
      });

    let payload = {
      roll_id: this.roll_id,
      user_id: this.user_id,
    }

    this._RollsService.postStartReviewJob(payload).subscribe({
      next: (data) => {
        if (data?.status) {

          this.reviewJobId = data?.review_job_id;
        } else {
          this.toastrService.error(data.error);
        }

      },
      error: (err) => {
        this.toastrService.error(err);
      }
    })
    
  }

  openPopupDefect(defect:any){
    this.selectedDefect= defect;
    this.currentDefectId = defect?.id;
    this.isPopupOpenDefect=true;
   }
  closePopupDefect(){
    this.isPopupOpenDefect=false;
   }


  openNotePopup() {
    this.isPopupOpen = true;
    this.getNote()
  }
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
      note: this.notes
    };

    this._RollsService.add_notes(data).subscribe(
      (response: any) => {
        this.toastrService.success(this.translocoService.translate('note_saved_success'), this.translocoService.translate('success'));
        const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 9 && item.module_id === 3);
        if (activityObject) {
          this.commonService.addActivityLog(activityObject)
        }
        this.editNote();
      },
      (error) => {
        console.error('Error saving note:', error);
        this.toastrService.error(this.translocoService.translate('error_saving_note'), this.translocoService.translate('error'));
      }
    );

    this.closeNotePopup();
  }

  editNote() {
    if (this.noteTextarea) {
      const textarea = this.noteTextarea.nativeElement;
      if (textarea.value.trim() !== '' && !textarea.value.endsWith('\n')) {
        const noteValue = textarea.value + '\n'; 
        textarea.value = noteValue; 
      }
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
    else {
      const textarea = this.noteTextarea.nativeElement;
      if (textarea.value.trim() !== '' && !textarea.value.endsWith('\n')) {
        const noteValue = textarea.value + '\n'; 
        textarea.value = noteValue; 
      }
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  }

  updateNoteValidation() {
    this.isNoteTooLong = this.notes.length > 5000;
  }

  getNote() {
    const robro_roll_id = localStorage.getItem("robro_roll_id");
    if (!robro_roll_id) {
      this.toastrService.error(this.translocoService.translate('robro_roll_id_missing'), this.translocoService.translate('error'));
      return;
    }

    this._RollsService.get_notes(robro_roll_id).subscribe(
      (response: any) => {
        if (response.status) {
          this.notes = response.data.note;  // Assigning fetched note to the variable
        } 
      },
      (error) => {
        console.error('Error fetching note:', error);
        this.toastrService.error(this.translocoService.translate('error_fetching_note'), this.translocoService.translate('error'));
      }
    );
  }

  getDefectGradingData(): void {
    const payload = { component_name: 'defect_grading_config' };
    this._RollsService.getSystemConfiguration(payload).subscribe({
      next: (response: any) => {
        if (response.status && response.data.length > 0) {
          let configData = response.data[0].configuration_data;
          if (typeof configData === 'string') {
            try { configData = JSON.parse(configData); } catch (e) { configData = {}; }
          }
          this.defectGradingRules = configData?.grading_rules || [];
          this.maxAllowablePoints = parseInt(configData?.max_allowable_points || '0');
          this.measurementUnit = configData?.measurement_unit || 'mm';
          if (this.maxAllowablePoints > 0) {
            this.pointOptions = Array.from({ length: this.maxAllowablePoints + 1 }, (_, i) => i);
          }
          this.AllDefectsData.forEach(d => this.assignDefectPoints(d));
          this.calculateTotalScore();
        }
      }
    });
  }

  assignDefectPoints(defect: any) {
    // If a score is already saved in database, use it
    if (defect.is_score !== null && defect.is_score !== undefined) {
      defect.points = defect.is_score;
      return;
    }

    // let size = Math.max(defect.defect_width_mm || 0, defect.defect_height_mm || 0);
    const rawWidth = parseFloat(defect.defect_width_mm || 0);
    const rawHeight = parseFloat(defect.defect_height_mm || 0);
    let size = rawWidth * rawHeight;

    // console.group(`Defect Grading Debug: D${defect.defect_id}`);
    // console.log(`Raw Input: Width=${rawWidth.toFixed(3)}mm, Height=${rawHeight.toFixed(3)}mm`);
    // console.log(`Initial Area: ${size.toFixed(3)}mm²`);
    
    // Convert defect size to the configured measurement unit for matching
    if (this.measurementUnit === 'cm') {
      size = size / 100;
      console.log(`Converted to CM²: ${size.toFixed(3)}cm²`);
    } else if (this.measurementUnit === 'inch') {
      size = size / 645.16;
      console.log(`Converted to Inch²: ${size.toFixed(3)}inch²`);
    }

    const category = this.getDefectClass(defect.defect_type).trim().toLowerCase();

    //  console.log(`Lookup Category: "${category}"`);

    const matchedRule = this.defectGradingRules.find(rule => {
      const ruleCat = rule.defect_category.trim().toLowerCase();
      if (ruleCat !== category) return false;

      // const min = +rule.min_defect_size;
      // const max = +rule.max_defect_size;
      const min = parseFloat(rule.min_defect_size || 0);
      const max = parseFloat(rule.max_defect_size || 0);
      let isMatch = false;
      if (rule.condition === '<=') isMatch = size <= min;
      else if (rule.condition === '>=') isMatch = size >= min;
      else if (rule.condition === '<>') isMatch = size >= min && size <= max;

      // if (isMatch) console.log(`Matched Rule: ID=${rule.rule_id}, Condition="${rule.condition}", Range=[${min}, ${max}], Points=${rule.points}`);
      console.log(`Rule ID ${rule.rule_id}: ${rule.condition} (Range: ${min}-${max}) -> Match: ${isMatch}`);
      if (isMatch) console.log(`>>> Matched Rule SUCCESS: Points=${rule.points}`);
      return isMatch;
    });

    
    // if (!matchedRule) console.log("Outcome: No matching rule found.");
    console.groupEnd();

    defect.points = matchedRule ? parseInt(matchedRule.points) : 0;
  }

  onPointChange(defect: any, event: any) {
    const val = event.target.value;
    defect.points = parseInt(val) || 0;
    this.calculateTotalScore();

    const payload = {
      defect_id: defect.defect_id,
      robro_roll_id: this.role_data.robro_roll_id,
      is_score: defect.points
    };

    this._RollsService.updateDefectScore(payload).subscribe({
      next: (res) => {
        if (!res.status) {
          this.toastrService.error(this.translocoService.translate('failed_to_save_score'));
        } else {
          // After saving, get the value and update local state to prioritize it
          defect.is_score = res.data?.is_score ?? defect.points;
        }
      },
      error: (err) => console.error("Error saving defect score:", err)
    });
  }

  calculateTotalScore() {
    const total = this.AllDefectsData.reduce((sum, d) => sum + (d.delete_status == 1 ? 0 : (+d.points || 0)), 0);
    this.role_data.score = total;
    this.cdr.detectChanges();
  }


  highlightDefect(defectId: string) {
    if (this.chartInstance) {
      const index = this.nodeDataArray_strip.findIndex(item => item.defect_id === defectId);

      if (index !== -1) {
        const targetPoint = this.nodeDataArray_strip[index];

        // Scroll to center the defect with a wider range
        this.chartInstance.dispatchAction({
          type: 'dataZoom',
          xAxisIndex: 0,
          startValue: targetPoint.defect_top_left_x_mm / 1000 - 2, // Wider range
          endValue: targetPoint.defect_top_left_x_mm / 1000 + 2
        });

        this.chartInstance.dispatchAction({
          type: 'dataZoom',
          yAxisIndex: 0,
          startValue: targetPoint.defect_top_left_y_mm / 1000 - 20, // Wider range
          endValue: targetPoint.defect_top_left_y_mm / 1000 + 20
        });

        // Add a small delay to let the chart finish zooming
        setTimeout(() => {
          this.chartInstance.dispatchAction({
            type: 'showTip',
            seriesIndex: 0,
            dataIndex: index,
            position: (point, params, dom, rect, size) => {
              return [point[0], point[1] + 10]; // Show tooltip just below the dot
            }
          });
        }, 300); // 300ms delay — you can adjust this if needed
      } else {
        console.warn(`Defect ID ${defectId} not found`);
      }
    }
  }

  imagePopupOpen(data: any) {
    if(!this.showDefectInfoZoominZoomoutStatus)
    {
      this.toastrService.warning(this.translocoService.translate('no_permission_view_image'));
      return;
    }
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

  closeDefectImagePopup() {
    this.showDefectPopup = false;
    this.zoomLevel = 1;
    this.pointX = 0;
    this.pointY = 0;
    if (this.popupDefectData?.defect_id) {
      this.highlightDefect(this.popupDefectData.defect_id);
    }
  }
  
  closeChangeDefectNamePopup() {
    this.searchTerm='';
    this.currentDefectId='';
    this.selectedDefect='';
    this.showChangeDefectNamePopup = false;
  }
  openChangeDefectNamePopup(defect,i) {
    if(!this.changeDefectTypeStatus)
    {
      this.toastrService.warning(this.translocoService.translate('no_permission_change_defect_type'));
      return;
    }
    this.selected_defect=defect;
    this.index_no=i;
    this.showChangeDefectNamePopup = true;
    this.currentDefectId = defect.defect_id;  // Add this line to make sure currentDefectId is set
    this.searchTerm = '';
    this.filteredDefects = [...this.defectsNameList];
    this.showDropdown = true;
    this.defectsNameList = this.dropdownList;
    this.filteredDefects = this.dropdownList;
    this.selectedDefectId = defect.defect_id;  
  }
 
    filterOptions() {
      const term = this.searchTerm?.trim().toLowerCase();
      if (!term) {
        this.filteredDefects = [...this.defectsNameList];
      } else {
        this.filteredDefects = this.defectsNameList.filter(defect =>
          defect.item_text.toLowerCase().includes(term)
        );
      }
      this.showDropdown = true;
    }
    
    
    hideDropdownWithDelay() {
      setTimeout(() => {
        this.showDropdown = false;
      }, 200);
    }  
    
    saveSelectedDefect() {
   
      const defectData = {
        defect_id: this.currentDefectId, // Ensure this is correctly populated
        defect_type: this.searchTerm?.trim() || '',
        robro_roll_id: localStorage.getItem("robro_roll_id")
      };
   
      if (!defectData.defect_id || !defectData.defect_type) {
   
        return;
      }
   
      this._RollsService.UpdateDefectsName(defectData).subscribe(res => {
   
        if (res.status) {
          this.closeChangeDefectNamePopup();
          this.searchTerm = '';
          this.currentDefectId = '';
          this.selectedDefectId = '';
          this.selected_defect = {...this.selected_defect, defect_type:defectData.defect_type}
          this.AllDefectsData[this.index_no] = this.selected_defect;
          this.assignDefectPoints(this.AllDefectsData[this.index_no]);
          this.calculateTotalScore();
          this.drawScatterPlot(); // Redraw scatter plot to reflect potential point changes
          this.getUniquedefects();
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 8 && item.module_id === 3);
          if (activityObject) {
            this.commonService.addActivityLog(activityObject)
          }
        } else {
          console.error('API returned error:', res);
        }
      }, error => {
        console.error('API call failed:', error);
   
      });
    }

    // Select a defect from the list
    selectDefect(defect: string) {
      this.searchTerm = defect;
      this.showDropdown = false;
    }
  
  
    // update defect name in filter defect api
    saveDefectNameToCard() {
      const selectedDefect = this.defectsNameList.find(
        (defect: any) => defect.defect_name === this.searchTerm
      );
      const defect_type_id = selectedDefect ? selectedDefect.id : this.defectsNameList.length+1; // Get defect_type_id
      // API Call to UpdateDefectsName
      const requestData = {
        defect_id: this.selectedDefectId,
        defect_type: this.searchTerm,
        defect_type_id: defect_type_id, // Ensure defect_type_id is passed
      };
  
      this._RollsService.UpdateDefectsName(requestData).subscribe({
        next: (response: any) => {
          if (response.status) {
             this.toastrService.success(this.translocoService.translate('defect_name_updated_success'))
            
          } else {
            console.error("Error updating defect:", response.message);
          }
        },
        error: (error) => {
          console.error("API Error:", error);
        },
      });
      this.searchTerm="";
      this.closeChangeDefectNamePopup();
    }
 
  
  getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }


// ---------------------------------------------------------------------

  getRollWidth(): void {
    const data = {
      roll_id: this.roll_id,
    };

    this._RollsService.get_all_roll_width_data(data).subscribe({
      next: (response: any) => {
        if (response?.status) {
          this.rollWidthData = response.data;
          if (Array.isArray(this.rollWidthData)) {
          }
        }
      },
      error: (err) => {
        console.error('Error fetching roll width data:', err);
      },

    });
  }
  toggleDefectsVisibility(index: number): void {
    if(this.selectedIndex2 == index) return;
    if(index == 0){
      this.defectsVisible = true;
    }else{
      this.defectsVisible = false;
    }
    this.selectedIndex2 = index;
  }
 
  private isZoomedIn: any = 0;
  clickcheck: any = 0;
  private handleClick(e: MouseEvent): void {
    e.preventDefault();
    this.clickcheck++;
    const zoomSpeed = 20;
    const zoomDelta = zoomSpeed;

    // Toggle zoom direction between zooming in and zooming out
    const zoomDirection = this.isZoomedIn ? -1 : 1;

    this.zoomFactor = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomFactor + zoomDirection * zoomDelta));

    // Get current mouse position relative to the canvas
    const rect = this.canvasContainer.nativeElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate the ratio of the old position to the new position
    const ratioX = mouseX / this.canvasContainer.nativeElement.offsetWidth;
    const ratioY = mouseY / this.canvasContainer.nativeElement.offsetHeight;

    // Update canvas size
    this.canvas_width_new = this.canvas_width * this.zoomFactor;
    this.canvas_height_new = this.canvas_height * this.zoomFactor;

    // Adjust the scroll position to focus on the new point
    this.canvasContainer.nativeElement.scrollTo({
      left: ratioX * (this.canvasContainer.nativeElement.scrollWidth - this.canvasContainer.nativeElement.offsetWidth),
      top: ratioY * (this.canvasContainer.nativeElement.scrollHeight - this.canvasContainer.nativeElement.offsetHeight),
      behavior: 'auto'
    });

    // Toggle isZoomedIn state
    if (this.clickcheck == 2) {
      this.clickcheck = 0;
      this.isZoomedIn = !this.isZoomedIn;
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    this.isTyping = true;
    const allowedChars = /[0-9.]/;
    const inputChar = String.fromCharCode(event.charCode);

    if (!allowedChars.test(inputChar)) {
      event.preventDefault();
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
  // Additional method to check if the form is valid
  isFormValid() {
    return this.Form.valid;
  }
  onInputFieldClick(fieldName: string): void {
    this.clickedFields[fieldName] = true;
  }

  isFieldClicked(fieldName: string): boolean {
    const control = this.Form.get(fieldName);
    return this.clickedFields[fieldName] && control && control.value !== '';
  }

  onItemSelect(item: any) {
  }
  onSelectAll(items: any) {
  }
  isLoading: boolean = false;
  loadData(): void {
    this.showLoadMoreButton = false
    this.isLoading = true;
    this.defectdirection = 'next';
    this.startLimitFilter = this.startLimitFilter + 50;
    this.endLimitFilter = this.endLimitFilter + 50;
    this.predict_function_check = 0;
    this.isAllDefectsAreDeleted = false;
    setTimeout(() => {
      this.onSubmit('load', 'second');
    }, 100);
  }
  filterFormData:any={}
  async onSubmit(type, call_type){
    let camera_data = []; 
    this.checkedItems = [];
    this.submitted = true;
    if (this.Form.invalid) {
      this.isLoading = false;
      return;
    }
    if (type == 'filter') {
      this.AllDefectsData = [];
      this.AllDefectsPredictData = [];
      this.perDefectCount = 0;
      this.startLimitFilter = 0;
      this.endLimitFilter = 50;
      this.showLoadMoreButton = false;
      this.predict_function_check = 0;
    }
    this.commonFilterPayload();

      let filteredDefectData:any = await this.get_filter_defect(this.formData);
      this.TotalFilterDefectCount = filteredDefectData.total_defect_filter_count;
      this.selectedAll = false;
      this.submitted = false;
      
      if (filteredDefectData.data.length > 0 && this.predictApiStatus) {
        let predict_defect_type = await this.predict_defect_type(filteredDefectData.data);
        if(predict_defect_type){
            let update_defects_data:any = await this.update_defects_data(predict_defect_type)
            if(update_defects_data.status){
              this.manageCallingLoadmoreData(call_type, update_defects_data)
            }else{
              this.manageCallingLoadmoreData(call_type, filteredDefectData); 
            }
          }else{
            this.manageCallingLoadmoreData(call_type, filteredDefectData); 
          }
      }else{
        this.manageCallingLoadmoreData(call_type, filteredDefectData); 
      }
      this.drawScatterPlot();
      // if(camera_data.length > 0){
   
    }
     
  getDefectClass(defectType: string): string {
    if (!defectType) return '';
    return defectType.split(' ')[0];
  }
  getSuggestion(defect: any): string {
    return defect.user_suggestion ? defect.user_suggestion : defect.ai_suggestion;
  }
  isMatch(defect: any): boolean {
    return this.getDefectClass(defect.defect_type) === this.getSuggestion(defect);
  }

  manageCallingLoadmoreData(call_type, update_defects_data) {
    if (call_type === 'first') {
      this.applyCameraFilter();
    } 
    this.AllDefectsData = this.AllDefectsData.concat(update_defects_data.data);
    update_defects_data.data.forEach(d => this.assignDefectPoints(d));
    this.calculateTotalScore();
    this.perDefectCount = this.perDefectCount + update_defects_data.data.length;
    // checking is all defects are deleted or not
    this.isAllDefectsAreDeleted = this.AllDefectsData.every(data => data.delete_status == 1);
    //         // Reset limits if they exceed the total number of items
    if (this.endLimitFilter >= this.TotalFilterDefectCount && call_type == 'again' ) {
      this.startLimitFilter = 0;
      this.endLimitFilter = 50;
    }
  //         // Set loading state to false when data is loaded
    this.isLoading = false;
    // // Load more data in set of 50-50 and toggle load more button
    if (this.showLoadMoreButton == false && this.perDefectCount < this.TotalFilterDefectCount && this.perDefectCount % this.data_number_to_show_button !== 0) {
      this.loadData();
    } else if (this.showLoadMoreButton == false && this.perDefectCount < this.TotalFilterDefectCount && this.perDefectCount % this.data_number_to_show_button == 0) {
      this.showLoadMoreButton = true;
      this.predictApiStatus = true;
    }
  }

  slitting_info: any = [];
  slitting_position_data: any = []
  async get_filter_defect(formData) {
    // console.log("formData",formData);
    return new Promise((resolve, reject) => {
      this._RollsService.get_filter_defect(formData).subscribe(
        (response: any) => {
          if (this.startLimitFilter === 0 && this.endLimitFilter === 50) {
            if (response?.slitting_info && response?.slitting_info.length > 0) {
              this.slitting_info = response.slitting_info;
            }
            if (response?.slitting_position_data && response?.slitting_position_data.length > 0) {
              this.slitting_position_data = response.slitting_position_data;
            }
          }


          if (typeof response.data != 'string') {
            resolve(response);
          } else {
            reject(null);
          }
        })
    })
  }
  async predict_defect_type(filteredDefectData){
    return new Promise((resolve, reject) => {
      if (this.Form.get('model_id').value != null && this.Form.get('model_id').value != '') {
          const ai_suggestion_data = { img_ip: 'localhost'};
          filteredDefectData.forEach((defect, index) => {
            if (defect.user_suggestion) { }
            else {
              ai_suggestion_data[`${index}`] = {
                defect_id: defect.defect_id,
                url: defect.cropped_image_path,
                class: defect.user_suggestion && defect.user_suggestion.trim() !== '' ? defect.user_suggestion : defect.defect_type
              };
            }
          });
          this._RollsService.predict_defect_type(ai_suggestion_data).subscribe({
          next:
            (response) => {
              let PredictData:PredictRes[] = response;
              if (PredictData) {
                // Check missing prediction ids
                const aiSuggestionDataIds = Object.values(ai_suggestion_data).map((item: any) => item.defect_id);
                const PredictDataIds = Object.values(PredictData).map((item: any) => item[0].defect_id);
                // Find missing ids
                const missingIds = aiSuggestionDataIds.filter(id=> !PredictDataIds.includes(id));
                missingIds.forEach(missingId => {
                  if(missingId)
                  {
                     const missingObj: any = Object.values(ai_suggestion_data).find((item: any) => item.defect_id === missingId);
                  if (missingObj) {  // Check if missingObj is found
                    PredictData[Object.keys(PredictData).length] = { ...missingObj, class: 'NA' }; // Default value
                  } else {
                    console.warn(`No matching object found for URL: ${missingId}`);
                  }
                  }
                 
                });


                resolve(PredictData);
              }
              else{
                resolve(null)
              }
            },
          error: (err) => {
            // this.toastrService.error(this.translocoService.translate('predict_fetch_error'));
            const data = { "data": filteredDefectData }
            this.predictApiStatus = false;
            this.manageCallingLoadmoreData('again', data);
            console.error('Error:', err);
          }
        });
      }else{
        resolve(null)
      }
    })
  }
   async update_defects_data(predict_defect_type) {
    let ai_suggestion_data: any = [];
    for (let key in predict_defect_type) {
      if(Array.isArray(predict_defect_type[key]) && predict_defect_type[key].length > 0){
        const item = predict_defect_type[key][0];
        const defectPrediction = item.predictions || [];
        // HANDLE EMPTY PREDICTIONS
        if (defectPrediction.length === 0) {
          continue;
        }
        const highestConfidencePrediction = defectPrediction.reduce(
          (prev, current) => (prev.confidence > current.confidence) ? prev : current
        );

        ai_suggestion_data.push({
          defect_id: predict_defect_type[key][0].defect_id,
          class: highestConfidencePrediction.name
        });
      }else if(Object.keys(predict_defect_type[key]).length > 0 ){
        ai_suggestion_data.push({
          defect_id: predict_defect_type[key].defect_id,
          class: predict_defect_type[key].class
        });
      }
    }

    return new Promise<any>((resolve, reject) => {
      if (ai_suggestion_data.length === 0) {
        console.error("No AI predictions to update");
        resolve({ status: false });
        return;
      }

      const data = {
        "model_id": Number(this.Form.get('model_id').value),
        "ai_suggestion_data": ai_suggestion_data,
        "formData": this.filterFormData,
        "robro_roll_id": localStorage.getItem("robro_roll_id")
      }
      this._RollsService.update_defect(data).subscribe({
        next:
          (response) => {
            if (response.status) {
              resolve(response)
            } else {
              resolve(null)
            }
          },
        error: (err) => {
          console.error('Error:', err);
          this
          // this.toastrService.error("Unable to update AI suggestion.");
          this.toastrService.error(this.translocoService.translate('Unable_to_update_AI_suggestion'));
          resolve(null);
        }
      });
    })
  }

  resetForm() {
    // this.Form.reset();
    this.checkedItems = [];
    this.clickedFields = {};
    if(!this.roll_quality_code_detail)
    {
      setTimeout(() => {
        this.Form.patchValue({
          model_id: this.all_model_data[0].model_id,
        });
      }, 100);
    }
    setTimeout(() => {

      this.Form.get('x_axis1').setErrors(null);
      this.Form.get('y_axis1').setErrors(null);

      this.Form.get('x_axis1').clearValidators();
      this.Form.get('x_axis1').updateValueAndValidity();

      this.Form.get('y_axis1').clearValidators();
      this.Form.get('y_axis1').updateValueAndValidity();
      if(!this.roll_quality_code_detail){
        this.Form.get('defect_size1').clearValidators();
        this.Form.get('defect_size1').updateValueAndValidity();
        this.Form.get('defect_size2').clearValidators();
        this.Form.get('defect_size2').updateValueAndValidity();
        this.showFirstInput = false;
        this.showBothInputs = false;
      }
      // Reapply validators to the specific controls
      this.Form.get('x_axis1').setValidators(this.greaterThan('x_axis'));
      this.Form.get('y_axis1').setValidators(this.greaterThan('y_axis'));

      this.Form.get('x_axis1').updateValueAndValidity();
      this.Form.get('y_axis1').updateValueAndValidity();
      this.slitting_position = []
      // Clear the values of all controls
      Object.keys(this.Form.controls).forEach(controlName => {
        if(this.roll_quality_code_detail){
          if(controlName === 'defect_type' || controlName === 'model_id' || controlName === 'defect_size' ||controlName === 'defect_size1' || controlName === 'defect_size2' ){
            // console.log("controlName1",controlName);
            return;
          }
        }
        this.Form.get(controlName).setValue('');
      });
      this.Form.controls.sortOrder.setValue('Asc');
      this.Form.controls.group_id.setValue('');
      this.Form.controls.camera.setValue('');
      this.startLimitFilter = 0;
      this.endLimitFilter = 50;
      this.onSubmit('filter', 'first');
      // this.drawScatterPlot();
      this.applyCameraFilter();
    }, 0);
  }

  ngAfterViewInit(): void {
    this._RollsService.show();
    this.cdr.detectChanges(); 
    this.getAllModelList();
  }

  loaderOff() {
    if (this.alldataload == 'true') {
      if (this.nodeDataArray_strip.length > 0) {
        const filterarrayframes_data = this.hiddenAllDefectsDataframe.filter(
          frame_data => frame_data.defect_frame_id == this.nodeDataArray_strip[0].defects_frame_id);
        if (filterarrayframes_data.length > 0) {
          this.startcheckvalue = Math.floor(filterarrayframes_data[0].frame_start_meter * 10) / 10;
        }

        this.endcheckvalue = Math.floor((((this.nodeDataArray_strip[this.nodeDataArray_strip.length - 1].defect_top_left_y_mm) / this.metercal) + (this.nodeDataArray_strip[this.nodeDataArray_strip.length - 1].defect_height_mm / this.metercal)) * 10) / 10;


      }



      this.current_meter_for_defect();
      this._RollsService.hide();
    }
  }
  loadAllframes() {
    const framedata = {
      roll_id: this.roll_id,
      startmeter: this.startmeterframe,
      endmeter: this.endmeterframe
    }
    if (this.endmeterframe <= this.totalmeter) {
      this._RollsService.getframe(framedata).subscribe({
        next: (response: any) => {
          //convert mm into meter unit
          if (typeof response.data != 'string') {
            if (response.data.length === 0) {
              this.startmeterframe = this.endmeterframe;
              this.endmeterframe = this.endmeterframe + 500;

              this.loadAllframes();

            } else {

              this.hiddenAllDefectsDataframe = this.hiddenAllDefectsDataframe.concat(response.data);

              this.startmeterframe = this.endmeterframe;
              this.endmeterframe = this.endmeterframe + 500;

              this.loadAllframes();

            }
          }

        },
        error: (error) => {
          console.error('Error fetching data from the API', error);
        }
      });
    } else {
      this._RollsService.getframe(framedata).subscribe({
        next: (response: any) => {
          this.hiddenAllDefectsDataframe = this.hiddenAllDefectsDataframe.concat(response.data);

          this.startmeterframe = 0;
          this.endmeterframe = 500;

          this.allframesload = "true";
          this.loaderOff();
        },
        error: (error) => {
          console.error('Error fetching data from the API', error);
        }
      });
    }
  }
  showModal = false;
  showModal1 = false;
  selectCheck = false;
  mergeCheck = false;
  showBoxModal() {
    if (this.checkedItems.length === 0) {
      // Show validation message if no checkboxes are checked
      this.selectCheck = true;
    } else {
      // Proceed with the delete confirmation popup
      this.showModal = true;
    }
  }
  showBoxModal1() {
    this.checkedItems = this.checkedItems.filter(item => item !== '');
    if (this.checkedItems.length <= 1) {
      // Show validation message if no checkboxes are checked
      this.mergeCheck = true;
    } else {
      // Proceed with the delete confirmation popup
      this.showModal1 = true;
    }
  }

  selectCheckbox() {
    this.selectCheck = true;
  }
  mergeCheckbox() {
    this.mergeCheck = true;
  }
  closeBoxModal() {
    this.showModal = false;
  }
  closeBoxModal1() {
    this.showModal1 = false;
  }
  closeCheckbox() {
    this.selectCheck = false;
  }
  closeMergeCheckbox() {
    this.mergeCheck = false;
  }
  onCheckboxChange(id: number): void {
    const index = this.checkedItems.indexOf(id);
    if (index === -1) {
      this.checkedItems.push(id); // If not present in the array, add it
    } else {
      this.checkedItems.splice(index, 1);
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

  private getAllDefectsbyRollId() {
    this.dropdownList = [];
    this._RollsService.totaldefect().subscribe({
      next: (response: any) => {
        this.all_defect_types = response.data;
      },
      error: (error: any) => {
        console.error('Error fetching data from the API', error);
      }
    });
  }

  delete_defect() {
    if (this.checkedItems.length === 0) {
      return;
    }
    const data = {
      defect_id: this.checkedItems,
      robro_roll_id:localStorage.getItem("robro_roll_id")
    }
    this._RollsService.defectdelete(data).subscribe(
      (response) => {
        if (response.status) {
          this.showModal = false;
          this.selectedAll = false;
          this.get_rollsdatabyid();
          let data = [];
          this.canvas_refresh('delete', data);
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 3 && item.module_id === 3);
          if(activityObject){
            this.commonService.addActivityLog(activityObject)
          }
        }
      });
  }
  getRollsDataByIdFirst() {
    this._RollsService.get_rollsdatabyid(this.roll_id).subscribe(
      (response) => {

        if (response.status) {
          this.role_data = response.data[0];
          let totalwidth = this.canvas_width - this.vertical_width;
          this.totalmeter = this.role_data.inspected_length
          this.permeter_height = 900;
          let temper_width = this.map_default_width / this.metercal;
          this.permeter_width = totalwidth / temper_width;
          this.canvas_height = this.permeter_height;
          this.canvas_height_new = this.permeter_height;
          this.totalscalelength = (this.map_default_width / this.metercal);
          this.yscaletotalheight = this.totalmeter;
          this.tempstrip_height = this.canvas_strip_height / this.totalmeter;
          this.get_all_defect_by_roll_id(this.roll_id);
          this.getQualityCodeByName(this.role_data.quality_code)
          // this.loadAllframes();
          this.setDefectFilterList();
        }
      });
  }

  get_rollsdatabyid() {
    this._RollsService.get_rollsdatabyid(this.roll_id).subscribe(
      (response) => {

        if (response.status) {
          this.role_data = response.data[0];
        }
      });
  }
  update_roll() {
    let payload = {
      review_job_id: this.reviewJobId,
      robro_roll_id: this.roll_id
    }
    this._RollsService.postEndReviewJob(payload).subscribe({
      next: (data: any) => {
        if (data?.status) {
          // this.toastrService.success(data?.message);
          const data1 = {
            roll_id: this.roll_id,
            status: 'REVIEWED',
          }
          this._RollsService.update_roll(data1).subscribe(
            (response) => {
              this.toastrService.success(this.translocoService.translate('roll_review_success'), this.translocoService.translate('success_exclamation'));
              const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 1 && item.module_id === 3);
              if(activityObject){
                this.commonService.addActivityLog(activityObject)
              }
              this.router.navigate(['/dashboards/roll']);
            });
        }
        else {
          this.toastrService.error(data.error);
        }

      },
      error: (err) => {
        this.toastrService.error(err.error);
      }
    })

  }
  onCheckboxMerge(defect_type): void {
    this.selectedDefectTypes = Array.from(
      this.AllDefectsData
        .filter(defect_data => this.checkedItems.includes(defect_data.defect_id))
        .map(defect_data => ({ defect_name: defect_data.defect_type }))
        .reduce((uniqueDefects, defect) => {
          // Check if an item with the same defect_id already exists
          const existingItem = uniqueDefects.find(item => item.defect_name === defect.defect_name);
          // If not, add the item to the uniqueDefects array
          if (!existingItem) {
            uniqueDefects.push(defect);
          }

          return uniqueDefects;
        }, [])
    );
  }

  defect_type: string = '';

  merge_defect() {
    if (!this.merge_defectType) {
      this.displayDefectTypeError = true;
      return;
    }
    this.displayDefectTypeError = false;
    let defect_id = [];
    let xTLValues = [];
    let xBRValues = [];
    let yTLValues = [];
    let yBRValues = [];
    let confidence = [];
    let imagepath = '';

    let x = 0;
    for (const itemId of this.checkedItems) {
      const filteredArray = this.AllDefectsData.filter(defect_data => defect_data.defect_id === itemId);
      if (filteredArray.length > 0) {
        if (x == 0) {
          imagepath = filteredArray[0].cropped_image_path;
        }
        defect_id.push(filteredArray[0].defect_id);
        xTLValues.push(filteredArray[0].defect_top_left_x_mm);
        yTLValues.push(filteredArray[0].defect_top_left_y_mm);
        xBRValues.push(filteredArray[0].defect_top_left_x_mm + filteredArray[0].defect_width_mm);
        yBRValues.push(filteredArray[0].defect_top_left_y_mm + (filteredArray[0].defect_height_mm));
        confidence.push(filteredArray[0].confidence);
      }
      x++;
    }
    const indexMenor = yBRValues.indexOf(Math.min(...yBRValues));
    const indexMenor1 = yBRValues.indexOf(Math.max(...yBRValues));
    const x_axis_min = Math.min(...xTLValues);
    const y_axis_min = Math.min(...yTLValues);
    const x_axis_max = Math.max(...xBRValues);
    const y_axis_max = Math.max(...yBRValues);
    const defect_frame_image_data = this.nodeDataArray_strip.filter(defect_data => defect_data.defect_id === defect_id[indexMenor]);
    const defectData = this.AllDefectsData.filter(defect_data => defect_data.defect_id === this.checkedItems[indexMenor]);
    // Finding the maximum and its index

    let new_width = x_axis_max - x_axis_min;
    let new_height = y_axis_max - y_axis_min;
    const confidence_id = Math.max(...confidence);
    const Data = {
      x_axis: x_axis_min,
      y_axis: y_axis_min,
      top_left_y: (y_axis_min) * this.metercal,
      cropped_image_path: imagepath,
      defect_id: defect_id,
      defect_type: this.merge_defectType,
      confidence: confidence_id,
      defect_height_mm: new_height,
      defect_width_mm: new_width,
      robro_roll_id: this.role_data.robro_roll_id,
      roll_update_id: this.role_data.id,
      full_image_path: defect_frame_image_data[0].full_image_path,
      cam_id:defectData[0].cam_id,
      group_id:defectData[0].group_id
      // defect_end_frame_id: frame_end_id
    };
    this._RollsService.merge_defect(Data).subscribe(
      (response) => {
        if (response.status) {
          this.showModal1 = false;
          this.selectedAll = false;
          this.merge_defectType = '';
          this.toastrService.success(this.translocoService.translate('merged_successfully'), this.translocoService.translate('success_exclamation'));
          this.get_rollsdatabyid();
          this.canvas_refresh('merge', response.new_defect_data);
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 4 && item.module_id === 3);
          if(activityObject){
            this.commonService.addActivityLog(activityObject)
          }

        }
      });
  }

  checboxchecked(defect_id) {
    setTimeout(() => {
      const checkbox = this.renderer.selectRootElement('#checkbox_' + defect_id, true);
      this.renderer.setProperty(checkbox, 'checked', true);
      this.onImageClick(defect_id);
      this.isChecked(defect_id);
    });
  }
  
  onImageClick(id: number): void {
    const index = this.checkedItems.indexOf(id);
    if (index === -1) {
      this.checkedItems.push(id); // If not present in the array, add it
    } else {
      const index = this.checkedItems.indexOf(id);
      const checkbox = this.renderer.selectRootElement('#checkbox_' + id);

      this.renderer.setProperty(checkbox, 'checked', false);
      this.checkedItems.splice(index, 1);
    }
  }
  canvas_refresh(type, data) {
    for (const itemId of this.checkedItems) {
      const index = this.AllDefectsData.findIndex(defect_data => defect_data.defect_id === itemId);
      if (index !== -1) {
        const index1 = this.nodeDataArray.findIndex(defect__canvas_data => defect__canvas_data.defect_id === itemId);

        const index12 = this.nodeDataArray_strip.findIndex(defect__canvas_data1 => defect__canvas_data1.defect_id === itemId);
        if (index1 !== -1) {
          this.nodeDataArray.splice(index1, 1); // Remove 1 element starting from the found index
        }
        if (index12 !== -1) {
          const item = this.nodeDataArray_strip[index12];
          const x = 0;
          const y = (item.defect_top_left_y_mm / this.metercal) * this.tempstrip_height;
          const width = 40;
          const height = 3;
          this.defectforstrip.push(this.nodeDataArray_strip[index12]);
          this.nodeDataArray_strip.splice(index12, 1);
          this.checkdefect = this.nodeDataArray_strip.filter((value) => {
            let position = (value.defect_top_left_y_mm / this.metercal) * this.tempstrip_height;
            return (
              position >= ((item.defect_top_left_y_mm / this.metercal) * this.tempstrip_height) - 2 &&
              position <= ((item.defect_top_left_y_mm / this.metercal) * this.tempstrip_height) + 2
            );
          });
          this.checkdefect.forEach((value: any) => {
            const x = 0;
            const y = (value.defect_top_left_y_mm / this.metercal) * this.tempstrip_height;
            const width = 40;
            const height = 3;
          })
          const defect_position = (item.defect_top_left_y_mm / this.metercal) * this.tempstrip_height
          if (defect_position - 5 <= this.yellowstripposY && defect_position + 10 >= this.yellowstripposY) {
          }
        }
        this.AllDefectsData.splice(index, 1);
        this.perDefectCount = this.perDefectCount - 1;
        this.startLimitFilter = this.startLimitFilter - 1;
        this.endLimitFilter = this.endLimitFilter - 1;

        this.TotalFilterDefectCount = this.TotalFilterDefectCount - 1; // Remove 1 element starting from the found index
      }
    }

    if (type == 'merge') {

      let size_check_error = true;

      const defectSizeValue = this.Form.get('defect_size').value;
      const defectSize1Value = this.Form.get('defect_size1').value;
      const defectSize2Value = this.Form.get('defect_size2').value;

      if (defectSizeValue === '') {
        size_check_error = false;
      } else {
        const defectArea = data.defect_height_mm * data.defect_width_mm;

        if (
          (defectSizeValue === '<=' && defectArea <= defectSize1Value) ||
          (defectSizeValue === '>=' && defectArea >= defectSize1Value) ||
          (defectSizeValue === '<>' && defectArea <= defectSize1Value && defectArea >= defectSize2Value)
        ) {
          size_check_error = false;
        }
      }


      if (!size_check_error) {
        this.assignDefectPoints(data);
        this.AllDefectsData.push(data);
      }
      this.perDefectCount = this.perDefectCount + 1;
      this.TotalFilterDefectCount = this.TotalFilterDefectCount + 1;
      this.startLimitFilter = this.startLimitFilter + 1;
      this.endLimitFilter = this.endLimitFilter + 1;
      this.AllDefectsData.sort((a, b) => a.defect_top_left_y_mm - b.defect_top_left_y_mm);
      this.nodeDataArray.push(data);
      this.nodeDataArray_strip.push(data);
      this.nodeDataArray_strip.sort((a, b) => a.defect_top_left_y_mm - b.defect_top_left_y_mm);
    }
    if (this.nodeDataArray_strip.length > 0) {
      const filterarrayframes_data = this.hiddenAllDefectsDataframe.filter(
        frame_data => frame_data.defect_frame_id == this.nodeDataArray_strip[0].defects_frame_id);
      if (filterarrayframes_data.length > 0) {
        this.startcheckvalue = Math.floor(filterarrayframes_data[0].frame_start_meter * 10) / 10;
      }
      this.endcheckvalue = Math.floor((((this.nodeDataArray_strip[this.nodeDataArray_strip.length - 1].defect_top_left_y_mm) / this.metercal) + (this.nodeDataArray_strip[this.nodeDataArray_strip.length - 1].defect_height_mm / this.metercal)) * 10) / 10;
    }

    this.checkedItems = [];
    this.calculateTotalScore();
    this.applyCameraFilter()
    setTimeout(() => {
    this.drawScatterPlot();      
    }, 100);
    this.current_meter_for_defect();
  }
  current_meter_for_defect(): void {
    let checkmeter = this.startmeter;
    this.nodeDataArray = [];
    const filterarray = this.nodeDataArray_strip.filter(
      defect_data1 => (defect_data1.defect_top_left_y_mm / this.metercal) >= (this.startmeter) &&
        (defect_data1.defect_top_left_y_mm / this.metercal) < (this.endmeter));
    const filterarrayend = this.nodeDataArray_strip.filter(
      defect_data1 => (defect_data1.defect_top_left_y_mm / this.metercal) < (this.startmeter) && (defect_data1.defect_top_left_y_mm / this.metercal) + (defect_data1.defect_height_mm / this.metercal) > (this.endmeter) && defect_data1.merge_status == 1);
    const filterarrayend1 = this.nodeDataArray_strip.filter(
      defect_data_diff => (defect_data_diff.defect_top_left_y_mm / this.metercal) < (this.startmeter) && (defect_data_diff.defect_top_left_y_mm / this.metercal) + (defect_data_diff.defect_height_mm / this.metercal) > (this.startmeter) && (defect_data_diff.defect_top_left_y_mm / this.metercal) + (defect_data_diff.defect_height_mm / this.metercal) < (this.endmeter) && defect_data_diff.merge_status == 1);

    let filterarrayframes = [];

    // Clear the canvas
    const new_focus = this.startmeter * this.tempstrip_height;
    if (filterarray.length === 0) {

      if (filterarrayend.length === 0 && filterarrayend1.length === 0) {
        if (this.datadirection === 'left') {
          this.startmeter = this.startmeter - 1;
          this.endmeter = this.endmeter - 1;
        } else if (this.datadirection === 'right' || this.datadirection === 'load') {
          this.startmeter = this.startmeter + 1;
          this.endmeter = this.endmeter + 1;
        }
        if (this.startmeter >= 0 && this.endmeter <= this.yscaletotalheight) {

          this.current_meter_for_defect();
        }
      }
      else {

        this.frames = [];
        filterarrayframes = this.hiddenAllDefectsDataframe.filter(
          frame_data => frame_data.frame_start_meter >= (this.startmeter) &&
            frame_data.frame_start_meter < (this.endmeter));
        const parsedStartMeter = parseFloat(this.startmeter);
        // Step 4: Check addition for this.endmeter
        if (filterarrayend.length > 0) {
          this.nodeDataArray = filterarrayend;
        }

        if (filterarrayend1.length > 0) {
          this.nodeDataArray = this.nodeDataArray.concat(filterarrayend1);
        }
        if (this.InspectedLength - this.startmeter < 1) {
          this.endmeter = this.InspectedLength;
        }
        else if (Math.abs(this.InspectedLength - (this.startmeter + 1)) < 0.5) {
          this.endmeter = this.InspectedLength;
        }
        else {
          this.endmeter = parsedStartMeter + 1;
        }
        if (checkmeter !== this.startmeter) {
          const filterarray = this.nodeDataArray_strip.filter(
            defect_data1 => (defect_data1.defect_top_left_y_mm / this.metercal) >= (this.startmeter) &&
              (defect_data1.defect_top_left_y_mm / this.metercal) < (this.endmeter));
          const filterarrayend = this.nodeDataArray_strip.filter(
            defect_data1 => (defect_data1.defect_top_left_y_mm / this.metercal) < (this.startmeter) && (defect_data1.defect_top_left_y_mm / this.metercal) + (defect_data1.defect_height_mm / this.metercal) > (this.endmeter) && defect_data1.merge_status == 1);
          const filterarrayend1 = this.nodeDataArray_strip.filter(
            defect_data_diff => (defect_data_diff.defect_top_left_y_mm / this.metercal) < (this.startmeter) && (defect_data_diff.defect_top_left_y_mm / this.metercal) + (defect_data_diff.defect_height_mm / this.metercal) > (this.startmeter) && (defect_data_diff.defect_top_left_y_mm / this.metercal) + (defect_data_diff.defect_height_mm / this.metercal) < (this.endmeter) && defect_data_diff.merge_status == 1);
          this.nodeDataArray = filterarray;
          if (filterarrayend.length > 0) {
            this.nodeDataArray = this.nodeDataArray.concat(filterarrayend);
          }
          if (filterarrayend1.length > 0) {
            this.nodeDataArray = this.nodeDataArray.concat(filterarrayend1);
          }
        }
        this.frames = filterarrayframes;
      }
    } else {
      if (filterarray.length > 0) {
        this.nodeDataArray = filterarray;

        if(filterarray[0].defects_frame_id)
        {
          const filterarrayframes_data = this.hiddenAllDefectsDataframe.filter(
            frame_data => frame_data.defect_frame_id == filterarray[0].defects_frame_id);
            if(filterarrayframes_data.length)
            this.startmeter = Math.floor(filterarrayframes_data[0].frame_start_meter * 10) / 10;
        }
        else
        {
          this.startmeter = filterarray[0].defect_top_left_y_mm / this.metercal;
        }

        // Step 3: Check parseFloat conversion
        const parsedStartMeter = parseFloat(this.startmeter);

        // Step 4: Check addition for this.endmeter

        if (this.InspectedLength - this.startmeter < 1) {
          this.endmeter = this.InspectedLength;
        }
        else if (Math.abs(this.InspectedLength - (this.startmeter + 1)) < 0.5) {
          this.endmeter = this.InspectedLength;
        }
        else {
          this.endmeter = parsedStartMeter + 1;
        }
        this.frames = [];
        filterarrayframes = this.hiddenAllDefectsDataframe.filter(
          frame_data => frame_data.frame_start_meter >= (this.startmeter) &&
            frame_data.frame_start_meter < (this.endmeter));
      }
      if (filterarrayend.length > 0) {
        this.nodeDataArray = this.nodeDataArray.concat(filterarrayend);
      }
      if (filterarrayend1.length > 0) {
        this.nodeDataArray = this.nodeDataArray.concat(filterarrayend1);
      }
      if (checkmeter !== this.startmeter) {
        const filterarray = this.nodeDataArray_strip.filter(
          defect_data1 => (defect_data1.defect_top_left_y_mm / this.metercal) >= (this.startmeter) &&
            (defect_data1.defect_top_left_y_mm / this.metercal) < (this.endmeter));
        const filterarrayend = this.nodeDataArray_strip.filter(
          defect_data1 => (defect_data1.defect_top_left_y_mm / this.metercal) < (this.startmeter) && (defect_data1.defect_top_left_y_mm / this.metercal) + (defect_data1.defect_height_mm / this.metercal) > (this.endmeter) && defect_data1.merge_status == 1);
        const filterarrayend1 = this.nodeDataArray_strip.filter(
          defect_data_diff => (defect_data_diff.defect_top_left_y_mm / this.metercal) < (this.startmeter) && (defect_data_diff.defect_top_left_y_mm / this.metercal) + (defect_data_diff.defect_height_mm / this.metercal) > (this.startmeter) && (defect_data_diff.defect_top_left_y_mm / this.metercal) + (defect_data_diff.defect_height_mm / this.metercal) < (this.endmeter) && defect_data_diff.merge_status == 1);
        this.nodeDataArray = filterarray;
        if (filterarrayend.length > 0) {
          this.nodeDataArray = this.nodeDataArray.concat(filterarrayend);
        }
        if (filterarrayend1.length > 0) {
          this.nodeDataArray = this.nodeDataArray.concat(filterarrayend1);
        }
      }
      this.frames = filterarrayframes;
    }

  }
  // showContent
  // loaderState$
  getLoaderState() {
    return this._RollsService.loaderState;
  }

  yellowStripChange() {
    this.ctxstrip.clearRect(this.yellowstripposX-1, this.yellowstripposY-1, 62, 6);
    this.ctxstrip.fillStyle = 'black';
    this.ctxstrip.fillRect(this.yellowstripposX, this.yellowstripposY-2, 64, 8);
    this.ctxstrip.clearRect(this.yellowstripposX1-1, this.yellowstripposY1-1, 4, 22);
    this.ctxstrip.fillStyle = 'black';
    this.ctxstrip.fillRect(this.yellowstripposX1-2, this.yellowstripposY1-2, 8, 24);
    this.checkdefect = this.nodeDataArray_strip.filter((value) => {
      let position = (value.defect_top_left_y_mm / this.metercal) * this.tempstrip_height;
      return (
        position >= this.yellowstripposY - 5 &&
        position <= this.yellowstripposY + 5
      );
    });
    this.checkdefect.forEach((value: any) => {
      const x = 0;
      const y = (value.defect_top_left_y_mm / this.metercal) * this.tempstrip_height;
      const width = 40;
      const height = 3;
      this.ctxstrip.clearRect(x, y, width, height);
      this.ctxstrip.fillStyle = value.colour_code;
      this.ctxstrip.fillRect(x, y, width + 1, height + 1);
      this.ctxstrip.fillStyle = value.colour_code;
      this.ctxstrip.strokeStyle = value.colour_code;
      this.ctxstrip.fill();
      this.ctxstrip.stroke();
    })
    this.ctxstrip.fillStyle = 'black';
    this.ctxstrip.fill();
    this.ctxstrip.stroke();
  }
  // Method to adjust scroll positions on both axes
  adjustScrollPosition(focusX: number, focusY: number): void {
    // Calculate the maximum scroll positions
    const maxScrollLeft = this.canvasContainer.nativeElement.scrollWidth - this.canvasContainer.nativeElement.clientWidth;
    // Ensure new scroll positions are within bounds
    const scrollLeft = Math.min(Math.max(focusX - this.canvasContainer.nativeElement.clientWidth / 2, 0), maxScrollLeft);
    // Update the scrollLeft and scrollTop properties of the container element
    this.canvasContainer.nativeElement.scrollLeft = scrollLeft;
    this.canvasContainer.nativeElement.scrollTop = focusY;
  }
  showNextButton: boolean = true;
  scaleChange(value: any) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas_width_new, this.canvas_height);
    if (value == 'left') {

      this.datadirection = 'left';
      this.endmeter = this.endmeter - (this.endmeter - this.startmeter);
      this.startmeter = this.startmeter - 1;
      this.showNextButton = true; // Always show the next button when moving left
    }
    else if (value == 'right') {
      this.datadirection = 'right';
      this.startmeter = this.startmeter + 1;
      this.endmeter = Math.min(this.endmeter + 1, this.InspectedLength);
      this.showNextButton = this.endmeter < this.InspectedLength; // Hide the next button
    }

    this.current_meter_for_defect();

  }
  get_all_defect_by_roll_id(robro_roll_id): void {
    const defectCountString = localStorage.getItem('total_defect_count');
    const defectCount = defectCountString ? parseInt(defectCountString, 10) : 0;
  
    // Check if we've already loaded all defects
    if (this.startLimitstrip >= defectCount) {
      this.alldataload = "true";
      this.loaderOff();
      return;
    }
  
    const data = {
      roll_id: robro_roll_id,
      start_limit: this.startLimitstrip,
      end_limit: this.endLimitstrip,
    };
  
    this._RollsService.get_all_defects_by_roll_id(data).subscribe({
      next: (response: any) => {
        if (response.status && typeof response.data !== 'string') {
          const fetchedCount = response.data.length;
  
          if (fetchedCount > 0) {
            this.nodeDataArray_strip = this.nodeDataArray_strip.concat(response.data);
            
            // Update limits for the next batch
            this.startLimitstrip = this.endLimitstrip;
            this.endLimitstrip = Math.min(this.endLimitstrip + 500, defectCount);
            setTimeout(() => {this.drawScatterPlot();},1000);
  
            // Load the next batch after a short delay
            setTimeout(() => {
              this.get_all_defect_by_roll_id(robro_roll_id);
            }, 300);
          } else {
            console.warn("No more defects returned by API!");
            this.alldataload = "true";
            this.loaderOff();
          }
        }
      },
      error: (error: any) => {
        console.error('Error fetching data from the API', error);
      }
    });
  } 

  drawScatterPlot() {
    // Prepare scatter data
    const scatterData = this.nodeDataArray_strip.map(item => {
      let filterColor = this.all_defect_types.filter(data =>
        item.defect_type.startsWith(data.defect_type)
      )[0];
      return {
        value: [
          item.defect_top_left_x_mm / 1000,
          (item.defect_top_left_y_mm / 1000).toFixed(1),
          item.defect_height_mm * item.defect_width_mm
        ],
        Defect_ID: [item.defect_id],
        itemStyle: { color: filterColor ? filterColor.color : '#CCCCCC' }
      }
    });
    // console.log("slitting_info", this.slitting_info);

    let x_line_data = [];
    let y_line_data = [];
    let splice_line_data = [];
    let splice_area_data: any[] = [];

    if (this.slitting_position_data.length > 0) {
      const slittingValue = this.Form.get('selectedLocation')?.value;

      if (slittingValue !== '') {
        if (slittingValue.slitting_type === "Width") {
          x_line_data.push(
            {
              xAxis: (slittingValue.x_roll_start_mm / 1000).toFixed(1),
              lineStyle: { color: 'blue', type: 'solid' },
              label: { show: false, position: 'end' }
            },
            {
              xAxis: (slittingValue.x_roll_end_mm / 1000).toFixed(1),
              lineStyle: { color: 'blue', type: 'solid' },
              label: { show: false, position: 'end' }
            }
          );
        }
        else if (slittingValue.slitting_type === "Length") {
          y_line_data.push(
            {
              yAxis: (slittingValue.y_roll_start_mm / 1000).toFixed(1),
              lineStyle: { color: 'red', type: 'solid' },
              label: { show: false, position: 'end' }
            },
            {
              yAxis: (slittingValue.y_roll_end_mm / 1000).toFixed(1),
              lineStyle: { color: 'red', type: 'solid' },
              label: { show: false, position: 'end' }
            }
          );
        }

      }
      else {
        let x_axis_slitting = this.slitting_position_data.filter(item => item.slitting_type === 'Width');
        x_axis_slitting.map((item, index) => {
          x_line_data.push(
            {
              xAxis: (item.x_roll_start_mm / 1000).toFixed(1),
              lineStyle: { color: 'blue', type: 'solid' },
              label: { show: false, position: 'end' }
            },
            {
              xAxis: (item.x_roll_end_mm / 1000).toFixed(1),
              lineStyle: { color: 'blue', type: 'solid' },
              label: { show: false, position: 'end' }
            }
          );
        });

        let y_axis_slitting = this.slitting_position_data.filter(item => item.slitting_type === 'Length');
        y_axis_slitting.map((item, index) => {
          y_line_data.push(
            {
              yAxis: (item.y_roll_start_mm / 1000).toFixed(1),
              lineStyle: { color: 'red', type: 'solid' },
              label: { show: false, position: 'end' }
            },
            {
              yAxis: (item.y_roll_end_mm / 1000).toFixed(1),
              lineStyle: { color: 'red', type: 'solid' },
              label: { show: false, position: 'end' }
            }
          );
        });
      }
    }

    if (this.spliceData.length > 0) {
      this.spliceData.forEach((data: any) => {
        const startY = +data.splice_start_meter.toFixed(2);
        const endY = +data.splice_end_meter.toFixed(2);
        // Splice START line
        splice_line_data.push({
          yAxis: parseFloat(data.splice_start_meter.toFixed(2)),
          spliceId: data.splice_id,
          spliceMeter: data.splice_start_meter,
          spliceType: "start",
          lineStyle: { color: 'red', type: 'dotted', width: 2 }, // green
          symbol: 'none', // Hide symbol at start
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
        });

        // Splice END line
        splice_line_data.push({
          yAxis: parseFloat(data.splice_end_meter.toFixed(2)),
          spliceId: data.splice_id,
          spliceMeter: data.splice_end_meter,
          spliceType: "end",
          lineStyle: { color: 'green', type: 'dotted', width: 2 }, // green
          symbol: 'none', // Hide symbol at start
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
        })
        // SHADED AREA between start & end
        splice_area_data.push([
          {
            yAxis: startY,
            spliceId: data.splice_id,
            spliceStartMeter: startY,
            spliceType: 'start',
            itemStyle: { color: 'rgba(255,0,0,0.15)' }
          },
          {
            yAxis: endY, spliceId: data.splice_id,
            spliceEndMeter: endY,
            spliceType: 'end'
          }
        ]);
      });
    }

    let markLineData = {
      silent: false, // The lines will not have any interaction.
      symbol: 'none',
      data: [...x_line_data, ...y_line_data, ...splice_line_data]
    };

    // console.log(markLineData)
    // Find max value in your y-axis data
    const maxYValue = Math.max(...this.nodeDataArray_strip.map(item => item.defect_top_left_y_mm / 1000));
    const maxLabelLength = maxYValue.toFixed(1).length;  // e.g., "10000.0" → 7 chars

    // Set chart options
    this.options = {
      xAxis: {
        name: this.translocoService.translate('fabric_width_m'), type: 'value', nameLocation: 'middle', nameGap: 25, position: 'top', nameTextStyle: {
          fontWeight: 'bold', color: '#000000'   // Make x-axis name bold
        }
      },
      grid: {
        left:  Math.max(maxLabelLength * 4, 50),   // dynamic left padding for y-axis labels
        top: 50,                    // reduce top gap (default ~60)
        bottom: 20,                 // reduce bottom gap (default ~60)
        containLabel: true          // ensures labels don’t get cut off
      },
      yAxis: {
        name: this.translocoService.translate('fabric_length_m'), type: 'value', nameLocation: 'middle', nameGap: 60, inverse: true, nameTextStyle: {
          fontWeight: 'bold', color: '#000000'   // Make x-axis name bold
        }, axisLabel: {
          margin: 12,
          formatter: (value: number) => {
            // if (value >= 1000) return (value / 1000).toFixed(1) + 'k';
            return value.toFixed(1); // Round axis labels to 1 decimal
          }
        }
      },
      tooltip: {
        trigger: 'item',
        extraCssText: 'z-index: 1;',
        formatter: (params: any) => {
          if (params.componentType === 'markArea' && params.data.spliceId) {

            return `
              <b>${this.translocoService.translate('splice_id')}:</b> ${params.data.spliceId}<br>
              <b>${this.translocoService.translate('splice_start_meter')}:</b> ${params.data.spliceStartMeter}<br>
              <b>${this.translocoService.translate('splice_end_meter')}:</b> ${params.data.spliceEndMeter}<br>
            `;
          }

          const x = parseFloat(params.data.value[0]).toFixed(1); // 1 decimal
          const y = parseFloat(params.data.value[1]).toFixed(1); // 1 decimal
          return `X: ${x} m<br>Y: ${y} m<br>ID: D${params.data.Defect_ID}`;
        }
      },
      dataZoom: [
        { type: 'slider', yAxisIndex: 0, xAxisIndex: false, start: 0, end: 5 },
        { type: 'inside', yAxisIndex: 0, xAxisIndex: false }
      ],
      series: [{
        symbolSize: (data) => {
          const makedot = data[2] || 1;
          return makedot <= 20000 ? 10 : makedot <= 40000 ? 11 : makedot <= 60000 ? 12 : makedot <= 80000 ? 13 : makedot <= 200000 ? 14 : 30;
        },
        data: scatterData,
        type: 'scatter',
        markLine: {
          silent: true,
          symbol: 'none',
          animation: false,
          data: [...x_line_data, ...y_line_data, ...splice_line_data]
        },

        markArea: splice_area_data.length ? {
          silent: false,
          z: 1,
          data: splice_area_data
        } : null
      }]
    };
    this.cdr.detectChanges();
  }

  onChartInit(ec: ECharts) {
    this.chartInstance = ec;
    ec.on('click', (params) => {
      this.ngZone.run(() => {
        // If splice icon clicked
        if (params.componentType === 'markArea') {
          const splice: any = params.data;
          if (splice?.spliceId) {
            this.onSpliceClick(splice);
            return;
          }
        }

        // CLICKED ON DEFECT POINT
        if (params.seriesType === "scatter") {
          let imageData = this.AllDefectsData[params.dataIndex];
          if (imageData) {
            this.imagePopupOpen(imageData);
          } else {
            const defectId = (params.data as any).Defect_ID?.[0] ?? 'Unknown';
            this.toastrService.warning(`Defect ${defectId} ${this.translocoService.translate('is_not_loaded')}`);
          }
        }
      });
    });
  }

  onSpliceClick(splice: any) {
    const sp = this.spliceData.find(x => x.splice_id === splice.spliceId);
    if (!sp) return;
  
    this.spliceForm.patchValue({
      start_meter: sp.splice_start_meter,
      end_meter: sp.splice_end_meter,
      inspected_length: this.totalmeter,
      exiting_splice_data: this.spliceData 
    });
    this.spliceForm.updateValueAndValidity();
    this.selectedSpliceId = sp.splice_id;
    this.isSpliceEditMode = true; 
    this.showSpliceModal = true;
  }
  deleteSplice() {
    this.showSpliceModal = false;
    this.showDeleteConfirm = true;
  }
  
  confirmDeleteSplice(){
    let payload = {
      splice_id: this.selectedSpliceId,
      rollId: this.roll_id
    };

    this._RollsService.deleteSpliceDetails(payload).subscribe(
      (res: any) => {
        if (res.status) {
          this.toastrService.success(this.translocoService.translate('deleted_successfully'));
           this.getSpliceData();
          setTimeout(() => {
            this.drawScatterPlot();
          }, 500);
          // Close popup
          this.showDeleteConfirm = false;

        } else {
          this.toastrService.error(res.message, this.translocoService.translate('error'));
          this.showDeleteConfirm = false;
        }
      },
      (error: any) => {
        this.toastrService.error(error, this.translocoService.translate('error'));
        this.showDeleteConfirm = false;
      }
    );
  }

  private getAllModelList() {
    const data = { "kvp_backend_url": localStorage.getItem('kvp_backend_url') };

    this._RollsService.getAllModelList(data).subscribe({
      next: (response: any) => {
        this.all_model_data = response.data;
        if (this.all_model_data && this.all_model_data.length > 0) {
          this.Form.patchValue({
            model_id: response.data[0].model_id,
          });
          this.loadModel(response.data[0].model_id);
        } else {
          this.dropdownList = [];
          this.all_defect_types.forEach((item: { id: number, defect_type: string }) => {
            this.dropdownList = this.dropdownList.concat({ item_id: item.id, item_text: item.defect_type });
          });
        }
        this.getRollsDataByIdFirst();
      },
      error: (error: any) => {
        console.error('Error fetching data from the API', error);
      },
      complete: () => {
        // Optional: Handle completion logic if needed
      }
    });
  }

  toggleFilter() {
    this.showFilter = !this.showFilter;
    
    this.cdr.detectChanges(); // Ensure UI updates instantly
  }

  sendUserDefectSuggestion(event: any, defect: any): void {
    const user_suggestion = event.target.value;
    defect.user_suggestion = user_suggestion;
    if (user_suggestion) {
      const data = {
        defect_id: defect.defect_id,
        user_suggestion: user_suggestion,
        robro_roll_id: this.role_data.robro_roll_id,
        model_id : this.Form.get('model_id').value
      };

      this._RollsService.update_user_suggestion_defect(data).subscribe({
        next:
          (response) => {
            if(response.status){
              const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 10 && item.module_id === 3);
              if (activityObject) {
                this.commonService.addActivityLog(activityObject)
              }
            }
          },
        error: (err) => {
          console.error('Error:', err);
        }
      });
    }
  }
 
  loadModel(data: any) {
    this.drop_down_status = false;
    this.dropdownList = [];
    this.all_defect_types.forEach((item: { id: number, defect_type: string }) => {
      this.dropdownList = this.dropdownList.concat({ item_id: item.id, item_text: item.defect_type });
    });
    if(data)
    {
      const selectedModelId = Number(data);
      const selectedModelData = this.all_model_data.find((model: any) => model.model_id === selectedModelId);
  
      if (selectedModelData) {
        const data = {
          model_id: selectedModelData.model_id,
          model_type: selectedModelData.model_type,
          engine_file_path: selectedModelData.optimised_model_file_path,
          names_file_path: selectedModelData.name_file_path,
          threshold: 0.1
        };
  
        this._RollsService.load_model(data).subscribe({
          next:
            (response) => {
              // this.toastrService.success(response.message);
            },
          error: (err) => {
            console.error('Error:', err);
          }
        });
        const model_data = {
          file_path: selectedModelData.name_file_path
        };
        this._RollsService.read_model_file(model_data).subscribe({
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
  gettingDataForRolewidth: any
  getQualityCodeByName(quality_code: any, isFallback: boolean = false) {
    if (!quality_code || quality_code === 'NULL') {
      const recipe = this.role_data?.recipes;
      if (!isFallback && recipe) {
        this.getQualityCodeByName(recipe, true);
        return;
      }
      this.roll_quality_code_detail = null;
      this.onSubmit('filter', 'first');
      return;
    }
    this._RollsService.getQualityCodeByName(quality_code).subscribe((response) => {
      this.roll_quality_code_detail = response.data[0]
      // this.toggleFormControls();
      if (response.data.length == 0) {
       const recipe = this.role_data?.recipes;
        if (!isFallback && recipe && quality_code !== recipe) {
          this.getQualityCodeByName(recipe, true);
        } else {
          this.roll_quality_code_detail = null;
          this.onSubmit('filter', 'first');
        }
        return;
      }
      this.roll_quality_code_detail = response.data[0];
      if(response.data[0].filter_value_json.size_filter.defect_size_unit)
      {
        this.showFirstInput = true;
        if(response.data[0].filter_value_json.size_filter.defect_size_unit === '<>')
        this.showBothInputs = true;
      }
      this.gettingDataForRolewidth = response.data[0];
      const aiDefectTypes = response?.data?.[0]?.filter_value_json?.ai_filter?.defect_type || [];

      const matchedDefects = this.all_defect_types
        .filter(defect => aiDefectTypes.some(item => item.item_text === defect.defect_type))
        .map(defect => ({
          item_id: defect.id,
          item_text: defect.defect_type
        }));
      
          this.Form.patchValue({
            model_id: (response.data[0].filter_value_json.ai_filter.ai_agent && response.data[0].filter_value_json.ai_filter.ai_agent !== "null")?response.data[0].filter_value_json.ai_filter.ai_agent : '',
            defect_type: matchedDefects || '',
            defect_size: response.data[0].filter_value_json.size_filter.defect_size_unit || '',
            defect_size1: response.data[0].filter_value_json.size_filter.min_value || '',
            defect_size2: response.data[0].filter_value_json.size_filter.max_value || '',
          });
      
      this.onSubmit('filter', 'first');
    });
  }

  getQualityCodefilter() {
    // added activity log
    const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 6 && item.module_id === 3);
    if (activityObject) {
      this.commonService.addActivityLog(activityObject)
    }
    this.router.navigate(['/role-width'], {
      state: { data: this.gettingDataForRolewidth }
    });
  }

  redirectPageAndToggleData() {
    this.router.navigate(['/review'], {
      state: { data: this.gettingDataForRolewidth }
    });
    const data = history.state.data;
    this.Form.patchValue({
      model_id: data[0].filter_value_json.ai_filter.ai_agent || '',
      defect_type: data[0].filter_value_json.ai_filter.defect_type || '',
      defect_size: data[0].filter_value_json.size_filter.defect_size_unit || '',
      defect_size1: data[0].filter_value_json.size_filter.min_value || '',
      defect_size2: data[0].filter_value_json.size_filter.max_value || '',
    });
  }

  getUniquedefects() {
    this._RollsService.getColourCode().subscribe((res) => {
      this.colourCodeData = res.data;
      this._RollsService.getUniquedefectsWithColor(this.roll_id).subscribe(res => {
        if (res.status) {
          const temp_defecttypes = res.defects;

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
          this.all_defect_types = temp_defecttypes.map((item, index) => {
            let color = '';
            const configMatch = this.criticalDefectData.find(d => d.defect_type_name.toLowerCase() === item.defect_type.toLowerCase());

            if (configMatch && configMatch.color) {
              color = configMatch.color;
            } else {
              color = availableFallbackColors[fallbackColorIndex] || '#CCCCCC';
              fallbackColorIndex++;
            }
            return {
              ...item,
              color: color
            };
          });

          this.dropdownList = [];
          this.dropdownList = this.all_defect_types.map(item => ({
            item_id: item.id,
            item_text: item.defect_type
          }));

          this.drawScatterPlot();
        }
      })
    })
  }

  getDefectColor(type: string): string {
    if (!type) return '#CCCCCC';
    const match = this.all_defect_types.find(d => type.toLowerCase().startsWith(d.defect_type.toLowerCase()));
    return match ? match.color : '#CCCCCC';
  }

  getUniqueCamIds() {
    this._RollsService.getUniqueCameraIds(this.roll_id).subscribe(res => {
      if (res.status) {
        this.allGroups = res.groups; // [{group_id: 1, cam_ids: [1,2]}, ...]
        this.groupOptions = this.allGroups.map(g => ({ item_id: g.group_id, item_text: `Group:${g.group_id}` }));

        // New: flat camera list
        this.allCameras = res.cameras; // [1,2,3,...]
        this.cameraOptions = this.allCameras.map(cam => ({ item_id: cam, item_text: `Cam:${cam}` }));
      } else {
        console.error('API returned error:', res);
      }
    }, error => {
      console.error('API call failed:', error);
    });
  }

  async applyCameraFilter() {
    const startLimitFilter = 0;
    const endLimitFilter = localStorage.getItem('total_defect_count');
    const roll_id = localStorage.getItem('roll_id');
    this.formData = new FormData();
    const modelTypeControl = this.Form.get('model_id');
    if (modelTypeControl && modelTypeControl.value !== null && modelTypeControl.value !== '') {
      this.formData.append('model_id', this.Form.get('model_id').value);
    }
 
    const defectTypeControl = this.Form.get('defect_type');
    const defectStatusControl = this.Form.get('defect_status_filter');
    if (defectStatusControl && defectStatusControl.value !== null && defectStatusControl.value !== '') {
      const defectStatusFilterArray = this.Form.get('defect_status_filter').value.map((defect) => defect.item_value);
      defectStatusFilterArray.forEach((defect, index) => {
        this.formData.append(`defect_status_filter[${index}]`, defect);
      });
    }
    this.formData.append('defect_size', this.Form.get('defect_size').value);
    this.formData.append('defect_size1', this.Form.get('defect_size1').value);
    this.formData.append('defect_size2', this.Form.get('defect_size2').value);
    this.formData.append('x_axis', this.Form.get('x_axis').value);
    this.formData.append('x_axis1', this.Form.get('x_axis1').value);
    this.formData.append('y_axis', this.Form.get('y_axis').value);
    this.formData.append('y_axis1', this.Form.get('y_axis1').value);
    this.formData.append('roll_id', roll_id);
    this.formData.append('start_limit', startLimitFilter.toString());
    this.formData.append('end_limit', endLimitFilter.toString());
    this.formData.append('sortOrder', this.Form.get('sortOrder').value);
    this.formData.append('yLocationStart', this.Form.get('yLocationStart').value);
    this.formData.append('yLocationEnd', this.Form.get('yLocationEnd').value);
    this.formData.append('xLocationStart', this.Form.get('xLocationStart').value);
    this.formData.append('xLocationEnd', this.Form.get('xLocationEnd').value);
    this.formData.append('showUnmatched', this.showUnmatched);

    // ✅ Append group_id
    const groupControl = this.Form.get('group_id');
    if (groupControl && groupControl.value && Array.isArray(groupControl.value)) {
      groupControl.value.forEach((group, index) => {
        this.formData.append(`group_id[${index}]`, group.item_id);
      });
    }

    const cameraControl = this.Form.get('camera');
    if (cameraControl && cameraControl.value && Array.isArray(cameraControl.value)) {
      cameraControl.value.forEach((cam, index) => {
        this.formData.append(`camera[${index}]`, cam.item_id);
      });
    }
 
    this.filterFormData.defect_type = [];
    if (defectTypeControl && defectTypeControl.value !== null && defectTypeControl.value !== '') {
      let defectTypeArray = this.Form.get('defect_type').value.map((defect, index) => {
        let newdefect = this.dropdownList.filter(item => item.item_id === defect.item_id)
        if(newdefect && newdefect.length>0){
          this.formData.append(`defect_type[${index}]`, newdefect[0].item_text);
          return newdefect.length > 0 ? newdefect[0].item_text : "";
        }
      });
      defectTypeArray.forEach((defect, index) => {
        this.filterFormData.defect_type.push(defect)
      });
    }
    this.filterFormData.defect_status_filter = [];
    if (defectStatusControl && defectStatusControl.value !== null && defectStatusControl.value !== '') {
      const defectStatusFilterArray = this.Form.get('defect_status_filter').value.map((defect) => defect.item_value);
      defectStatusFilterArray.forEach((defect, index) => {
        this.filterFormData.defect_status_filter.push(defect)
      });
    }
    this.filterFormData.defect_size = this.Form.get('defect_size').value
    this.filterFormData.defect_size1 = this.Form.get('defect_size1').value
    this.filterFormData.defect_size2 = this.Form.get('defect_size2').value
    this.filterFormData.x_axis = this.Form.get('x_axis').value
    this.filterFormData.x_axis1 = this.Form.get('x_axis1').value
    this.filterFormData.y_axis = this.Form.get('y_axis').value
    this.filterFormData.y_axis1 = this.Form.get('y_axis1').value
    this.filterFormData.roll_id = roll_id
    this.filterFormData.start_limit = startLimitFilter.toString()
    this.filterFormData.end_limit = endLimitFilter.toString()
    this.filterFormData.sortOrder = this.Form.get('sortOrder').value
    this.filterFormData.camera = this.Form.get('camera').value
    this.filterFormData.yLocationStart = this.Form.get('yLocationStart').value
    this.filterFormData.yLocationEnd = this.Form.get('yLocationEnd').value
    this.filterFormData.xLocationStart = this.Form.get('xLocationStart').value
    this.filterFormData.xLocationEnd = this.Form.get('xLocationEnd').value
    this.filterFormData.showUnmatched = this.showUnmatched
    // this.commonFilterPayload();
    let response: any = await this.get_filter_defect(this.formData);
    let scatterData1: any = response?.data;
    let dataZoomOptions: any[] = [];
 
 
    // Prepare scatter data
    const scatterData = scatterData1.map(item => {
      let filterColor = this.all_defect_types.filter(data =>
        item.defect_type.startsWith(data.defect_type)
      )[0];
      return {
        value: [
          item.defect_top_left_x_mm / 1000,
          (item.defect_top_left_y_mm / 1000).toFixed(1),
          item.defect_height_mm * item.defect_width_mm
        ],
        Defect_ID: [item.defect_id],
        itemStyle: { color: filterColor ? filterColor.color : '#CCCCCC' }
      }
    });
 
    // --- ADD THIS BLOCK FOR SLITTING LINES ---
    let x_line_data = [];
    let y_line_data = [];
    let splice_line_data = [];
    let splice_area_data: any[] = [];

    if (this.slitting_position_data.length > 0) {
      const slittingValue = this.Form.get('selectedLocation')?.value;
      if (slittingValue !== '') {
        if (slittingValue.slitting_type === "Width") {
          x_line_data.push(
            {
              xAxis: (slittingValue.x_roll_start_mm / 1000).toFixed(1),
              lineStyle: { color: 'blue', type: 'solid' },
              label: { show: true, position: 'end' }
            },
            {
              xAxis: (slittingValue.x_roll_end_mm / 1000).toFixed(1),
              lineStyle: { color: 'blue', type: 'solid' },
              label: { show: true, position: 'end' }
            }
          );
        }
        else if (slittingValue.slitting_type === "Length") {
          y_line_data.push(
            {
              yAxis: (slittingValue.y_roll_start_mm / 1000).toFixed(1),
              lineStyle: { color: 'red', type: 'solid' },
              label: { show: true, position: 'end' }
            },
            {
              yAxis: (slittingValue.y_roll_end_mm / 1000).toFixed(1),
              lineStyle: { color: 'red', type: 'solid' },
              label: { show: true, position: 'end' }
            }
          );
        }

      }
      else {
      let x_axis_slitting = this.slitting_position_data.filter(item => item.slitting_type === 'Width');
      x_axis_slitting.map((item, index) => {
        x_line_data.push(
          {
            xAxis: (item.x_roll_start_mm / 1000).toFixed(1),
            lineStyle: { color: 'blue', type: 'solid' },
            label: { show: true, position: 'end' }
          },
          {
            xAxis: (item.x_roll_end_mm / 1000).toFixed(1),
            lineStyle: { color: 'blue', type: 'solid' },
            label: { show: true, position: 'end' }
          }
        );
      });
 
      let y_axis_slitting = this.slitting_position_data.filter(item => item.slitting_type === 'Length');
      y_axis_slitting.map((item, index) => {
        y_line_data.push(
          {
            yAxis: (item.y_roll_start_mm / 1000).toFixed(1),
            lineStyle: { color: 'red', type: 'solid' },
            label: { show: true, position: 'end' }
          },
          {
            yAxis: (item.y_roll_end_mm / 1000).toFixed(1),
            lineStyle: { color: 'red', type: 'solid' },
            label: { show: true, position: 'end' }
          }
        );
      });
    }
    }

     if (this.spliceData.length > 0) {
      this.spliceData.forEach((data: any) => {
        const startY = +data.splice_start_meter.toFixed(2);
        const endY = +data.splice_end_meter.toFixed(2);
        // Splice START line
        splice_line_data.push({
          yAxis: parseFloat(data.splice_start_meter.toFixed(2)),
          lineStyle: { color: 'red', type: 'dotted', width: 2 }, // green
          symbol: 'none', // Hide symbol at start
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
        });

        // Splice END line
        splice_line_data.push({
          yAxis: parseFloat(data.splice_end_meter.toFixed(2)),
          lineStyle: { color: 'green', type: 'dotted', width: 2 }, // green
          symbol: 'none', // Hide symbol at start
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
        })
        // SHADED AREA between start & end
        splice_area_data.push([
          {
            yAxis: startY,
            spliceId: data.splice_id,
            spliceStartMeter: startY,
            spliceType: 'start',
            itemStyle: { color: 'rgba(255,0,0,0.15)' }
          },
          {
            yAxis: endY, spliceId: data.splice_id,
            spliceEndMeter: endY,
            spliceType: 'end'
          }
        ]);
      });
    }
    let markLineData = {
      silent: true, // The lines will not have any interaction.
      symbol: 'none',
      data: [...x_line_data, ...y_line_data,...splice_line_data]
    };
    // --- END BLOCK ---
 
    const firstY = scatterData[0]?.value[1] ?? 0;
 
    this.options = {
      xAxis: {
        name: this.translocoService.translate('fabric_width_m'),
        type: 'value',
        nameLocation: 'middle',
        nameGap: 25,
        position: 'top',
        nameTextStyle: {
          fontWeight: 'bold',
          color: '#000000'
        }
      },
      yAxis: {
        name: this.translocoService.translate('fabric_length_m'),
        type: 'value',
        nameLocation: 'middle',
        nameGap: 35,
        min: this.Form.get('y_axis').value?( +(this.Form.get('y_axis').value)) : 0,                     // lower limit
        max: this.Form.get('y_axis1').value?( +(this.Form.get('y_axis1').value)) : this.totalmeter,
        inverse: true,
        nameTextStyle: {
          fontWeight: 'bold',
          color: '#000000'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.componentType === 'markArea' && params.data.spliceId) {

            return `
              <b>Splice ID:</b> ${params.data.spliceId}<br>
              <b>Splice Start (m):</b> ${params.data.spliceStartMeter}<br>
              <b>Splice End (m):</b> ${params.data.spliceEndMeter}<br>
            `;
          }

          const x = parseFloat(params.data.value[0]).toFixed(1); // 1 decimal
          const y = parseFloat(params.data.value[1]).toFixed(1); // 1 decimal
          return `X: ${x} m<br>Y: ${y} m<br>ID: D${params.data.Defect_ID}`;
        }
      },
      dataZoom: [
        {
          type: 'slider',
          yAxisIndex: 0,
          xAxisIndex: false,
          startValue: firstY - 10,  // Show a range around the first point
          endValue: firstY + 10
        },
        {
          type: 'inside',
          yAxisIndex: 0,
          xAxisIndex: false,
          startValue: firstY - 10,
          endValue: firstY + 10
        }
      ],
      series: [{
        symbolSize: (data) => {
          const makedot = data[2] || 1;
          return makedot <= 20000 ? 10 : makedot <= 40000 ? 11 : makedot <= 60000 ? 12 : makedot <= 80000 ? 13 : makedot <= 200000 ? 14 : 30;
        },
        data: scatterData,
        type: 'scatter',
        markLine: {
            silent: true,
            symbol: 'none',
            animation: false,
            data: [...x_line_data, ...y_line_data, ...splice_line_data]
          },

          markArea: splice_area_data.length ? {
            silent: false,
            z: 1,
            data: splice_area_data
          } : null
      }]
    };
    // console.log(this.options);
    if (this.chartInstance) {
      this.chartInstance.setOption(this.options, true);
    }
  }

  addActivity(type){
    // added activity log
    const activityObject = type == '1' ? defaultFeatureActivityList.find(item => item.feature_id === 2 && item.module_id === 3): defaultFeatureActivityList.find(item => item.feature_id === 7 && item.module_id === 3);
    if(activityObject){
      this.commonService.addActivityLog(activityObject)
    }
  }


  commonFilterPayload()
  {
    const roll_id = localStorage.getItem('roll_id');
    this.formData = new FormData();
    const modelTypeControl = this.Form.get('model_id');
    if (modelTypeControl && modelTypeControl.value !== null && modelTypeControl.value !== '') {
      this.formData.append('model_id', this.Form.get('model_id').value);
    }

    const defectTypeControl = this.Form.get('defect_type');
    const defectStatusControl = this.Form.get('defect_status_filter');
    if (defectStatusControl && defectStatusControl.value !== null && defectStatusControl.value !== '') {
      const defectStatusFilterArray = this.Form.get('defect_status_filter').value.map((defect) => defect.item_value);
      defectStatusFilterArray.forEach((defect, index) => {
        this.formData.append(`defect_status_filter[${index}]`, defect);
      });
    }
    this.formData.append('defect_size', this.Form.get('defect_size').value);
    this.formData.append('defect_size1', this.Form.get('defect_size1').value);
    this.formData.append('defect_size2', this.Form.get('defect_size2').value);
    this.formData.append('x_axis', this.Form.get('x_axis').value);
    this.formData.append('x_axis1', this.Form.get('x_axis1').value);
    this.formData.append('y_axis', this.Form.get('y_axis').value);
    this.formData.append('y_axis1', this.Form.get('y_axis1').value);
    this.formData.append('roll_id', roll_id);
    this.formData.append('start_limit', this.startLimitFilter.toString());
    this.formData.append('end_limit', this.endLimitFilter.toString());
    this.formData.append('sortOrder', this.Form.get('sortOrder').value);
    this.formData.append('slitting_type', this.Form.get('slitting_type').value);
    this.formData.append('slitting_id', this.Form.get('slitting_id').value);
    this.formData.append('yLocationStart', this.Form.get('yLocationStart').value);
    this.formData.append('yLocationEnd', this.Form.get('yLocationEnd').value);
    this.formData.append('xLocationStart', this.Form.get('xLocationStart').value);
    this.formData.append('xLocationEnd', this.Form.get('xLocationEnd').value);
    this.formData.append('showUnmatched', this.showUnmatched);


    // ✅ Append group_id
    const groupControl = this.Form.get('group_id');
    if (groupControl && groupControl.value && Array.isArray(groupControl.value)) {
      groupControl.value.forEach((group, index) => {
        this.formData.append(`group_id[${index}]`, group.item_id);
      });
    }

    const cameraControl = this.Form.get('camera');
    if (cameraControl && cameraControl.value && Array.isArray(cameraControl.value)) {
      cameraControl.value.forEach((cam, index) => {
        this.formData.append(`camera[${index}]`, cam.item_id);
      });
    }
   
    this.filterFormData.defect_type = [];
    if (defectTypeControl && defectTypeControl.value !== null && defectTypeControl.value !== '') {
      let defectTypeArray = this.Form.get('defect_type').value.map((defect, index) => {
        let newdefect = this.dropdownList.filter(item => item.item_id === defect.item_id)
        if(newdefect && newdefect.length>0){
          this.formData.append(`defect_type[${index}]`, newdefect[0].item_text);
          return newdefect.length > 0 ? newdefect[0].item_text : "";
        }
      });
      defectTypeArray.forEach((defect, index) => {
        this.filterFormData.defect_type.push(defect)
      });
    }
    this.filterFormData.defect_status_filter = [];
    if (defectStatusControl && defectStatusControl.value !== null && defectStatusControl.value !== '') {
      const defectStatusFilterArray = this.Form.get('defect_status_filter').value.map((defect) => defect.item_value);
      defectStatusFilterArray.forEach((defect, index) => {
        this.filterFormData.defect_status_filter.push(defect)
      });
    }
    this.filterFormData.defect_size = this.Form.get('defect_size').value
    this.filterFormData.defect_size1 = this.Form.get('defect_size1').value
    this.filterFormData.defect_size2 = this.Form.get('defect_size2').value
    this.filterFormData.x_axis = this.Form.get('x_axis').value
    this.filterFormData.x_axis1 = this.Form.get('x_axis1').value
    this.filterFormData.y_axis = this.Form.get('y_axis').value
    this.filterFormData.y_axis1 = this.Form.get('y_axis1').value
    this.filterFormData.roll_id = roll_id
    this.filterFormData.start_limit = this.startLimitFilter.toString()
    this.filterFormData.end_limit = this.endLimitFilter.toString()
    this.filterFormData.sortOrder = this.Form.get('sortOrder').value
    this.filterFormData.camera = this.Form.get('camera').value
    this.filterFormData.slitting_type = this.Form.get('slitting_type').value;
    this.filterFormData.slitting_id = this.Form.get('slitting_id').value
    this.filterFormData.yLocationStart = this.Form.get('yLocationStart').value
    this.filterFormData.yLocationEnd = this.Form.get('yLocationEnd').value
    this.filterFormData.xLocationStart = this.Form.get('xLocationStart').value
    this.filterFormData.xLocationEnd = this.Form.get('xLocationEnd').value
    this.filterFormData.showUnmatched = this.showUnmatched
  }
  
 undelete_defect(){
    let object = {
      "defect_ids": this.checkedItems,
      robro_roll_id: this.roll_id
    }
    if(this.checkedItems.length !== 0){
       this._UserService.unDeleteDefect(object).subscribe(res =>{
        if(res.status){
          this.checkedItems.forEach(element => {
            this.AllDefectsData = this.AllDefectsData.filter(item => item.defect_id !== element);
            this.perDefectCount = this.perDefectCount - 1;
            this.startLimitFilter = this.startLimitFilter - 1;
            this.endLimitFilter = this.endLimitFilter - 1;
            this.TotalFilterDefectCount = this.TotalFilterDefectCount - 1;
          })
          this.onSubmit('filter', 'first'); // Re-fetch all defects with updated delete status and recalculate points
          this.calculateTotalScore();
          this.toastrService.success(`${this.checkedItems.length} ${this.translocoService.translate('defects_undeleted_success')}`); 
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 11 && item.module_id === 3);
          if (activityObject) {
            this.commonService.addActivityLog(activityObject)
          } 
          this.checkedItems = []  
        }
      },(error:any)=>{
        this.toastrService.error(error.error.message)
      })
    }else{
      this.toastrService.error(this.translocoService.translate('select_defect_undelete'))
    }
  }

   get_module_permission() {
    this._UserService.rolePermissions$.subscribe((rolePermissions) => {
      // this._UserService.modules$.subscribe((modules) => {
      this._UserService.roles$.subscribe((roles) => {
        const matchedRole = roles.find(role => role.role_name === localStorage.getItem('role').toLowerCase());
        const roleId = matchedRole ? Number(matchedRole.role_id) : null
        let navbar_permissions = rolePermissions[roleId] || [];
        // if(type == "remove")
        // {
        //     navbar_permissions = navbar_permissions.filter(item => item.module_id != moduleId);
        // }
        if (navbar_permissions.length > 0) {
            const rollwidth_permission_module = navbar_permissions.find(module => module.module_id == 4)
            if (rollwidth_permission_module) {
              this.RollWidthButtonStatus = true;
            }
           
          }
      });
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
  
  
    setFeaturePermission(): void {
      if (this.featurePermissions) {
        for (const key in this.featurePermissions) {
          const featurePermissionsData = this.featurePermissions[key]
          if (Array.isArray(featurePermissionsData) && featurePermissionsData.length > 0) {
            this.doneReviewStatus = featurePermissionsData.some(data => data.feature_name === 'Done Review');
            this.applyFilterStatus = featurePermissionsData.some(data => data.feature_name === 'Apply Filter');
            this.deleteDefectsStatus = featurePermissionsData.some(data => data.feature_name === 'Delete Defects');
            this.mergeDefectsStatus = featurePermissionsData.some(data => data.feature_name === 'Merge Defects');
            this.showDefectInfoZoominZoomoutStatus = featurePermissionsData.some(data => data.feature_name === 'Show Defect Info/Zoom in/Zoom out');
            this.rollwidthTabStatus = featurePermissionsData.some(data => data.feature_name === 'Roll width Tab');
            this.loadMoreDefectsStatus = featurePermissionsData.some(data => data.feature_name === 'Load More Defects');
            this.changeDefectTypeStatus = featurePermissionsData.some(data => data.feature_name === 'Change Defect Type');
            this.addEditNoteStatus = featurePermissionsData.some(data => data.feature_name === 'Add/Edit Note');
            this.updateAiSuggestionStatus = featurePermissionsData.some(data => data.feature_name === 'Update Ai Suggestion');
            this.undeleteDefectStatus = featurePermissionsData.some(data => data.feature_name === 'Undelete Defect');
            this.addSpliceStatus = featurePermissionsData.some(data => data.feature_name === 'Add Splice Details');
          }
        }
  
      }
    }

  setDefectFilterList() {
    this.defectStatusFilterList = defectStatusFilterList.map(item => {
      return {
        ...item,
        item_name: this.translocoService.translate(item.item_name)
      }
    })
  };
  slitting_position:any=[]
  slitting_type:string = "";

  // Method to handle Location Axis Type change
  onSlittingTypeOptionSelected(slitting_type:string) {
    this.Form.get('yLocationStart')?.setValue('');
    this.Form.get('yLocationEnd')?.setValue('');
    this.Form.get('xLocationStart')?.setValue('');
    this.Form.get('xLocationEnd')?.setValue('');
    this.Form.get('selectedLocation')?.setValue('');


    if (this.Form.get('slitting_type')?.value === 'Width') { 
      this.showXLocationDropdown = true;
      if(this.slitting_info && this.slitting_info.length > 0) {
         const xAxisSlittingData = this.slitting_info.filter(obj => obj.slitting_type === "Width");
        if(xAxisSlittingData && xAxisSlittingData.length > 0) {
          this.xLocationList = xAxisSlittingData;
        } else {
          this.xLocationList = [];
        }
      }
      this.showYLocationDropdown = false;
    }
    else if (this.Form.get('slitting_type')?.value === 'Length') { 
      this.showYLocationDropdown = true;
      if (this.slitting_info && this.slitting_info.length > 0) {
        const yAxisSlittingData = this.slitting_info.filter(obj => obj.slitting_type === "Length");
        if (yAxisSlittingData && yAxisSlittingData.length > 0) {
          this.yLocationList = yAxisSlittingData;
        } else {
          this.yLocationList = [];
        }
      }
      this.showXLocationDropdown = false;
    }
    else {
      this.showXLocationDropdown = false;
      this.showYLocationDropdown = false;
    }
  }

    onLocationChange(axis) {
    const selectedValue = this.Form.get('selectedLocation')?.value
    if(axis === 'yAxis') {
      this.Form.get('yLocationStart')?.setValue(selectedValue['y_roll_start_mm']);
      this.Form.get('yLocationEnd')?.setValue(selectedValue['y_roll_end_mm']);
    }
    else if(axis === 'xAxis') {
      this.Form.get('xLocationStart')?.setValue(selectedValue['x_roll_start_mm']);
      this.Form.get('xLocationEnd')?.setValue(selectedValue['x_roll_end_mm']);
    }
  }

  onToggleChange() {
    this.showUnmatched = (this.Form.get('showUnmatched').value);
    this.startLimitFilter = 0;
    this.endLimitFilter = 50;
    this.checkedItems = [];
    this.onSubmit('filter', 'first');
  }

  toggleFormControls() {
    if (this.roll_quality_code_detail && this.roll_quality_code_detail.filter_value_json.ai_filter.ai_agent && this.roll_quality_code_detail.filter_value_json.ai_filter.ai_agent !== "null") {
      this.Form.get('model_id')?.disable();
    } else if( this.roll_quality_code_detail && (!this.roll_quality_code_detail.filter_value_json.ai_filter.ai_agent || this.roll_quality_code_detail.filter_value_json.ai_filter.ai_agent === "null")) {
      this.Form.get('defect_size')?.disable();
      this.Form.get('defect_size1')?.disable();
      this.Form.get('defect_size2')?.disable();
      this.Form.get('defect_type')?.disable();
    } else {
      this.Form.get('defect_size')?.enable();
      this.Form.get('defect_size1')?.enable();
      this.Form.get('defect_size2')?.enable();
      this.Form.get('model_id')?.enable();
      this.Form.get('defect_type')?.enable();
    }
  }


  openSpliceModal() {
    this.showSpliceModal = true;
    this.isSpliceEditMode = false; 
    this.spliceForm.reset(); // reset form for new entry
    this.spliceForm.get('inspected_length')?.setValue(this.totalmeter)
    this.spliceForm.get('exiting_splice_data')?.setValue(this.spliceData);
  }

  closeSpliceModal() {
    this.showSpliceModal = false;
    this.spliceForm.reset();
  }

 saveSpliceDetails() {
    this.spliceForm.markAllAsTouched();

    if (this.spliceForm.invalid) {
      return;
    }

    let data: any = {
      rollId : this.roll_id,
      start_meter : this.spliceForm.get('start_meter').value,
      end_meter : this.spliceForm.get('end_meter').value,
      mode: this.isSpliceEditMode ? 'update' : 'add'
    }
    
    // Include spliceId only in update
    if (this.isSpliceEditMode && this.selectedSpliceId) {
      data.splice_id = this.selectedSpliceId;
    }


    this._RollsService.addUpdateSpliceDetails(data).subscribe(
      (res:any) => {
        if(res.status){
          this.toastrService.success(res.message, this.translocoService.translate('success'));
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 12 && item.module_id === 3);
          if (activityObject) {
            this.commonService.addActivityLog(activityObject)
          }
          this.getSpliceData();
          setTimeout(() => {
            this.drawScatterPlot();
          }, 500);
          this.closeSpliceModal();
        }
        else
        {
          this.toastrService.error(res.message,this.translocoService.translate('error'))
        }
      },
      (error:any) => {
        this.toastrService.error(error,this.translocoService.translate('error'))
      }
    )
  }

  // helper for template
  get f() {
    return this.spliceForm.controls;
  }

  meterRangeValidator = (formGroup: AbstractControl): ValidationErrors | null => {
    const start = formGroup.get('start_meter')?.value;
    const end = formGroup.get('end_meter')?.value;
    const totalmeter = formGroup.get('inspected_length')?.value;
    const spliceData = formGroup.get('exiting_splice_data')?.value;
    if (start == null || end == null) return null;

    // 1 end > start
    if (+end <= +start) {
      return { invalidRange: true };
    }

    // 2 inspected length
    if (!totalmeter) return null;

    const inspectedLength = +totalmeter;

    if (+end > inspectedLength) {
      return { overInspectedLength: true };
    }

    // 3 overlap check (IGNORE SAME SPLICE ID)
    if (spliceData?.length) {
      for (let s of spliceData) {

        // SKIP CURRENT EDITED SPLICE
        if (this.isSpliceEditMode && s.splice_id === this.selectedSpliceId) {
          continue;
        }

        const oldStart = +s.splice_start_meter;
        const oldEnd = +s.splice_end_meter;

        // A️⃣ Overlap
        if (start < oldEnd && end > oldStart) {
          return {
            overlappingRange: { oldStart, oldEnd }
          };
        }

        // B️⃣ Full cover
        if (start <= oldStart && end >= oldEnd) {
          return {
            fullCoverNotAllowed: { oldStart, oldEnd }
          };
        }
      }
    }

    return null;
  }
  getSpliceData(): void {
    this.spliceDefectIds = [];
    this._RollsService.getSpliceData(this.roll_id).subscribe({
      next: (response: any) => {
        if (response.status) {
          this.spliceData = response.data;
          this.spliceData.forEach((data: any) => {
            this.spliceDefectIds = this.spliceDefectIds.concat(data.defect_ids);
          });
          // console.log("Fetched splice data:", this.spliceDefectIds);
        }
      },
      error: (error: any) => {
        console.error("Error fetching splice data from the API", error);
      },
    });
  }

  getCriticalDefectData(): void {
    const payload = { component_name: 'critical_defect_config' };
    this._RollsService.getSystemConfiguration(payload).subscribe({
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
        this.getUniquedefects();
      },
      error: () => {
        this.criticalDefectData = [];
        this.getUniquedefects();
      }
    });
  }

  // onToggleDefectChange() {
  //   console.log("Toggling showDefect. Current value:", this.showDefect);
  //   // this.showDefect = !this.showDefect;
  //   // console.log("Show Defect toggled:", this.showDefect);
  // }

  updateGridOptions() {
    if (!this.isLeftExpanded && !this.isRightExpanded) {
      this.gridOptions = ['2x2', '3x2', '5x2'];
    } else {
      this.gridOptions = ['2x2', '3x2'];

      if (this.selectedGrid === '5x2') {
        this.selectedGrid = '3x2';
      }
    }
    this.scheduleImageAdjusterSave();
    // console.log(this.gridOptions)
  }

  getGridClass() {
    switch (this.selectedGrid) {
      case '2x2':
        return 'grid-cols-2';
      case '3x2':
        return 'grid-cols-3';
      case '5x2':
        return 'grid-cols-5';
      default:
        return 'grid-cols-3';
    }
  }
}
