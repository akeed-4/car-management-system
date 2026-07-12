import { ChangeDetectionStrategy, Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GeminiService } from '../../../services/gemini.service';
import { InventoryService } from '../../../services/inventory.service';
import { RequestedCar } from '../../../models/requested-car.model';
import { Car } from '../../../models/car.model';

export interface AiPanelData {
  requestedCar: RequestedCar;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'error';
  text: string;
}

@Component({
  selector: 'app-requested-car-ai-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './requested-car-ai-panel.component.html',
  styleUrl: './requested-car-ai-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestedCarAiPanelComponent implements OnInit {
  private geminiService = inject(GeminiService);
  private inventoryService = inject(InventoryService);
  private translate = inject(TranslateService);

  loadingMatches = signal(true);
  matchError = signal(false);
  matches = signal<Car[]>([]);

  messages = signal<ChatMessage[]>([]);
  question = signal('');
  asking = signal(false);

  contextSummary = computed(() => {
    const rc = this.data.requestedCar;
    return `Request ${rc.requestNumber}: Customer ${rc.customerName}, wants ${rc.make} ${rc.model}` +
      `${rc.year ? ' ' + rc.year : ''}${rc.color ? ', color ' + rc.color : ''}, priority ${rc.priority}` +
      `${rc.preferredSpecifications ? ', specs: ' + rc.preferredSpecifications : ''}, status ${rc.status}.`;
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AiPanelData,
    private dialogRef: MatDialogRef<RequestedCarAiPanelComponent>,
  ) {}

  ngOnInit(): void {
    this.loadMatches();
  }

  private loadMatches(): void {
    this.loadingMatches.set(true);
    this.matchError.set(false);
    this.inventoryService.getAvailableVehicles().subscribe({
      next: (cars) => {
        const rc = this.data.requestedCar;
        const scored = cars
          .filter(c => !rc.make || c.make?.toLowerCase() === rc.make.toLowerCase())
          .filter(c => !rc.model || c.model?.toLowerCase().includes(rc.model.toLowerCase()));
        this.matches.set(scored.slice(0, 5));
        this.loadingMatches.set(false);
      },
      error: () => {
        this.matchError.set(true);
        this.loadingMatches.set(false);
      },
    });
  }

  async askQuestion(): Promise<void> {
    const q = this.question().trim();
    if (!q || this.asking()) return;

    this.messages.update(m => [...m, { role: 'user', text: q }]);
    this.question.set('');
    this.asking.set(true);

    try {
      const answer = await this.geminiService.askAssistant(this.contextSummary(), q);
      this.messages.update(m => [...m, { role: 'assistant', text: answer }]);
    } catch {
      this.messages.update(m => [...m, {
        role: 'error',
        text: this.translate.instant('REQUESTED_CARS.AI_PANEL.UNAVAILABLE'),
      }]);
    } finally {
      this.asking.set(false);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
