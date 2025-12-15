import { Component } from '@angular/core';

@Component({
  selector: 'app-accounting',
  templateUrl: './accounting.component.html',
  styleUrls: ['./accounting.component.css']
})
export class AccountingComponent {
  selectedTab = 0;

  onTabChange(index: number) {
    this.selectedTab = index;
  }
}