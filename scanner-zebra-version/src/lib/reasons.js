const MAP = {
  not_registered: 'Not Registered',
  inactive: 'Account Inactive',
  outside_allowed_time: 'Outside Allowed Time',
  already_received: 'Already Received Meal',
  invalid_qr: 'Invalid QR Code',
  wrong_site: 'Wrong Site',
}

export function reasonLabel(reason) {
  if (!reason) return ''
  return MAP[reason] || 'Denied'
}
