import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-class',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './edit-class.component.html',
  styleUrls: ['./edit-class.component.css']
})
export class EditClassComponent {
  @Input() classData: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() classUpdated = new EventEmitter<void>();

  days: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  constructor() { }

  onSubmit() {
    // Emit the updated class data, including the array of selected days
    this.classUpdated.emit(this.classData); 
  }

  onCancel() {
    this.closeModal.emit();  
  }

  onDayChange(day: string) {
    // Ensure `classData.day_schedule` is an array
    if (!Array.isArray(this.classData.day_schedule)) {
      this.classData.day_schedule = [];
    }

    // Toggle the day in the array
    const index = this.classData.day_schedule.indexOf(day);
    if (index === -1) {
      this.classData.day_schedule.push(day);
    } else {
      this.classData.day_schedule.splice(index, 1);
    }
  }
}
