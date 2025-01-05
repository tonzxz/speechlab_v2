import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { SupabaseService } from '../../../supabase.service';

interface User {
  id: string;
  name: string;
  dateCreated: Date;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'for approval';
  user_id: string;
}

@Component({
  selector: 'app-a-usermanagement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './a-usermanagement.component.html',
  styleUrls: ['./a-usermanagement.component.css']
})
export class AUsermanagementComponent implements OnInit {
  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();

  searchTerm = '';
  searchTerms$ = new BehaviorSubject<string>('');
  filteredUsers$: Observable<User[]> | undefined;

  isAddModalOpen = false;
  isEditModalOpen = false;
  newUser: Partial<User> = {};
  editingUser: User | null = null;

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    this.fetchUsers();

    this.filteredUsers$ = combineLatest([
      this.searchTerms$.pipe(startWith('')),
      this.users$
    ]).pipe(
      map(([searchTerm, users]) =>
        users.filter(user =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    );
  }

  async fetchUsers() {
    const { data, error } = await this.supabaseService.getClient()
      .from('profiles')
      .select(`
        profile_id,
        email,
        first_name,
        last_name,
        created_at,
        role,
        status,
        user_id
      `);

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    const users = data?.map((profile: any) => ({
      id: profile.profile_id,
      name: `${profile.first_name} ${profile.last_name}`,
      dateCreated: new Date(profile.created_at),
      email: profile.email,
      role: profile.role,
      status: profile.status === 'active' ? 'active' : 
              profile.status === 'inactive' ? 'inactive' : 'for approval',
      user_id: profile.user_id
    })) as User[] || [];

    this.usersSubject.next(users);
  }

  openAddModal() {
    this.isAddModalOpen = true;
    this.newUser = {
      dateCreated: new Date(),
      status: 'for approval'
    };
  }

  closeAddModal() {
    this.isAddModalOpen = false;
    this.newUser = {};
  }

  openEditModal(user: User) {
    this.isEditModalOpen = true;
    this.editingUser = { ...user };
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.editingUser = null;
  }

  async addNewUser() {
    if (this.newUser.name && this.newUser.email && this.newUser.role) {
      const [firstName, lastName] = (this.newUser.name as string).split(' ');
  
      const { data, error } = await this.supabaseService.getClient()
        .from('profiles')
        .insert({
          user_id: this.newUser.user_id,
          email: this.newUser.email,
          first_name: firstName,
          last_name: lastName,
          created_at: new Date(),
          role: this.newUser.role,
          status: this.newUser.status || 'For approval'
        });
  
      if (error) {
        console.error('Error adding user:', error);
        return;
      }
  
      this.fetchUsers(); 
      this.closeAddModal();
    } else {
      console.error('Please fill all required fields');
    }
  }
  

  async updateUser() {
    if (this.editingUser) {
      console.log('Updating user with data:', {
        id: this.editingUser.id,
        email: this.editingUser.email,
        role: this.editingUser.role,
        status: this.editingUser.status
      });
  
      const { error } = await this.supabaseService.getClient()
        .from('profiles')
        .update({
          email: this.editingUser.email,
          role: this.editingUser.role,
          status: this.editingUser.status
        })
        .match({ profile_id: this.editingUser.id });
  
      if (error) {
        console.error('Error updating user:', error.message, error.details, error.hint);
      } else {
        console.log('User updated successfully');
        this.fetchUsers();
        this.closeEditModal();
      }
    }
  }
  

  async deleteUser(user: User) {
    console.log('Attempting to delete user with profile_id:', user.id);
  
    const { error } = await this.supabaseService.getClient()
      .from('profiles')
      .delete()
      .match({ profile_id: user.id });
  
    if (error) {
      console.error('Error deleting user:', error);
    } else {
      console.log('Delete request sent successfully. Verifying deletion...');
  
      const { data, error: fetchError } = await this.supabaseService.getClient()
        .from('profiles')
        .select('*')
        .match({ profile_id: user.id });
  
      if (fetchError) {
        console.error('Error fetching user after deletion:', fetchError);
      } else if (data.length > 0) {
        console.error('User still exists in the database');
      } else {
        console.log('User deleted successfully');
      }
  
      this.fetchUsers(); 
    }
  }
  
  
  

  async approveUser(user: User) {
    if (user.status !== 'for approval') {
      console.warn('User is not in "for approval" status and cannot be approved.');
      return;
    }
  
    const { error } = await this.supabaseService.getClient()
      .from('profiles')
      .update({ status: 'active' })
      .match({ profile_id: user.id });
  
    if (error) {
      console.error('Error approving user:', error);
      return;
    }
  
    console.log('User approved successfully');
    this.fetchUsers(); 
  }
  

  async rejectUser(user: User) {
    if (user.status !== 'for approval') {
      console.warn('User is not in "for approval" status and cannot be rejected.');
      return;
    }
  
    const { error } = await this.supabaseService.getClient()
      .from('profiles')
      .delete()
      .match({ profile_id: user.id });
  
    if (error) {
      console.error('Error rejecting user:', error);
      return;
    }
  
    console.log('User rejected and deleted successfully');
    this.fetchUsers(); 
  }
  
}
