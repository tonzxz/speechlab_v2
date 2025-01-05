import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../../supabase.service';

@Component({
  selector: 'app-classwork-view-task',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './classwork-view-task.component.html',
  styleUrl: './classwork-view-task.component.css'
})
export class ClassworkViewTaskComponent implements OnInit {
  @Input() task: any;
  @Input() courseId: string | null = null;
  @Output() closeView = new EventEmitter<void>();

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    if (this.task && this.courseId) {
      this.loadTaskDetails();
    }
  }

  async loadTaskDetails() {
    if (!this.courseId) return;

    const { data, error } = await this.supabaseService.getClassworkByLessonsId(this.courseId);
    if (error) {
      console.error('Error loading task details:', error);
    } else if (data) {
      const allTasks = data.flatMap(lesson => lesson.tasks);
      const fullTaskDetails = allTasks.find(t => t.task_id === this.task.task_id);
      if (fullTaskDetails) {
        this.task = { ...this.task, ...fullTaskDetails };
      }
    }
  }

  close() {
    this.closeView.emit();
  }

  getFileName(url: string): string {
    if (!url) return '';
    const parts = url.split('/');
    return parts[parts.length - 1];
  }

  async downloadAttachment() {
    if (!this.task?.attachment) {
      console.error('No attachment URL available');
      return;
    }
  
    try {
      // Parse the full URL
      const url = new URL(this.task.attachment);
      
      // Extract the path after 'task_attachments/'
      const pathParts = url.pathname.split('/task_attachments/')[1].split('/');
      
      // Reconstruct the file path
      const filePath = pathParts.join('/');
  
      console.log('Attempting to download file:', filePath);
  
      // Get the download URL
      const { data, error } = await this.supabaseService.getDownloadUrl(filePath);
      
      if (error) throw error;
      if (!data || !data.signedUrl) throw new Error('Failed to get signed URL');
      
      // Trigger the download
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error downloading attachment:', error);
      // Show user-friendly error message
      // For example: this.showErrorMessage('Unable to download the attachment. Please try again later.');
    }
  }
}