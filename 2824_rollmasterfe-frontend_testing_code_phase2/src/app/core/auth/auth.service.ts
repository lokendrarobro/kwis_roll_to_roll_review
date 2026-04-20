import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, of, throwError } from 'rxjs';
import { UserService } from 'app/core/user/user.service';
// import { environment } from '../../../environments/environment';
import { RollsService } from 'app/services/rolls.service';
import { switchMap, map } from 'rxjs/operators';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { defaultNavigation } from 'app/mock-api/common/navigation/data';

@Injectable()
export class AuthService {
    private _authenticated: boolean = false;
    private _defaultNavigation: FuseNavigationItem[] = defaultNavigation;
    api_path: any;
    master_api_path: any;
    decryptedMachineId: any;
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _userService: UserService,
        private RollsService: RollsService
    ) {
        this.get_api_path();
    }


    get_api_path() {
        const masterMachineData = localStorage.getItem('master_machine_data');
        if(masterMachineData) {
            const masterMachineDataObj = JSON.parse(masterMachineData);
            const api_path = `http://${masterMachineDataObj.ip}${masterMachineDataObj.port}api/`;
            this.master_api_path = api_path;
            this.RollsService.master_api_path.next(api_path);
        }
        this.RollsService.backend_api_variables.subscribe((data: any) => {
            //robro working code
            this.api_path = `${(window as any).__env.hypertext}${data.machine_ip}${data.machine_port}api/`;
            //Abacus working code
            // this.api_path = data.machine_id == '5' ? `https://${data.machine_ip}api/` : `http://${data.machine_ip}${data.machine_port}api/`;
            this.RollsService.full_api_path.next(this.api_path)
        })
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for access token
     */
    set accessToken(token: string) {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string {
        return localStorage.getItem('accessToken') ?? '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Forgot password
     *
     * @param email
     */
    forgotPassword(email: string): Observable<any> {
        return this._httpClient.post('api/auth/forgot-password', email);
    }

    /**
     * Reset password
     *
     * @param password
     */
    resetPassword(password: string): Observable<any> {
        return this._httpClient.post('api/auth/reset-password', password);
    }

    /**
     * Sign in
     *
     * @param credentials
     */
    signIn(credentials: { email: string; password: string }): Observable<any> {
        this.get_api_path();
        // Throw error, if the user is already logged in
        if (this._authenticated) {
            return throwError('User is already logged in.');
        }

        return this._httpClient.post((this.master_api_path ? this.master_api_path: this.api_path)  + 'login', credentials).pipe(
            switchMap((response: any) => {

                // Store the access token in the local storage
                this.accessToken = response.token;
                localStorage.setItem("user_id", response.userDetails.id);
                sessionStorage.setItem('reloadCheck', 'true');
                localStorage.setItem('role', response.userDetails.user_type);
                this.RollsService.user_role.next(response.userDetails.user_type)
                // Set the authenticated flag to true
                this._authenticated = true;

                // Store the user on the user service
                this._userService.user = response.userDetails;
                // this._userService.rolePermissions = response.role_permission;

                // Return a new observable with the response
                return of(response);
            })
        );
    }

    /**
     * Sign in using the access tokens
     */
    signInUsingToken(): Observable<any> {
        // Sign in using the token
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
        });
        if ('kvp_backend_url' in localStorage) {
            const data = { "kvp_backend_url": localStorage.getItem('kvp_backend_url') };
            const options = { headers };

            return this._httpClient.post((this.master_api_path ? this.master_api_path: this.api_path)  + 'refreshtoken', data, options).pipe(
                catchError((error: any) => {
                    console.log(error);

                    // If status code is 501, redirect to sign-in page
                    // if (error.status === 501) {
                    this._authenticated = false;
                    localStorage.removeItem('accessToken');  // Clear access token
                    // const origin = localStorage.getItem('origin')
                    // localStorage.clear();
                    // localStorage.setItem('origin', origin);
                    // window.location.href = `${origin}/all-app`;
                    return of(false); // Return false for other errors
                }),
                switchMap((response: any) => {
                    if (response == false) {
                        this._authenticated = false;
                        return of(false);
                    }

                    // Update access token if provided
                    if (response.token) {
                        this.accessToken = response.token;
                    }

                    this._authenticated = true;
                    this._userService.user = response.userDetails;
                    this.RollsService.getModuleVisibility().pipe().subscribe(

                        (response => {
                            this._userService.rolePermissions = response?.data || [];

                            // Convert data into a map for quick lookup
                            // this.moduleVisibilityMap = {};
                            // Object.keys(this.moduleVisibility).forEach(roleId => {
                            //   this.moduleVisibilityMap[+roleId] = new Set(
                            //     this.moduleVisibility[roleId].map(item => item.module_id)
                            //   );
                            // });
                        }),
                        catchError(error => {
                            console.error('Error fetching modules visibility:', error);
                            return of([]); // Prevents observable from breaking
                        }),
                    )

                    this.RollsService.getrole().pipe().subscribe(
                        (response => {
                            this._userService.roles = response?.data || []; // Ensure fallback for undefined data
                        }),
                        catchError(error => {
                            console.error('Error fetching roles:', error);
                            return of([]); // Prevents observable from breaking & returns empty array
                        }),
                    )
                    // this.RollsService.getAllModules().pipe().subscribe(
                    //     (response => {
                    //         this._userService.modules = response?.data || []; // Ensure fallback for undefined data
                    //     }),
                    //     catchError(error => {
                    //         console.error('Error fetching Modules:', error);
                    //         return of([]); // Prevents observable from breaking & returns empty array
                    //     }),
                    // )

                    // this._userService.rolePermissions = response.role_permission;

                    return of(true);
                })
            );
        }

        else {
            return this.signInUsingToken1();
        }
    }


    signInUsingToken1(): Observable<any> {
        // Sign in using the token
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
        });
        const options = { headers };

        return this._httpClient.post((this.master_api_path ? this.master_api_path: this.api_path)  + 'refreshtokenreview', options).pipe(
            catchError((error: any) => {
                console.log(error);

                // If status code is 501, redirect to sign-in page
                // if (error.status === 501) {
                this._authenticated = false;
                localStorage.removeItem('accessToken');  // Clear access token
                // const origin = localStorage.getItem('origin')
                // localStorage.clear();
                // localStorage.setItem('origin', origin);
                // window.location.href = `${origin}/all-app`;
                // }

                return of(false); // Return false for other errors
            }),
            switchMap((response: any) => {
                if (response == false) {
                    this._authenticated = false;
                    return of(false);
                }

                // Update access token if provided
                if (response.token) {
                    this.accessToken = response.token;
                }

                this._authenticated = true;
                this._userService.user = response.userDetails;
                this.RollsService.getModuleVisibility().pipe().subscribe(

                    (response => {
                        this._userService.rolePermissions = response?.data || [];

                        // Convert data into a map for quick lookup
                        // this.moduleVisibilityMap = {};
                        // Object.keys(this.moduleVisibility).forEach(roleId => {
                        //   this.moduleVisibilityMap[+roleId] = new Set(
                        //     this.moduleVisibility[roleId].map(item => item.module_id)
                        //   );
                        // });
                    }),
                    catchError(error => {
                        console.error('Error fetching modules visibility:', error);
                        return of([]); // Prevents observable from breaking
                    }),
                )

                this.RollsService.getrole().pipe().subscribe(
                    (response => {
                        this._userService.roles = response?.data || []; // Ensure fallback for undefined data
                    }),
                    catchError(error => {
                        console.error('Error fetching roles:', error);
                        return of([]); // Prevents observable from breaking & returns empty array
                    }),
                )
                // this.RollsService.getAllModules().pipe().subscribe(
                //     (response => {
                //         this._userService.modules = response?.data || []; // Ensure fallback for undefined data
                //     }),
                //     catchError(error => {
                //         console.error('Error fetching Modules:', error);
                //         return of([]); // Prevents observable from breaking & returns empty array
                //     }),
                // )

                // this._userService.rolePermissions = response.role_permission;

                return of(true);
            })
        );
    }

    /**
     * Sign out
     */
    signOut(): Observable<any> {
        // Set the authenticated flag to false
        this._authenticated = false;

        // Return the observable
        return of(true);
    }

    /**
     * Sign up
     *
     * @param user
     */
    signUp(user: { name: string; email: string; password: string; company: string }): Observable<any> {
        return this._httpClient.post('api/auth/sign-up', user);
    }

    /**
     * Unlock session
     *
     * @param credentials
     */
    unlockSession(credentials: { email: string; password: string }): Observable<any> {
        return this._httpClient.post('api/auth/unlock-session', credentials);
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean> {
        if (localStorage.getItem("accessToken") == null) {
            this.accessToken = '';
            this._authenticated = false;
        }


        if (this._authenticated) {
            return this._userService.rolePermissions$.pipe(
                switchMap((rolePermissions) =>
                    this._userService.roles$.pipe(
                        map((roles): boolean => {
                            const roleName = localStorage.getItem('role')?.toLowerCase();
                            const matchedRole = roles.find(role => role.role_name === roleName);
                            const roleId = matchedRole ? Number(matchedRole.role_id) : null;
                            const navbar_permissions = rolePermissions[roleId] || [];
                            if (navbar_permissions.length > 0) {
                                const currentUrlPathName = window.location.pathname;
                                if (currentUrlPathName === '/role-width') {
                                    return true;
                                }
                                const defaultNavigation_data = this._defaultNavigation.find(data => data.link === currentUrlPathName);
                                const permission_info = navbar_permissions.find(
                                    data => data.module_id == defaultNavigation_data?.id
                                );

                                if (!permission_info) {
                                    console.log("No permission found.");
                                    return false;
                                }

                                return true;
                            }

                            return true;
                        })
                    )
                )
            );
        }

        if (!this.accessToken) {
            return of(false);
        }

        return localStorage.getItem('launch_status') !== null ? this.signInUsingToken1() : of(true); // Make sure this returns Observable<boolean>
    }
    checkToken() {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
        });

        return this._httpClient.get(this.api_path + 'checkexpire', { headers }).pipe(
            catchError(error => {
                console.error('Error checking token:', error);
                return of(false); // Return false in case of an error
            }),
            switchMap((response: any) => {
                if (response.status === false) {
                    return of(false);
                } else {
                    return of(true);
                }
            })
        );
    }
}
