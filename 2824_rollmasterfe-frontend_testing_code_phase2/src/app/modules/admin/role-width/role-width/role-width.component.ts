import { Component, OnDestroy, Renderer2, OnInit, ViewChild, ElementRef, ChangeDetectorRef, Input,AfterViewInit } from '@angular/core';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { FormGroup, FormControl, Validators, FormBuilder, AbstractControl } from '@angular/forms';
import { RollsService } from 'app/services/rolls.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, takeUntil, Subject,of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { ECharts } from 'echarts';
import { HttpClient } from '@angular/common/http';
import { defaultFeatureActivityList } from 'app/globalvariables/globalvariables';
import { CommonService } from 'app/services/common.service';
import { TranslocoService } from '@ngneat/transloco';

import { catchError,tap } from 'rxjs/operators';
@Component({
  selector: 'app-role-width',
  templateUrl: './role-width.component.html',
  styleUrls: ['./role-width.component.scss']
})

export class RoleWidthComponent implements OnInit, OnDestroy {
  @ViewChild('diagramDiv') diagramDiv: ElementRef;
  @ViewChild('canvasContainer') canvasContainer!: ElementRef;
  @ViewChild('canvasElement', { static: true }) canvasElement: ElementRef<HTMLCanvasElement>;
  @ViewChild('listdefectContainer') listdefectContainer!: ElementRef;
  @ViewChild('canvasstripElement', { static: true }) canvasstripElement: 
  ElementRef<HTMLCanvasElement>;
  @ViewChild('stitchCanvas', { static: false }) stitchCanvas!: ElementRef<HTMLCanvasElement>;
  private canvas: HTMLCanvasElement;
  private canvasstrip: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ctxstrip: CanvasRenderingContext2D;

  // ===== Add these properties =====
  public combinedImageSrc: string = '';
  public pointX: number = 0;
  public pointY: number = 0;
  public zoomLevel: number = 1;
  private isDraggingImage = false;
  private startDragX = 0;
  private startDragY = 0;
  // =================================

  private panY: number = 0;
  private zoomFactor: number = 1.0;
  private zoomFactorstrip: number = 1.0;
  private minZoom: number = 1;
  private maxZoom: number = 5;
  showFirstInput: boolean = false;
  showBothInputs: boolean = false;
  dropdownList = [];
  checked_defect: any;
  dropdownSettings: IDropdownSettings = {};
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
  drop_down_status: any = false;
  addAsDefect = false;
  showImagePopup: boolean = false;
  private xAxisSubscription: Subscription | undefined;
  private yAxisSubscription: Subscription | undefined;
  private DefectSizeSubscription: Subscription | undefined;
  isTyping: boolean = false;
  Form: FormGroup;
  all_defects: any;
  all_defect_types: any;
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
  isGraphPoint:boolean=false;
  tempstrip_height: any = 0;
  map_default_width: any = `${(window as any).__env.map_default_width}`;
  rollimagepath: any 
  map_default_width_error: any = false;
  startLimitFilter: any = 0;
  endLimitFilter: any = 50;
  canvas_height: number = 0;
  canvas_height_new: number = 0;
  canvas_width: number = 0;
  canvas_width_new: number = 0;
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
  lineVisible: any = true;
  predict_function_check = 0;
  user_id
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  hoveredDefect: any;
  all_model_data: any;
  ai_suggestion_data: any;
  imageName: any;
  imageNames: string[] = [];
  imagebasepath: any =`${localStorage.getItem('api_path')?.replace('/api', '')}`+ 'uploads/';
  chartInstance: ECharts | null = null; // To store the chart instance
  chartOptionLine: any; // Your chart options
  chartOptionLineStatus: boolean = false;
  defect_Data: any = [0.4, 0.3, 0.9, 0, 1, 2.3, 2, 4, 6, 6.5, 7, 5, 9.4, 2, 3, 1, 3.2, 4.5, 2.4, 6, 7.2, 8, 6.8];
  sortedDefectDetails1: any[] = [];
  graphTableVisible: any = false;
  variationPointsVisible: any = false;
  variationSelection: 'all' | 'in-range' | 'variation' = 'all';
  filterRollWidthData: any = [];
  allRollWidthData: any = [];
  rollWidthDataForDrawMap: any = [];
  // filterForm: FormGroup;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject<any>();
  defectData: any;
  fileDetails: any = null;
  opt2: string[] = ['ON', 'OFF']; // Array of options
  selectedIndex2: number | null = 0; // Set the first index (0) as the default active index
  @Input() featurePermissions: any[] = [];
  module_id: any = 4;
  loggedInRole: any = localStorage.getItem('role_id');
  applyFilterStatus: boolean = false;
  viewGraphStatus: boolean = false;
  viewImageStatus: boolean = false;
  showOnlyVariationPointsStatus: boolean = false;
  addAsDefectStatus: boolean = false;
  selectedRollWidthIds: number[] = []; // Array to hold selected roll width IDs
  selectedImageData: any;
  combinedImagesMap: { [key: number]: string } = {}; // key = index or roll_width_id
  pageSize = 10;   // ek page par kitne items dikhane hain
  currentPage = 1;
  totalPages:any = 0;
  paginatedData: any = [];
  total_count: number;
  buttonDisableStatus: boolean = false;
  min_tol: number;
  max_tol: number;

  // start_limit = 0;
  // end_limit = this.pageSize;
  constructor(private NavigationService: NavigationService,
    private cdr: ChangeDetectorRef,
    private _formBuilder: FormBuilder,
    private _RollsService: RollsService,
    private router: Router,
    private renderer: Renderer2,
    private toastrService: ToastrService,
    private userService: UserService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private commonService: CommonService,
    private translocoService: TranslocoService
  ) {
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
  }
  navigationId:any=null;

