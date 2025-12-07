import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  constructor(private translateService: TranslateService) {}

  getCurrentLanguage(){
   return localStorage.getItem('currentLanguage') || 'en' ;
  }
  changeLocalLanguage(language: string){
    this.translateService.use(language);
    localStorage.setItem('currentLanguage', language);
  }
}

