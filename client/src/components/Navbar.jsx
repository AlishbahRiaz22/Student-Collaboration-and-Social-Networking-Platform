import { NavLink } from 'react-router-dom';

import './Navbar.css';

function Navbar() {
	return (
		<header className="navbar" role="banner">
			<div className="navbar__inner">
				<div className="navbar__logo">Nexus</div>

				<nav className="navbar__nav" aria-label="Primary">
					<NavLink
						to="/"
						end
						className={({ isActive }) =>
							`navbar__link${isActive ? ' navbar__link--active' : ''}`
						}
					>
						Home
					</NavLink>
					<NavLink
						to="/profile"
						className={({ isActive }) =>
							`navbar__link${isActive ? ' navbar__link--active' : ''}`
						}
					>
						Profile
					</NavLink>
				</nav>

				<div className="navbar__auth">
					<NavLink
						to="/login"
						className={({ isActive }) =>
							`navbar__auth-link${isActive ? ' navbar__link--active' : ''}`
						}
					>
						Login
					</NavLink>
					<NavLink
						to="/register"
						className={({ isActive }) =>
							`navbar__auth-link navbar__auth-link--cta${isActive ? ' navbar__link--active' : ''}`
						}
					>
						Register
					</NavLink>
				</div>
			</div>
		</header>
	);
}

export default Navbar;
