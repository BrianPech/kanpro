"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
  RemoveFormatting,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Escribe los detalles, responsabilidades y requisitos de la vacante...",
  disabled = false,
  className,
  minHeight = "220px",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline font-semibold cursor-pointer",
        },
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // Sync external value changes if editor content is different
  React.useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  React.useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  const setLink = React.useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Ingresa la URL del enlace:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <TooltipProvider delay={200}>
      <div
        className={cn(
          "w-full rounded-2xl border border-border/60 bg-card text-card-foreground shadow-xs overflow-hidden focus-within:border-primary/80 transition-colors",
          disabled && "opacity-60 pointer-events-none",
          className
        )}
      >
        {/* Toolbar Header */}
        <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/40 border-b border-border/60">
          {/* History Actions */}
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className="size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                  />
                }
              >
                <Undo className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="top">Deshacer</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className="size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                  />
                }
              >
                <Redo className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="top">Rehacer</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Text Formats */}
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={cn(
                      "size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer",
                      editor.isActive("bold") && "bg-muted font-bold text-foreground"
                    )}
                  />
                }
              >
                <Bold className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="top">Negrita (Ctrl+B)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={cn(
                      "size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer",
                      editor.isActive("italic") && "bg-muted text-foreground"
                    )}
                  />
                }
              >
                <Italic className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="top">Cursiva (Ctrl+I)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={cn(
                      "size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer",
                      editor.isActive("strike") && "bg-muted text-foreground"
                    )}
                  />
                }
              >
                <Strikethrough className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="top">Tachado</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Headings */}
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                    className={cn(
                      "size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer",
                      editor.isActive("heading", { level: 2 }) &&
                        "bg-muted font-bold text-foreground"
                    )}
                  />
                }
              >
                <Heading2 className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="top">Título Principal (H2)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      editor.chain().focus().toggleHeading({ level: 3 }).run()
                    }
                    className={cn(
                      "size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer",
                      editor.isActive("heading", { level: 3 }) &&
                        "bg-muted font-bold text-foreground"
                    )}
                  />
                }
              >
                <Heading3 className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="top">Subtítulo (H3)</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Lists & Quotes */}
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={cn(
                      "size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer",
                      editor.isActive("bulletList") && "bg-muted font-bold text-foreground"
                    )}
                  />
                }
              >
                <List className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="top">Lista con viñetas</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={cn(
                      "size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer",
                      editor.isActive("orderedList") && "bg-muted font-bold text-foreground"
                    )}
                  />
                }
              >
                <ListOrdered className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="top">Lista numerada</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={cn(
                      "size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer",
                      editor.isActive("blockquote") && "bg-muted text-foreground"
                    )}
                  />
                }
              >
                <Quote className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="top">Cita</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Links & Clear */}
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={setLink}
                    className={cn(
                      "size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer",
                      editor.isActive("link") && "bg-muted text-primary"
                    )}
                  />
                }
              >
                <LinkIcon className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="top">Insertar Enlace</TooltipContent>
            </Tooltip>

            {editor.isActive("link") && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => editor.chain().focus().unsetLink().run()}
                      className="size-8 rounded-lg text-muted-foreground hover:text-destructive cursor-pointer"
                    />
                  }
                >
                  <Unlink className="size-4" />
                </TooltipTrigger>
                <TooltipContent side="top">Quitar Enlace</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                    className="size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                  />
                }
              >
                <RemoveFormatting className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="top">Limpiar Formato</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Editor Content Area */}
        <div
          style={{ minHeight }}
          className={cn(
            "p-4 text-foreground text-sm leading-relaxed",
            "[&_.ProseMirror]:outline-none [&_.ProseMirror]:h-full [&_.ProseMirror]:min-h-[180px]",
            "[&_.ProseMirror_p]:mb-2 [&_.ProseMirror_p:last-child]:mb-0",
            "[&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mt-4 [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:text-foreground",
            "[&_.ProseMirror_h3]:text-base [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:mt-3 [&_.ProseMirror_h3]:mb-1.5 [&_.ProseMirror_h3]:text-foreground",
            "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ul]:mb-3 [&_.ProseMirror_ul]:space-y-1",
            "[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_ol]:mb-3 [&_.ProseMirror_ol]:space-y-1",
            "[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-primary/40 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-muted-foreground [&_.ProseMirror_blockquote]:my-3",
            "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground/60 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
          )}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </TooltipProvider>
  );
}
