import { Component, EventEmitter, Output } from '@angular/core';
import { SupabaseService } from '../../../../supabase.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClickOutsideDirective } from '../../../../shared/directives/click-outside.directive';

@Component({
  selector: 'app-create-class',
  standalone: true,
  imports: [
    FormsModule, 
    CommonModule,
    ClickOutsideDirective
  ],
  templateUrl: './create-class.component.html',
  styleUrls: ['./create-class.component.css']
})
export class CreateClassComponent {
  @Output() closeModal = new EventEmitter<void>();
  @Output() classCreated = new EventEmitter<void>();
  dropdownOpen: boolean = false;
  courseDropdownOpen: boolean = false;
  className: string = '';
  classCode: string = '';
  selectedCourseId: string = '';
  selectedCourseTitle: string = '';  // Track selected course title
  selectedDays: string[] = [];
  days: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  startTime: string = '09:00';  // Default start time
  endTime: string = '17:00';    // Default end time

  courses: { created_by: string; id: string; title: string }[] = [];

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    this.loadCourses();
  }

  async loadCourses() {
    try {
      const user = await this.supabaseService.getUserProfile();
      if (user) {
        this.courses = await this.supabaseService.getCourses();
        this.courses = this.courses.filter(course => course.created_by === user.profile_id);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  }

  onCourseSelect(course: any) {
    this.selectedCourseId = course.id;
    this.selectedCourseTitle = course.title;  // Set selected course title
    this.courseDropdownOpen = false;  // Close the dropdown after selection
  }

  onDayChange(day: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      if (!this.selectedDays.includes(day)) {
        this.selectedDays.push(day);
      }
    } else {
      this.selectedDays = this.selectedDays.filter(d => d !== day);
    }
  }

  async onSubmit() {
    console.log('Submitting form...');
    if (this.validateForm()) {
      const daySchedule = this.selectedDays.join(', ');

      try {
        await this.supabaseService.createClass({
          class_name: this.className,
          class_code: this.classCode,
          course_id: this.selectedCourseId,
          day_schedule: daySchedule,
          class_start_time: this.startTime,
          class_end_time: this.endTime,
          instructor: this.courses.find(course => course.id === this.selectedCourseId)?.created_by || '',
          created_by: this.courses.find(course => course.id === this.selectedCourseId)?.created_by || ''
        });

        console.log('Class created successfully!');
        this.classCreated.emit();  // Notify parent component to refresh the list
        this.closeModal.emit();  // Close the modal
      } catch (error) {
        console.error('Failed to create class:', error);
      }
    } else {
      console.error('Form is invalid. Please fill out all required fields.');
    }
  }

  onCancel() {
    this.closeModal.emit();  // Emit the close event to parent component
  }

  validateForm() {
    const isValid = this.className && this.classCode && this.selectedCourseId && this.startTime && this.endTime;
    if (!isValid) {
      console.warn('Validation failed. Some fields are empty.');
    }
    return isValid;
  }
}
