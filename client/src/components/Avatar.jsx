const Avatar = ({ src, name = '', alt, size = 44, className = '' }) => {
	const label = alt || name || 'User avatar'
	const fallback = (name || 'U').trim().charAt(0).toUpperCase()

	const avatarStyle = {
		width: size,
		height: size,
		borderRadius: '50%',
		objectFit: 'cover',
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		background: '#dfe7f1',
		color: '#34506c',
		fontWeight: 700,
		flexShrink: 0
	}

	if (src) {
		return <img src={src} alt={label} className={className} style={avatarStyle} />
	}

	return (
		<div aria-label={label} className={className} style={avatarStyle}>
			{fallback}
		</div>
	)
}

export default Avatar