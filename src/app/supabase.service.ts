import { Injectable } from '@angular/core';
import {
  createClient,
  SupabaseClient,
  Session,
  AuthChangeEvent,
  User,
} from '@supabase/supabase-js';
import { environment } from '../environments/environment';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

interface Course {
  course_title: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  thumbnail: string;
  duration: number;
  language: string;
  required_survey: boolean;
  created_by: string;
}

interface Lesson {
  lesson_id?: string;
  lesson_title: string;
  description: string;
  objectives: string;
  attachments: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private sessionSubject = new BehaviorSubject<Session | null>(null);
  private userSubject = new BehaviorSubject<User | null>(null);

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
    this.initializeSession();
  }

  async getUserProfile(): Promise<{ first_name: string; last_name: string; profile_id: string; profile_image: string; } | null> {
    const user = this.userSubject.value;
    if (!user) {
      return null;
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .select('first_name, last_name, profile_id, profile_image')
      .eq('email', user.email)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  }

  private async initializeSession() {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();
    this.updateSessionAndUser(session);
    this.supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        this.updateSessionAndUser(session);
      }
    );
  }

  private updateSessionAndUser(session: Session | null) {
    this.sessionSubject.next(session);
    this.userSubject.next(session?.user ?? null);
  }

  getSession(): Observable<Session | null> {
    return this.sessionSubject.asObservable();
  }

  getUser(): Observable<User | null> {
    return this.userSubject.asObservable();
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('Error during sign in:', error);
      return { data: null, error };
    }
    if (data.session) {
      this.updateSessionAndUser(data.session);
    }
    return { data, error: null };
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      console.error('Error during sign out:', error);
      return { error };
    }
    this.updateSessionAndUser(null);
    return { error: null };
  }

  async getProfile(email: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('role')
      .eq('email', email)
      .single();
    if (error) {
      console.error('Error fetching profile:', error);
      return { data: null, error };
    }
    return { data, error: null };
  }

  async getData() {
    const { data, error } = await this.supabase.from('profiles').select('*');
    if (error) {
      console.error('Error fetching data:', error);
      return { data: null, error };
    }
    return { data, error: null };
  }

  isAuthenticated(): boolean {
    return this.sessionSubject.value !== null;
  }

  async refreshSession() {
    const { data, error } = await this.supabase.auth.refreshSession();
    if (error) {
      console.error('Error refreshing session:', error);
      return { session: null, error };
    }
    if (data.session) {
      this.updateSessionAndUser(data.session);
    }
    return { session: data.session, error: null };
  }

  async getProfileHeader(email: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('first_name, last_name, role, profile_image')
      .eq('email', email)
      .single();
    if (error) {
      console.error('Error fetching profile:', error);
      return { data: null, error };
    }
    return { data, error: null };
  }

  async createCourseAndLessons(course: Course, lessons: Lesson[]) {
    try {
      console.log('Creating course with data:', course); // Debugging log

      const { data: courseData, error: courseError } = await this.supabase
        .from('courses')
        .insert([course])
        .select();

      if (courseError) {
        console.error('Error creating course:', courseError);
        return { data: null, error: courseError };
      }

      console.log('Course created successfully:', courseData); // Debugging log

      const courseId = courseData[0].course_id;
      const lessonInserts = lessons.map((lesson) => ({
        ...lesson,
        course_id: courseId,
      }));

      console.log('Creating lessons with data:', lessonInserts); // Debugging log

      const { data: lessonsData, error: lessonsError } = await this.supabase
        .from('lessons')
        .insert(lessonInserts)
        .select();

      if (lessonsError) {
        console.error('Error creating lessons:', lessonsError);
        return { data: null, error: lessonsError };
      }

      console.log('Lessons created successfully:', lessonsData); // Debugging log

      return {
        data: { course: courseData[0], lessons: lessonsData },
        error: null,
      };
    } catch (error) {
      console.error('Unexpected error creating course and lessons:', error);
      return {
        data: null,
        error:
          error instanceof Error
            ? error
            : new Error('Unknown error creating course and lessons'),
      };
    }
  }

 
  async editCourseAndLessons(courseId: string, course: Course, lessons: Lesson[]) {
    try {
      console.log('Editing course with ID:', courseId);
  
      // Update the course information
      const { error: courseError } = await this.supabase
        .from('courses')
        .update(course)
        .eq('course_id', courseId);
  
      if (courseError) {
        console.error('Error updating course:', courseError);
        return { data: null, error: courseError };
      }
  
      // Fetch existing lessons for the course
      const { data: existingLessons, error: fetchError } = await this.supabase
        .from('lessons')
        .select('lesson_id')
        .eq('course_id', courseId);
  
      if (fetchError) {
        console.error('Error fetching existing lessons:', fetchError);
        return { data: null, error: fetchError };
      }
  
      // Prepare lesson updates
      const lessonUpdates = lessons.map((lesson, index) => {
        const existingLesson = existingLessons?.find(el => el.lesson_id === lesson.lesson_id);
  
        if (existingLesson) {
          // Update existing lesson
          return {
            ...lesson,
            course_id: courseId,
            lesson_id: existingLesson.lesson_id, // Keep the existing lesson ID
          };
        } else {
          // Insert new lesson
          return {
            ...lesson,
            course_id: courseId,
            lesson_id: null, // New lesson (no existing ID)
          };
        }
      });
  
      // Update existing lessons
      for (const lesson of lessonUpdates) {
        if (lesson.lesson_id) {
          const { error: updateLessonError } = await this.supabase
            .from('lessons')
            .update(lesson)
            .eq('lesson_id', lesson.lesson_id);
          if (updateLessonError) {
            console.error('Error updating lesson:', updateLessonError);
            return { data: null, error: updateLessonError };
          }
        } else {
          // Insert new lesson
          const { error: insertLessonError } = await this.supabase
            .from('lessons')
            .insert({ ...lesson, lesson_id: undefined }); // Remove `lesson_id` to let the database generate a new one
          if (insertLessonError) {
            console.error('Error inserting new lesson:', insertLessonError);
            return { data: null, error: insertLessonError };
          }
        }
      }
  
      console.log('Course and lessons updated successfully.');
      return { data: true, error: null };
    } catch (error) {
      console.error('Unexpected error editing course and lessons:', error);
      return {
        data: null,
        error:
          error instanceof Error
            ? error
            : new Error('Unknown error editing course and lessons'),
      };
    }
  }
  
  
  
  async uploadFile(
    file: File,
    path: string,
    bucket: 'thumbnail' | 'lesson_attachments' | 'task_attachments'
  ): Promise<string> {
    const user = this.userSubject.value; 
    if (!user) {
      throw new Error('User is not authenticated.');
    }
  
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });
  
      if (error) throw error;
  
      if (!data?.path) {
        throw new Error('File upload failed. No data returned.');
      }
  
      const { data: publicData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
  
      if (!publicData?.publicUrl) {
        throw new Error('Failed to generate public URL for the uploaded file.');
      }
  
      return publicData.publicUrl;
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
  }
  
  async getCoursesWithRatings() {
    const { data: courses, error: coursesError } = await this.supabase
      .from('courses')
      .select(`*, profiles!courses_created_by_fkey (first_name, last_name, profile_image)`);
  
    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
      return [];
    }
  
    const { data: lessons, error: lessonsError } = await this.supabase
      .from('lessons')
      .select('course_id');
  
    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
      return [];
    }
  
    const { data: ratings, error: ratingsError } = await this.supabase
      .from('course_ratings')
      .select('course_id, rating');
  
    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError);
      return [];
    }
  
    const courseRatingsMap = new Map<string, { total: number; count: number }>();
  
    for (const { course_id, rating } of ratings) {
      if (!courseRatingsMap.has(course_id)) {
        courseRatingsMap.set(course_id, { total: 0, count: 0 });
      }
      const courseRating = courseRatingsMap.get(course_id)!;
      courseRating.total += rating;
      courseRating.count += 1;
    }
  
    const lessonCountsMap = new Map<string, number>();
  
    for (const { course_id } of lessons) {
      if (!lessonCountsMap.has(course_id)) {
        lessonCountsMap.set(course_id, 0);
      }
      const count = lessonCountsMap.get(course_id)!;
      lessonCountsMap.set(course_id, count + 1);
    }
  
    const coursesWithRatings = courses.map(course => {
      const ratingInfo = courseRatingsMap.get(course.course_id);
      const lessonsCount = lessonCountsMap.get(course.course_id) || 0;
      return {
        ...course,
        rating: ratingInfo ? ratingInfo.total / ratingInfo.count : 0,
        ratingsCount: ratingInfo ? ratingInfo.count : 0,
        instructorName: course.profiles ? `${course.profiles.first_name} ${course.profiles.last_name}` : 'Unknown Instructor',
        lessonsCount: lessonsCount,
      };
    });
  
    return coursesWithRatings;
  }
  

  

  async getTeacherCoursesWithRatings() {
    const user = this.userSubject.value;
    if (!user) {
      return [];
    }
  
    try {
      const { data: coursesData, error: coursesError } = await this.supabase
        .from('courses')
        .select(`
          course_id,
          course_title,
          skill_level,
          language,
          thumbnail,
          created_by,
          profiles!courses_created_by_fkey (first_name, last_name, profile_image),
          lessons (lesson_id),
          course_ratings (rating)
        `)
        .eq('created_by', user.id);
  
      if (coursesError) {
        console.error('Error fetching teacher courses:', coursesError);
        return [];
      }
  
      const coursesWithRatings = coursesData.map((course: any) => {
        const lessonsCount = course.lessons.length;
        const totalRating = course.course_ratings.reduce((acc: number, curr: { rating: number }) => acc + curr.rating, 0);
        const averageRating = course.course_ratings.length > 0 ? totalRating / course.course_ratings.length : 0;
  
        return {
          ...course,
          rating: averageRating,
          ratingsCount: course.course_ratings.length,
          lessonsCount: lessonsCount,
          instructorName: course.profiles ? `${course.profiles.first_name} ${course.profiles.last_name}` : 'Unknown Instructor',
          instructorProfile: course.profiles?.profile_image || '',
        };
      });
  
      return coursesWithRatings;
    } catch (error) {
      console.error('Error fetching courses with ratings:', error);
      return [];
    }
  }
  


