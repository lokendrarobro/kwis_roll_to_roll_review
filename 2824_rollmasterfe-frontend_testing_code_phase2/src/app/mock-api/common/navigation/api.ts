import { Injectable } from '@angular/core';
import { cloneDeep, filter } from 'lodash-es';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { FuseMockApiService } from '@fuse/lib/mock-api';
import { compactNavigation, defaultNavigation, futuristicNavigation, horizontalNavigation } from 'app/mock-api/common/navigation/data';
import { UserService } from 'app/core/user/user.service';
import { TranslocoService } from '@ngneat/transloco';
import Swal from 'sweetalert2';

@Injectable({
    providedIn: 'root'
})
export class NavigationMockApi {
    private readonly _compactNavigation: FuseNavigationItem[] = compactNavigation;
    private _defaultNavigation: FuseNavigationItem[] = defaultNavigation;
    private _defaultNavigation_permission: FuseNavigationItem[] = [];
    private readonly _futuristicNavigation: FuseNavigationItem[] = futuristicNavigation;
    private readonly _horizontalNavigation: FuseNavigationItem[] = horizontalNavigation;
    repair_machine_status: boolean = (window as any).__env.repair_machine_id;
    /**
     * Constructor
     */
    constructor(private _fuseMockApiService: FuseMockApiService, private _UserService: UserService, private translocoService: TranslocoService) {
        // Register Mock API handlers
        this.registerHandlers();
        this.getlanguageChange();
        // this.callNavbarPermission();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Register Mock API handlers
     */

    getlanguageChange() {
        this.translocoService.langChanges$.subscribe(() => {
            this.callNavbarPermission();
        });
    }

    callNavbarPermission() {
        const translatedNavigation = cloneDeep(defaultNavigation);
        translatedNavigation.forEach((item) => {
            this.translocoService.selectTranslate(item.title).subscribe(res => {
    item.title = res;
});
            if (item.meta?.swalKey) {
                item.function = () => {
                    const title = this.translocoService.translate(item.meta.swalKey);
                    Swal.fire({
                        icon: 'info',
                        title: title,
                    });
                };
            }
        });
        this._defaultNavigation = translatedNavigation;
        this._defaultNavigation_permission = [];
        // Fill compact navigation children using the default navigation
        
        this._compactNavigation.forEach((compactNavItem) => {
            this._defaultNavigation.forEach((defaultNavItem) => {
                if (defaultNavItem.id === compactNavItem.id) {
                    compactNavItem.children = cloneDeep(defaultNavItem.children);
                }
            });
        });
       
        this._UserService.rolePermissions$.subscribe((rolePermissions) => {
            // this._UserService.modules$.subscribe((modules) => {
                      this._UserService.roles$.subscribe((roles) => {
                        const matchedRole = roles.find(role => role.role_name === localStorage.getItem('role').toLowerCase());
                        const roleId:any = matchedRole ? Number(matchedRole.role_id) : null
                        localStorage.setItem("role_id",roleId);
                        let navbar_permissions = rolePermissions[roleId] || [];
                        // if(type == "remove")
                        // {
                        //     navbar_permissions = navbar_permissions.filter(item => item.module_id != moduleId);
                        // }
                        if (navbar_permissions.length > 0) {
                            this._defaultNavigation_permission = [];
                            this._defaultNavigation.forEach((defaultNavItem) => {
                                const permission_module = navbar_permissions.find(module => module.module_id ==defaultNavItem.id)
                                if(permission_module)
                                {   
                                    if(this.repair_machine_status && (defaultNavItem.id == '7' || defaultNavItem.id == '6')){
                                        //do nothing
                                    }
                                    else if(!this.repair_machine_status && (defaultNavItem.id == '5')){
                                        //do nothing
                                    }
                                    else{
                                        this._defaultNavigation_permission.push(defaultNavItem);
                                    }
                                }
                            });
                          
                            this._UserService.userNavigation.next(this._defaultNavigation_permission)
                        }
            });
        });


    }
    public registerHandlers(): void {
        // -----------------------------------------------------------------------------------------------------
        // @ Navigation - GET
        // -----------------------------------------------------------------------------------------------------
        // console.log("calling NavigationMockApi");
        
        this._fuseMockApiService
            .onGet('api/common/navigation')
            .reply(() => {
                this._defaultNavigation_permission = [];
                // Fill compact navigation children using the default navigation
                this._compactNavigation.forEach((compactNavItem) => {
                    this._defaultNavigation.forEach((defaultNavItem) => {
                        if (defaultNavItem.id === compactNavItem.id) {
                            compactNavItem.children = cloneDeep(defaultNavItem.children);
                        }
                    });
                });
                this._UserService.rolePermissions$.subscribe((rolePermissions) => {
                    // this._UserService.modules$.subscribe((modules) => {
                              this._UserService.roles$.subscribe((roles) => {
                                const role =   localStorage.getItem('role');
                                if(!role){
                                    return;
                                }
                                const matchedRole = roles.find(role => role.role_name === localStorage.getItem('role').toLowerCase());
                                const roleId:any = matchedRole ? Number(matchedRole.role_id) : null
                                localStorage.setItem("role_id",roleId);
                                const navbar_permissions = rolePermissions[roleId] || [];  
                                if (navbar_permissions.length > 0) {
                                    this._defaultNavigation_permission = [];
                                    this._UserService.allNavigations.next(this._defaultNavigation)
                                    this._defaultNavigation.forEach((defaultNavItem) => {
                                        const permission_module = navbar_permissions.find(module => module.module_id ==defaultNavItem.id)
                                        if (permission_module) {
                                            if (this.repair_machine_status && (defaultNavItem.id == '7' || defaultNavItem.id == '6')) {
                                                //do nothing
                                            }
                                            else if (!this.repair_machine_status && (defaultNavItem.id == '5')) {
                                                //do nothing
                                            }
                                            else {
                                                this._defaultNavigation_permission.push(defaultNavItem);
                                            }
                                        }
                                    });
                                    this._UserService.userNavigation.next(this._defaultNavigation_permission)
                                }
                    });
                });

                // Fill futuristic navigation children using the default navigation
                this._futuristicNavigation.forEach((futuristicNavItem) => {
                    this._defaultNavigation.forEach((defaultNavItem) => {
                        if (defaultNavItem.id === futuristicNavItem.id) {
                            futuristicNavItem.children = cloneDeep(defaultNavItem.children);
                        }
                    });
                });

                // Fill horizontal navigation children using the default navigation
                this._horizontalNavigation.forEach((horizontalNavItem) => {
                    this._defaultNavigation.forEach((defaultNavItem) => {
                        if (defaultNavItem.id === horizontalNavItem.id) {
                            horizontalNavItem.children = cloneDeep(defaultNavItem.children);
                        }
                    });
                });
                this.callNavbarPermission();
                
                // Return the response
                return [
                    200,
                    {
                        compact: cloneDeep(this._compactNavigation),
                        default: cloneDeep(this._defaultNavigation_permission),
                        futuristic: cloneDeep(this._futuristicNavigation),
                        horizontal: cloneDeep(this._horizontalNavigation)
                    }
                ];
            });
    }
}
