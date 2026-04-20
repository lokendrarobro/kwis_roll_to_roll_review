import { Injectable,OnInit } from '@angular/core';
import { RollsService } from './rolls.service';
@Injectable({
  providedIn: 'root'
})
export class CommonService{
    constructor(private rollsService: RollsService) {}
// Add activity log function
addActivityLog(activityLog): void {
  // console.log("called")
    const user_id = localStorage.getItem("user_id");
    const app_id = localStorage.getItem("app_id");
    // const kvp_backend_url = localStorage.getItem("kvp_backend_url");
  
    if (!user_id || !app_id ) {
      console.log("Missing required localStorage values");
      return;
    }
   
    const payload = {
      data: {
        app_id: app_id,
        message: {
          user_id: user_id,
          activity:activityLog.activity,
          message:activityLog.message
        },
        severity:activityLog.severity
      },
    };

    this.rollsService.addActivityLog(payload).subscribe(
      (response: any) => {
        if (response?.status) {
          // console.log("Activity added successfully");
        } else {
          console.warn("Failed to add activity:", response);
        }
      },
      (error) => {
        console.error("Error saving activity:", error);
      }
    );
  }
}
