import { Component, OnDestroy, OnInit, ViewEncapsulation } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { FuseMediaWatcherService } from "@fuse/services/media-watcher";
import {
  FuseNavigationService,
  FuseVerticalNavigationComponent,
} from "@fuse/components/navigation";
import { Navigation } from "app/core/navigation/navigation.types";
import { NavigationService } from "app/core/navigation/navigation.service";
import { User } from "app/core/user/user.types";
import { UserService } from "app/core/user/user.service";
import Swal from 'sweetalert2';
import { RollsService } from "app/services/rolls.service";
import { TranslocoService } from '@ngneat/transloco';

@Component({
  selector: "classy-layout",
  templateUrl: "./classy.component.html",
  encapsulation: ViewEncapsulation.None,
})
export class ClassyLayoutComponent implements OnInit, OnDestroy {
  isScreenSmall: boolean;
  navigation: Navigation;
  user: User;
  showsidenav: boolean = true;
  profile_picture_path: any = "";
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  machineId: string = '';
  version: string = '2.2.2';
  build_version: string = (window as any).__env.build_version || 'NA';
  customer_logo_status: boolean = false;
  master_machine_data: any = localStorage.getItem('master_machine_data') ? JSON.parse(localStorage.getItem('master_machine_data') || '{}') : {};
  imagebasepath: any =`${(window as any).__env.hypertext}` + this.master_machine_data.ip + this.master_machine_data.port + 'uploads/';
  /**
   * Constructor
   */
  constructor(
    private _activatedRoute: ActivatedRoute,
    private _router: Router,
    private _navigationService: NavigationService,
    private _userService: UserService,
    private _fuseMediaWatcherService: FuseMediaWatcherService,
    private _fuseNavigationService: FuseNavigationService,
    private translocoService: TranslocoService,
    private rollsService: RollsService
  ) {
    this._navigationService.activeMainTabService.subscribe((res) => {
      if (res == "false") {
        this.showsidenav = false;
        $("#mydiv").removeClass("flex flex-col flex-auto w-full min-w-0");
      } else {
        this.showsidenav = true;
        $("#mydiv").addClass("flex flex-col flex-auto w-full min-w-0");
      }
    });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  /**
   * Getter for current year
   */
  get currentYear(): number {
    return new Date().getFullYear();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    this.machineId = localStorage.getItem('machine_id') || 'Not Available';
    this.rollsService.backend_api_variables.subscribe((data: any) => { this.machineId = data.machine_id });
    // Subscribe to navigation data
    // this._navigationService.navigation$
    //   .pipe(takeUntil(this._unsubscribeAll))
    //   .subscribe((navigation: Navigation) => {
    //     console.log("navigation", navigation)
    //     this.navigation = navigation;
    //   });
      this._userService.userNavigation.subscribe((navigation: Navigation) => {
        this.navigation = navigation;
      })
      localStorage.setItem('version',this.version);
    // Subscribe to the user service
    this._userService.user$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((user: User) => {
        this.user = user;
        this.profile_picture_path = this.user?.profile_picture_path;
      });

    // Subscribe to media changes
    this._fuseMediaWatcherService.onMediaChange$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(({ matchingAliases }) => {
        // Check if the screen is small
        this.isScreenSmall = !matchingAliases.includes("md");
      });

    this.rollsService.getCustomerLogoStatus().subscribe((res: any) => {
      if (res && res.status === true) {
        // console.log("res", res);
        this.customer_logo_status = !res.isEmpty;
      } else {
        this.customer_logo_status = false;
      }
    });
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
   * Toggle navigation
   *
   * @param name
   */
  toggleNavigation(name: string): void {
    // Get the navigation
    const navigation =
      this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(
        name
      );

    if (navigation) {
      // Toggle the opened status
      navigation.toggle();
    }
  }

  /**
   * Perform repair shutdown action
   */

  shutdownRepair(): void {
    // Show a SweetAlert confirmation dialog
    Swal.fire({
      title: this.translocoService.translate('are_you_sure'),
      text: this.translocoService.translate('are_you_sure_you_want_to_close'),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: this.translocoService.translate('yes_close_it'),
      cancelButtonText: this.translocoService.translate('cancel')
    }).then((result) => {
      if (result.isConfirmed) {
        const origin = localStorage.getItem('origin')
        localStorage.clear();
        localStorage.setItem('origin', origin);
        window.location.href = `${origin}/all-app`;
      }
    });
  }
}