// for admin side 
async getStudentCount() {
  const { data, error } = await this.supabase
    .from('profiles')
    .select('profile_id')
    .eq('role', 'student');
  return data?.length || 0;
}

// Fetch teacher count
async getTeacherCount() {
  const { data, error } = await this.supabase
    .from('profiles')
    .select('profile_id')
    .eq('role', 'teacher');
  return data?.length || 0;
}

// Fetch class count
async getClassCount() {
  const { data, error } = await this.supabase
    .from('classes')
    .select('class_code');
  return data?.length || 0;
}

// Fetch new enrollees count
async getEnrolleeCount() {
  const { data, error } = await this.supabase
    .from('enrollments')
    .select('enrollment_id');
  return data?.length || 0;
}

// user management
getClient(): SupabaseClient {
  return this.supabase;
}

// class management
async getClasses(courseIdFilter?: string) {
  const query = this.supabase.from('classes').select('*');

  if (courseIdFilter) {
    query.eq('course_id', courseIdFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching classes:', error);
    return [];
  }
  return data;
}

async getCourses() {
  const { data, error } = await this.supabase
    .from('courses')
    .select('course_id, course_title, created_by');

  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }

  // Transform data to a simpler format
  return data.map(course => ({
    id: course.course_id,
    title: course.course_title,
    created_by: course.created_by 

  }));
  
}

