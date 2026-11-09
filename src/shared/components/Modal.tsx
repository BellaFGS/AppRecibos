import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Icon } from './ui';

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'regular' | 'wide';
};

/** Modal reutilizável com foco, teclado e acessibilidade gerenciados pelo Radix UI. */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'regular',
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="app-modal-overlay" />
        <Dialog.Content className={`app-modal-content app-modal-${size}`}>
          <header className="app-modal-header">
            <div>
              <Dialog.Title className="app-modal-title">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="app-modal-description">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button className="app-modal-close" type="button" aria-label="Fechar modal">
                <Icon name="close" size={18} />
              </button>
            </Dialog.Close>
          </header>
          <div className="app-modal-body">{children}</div>
          {footer && <footer className="app-modal-footer">{footer}</footer>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
