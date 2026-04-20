import { ChangeDetectorRef, Component, Input, Renderer2 } from "@angular/core";
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
import { ToastrService } from "ngx-toastr";
import { UserService } from "app/core/user/user.service";
import { takeUntil, Subject ,of, catchError, tap} from "rxjs";
import { User } from "app/core/user/user.types";
import { defaultFeatureActivityList } from "app/globalvariables/globalvariables";
import { CommonService } from "app/services/common.service";
import { TranslocoService } from "@ngneat/transloco";

@Component({
  selector: "app-model-list",
  templateUrl: "./model-list.component.html",
  styleUrls: ["./model-list.component.scss"],
})
export class ModelListComponent {
  startTrain = false;
  addmodal = false;
  all_model_data: any = [];
  all_model_training_data: any = [];
  model_name: any = [];
  selectedModelname:any;
  dropdownList = [];
  all_defect_types: any = [];
  imagebasepath: any = `${this._RollsService.get_api_path()?.replace('/api', '')}` + 'uploads/';
  dropdownSettings: IDropdownSettings = {};
  checkedDefects: any[] = [];
  formData;
  Form = new FormGroup({
    model_type: new FormControl<number | null>(0, Validators.required),
  });
  ModelForm: FormGroup = new FormGroup({
    model_id: new FormControl(""),
  });
  isLoading: boolean = false;
  submitted: boolean = false;
  model_submitted: boolean = false;
  selectedAll: boolean = false;
  checkedItems: any = [];
  AllDefectsData: any[];
  perDefectCount: number;
  startLimitFilter: number = 0;
  endLimitFilter: number = 50;
  TotalFilterDefectCount: any = 0;
  defectdirection: string = "next";
  selectCheck = false;
  progess_bar_status: any = false;
  progress_value: number = 0;
  user_id: any;
  inProgressModelIds: any = [];
  inProgressTrainingIds: any = [];
  comfirmation_model_status: any = false;
  ai_suggestion_data: any = [];
  AllcheckedDefects: any[] = [];
  training_id: any;
  model_id: any;
  interrupt_training_status: any = false;
  pageNumber: number = 1;
  showLoadMoreBtn:boolean = false
  dataLimit:number = 50
  maxNumOfData:number = 100
  onClickedGo:boolean = false
  selectedModelId:any="";
  isdeleteBtnShow:any=false
  DeletemodelPopup=false;
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  kvp_backend_url: any;
  @Input() featurePermissions: any[] = [];
  module_id: any = 6;
  loggedInRole: any = localStorage.getItem('role_id');
  applyFilterStatus: boolean = false;
  addModelStatus: boolean = false;
  deleteModelStatus: boolean = false;
  trainModelStatus: boolean = false;
  rollIds: any = [];
  
  constructor(
    private _formBuilder: FormBuilder,
    private _RollsService: RollsService,
    private router: Router,
    private renderer: Renderer2,
    private toastrService: ToastrService,
    private userService: UserService,
    private commonService: CommonService,
    private cdr: ChangeDetectorRef,
    private translocoService: TranslocoService
  ) {}
  openTrainModel() {
    if (this.checkedItems.length < 50) {
      this.toastrService.warning(this.translocoService.translate('please_select_50_images'));
    } else {
      // Proceed with the train popup
      this.startTrain = true;
      this.comfirmation_model_status = true;
    }
  }
  closeTrainModel() {
    this.startTrain = false;
    this.comfirmation_model_status = false;
    this.progess_bar_status = false;
  }
  closeCheckbox() {
    this.selectCheck = false;
  }
  opentAddModel() {
    this.addmodal = true;
  }
  closeAddModel() {
    this.addmodal = false;
    this.model_submitted = false;
    this.ModelForm.reset();
  }

