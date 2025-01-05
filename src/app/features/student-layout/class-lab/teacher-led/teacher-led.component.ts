// teacher-led.component.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CourseDetailModalComponent } from '../../../modal/course-detail-modal/course-detail-modal.component';
import { SupabaseService } from '../../../../supabase.service';

interface Course {
profiles: any;
  title: string;
  imageUrl: string;
  skill_level: string;
  thumbnail: string;
  course_title: string;
  duration: number;
  rating: number;
  created_by: string;
  instructorName?: string;
  lessonsCount?: number; 
  instructorProfile?: string;
}

@Component({
  selector: 'app-teacher-led',
  standalone: true,
  imports: [CommonModule, RouterModule, CourseDetailModalComponent],
  templateUrl: './teacher-led.component.html',
  styleUrls: ['./teacher-led.component.css']
})
export class TeacherLedComponent implements OnInit {
  displayedCategories: Course[] = [];
  animationClass = '';
  isAnimating = false;

  difficulty: string[] = ['All courses', 'Beginner', 'Intermediate', 'Advanced'];
  selectedDifficulty: string = 'All courses';
  profiles: Course[] =[];
  courses: Course[] = [];
  displayedCourses: Course[] = [];
  arrayList: any[] = [];

  selectedCourse: Course | null = null;

  constructor(private cdr: ChangeDetectorRef, private supabaseService: SupabaseService) {}

  async ngOnInit() {
    // Fetch courses and ensure instructor name is correctly set
    this.courses = await this.supabaseService.getCoursesWithRatings();  
    this.arrayList = await this.supabaseService.getCoursesWithRatings();
    console.log('Fetched courses:', this.arrayList); // Log the fetched data
    // Map instructor details to course data
    this.courses = this.courses.map(course => ({
        ...course,
        instructorName: course.instructorName,
        instructorProfile: course.instructorProfile,
    }));

    this.filterCourses();

    // Get random courses to display
    this.displayedCategories = await this.getRandomCourses(3);
}


  async getRandomCourses(count: number): Promise<Course[]> {
    const shuffled = this.courses.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(course => ({
      ...course,
      title: course.course_title,
      imageUrl: course.thumbnail,
    }));
  }

  moveCourses(direction: 'prev' | 'next') {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.animationClass = direction === 'prev' ? 'slide-right' : 'slide-left';

    setTimeout(() => {
      if (direction === 'prev') {
        const lastItem = this.displayedCategories.pop()!;
        this.displayedCategories.unshift(lastItem);
      } else {
        const firstItem = this.displayedCategories.shift()!;
        this.displayedCategories.push(firstItem);
      }
      this.animationClass = '';
      this.isAnimating = false;
      this.cdr.detectChanges();
    }, 500);
  }

  filterCourses() {
    this.displayedCourses = this.selectedDifficulty === 'All courses'
      ? this.courses
      : this.courses.filter(course => course.skill_level === this.selectedDifficulty);
  }

  onDifficultyChange(newDifficulty: string) {
    this.selectedDifficulty = newDifficulty;
    this.filterCourses();
  }

  openModal(course: Course) {
    this.selectedCourse = course;
  }

  closeModal() {
    this.selectedCourse = null;
  }
}
