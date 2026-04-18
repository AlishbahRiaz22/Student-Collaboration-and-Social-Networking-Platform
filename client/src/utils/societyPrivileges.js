export const PRIVILEGE_LEVELS = ['creator', 'admin', 'moderator', 'member']

export const PRIVILEGE_GUIDE = {
  creator: {
    label: 'Founder',
    description: 'Full control over the society. Can edit settings, manage members, assign roles, ban users, and delete content.',
    grants: ['Edit all settings', 'Manage people', 'Set invite-only access', 'Ban or remove users', 'Manage sections']
  },
  admin: {
    label: 'Administrator',
    description: 'Can manage society settings and people, including access policy, invitations, and bans.',
    grants: ['Edit settings', 'Invite or remove users', 'Change privilege levels', 'Set invite-only access', 'Ban users']
  },
  moderator: {
    label: 'Moderator',
    description: 'Can help run the society day-to-day by moderating content and section activity.',
    grants: ['Manage sections', 'Assign section members', 'Moderate posts', 'Help enforce rules']
  },
  member: {
    label: 'Member',
    description: 'Standard membership. Can participate in the society according to its posting and section settings.',
    grants: ['View society content', 'Post where allowed', 'Join assigned sections', 'Follow society updates']
  }
}

export const getPrivilegeLevel = (member) => member?.privilegeLevel || member?.role || 'member'

export const getPrivilegeInfo = (memberOrLevel) => {
  const level = typeof memberOrLevel === 'string'
    ? memberOrLevel
    : getPrivilegeLevel(memberOrLevel)

  return PRIVILEGE_GUIDE[level] || PRIVILEGE_GUIDE.member
}

export const getPrivilegeLabel = (memberOrLevel) => getPrivilegeInfo(memberOrLevel).label
