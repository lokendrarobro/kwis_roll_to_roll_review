import { Component, HostListener } from '@angular/core';
import { AuthService } from '../app/core/auth/auth.service';
import { RollsService } from './services/rolls.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private _authService: AuthService,private rollsService: RollsService) { 
    this.rollsService.initialize();
  }

  currentOrigin: string = window.location.origin;
  referrer: string = document.referrer;

  ngOnInit(): void {
    const currentPath = window.location.pathname as string;
    if (currentPath === '/' || currentPath === '/dashboards/roll' || currentPath === '/review_and_repair') {
      const isPageRefreshed = sessionStorage.getItem('isRefreshed');
    const authToken = localStorage.getItem('accessToken'); // Check if user is logged in
    //Dusri website se aaye hain, toh authentication API call karein
    if (this.referrer && !this.referrer.includes(this.currentOrigin) && !isPageRefreshed) {
      // console.log("User is coming from another website, calling authentication API...");
      // this._authService.signInUsingToken().subscribe((res: any) => {
      //   if (res && res.token) {
      //     // console.log(" User authenticated successfully");
      //     localStorage.setItem('authToken', res.token); //Save token
      //   } else {
      //     console.log("Authentication failed");
      //   }
      // });
    }
    else if(!this.referrer.includes(this.currentOrigin) && !isPageRefreshed){
      this._authService.signInUsingToken1().subscribe((res: any) => {
        if (res && res.token) {
          // console.log("User authenticated successfully");
          localStorage.setItem('authToken', res.token); // Save token
        } else {
          console.log("Authentication failed");
        }
      });
    }
    else if (isPageRefreshed === 'true' && authToken && !('kvp_backend_url' in localStorage)) {
      // console.log("Page refreshed, calling refresh token API...");
      this.refreshToken();
    }

    sessionStorage.removeItem('isRefreshed');
    }

   
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: Event) {
    sessionStorage.setItem('isRefreshed', 'true');
  }

  // **Refresh token API call function**
  private refreshToken(): void {
    this._authService.signInUsingToken1().subscribe((res: any) => {
      if (res && res.token) {
        console.log("Token refreshed successfully");
        localStorage.setItem('authToken', res.token);
      } else {
        console.log("Token refresh failed");
      }
    });
  }
}