  ngOnInit(): void {
    localStorage.removeItem('roll_id');
    localStorage.removeItem('robro_roll_id');
    localStorage.removeItem('api_path');
    this._RollsService.get_api_path();
    setTimeout(() => {
      this.loggedInRole = localStorage.getItem('role_id');
      if (this.module_id && this.loggedInRole) {
        this.getAllFeaturePermission(this.module_id, this.loggedInRole);
      }
    }, 100);
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
    this.ModelForm = this._formBuilder.group({
      model_id: ["", Validators.required],
    });
    // Subscribe to value changes to validate dynamically
    this.ModelForm.get("model_id").valueChanges.subscribe((value) => {
      if (value !== null && value !== undefined) {
        this.duplicateModelNameValidator(value);
      }
    });

    this.userService.user$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((user: User) => {
        this.user_id = user.user_id;
      });
    this.getAllModelList();
    // this.get_all_rolls_id();
  }

  get f(): { [key: string]: AbstractControl } {
    return this.ModelForm.controls;
  }

  duplicateModelNameValidator(value: string) {
    if (value.trim()) {
      const modelExists = this.model_name.includes(value.trim());

      if (modelExists) {
        this.ModelForm.get("model_id").setErrors({ duplicateModel: true });
      } else {
        this.ModelForm.get("model_id").setErrors(null); // No errors
      }
    }
  }
  
