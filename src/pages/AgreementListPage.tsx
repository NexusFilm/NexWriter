import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { AgreementRepository } from '@/repositories/AgreementRepository';
import { FileUploadService, buildStoragePath } from '@/services/FileUploadService';
import type { AgreementTemplate, AgreementInstance } from '@/types/productionTools';
import styles from './AgreementListPage.module.css';

const agreementRepo = new AgreementRepository();
const uploadService = new FileUploadService();

const MAX_PDF_SIZE_MB = 10;
const ALLOWED_PDF_TYPES = ['application/pdf'];

export function AgreementListPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<AgreementTemplate[]>([]);
  const [instances, setInstances] = useState<AgreementInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load templates and instances on mount
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      try {
        const [tpls, insts] = await Promise.all([
          agreementRepo.getTemplates(user!.id),
          agreementRepo.getInstances(user!.id),
        ]);
        if (cancelled) return;
        setTemplates(tpls);
        setInstances(insts);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load agreements');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  // Start a new agreement instance from a template
  const handleSelectTemplate = useCallback(
    async (template: AgreementTemplate) => {
      if (!user) return;
      try {
        const instance = await agreementRepo.createInstance({
          userId: user.id,
          templateId: template.id,
          fieldValues: {},
          signaturePath: null,
          status: 'draft',
        });
        navigate(`/agreements/${instance.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create agreement');
      }
    },
    [user, navigate],
  );

  // Custom PDF upload
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;

      // Reset input so the same file can be re-selected
      e.target.value = '';

      if (!uploadService.validateFileType(file, ALLOWED_PDF_TYPES)) {
        setError('Only PDF files are accepted.');
        return;
      }
      if (!uploadService.validateFileSize(file, MAX_PDF_SIZE_MB)) {
        setError(`File exceeds the ${MAX_PDF_SIZE_MB} MB limit.`);
        return;
      }

      setUploading(true);
      setError(null);

      try {
        const storagePath = buildStoragePath('agreements', user.id, file.name);
        await uploadService.uploadFile('production-assets', storagePath, file);

        const template = await agreementRepo.createTemplate({
          userId: user.id,
          templateType: 'custom',
          name: file.name.replace(/\.pdf$/i, ''),
          fields: [],
          storagePath,
        });

        setTemplates((prev) => [...prev, template]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    [user],
  );

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return iso;
    }
  };

  const templateLabel = (type: AgreementTemplate['templateType']) => {
    const labels: Record<string, string> = {
      model_release: 'Model Release',
      location_release: 'Location Release',
      crew_deal_memo: 'Crew Deal Memo',
      custom: 'Custom',
    };
    return labels[type] ?? type;
  };

  // Find template name for an instance
  const templateNameForInstance = (inst: AgreementInstance) => {
    const tpl = templates.find((t) => t.id === inst.templateId);
    return tpl?.name ?? 'Agreement';
  };

  if (loading) {
    return <div className={styles.loading}>Loading agreements…</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Agreements</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Template Grid */}
      <h2 className={styles.sectionTitle}>Templates</h2>
      <div className={styles.templateGrid}>
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            className={styles.templateCard}
            onClick={() => handleSelectTemplate(tpl)}
          >
            <span className={styles.templateName}>{tpl.name}</span>
            <span className={styles.templateType}>{templateLabel(tpl.templateType)}</span>
          </button>
        ))}
      </div>

      {/* Custom upload */}
      <div className={styles.uploadArea}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          hidden
          onChange={handleFileChange}
        />
        <button
          type="button"
          className={styles.uploadBtn}
          onClick={handleUploadClick}
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : 'Upload Custom PDF'}
        </button>
        <span className={styles.uploadHint}>PDF only, max 10 MB</span>
      </div>

      {/* Agreement Instances */}
      <h2 className={styles.sectionTitle}>Your Agreements</h2>
      {instances.length === 0 ? (
        <div className={styles.empty}>
          <p>No agreements yet. Select a template above to get started.</p>
        </div>
      ) : (
        <div className={styles.instanceList}>
          {instances.map((inst) => (
            <Link
              key={inst.id}
              to={`/agreements/${inst.id}`}
              className={styles.instanceRow}
            >
              <span className={styles.instanceName}>
                {templateNameForInstance(inst)}
              </span>
              <div className={styles.instanceMeta}>
                <span
                  className={`${styles.statusBadge} ${
                    inst.status === 'signed' ? styles.statusSigned : styles.statusDraft
                  }`}
                >
                  {inst.status}
                </span>
                <span className={styles.instanceDate}>
                  {formatDate(inst.updatedAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
