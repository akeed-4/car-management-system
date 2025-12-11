import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  private languageSubject = new BehaviorSubject<string>(this.getCurrentLanguage());
  language$ = this.languageSubject.asObservable();

  constructor(private translateService: TranslateService) {}

  getCurrentLanguage(){
   return localStorage.getItem('currentLanguage') || 'ar' ;
  }

  changeLocalLanguage(language: string){
    this.translateService.use(language);
    localStorage.setItem('currentLanguage', language);
    this.languageSubject.next(language);
  }
}

