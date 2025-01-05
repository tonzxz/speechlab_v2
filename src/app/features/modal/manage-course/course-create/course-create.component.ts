import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SupabaseService } from '../../../../supabase.service';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManageCourseService } from '../../../../../app-services/manage-course/manage-course.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-course-create',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './course-create.component.html',
  styleUrls: ['./course-create.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CourseCreateComponent implements OnInit {
  @Output() closeModal = new EventEmitter<void>(); // Emit event to close modal

  courseTitle: string = '';
  skillLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  description: string = '';
  thumbnail: File | null = null;
  instructorID: string = '';
  thumbnailPreviewUrl: string | ArrayBuffer | null = null;
  lessonPreviews: (string | ArrayBuffer | null)[] = [];
  editingCourse: boolean = false; // To check if we are editing an existing course

  lessons: {
    lessonTitle: string;
    lessonDescription: string;
    lessonObjectives: string;
    file: File | null;
  }[] = [];

  constructor(private supabaseService: SupabaseService, private manageCourseService: ManageCourseService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.fetchInstructorID();
    this.initializeForm();
    this.lessonPreviews = this.lessons.map(() => null); // Initialize lesson previews
  }

  initializeForm(): void {
    const currentCourse = this.manageCourseService.getCurrentCourse();
    if (currentCourse) {
      this.editingCourse = true;
      this.courseTitle = currentCourse.course_title;
      this.skillLevel = currentCourse.skill_level;
      this.description = currentCourse.description;
      this.thumbnailPreviewUrl = currentCourse.thumbnail;
      this.lessons = currentCourse.lessons.map((lesson: any) => ({
        lessonTitle: lesson.lesson_title,
        lessonDescription: lesson.description,
        lessonObjectives: lesson.objectives,
        file: null,
      }));
    }
  }

  async fetchInstructorID() {
    try {
      const user = await this.supabaseService.getUserProfile();
      if (user) {
        this.instructorID = `${user.profile_id}`;
        console.log('Fetched Instructor Name:', this.instructorID);
      }
    } catch (error) {
      console.error('Error fetching instructor profile:', error);
    }
  }

  close(): void {
    console.log('Modal closed');
    this.closeModal.emit(); // Emit the closeModal event to parent component
    this.manageCourseService.resetCurrentCourse(); // Reset current course after closing the modal
  }

 

  // onLessonFileSelected(event: Event, index: number): void {
  //   const input = event.target as HTMLInputElement;
  //   if (input.files && input.files[0]) {
  //     const file = input.files[0];
  //     this.lessons[index].file = file;
  //     this.generatePreview(file, (result) => (this.lessonPreviews[index] = result));
  //   }
  // }

  onLessonFileSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.lessons[index].file = input.files[0];
    }
  }

 

  addLesson(): void {
    this.lessons.push({
      lessonTitle: '',
      lessonDescription: '',
      lessonObjectives: '',
      file: null,
    });
    this.lessonPreviews.push(null); // Ensure preview array stays in sync
  }

  saveDraft(): void {
    console.log('Course saved as draft.');
    // Add draft save logic here
  }

  async publishCourse(): Promise<void> {
    if (!this.courseTitle || !this.description || !this.skillLevel) {
      alert('Please fill out all course details.');
      return;
    }

    try {
      let thumbnailUrl = '';
      if (this.thumbnail) {
        thumbnailUrl = await this.supabaseService.uploadFile(
          this.thumbnail,
          `thumbnails/${this.courseTitle.replace(/\s+/g, '-').toLowerCase()}`,
          'thumbnail'
        );
      }

      const lessonData = this.lessons.map((lesson) => ({
        lesson_title: lesson.lessonTitle,
        description: lesson.lessonDescription,
        objectives: lesson.lessonObjectives,
        attachments: '',
      }));

      for (let i = 0; i < this.lessons.length; i++) {
        const lesson = this.lessons[i];
        if (lesson.file) {
          const attachmentUrl = await this.supabaseService.uploadFile(
            lesson.file,
            `attachments/${this.courseTitle.replace(/\s+/g, '-').toLowerCase()}/lesson_${i + 1}`,
            'lesson_attachments'
          );
          lessonData[i].attachments = attachmentUrl;
        }
      }

      if (this.editingCourse) {
        const currentCourse = this.manageCourseService.getCurrentCourse();
        const { error } = await this.supabaseService.editCourseAndLessons(
          currentCourse.course_id,
          {
            course_title: this.courseTitle,
            skill_level: this.skillLevel,
            description: this.description,
            thumbnail: thumbnailUrl, // Use public URL for thumbnail
            duration: 0,
            language: 'English',
            required_survey: false,
            created_by: this.instructorID, // Use fetched instructorID
          },
          lessonData
        );

        if (error) throw error;
        alert('Course and lessons updated successfully!');
      } else {
        const { error } = await this.supabaseService.createCourseAndLessons(
          {
            course_title: this.courseTitle,
            skill_level: this.skillLevel,
            description: this.description,
            thumbnail: thumbnailUrl, // Use public URL for thumbnail
            duration: 0,
            language: 'English',
            required_survey: false,
            created_by: this.instructorID, // Use fetched instructorID
          },
          lessonData
        );

        if (error) throw error;
        alert('Course and lessons published successfully!');
      }

      this.close(); // Close the modal after publishing or updating
    } catch (error) {
      console.error('Error creating or updating course and lessons:', error);
      alert('Failed to publish or update course and lessons.');
    }
  }

  isImageUrl(url: string | ArrayBuffer | null): url is string {
    return typeof url === 'string' && url.match(/\.(jpeg|jpg|gif|png)$/) !== null;
  }



  isImageFile(file: File | null): boolean {
    return file !== null && file.type.startsWith('image/');
  }

  getSafeUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getFileName(url: string | ArrayBuffer | null): string {
    if (typeof url === 'string') {
      return url.split('/').pop() || 'File';
    }
    return 'File';
  }

  removeFile(index: number): void {
    if (this.lessons[index]) {
      this.lessons[index].file = null;
    }
  }

  onThumbnailSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.type.startsWith('image/')) {
        this.thumbnail = file;
        this.generatePreview(this.thumbnail, (result) => {
          this.thumbnailPreviewUrl = result as string;
        });
      } else {
        alert('Please select an image file for the thumbnail.');
      }
    }
  }

  generatePreview(file: File, callback: (result: string | ArrayBuffer | null) => void): void {
    const reader = new FileReader();
    reader.onload = () => callback(reader.result);
    reader.readAsDataURL(file);
  }

  removeThumbnail(): void {
    this.thumbnail = null;
    this.thumbnailPreviewUrl = null;
  }



}
