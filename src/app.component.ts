import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
})
export class AppComponent {
  isSidebarOpen = signal(false);
  isInventoryMenuOpen = signal(false);
  isSalesMenuOpen = signal(false);
  isProcurementMenuOpen = signal(false);
  isEntitiesMenuOpen = signal(false);
  isReportsMenuOpen = signal(false);
  isSetupMenuOpen = signal(false);
  isUsersMenuOpen = signal(false);
  isAccountsMenuOpen = signal(false); // New signal for Accounts menu

  toggleSidebar() {
    this.isSidebarOpen.update(value => !value);
  }

  closeSidebar() {
    this.isSidebarOpen.set(false);
    this.isInventoryMenuOpen.set(false);
    this.isSalesMenuOpen.set(false);
    this.isProcurementMenuOpen.set(false);
    this.isEntitiesMenuOpen.set(false);
    this.isReportsMenuOpen.set(false);
    this.isSetupMenuOpen.set(false);
    this.isUsersMenuOpen.set(false);
    this.isAccountsMenuOpen.set(false); // Close Accounts menu
  }

  toggleInventoryMenu() {
    this.isInventoryMenuOpen.update(value => !value);
  }

  toggleSalesMenu() {
    this.isSalesMenuOpen.update(value => !value);
  }

  toggleProcurementMenu() {
    this.isProcurementMenuOpen.update(value => !value);
  }
  
  toggleEntitiesMenu() {
    this.isEntitiesMenuOpen.update(value => !value);
  }

  toggleReportsMenu() {
    this.isReportsMenuOpen.update(value => !value);
  }

  toggleSetupMenu() {
    this.isSetupMenuOpen.update(value => !value);
  }

  toggleUsersMenu() {
    this.isUsersMenuOpen.update(value => !value);
  }

  toggleAccountsMenu() { // New toggle method for Accounts
    this.isAccountsMenuOpen.update(value => !value);
  }
}