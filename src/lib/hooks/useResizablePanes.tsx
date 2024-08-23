import { useState, useEffect, useRef, useCallback } from "react";

export function useResizablePanes() {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const containerWidthRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !editorContainerRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeX = e.clientX - containerRect.left;
    const newEditorWidth = Math.max(0, relativeX);

    editorContainerRef.current.style.width = `${newEditorWidth}px`;
 
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (containerRef.current) {
      containerWidthRef.current = containerRef.current.offsetWidth;
    }
    setIsDragging(true);
    e.preventDefault();
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return {
    containerRef,
    editorContainerRef,
    handleMouseDown,
  };
}