import { Directive, Input, ElementRef, Renderer2, OnInit } from '@angular/core';
import { PermissionService } from '../../services/permission.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit {
  @Input('appHasPermission') permission!: string;
  @Input('appHasPermissionAny') permissions: string[] = [];
  @Input('appHasPermissionAll') allPermissions: string[] = [];

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    let hasPermission = false;

    if (this.permission) {
      hasPermission = this.permissionService.hasPermission(this.permission);
    } else if (this.permissions.length > 0) {
      hasPermission = this.permissionService.hasAnyPermission(this.permissions);
    } else if (this.allPermissions.length > 0) {
      hasPermission = this.permissionService.hasAllPermissions(this.allPermissions);
    }

    if (!hasPermission) {
      this.renderer.setStyle(this.elementRef.nativeElement, 'display', 'none');
    }
  }
}