'use server'

import Comment from 'server/src/lib/models/comment';
import { IComment } from 'server/src/interfaces/comment.interface';
import { findUserById } from 'server/src/lib/actions/user-actions/userActions';
import { createTenantKnex } from 'server/src/lib/db';
import { convertBlockNoteToMarkdown } from 'server/src/lib/utils/blocknoteUtils';

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
    console.log(`[createComment] Starting with comment:`, {
      note_length: comment.note ? comment.note.length : 0,
      is_internal: comment.is_internal,
      is_resolution: comment.is_resolution,
      user_id: comment.user_id
    });
    
    // Get user's type to set author_type
    if (comment.user_id) {
      const { knex: db, tenant } = await createTenantKnex();
      const user = await db('users')
        .select('user_type')
        .where('user_id', comment.user_id)
        .andWhere('tenant', tenant!)
        .first();

      if (user) {
        comment.author_type = user.user_type === 'internal' ? 'internal' : 'client';
      } else {
        comment.author_type = 'unknown';
      }
    } else {
      comment.author_type = 'unknown';
    }

    // Only allow internal comments from internal users
    if (comment.is_internal && comment.author_type !== 'internal') {
      throw new Error('Only internal users can create internal comments');
    }

    // IMPORTANT: First convert BlockNote JSON to Markdown if note exists
    // We'll do this BEFORE any database operations to ensure it's complete
    if (comment.note) {
      console.log(`[createComment] Converting note to markdown for new comment`);
      console.log(`[createComment] Note content:`, comment.note);
      
      try {
        // Convert the note to markdown - this is a synchronous operation now
        // We'll wait for it to complete before proceeding
        comment.markdown_content = await convertBlockNoteToMarkdown(comment.note);
        
        // Verify we have markdown content
        if (!comment.markdown_content || comment.markdown_content.trim() === '') {
          console.warn(`[createComment] Markdown conversion returned empty result, using fallback`);
          comment.markdown_content = "[Fallback markdown content]";
        }
        
        console.log(`[createComment] Markdown conversion successful:`, {
          length: comment.markdown_content.length,
          content: comment.markdown_content
        });
      } catch (conversionError) {
        console.error(`[createComment] Error during markdown conversion:`, conversionError);
        comment.markdown_content = "[Error during content conversion]";
      }
    } else {
      // Explicitly set markdown_content for comments without notes
      comment.markdown_content = "[No content]";
    }

    // Now that we have the markdown content, insert the comment
    console.log(`[createComment] Inserting comment with markdown_content:`, comment.markdown_content);
    
    // Create a copy of the comment object to ensure markdown_content is included
    const commentToInsert = {
      ...comment,
      // Double-check that markdown_content is set
      markdown_content: comment.markdown_content || "[No markdown content]"
    };
    
    console.log(`[createComment] Final comment object for insertion:`, {
      ...commentToInsert,
      note: commentToInsert.note ? `${commentToInsert.note.substring(0, 50)}...` : undefined,
      markdown_content_length: commentToInsert.markdown_content ? commentToInsert.markdown_content.length : 0
    });
    
    // Explicitly log the exact object being passed to the database
    console.log(`[createComment] Raw object being passed to database:`, JSON.stringify({
      ...commentToInsert,
      note: '[truncated]',
      markdown_content: commentToInsert.markdown_content
    }));
    
    // Directly use knex to insert the comment to ensure markdown_content is included
    const { knex: db, tenant } = await createTenantKnex();
    
    const result = await db('comments')
      .insert({
        ...commentToInsert,
        tenant: tenant!,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        markdown_content: commentToInsert.markdown_content // Explicitly include markdown_content
      })
      .returning(['comment_id', 'markdown_content']);
    
    const commentId = result[0].comment_id;
    console.log(`[createComment] Comment inserted with ID:`, commentId, 'and markdown_content:', result[0].markdown_content);
    
    // Verify the comment was inserted correctly
    try {
      const insertedComment = await Comment.get(commentId);
      if (insertedComment) {
        console.log(`[createComment] Verification - inserted comment:`, {
          comment_id: insertedComment.comment_id,
          has_markdown: !!insertedComment.markdown_content,
          markdown_length: insertedComment.markdown_content ? insertedComment.markdown_content.length : 0,
          markdown_content: insertedComment.markdown_content
        });
        
        // If markdown_content is still null, try to update it directly
        if (!insertedComment.markdown_content) {
          console.warn(`[createComment] Markdown content is null after insertion, attempting direct update`);
          await db('comments')
            .where('comment_id', commentId)
            .andWhere('tenant', tenant!)
            .update({
              markdown_content: commentToInsert.markdown_content,
              updated_at: new Date().toISOString()
            });
          
          console.log(`[createComment] Direct update of markdown_content completed`);
        }
      } else {
        console.log(`[createComment] Verification - comment not found after insertion`);
      }
    } catch (verifyError) {
      console.error(`[createComment] Error verifying inserted comment:`, verifyError);
    }
    
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

    // If user_id is being updated, get user's type
    if (comment.user_id) {
      const { knex: db, tenant } = await createTenantKnex();
      const user = await db('users')
        .select('user_type')
        .where('user_id', comment.user_id)
        .andWhere('tenant', tenant!)
        .first();

      if (user) {
        comment.author_type = user.user_type === 'internal' ? 'internal' : 'client';
      } else {
        comment.author_type = 'unknown';
      }
    }

    // Validate internal comment permissions
    if (comment.is_internal !== undefined) {
      // Only allow internal comments from internal users
      if (comment.is_internal && comment.author_type !== 'internal' && existingComment.author_type !== 'internal') {
        throw new Error('Only internal users can set comments as internal');
      }
      // If a client user is updating a comment, ensure they can't make it internal
      if (existingComment.author_type === 'client') {
        comment.is_internal = existingComment.is_internal; // Preserve internal status
      }
    }

    // IMPORTANT: First convert BlockNote JSON to Markdown if note is being updated
    // We'll do this BEFORE any database operations to ensure it's complete
    if (comment.note !== undefined) {
      console.log(`[updateComment] Converting note to markdown for comment update`);
      console.log(`[updateComment] Note content:`, comment.note);
      
      try {
        // Convert the note to markdown - this is a synchronous operation now
        // We'll wait for it to complete before proceeding
        comment.markdown_content = await convertBlockNoteToMarkdown(comment.note);
        
        // Verify we have markdown content
        if (!comment.markdown_content || comment.markdown_content.trim() === '') {
          console.warn(`[updateComment] Markdown conversion returned empty result, using fallback`);
          comment.markdown_content = "[Fallback markdown content]";
        }
        
        console.log(`[updateComment] Markdown conversion successful:`, {
          length: comment.markdown_content.length,
          content: comment.markdown_content
        });
      } catch (conversionError) {
        console.error(`[updateComment] Error during markdown conversion:`, conversionError);
        comment.markdown_content = "[Error during content conversion]";
      }
    }

    // Create a copy of the comment object to ensure markdown_content is included
    const commentToUpdate = {
      ...comment,
      // Double-check that markdown_content is set if note was updated
      markdown_content: comment.note !== undefined ? 
        (comment.markdown_content || "[No markdown content]") : 
        comment.markdown_content
    };

    console.log(`[updateComment] Proceeding with update`, { 
      finalUpdateData: commentToUpdate,
      hasMarkdownContent: commentToUpdate.markdown_content !== undefined,
      markdownContentLength: commentToUpdate.markdown_content ? commentToUpdate.markdown_content.length : 0
    });
    
    // Directly use knex to update the comment to ensure markdown_content is included
    const { knex: db, tenant } = await createTenantKnex();
    
    const result = await db('comments')
      .where('comment_id', id)
      .andWhere('tenant', tenant!)
      .update({
        ...commentToUpdate,
        updated_at: new Date().toISOString(),
        markdown_content: commentToUpdate.markdown_content // Explicitly include markdown_content
      })
      .returning(['comment_id', 'markdown_content']);
    
    console.log(`[updateComment] Successfully updated comment with ID: ${id}`, 
      result.length > 0 ? `and markdown_content: ${result[0].markdown_content}` : '');
    
    // Verify the comment was updated correctly
    try {
      const updatedComment = await Comment.get(id);
      if (updatedComment) {
        console.log(`[updateComment] Verification - updated comment:`, {
          comment_id: updatedComment.comment_id,
          has_markdown: !!updatedComment.markdown_content,
          markdown_length: updatedComment.markdown_content ? updatedComment.markdown_content.length : 0,
          markdown_content: updatedComment.markdown_content
        });
        
        // If markdown_content is still null, try to update it directly
        if (!updatedComment.markdown_content && commentToUpdate.markdown_content) {
          console.warn(`[updateComment] Markdown content is null after update, attempting direct update`);
          await db('comments')
            .where('comment_id', id)
            .andWhere('tenant', tenant!)
            .update({
              markdown_content: commentToUpdate.markdown_content,
              updated_at: new Date().toISOString()
            });
          
          console.log(`[updateComment] Direct update of markdown_content completed`);
        }
      } else {
        console.log(`[updateComment] Verification - comment not found after update`);
      }
    } catch (verifyError) {
      console.error(`[updateComment] Error verifying updated comment:`, verifyError);
    }
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