  private getAllModelList() {
    const data = { "kvp_backend_url": localStorage.getItem('kvp_backend_url') };
    console.log(data); 
    this._RollsService.getAllModelList(data).subscribe({
      next: (response: any) => {
        this.all_model_data = response.data;
        this.model_name = response.data.map((model: any) => model.model_id); //Extract model names
        this.getAllModelTraining();
      },
      error: (error: any) => {
        console.error("Error fetching data from the API", error);
      },
    });
  }
  loadMoreData(){
    this.submitted = false
    this.pageNumber++;
  }
  onItemSelect(item: any) {}
  onSelectAll(items: any) {}
  onSubmit(type): void {
    this.submitted = true;

    if (this.Form.invalid) {
      this.Form.markAllAsTouched();
      return;
    }
    if (type == "filter") {
      this.AllDefectsData = [];
      this.perDefectCount = 0;
      this.startLimitFilter = 0;
      this.endLimitFilter = 50;
    }

    this.formData = new FormData();
    this.formData.append("model_id", Number(this.Form.get("model_type").value));
    this.formData.append("start_limit", this.startLimitFilter.toString()); // Convert to string
    this.formData.append("end_limit", this.endLimitFilter.toString());

    this.loadModel(Number(this.Form.get("model_type").value));
    // Convert to string
    this._RollsService
      .getModelAllDefects(this.formData)
      .subscribe((response: any) => {
        if (typeof response.data != "string") {
          this.selectedAll = false;
          this.submitted = false;
          // Assuming response.data is an array of items from the API
          this.AllDefectsData = this.AllDefectsData.concat(response.data);
          this.perDefectCount = this.perDefectCount + response.data.length;
          this.TotalFilterDefectCount = response.total_defect_filter_count;

          // Set loading state to false when data is loaded
          this.isLoading = false;
          // added activity log
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 1 && item.module_id === 5);
          if (activityObject) {
            this.commonService.addActivityLog(activityObject)
          }
        }
      });
  }
  checkmodeltype(event: any): void {
    const selectedModelId = Number((event.target as HTMLSelectElement).value);
    this.selectedModelId = selectedModelId
    const selectedModel = this.all_model_data.find(data => data.model_id == selectedModelId);
    if (selectedModel) {
      console.log(selectedModel);
      if (selectedModel.model_id > 0) {
        this.isdeleteBtnShow = true;
      } else {
        this.isdeleteBtnShow = false;
      }
    } else {
      this.isdeleteBtnShow = false;
      console.error("Model not found!");
    }
  }

  showPopupforDeleteModel() {
    this.selectedModelname = (this.Form.get('model_type')).value;
    this.DeletemodelPopup = true;
  }
  closedeleteModel() {
    this.DeletemodelPopup = false;
  }
  deleteModel() {
    try {
      const data = {
        kvp_backend_url: localStorage.getItem('kvp_backend_url')!,
        model_id: this.selectedModelId
      };
      this._RollsService.deleteModel(data).subscribe(
        (response: any) => {
          if (response.status) {
            // added activity log
            const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 3 && item.module_id === 5);
            if (activityObject) {
              this.commonService.addActivityLog(activityObject)
            }
            this.toastrService.success(this.translocoService.translate("model_deleted_success"));
            this.getAllModelList();
            this.DeletemodelPopup = false;
            this.isdeleteBtnShow = false;
          } else {
            this.toastrService.error(this.translocoService.translate("failed_delete_model"));
          }
        },
        (error) => {
          this.toastrService.error(this.translocoService.translate("error_deleting_model"));
        }
      );
    } catch (error) {
      console.error("Error in deleteModel:", error);
    }
  }
  
  resetForm() {
    this.Form.reset();
    // Reset the clickedFields object
    setTimeout(() => {
      this.Form.patchValue({
        model_type: this.all_model_data[0].model_id,
      });
    }, 100);
    setTimeout(() => {
      this.Form.get("model_type").setErrors(null);

      // Clear the values of all controls
      Object.keys(this.Form.controls).forEach((controlName) => {
        this.Form.get(controlName).setValue("");
      });
      this.startLimitFilter = 0;
      this.endLimitFilter = 50;
      this.onSubmit("filter");
    }, 0);
  }
  onSelectAllChange(): void {
    if (this.selectedAll) {
      // If "Select All" is checked, add all item ids to the checkedItems array
      this.checkedItems = this.AllDefectsData.map((item) => item.defect_id);
    } else {
      this.checkedItems = [];
    }
    this.rollIds = [
      ...new Set(
        this.AllDefectsData
          .filter(item => this.checkedItems.includes(item.defect_id))
          .map(item => item.robro_roll_id)
      )
    ];
    this.filterCheckedDefects();
  }
  isChecked(id: number): boolean {
    return this.selectedAll || this.checkedItems.includes(id);
  }
  loadData(): void {
    this.isLoading = true;
    this.defectdirection = "next";
    this.startLimitFilter = this.startLimitFilter + 50;
    this.endLimitFilter = this.endLimitFilter + 50;
    this.onSubmit("load");
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
    this.rollIds = [
      ...new Set(
        this.AllDefectsData
          .filter(item => this.checkedItems.includes(item.defect_id))
          .map(item => item.robro_roll_id)
      )
    ];
    this.filterCheckedDefects();
  }
  onCheckboxChange(id: number, roll_id: number): void {
    const index = this.checkedItems.indexOf(id);

    if (index === -1) {
      this.checkedItems.push(id);   // add defect
    } else {
      this.checkedItems.splice(index, 1); // remove defect
    }

    // derive unique robro_roll_id based on checked defects
    this.rollIds = [
      ...new Set(
        this.AllDefectsData
          .filter(item => this.checkedItems.includes(item.defect_id))
          .map(item => item.robro_roll_id)
      )
    ];
    this.filterCheckedDefects();
  }

  filterCheckedDefects(): void {
    this.checkedDefects = [];
    for (const id of this.checkedItems) {
      const defect = this.AllDefectsData.find((d) => d.defect_id === id);
      if (defect) {
        const isDuplicate = this.checkedDefects.some(
          (d) => d.robro_roll_id === defect.robro_roll_id
        );
        // Only push if there's no defect with the same robo_roll_id
        if (!isDuplicate) {
          this.checkedDefects.push(defect);
        }
      }
    }
  }
  saveModel(): void {
    this.model_submitted = true;
    const formData = new FormData();
    // Stop if the form is invalid
    if (this.ModelForm.invalid) {
      return;
    }

    // Disable the form to prevent multiple submissions
    this.ModelForm.disable();

    const data = {
      model_id: this.ModelForm.get("model_id").value,
    };

    this._RollsService.show();
    // Call the service to get model information based on model_id
    this._RollsService.add_model_info(data).subscribe({
      next: (modelDetails: any) => {
        if (modelDetails.status == "success") {
          formData.append("model_name", this.ModelForm.get("model_id").value);
          formData.append("model_file_path", modelDetails.pt_model_path);
          formData.append("name_file_path", modelDetails.names_file_path);
          formData.append(
            "optimised_model_file_path",
            modelDetails.engine_model_path
          );
          formData.append("model_type", modelDetails.model_type);
          formData.append("metadata", JSON.stringify(modelDetails.meta_data));
          formData.append("kvp_backend_url", localStorage.getItem('kvp_backend_url'));
          formData.append("associated_app_id",localStorage.getItem('app_id'));

          this.addModel(formData);
        } else {
          this.toastrService.error(this.translocoService.translate("invalid_model_details"), this.translocoService.translate("error"));
          this.ModelForm.enable(); // Re-enable the form in case of invalid data
          this._RollsService.hide();
        }
      },
      error: (err) => {
        this.model_submitted = false;
        this.ModelForm.enable(); // Re-enable the form in case of error
        console.error("Error while fetching model info:", err);
        this.toastrService.error(
          this.translocoService.translate("failed_fetch_model_info"),
          this.translocoService.translate("error")
        );
        this._RollsService.hide();
      },
    });
  }

  addModel(data: any): void {
    // Call the service to save the model data
    this._RollsService.add_model(data).subscribe({
      next: (response: any) => {
        // Re-enable the form after success
        this.ModelForm.enable();
        if (response) {
          // added activity log
          const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 2 && item.module_id === 5);
          if (activityObject) {
            this.commonService.addActivityLog(activityObject)
          }
          this.toastrService.success(this.translocoService.translate("model_added_success"), this.translocoService.translate("success_exclamation"));
          this.addmodal = false;
          this.model_submitted = false;
          this.getAllModelList();
          this._RollsService.hide();
        } else {
          this.toastrService.error(
            this.translocoService.translate("error_adding_model"),
            this.translocoService.translate("error")
          );
          this.ModelForm.enable(); // Enable the form in case of an error
          this._RollsService.hide();
        }
      },
      error: (err) => {
        this.model_submitted = false;
        this.ModelForm.enable(); // Re-enable the form in case of error
        console.error("Error while adding the model:", err);
        this.toastrService.error(
          this.translocoService.translate("failed_add_model"),
          this.translocoService.translate("error")
        );
        this._RollsService.hide();
      },
    });
  }

  sendUserDefectSuggestion(event: any, defectId: any,robo_roll_id:any): void {
    const user_suggestion = event.target.value;

    if (user_suggestion) {
      const data = {
        defect_id: defectId,
        user_suggestion: user_suggestion,
        robro_roll_id:robo_roll_id
      };

      this._RollsService.update_user_suggestion_defect(data).subscribe({
        next: (response) => {
          this.toastrService.success(response.message);
        },
        error: (err) => {
          console.error("Error:", err);
        },
      });
    }
  }

  startModelTraining(status: any, model_data: any): void {
    // added activity log
    const activityObject = defaultFeatureActivityList.find(item => item.feature_id === 4 && item.module_id === 5);
    if (activityObject) {
      this.commonService.addActivityLog(activityObject)
    }
    let filtered_model_data;
    let training_data = {};
    if (status == "new") {
      this.progress_value = 0;
      const data = {
        model_id: Number(this.Form.get("model_type").value),
        status: "INPROGESS",
        user_id: this.user_id,
        kvp_backend_url: localStorage.getItem('kvp_backend_url')
      };
      this.model_id = Number(this.Form.get("model_type").value);
      this.AllcheckedDefects = [];
      for (const id of this.checkedItems) {
        const defect = this.AllDefectsData.find((d) => d.defect_id === id);
        if (defect) {
          this.AllcheckedDefects.push(defect);
        }
      }
      this._RollsService.start_model_training(data).subscribe({
        next: (response) => {
          this.comfirmation_model_status = false;
          this.progess_bar_status = true;
          this.toastrService.success(response.message);
          this.training_id = response.training_id;
        },
        error: (err) => {
          console.error("Error:", err);
          this.startTrain = false;
        },
      });
      const cropped_image_path = {};
      const selected_model_id = Number(this.Form.get("model_type").value); // Get the model_id from the form
      filtered_model_data = this.all_model_data.find(
        (model: any) => model.model_id === selected_model_id
      );
      this.AllcheckedDefects.forEach((defect, index) => {
        cropped_image_path[`${index}`] = {
          url: defect.cropped_image_path,
          class:
            defect.user_suggestion && defect.user_suggestion.trim() !== ""
              ? defect.user_suggestion
              : defect.defect_name,
        };
      });
      training_data = {
        status: status,
        model_id: filtered_model_data.model_name,
        model_file_path: filtered_model_data.model_file_path,
        image_data: cropped_image_path,
        names_file_path: filtered_model_data.name_file_path,
        metadata: filtered_model_data.metadata,
      };
    } else {
      filtered_model_data = model_data;
      training_data = {
        status: status,
        model_id: filtered_model_data.model_name,
        model_file_path: filtered_model_data.model_file_path,
        names_file_path: filtered_model_data.name_file_path,
        metadata: filtered_model_data.metadata,
      };
    }

    this._RollsService.start_training(training_data).subscribe({
      next: (response) => {
        if (response.status != "completed" && response.status != "failed") {
          this.progress_value = response.progress_percentage;
          setTimeout(() => {
            if (!this.interrupt_training_status) {
              this.startModelTraining("inprogress", filtered_model_data);
            }
          }, 3000);
        } else if (response.status == "completed") {
          this.progress_value = 100;
          this.startTrain = false;
          this.progess_bar_status = false;
          this.toastrService.success(response.message);
          const formData = new FormData();
          formData.append("model_name", response.model_id);
          formData.append("model_file_path", response.new_model_path);
          formData.append("name_file_path", response.names_file_path);
          formData.append(
            "optimised_model_file_path",
            response.engine_model_path
          );
          formData.append("metadata", JSON.stringify(response.metadata));
          formData.append("kvp_backend_url", localStorage.getItem('kvp_backend_url'));
          formData.append("associated_app_id",localStorage.getItem('app_id'));
          this.addModel(formData);
          const end_training_data = {
            status: "COMPLETED",
            training_id: this.training_id,
            user_id: this.user_id,
            kvp_backend_url:localStorage.getItem('kvp_backend_url')
          };
          this._RollsService.end_model_training(end_training_data).subscribe({
            next: (response) => {
              this.toastrService.success(response.message);
            },
            error: (err) => {
              this.toastrService.error(err);
            },
          });
        } else if (response.status == "failed") {
          const end_training_data = {
            status: "FAILED",
            training_id: this.training_id,
            user_id: this.user_id,
            kvp_backend_url:localStorage.getItem('kvp_backend_url')
          };
          this._RollsService.end_model_training(end_training_data).subscribe({
            next: (response) => {
              this.toastrService.success(response.message);
            },
            error: (err) => {
              this.toastrService.error(err);
            },
          });
          this.startTrain = false;
          this.progess_bar_status = false;
          this.toastrService.error(response.error_message);
        }
      },
      error: (err) => {
        const end_training_data = {
          status: "FAILED",
          training_id: this.training_id,
          user_id: this.user_id,
          kvp_backend_url:localStorage.getItem('kvp_backend_url')
        };
        this._RollsService.end_model_training(end_training_data).subscribe({
          next: (response) => {
            this.toastrService.success(response.message);
          },
          error: (err) => {
            this.toastrService.error(err);
          },
        });
        this.startTrain = false;
        this.progess_bar_status = false;
        console.error("Error:", err);
      },
    });
  }

  getAllModelTraining() {
    const data = { "kvp_backend_url": localStorage.getItem('kvp_backend_url') };
    this._RollsService.get_all_model_training(data).subscribe({
      next: (response: any) => {
        this.all_model_training_data = response.data;
        this.inProgressModelIds = this.all_model_training_data
          .filter((model: any) => model.status === "INPROGESS")
          .map((model: any) => model.model_id);
        this.model_id = this.inProgressModelIds[0];
        this.inProgressTrainingIds = this.all_model_training_data
          .filter((model: any) => model.status === "INPROGESS")
          .map((model: any) => model.training_id);
        this.checkModelTraining();
      },
      error: (error: any) => {
        console.error("Error fetching data from the API", error);
      },
    });
  }

  interrupt_training(): void {
    const data = {
      model_id: this.model_id,
    };

    this._RollsService.interrupt_training(data).subscribe({
      next: (response) => {
        this.interrupt_training_status = true;
        this.startTrain = false;
        const end_training_data = {
          status: "CANCELLED",
          training_id: this.training_id,
          user_id: this.user_id,
          kvp_backend_url:localStorage.getItem('kvp_backend_url')
        };
        this._RollsService.end_model_training(end_training_data).subscribe({
          next: (response) => {
            this.toastrService.success(response.message);
          },
          error: (err) => {
            this.toastrService.error(err);
          },
        });
        this.startTrain = false;
        this.progess_bar_status = false;
      },
      error: (err) => {
        console.error("Error:", err);
      },
    });
  }

  checkModelTraining(): void {
    if (this.inProgressModelIds.length > 0) {
      this.training_id = this.inProgressTrainingIds[0];
      const model_data = this.all_model_data.filter((value: any) => {
        return this.inProgressModelIds.includes(value.model_id);
      });
      if (model_data.length > 0) {
        this.startTrain = true;
        this.progess_bar_status = true;
        setTimeout(() => {
          if (!this.interrupt_training_status) {
            this.startModelTraining("inprogress", model_data[0]);
          }
        }, 3000);
      }
    }
  }

  getLoaderState() {
    return this._RollsService.loaderState;
  }

  loadModel(modelId: number) {
    const selectedModelId = modelId;
    const selectedModelData = this.all_model_data.find(
      (model: any) => model.model_id === selectedModelId
    );

    if (selectedModelData) {
      const model_data = {
        file_path: selectedModelData.name_file_path,
      };
      this._RollsService.read_model_file(model_data).subscribe({
        next: (response) => {
          this.ai_suggestion_data = response.data;
        },
        error: (err) => {
          console.error("Error:", err);
        },
      });
    }
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
    console.log(this.featurePermissions)
    if (this.featurePermissions) {
      for (const key in this.featurePermissions) {
        const featurePermissionsData = this.featurePermissions[key]
        if (Array.isArray(featurePermissionsData) && featurePermissionsData.length > 0) {
          this.applyFilterStatus = featurePermissionsData.some(data => data.feature_name === 'Apply Filter');
          this.addModelStatus = featurePermissionsData.some(data => data.feature_name === 'Add Model');
          this.deleteModelStatus = featurePermissionsData.some(data => data.feature_name === 'Delete Model');
          this.trainModelStatus = featurePermissionsData.some(data => data.feature_name === 'Train Model');
        }
      }

    }
  }
  deleteSelectedItems() {
  if (this.checkedItems.length < 1) {
    this.toastrService.error(this.translocoService.translate('please_select_defects_delete'));
    return;
  }
  const data = {
    checkedItems : this.checkedItems,
    rollIds : this.rollIds
  }
  this._RollsService.deleteDefectUserSuggestion(data).subscribe({
    next: (response: any) => {
      if (response.status) {
        this.toastrService.success(this.translocoService.translate('selected_defects_deleted'));
        this.checkedItems = [];
        this.selectedAll = false;
        this.filterCheckedDefects();
        this.onSubmit('filter');
      } else {
        this.toastrService.error(this.translocoService.translate('failed_delete_defects'));
      }
    },
    error: (err) => {
      this.toastrService.error(this.translocoService.translate('error_deleting_defects'));
      console.error(err);
    }
  });
}
}
