// app/core/app-init.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { timeout, catchError, tap , map } from 'rxjs/operators';
import { RollsService } from "app/services/rolls.service";
import { UserService } from 'app/core/user/user.service';

@Injectable({ providedIn: 'root' })
export class AppInitService {
  constructor(private http: HttpClient, private toastrService: ToastrService, private RollsService: RollsService, private _userService: UserService) { }
  init(): Promise<void> {
    return new Promise(async (resolve) => {
      const masterMachineIp = (window as any).__env?.master_machine_ip
      if(!masterMachineIp)
      {
        this.toastrService.error("Please set the master machine configuration first. Master machine configuration is required");
        return resolve();
      }
      const getQueryParam = (name: string) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
      };

      const encodedData = getQueryParam("data");

      if (encodedData) {
        try {
          const jsonData: any = JSON.parse(atob(encodedData));

          // FIX: parse machineData (string → array)
          const machineIds = await this.getMachineIds();
          jsonData.machineData = machineIds;
          this.loginWithEncodedData(jsonData, 0).then((res: any) => {
            jsonData.launch_status = true;
            // const selectedMachine = jsonData.machineData[res as number];
            localStorage.setItem("selectMachine", JSON.stringify([res]))
            jsonData.machine_id = res?.id;
            jsonData.machine_ip = res?.ip;
            jsonData.machine_port = res?.port;
            jsonData.machine_name = res?.name;

            this.setLocalStorageFromJson(jsonData);

            resolve();
          })
            .catch(() => resolve()); // Resolve even if login fails

        } catch (err) {
          resolve(); // still resolve even if JSON.parse fails
        }
      }
      else {
        
        if (!('accessToken' in localStorage)) {
          this.createAuthToken(0).then(() => {
            resolve();
          }).catch(err => {
            resolve(); // still resolve to load app
          });
        }
        else if(localStorage.getItem('accessToken')){
          const userDetails = localStorage.getItem('userDetails');
          if (userDetails) {
            try {
              const user = JSON.parse(userDetails);
              this._userService.user = JSON.parse(user);
            } catch (e) {
              console.error('Failed to parse userDetails');
            }
          }
          this.getLeftSideVarData();
          resolve();
        }
      }
    });
  }

  private setLocalStorageFromJson(jsonData: any) {
    localStorage.setItem("accessToken", jsonData.accessToken || "");
    localStorage.setItem("user_id", jsonData.user_id || "");
    localStorage.setItem("role", jsonData.role || "");
    localStorage.setItem("machine_ip", jsonData.machine_ip || "");
    localStorage.setItem("machine_port", jsonData.machine_port || "");
    localStorage.setItem("machine_id", jsonData.machine_id || "");
    localStorage.setItem("machine_name", jsonData.machine_name || "");
    localStorage.setItem("machineData", JSON.stringify(jsonData.machineData) || "");
    localStorage.setItem("userDetails", JSON.stringify(jsonData.userDetails) || "");
    localStorage.setItem("kvp_backend_url", jsonData.backend_url || "");
    localStorage.setItem("origin", jsonData.origin || "");
    localStorage.setItem("app_id", jsonData.app_id || "");

    if (jsonData.app_id) {
      localStorage.setItem("app_id", jsonData.app_id);
    }

    this.getLeftSideVarData()

  }

  private loginWithEncodedData(jsonData: any, index: number) {
    return new Promise((resolve, reject) => {
      if (index >= jsonData.machineData.length) {
        this.toastrService.error("All machines failed to connect.", "Connection Error", { timeOut: 5000 });
        return reject(new Error("All machines failed to connect."));
      }
      let machineIds = jsonData.machineData;
      let apiPath = '';
      let machineData: { ip?: string; port?: string; id?: string; name?: string } = {};
      let masterMachineData: any = {};
      let machine:any = {};

      // if(machineIds[index].master_machine_status !== 'undefined' && machineIds[index].master_machine_status !== undefined){ 
        const masterMachineIndex = machineIds.findIndex(m => m.master_machine_status === 1);
        masterMachineData = machineIds[masterMachineIndex];
        index = masterMachineData
        apiPath = `http://${masterMachineData.ip}:8889/api/`;
        machineData = masterMachineData;
        // machineData['ip'] = masterMachineData.ip_address;
        machineData['port'] = ':8889/';  
        // machineData['id'] = masterMachineData.machine_id;
        // machineData['name'] = masterMachineData.machine_name;
        localStorage.setItem('master_machine_data', JSON.stringify(masterMachineData) || '');
        machine = masterMachineData;
        machine['port'] = ':8889/';
      // }
      // else
      // {
      //   machine = jsonData.machineData[index];
      //   const port = machine.port || '';
      //   apiPath = `http://${machine.ip}${port}api/`;
      // }
      this.RollsService.connection_check(apiPath).pipe(
        timeout(1000), // 5 seconds timeout
        catchError((error: any) => {
          if (error.name === 'TimeoutError') {
            this.loginWithEncodedData(jsonData, index + 1).then(resolve).catch(reject);
          } else {
            this.loginWithEncodedData(jsonData, index + 1).then(resolve).catch(reject);
          }
          return of(null); // Return an Observable to satisfy catchError's contract
        })
      ).subscribe(
        (response: any) => {
          if (response.message) {
            this.toastrService.success(`System Connected successfully to ${machine.name}`, "Machine Connection Summary");
              jsonData.machine_id = machine.id;
              jsonData.machine_ip = machine.ip;
              jsonData.machine_port = machine.port;
              jsonData.name = machine.name
              this.setLocalStorageFromJson(jsonData);
              this._userService.user = JSON.parse(jsonData.userDetails);
              resolve(index);
          }
        },
        (error: any) => {
          this.loginWithEncodedData(jsonData, index + 1).then(resolve).catch(reject);
        }
      );
      // this.http.post(apiPath).subscribe({
      //   next: (response: any) => {
      //     if (response && response.token) {
      //       this.setLocalStorageFromJson(jsonData);
      //       resolve(index);
      //     } else {
      //       // Handle cases where login is "successful" but no token is returned
      //       this.loginWithEncodedData(jsonData, index + 1).then(resolve).catch(reject);
      //     }
      //   },
      //   error: (err) => {
      //     this.loginWithEncodedData(jsonData, index + 1).then(resolve).catch(reject);
      //   }
      // });
    });
  }

  private async createAuthToken(indexMachine: number): Promise<void> {
    const credentials = {
      email: (window as any).__env?.email || 'admin@gmail.com',
      password: (window as any).__env?.password || 'admin123'
    };

    try {
      const machineIds = await this.getMachineIds();
      let apiPath = '';
      let machineData: { ip?: string; port?: string; id?: string; name?: string } = {};
      let masterMachineData: any = {};

      // if(machineIds[indexMachine].master_machine_status !== 'undefined' && machineIds[indexMachine].master_machine_status !== undefined){ 
        const masterMachineIndex = machineIds.findIndex(m => m.master_machine_status === 1);
        masterMachineData = machineIds[masterMachineIndex];
        apiPath = `http://${masterMachineData.ip}:8889/api/`;
        machineData = masterMachineData;
        // machineData['ip'] = masterMachineData.ip_address;
        machineData['port'] = ':8889/';  
        // machineData['id'] = masterMachineData.machine_id;
        // machineData['name'] = masterMachineData.machine_name;
        localStorage.setItem('master_machine_data', JSON.stringify(masterMachineData) || '');
      // }
      // else{
      //   if (!machineIds[indexMachine]) {
      //     throw new Error('Invalid machine index');
      //   }
      //   apiPath = `http://${machineIds[indexMachine].ip}${machineIds[indexMachine].port || ''}api/`;
      //   machineData = machineIds[indexMachine];
      // }


      // const apiPath = `http://${machineIds[indexMachine].ip}${machineIds[indexMachine].port || ''}api/`;

      await this.http.post(apiPath + 'login', credentials).toPromise();

      const response: any = await this.http.post(apiPath + 'login', credentials).toPromise();

      localStorage.setItem('launch_status', 'true');
      localStorage.setItem('accessToken', response.token || '');
      localStorage.setItem('user_id', response.userDetails.user_id || '');
      localStorage.setItem('role', response.userDetails.user_type || '');
      localStorage.setItem('machine_ip', machineData.ip || '');
      localStorage.setItem('machine_port', machineData.port || '');
      localStorage.setItem('machine_id', machineData.id || '');
      localStorage.setItem('machine_name', machineData.name || '');
      localStorage.setItem('machineData', JSON.stringify(machineIds));

    } catch (err) {
      if (indexMachine < 1) {
        await this.createAuthToken(indexMachine + 1);
      } else {
        this.toastrService.error(
          'All machines failed to connect.',
          'Connection Error',
          { timeOut: 5000 }
        );
      }
    }
  }


  private async getMachineIds(): Promise<any[]> {
    const masterMachineIp = (window as any).__env?.master_machine_ip || 'localhost';
    const apiPath = `http://${masterMachineIp}:8889/api/getInspectionMachineData`;

    try {
      const response: any = await this.http.get(apiPath).toPromise();
      let machineIds = response?.data || [];

      if (machineIds.length === 0) {
        await this.addInspectionMachine();

        const refetchResponse: any = await this.http.get(apiPath).toPromise();
        machineIds = refetchResponse?.data || [];
      }

      const masterMachine = machineIds.find(
        (m: any) => m.master_machine_status === 1
      );

      if (masterMachine && masterMachine.ip !== masterMachineIp) {

        const isUpdated = await this.updateMasterMachine(
          masterMachine.id,
          masterMachineIp
        );

        //  Sirf update success hua tab hi GET call
        if (isUpdated) {
          const updateApiPath = `http://${masterMachineIp}:8889/api/getInspectionMachineData`;
          const refetchResponse: any = await this.http.get(updateApiPath).toPromise();

          machineIds = refetchResponse?.data || [];
        } else {
          console.warn('Master machine update failed, GET call skipped');
        }
      }


      if(!masterMachine){
        await this.addInspectionMachine();

        const refetchResponse: any = await this.http.get(apiPath).toPromise();
        machineIds = refetchResponse?.data || [];
      }

      const machineNames = machineIds.map((m: any) => m.name);
      const machineIPs = machineIds.map((m: any) => m.ip);

      localStorage.setItem('machine_names', JSON.stringify(machineNames));
      localStorage.setItem('machine_ips', JSON.stringify(machineIPs));

      return machineIds;

    } catch (error) {
      // return this.getMachineFromEnv();
    }
  }


  private getMachineFromEnv(): any[] {
    const machineNames = ((window as any).__env.machine_name || 'machine_1')
      .split(',').map((n: string) => n.trim());

    const machineIPs = ((window as any).__env.machine_ip || '0.0.0.0')
      .split(',').map((ip: string) => ip.trim());

    return machineNames.map((name, index) => ({
      id: index + 1,
      name,
      ip: machineIPs[index],
      port: ':8889/'
    }));
  }

  private getLeftSideVarData() {
    this.RollsService.get_api_path();
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
  }

  private addInspectionMachine(): Promise<boolean> {
    const masterMachineIp = (window as any).__env?.master_machine_ip;
    const apiPath = `http://${masterMachineIp}:8889/api/saveInspectionMachineData`;

    const payloadData = {
      machine_name: "Master_machine",
      ip_address: masterMachineIp,
      port: ":8889/",
      master_machine_status: 1
    };

    return new Promise((resolve, reject) => {
      this.http.post(apiPath, payloadData).subscribe({
        next: (response: any) => {
          if (response.status) {
            resolve(true);
          } else {
            resolve(false);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  private updateMasterMachine(masterMachineId: any,masterMachineIp: any): Promise<boolean> {
    const apiPath = `http://${masterMachineIp}:8889/api/updateInspectionMachineIp`;

    const payloadData = {
      machine_id: masterMachineId,
      machine_ip: masterMachineIp
    };

    return new Promise((resolve, reject) => {
      this.http.post(apiPath, payloadData).subscribe({
        next: (response: any) => {
          if (response.status) {
            resolve(true);
          } else {
            resolve(false);
          }
        },
        error: (error) => {
          console.log(error);
          reject(error);
        }
      });
    });
  }


}