  ngOnInit(): void {
    setTimeout(() => {
      this.loggedInRole = localStorage.getItem('role_id');
      if (this.module_id && this.loggedInRole) {
        this.getAllFeaturePermission(this.module_id, this.loggedInRole);
      }
    }, 100);
    const data = history.state.data;
    this.roll_id = localStorage.getItem("roll_id");
    this.InspectedLengthString = localStorage.getItem("inspected_length");
    this.InspectedLength = this.InspectedLengthString ? parseFloat(this.InspectedLengthString) : 0;
    this.InspectedLength = this.InspectedLength.toFixed(1);
    if (!this.roll_id) {
      this.router.navigate(['/roll-details']);
    }
    this.NavigationService.activeMainTab('false');
    this.dtOptions = {
      pageLength: 50,
      lengthMenu: [5, 10, 25, 50, 100],
      pagingType: "full_numbers",
      order: [[1, "asc"]],
      processing: true,
      searching: false
    };
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
    this.Form = this._formBuilder.group(
      {
        roll_width: [''],
        min_tolerance: [''],
        max_tolerance: [''],
        thread_max_tolerance: [''],
        thread_min_tolerance: ['']
      }
    );
    // this.filterForm = this._formBuilder.group(
    //   {
    //     start_meter: [''],
    //     end_meter: ['', this.greaterThan('start_meter')]
    //   }
    // );
    this.userService.user$.pipe((takeUntil(this._unsubscribeAll)))
      .subscribe((user: User) => {
        this.user_id = user.user_id;
      });
      this.getFilteredTableData();
      this.buttonDisableStatus = false
  }

  toggleLineVisibility(): void {
    this.lineVisible = !this.lineVisible;
  }
  toggleGraphTableVisibility(): void {
    this.variationPointsVisible=false
    if(!this.graphTableVisible && this.Form.get('roll_width').value)
      this.getGraphData();
    else
      this.getGridData()
    this.drawLineGraph();
    const activityObject = this.graphTableVisible?defaultFeatureActivityList.find(item => item.feature_id === 3 && item.module_id === 4):defaultFeatureActivityList.find(item => item.feature_id === 2 && item.module_id === 4)
    if(activityObject){
      this.commonService.addActivityLog(activityObject)
    }
    this.graphTableVisible = !this.graphTableVisible;
  }

