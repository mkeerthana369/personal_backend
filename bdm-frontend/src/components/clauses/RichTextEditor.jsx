import React, { useRef, useEffect, useState } from 'react';

export function RichTextEditor({ value, onChange, placeholder }) {
    const editorRef = useRef(null);
    const [active, setActive] = useState({
        bold: false,
        italic: false,
        underline: false,
        ul: false,
        ol: false
    });

    useEffect(() => {
        if (editorRef.current && value !== undefined) {
            if (editorRef.current.innerHTML !== value) {
                editorRef.current.innerHTML = value || '';
            }
        }
    }, [value]);

    const updateActiveState = () => {
        if (editorRef.current && editorRef.current === document.activeElement) {
            setActive({
                bold: document.queryCommandState("bold"),
                italic: document.queryCommandState("italic"),
                underline: document.queryCommandState("underline"),
                ul: document.queryCommandState("insertUnorderedList"),
                ol: document.queryCommandState("insertOrderedList"),
            });
        }
    };

    const execCommand = (cmd) => {
        document.execCommand(cmd, false, null);
        editorRef.current?.focus();
        updateActiveState();
        onChange(editorRef.current.innerHTML);
    };

    const handleInput = () => {
        updateActiveState();
        onChange(editorRef.current.innerHTML);
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
    };

    useEffect(() => {
        const editor = editorRef.current;
        if (editor) {
            editor.addEventListener('mouseup', updateActiveState);
            editor.addEventListener('keyup', updateActiveState);
            return () => {
                editor.removeEventListener('mouseup', updateActiveState);
                editor.removeEventListener('keyup', updateActiveState);
            };
        }
    }, []);

    return (
        <div className="rte-wrapper">
            <div className="rte-toolbar">
                <button
                    type="button"
                    className={active.bold ? "active" : ""}
                    onClick={() => execCommand("bold")}
                    title="Bold"
                >
                    <strong>B</strong>
                </button>

                <button
                    type="button"
                    className={active.italic ? "active" : ""}
                    onClick={() => execCommand("italic")}
                    title="Italic"
                >
                    <em>I</em>
                </button>

                <button
                    type="button"
                    className={active.underline ? "active" : ""}
                    onClick={() => execCommand("underline")}
                    title="Underline"
                >
                    <u>U</u>
                </button>

                <button
                    type="button"
                    className={active.ul ? "active" : ""}
                    onClick={() => execCommand("insertUnorderedList")}
                    title="Bullet List"
                >
                    •
                </button>

                <button
                    type="button"
                    className={active.ol ? "active" : ""}
                    onClick={() => execCommand("insertOrderedList")}
                    title="Numbered List"
                >
                    1.
                </button>
            </div>

            <div
                ref={editorRef}
                className="rte-editor"
                contentEditable
                onInput={handleInput}
                onPaste={handlePaste}
                data-placeholder={placeholder}
                suppressContentEditableWarning
            />
        </div>
    );
}