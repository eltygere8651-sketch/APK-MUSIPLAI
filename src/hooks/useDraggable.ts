import { useRef, useEffect, RefObject } from 'react';

export function useDraggable(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const ele = ref.current;
    if (!ele) return;

    let pos = { top: 0, left: 0, x: 0, y: 0 };
    let isDragging = false;
    let hasDragged = false;

    const mouseDownHandler = (e: MouseEvent) => {
      isDragging = true;
      hasDragged = false;
      ele.style.cursor = 'grabbing';
      ele.style.userSelect = 'none';

      pos = {
        left: ele.scrollLeft,
        top: ele.scrollTop,
        x: e.clientX,
        y: e.clientY,
      };

      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const dx = e.clientX - pos.x;
      const dy = e.clientY - pos.y;
      
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasDragged = true;
      }

      ele.scrollTop = pos.top - dy;
      ele.scrollLeft = pos.left - dx;
    };

    const mouseUpHandler = (e: MouseEvent) => {
      isDragging = false;
      ele.style.cursor = 'grab';
      ele.style.removeProperty('user-select');

      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };

    const clickCaptureHandler = (e: MouseEvent) => {
      if (hasDragged) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    ele.addEventListener('mousedown', mouseDownHandler);
    ele.addEventListener('click', clickCaptureHandler, true);
    ele.style.cursor = 'grab';

    return () => {
      ele.removeEventListener('mousedown', mouseDownHandler);
      ele.removeEventListener('click', clickCaptureHandler, true);
    };
  }, [ref]);
}