  toggleVariationVisibility(mode?: 'all'| 'in-range' | 'variation'): void {
    // If value provided (from dropdown), use it; otherwise toggle for backwards compatibility
    if (mode) {
      this.variationSelection = mode;
      this.variationPointsVisible = mode !== 'all';
    } else {
      this.variationPointsVisible = !this.variationPointsVisible;
      this.variationSelection = this.variationPointsVisible ? 'all' : 'variation';
    }

    // decide which data to fetch, same as before
    if (!this.graphTableVisible && this.Form.get('roll_width')?.value) {
      this.getGridData();
    } else {
      this.getGraphData();
    }

    // redraw graph and add activity log
    this.drawLineGraph();
    const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 4 && item.module_id === 4);
    if (activityObject) {
      this.commonService.addActivityLog(activityObject);
    }
  }

  onVariationChange(event: any) {
    const val = event?.target?.value || this.variationSelection;
    const mode: 'all' | 'in-range' | 'variation' = (val === 'in-range') ? 'in-range' : (val === 'variation' ? 'variation' : 'all');
    this.toggleVariationVisibility(mode);
  }

  onChartInit(ec: ECharts): void {
    this.chartInstance = ec;
    this.chartInstance.on('click', this.handleChartClick.bind(this)); // Listen for click events
  }
  

  handleChartClick(params: any): void {
    if (this.Form.get('roll_width').value) {
      let roll_width = parseFloat(this.Form.get('roll_width').value);
      let min_roll_width;
      let max_roll_width;

      if (this.Form.get('min_tolerance').value) {
        min_roll_width = roll_width - parseFloat(this.Form.get('min_tolerance').value);
      }
      if (this.Form.get('max_tolerance').value) {
        max_roll_width = roll_width + parseFloat(this.Form.get('max_tolerance').value);
      }
      if (min_roll_width && params.value < min_roll_width) {
        //this.imageName = "less_max_tol.png"
        const widthImagePath = this.filterRollWidthData[params.dataIndex].width_image_path;
        this.imageNames = Object.keys(widthImagePath).map(
          key => widthImagePath[key]
        );
        // after setting this.imageNames:
        if (this.imageNames && this.imageNames.length > 0) {
          this.combineImagesIfNeeded();
        }
        // console.log("image: ", this.imageNames);
      }
      else if (max_roll_width && params.value > max_roll_width) {
        //this.imageName = "greater_max_tol.png"
        const widthImagePath = this.filterRollWidthData[params.dataIndex].width_image_path;
        this.imageNames = Object.keys(widthImagePath).map(
          key => widthImagePath[key]
        );
        // after setting this.imageNames:
        if (this.imageNames && this.imageNames.length > 0) {
          this.combineImagesIfNeeded();
        }
        // console.log("image: ", this.imageNames);
      }
      else {
        //this.imageName = "inside_tol.png"
        const widthImagePath = this.filterRollWidthData[params.dataIndex].width_image_path;
        this.imageNames = Object.keys(widthImagePath).map(
          key => widthImagePath[key]
        );
        // after setting this.imageNames:
        if (this.imageNames && this.imageNames.length > 0) {
          this.combineImagesIfNeeded();
        }
        // console.log("image: ", this.imageNames);
      }
    }
    else
    {
       //this.imageName = "inside_tol.png"
      const widthImagePath = this.filterRollWidthData[params.dataIndex].width_image_path;
      this.imageNames = Object.keys(widthImagePath).map(
        key => widthImagePath[key]
      );
      // after setting this.imageNames:
      if (this.imageNames && this.imageNames.length > 0) {
        this.combineImagesIfNeeded();
      }
      // console.log("image1: ", this.imageNames);
    }
    if (params.componentType === 'series' && params.seriesType === 'line') {
      if (params.event && params.event.type === 'click') {
        this.isGraphPoint = true;
        this.cdr.detectChanges(); // Force Angular to recognize the change
      }
    }
    else if(params.componentType === 'openpopup'){
        this.isGraphPoint = true;
        this.cdr.detectChanges();
    }
  }
  
  // Function to close the modal
  closeGraphPointPopup(): void {
    this.isGraphPoint = false;
    this.cdr.detectChanges(); // Update UI when closing the popup
  }

   // ======= NEW: Combine images =======
  combineImagesIfNeeded() {
    // Wait for the view to include canvas reference
    setTimeout(() => {
      this.combineImages();
    }, 0);
  }

  combineImages() {
    if (!this.stitchCanvas || !this.imageNames?.length) {
      this.combinedImageSrc = '';
      return;
    }
    
    const canvas = this.stitchCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    const imgs: HTMLImageElement[] = [];
    let loaded = 0;
  
    // Store sizes for each image
    const sizes: { width: number, height: number }[] = new Array(this.imageNames.length);
  
    // After all images have loaded, set canvas size and draw
    const drawAll = () => {
      // Calculate canvas dimensions
      const totalWidth = sizes.reduce((sum, s) => sum + s.width, 0);
      const maxHeight = Math.max(...sizes.map(s => s.height));
      canvas.width = totalWidth;
      canvas.height = maxHeight;
  
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      // Draw images at their natural size, side by side
      let x = 0;
      for (let i = 0; i < imgs.length; i++) {
        ctx.drawImage(imgs[i], x, 0, sizes[i].width, sizes[i].height);
        x += sizes[i].width;
      }
      this.combinedImageSrc = canvas.toDataURL('image/png');
      this.zoomLevel = 1;
      this.pointX = 0;
      this.pointY = 0;
      this.cdr.detectChanges();
    };
  
    this.imageNames.forEach((imgName, i) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Store each image and its size
        imgs[i] = img;
        sizes[i] = { width: img.naturalWidth, height: img.naturalHeight };
        loaded++;
        if (loaded === this.imageNames.length) {
          drawAll();
        }
      };
      img.onerror = () => {
        loaded++;
        if (loaded === this.imageNames.length) {
          drawAll();
        }
      };
      img.src = this.imagebasepath + imgName;
    });
  }

  // ======== ZOOM and PAN logic for modal image ========

  zoomImage(event: WheelEvent): void {
    if (!this.combinedImageSrc) return;
    event.preventDefault();

    // Get the container, not just the image
    const container = (event.target as HTMLElement).closest('.image-container') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    // Mouse position relative to container
    const offsetX = event.clientX - rect.left - this.pointX;
    const offsetY = event.clientY - rect.top - this.pointY;

    const prevZoom = this.zoomLevel;
    const zoomChange = event.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(1, Math.min(4, prevZoom + zoomChange));
    if (prevZoom === newZoom) return;

    // Adjust pointX and pointY so that zoom is centered on mouse
    this.pointX -= (offsetX) * (newZoom / prevZoom - 1);
    this.pointY -= (offsetY) * (newZoom / prevZoom - 1);
    this.zoomLevel = newZoom;

    this.cdr.detectChanges();
  }
  
  onMouseDown(event: MouseEvent): void {
    if (!this.combinedImageSrc) return;
    this.isDraggingImage = true;
    this.startDragX = event.clientX - this.pointX;
    this.startDragY = event.clientY - this.pointY;
  }

  onMouseMove(event: MouseEvent): void {
    event.preventDefault();
    if (!this.isDraggingImage) return;
    this.pointX = event.clientX - this.startDragX;
    this.pointY = event.clientY - this.startDragY;
    this.cdr.detectChanges();
  }

  onMouseUp(): void {
    this.isDraggingImage = false;
  }
  // =====================================

  getFilteredTableData(): any[] {
  if (this.variationPointsVisible) {
    return this.allRollWidthData.filter(data => data.hasOwnProperty('filter_status'));
  } else {
    return this.allRollWidthData;
  }
}

  getRollwidthData(){  
   
  } 

  private getNumericControlValue(controlName: string): number | null {
    const rawValue = this.Form.get(controlName)?.value;
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return null;
    }

    const numericValue = Number(rawValue);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  private hasWidthFilter(): boolean {
    return this.getNumericControlValue('roll_width') !== null;
  }

  private hasThreadToleranceFilter(): boolean {
    return this.getNumericControlValue('thread_min_tolerance') !== null
      || this.getNumericControlValue('thread_max_tolerance') !== null;
  }

  private getThreadBaseLocations(graphData: any[]): Record<number, number> {
    const threadBaseLocations: Record<number, number> = {};

    graphData.forEach((data: any) => {
      if (!Array.isArray(data?.threads)) {
        return;
      }

      data.threads.forEach((thread: any) => {
        const threadId = Number(thread?.thread_id);
        const location = Number(thread?.location);

        if (!Number.isFinite(threadId) || !Number.isFinite(location)) {
          return;
        }

        if (threadBaseLocations[threadId] === undefined) {
          threadBaseLocations[threadId] = location;
        }
      });
    });

    return threadBaseLocations;
  }

  private buildThreadToleranceSeries(graphData: any[]): any[] {
    const threadMinTolerance = this.getNumericControlValue('thread_min_tolerance');
    const threadMaxTolerance = this.getNumericControlValue('thread_max_tolerance');

    if (threadMinTolerance === null && threadMaxTolerance === null) {
      return [];
    }

    const threadBaseLocations = this.getThreadBaseLocations(graphData);

    return Object.entries(threadBaseLocations).flatMap(([threadId, baseLocation]) => {
      const toleranceSeries: any[] = [];

      if (threadMinTolerance !== null) {
        toleranceSeries.push({
          name: `Thread ${threadId} Min Tol`,
          type: 'line',
          silent: true,
          showSymbol: false,
          symbol: 'none',
          lineStyle: {
            width: 1,
            type: 'solid',
            color: '#ef4444',
          },
          data: graphData.map(() => baseLocation - threadMinTolerance),
        });
      }

      if (threadMaxTolerance !== null) {
        toleranceSeries.push({
          name: `Thread ${threadId} Max Tol`,
          type: 'line',
          silent: true,
          showSymbol: false,
          symbol: 'none',
          lineStyle: {
            width: 1,
            type: 'solid',
            color: '#ef4444',
          },
          data: graphData.map(() => baseLocation + threadMaxTolerance),
        });
      }

      return toleranceSeries;
    });
  }

  private buildThreadSeries(graphData: any[]): any[] {
    const threadIds = Array.from(
      new Set(
        graphData.flatMap((data: any) =>
          Array.isArray(data?.threads)
            ? data.threads.map((thread: any) => thread.thread_id)
            : []
        )
      )
    ).sort((a: number, b: number) => a - b);

    const threadColors = ['#16a34a', '#ea580c', '#7c3aed', '#0891b2', '#dc2626', '#ca8a04'];

    return threadIds.map((threadId: number, index: number) => ({
      name: `Thread ${threadId}`,
      type: 'line',
      silent: false,
      connectNulls: false,
      showSymbol: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {
        width: 2,
        type: 'solid',
        color: threadColors[index % threadColors.length],
      },
      data: graphData.map((data: any) => {
        const thread = Array.isArray(data?.threads)
          ? data.threads.find((item: any) => item.thread_id === threadId)
          : null;

        return thread?.location ?? null;
      }),
    }));
  }

  drawLineGraph(): void {
    let line_graph_Data: any[] = [];
    let x_axis_data: any[] = [];
    let maxYValue: any;
    const hasWidthFilter = this.hasWidthFilter();
    const hasThreadToleranceFilter = this.hasThreadToleranceFilter();
    const showThreadLines = hasThreadToleranceFilter || !hasWidthFilter;

    const roll_width = this.getNumericControlValue('roll_width') ?? 0;
    const min_tolerance = this.getNumericControlValue('min_tolerance') ?? 0;
    const max_tolerance = this.getNumericControlValue('max_tolerance') ?? 0;
    const minTol = roll_width - min_tolerance;
    const maxTol = roll_width + max_tolerance;


    // Filter data for graph based on variationSelection
    let graphData = this.filterRollWidthData;
    if (hasWidthFilter && this.variationSelection === 'in-range') {
      graphData = graphData.filter((data: any) =>
        data.calculated_width >= minTol && data.calculated_width <= maxTol
      );
    } else if (hasWidthFilter && this.variationSelection === 'variation') {
      graphData = graphData.filter((data: any) =>
        data.calculated_width < minTol || data.calculated_width > maxTol
      );
    }
    // 'all' shows everything

    let minYValue = graphData.reduce((min, current) => {
      return current.calculated_width < min ? current.calculated_width : min;
    }, Infinity);

    const threadSeries = showThreadLines ? this.buildThreadSeries(graphData) : [];
    const threadToleranceSeries = showThreadLines ? this.buildThreadToleranceSeries(graphData) : [];
    const threadLocations = showThreadLines
      ? graphData.flatMap((data: any) =>
        Array.isArray(data?.threads)
          ? data.threads
            .map((thread: any) => Number(thread?.location))
            .filter((location: number) => Number.isFinite(location))
          : []
      )
      : [];
    const threadToleranceLocations = showThreadLines
      ? threadToleranceSeries.flatMap((series: any) =>
        Array.isArray(series?.data)
          ? series.data.filter((value: number) => Number.isFinite(value))
          : []
      )
      : [];

    if (threadLocations.length > 0) {
      minYValue = Math.min(minYValue, ...threadLocations);
      maxYValue = Math.max(maxYValue || 0, ...threadLocations);
    }

    if (threadToleranceLocations.length > 0) {
      minYValue = Math.min(minYValue, ...threadToleranceLocations);
      maxYValue = Math.max(maxYValue || 0, ...threadToleranceLocations);
    }

    graphData.forEach((data: any) => {
      let graphobj: any = {
        value: data.calculated_width,
        filter_status: data.hasOwnProperty('filter_status')
      };
      maxYValue = Math.ceil(Math.max(maxYValue || 0, data.calculated_width));
      line_graph_Data.push(graphobj);
      x_axis_data.push(parseFloat(data.running_meter).toFixed(2));
    });

    if (line_graph_Data.length > 0) {
      this.chartOptionLineStatus = true;
      let drawMinMaxLine = false;
      let minLineValue;
      let maxLineValue;
      if (this.Form.get('min_tolerance').value && this.Form.get('max_tolerance').value) {
        minLineValue = minTol;
        maxLineValue = maxTol;
        if (maxYValue < maxLineValue) {
          maxYValue = maxLineValue + 2;
        }
        if (minYValue > minLineValue) {
          minYValue = minLineValue - 2;
        }
        drawMinMaxLine = true;
      }
      setTimeout(() => {
        const widthSeriesName = this.translocoService.translate('width');
        const yAxisPadding = 10;

        this.chartOptionLine = {
          legend: {
            show: true,
            top: 10,
            data: [
              widthSeriesName,
              ...threadSeries.map((series: any) => series.name),
            ],
          },
          tooltip: {
            trigger: "item",
            formatter: (params) => {
              const value = typeof params.data === 'object' && params.data !== null
                ? params.data.value
                : params.value;
              const runningMeter = Array.isArray(x_axis_data) ? x_axis_data[params.dataIndex] : '';

              return `${params.seriesName} <br/>Meter: ${runningMeter}<br/>Value: ${value} mm`;
            },
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
            min: Math.max(0, Math.floor(minYValue || 0) - yAxisPadding),
            max: (maxYValue || 100) + yAxisPadding,
          },
          series: [
            {
              name: widthSeriesName,
              type: "line",
              data: (line_graph_Data || []).map((graph_value) => ({
                value: graph_value.value,
                itemStyle: {
                  color: graph_value?.filter_status ? "#ff0000" : "#0000ff",
                },
              })),
              symbol: "circle",
              symbolSize: 8,
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
                        formatter: this.translocoService.translate('min'),
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
                        formatter: this.translocoService.translate('max'),
                        position: "end",
                        color: "#ff0000",
                      },
                    },
                  ],
                }
                : null,
            },
            ...threadSeries,
            ...threadToleranceSeries,
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
              type: "slider",
              show: true,
              orient: "vertical",
              right: 0,
              top: "14%",
              bottom: "10%",
              start: 0,
              end: 100,
              yAxisIndex: 0,
            },
            {
              type: "inside",
              xAxisIndex: 0,
              start: 0,
              end: 20,
              zoomLock: true,
            },
            {
              type: "inside",
              yAxisIndex: 0,
              start: 0,
              end: 100,
            },
          ],
          grid: {
            containLabel: true,
            left: "5%",
            right: "8%",
            bottom: "10%",
            top: "14%",
          },
        };
      }, 100);
    }
  }

  clickcheck: any = 0;
  
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

  isLoading: boolean = false;
  loadData(): void {
    this.isLoading = true;
    this.defectdirection = 'next';
    this.startLimitFilter = this.startLimitFilter + 50;
    this.endLimitFilter = this.endLimitFilter + 50;
    this.predict_function_check = 0;
    setTimeout(() => {
      this.onSubmit();
    }, 100);
  }
  onShowTable:boolean;
  showLoader:boolean = false
  onSubmit(): void {
    if(this.graphTableVisible)
    {
      this.getGraphData()
    }
    else
    {
       this.getGridData()
    }
  }

  getGridData() {
    this.onShowTable = false;
    this.submitted = true;
    if (this.Form.invalid) {
      this.isLoading = false;
      return;
    }
    if(this.Form.get('roll_width').value)
      this.buttonDisableStatus = true;
    else
      this.buttonDisableStatus = false;
    this.showLoader = true
    const roll_id = localStorage.getItem('roll_id');
    let roll_width = this.Form.get('roll_width').value;
    let min_tolerance = this.Form.get('min_tolerance').value;
    let max_tolerance = this.Form.get('max_tolerance').value;
    let thread_min_tolerance = this.Form.get('thread_min_tolerance').value;
    let thread_max_tolerance = this.Form.get('thread_max_tolerance').value;

    const data = {
      roll_id: roll_id,
      start_limit: (this.currentPage - 1) * this.pageSize,
      end_limit: ((this.currentPage - 1) * this.pageSize) + this.pageSize,
      roll_width,
      min_tolerance,
      max_tolerance,
      thread_min_tolerance,
      thread_max_tolerance,
      variation_view: this.variationSelection 
    }
    this.min_tol = Number(roll_width) - Number(min_tolerance);
    this.max_tol = Number(roll_width) + Number(max_tolerance);
    
    const previous_count = this.total_count || 0;
    this._RollsService.get_pagination_roll_width(data).subscribe(
      (response: any) => {
        setTimeout(() => {
          this.showLoader = false;
        }, 500);
        this.paginatedData = response.data;
          if(this.total_count != response.totalCount)
          this.totalPages = Math.ceil(response.totalCount / this.pageSize);
        
        if (this.paginatedData.length > 0) {
          this._RollsService.show();
          this.paginatedData.forEach((data, index) => {
            if (data.width_image_path && typeof data.width_image_path === 'object') {
              const imagePaths = Object.values(data.width_image_path);
              this.generateCombinedImage(imagePaths, index);
            }
          });
        }
        this.onShowTable = true;
        this.submitted = false;
        // this.applyFilter();
        // added activity log
        const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 1 && item.module_id === 4);
        if (activityObject) {
          this.commonService.addActivityLog(activityObject)
        }
        this.loaderOff();
      },
      (error: any) => {
        console.log("error")
      }
    );
  }
  getGraphData() {
    this.submitted = true;
    if (this.Form.invalid) {
      this.isLoading = false;
      return;
    }
    if(this.Form.get('roll_width').value)
      this.buttonDisableStatus = true;
    else
      this.buttonDisableStatus = false;
    const roll_id = localStorage.getItem('roll_id');
    const data = {
      roll_id: roll_id
    }
    this._RollsService.get_filter_roll_width(data).subscribe(
      (response: any) => {
        setTimeout(() => {
          this.showLoader = false;
        }, 500);
        this.rollWidthData = response.data;
        //  if(this.rollWidthData.length>0)
        // {  
        //   this._RollsService.show();
        //   this.rollWidthData.forEach((data, index) => {
        //     if (data.width_image_path && typeof data.width_image_path === 'object') {
        //       const imagePaths = Object.values(data.width_image_path);
        //       this.generateCombinedImage(imagePaths, index);
        //     }
        //   });
        // }
        this.onShowTable = true;
        this.submitted = false;
        this.applyFilter();
        // added activity log
        const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 1 && item.module_id === 4);
        if (activityObject) {
          this.commonService.addActivityLog(activityObject)
        }
        this.loaderOff();
      },
      (error: any) => {
        console.log("error")
      }
    );
  }

  applyFilter() {
    this.filterRollWidthData = [];
    this.allRollWidthData = [];
    this.rollWidthData.forEach((value, index) => {
      if (this.Form.get('roll_width').value) {
        let roll_width = parseFloat(this.Form.get('roll_width').value);
        let min_roll_width;
        let max_roll_width;

        if (this.Form.get('min_tolerance').value) {
          min_roll_width = roll_width - parseFloat(this.Form.get('min_tolerance').value);
        }
        if (this.Form.get('max_tolerance').value) {
          max_roll_width = roll_width + parseFloat(this.Form.get('max_tolerance').value);
        }
        if (min_roll_width && value.calculated_width >= min_roll_width && max_roll_width && value.calculated_width <= max_roll_width) {
        }
        else {
          value.filter_status = true;
        }
      }
      this.allRollWidthData.push(value);
      // if ((this.filterForm.get('start_meter').value && this.filterForm.get('start_meter').value > value.running_meter)) {
      //   return;
      // }
      // if ((this.filterForm.get('end_meter').value && this.filterForm.get('end_meter').value < value.running_meter)) {
      //   return;
      // }

      this.filterRollWidthData.push(value)
    })
    const data = this.getRollwidthDataforMap('left')
    this.rollWidthDataForDrawMap = data;
    setTimeout(() => {
      this.drawLineGraph()
    }, 100)
  }
  getRollwidthDataforMap(value: any) {
    if (this.allRollWidthData.length > 0) {

      const data = this.allRollWidthData.filter((value: any) => {
        if (value.running_meter >= this.startmeter && value.running_meter <= this.endmeter)
          return value;
      })
      if (data.length > 0) {
        this.startmeter = data[0].running_meter - 0.1;
        this.endmeter = this.startmeter + 1;
      }
      else {
        if (value == 'left') {
          this.startmeter = this.startmeter - 1;
          this.endmeter = this.startmeter + 1;
        }
        else {
          this.startmeter = this.endmeter;
          this.endmeter = this.startmeter + 1;
        }
        // const res = this.getRollwidthDataforMap(value);
        // return res;
      }
      return data;
    }

  }

  resetForm() {
    this.variationPointsVisible = false;
    this.Form.reset();
    this.clickedFields = {};
    setTimeout(() => {

      this.Form.get('min_tolerance').setErrors(null);
      this.Form.get('max_tolerance').setErrors(null);
      this.Form.get('min_tolerance').clearValidators();
      this.Form.get('min_tolerance').updateValueAndValidity();

      this.Form.get('max_tolerance').clearValidators();
      this.Form.get('max_tolerance').updateValueAndValidity();

      // Clear the values of all controls
      Object.keys(this.Form.controls).forEach(controlName => {
        this.Form.get(controlName).setValue('');
      });
      this.startLimitFilter = 0;
      this.endLimitFilter = 50;
      this.onSubmit();
    }, 0);
  }

  ngAfterViewInit(): void {
    this._RollsService.show();
    this.cdr.detectChanges();
    this.getRollsDataByIdFirst();
  }

  loaderOff() {
    if (this.rollWidthData.length > 0) {

      this.startcheckvalue = Math.floor(this.rollWidthData[0].running_meter) + 1;
      this.endcheckvalue = Math.floor(this.rollWidthData[this.rollWidthData.length - 1].running_meter) + 1;
    }
    // this._RollsService.hide();

  }
  showModal = false;
  showModal1 = false;
  selectCheck = false;
  mergeCheck = false;

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
  // onCheckboxChange(id: number): void {
  //   const index = this.checkedItems.indexOf(id);
  //   if (index === -1) {
  //     this.checkedItems.push(id); // If not present in the array, add it
  //   } else {
  //     this.checkedItems.splice(index, 1);
  //   }
  // }
  // onSelectAllChange(): void {
  //   if (this.selectedAll) {
  //     // If "Select All" is checked, add all item ids to the checkedItems array
  //     this.checkedItems = this.AllDefectsData.map((item) => item.id);
  //   } else {
  //     // If "Select All" is unchecked, clear the checkedItems array
  //     this.checkedItems = [];
  //   }
  // }
  // isChecked(id: number): boolean {
  //   return this.selectedAll || this.checkedItems.includes(id);
  // }


  // Checkbox change handler
  onCheckboxChange(roll_width_id: number, checked: boolean) {
    if (checked) {
      if (!this.selectedRollWidthIds.includes(roll_width_id)) {
        this.selectedRollWidthIds.push(roll_width_id);
      }
    } else {
      this.selectedRollWidthIds = this.selectedRollWidthIds.filter(id => id !== roll_width_id);
    }
  }

  // Checkbox checked status
  isChecked(roll_width_id: number): boolean {
    return this.selectedRollWidthIds.includes(roll_width_id);
  }

  // Button click handler
