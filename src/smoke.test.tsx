import { describe, it, expect } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '@/routes/AppRoutes';
import { ConfirmDialogProvider } from '@/components/common/ConfirmDialogProvider';
import { ensureDemoDataSeeded } from '@/store/seedManager';
import { useAuthStore } from '@/store/authStore';
import { useBooksStore } from '@/store/booksStore';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
window.matchMedia ||= (() => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })) as never;
(globalThis as { ResizeObserver?: unknown }).ResizeObserver ||= class { observe() {} unobserve() {} disconnect() {} };

async function render(path: string) {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const root = createRoot(el);
  await act(async () => {
    root.render(<MemoryRouter initialEntries={[path]}><ConfirmDialogProvider><AppRoutes /></ConfirmDialogProvider></MemoryRouter>);
  });
  const text = el.textContent ?? '';
  const html = el.innerHTML;
  await act(async () => root.unmount());
  el.remove();
  return { text, html };
}

describe('smoke', () => {
  it('renders login, staff and student pages', async () => {
    ensureDemoDataSeeded();
    expect((await render('/login')).text).toContain('Library Management System');

    expect(useAuthStore.getState().login('staff', 'librarian', 'librarian123').success).toBe(true);
    for (const p of ['/dashboard', '/books', '/journals', '/circulation/active', '/circulation/issue', '/circulation/return', '/members', '/reservations', '/requests', '/fines', '/reports', '/notices', '/settings', '/profile']) {
      const { text } = await render(p);
      expect(text.length, p).toBeGreaterThan(50);
      expect(text, p).not.toContain('Page not found');
    }
    expect((await render('/notices')).text).toContain('New Notice');
    expect((await render('/journals')).text).toContain('Journals');
    // the librarian queue and the barcode-scan issue field both render
    expect((await render('/requests')).text).toContain('Book Requests');
    expect((await render('/circulation/issue')).html).toContain('Scan or type a copy barcode');
    // a real book's detail page shows its per-copy barcodes, not a placeholder
    const firstBookId = useBooksStore.getState().books[0]?.id;
    if (firstBookId) {
      const detail = await render(`/books/${firstBookId}`);
      expect(detail.text).toContain('Copy Status');
    }
    // an admin-console URL from the old build no longer exists
    expect((await render('/admin/users')).text).not.toContain('Roles');

    useAuthStore.getState().logout();
    expect(useAuthStore.getState().login('student', '2026001', 'student123').success).toBe(true);
    for (const p of ['/student/dashboard', '/student/catalogue', '/student/journals', '/student/my-books', '/student/requests', '/student/fines', '/student/notices']) {
      expect((await render(p)).text.length, p).toBeGreaterThan(50);
    }
    expect((await render('/student/journals')).text).toContain('Journals');
    expect((await render('/student/notices')).text).toContain('New arrivals');
    expect((await render('/student/requests')).text).toContain('My Requests');
    // an available title in the catalogue offers Request, not just Reserve
    expect((await render('/student/catalogue')).text).toMatch(/Request|Requested/);
    // students cannot open staff pages
    expect((await render('/notices')).text).not.toContain('New Notice');
    expect((await render('/requests')).text).not.toContain('Book Requests');
  });
});
