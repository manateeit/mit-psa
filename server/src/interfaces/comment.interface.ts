import { TenantEntity } from './index';

export type CommentAuthorType = 'user' | 'contact' | 'unknown';

export interface ICommentAuthor {
  type: CommentAuthorType;
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface IComment extends TenantEntity {
  comment_id?: string;
  ticket_id?: string;
  user_id?: string;
  contact_id?: string;
  author_type: CommentAuthorType;
  note?: string;
  is_initial_description?: boolean;
  is_internal?: boolean;
  is_resolution?: boolean;
  created_at?: string;
  updated_at?: string;
}
