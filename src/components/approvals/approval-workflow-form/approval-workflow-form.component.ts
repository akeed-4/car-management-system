import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApprovalService } from '../../../services/approval.service';
import {
  ApprovalWorkflow,
  ApprovalLevel,
  CreateApprovalWorkflowDto,
  CreateApprovalLevelDto,
  UpdateApprovalWorkflowDto,
  DOCUMENT_TYPES,
  APPROVER_TYPES,
  CONDITION_OPERATORS
} from '../../../models/approval-workflow.model';
import { NotificationService } from '@/src/services/notification.service';

@Component({
  selector: 'app-approval-workflow-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDividerModule,
    MatStepperModule,
    MatChipsModule,
    MatTooltipModule,
    MatExpansionModule,
    TranslateModule
  ],
  templateUrl: './approval-workflow-form.component.html',
  styleUrls: ['./approval-workflow-form.component.css']
})
export class ApprovalWorkflowFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private approvalService = inject(ApprovalService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  workflowForm!: FormGroup;
  editMode = signal(false);
  workflowId = signal<number | null>(null);
  isSubmitting = signal(false);

  documentTypes = DOCUMENT_TYPES;
  approverTypes = APPROVER_TYPES;
  conditionOperators = CONDITION_OPERATORS;

  availableUsers = signal<{ id: number; name: string }[]>([]);
  availableRoles = signal<{ id: number; name: string }[]>([]);

  // Computed properties
  levels = computed(() => {
    return this.getLevelsArray()?.controls || [];
  });

  ngOnInit(): void {
    this.initForm();
    this.loadApprovers();

    // Check if editing
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.editMode.set(true);
      this.workflowId.set(+id);
      this.loadWorkflow(+id);
    } else {
      // Add initial level
      this.addLevel();
    }
  }

  private initForm(): void {
    this.workflowForm = this.fb.group({
      workflowName: ['', [Validators.required, Validators.minLength(3)]],
      documentType: ['', Validators.required],
      description: [''],
      isActive: [true],
      isDefault: [false],
      priority: [0],
      levels: this.fb.array([])
    });
  }

  private loadApprovers(): void {
    this.approvalService.getAvailableUsers().subscribe({
      next: (users) => this.availableUsers.set(users),
      error: (error) => console.error('Error loading users:', error)
    });

    this.approvalService.getAvailableRoles().subscribe({
      next: (roles) => this.availableRoles.set(roles),
      error: (error) => console.error('Error loading roles:', error)
    });
  }

  private loadWorkflow(id: number): void {
    this.approvalService.getWorkflowById(id).subscribe({
      next: (workflow) => {
        this.workflowForm.patchValue({
          workflowName: workflow.workflowName,
          documentType: workflow.documentType,
          description: workflow.description,
          isActive: workflow.isActive,
          isDefault: workflow.isDefault,
          priority: workflow.priority
        });

        // Load levels
        (workflow.approvalLevels || []).forEach(level => {
          this.addLevel(level);
        });
      },
      error: (error) => {
        console.error('Error loading workflow:', error);
        this.notificationService.showError(this.translate.instant('APPROVALS.ERROR_LOADING_WORKFLOW'));
        this.router.navigate(['/approvals/workflows']);
      }
    });
  }

  getLevelsArray(): FormArray {
    return this.workflowForm.get('levels') as FormArray;
  }

  addLevel(level?: ApprovalLevel): void {
    const approverType: 'User' | 'Role' = level?.roleId ? 'Role' : 'User';
    const approverId = level?.roleId ?? level?.levelUsers?.[0]?.userId ?? null;

    const levelForm = this.fb.group({
      id: [level?.id || null],
      levelNumber: [level?.levelNumber || this.getLevelsArray().length + 1],
      levelName: [level?.levelName || '', Validators.required],
      approverType: [approverType, Validators.required],
      approverId: [approverId, Validators.required],
      // isParallel maps to backend ApprovalMode: 'Any' approver can act vs 'All' must act.
      isParallel: [level?.approvalMode === 'All'],
      isRequired: [level?.isRequired ?? true],
      canSkip: [level?.canSkip ?? false],
      sendNotification: [level?.sendNotification ?? true],
      sendReminder: [level?.sendReminder ?? true],
      escalationHours: [level?.escalationHours ?? null],
      reminderHours: [level?.reminderHours ?? null]
    });

    this.getLevelsArray().push(levelForm);
  }

  removeLevel(index: number): void {
    this.getLevelsArray().removeAt(index);
    this.reorderLevels();
  }

  moveLevel(index: number, direction: 'up' | 'down'): void {
    const levels = this.getLevelsArray();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < levels.length) {
      const currentLevel = levels.at(index);
      const targetLevel = levels.at(targetIndex);

      levels.setControl(index, targetLevel);
      levels.setControl(targetIndex, currentLevel);
      this.reorderLevels();
    }
  }

  private reorderLevels(): void {
    const levels = this.getLevelsArray();
    levels.controls.forEach((control, index) => {
      control.get('levelNumber')?.setValue(index + 1);
    });
  }

  getApproverName(level: any): string {
    const approverType = level.get('approverType')?.value;
    const approverId = level.get('approverId')?.value;

    if (!approverId) return '';

    if (approverType === 'User') {
      const user = this.availableUsers().find(u => u.id === approverId);
      return user?.name || '';
    } else {
      const role = this.availableRoles().find(r => r.id === approverId);
      return role?.name || '';
    }
  }

  getApproverOptions(approverType: string): { id: number; name: string }[] {
    return approverType === 'User' ? this.availableUsers() : this.availableRoles();
  }

  private buildLevelDto(levelValue: any): CreateApprovalLevelDto {
    const isRoleApprover = levelValue.approverType === 'Role';
    return {
      levelNumber: levelValue.levelNumber,
      levelName: levelValue.levelName,
      approvalType: 'Single',
      approvalMode: levelValue.isParallel ? 'All' : 'Any',
      roleId: isRoleApprover ? levelValue.approverId : undefined,
      isRequired: levelValue.isRequired,
      canSkip: levelValue.canSkip,
      escalationHours: levelValue.escalationHours || undefined,
      sendNotification: levelValue.sendNotification,
      sendReminder: levelValue.sendReminder,
      reminderHours: levelValue.reminderHours || undefined,
      userIds: isRoleApprover ? [] : (levelValue.approverId ? [levelValue.approverId] : [])
    };
  }

  saveWorkflow(): void {
    if (this.workflowForm.invalid) {
      this.notificationService.showWarning(this.translate.instant('APPROVALS.FORM_INVALID'));
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.workflowForm.value;

    if (this.editMode()) {
      const dto: UpdateApprovalWorkflowDto = {
        workflowName: formValue.workflowName,
        description: formValue.description,
        isActive: formValue.isActive,
        isDefault: formValue.isDefault,
        priority: formValue.priority
      };
      this.approvalService.updateWorkflow(this.workflowId()!, dto).subscribe({
        next: () => {
          this.notificationService.showSuccess(this.translate.instant('APPROVALS.WORKFLOW_UPDATED'));
          this.router.navigate(['/approvals/workflows']);
        },
        error: (error) => {
          console.error('Error updating workflow:', error);
          this.notificationService.showError(this.translate.instant('APPROVALS.ERROR_UPDATE_WORKFLOW'));
          this.isSubmitting.set(false);
        }
      });
    } else {
      const dto: CreateApprovalWorkflowDto = {
        documentType: formValue.documentType,
        workflowName: formValue.workflowName,
        description: formValue.description,
        isActive: formValue.isActive,
        isDefault: formValue.isDefault,
        priority: formValue.priority,
        approvalLevels: (formValue.levels || []).map((l: any) => this.buildLevelDto(l)),
        approvalConditions: []
      };
      this.approvalService.createWorkflow(dto).subscribe({
        next: () => {
          this.notificationService.showSuccess(this.translate.instant('APPROVALS.WORKFLOW_CREATED'));
          this.router.navigate(['/approvals/workflows']);
        },
        error: (error) => {
          console.error('Error creating workflow:', error);
          this.notificationService.showError(this.translate.instant('APPROVALS.ERROR_CREATE_WORKFLOW'));
          this.isSubmitting.set(false);
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/approvals/workflows']);
  }
}
