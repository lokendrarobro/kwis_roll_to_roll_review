import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, ReplaySubject, tap, BehaviorSubject, Subject } from 'rxjs';
import { User } from 'app/core/user/user.types';
import CryptoJS from 'crypto-js';
import { RollsService } from '../../services/rolls.service';
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private modulelistnavbar = new BehaviorSubject('');

  CurrentCategory = this.modulelistnavbar.asObservable();
  private _user: ReplaySubject<User> = new ReplaySubject<User>(1);
  private _rolePermissions: ReplaySubject<any> = new ReplaySubject<any>(1);
  private _roles: ReplaySubject<any> = new ReplaySubject<any>(1);
  userNavigation = new BehaviorSubject<any>([])
  allNavigations = new BehaviorSubject<any>([])



  private machineStatusSubject = new Subject<boolean>();

  machineStatus$ = this.machineStatusSubject.asObservable();
  api_path:any;
  

  updateMachineStatus(status: boolean) {
    this.machineStatusSubject.next(status);
  }
  keys = '123456$#@$^@1ERF';

  constructor(
    private _httpClient: HttpClient,
    private RollsService: RollsService
  ) {
    if (!sessionStorage.getItem('reloadCheck')) {
    }
    this.get_api_path();
  }

  get_api_path() {
    
    this.RollsService.full_api_path.subscribe((data: any) => {
      this.api_path = data
    })
}
  set user(value: User) {
    // Store the value
    this._user.next(value);
  }

  get user$(): Observable<User> {
    return this._user.asObservable();
  }
  set rolePermissions(value: any) {
    this._rolePermissions.next(value);
  }

  get rolePermissions$(): Observable<any> {
    return this._rolePermissions.asObservable();
  }

  set roles(value: any) {
    this._roles.next(value);
  }

  get roles$(): Observable<any> {
    return this._roles.asObservable();
  }

  get(): Observable<User> {
    return this._httpClient.get<User>('api/common/user').pipe(
      tap((user) => {
        this._user.next(user);
      })
    );
  }

  /**
   * Update the user
   *
   * @param user
   */
  update(user: User): Observable<any> {
    return this._httpClient.patch<User>('api/common/user', { user }).pipe(
      map((response) => {
        this._user.next(response);
      })
    );
  }

  unDeleteDefect(data): Observable<any> {
    return this._httpClient.post(this.api_path+'unDeleteDefect', data);
  }
}
