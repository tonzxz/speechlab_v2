import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ManageClassService, ModalState } from '../../../../../../app-services/manage-class/manage-class.service';
import { SupabaseService } from '../../../../../supabase.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DeleteClassComponent } from "../../../../modal/manage-class/delete-class/delete-class.component";
import { ClassworkViewTaskComponent } from '../../../../modal/manage-class/classwork-view-task/classwork-view-task.component';
import { ClassWorkAssignmentComponent } from '../../../../modal/manage-class/class-work-assignment/class-work-assignment.component';
import { ClassWorkQuizComponent } from '../../../../modal/manage-class/class-work-quiz/class-work-quiz.component';
import { ClickOutsideDirective } from '../../../../../shared/directives/click-outside.directive';

@Component({
  selector: 'app-manage-class-classwork',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DeleteClassComponent,
    ClassworkViewTaskComponent,
    ClassWorkAssignmentComponent,
    ClassWorkQuizComponent,
    ClickOutsideDirective
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './manage-class-classwork.component.html',
  styleUrls: ['./manage-class-classwork.component.css'],
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
export class ManageClassClassworkComponent implements OnInit, OnDestroy {
  public ModalState = ModalState;
  currentModal: ModalState = ModalState.None;
  private subscription!: Subscription;
  selectedTaskId: string | null = null;
  courseId: string | null = null;
  classWork: any[] = [];
  filteredClassWork: any[] = [];
  selectedLessonId: string = 'all';
  dropDown: any | null = null;
  taskType: string = '';
  selectedTask: any = null;
  isViewingTask: boolean = false;
  viewedTask: any = null;

  constructor(
    private route: ActivatedRoute,
    private manageClassService: ManageClassService,
    private supabaseService: SupabaseService
  ) {}

  ngOnInit(): void {
    this.subscription = this.route.params.subscribe((params: any) => {
      this.courseId = params['course_id'];
      this.getClasswork();
    });

    this.subscription.add(
      this.manageClassService.settings$.subscribe((state: ModalState) => {
        this.currentModal = state;
      })
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  async getClasswork() {
    if (this.courseId) {
      try {
        const { data, error } = await this.supabaseService.getClassworkByLessonsId(this.courseId);
        if (error) {
          console.error('Error fetching classwork:', error);
        } else if (data && data.length > 0) {
          this.classWork = data.map((lesson: any) => ({
            ...lesson,
            tasks: Array.isArray(lesson.tasks) ? lesson.tasks.sort((a: any, b: any) => a.created_at.localeCompare(b.created_at)) : []
          }));
          this.filteredClassWork = this.classWork;
        } else {
          this.classWork = [];
          this.filteredClassWork = [];
        }
      } catch (error) {
        console.error('Error fetching classwork:', error);
      }
    }
  }

  onLessonChange() {
    if (this.selectedLessonId === 'all') {
      this.filteredClassWork = this.classWork;
    } else {
      this.filteredClassWork = this.classWork.filter(lesson => lesson.lesson_id === this.selectedLessonId);
    }
  }

  showDropDown(id: any, event: Event) {
    event.preventDefault();
    this.dropDown = id;
  }

  closeDropDown() {
    this.dropDown = null;
  }

  openCreateTaskModal(taskType: string) {
    this.taskType = taskType;
    // Set currentLessonId to the selected lesson, or to the first lesson if 'all' is selected
    if (this.selectedLessonId === 'all') {
      this.currentLessonId = this.classWork.length > 0 ? this.classWork[0].lesson_id : null;
    } else {
      this.currentLessonId = this.selectedLessonId;
    }
    
    if (taskType === 'Quiz') {
      this.manageClassService.toggleSettings(ModalState.CreateQuiz);
    } else {
      this.manageClassService.toggleSettings(ModalState.CreateTask);
    }
  }

  currentLessonId: string | null = null;


  openTaskModal(task: any, actionId: number, event: Event) {
    event.preventDefault();
    this.selectedTaskId = task.task_id;
    this.selectedTask = task;
    this.currentLessonId = task.lesson_id;

    switch (actionId) {
      case 1: // Edit
        this.taskType = task.type;
        this.manageClassService.toggleSettings(ModalState.CreateTask);
        break;
      case 2: // View
        this.isViewingTask = true;
        this.viewedTask = task;
        break;
      case 3: // Delete
        this.manageClassService.toggleSettings(ModalState.Delete);
        break;
    }
  }

  closeTaskView() {
    this.isViewingTask = false;
    this.viewedTask = null;
  }

  closeTaskModal() {
    this.selectedTaskId = null;
    this.selectedTask = null;
    this.taskType = '';
    this.manageClassService.toggleSettings(ModalState.None);
  }

  dropDownList = [
    { id: 'assignment', name: 'Assignment' },
    { id: 'quiz', name: 'Quiz' },
    { id: 'evaluation', name: 'Evaluation' },
  ];

  actionList = [
    { id: 1, name: 'Edit' },
    { id: 2, name: 'View' },
    { id: 3, name: 'Delete' },
  ];
}