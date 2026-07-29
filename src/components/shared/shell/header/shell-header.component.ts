import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CompanySwitcherComponent } from '../../company-switcher/company-switcher.component';
import { AvatarComponent } from '../../avatar/avatar.component';
import { AppTheme } from '../../../../services/theme.service';

/** Floating glass header. Purely presentational + event-emitting -- ShellComponent (the
 *  orchestrator) owns all real state/service calls (auth, theme, language, tenant) and passes
 *  them down as inputs/handles outputs, so this component has no direct service dependencies of
 *  its own beyond the ones it renders as child components (CompanySwitcherComponent, reused
 *  as-is from the previous shell since it's already correct). */
@Component({
  selector: 'app-shell-header',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    TranslateModule,
    CompanySwitcherComponent,
    AvatarComponent,
  ],
  templateUrl: './shell-header.component.html',
  styleUrl: './shell-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellHeaderComponent {
  @Input() isAuthenticated = false;
  @Input() userFullName = 'User';
  @Input() userAvatarUrl: string | null = null;
  @Input() isPlatformAdmin = false;
  @Input() currentTheme: AppTheme = 'light';
  @Input() currentLanguage = 'ar';
  @Input() isLoggingOut = false;
  @Input() railCollapsed = false;

  @Output() toggleRail = new EventEmitter<void>();
  @Output() openSearch = new EventEmitter<void>();
  @Output() toggleNotifications = new EventEmitter<void>();
  @Output() toggleTheme = new EventEmitter<void>();
  @Output() changeLanguage = new EventEmitter<string>();
  @Output() changePassword = new EventEmitter<void>();
  @Output() goToSystemAdmin = new EventEmitter<void>();
  @Output() goToUserProfile = new EventEmitter<void>();
  @Output() logOut = new EventEmitter<void>();
  @Output() logIn = new EventEmitter<void>();
}
