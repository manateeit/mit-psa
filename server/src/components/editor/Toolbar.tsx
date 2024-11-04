import { type Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading1,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo
} from 'lucide-react';


type ToolbarProps = {
  editor: Editor | null,
  content: string,
  onSubmit?: (content: string) => void,
}


const Toolbar: React.FC<ToolbarProps> = ({ editor, content, onSubmit }) => {
  if (!editor) {
    return null;
  }
  return (
    <div className="p-5">
      <div className="flex justify-start items-center gap-3 w-full lg:w-10/12 flex-wrap">
        <button
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBold().run();
          }}
          className={
            editor.isActive('bold')
              ? 'bg-gray-700 text-white p-2 rounded-lg'
              : 'text-gray-400'
          }
        >
          <Bold className='w-5 h-5' />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleItalic().run()
          }
          }
          className={
            editor.isActive('italic')
              ? 'bg-gray-700 text-white p-2 rounded-lg'
              : 'text-gray-400'}
        >
          <Italic className='w-5 h-5' />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleUnderline().run()
          }
          }
          className={
            editor.isActive('underline')
              ? 'bg-gray-700 text-white p-2 rounded-lg'
              : 'text-gray-400'}
        >
          <Underline className='w-5 h-5' />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleStrike().run()
          }
          }
          className={
            editor.isActive('strike')
              ? 'bg-gray-700 text-white p-2 rounded-lg'
              : 'text-gray-400'}
        >
          <Strikethrough className='w-5 h-5' />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }}
          className={
            editor.isActive('heading', { level: 1 })
              ? 'bg-gray-700 text-white p-2 rounded-lg'
              : 'text-gray-400'}
        >
          <Heading1 className='w-5 h-5' />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          }
          className={
            editor.isActive('heading', { level: 2 })
              ? 'bg-gray-700 text-white p-2 rounded-lg'
              : 'text-gray-400'}
        >
          <Heading2 className='w-5 h-5' />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBulletList().run()
          }}
          className={
            editor.isActive('bulletList')
              ? 'bg-gray-700 text-white p-2 rounded-lg'
              : 'text-gray-400'}
        >
          <List className='w-5 h-5' />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleOrderedList().run()
          }
          }
          className={
            editor.isActive('orderedList',)
              ? 'bg-gray-700 text-white p-2 rounded-lg'
              : 'text-gray-400'}
        >
          <ListOrdered className='w-5 h-5' />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBlockquote().run()
          }
          }
          className={
            editor.isActive('blockquote')
              ? 'bg-gray-700 text-white p-2 rounded-lg'
              : 'text-gray-400'}
        >
          <Quote className='w-5 h-5' />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().undo().run();
          }}
          className={
            editor.isActive('undo')
              ? 'bg-gray-700 text-white p-2 rounded-lg'
              : 'text-gray-400'}
        >
          <Undo className='w-5 h-5' />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().redo().run();
          }}
          className={
            editor.isActive('redo')
              ? 'bg-gray-700 text-white p-2 rounded-lg'
              : 'text-gray-400'}
        >
          <Redo className='w-5 h-5' />
        </button>
      </div>

      {content && (
        <button
          type="submit"
          onClick={(e) => {
            if (onSubmit) {
              e.preventDefault();
              onSubmit(content);
            }
          }}
          className="px-4 bg-purple-700 text-white py-2 rounded-md hidden"
        >
          Save
        </button>
      )}
    </div>
  );
}

export default Toolbar;