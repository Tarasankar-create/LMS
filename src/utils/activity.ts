import { BookCheck, BookPlus, CircleDollarSign, UserPlus, BookOpenCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Book, Fine, Loan, Member } from '@/types';

export interface ActivityItem {
  id: string;
  message: string;
  date: string;
  icon: LucideIcon;
}

interface ActivitySources {
  loans: Loan[];
  members: Member[];
  fines: Fine[];
  books: Book[];
}

export function getRecentActivities({ loans, members, fines, books }: ActivitySources, limit = 8): ActivityItem[] {
  const items: ActivityItem[] = [];

  loans.forEach((loan) => {
    items.push({
      id: `issue_${loan.id}`,
      message: `"${loan.bookTitle}" issued to member ${loan.memberId}`,
      date: loan.issueDate,
      icon: BookPlus,
    });
    if (loan.status === 'Returned' && loan.returnDate) {
      items.push({
        id: `return_${loan.id}`,
        message: `"${loan.bookTitle}" returned by member ${loan.memberId}`,
        date: loan.returnDate,
        icon: BookCheck,
      });
    }
  });

  members.forEach((member) => {
    items.push({
      id: `member_${member.id}`,
      message: `${member.name} registered as a new library member`,
      date: member.joinDate,
      icon: UserPlus,
    });
  });

  fines
    .filter((fine) => fine.status === 'Collected' && fine.collectedDate)
    .forEach((fine) => {
      items.push({
        id: `fine_${fine.id}`,
        message: `Fine of ₹${fine.amount} collected from ${fine.memberName}`,
        date: fine.collectedDate!,
        icon: CircleDollarSign,
      });
    });

  books.forEach((book) => {
    items.push({
      id: `book_${book.id}`,
      message: `Catalogue updated: "${book.title}" added`,
      date: book.addedDate,
      icon: BookOpenCheck,
    });
  });

  return items.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit);
}
