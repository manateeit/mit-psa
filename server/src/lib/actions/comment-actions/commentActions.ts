'use server'

import Comment from '@/lib/models/comment';
import { IComment } from '@/interfaces/comment.interface';

export async function findCommentsByTicketId(ticketId: string) {
  try {
    const comments = await Comment.getAllbyTicketId(ticketId);
    return comments;
  } catch (error) {
    console.error(error);
    throw new Error(`Failed to find comments for ticket id: ${ticketId}`);
  }
}

export async function findCommentById(ticketId: string) {
  try {
    const comments = await Comment.get(ticketId);
    return comments;
  } catch (error) {
    console.error(error);
    throw new Error(`Failed to find comments for ticket id: ${ticketId}`);
  }
}

export async function createComment(comment: Omit<IComment, 'tenant'>): Promise<string> {
  try {
    // First, check if there are any existing comments for this ticket
    const existingComments = await Comment.getAllbyTicketId(comment.ticket_id || '');

    // If this is the first comment, set is_initial_description to true
    if (existingComments.length === 0) {
      comment.is_initial_description = true;
    }

    // Ensure author_type is set
    if (!comment.author_type) {
      // Default to 'user' if user_id is present, otherwise 'unknown'
      comment.author_type = comment.user_id ? 'user' : 'unknown';
    }

    // Validate author type and ID combination
    if (comment.author_type === 'user' && !comment.user_id) {
      throw new Error('user_id is required when author_type is "user"');
    }
    if (comment.author_type === 'contact' && !comment.contact_id) {
      throw new Error('contact_id is required when author_type is "contact"');
    }

    // Now insert the comment
    const commentId = await Comment.insert(comment);
    return commentId;
  } catch (error) {
    console.error(`Failed to create comment:`, error);
    throw new Error(`Failed to create comment`);
  }
}
export async function updateComment(id: string, comment: Partial<IComment>) {
  console.log(`[updateComment] Starting update for comment ID: ${id}`, { commentData: comment });
  try {
    console.log(`[updateComment] Fetching existing comment with ID: ${id}`);
    const existingComment = await Comment.get(id);
    if (!existingComment) {
      console.error(`[updateComment] Comment with ID ${id} not found`);
      throw new Error(`Comment with id ${id} not found`);
    }
    console.log(`[updateComment] Found existing comment:`, existingComment);

    // If changing author type, ensure the corresponding ID is provided
    if (comment.author_type) {
      console.log(`[updateComment] Author type change detected to: ${comment.author_type}`);
      if (comment.author_type === 'user') {
        console.log(`[updateComment] Validating user_id for author type 'user'`);
        if (!comment.user_id && !existingComment.user_id) {
          console.error(`[updateComment] Missing user_id for author type 'user'`);
          throw new Error('user_id is required when author_type is "user"');
        }
        // Clear contact_id when switching to user
        console.log(`[updateComment] Clearing contact_id as author type is 'user'`);
        comment.contact_id = undefined;
      } else if (comment.author_type === 'contact') {
        console.log(`[updateComment] Validating contact_id for author type 'contact'`);
        if (!comment.contact_id && !existingComment.contact_id) {
          console.error(`[updateComment] Missing contact_id for author type 'contact'`);
          throw new Error('contact_id is required when author_type is "contact"');
        }
        // Clear user_id when switching to contact
        console.log(`[updateComment] Clearing user_id as author type is 'contact'`);
        comment.user_id = undefined;
      }
    }

    // If providing a new user_id, ensure author_type is 'user'
    if (comment.user_id && comment.author_type !== 'user') {
      console.log(`[updateComment] New user_id provided, updating author type to 'user'`);
      comment.author_type = 'user';
      comment.contact_id = undefined;
    }

    // If providing a new contact_id, ensure author_type is 'contact'
    if (comment.contact_id && comment.author_type !== 'contact') {
      console.log(`[updateComment] New contact_id provided, updating author type to 'contact'`);
      comment.author_type = 'contact';
      comment.user_id = undefined;
    }

    console.log(`[updateComment] Proceeding with update`, { finalUpdateData: comment });
    await Comment.update(id, comment);
    console.log(`[updateComment] Successfully updated comment with ID: ${id}`);
  } catch (error) {
    console.error(`[updateComment] Failed to update comment with ID ${id}:`, error);
    console.error(`[updateComment] Stack trace:`, error instanceof Error ? error.stack : 'No stack trace available');
    throw new Error(`Failed to update comment with id ${id}`);
  }
}

export async function deleteComment(id: string) {
  try {
    await Comment.delete(id);
  } catch (error) {
    console.error(`Failed to delete comment with id ${id}:`, error);
    throw new Error(`Failed to delete comment with id ${id}`);
  }
}
