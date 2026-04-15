import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import styles from './ShareModal.module.css';

interface ShareModalProps {
  scriptId: string;
  scriptTitle: string;
  visible: boolean;
  onClose: () => void;
}

export function ShareModal({ scriptId, scriptTitle, visible, onClose }: ShareModalProps) {
  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [shareType, setShareType] = useState<'view' | 'edit'>('view');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!visible) return null;

  const handleSend = async () => {
    if (!email.trim() || !user) return;
    setSending(true);
    setError(null);

    try {
      const { error: fnError } = await supabase.functions.invoke('send-share-email', {
        body: {
          scriptId,
          recipientEmail: email.trim(),
          senderName: user.email?.split('@')[0] ?? 'A writer',
          message: message.trim() || undefined,
          shareType,
        },
      });

      if (fnError) throw fnError;
      setSent(true);
      setEmail('');
      setMessage('');
    } catch {
      setError('Failed to send. Check the email and try again.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSent(false);
    setError(null);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Share script">
        <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">✕</button>

        <h2 className={styles.heading}>Share Script</h2>
        <p className={styles.scriptName}>{scriptTitle}</p>

        {sent ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>✓</div>
            <p className={styles.successText}>Invite sent to {email || 'collaborator'}</p>
            <button className={styles.doneBtn} onClick={handleClose}>Done</button>
          </div>
        ) : (
          <>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="share-email">Email address</label>
              <input
                id="share-email"
                className={styles.input}
                type="email"
                placeholder="collaborator@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Permission</label>
              <div className={styles.toggleGroup}>
                <button
                  className={shareType === 'view' ? styles.toggleActive : styles.toggle}
                  onClick={() => setShareType('view')}
                  type="button"
                >
                  View only
                </button>
                <button
                  className={shareType === 'edit' ? styles.toggleActive : styles.toggle}
                  onClick={() => setShareType('edit')}
                  type="button"
                >
                  Can edit
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="share-message">Message (optional)</label>
              <textarea
                id="share-message"
                className={styles.textarea}
                placeholder="Check out my latest draft..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={!email.trim() || sending}
            >
              {sending ? 'Sending...' : 'Send Invite'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
