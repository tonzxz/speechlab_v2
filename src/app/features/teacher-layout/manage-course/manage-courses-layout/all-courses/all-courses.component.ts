import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { ManageCourseService, ModalState } from '../../../../../../app-services/manage-course/manage-course.service';
import { ClickOutsideDirective } from '../../../../../shared/directives/click-outside.directive';
import { SupabaseService } from '../../../../../supabase.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-all-courses',
  standalone: true,
  imports: [RouterModule, ClickOutsideDirective, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './all-courses.component.html',
  styleUrls: ['./all-courses.component.css'],
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
export class AllCoursesComponent implements OnInit, OnDestroy {
  arrayList: any[] = [];
  dropDown: { [key: string]: boolean } = {};
  private courseSubscription!: Subscription; 
  currentModal: ModalState = ModalState.None;
  ModalState = ModalState; 
  courseToDelete: string = ''; 

  constructor(
    private router: Router,
    private manageCourseService: ManageCourseService,
    private supabaseService: SupabaseService 
  ) {}

  ngOnInit(): void {
    this.fetchTeacherCourses();
    this.subscribeToCourseChanges(); 
  }

  ngOnDestroy(): void {
    if (this.courseSubscription) {
      this.courseSubscription.unsubscribe(); 
    }
  }

  async fetchTeacherCourses() {
    try {
      console.log('Fetching teacher courses...');
      this.arrayList = await this.supabaseService.getTeacherCoursesWithRatings();
      console.log('Fetched courses:', this.arrayList); 
    } catch (error) {
      console.error('Error fetching teacher courses:', error);
    }
  }

  subscribeToCourseChanges() {
    this.supabaseService.subscribeToCoursesChanges((updatedCourses) => {
      this.arrayList = updatedCourses; 
    }).then(subscription => {
      this.courseSubscription = subscription;
    }).catch(error => {
      console.error('Error subscribing to course changes:', error);
    });
  }

  editCreateModal(item: any) {
    this.manageCourseService.setCurrentCourse(item);
    this.manageCourseService.toggleSettings(ModalState.CreateCourse);
  }

  openDeleteModal(courseId: string) {
    this.courseToDelete = courseId;
    this.currentModal = ModalState.DeleteCourseConfirmation; 
  }

  closeDeleteModal() {
    this.currentModal = ModalState.None; 
  }

  async confirmDeleteCourse() {
    try {
      await this.supabaseService.deleteCourse(this.courseToDelete); 
      this.closeDeleteModal(); 
      this.fetchTeacherCourses(); 
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  }

  toggleDropdown(id: string) {
    this.dropDown[id] = !this.dropDown[id];
  }

  closeDropdown(id: string) {
    this.dropDown[id] = false;
  }

  trackById(index: number, item: any): string {
    return item.course_id;
  }
}