async deleteClass(classId: string): Promise<void> {
  const { error } = await this.supabase
    .from('classes')
    .delete()
    .eq('class_id', classId);  // Assuming 'class_id' is the primary key

  if (error) {
    console.error('Error deleting class:', error);
    throw error;
  }
}

async updateClass(classId: string, updatedData: any): Promise<void> {
  const { error } = await this.supabase
    .from('classes')
    .update(updatedData)
    .eq('class_id', classId);

  if (error) {
    console.error('Error updating class:', error);
    throw error;
  }
}

async createClass(classData: {
  class_name: string;
  class_code: string;
  course_id: string;
  day_schedule: string;
  class_start_time: string;
  class_end_time: string;
  instructor: string; 
  created_by: string;

}): Promise<void> {
  const { error } = await this.supabase
    .from('classes')
    .insert([classData]);

  if (error) {
    console.error('Error creating class:', error);
    throw error;
  }
}



async deleteCourse(courseId: string): Promise<void> {
  try {
    // Delete lessons associated with the course
    const { error: lessonsError } = await this.supabase
      .from('lessons')
      .delete()
      .eq('course_id', courseId);  // Assuming 'course_id' is the foreign key in 'lessons' table

    if (lessonsError) {
      console.error('Error deleting lessons for the course:', lessonsError);
      throw lessonsError;
    }

    // Delete the course
    const { error: courseError } = await this.supabase
      .from('courses')
      .delete()
      .eq('course_id', courseId);  // Assuming 'course_id' is the primary key in 'courses' table

    if (courseError) {
      console.error('Error deleting course:', courseError);
      throw courseError;
    }

    console.log(`Course with ID ${courseId} and its associated lessons were deleted successfully.`);
  } catch (error) {
    console.error('Error in deleting course and lessons:', error);
    throw error;
  }
}

