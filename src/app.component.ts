
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
  isSetupMenuOpen = signal(false);
  isInventoryMenuOpen = signal(false);
  isSalesMenuOpen = signal(false);
  isProcurementMenuOpen = signal(false);
  isAccountsMenuOpen = signal(false);
  isEntitiesMenuOpen = signal(false);
  isReportsMenuOpen = signal(false);
  isCarsMenuOpen = signal(false);
  isOperationsMenuOpen = signal(false);
  isUsersMenuOpen = signal(false);

  toggleSidebar() {
    this.isSidebarOpen.update(value => !value);
  }

  closeSidebar() {
    this.isSidebarOpen.set(false);
  }

  toggleSetupMenu() {
    this.isSetupMenuOpen.update(value => !value);
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

  toggleAccountsMenu() {
    this.isAccountsMenuOpen.update(value => !value);
  }

  toggleEntitiesMenu() {
    this.isEntitiesMenuOpen.update(value => !value);
  }

  toggleReportsMenu() {
    this.isReportsMenuOpen.update(value => !value);
  }

  toggleCarsMenu() {
    this.isCarsMenuOpen.update(value => !value);
  }

  toggleOperationsMenu() {
    this.isOperationsMenuOpen.update(value => !value);
  }

  toggleUsersMenu() {
    this.isUsersMenuOpen.update(value => !value);
  }
}
