import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import styles from './SignatureCanvas.module.css';

export interface SignatureCanvasRef {
  /** Returns the current signature as a PNG Blob, or null if the canvas is blank. */
  toBlob: () => Promise<Blob | null>;
  /** Clears the canvas. */
  clear: () => void;
}

interface SignatureCanvasProps {
  width?: number;
  height?: number;
}

export const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(
  function SignatureCanvas({ width = 500, height = 200 }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const hasStrokes = useRef(false);

    const getCtx = useCallback(() => {
      return canvasRef.current?.getContext('2d') ?? null;
    }, []);

    const getPos = useCallback(
      (e: MouseEvent | TouchEvent): { x: number; y: number } | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if ('touches' in e) {
          const touch = e.touches[0];
          if (!touch) return null;
          return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY,
          };
        }
        return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
        };
      },
      [],
    );

    const startDraw = useCallback(
      (e: MouseEvent | TouchEvent) => {
        const ctx = getCtx();
        const pos = getPos(e);
        if (!ctx || !pos) return;
        drawing.current = true;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      },
      [getCtx, getPos],
    );

    const draw = useCallback(
      (e: MouseEvent | TouchEvent) => {
        if (!drawing.current) return;
        const ctx = getCtx();
        const pos = getPos(e);
        if (!ctx || !pos) return;
        hasStrokes.current = true;
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      },
      [getCtx, getPos],
    );

    const stopDraw = useCallback(() => {
      drawing.current = false;
    }, []);

    // Set up canvas context defaults and attach listeners
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }

      const onMouseDown = (e: MouseEvent) => startDraw(e);
      const onMouseMove = (e: MouseEvent) => draw(e);
      const onMouseUp = () => stopDraw();
      const onTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        startDraw(e);
      };
      const onTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        draw(e);
      };
      const onTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        stopDraw();
      };

      canvas.addEventListener('mousedown', onMouseDown);
      canvas.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      canvas.addEventListener('touchstart', onTouchStart, { passive: false });
      canvas.addEventListener('touchmove', onTouchMove, { passive: false });
      canvas.addEventListener('touchend', onTouchEnd, { passive: false });

      return () => {
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchend', onTouchEnd);
      };
    }, [startDraw, draw, stopDraw]);

    const clear = useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = getCtx();
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasStrokes.current = false;
    }, [getCtx]);

    const toBlob = useCallback((): Promise<Blob | null> => {
      const canvas = canvasRef.current;
      if (!canvas || !hasStrokes.current) return Promise.resolve(null);
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      });
    }, []);

    useImperativeHandle(ref, () => ({ toBlob, clear }), [toBlob, clear]);

    return (
      <div className={styles.container}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={width}
          height={height}
          aria-label="Signature drawing area"
          role="img"
        />
        <button type="button" className={styles.clearBtn} onClick={clear}>
          Clear
        </button>
      </div>
    );
  },
);