async subscribeToCoursesChanges(callback: (courses: any[]) => void): Promise<Subscription> {
  const channel = this.supabase
    .channel('courses-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'courses' },
      (payload) => {
        console.log('Change received!', payload);
        this.getTeacherCoursesWithRatings().then(callback); // Fetch updated courses
      }
    )
    .subscribe();

  // Create an RxJS subscription and handle cleanup
  const rxjsSubscription = new Subscription(() => {
    channel.unsubscribe(); // Unsubscribe from the Supabase channel
  });

  return rxjsSubscription;
}

async getMyCoursesLessonsAsTeacher(course_id: string) {
  // Get the logged-in user's information
  const user = this.userSubject.value;
  if (!user) {
    console.error('No user logged in');
    return null;
  }

  try {
    // Fetch course details including instructor details
    const { data: course, error: courseError } = await this.supabase
      .from('courses')
      .select(`*, profiles!courses_created_by_fkey (first_name, last_name, profile_image)`)
      .eq('course_id', course_id)
      .single(); // Fetch a single course

    if (courseError) {
      console.error('Error fetching course details:', courseError);
      return null;
    }

    if (!course) {
      console.warn(`No course found with course_id: ${course_id}`);
      return null;
    }

    console.log('Course Data:', course); // Log the course data

    // Fetch lessons associated with the course
    const { data: lessons, error: lessonsError } = await this.supabase
      .from('lessons')
      .select('*')
      .eq('course_id', course_id);

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
      return null;
    }

    console.log('Lessons Data:', lessons); // Log the lessons data

    // Fetch ratings for the course
    const { data: ratings, error: ratingsError } = await this.supabase
      .from('course_ratings')
      .select('rating')
      .eq('course_id', course_id);

    if (ratingsError) {
      console.error('Error fetching course ratings:', ratingsError);
      return null;
    }

    console.log('Ratings Data:', ratings); // Log the ratings data

    // Compute average rating
    const totalRatings = ratings.reduce((total, { rating }) => total + rating, 0);
    const averageRating = ratings.length > 0 ? totalRatings / ratings.length : 0;

    // Map course data with ratings, lessons, and instructor details
    const courseWithDetails = {
      ...course,
      rating: averageRating,
      ratingsCount: ratings.length,
      instructorName: course.profiles
        ? `${course.profiles.first_name} ${course.profiles.last_name}`
        : 'Unknown Instructor',
      instructorProfile: course.profiles?.profile_image || '',
      lessons: lessons || []
    };

    console.log('Course With Details:', courseWithDetails); // Log the combined course details

    return courseWithDetails;
  } catch (error) {
    console.error('Error fetching course and lesson content:', error);
    return null;
  }
}


async getUserClasses(): Promise<{ user: any, classes: any[] } | null> {
  try {
    const currentUser = this.userSubject.value;

    if (!currentUser) {
      return null;
    }

    const { data: userProfile, error: userError } = await this.supabase
      .from('profiles')
      .select('profile_id')
      .eq('email', currentUser.email) 
      .single();  

    if (userError) {
      console.error('Error fetching user profile:', userError);
      return null;
    }

    const user = userProfile;

    const { data: classesData, error: classesError } = await this.supabase
      .from('classes')
      .select('*')
      .eq('instructor', user.profile_id);  

    if (classesError) {
      console.error('Error fetching classes for user:', classesError);
      return null;
    }

    return { user, classes: classesData };
  } catch (error) {
    console.error('Error fetching user classes:', error);
    return null;
  }
}

