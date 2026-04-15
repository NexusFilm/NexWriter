import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { AgreementRepository } from '@/repositories/AgreementRepository';
import { FileUploadService, buildStoragePath } from '@/services/FileUploadService';
import { SignatureCanvas } from '@/components/agreements/SignatureCanvas';
import type { SignatureCanvasRef } from '@/components/agreements/SignatureCanvas';
import type { AgreementInstance, AgreementTemplate } from '@/types/productionTools';
import styles from './AgreementEditorPage.module.css';

const agreementRepo = new AgreementRepository();
const uploadService = new FileUploadService();

export function AgreementEditorPage() {
  const { instanceId } = useParams<{ instanceId: string }>();
  const user = useAuthStore((s) => s.user);
  const sigRef = useRef<SignatureCanvasRef>(null);

  const [instance, setInstance] = useState<AgreementInstance | null>(null);
  const [template, setTemplate] = useState<AgreementTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load instance and its template
  useEffect(() => {
    if (!instanceId || !user) return;
    let cancelled = false;

    async function load() {
      try {
        const inst = await agreementRepo.getInstance(instanceId!);
        if (cancelled) return;
        setInstance(inst);
        setFieldValues(inst.fieldValues);

        // Fetch templates to find the matching one
        const templates = await agreementRepo.getTemplates(user!.id);
        if (cancelled) return;
        const tpl = templates.find((t) => t.id === inst.templateId) ?? null;
        setTemplate(tpl);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load agreement');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [instanceId, user]);

  const handleFieldChange = useCallback((key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  // Save field values (draft)
  const handleSave = useCallback(async () => {
    if (!instance) return;
    setSaving(true);
    setError(null);
    try {
      await agreementRepo.updateInstance(instance.id, { fieldValues });
      setInstance((prev) => prev ? { ...prev, fieldValues } : prev);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [instance, fieldValues]);

  // Sign: upload signature + save as signed
  const handleSign = useCallback(async () => {
    if (!instance || !user) return;
    setSaving(true);
    setError(null);
    try {
      let signaturePath = instance.signaturePath;

      // Upload signature if canvas has strokes
      const blob = await sigRef.current?.toBlob();
      if (blob) {
        const filename = `sig_${instance.id}_${Date.now()}.png`;
        const storagePath = buildStoragePath('signatures', user.id, filename);
        const sigFile = new File([blob], filename, { type: 'image/png' });
        signaturePath = await uploadService.uploadFile('production-assets', storagePath, sigFile);
      }

      await agreementRepo.updateInstance(instance.id, {
        fieldValues,
        signaturePath,
        status: 'signed',
      });

      setInstance((prev) =>
        prev ? { ...prev, fieldValues, signaturePath, status: 'signed' } : prev,
      );
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign agreement');
    } finally {
      setSaving(false);
    }
  }, [instance, user, fieldValues]);

  if (loading) {
    return <div className={styles.loading}>Loading agreement…</div>;
  }

  if (!instance) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>Agreement not found.</div>
      </div>
    );
  }

  const isSigned = instance.status === 'signed';

  return (
    <div className={styles.page}>
      <Link to="/agreements" className={styles.backLink}>
        ← Back to Agreements
      </Link>
      <h1 className={styles.title}>{template?.name ?? 'Agreement'}</h1>

      {error && <div className={styles.error}>{error}</div>}

      {/* Dynamic field form */}
      {template && template.fields.length > 0 ? (
        <div className={styles.fieldForm}>
          {template.fields.map((field) => (
            <div key={field.key} className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor={`field-${field.key}`}>
                {field.label}
                {field.required && ' *'}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  id={`field-${field.key}`}
                  className={styles.fieldTextarea}
                  value={fieldValues[field.key] ?? ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  disabled={isSigned}
                  required={field.required}
                />
              ) : (
                <input
                  id={`field-${field.key}`}
                  type={field.type === 'date' ? 'date' : 'text'}
                  className={styles.fieldInput}
                  value={fieldValues[field.key] ?? ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  disabled={isSigned}
                  required={field.required}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
          {template?.storagePath
            ? 'This is a custom uploaded PDF template — no fillable fields defined.'
            : 'No fields defined for this template.'}
        </p>
      )}

      {/* Signature */}
      <h2 className={styles.sectionTitle}>Signature</h2>
      {isSigned && instance.signaturePath ? (
        <p style={{ color: '#6fcf97', marginBottom: 'var(--space-4)' }}>
          ✓ Agreement signed
        </p>
      ) : (
        <SignatureCanvas ref={sigRef} />
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving || isSigned}
        >
          {saving ? 'Saving…' : 'Save Draft'}
        </button>
        {!isSigned && (
          <button
            type="button"
            className={styles.signBtn}
            onClick={handleSign}
            disabled={saving}
          >
            {saving ? 'Signing…' : 'Sign & Save'}
          </button>
        )}
        {saved && <span className={styles.savedMsg}>Saved ✓</span>}
      </div>
    </div>
  );
}
