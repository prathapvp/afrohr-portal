import { RichTextEditor } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import Highlight from '@tiptap/extension-highlight';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import { useEffect } from 'react';



interface TextEditorProps {
  data: string;
  form: {
    getValues: () => { description: string };
    setFieldValue: (name: string, value: string) => void;
  };
}

const TextEditor = (props: TextEditorProps) => {
  useEffect(() => {
    editor?.commands.setContent(props.data);
  }, [props.data])
  const editor = useEditor({
    extensions: [
      StarterKit,
      Superscript,
      SubScript,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: props.form.getValues().description,
    onUpdate({ editor }) {
      props.form.setFieldValue('description', editor.getHTML());
    },
  });

  return (
    <RichTextEditor
      editor={editor}
      styles={{
        root: {
          border: '1px solid rgba(148, 163, 184, 0.35)',
          background: 'rgba(2, 6, 23, 0.9)',
          borderRadius: '10px',
        },
        toolbar: {
          background: 'rgba(15, 23, 42, 0.96)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.25)',
          padding: '6px 8px',
          gap: '6px',
        },
        control: {
          color: '#f1f5f9',
          borderColor: 'rgba(148, 163, 184, 0.28)',
          background: 'rgba(30, 41, 59, 0.82)',
          transition: 'all 140ms ease',
          '&:hover': {
            background: 'rgba(51, 65, 85, 0.95)',
            borderColor: 'rgba(148, 163, 184, 0.42)',
          },
          '&[data-active]': {
            background: 'rgba(245, 158, 11, 0.22)',
            borderColor: 'rgba(245, 158, 11, 0.55)',
            color: '#fde68a',
          },
        },
        content: {
          background: 'rgba(2, 6, 23, 0.6)',
          color: '#f8fafc',
        },
      }}
    >
      <RichTextEditor.Toolbar
        sticky
        stickyOffset={60}
        className="[&_.mantine-RichTextEditor-controlsGroup]:gap-1"
      >
        <RichTextEditor.ControlsGroup >
          <RichTextEditor.Bold />
          <RichTextEditor.Italic />
          <RichTextEditor.Underline />
          <RichTextEditor.Strikethrough />
          <RichTextEditor.ClearFormatting />
          <RichTextEditor.Highlight />
          <RichTextEditor.Code />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.H1 />
          <RichTextEditor.H2 />
          <RichTextEditor.H3 />
          <RichTextEditor.H4 />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Blockquote />
          <RichTextEditor.Hr />
          <RichTextEditor.BulletList />
          <RichTextEditor.OrderedList />
          <RichTextEditor.Subscript />
          <RichTextEditor.Superscript />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Link />
          <RichTextEditor.Unlink />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.AlignLeft />
          <RichTextEditor.AlignCenter />
          <RichTextEditor.AlignJustify />
          <RichTextEditor.AlignRight />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Undo />
          <RichTextEditor.Redo />
        </RichTextEditor.ControlsGroup>
      </RichTextEditor.Toolbar>

      <RichTextEditor.Content className="[&_.ProseMirror]:min-h-[220px] [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2 [&_.ProseMirror]:text-sm [&_.ProseMirror]:leading-7 [&_.ProseMirror]:text-slate-100 [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-black [&_.ProseMirror_h1]:text-white [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-extrabold [&_.ProseMirror_h2]:text-white [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:text-white [&_.ProseMirror_h4]:text-lg [&_.ProseMirror_h4]:font-semibold [&_.ProseMirror_h4]:text-slate-100 [&_.ProseMirror_p]:text-slate-100 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:my-2 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:my-2 [&_.ProseMirror_li]:list-item [&_.ProseMirror_li]:text-slate-100 [&_.ProseMirror_li::marker]:text-amber-300 [&_.ProseMirror_strong]:text-white [&_.ProseMirror_mark]:rounded-sm [&_.ProseMirror_mark]:bg-amber-300/30 [&_.ProseMirror_mark]:px-1 [&_.ProseMirror_mark]:text-amber-50 [&_.ProseMirror_a]:text-cyan-300 [&_.ProseMirror_a]:underline" />

    </RichTextEditor>
  );
}
export default TextEditor;