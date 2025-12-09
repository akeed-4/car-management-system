import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class CurrentUserService {

  constructor(private http: HttpClient,private oidcSecurityService:OidcSecurityService) {}
  private apiURL = environment.origin;
  private adminURL = environment.origin ;
  private userRole = null;



  checkUserRole(){
    this.oidcSecurityService.getUserData().subscribe((data) => {
      this.userRole = data.role;
      return this.userRole;
    });
  }



  ChangeUserLanguage(languageCode : string) {
    return this.http.post(this.apiURL +'/Admin/ChangeUserLanguage',null, { params: {languageCode:languageCode} });
  }

 
  userCanDo(flagId : number){
    return this.http.get<boolean>(`${this.apiURL}/Admin/UserCanDo`, { params: {flagId:flagId} });
  }
  getUserFlags(){
      return this.http.get<number[]>(`${this.apiURL}/Admin/GetUserFlags`);
  }
  getMenuUserFlags(menuCode:number){
    return this.http.get<number[]>(`${this.apiURL}/Admin/GetMenuUserFlags?menuCode=${menuCode}`);
}
  

  getUserRole():string|null{
    if(this.userRole){
      return this.userRole;
    }else{
      this.checkUserRole();
      return this.userRole;
    }
  }

  setUserRole(userRole:any){
    this.userRole = userRole;
  }


}

