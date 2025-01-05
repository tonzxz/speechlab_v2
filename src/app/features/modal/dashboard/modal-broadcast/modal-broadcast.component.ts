import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Output } from '@angular/core';
import { ClickOutsideDirective } from '../../../../shared/directives/click-outside.directive';

@Component({
  selector: 'app-modal-broadcast',
  standalone: true,
  imports: [
    ClickOutsideDirective
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './modal-broadcast.component.html',
  styleUrl: './modal-broadcast.component.css'
})
export class ModalBroadcastComponent {
  @Output() clickAlert = new EventEmitter<void>();

  close() {
    this.clickAlert.emit();
  }
}
