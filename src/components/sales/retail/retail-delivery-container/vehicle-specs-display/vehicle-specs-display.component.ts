import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { VehicleSpecs } from '../../../../../models/retail/retail-delivery.model';

@Component({
  selector: 'app-vehicle-specs-display',
  standalone: true,
  imports: [CommonModule, MatCardModule, TranslateModule],
  templateUrl: './vehicle-specs-display.component.html',
  styleUrls: ['./vehicle-specs-display.component.css']
})
export class VehicleSpecsDisplayComponent {
  @Input() specs: VehicleSpecs | null = null;
}
