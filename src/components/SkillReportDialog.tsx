type SkillReportDialogProps = {
  isOpen: boolean
  isSubmitting: boolean
  reportReason: string
  reportError: string | null
  onReasonChange: (value: string) => void
  onCancel: () => void
  onSubmit: () => void
}

export function SkillReportDialog({
  isOpen,
  isSubmitting,
  reportReason,
  reportError,
  onReasonChange,
  onCancel,
  onSubmit,
}: SkillReportDialogProps) {
  if (!isOpen) return null

  return (
    <div className="report-dialog-backdrop">
      <div className="report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-title">
        <h2 id="report-title" className="section-title" style={{ margin: 0, fontSize: '1.1rem' }}>
          举报技能
        </h2>
        <p className="section-subtitle" style={{ margin: 0 }}>
          请描述问题，以便管理员快速审核。
        </p>
        <form
          className="report-dialog-form"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <textarea
            className="report-dialog-textarea"
            aria-label="举报原因"
            placeholder="管理员需要了解什么？"
            value={reportReason}
            onChange={(event) => onReasonChange(event.target.value)}
            rows={5}
            disabled={isSubmitting}
          />
          {reportError ? <p className="report-dialog-error">{reportError}</p> : null}
          <div className="report-dialog-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                if (!isSubmitting) onCancel()
              }}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button type="submit" className="btn" disabled={isSubmitting}>
              {isSubmitting ? '提交中…' : '提交举报'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
