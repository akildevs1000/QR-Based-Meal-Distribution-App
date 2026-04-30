export default function Checkbox({
  checked = false,
  indeterminate = false,
  onChange,
  disabled = false,
  tone = 'blue',
  size = 18,
  className = '',
  labelClassName = 'text-sm text-slate-300',
  children,
  id,
  'aria-label': ariaLabel,
}) {
  const icon = indeterminate
    ? 'indeterminate_check_box'
    : checked
      ? 'check_box'
      : 'check_box_outline_blank'

  const on = checked || indeterminate
  const onColor = tone === 'red' ? 'text-red-400' : 'text-blue-400'
  const onHover = tone === 'red' ? 'group-hover/cb:text-red-300' : 'group-hover/cb:text-blue-300'
  const offColor = 'text-slate-500'
  const offHover = 'group-hover/cb:text-slate-300'

  const iconColor = on
    ? (disabled ? onColor : `${onColor} ${onHover}`)
    : (disabled ? offColor : `${offColor} ${offHover}`)

  const handleClick = (e) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    onChange?.(!checked, e)
  }

  return (
    <button
      type="button"
      id={id}
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleClick}
      className={[
        'group/cb inline-flex items-center gap-2 transition-colors rounded-sm',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        children ? labelClassName : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      <span
        className={`material-symbols-outlined transition-colors shrink-0 ${iconColor}`}
        style={{ fontSize: size }}
      >
        {icon}
      </span>
      {children}
    </button>
  )
}
