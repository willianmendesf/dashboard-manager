import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[ifHasPermission]',
  standalone: true
})
export class IfHasPermissionDirective implements OnInit, OnDestroy {
  private permission: string = '';
  private subscription?: Subscription;

  @Input() set ifHasPermission(permission: string) {
    this.permission = permission;
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Subscribe to auth status changes
    this.subscription = this.authService.getAuthStatus().subscribe(() => {
      this.updateView();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private updateView(): void {
    if (this.authService.hasPermission(this.permission)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}

