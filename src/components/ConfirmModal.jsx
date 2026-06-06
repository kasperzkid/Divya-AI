import { AlertTriangle, X } from 'lucide-react'

function ConfirmModal({ isOpen, message, onConfirm, onCancel, appLanguage }) {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <button className="confirm-close" onClick={onCancel}>
          <X size={16} />
        </button>
        <div className="confirm-icon">
          <AlertTriangle size={24} />
        </div>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn confirm-cancel" onClick={onCancel}>
            {appLanguage === 'English' ? 'Cancel' : 'ሰርዝ'}
          </button>
          <button className="confirm-btn confirm-delete" onClick={onConfirm}>
            {appLanguage === 'English' ? 'Delete' : 'ሰርዝ'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
