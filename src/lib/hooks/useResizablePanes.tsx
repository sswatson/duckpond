import { useState, useEffect, useRef, useCallback } from "react";

export function useResizablePanes() {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const resultContainerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const containerWidthRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current || !editorContainerRef.current || !resultContainerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeX = e.clientX - containerRect.left;
    const newEditorWidth = Math.max(0, relativeX);

    const containerWidth = containerWidthRef.current;
    const newResultWidth = containerWidth - newEditorWidth - 3; // 3px for divider width

    editorContainerRef.current.style.width = `${newEditorWidth}px`;
    resultContainerRef.current.style.width = `${newResultWidth}px`;
 
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
    resultContainerRef,
    dividerRef,
    handleMouseDown,
  };
}