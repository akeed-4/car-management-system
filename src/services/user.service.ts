import { Injectable, signal } from '@angular/core';
import { User } from '../types/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private nextId = signal(3);
  private users = signal<User[]>([
    { id: 1, name: 'المدير العام', roleId: 1, roleName: 'مدير النظام', status: 'Active' },
    { id: 2, name: 'أحمد مندوب مبيعات', roleId: 2, roleName: 'مندوب مبيعات', status: 'Active' },
  ]);

  public users$ = this.users.asReadonly();

  getUserById(id: number): User | undefined {
    return this.users().find(u => u.id === id);
  }

  addUser(user: Omit<User, 'id'>) {
    const newUser: User = {
      ...user,
      id: this.nextId(),
    };
    this.users.update(users => [...users, newUser]);
    this.nextId.update(id => id + 1);
  }

  updateUser(updatedUser: User) {
    this.users.update(users =>
      users.map(u => (u.id === updatedUser.id ? updatedUser : u))
    );
  }

  deleteUser(id: number) {
    this.users.update(users => users.filter(u => u.id !== id));
  }
}
