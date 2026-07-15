import { Directive, Input, ElementRef, Renderer2, TemplateRef, ViewContainerRef, Optional, effect, signal } from '@angular/core';
import { PermissionService } from '../../services/permission.service';

/**
 * Shows/hides content based on the current role's permissions.
 *
 * Supports both usages:
 * - Attribute:  <button appHasPermission="users.create">   (hides host via display:none)
 * - Structural: <button *appHasPermission="'users.create'"> (adds/removes from DOM)
 *
 * Re-evaluates automatically when roles/permissions finish loading,
 * since RoleService populates its signal asynchronously after login.
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private permission = signal<string>('');
  private anyPermissions = signal<string[]>([]);
  private allPermissions = signal<string[]>([]);

  @Input('appHasPermission')
  set permissionInput(value: string) { this.permission.set(value ?? ''); }

  @Input('appHasPermissionAny')
  set anyInput(value: string[]) { this.anyPermissions.set(value ?? []); }

  @Input('appHasPermissionAll')
  set allInput(value: string[]) { this.allPermissions.set(value ?? []); }

  private hasView = false;

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private permissionService: PermissionService,
    @Optional() private templateRef: TemplateRef<unknown> | null,
    @Optional() private viewContainer: ViewContainerRef | null
  ) {
    effect(() => {
      this.apply(this.isAllowed());
    });
  }

  private isAllowed(): boolean {
    const single = this.permission();
    const any = this.anyPermissions();
    const all = this.allPermissions();

    if (single) {
      return this.permissionService.hasPermission(single);
    }
    if (any.length > 0) {
      return this.permissionService.hasAnyPermission(any);
    }
    if (all.length > 0) {
      return this.permissionService.hasAllPermissions(all);
    }
    return false;
  }

  private apply(allowed: boolean): void {
    // Structural usage (*appHasPermission): add/remove the template content.
    if (this.templateRef && this.viewContainer) {
      if (allowed && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!allowed && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
      return;
    }

    // Attribute usage: toggle visibility of the host element.
    if (allowed) {
      this.renderer.removeStyle(this.elementRef.nativeElement, 'display');
    } else {
      this.renderer.setStyle(this.elementRef.nativeElement, 'display', 'none');
    }
  }
}
