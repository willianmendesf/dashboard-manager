import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ModalButton {
  label: string;
  action: () => void;
  type?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss'
})
export class ModalComponent {
  @Input() title: string = '';
  @Input() isOpen: boolean = false;
  @Input() size: 'small' | 'medium' | 'large' | 'xlarge' = 'medium';
  @Input() showCloseButton: boolean = true;
  @Input() closeOnOverlayClick: boolean = true;
  @Input() footerButtons: ModalButton[] = [];
  @Input() customFooterTemplate?: TemplateRef<any>;
  @Input() customHeaderTemplate?: TemplateRef<any>;
  
  @Output() close = new EventEmitter<void>();

  get sizeClass(): string {
    return `modal-${this.size}`;
  }

  onOverlayClick() {
    if (this.closeOnOverlayClick) {
      this.closeModal();
    }
  }

  closeModal() {
    this.close.emit();
  }

  onButtonClick(button: ModalButton) {
    if (!button.disabled) {
      button.action();
    }
  }
}

