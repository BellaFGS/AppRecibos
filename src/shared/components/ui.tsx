import React, { useEffect, useRef } from 'react';
import type { IconName } from '../../domain/models';

export function Icon({ name, size = 19 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></>,
    calculator: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2m4 0h2M8 15h2m4 0h2M8 18h2m4 0h2"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></>,
    receipt: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z"/><path d="M8 8h8M8 12h8M8 16h4"/></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5M12 7v5l3 2"/></>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.8-3.2 3.3-5 7.5-5s6.7 1.8 7.5 5"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    trend: <><path d="m3 17 6-6 4 4 8-9"/><path d="M16 6h5v5"/></>,
    wallet: <><path d="M4 6h15a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V6Z"/><path d="M4 6V4h14M16 13h5"/><circle cx="16" cy="13" r=".5" fill="currentColor"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/></>,
    edit: <><path d="m4 16-.8 4.8L8 20l11-11-4-4L4 16Z"/><path d="m13 6 4 4"/></>,
    download: <><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></>,
    share: <><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>,
    dollar: <><circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.8-.7-1.7-1-3-1-1.6 0-2.7.8-2.7 2 0 3.1 5.7 1.4 5.7 4.5 0 1.3-1.2 2.2-3 2.2-1.4 0-2.5-.4-3.2-1.2M12 5.5v13"/></>,
    spark: <><path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2ZM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></>,
    signature: <><path d="M4 17c3.2-4.2 5-8.6 7.1-8.6 2.2 0 .2 6.2 2.2 6.2 1.7 0 3.1-3.6 4.4-3.6 1.1 0 1.1 2 2.3 2"/><path d="M4 20h16"/></>,
    target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="m12 12 5-5"/></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    package: <><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>,
    filter: <><path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z"/></>,
    back: <><path d="M19 12H5M11 18l-6-6 6-6"/></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

export function Mascot({ size = 'normal', mood = 'happy' }: { size?: 'small' | 'normal' | 'large'; mood?: 'happy' | 'success' | 'empty' | 'thinking' }) {
  return <div className={`mascot mascot-${size} mascot-${mood}`} aria-label="Coruja mascote do PJ OWL">
    <img src="/assets/pj-owl-logo.png" alt="Coruja do PJ OWL" />
  </div>;
}

export function Button({ children, variant = 'primary', icon, onClick, type = 'button', disabled = false, className = '' }: { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'; icon?: IconName; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; className?: string }) {
  return <button type={type} disabled={disabled} className={`button button-${variant} ${className}`} onClick={onClick}>{icon && <Icon name={icon} size={17} />}{children}</button>;
}

export function Field({ label, children, hint, className = '' }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return <label className={`field ${className}`}><span className="field-label">{label}</span>{children}{hint && <span className="field-hint">{hint}</span>}</label>;
}

export function EmptyState({ title, text, action, onAction, mood = 'empty' }: { title: string; text: string; action?: string; onAction?: () => void; mood?: 'empty' | 'thinking' }) {
  return <div className="empty-state"><Mascot size="normal" mood={mood} /><div><h3>{title}</h3><p>{text}</p>{action && <Button variant="soft" icon="plus" onClick={onAction}>{action}</Button>}</div></div>;
}

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return <div className="toast"><span className="toast-icon"><Icon name="check" size={15} /></span><span>{message}</span><button onClick={onClose} aria-label="Fechar"><Icon name="close" size={15} /></button></div>;
}

export function SignaturePad({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (value) { const image = new Image(); image.onload = () => context.drawImage(image, 0, 0); image.src = value; }
  }, [value]);
  const point = (event: React.PointerEvent<HTMLCanvasElement>) => { const canvas = canvasRef.current; if (!canvas) return null; const rect = canvas.getBoundingClientRect(); return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height }; };
  const start = (event: React.PointerEvent<HTMLCanvasElement>) => { const canvas = canvasRef.current; const p = point(event); if (!canvas || !p) return; drawing.current = true; canvas.setPointerCapture(event.pointerId); const context = canvas.getContext('2d'); if (context) { context.beginPath(); context.moveTo(p.x, p.y); } };
  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => { if (!drawing.current) return; const p = point(event); const context = canvasRef.current?.getContext('2d'); if (!p || !context) return; context.lineWidth = 3; context.lineCap = 'round'; context.strokeStyle = '#3b3150'; context.lineTo(p.x, p.y); context.stroke(); };
  const stop = () => { if (!drawing.current) return; drawing.current = false; const canvas = canvasRef.current; if (canvas) onChange(canvas.toDataURL('image/png')); };
  const clear = () => { const canvas = canvasRef.current; const context = canvas?.getContext('2d'); if (canvas && context) { context.clearRect(0, 0, canvas.width, canvas.height); onChange(''); } };
  return <div className="signature-field"><div className="signature-label"><span>{label}</span><button type="button" onClick={clear}>Limpar</button></div><canvas ref={canvasRef} width={640} height={190} onPointerDown={start} onPointerMove={draw} onPointerUp={stop} onPointerLeave={stop} /><p>Desenhe com o dedo ou mouse dentro da área.</p></div>;
}

export function ConfirmDialog({ title, text, onCancel, onConfirm }: { title: string; text: string; onCancel: () => void; onConfirm: () => void }) { return <div className="modal-backdrop"><div className="modal"><div className="modal-icon"><Icon name="trash" /></div><h2>{title}</h2><p>{text}</p><div className="modal-actions"><Button variant="ghost" onClick={onCancel}>Cancelar</Button><Button variant="danger" onClick={onConfirm}>Excluir</Button></div></div></div>; }

