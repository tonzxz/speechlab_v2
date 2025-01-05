import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, Output, EventEmitter } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-course-detail-modal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './course-detail-modal.component.html',
  styleUrls: ['./course-detail-modal.component.css']
})
export class CourseDetailModalComponent {
  @Input() course: any;  // Ensure that the course contains the instructorName now
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }

  get instructorName(): string {
    // The course object now directly contains instructorName from the getCoursesWithRatings function
    return this.course?.instructorName || 'Unknown Instructor';
  }

  get rating(): number {
    return this.course?.rating || 0;
  }

  get ratingsCount(): number {
    return this.course?.ratingsCount || 0;
  }

  get skillLevel(): string {
    return this.course?.skill_level || 'Not Specified';
  }

  get language(): string {
    return this.course?.language || 'Not Specified';
  }

  get lessonsCount(): number {
    return this.course?.lessonsCount || 0; // New property
  }
}
