// Shared TypeScript interface matching the rebuilt guestbook_entries table.
// profile_id = whose guestbook wall this entry belongs to.
// author_id  = who wrote the message (both FK → profiles.id).
export interface GuestbookEntry {
  id: string;
  profile_id: string;
  author_id: string;
  message: string;
  created_at: Date;
}
