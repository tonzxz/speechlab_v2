import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../../../supabase.service';

@Component({
  selector: 'app-class-work-assignment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './class-work-assignment.component.html',
  styleUrls: ['./class-work-assignment.component.css']
})
export class ClassWorkAssignmentComponent implements OnInit {
  @Input() taskId: string | null = null;
  @Input() lessonId: string | null = null;
  @Input() courseId: string | null = null;
  @Output() closeModal = new EventEmitter<void>();

  classworkForm: FormGroup;
  isSubmitting = false;
  alertMessage: { type: 'success' | 'error', message: string } | null = null;
  lessons: any[] = [];
  currentUser: any = null;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService
  ) {
    this.classworkForm = this.fb.group({
      lesson_id: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.maxLength(255)]],
      content: ['', [Validators.required]],
      attachment: [''],
      due_date_and_time: ['', [Validators.required]],
      points: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  async ngOnInit() {
    await this.getCurrentUser();
    this.loadLessonsAndTask();
  }

  async getCurrentUser() {
    const userClasses = await this.supabaseService.getUserClasses();
    if (userClasses) {
      this.currentUser = userClasses.user;
    }
  }

  async loadLessonsAndTask() {
    if (this.courseId) {
      try {
        const { data, error } = await this.supabaseService.getClassworkByLessonsId(this.courseId);
        if (error) throw error;
        if (data) {
          this.lessons = data.map(lesson => ({
            lesson_id: lesson.lesson_id,
            lesson_title: lesson.lesson_title
          }));

          if (this.lessons.length > 0 && !this.lessonId) {
            this.classworkForm.patchValue({ lesson_id: this.lessons[0].lesson_id });
          }

          if (this.taskId) {
            const task = data.flatMap(lesson => lesson.tasks).find(task => task.task_id === this.taskId);
            if (task) {
              this.classworkForm.patchValue({
                lesson_id: task.lesson_id,
                description: task.description,
                content: task.content,
                attachment: task.attachment,
                due_date_and_time: task.due_date_and_time,
                points: task.points
              });
            }
          }
        }
      } catch (error) {
        console.error('Error loading lessons and task data:', error);
        this.showAlert('error', 'Failed to load data. Please try again.');
      }
    }
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    console.log('File selected:', this.selectedFile?.name);
  }

  async uploadAttachment(): Promise<string | null> {
    if (!this.selectedFile) return null;

    const fileName = `${Date.now()}_${this.selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const filePath = fileName;

    try {
      console.log('Uploading file:', filePath);
      const publicUrl = await this.supabaseService.uploadFile(
        this.selectedFile,
        filePath,
        'task_attachments'
      );
      console.log('Upload successful, public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      this.showAlert('error', `Failed to upload attachment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  // async uploadAttachment(): Promise<string | null> {
  //   if (!this.selectedFile) return null;

  //   const formData = this.classworkForm.value;
  //   const lessonId = formData.lesson_id;
  //   const taskId = this.taskId || 'new_task'; // Use 'new_task' for new tasks
  //   const fileName = `${Date.now()}_${this.selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    
  //   // Create a folder structure: lesson/task/attachments/file
  //   const filePath = `${lessonId}/${taskId}/attachments/${fileName}`;

  //   try {
  //     console.log('Uploading file:', filePath);
  //     const publicUrl = await this.supabaseService.uploadFile(
  //       this.selectedFile,
  //       filePath,
  //       'task_attachments'
  //     );
  //     console.log('Upload successful, public URL:', publicUrl);
  //     return publicUrl;
  //   } catch (error) {
  //     console.error('Error uploading file:', error);
  //     this.showAlert('error', `Failed to upload attachment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  //     return null;
  //   }
  // }

  async saveClasswork() {
    if (this.classworkForm.invalid) {
      this.markFormGroupTouched(this.classworkForm);
      return;
    }

    this.isSubmitting = true;
    this.alertMessage = null;

    try {
      const formData = this.classworkForm.value;
      let attachmentUrl = formData.attachment;

      if (this.selectedFile) {
        attachmentUrl = await this.uploadAttachment();
        if (!attachmentUrl) {
          this.isSubmitting = false;
          return; // Exit if file upload failed
        }
      }

      const classworkData = {
        lesson_id: formData.lesson_id,
        description: formData.description,
        content: formData.content,
        attachment: attachmentUrl,
        due_date_and_time: formData.due_date_and_time,
        points: formData.points,
        created_by: this.currentUser?.profile_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      let result;
      if (this.taskId) {
        result = await this.supabaseService.editClasswork(this.taskId, classworkData);
      } else {
        result = await this.supabaseService.createClasswork(classworkData);
      }

      if (result.error) throw result.error;

      this.showAlert('success', 'Classwork saved successfully!');
      setTimeout(() => this.close(), 2000); // Close after 2 seconds
    } catch (error) {
      console.error('Error saving classwork:', error);
      this.showAlert('error', 'Failed to save classwork. Please try again.');
    } finally {
      this.isSubmitting = false;
    }
  }

  // async saveClasswork() {
  //   if (this.classworkForm.invalid) {
  //     this.markFormGroupTouched(this.classworkForm);
  //     return;
  //   }

  //   this.isSubmitting = true;
  //   this.alertMessage = null;

  //   try {
  //     const formData = this.classworkForm.value;
  //     let attachmentUrl = formData.attachment;

  //     if (this.selectedFile) {
  //       attachmentUrl = await this.uploadAttachment();
  //       if (!attachmentUrl) {
  //         this.isSubmitting = false;
  //         return; // Exit if file upload failed
  //       }
  //     }

  //     const classworkData = {
  //       lesson_id: formData.lesson_id,
  //       description: formData.description,
  //       content: formData.content,
  //       attachment: attachmentUrl,
  //       due_date_and_time: formData.due_date_and_time,
  //       points: formData.points,
  //       created_by: this.currentUser?.profile_id,
  //       created_at: new Date().toISOString(),
  //       updated_at: new Date().toISOString()
  //     };

  //     let result;
  //     if (this.taskId) {
  //       result = await this.supabaseService.editClasswork(this.taskId, classworkData);
  //     } else {
  //       result = await this.supabaseService.createClasswork(classworkData);
  //       // If it's a new task, update the attachment URL with the new task ID
  //       if (result.data && result.data[0] && attachmentUrl) {
  //         const newTaskId = result.data[0].task_id;
  //         const updatedAttachmentUrl = attachmentUrl.replace('/new_task/', `/${newTaskId}/`);
  //         await this.supabaseService.editClasswork(newTaskId, { attachment: updatedAttachmentUrl });
  //       }
  //     }

  //     if (result.error) throw result.error;

  //     this.showAlert('success', 'Classwork saved successfully!');
  //     setTimeout(() => this.close(), 2000); // Close after 2 seconds
  //   } catch (error) {
  //     console.error('Error saving classwork:', error);
  //     this.showAlert('error', 'Failed to save classwork. Please try again.');
  //   } finally {
  //     this.isSubmitting = false;
  //   }
  // }



  showAlert(type: 'success' | 'error', message: string) {
    this.alertMessage = { type, message };
    setTimeout(() => this.alertMessage = null, 5000); // Clear after 5 seconds
  }

  close() {
    this.closeModal.emit();
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}