subscribeToClassChanges(callback: (newClass: any) => void): Subscription {
  const channel = this.supabase
    .channel('classes-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'classes' },
      (payload) => {
        console.log('Change received!', payload);
        callback(payload.new);
      }
    )
    .subscribe();

  // Create an RxJS subscription and handle cleanup
  const rxjsSubscription = new Subscription(() => {
    channel.unsubscribe(); // Unsubscribe from the Supabase channel
  });

  return rxjsSubscription;
}




async getClassworkByLessonsId(courseId: string) {
  try {
    // Step 1: Fetch lessons associated with the course
    const { data: lessons, error: lessonsError } = await this.supabase
      .from('lessons')
      .select('lesson_id, lesson_title')
      .eq('course_id', courseId);

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
      return { data: null, error: lessonsError };
    }

    if (!lessons || lessons.length === 0) {
      console.warn('No lessons found for this course.');
      return { data: [], error: null };
    }

    // Step 2: Fetch tasks associated with the lessons
    const lessonIds = lessons.map(lesson => lesson.lesson_id);

    const { data: tasks, error: tasksError } = await this.supabase
      .from('tasks')
      .select(`
        *,
        profiles:created_by (first_name, last_name)
      `)
      .in('lesson_id', lessonIds);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return { data: null, error: tasksError };
    }

    // Step 3: Organize tasks under their respective lessons and format created_by
    const lessonsWithTasks = lessons.map(lesson => ({
      ...lesson,
      tasks: tasks
        .filter(task => task.lesson_id === lesson.lesson_id)
        .map(task => ({
          ...task,
          created_by: `${task.profiles.first_name} ${task.profiles.last_name}`.trim()
        }))
    }));

    return { data: lessonsWithTasks, error: null };
  } catch (error) {
    console.error('Unexpected error fetching classwork by lessons:', error);
    return { data: null, error };
  }
}


async createClasswork(classworkData: any) {
  const { data, error } = await this.supabase
    .from('tasks')
    .insert([classworkData])
    .select();

  if (error) {
    console.error('Error creating classwork:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

async editClasswork(taskId: string, classworkData: any) {
  const { data, error } = await this.supabase
    .from('tasks')
    .update(classworkData)
    .eq('task_id', taskId)
    .select();

  if (error) {
    console.error('Error editing classwork:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

async getDownloadUrl(filePath: string): Promise<{ data: { signedUrl: string } | null, error: any }> {
  try {
    console.log('Getting download URL for:', filePath);
    const { data, error } = await this.supabase.storage
      .from('task_attachments')
      .createSignedUrl(filePath, 60); // URL expires in 60 seconds

    if (error) throw error;

    return { data: { signedUrl: data.signedUrl }, error: null };
  } catch (error) {
    console.error('Error getting download URL:', error);
    return { data: null, error };
  }
}


async createQuiz(quizData: any, questions: any[]): Promise<{ data: any, error: any }> {
  try {
    // Start a Supabase transaction
    const { data, error } = await this.supabase.rpc('create_quiz_with_contents', {
      quiz_data: {
        quiz_title: quizData.title,
        description: quizData.description,
        time_limit: quizData.timeLimit,
        deadline: quizData.deadline,
        course_id: quizData.courseId,
        randomize_question: quizData.randomizeQuestion,
        allow_backtracking: quizData.allowBacktracking,
        allow_review_after_submission: quizData.allowReviewAfterSubmission,
        created_by: quizData.createdBy
      },
      questions_data: questions.map(q => ({
        question: q.text,
        option: q.options.filter((o: { text: string }) => o.text.trim() !== '').map((o: { text: any; }) => o.text),
        choice: q.options.filter((o: { isCorrect: boolean; text: string }) => o.isCorrect && o.text.trim() !== '').map((o: { text: any; }) => o.text),
        answer: q.mode === 'truefalse' ? (q.correctAnswer ? 'True' : 'False') : 
                (q.mode === 'enumeration' ? q.correctAnswer : null)
      }))
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating quiz:', error);
    return { data: null, error };
  }
}

}
