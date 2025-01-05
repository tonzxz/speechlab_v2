import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ClickOutsideDirective } from '../../../../../shared/directives/click-outside.directive';
import { trigger, transition, style, animate } from '@angular/animations';
import { ManageCourseService, ModalState } from '../../../../../../app-services/manage-course/manage-course.service';
import { SupabaseService } from '../../../../../supabase.service'; 

@Component({
  selector: 'app-course-preview',
  standalone: true,
  imports: [CommonModule, RouterModule, ClickOutsideDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './course-preview.component.html',
  styleUrl: './course-preview.component.css',
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('200ms', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class CoursePreviewComponent implements OnInit {
  lessonId: { [key: string]: boolean } = {};
  requiredSurvey: boolean = false;
  courseData: any = null; 
  lessons: any[] = [];
  certificateList = [
    { id: 1, title: 'Certificate 1', src: 'assets/images/manage-courses/certificate.png' },
  ];

  constructor(
    private manageCourse: ManageCourseService,
    private route: ActivatedRoute,
    private supabaseService: SupabaseService 
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const courseId = params.get('course_id');
      if (courseId) {
        this.fetchCourseWithLessons(courseId); 
      }
    });
  }
  
  async fetchCourseWithLessons(courseId: string) {
    try {
      const courseWithDetails = await this.supabaseService.getMyCoursesLessonsAsTeacher(courseId);
      if (courseWithDetails) {
        this.courseData = courseWithDetails;
        this.lessons = courseWithDetails.lessons.map((lesson: { attachments: any; }) => ({
          ...lesson,
          attachments: this.formatAttachments(lesson.attachments), // Format attachments to ensure they are an array
        }));
      } else {
        console.warn('No course found with ID:', courseId);
      }
    } catch (error) {
      console.error('Error fetching course and lesson content:', error);
    }
  }
  

  getAttachmentType(attachment: string): string {
    const fileExtension = attachment.split('.').pop()?.toLowerCase();
    if (!fileExtension) return 'unknown';

    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) return 'image';
    if (['pdf'].includes(fileExtension)) return 'pdf';
    if (['mp4', 'webm', 'ogg'].includes(fileExtension)) return 'video';
    return 'other';
  }

  formatAttachments(attachments: any): string[] {
    if (!attachments) return [];
    // If attachments is a single string, convert it to an array
    if (typeof attachments === 'string') {
      return [attachments];
    }
    // If attachments is already an array, return it directly
    return attachments;
  }
  

  openAttachment(attachment: string): void {
    window.open(attachment, '_blank');
  }
  

  openLesson(item: any) {
    this.lessonId[item] = !this.lessonId[item];
  }

  closeLesson() {
    this.lessonId = {};
  }
  
  getFileNameFromUrl(url: string): string {
    return url.split('/').pop() || 'Unknown File';
  }
  

  toggleRequiredSurvey() {
    this.requiredSurvey = !this.requiredSurvey;
  }

  openCertificateModal() {
    this.manageCourse.toggleSettings(ModalState.Certificate);
  }

  openSurveyModal() {
    this.manageCourse.toggleSettings(ModalState.Survey);
  }
}
