import { ChangeDetectionStrategy, Component, signal, inject, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule, DOCUMENT } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './services/language.service';
import { DevExtremeLocalizationService } from './services/devextreme-localization.service';
import { Subscription } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion'; // <-- هذا مهم
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { LoadingOverlayComponent } from './components/shared/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule
   ,MatListModule,MatSidenavModule,MatToolbarModule,MatIconModule, MatExpansionModule, MatFormFieldModule, MatSelectModule, TranslateModule,RouterOutlet, LoadingOverlayComponent
  ],
})
export class AppComponent implements OnDestroy {

    selectedLang = 'ar';
    private translate = inject(TranslateService);
    private document = inject(DOCUMENT);
    private languageService = inject(LanguageService);
    private devExtremeLocalizationService = inject(DevExtremeLocalizationService);
    private languageSub: Subscription | null = null;

    constructor() {
      // configure available languages and default
      this.translate.addLangs(['en', 'ar']);
      this.translate.setDefaultLang('ar');
      // start with stored language
      const current = this.languageService.getCurrentLanguage();
      this.selectedLang = current;
      this.translate.use(this.selectedLang);
      this.setDocumentDir(this.selectedLang);

      // subscribe to language changes so the document dir updates dynamically
      this.languageSub = this.languageService.language$.subscribe(lang => {
        if (lang) {
          this.selectedLang = lang;
          this.translate.use(lang);
          this.setDocumentDir(lang);
        }
      });
    }

  private readonly sidebarDefaultOpen = typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  isSidebarOpen = signal(this.sidebarDefaultOpen);
  openMenuIds = signal<Set<string>>(new Set());

 sidebarOpen = false;
openMenus: { [key: string]: boolean } = {};

toggleSidebar() {
  this.sidebarOpen = !this.sidebarOpen;
}

closeSidebar() {
  this.sidebarOpen = false;
}

toggleMenu(id: string) {
  this.openMenus[id] = !this.openMenus[id];
}

isMenuOpen(id: string) {
  return this.openMenus[id];
}

  switchLang(lang: string) {
    this.languageService.changeLocalLanguage(lang);
  }

  ngOnDestroy(): void {
    this.languageSub?.unsubscribe();
  }

  private setDocumentDir(lang: string) {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (this.document && this.document.documentElement) {
      this.document.documentElement.dir = dir;
    }
  }
}
