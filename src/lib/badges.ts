import type { Doc, Id } from '../../convex/_generated/dataModel'

type BadgeKind = Doc<'skillBadges'>['kind']

type SkillBadgeMap = Partial<Record<BadgeKind, { byUserId: Id<'users'>; at: number }>>

type SkillLike = { badges?: SkillBadgeMap | null }

type BadgeLabel = '已弃用' | '官方' | '精选'

export function isSkillHighlighted(skill: SkillLike) {
  return Boolean(skill.badges?.highlighted)
}

export function isSkillOfficial(skill: SkillLike) {
  return Boolean(skill.badges?.official)
}

export function isSkillDeprecated(skill: SkillLike) {
  return Boolean(skill.badges?.deprecated)
}

export function getSkillBadges(skill: SkillLike): BadgeLabel[] {
  const badges: BadgeLabel[] = []
  if (isSkillDeprecated(skill)) badges.push('已弃用')
  if (isSkillOfficial(skill)) badges.push('官方')
  if (isSkillHighlighted(skill)) badges.push('精选')
  return badges
}
