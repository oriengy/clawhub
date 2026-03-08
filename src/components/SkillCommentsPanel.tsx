import { useMutation, useQuery } from 'convex/react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Doc, Id } from '../../convex/_generated/dataModel'
import { isModerator } from '../lib/roles'

type SkillCommentsPanelProps = {
  skillId: Id<'skills'>
  isAuthenticated: boolean
  me: Doc<'users'> | null
}

function formatReportError(error: unknown) {
  if (error instanceof Error) {
    const cleaned = error.message
      .replace(/\[CONVEX[^\]]*\]\s*/g, '')
      .replace(/\[Request ID:[^\]]*\]\s*/g, '')
      .replace(/^Server Error Called by client\s*/i, '')
      .replace(/^ConvexError:\s*/i, '')
      .trim()
    if (cleaned && cleaned !== 'Server Error') return cleaned
  }
  return 'Failed to report comment'
}

export function SkillCommentsPanel({ skillId, isAuthenticated, me }: SkillCommentsPanelProps) {
  const addComment = useMutation(api.comments.add)
  const removeComment = useMutation(api.comments.remove)
  const reportComment = useMutation(api.comments.report)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<Id<'comments'> | null>(null)
  const [reportingCommentId, setReportingCommentId] = useState<Id<'comments'> | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reportError, setReportError] = useState<string | null>(null)
  const [reportNotice, setReportNotice] = useState<string | null>(null)
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const comments = useQuery(api.comments.listBySkill, { skillId, limit: 50 })

  const submitComment = async () => {
    const body = comment.trim()
    if (!body || isSubmitting) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await addComment({ skillId, body })
      setComment('')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteComment = async (commentId: Id<'comments'>) => {
    if (deletingCommentId) return
    setDeleteError(null)
    setDeletingCommentId(commentId)
    try {
      await removeComment({ commentId })
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete comment')
    } finally {
      setDeletingCommentId(null)
    }
  }

  const openReportForm = (commentId: Id<'comments'>) => {
    setReportingCommentId(commentId)
    setReportReason('')
    setReportError(null)
    setReportNotice(null)
    setIsSubmittingReport(false)
  }

  const closeReportForm = () => {
    setReportingCommentId(null)
    setReportReason('')
    setReportError(null)
    setIsSubmittingReport(false)
  }

  const submitReport = async (commentId: Id<'comments'>) => {
    if (isSubmittingReport) return
    const reason = reportReason.trim()
    if (!reason) {
      setReportError('Report reason required.')
      return
    }

    setIsSubmittingReport(true)
    setReportError(null)
    setReportNotice(null)
    try {
      const result = await reportComment({ commentId, reason })
      setReportNotice(
        result.alreadyReported ? 'You already reported this comment.' : 'Report submitted.',
      )
      closeReportForm()
    } catch (error) {
      setReportError(formatReportError(error))
      setIsSubmittingReport(false)
    }
  }

  return (
    <div className="card">
      <h2 className="section-title" style={{ fontSize: '1.2rem', margin: 0 }}>
        Comments
      </h2>
      {/* 中国部署版：隐藏评论表单和登录提示，仅展示已有评论 */}
      {deleteError ? <div className="report-dialog-error">{deleteError}</div> : null}
      {reportNotice ? <div className="stat">{reportNotice}</div> : null}
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {(comments ?? []).length === 0 ? (
          <div className="stat">No comments yet.</div>
        ) : (
          (comments ?? []).map((entry) => (
            <div key={entry.comment._id} className="comment-item">
              <div className="comment-body">
                <strong>@{entry.user?.handle ?? entry.user?.name ?? 'user'}</strong>
                <div className="comment-body-text">{entry.comment.body}</div>
              </div>
              {/* 中国部署版：隐藏评论操作按钮（删除、举报） */}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
