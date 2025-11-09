import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="show" class="toast" [class]="'toast-' + type" [class.show]="show">
      <div class="toast-message">
        <i [class]="getIcon()"></i>
        {{ message }}
      </div>
      <button type="button" class="btn-close" (click)="onClose()" aria-label="Cerrar"></button>
    </div>
  `,
  styles: [`
    .toast {
      position: fixed;
      top: 20px;
      right: 20px;
      min-width: 300px;
      padding: 0.75rem 1.25rem;
      margin-bottom: 1rem;
      border: 1px solid transparent;
      border-radius: 0.25rem;
      opacity: 0;
      transform: translateY(-10px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      z-index: 1090;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    }
    
    .toast.show {
      opacity: 1;
      transform: translateY(0);
    }
    
    .toast-success {
      color: #0f5132;
      background-color: #d1e7dd;
      border-color: #badbcc;
    }
    
    .toast-error {
      color: #842029;
      background-color: #f8d7da;
      border-color: #f5c2c7;
    }
    
    .toast-warning {
      color: #664d03;
      background-color: #fff3cd;
      border-color: #ffecb5;
    }
    
    .toast-info {
      color: #055160;
      background-color: #cff4fc;
      border-color: #b6effb;
    }
    
    .toast-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding-right: 1rem;
    }
    
    .btn-close {
      padding: 0.5rem 0.5rem;
      margin: -0.5rem -0.5rem -0.5rem auto;
      background-color: transparent;
      border: 0;
      opacity: 0.5;
      cursor: pointer;
      font-size: 1.25rem;
      line-height: 1;
    }
    
    .btn-close:hover {
      opacity: 0.75;
    }
  `]
})
export class ToastComponent implements OnChanges {
  @Input() message: string = '';
  @Input() type: 'success' | 'error' | 'warning' | 'info' = 'info';
  @Input() show: boolean = false;
  @Input() autoClose: boolean = true;
  @Input() autoCloseDelay: number = 5000; // 5 segundos por defecto
  
  @Output() closed = new EventEmitter<void>();
  
  private timeoutId: any;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['show'] && this.show) {
      this.setAutoClose();
    }
  }

  setAutoClose(): void {
    if (this.autoClose) {
      clearTimeout(this.timeoutId);
      this.timeoutId = setTimeout(() => {
        this.onClose();
      }, this.autoCloseDelay);
    }
  }

  onClose(): void {
    clearTimeout(this.timeoutId);
    this.show = false;
    this.closed.emit();
  }

  getIcon(): string {
    const icons = {
      success: 'bi bi-check-circle-fill me-2',
      error: 'bi bi-exclamation-triangle-fill me-2',
      warning: 'bi bi-exclamation-circle-fill me-2',
      info: 'bi bi-info-circle-fill me-2'
    };
    return icons[this.type] || '';
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeoutId);
  }
}