//   addSelectedAsDefect() {
//   if (this.selectedRollWidthIds.length === 0) {
//     this.toastrService.warning(this.translocoService.translate('please_select_at_least_one_image'));
//     return;
//   }
//   // Find the selected image data objects
//   const selectedImages = this.allRollWidthData.filter(img => this.selectedRollWidthIds.includes(img.roll_width_id));
//   // Pass the first selected image data to modal (or handle multiple if needed)
//   this.addAsDefectbox(selectedImages[0]);
//   console.log('Selected for defect:', selectedImages);
// }
addSelectedAsDefect() {
  if (this.selectedRollWidthIds.length === 0) {
    this.toastrService.warning(this.translocoService.translate('please_select_at_least_one_image'));
    return;
  }
  // Find the selected image data objects
  const selectedImages = this.allRollWidthData.filter(img => this.selectedRollWidthIds.includes(img.roll_width_id));
  this.addAsDefect = true;
  this.defectData = selectedImages; // Pass all selected images
}

  getRollsDataByIdFirst() {
    this._RollsService.get_rollsdatabyid(this.roll_id).subscribe(
      (response) => {

        if (response.status) {
          this.role_data = response.data[0];

          //create canvas
          let totalwidth = this.canvas_width - this.vertical_width;
          this.totalmeter = this.role_data.inspected_length
          this.permeter_height = 900;
          let temper_width = this.map_default_width / this.metercal;
          this.permeter_width = totalwidth / temper_width;
          this.canvas_height = this.permeter_height;
          this.canvas_height_new = this.permeter_height;
          this.totalscalelength = (this.map_default_width / this.metercal);
          this.yscaletotalheight = this.totalmeter;
          this.getQualityCodeByName(this.role_data.quality_code)
          this.onSubmit();
          this.getGraphData();
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

  defect_type: string = '';

  getLoaderState() {
    return this._RollsService.loaderState;
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
    const data = this.getRollwidthDataforMap(value)
    this.rollWidthDataForDrawMap = data;
  }


  toggleFilter() {
    this.showFilter = !this.showFilter;
    this.isExpanded = !this.isExpanded;
    if (!this.showFilter)
      this.permeter_height = 900;
    else
      this.permeter_height = 700;


    this.canvas_height_new = this.permeter_height;

  }

  addAsDefectbox(data: any) {
    this.addAsDefect = true;
    this.defectData = data;
  }
  closeaddAsDefectbox() {
    this.addAsDefect = false;
  }

  // Method to dynamically apply validation on focus
  onFocus(fieldName: string) {
    if (fieldName === 'roll_width') {
      this.Form.get('min_tolerance')?.setValidators([Validators.required]);
      this.Form.get('max_tolerance')?.setValidators([Validators.required]);
    }
    this.updateValidations();
  }

  // Method to remove validation on blur if roll_width is empty
  onBlur(fieldName: string) {
    if (fieldName === 'roll_width' && !this.Form.get('roll_width')?.value) {
      this.Form.get('min_tolerance')?.clearValidators();
      this.Form.get('max_tolerance')?.clearValidators();
    }
    this.updateValidations();
  }

  // Method to update the validity of Form controls
  private updateValidations() {
    this.Form.get('min_tolerance')?.updateValueAndValidity();
    this.Form.get('max_tolerance')?.updateValueAndValidity();
  }

 

 addDefect() {
  if (!this.defectData || this.defectData.length === 0) {
    this.toastrService.warning(this.translocoService.translate('no_defect_data_selected'));
    return;
  }

  // Build array of defect objects, each with its own roll_width_id and robro_roll_id
  const defectsPayload = this.defectData.map((img: any) => {
    let roll_width = parseFloat(this.Form.get('roll_width').value);
    let min_roll_width, max_roll_width, rollimagepath = "inside_tol.png";
    if (this.Form.get('min_tolerance').value) {
      min_roll_width = roll_width - parseFloat(this.Form.get('min_tolerance').value);
    }
    if (this.Form.get('max_tolerance').value) {
      max_roll_width = roll_width + parseFloat(this.Form.get('max_tolerance').value);
    }
    if (min_roll_width && img.calculated_width < min_roll_width) {
      rollimagepath = "less_max_tol.png";
      this.defect_type = 'Narrow Width';
    } else if (max_roll_width && img.calculated_width > max_roll_width) {
      rollimagepath = "greater_max_tol.png";
      this.defect_type = 'Wide Width';
    }
    return {
      roll_width_id: img.roll_width_id,
      robro_roll_id: img.robro_roll_id,
      defect_top_left_y_mm: img.running_meter * 1000,
      cropped_image_path: `/images/${rollimagepath}`,
      defect_type: this.defect_type,
      defect_width_mm: this.role_data.width,
      defect_height_mm: 10
    };
  });

  // Send the array to the backend
  this._RollsService.save_defect({ defects: defectsPayload }).subscribe({
    next: (response) => {
      this.toastrService.success(response.message);
      this.addAsDefect = false;
      this.selectedRollWidthIds = [];
      const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 5 && item.module_id === 4);
      if (activityObject) {
        this.commonService.addActivityLog(activityObject)
      }
      this.onSubmit();
    },
    error: (err) => {
      this.toastrService.error(err)
    }
  });
}

  // Method to update the selected index
  selectOption2(index: number): void {
    this.selectedIndex2 = index;
  }
  getQualityCodeByName(quality_code: any, isFallback: boolean = false) {
    if (!quality_code || quality_code === 'NULL') {
      const recipe = this.role_data?.recipes;
      if (!isFallback && recipe) {
        this.getQualityCodeByName(recipe, true);
      }
      return;
    }
    this._RollsService.getQualityCodeByName(quality_code).subscribe((response) => {
      if (response.data.length === 0) {
        const recipe = this.role_data?.recipes;
        if (!isFallback && recipe && quality_code !== recipe) {
          this.getQualityCodeByName(recipe, true);
        }
        return;
      }
      if(response.data[0]?.filter_value_json.size_filter.defect_size_unit && response.data[0]?.filter_value_json.size_filter.defect_size_unit === '<>')
        {
          this.showBothInputs = true;
        }
        this.Form.patchValue({
          min_tolerance:response.data[0]?.filter_value_json.roll_width.min || '',
          max_tolerance:response.data[0]?.filter_value_json.roll_width.max || '',
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
            this.applyFilterStatus = featurePermissionsData.some(data => data.feature_name === 'Apply Filter');
            this.viewGraphStatus = featurePermissionsData.some(data => data.feature_name === 'View Graph');
            this.viewImageStatus = featurePermissionsData.some(data => data.feature_name === 'View Image');
            this.showOnlyVariationPointsStatus = featurePermissionsData.some(data => data.feature_name === 'Show Only Variation Points');
            this.addAsDefectStatus = featurePermissionsData.some(data => data.feature_name === 'Add As Defect');
          }
        }
  
      }
    }


  toggleSelectAll(checked: boolean) {
    if (checked) {
      this.selectedRollWidthIds = this.selectableRollWidthData.map(img => img.roll_width_id);
    } else {
      this.selectedRollWidthIds = [];
    }
  }
 openImagePopup(data: any,index:any,type:any) {
    const clickdata = {
      value : data.calculated_width,
      dataIndex : index,
      componentType : type
    }
    this.handleChartClick(clickdata)
  }


  selectImageCheckbox(roll_width_id: number) {
    const idx = this.selectedRollWidthIds.indexOf(roll_width_id);
    if (idx === -1) {
      this.selectedRollWidthIds.push(roll_width_id);
    } else {
      this.selectedRollWidthIds.splice(idx, 1); // Remove if already selected
    }
  }

  start = { x: 0, y: 0 };
  panning = false;
  
  closeImagePopup() {
    this.showImagePopup = false;
    this.zoomLevel = 1;
    this.pointX = 0;
    this.pointY = 0;

  }
  get selectableRollWidthData() {
    return this.paginatedData?.filter(
      data => this.addAsDefectStatus && (data?.filter_status === 0)
    );
  }
  get showVariationToggle(): boolean {
    return this.showOnlyVariationPointsStatus &&
      (Array.isArray(this.allRollWidthData) || Array.isArray(this.paginatedData)) &&
      (this.allRollWidthData.some(data => data.hasOwnProperty('filter_status')) || this.paginatedData.some(data => data.hasOwnProperty('filter_status')));
  }

  generateCombinedImage(imagePaths: any, index: number) {

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgs: HTMLImageElement[] = [];
    const sizes: { width: number; height: number }[] = new Array(imagePaths.length);
    let loaded = 0;

    const drawAll = () => {
      const totalWidth = sizes.reduce((sum, s) => sum + s.width, 0);
      const maxHeight = Math.max(...sizes.map(s => s.height));
      canvas.width = totalWidth;
      canvas.height = maxHeight;

      let x = 0;
      for (let i = 0; i < imgs.length; i++) {
        ctx.drawImage(imgs[i], x, 0, sizes[i].width, sizes[i].height);
        x += sizes[i].width;
      }

      const combinedImage = canvas.toDataURL('image/png');
      this.combinedImagesMap[index] = combinedImage;
      this.cdr.detectChanges(); // If needed to update view
      if (index === this.rollWidthData.length - 1) {
        this._RollsService.hide();
      }
    };

    imagePaths.forEach((path, i) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imgs[i] = img;
        sizes[i] = { width: img.naturalWidth, height: img.naturalHeight };
        loaded++;
        if (loaded === imagePaths.length) drawAll();
      };
      img.onerror = () => {
        loaded++;
        if (loaded === imagePaths.length) drawAll();
      };
      img.src = this.imagebasepath + path;
    });
  }
  toggleCheckbox(roll_width_id: string, index: number) {
    const numericId = Number(roll_width_id);
    const checked = !this.isChecked(numericId); // current state ka ulta
    this.onCheckboxChange(numericId, checked);
  }

  // get paginatedData() {
  //   console.log(this.rollWidthData)
  //   return this.rollWidthData;
  // }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
    this.onSubmit();
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
    this.onSubmit();
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadData();
  }

  goToFirstPage() {
    this.currentPage = 1;
    this.onSubmit();
  }

  goToLastPage() {
    this.currentPage = this.totalPages;
    this.onSubmit();
  }

  // get totalPages() {
  //   return Math.ceil(this.. / this.pageSize);
  // }

  /** Page numbers with fixed logic */
  get visiblePages(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (total <= 6) {
      // Agar pages kam hain to sab dikha do
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1); // always first page

      if (current <= 3) {
        // Agar current start me hai
        pages.push(2, 3);
        pages.push("...");
      } else if (current >= total - 2) {
        // Agar current end ke paas hai
        pages.push("...");
        pages.push(total - 2, total - 1);
      } else {
        // Agar current beech me hai
        pages.push("...");
        pages.push(current - 1, current, current + 1);
        pages.push("...");
      }

      pages.push(total); // always last page
    }

    return pages;
  }
  
}
