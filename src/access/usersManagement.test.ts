import { describe, it, expect, beforeEach } from 'vitest';
import { useAccessStore } from './accessStore';
import { useAuthStore } from '@/store/authStore';
import { can } from './permissions';

beforeEach(() => {
  localStorage.clear();
  useAuthStore.getState().logout();
});

describe('Staff & User Management (Admin Module)', () => {
  it('allows Admin to add a new Staff member via role dropdown and allows them to log in immediately', () => {
    const access = useAccessStore.getState();
    const result = access.addUser({
      name: 'Sunita Mishra',
      username: 'sunita_staff',
      password: 'password123',
      role: 'staff',
      email: 'sunita.m@pscollege.ac.in',
      phone: '9876543210',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.user.name).toBe('Sunita Mishra');
    expect(result.user.role).toBe('staff');
    expect(result.user.username).toBe('sunita_staff');
    expect(result.user.status).toBe('active');

    // Verify the newly created staff member can immediately log in on the Staff Login tab
    const loginRes = useAuthStore.getState().login('staff', 'sunita_staff', 'password123');
    expect(loginRes.success).toBe(true);

    const currentUser = useAuthStore.getState().currentUser;
    expect(currentUser).not.toBeNull();
    expect(currentUser?.role).toBe('staff');

    // Verify their role-based permissions
    const matrix = useAccessStore.getState().matrix;
    expect(can(matrix, currentUser?.role, 'circulation', 'create')).toBe(true);
    expect(can(matrix, currentUser?.role, 'books', 'view')).toBe(true);
    expect(can(matrix, currentUser?.role, 'librarySettings', 'view')).toBe(false);
  });

  it('allows Admin to add a new Librarian via role dropdown and verifies full librarian permissions', () => {
    const access = useAccessStore.getState();
    const result = access.addUser({
      name: 'Dr. Ashok Mohapatra',
      username: 'ashok_lib',
      password: 'librarianPass1',
      role: 'librarian',
      email: 'ashok.lib@pscollege.ac.in',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.user.role).toBe('librarian');

    // Login test
    const loginRes = useAuthStore.getState().login('staff', 'ashok_lib', 'librarianPass1');
    expect(loginRes.success).toBe(true);

    const currentUser = useAuthStore.getState().currentUser;
    expect(currentUser?.role).toBe('librarian');

    const matrix = useAccessStore.getState().matrix;
    expect(can(matrix, currentUser?.role, 'books', 'create')).toBe(true);
    expect(can(matrix, currentUser?.role, 'members', 'create')).toBe(true);
    expect(can(matrix, currentUser?.role, 'reports', 'view')).toBe(true);
    expect(can(matrix, currentUser?.role, 'librarySettings', 'view')).toBe(true);
  });

  it('allows Admin to add a new Principal via role dropdown and verifies executive read-only oversight', () => {
    const access = useAccessStore.getState();
    const result = access.addUser({
      name: 'Prof. Debabrata Nayak',
      username: 'principal_nayak',
      password: 'principalSecure1',
      role: 'principal',
      email: 'principal.nayak@pscollege.ac.in',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.user.role).toBe('principal');

    // Login test
    const loginRes = useAuthStore.getState().login('staff', 'principal_nayak', 'principalSecure1');
    expect(loginRes.success).toBe(true);

    const currentUser = useAuthStore.getState().currentUser;
    expect(currentUser?.role).toBe('principal');

    const matrix = useAccessStore.getState().matrix;
    expect(can(matrix, currentUser?.role, 'reports', 'view')).toBe(true);
    expect(can(matrix, currentUser?.role, 'fines', 'view')).toBe(true);
    expect(can(matrix, currentUser?.role, 'circulation', 'create')).toBe(false);
  });

  it('rejects duplicate usernames (case-insensitive) and validates input fields', () => {
    const access = useAccessStore.getState();

    // admin is already in SEED_USERS
    const dupRes = access.addUser({
      name: 'Fake Admin',
      username: 'ADMIN',
      password: 'password123',
      role: 'staff',
    });
    expect(dupRes.ok).toBe(false);
    if (!dupRes.ok) {
      expect(dupRes.error).toContain('already in use');
    }

    // Short password rejection
    const shortPassRes = access.addUser({
      name: 'Test Staff',
      username: 'test_staff_short',
      password: '123',
      role: 'staff',
    });
    expect(shortPassRes.ok).toBe(false);
    if (!shortPassRes.ok) {
      expect(shortPassRes.error).toContain('at least 6 characters');
    }
  });

  it('allows Admin to update user details', () => {
    const access = useAccessStore.getState();
    const addRes = access.addUser({
      name: 'Original Name',
      username: 'update_target',
      password: 'password123',
      role: 'staff',
    });
    expect(addRes.ok).toBe(true);
    if (!addRes.ok) return;

    const updateRes = access.updateUser(addRes.user.id, {
      name: 'Updated Name',
      role: 'librarian',
      email: 'updated@pscollege.ac.in',
    });
    expect(updateRes.ok).toBe(true);

    const updated = useAccessStore.getState().users.find((u) => u.id === addRes.user.id);
    expect(updated?.name).toBe('Updated Name');
    expect(updated?.role).toBe('librarian');
    expect(updated?.email).toBe('updated@pscollege.ac.in');
  });

  it('allows Admin to suspend and reactivate user accounts, preventing suspended users from signing in', () => {
    const access = useAccessStore.getState();
    const addRes = access.addUser({
      name: 'Suspension Candidate',
      username: 'suspend_me',
      password: 'password123',
      role: 'staff',
    });
    expect(addRes.ok).toBe(true);
    if (!addRes.ok) return;

    // Suspend
    const suspendRes = access.toggleUserStatus(addRes.user.id);
    expect(suspendRes.ok).toBe(true);

    let user = useAccessStore.getState().users.find((u) => u.id === addRes.user.id);
    expect(user?.status).toBe('suspended');

    // Attempted login should fail with suspended message
    const loginFail = useAuthStore.getState().login('staff', 'suspend_me', 'password123');
    expect(loginFail.success).toBe(false);
    expect(loginFail.error).toContain('suspended');

    // Reactivate
    const reactivateRes = access.toggleUserStatus(addRes.user.id);
    expect(reactivateRes.ok).toBe(true);

    user = useAccessStore.getState().users.find((u) => u.id === addRes.user.id);
    expect(user?.status).toBe('active');

    // Login succeeds now
    const loginSuccess = useAuthStore.getState().login('staff', 'suspend_me', 'password123');
    expect(loginSuccess.success).toBe(true);
  });

  it('allows Admin to reset user passwords', () => {
    const access = useAccessStore.getState();
    const addRes = access.addUser({
      name: 'Password Reset Target',
      username: 'pwd_target',
      password: 'initialPass123',
      role: 'staff',
    });
    expect(addRes.ok).toBe(true);
    if (!addRes.ok) return;

    // Reset password
    const resetRes = access.resetUserPassword(addRes.user.id, 'brandNewPass456');
    expect(resetRes.ok).toBe(true);

    // Old password should fail
    const oldLogin = useAuthStore.getState().login('staff', 'pwd_target', 'initialPass123');
    expect(oldLogin.success).toBe(false);

    // New password should succeed
    const newLogin = useAuthStore.getState().login('staff', 'pwd_target', 'brandNewPass456');
    expect(newLogin.success).toBe(true);
  });

  it('prevents self-deletion and self-suspension by the logged-in user', () => {
    const access = useAccessStore.getState();
    const adminUser = access.users.find((u) => u.username === 'admin');
    expect(adminUser).toBeTruthy();
    if (!adminUser) return;

    // Self-deletion check
    const deleteSelf = access.deleteUser(adminUser.id, adminUser.id);
    expect(deleteSelf.ok).toBe(false);
    if (!deleteSelf.ok) {
      expect(deleteSelf.error).toContain('cannot delete your own account');
    }

    // Self-suspension check
    const suspendSelf = access.toggleUserStatus(adminUser.id, adminUser.id);
    expect(suspendSelf.ok).toBe(false);
    if (!suspendSelf.ok) {
      expect(suspendSelf.error).toContain('cannot suspend your own account');
    }
  });

  it('exposes the 4 institutional staff roles in the role dropdown (Admin, Librarian, Staff (College Staff), Principal) excluding Students', async () => {
    const { ASSIGNABLE_ROLES, USER_ASSIGNABLE_ROLES } = await import('@/utils/validators/userSchema');

    // Exactly 4 assignable categories for Staff & User management
    expect(USER_ASSIGNABLE_ROLES).toEqual(['admin', 'librarian', 'staff', 'principal']);
    expect(USER_ASSIGNABLE_ROLES).not.toContain('student');

    // Role labels verify that staff is clearly designated as College Staff
    const staffMeta = ASSIGNABLE_ROLES.find((r) => r.value === 'staff');
    expect(staffMeta?.label).toBe('Staff (College Staff)');

    const librarianMeta = ASSIGNABLE_ROLES.find((r) => r.value === 'librarian');
    expect(librarianMeta?.label).toBe('Librarian');

    const adminMeta = ASSIGNABLE_ROLES.find((r) => r.value === 'admin');
    expect(adminMeta?.label).toBe('Admin');

    const principalMeta = ASSIGNABLE_ROLES.find((r) => r.value === 'principal');
    expect(principalMeta?.label).toBe('Principal');
  });

  it('prevents adding additional Admin accounts because only one Admin is permitted', async () => {
    const { USER_CREATABLE_ROLES } = await import('@/utils/validators/userSchema');
    // Creatable roles for adding users exclude Admin
    expect(USER_CREATABLE_ROLES).toEqual(['librarian', 'staff', 'principal']);
    expect(USER_CREATABLE_ROLES).not.toContain('admin');

    const access = useAccessStore.getState();
    const result = access.addUser({
      name: 'Second Admin',
      username: 'admin2',
      password: 'password123',
      role: 'admin',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Only one Admin is permitted');
    }
  });
});
