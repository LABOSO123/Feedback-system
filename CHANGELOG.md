# Changelog

All notable changes to the KRA Feedback Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- ErrorBoundary component for better error handling
- LoadingSpinner component for improved UX
- Comprehensive API documentation
- Contributing guidelines
- Environment variable example file
- Enhanced code comments and JSDoc documentation

### Changed
- Improved error handling across the application
- Enhanced user experience with loading states

## [1.0.0] - 2024-01-XX

### Added
- Initial release of KRA Feedback Management System
- User authentication (register, login, password reset)
- Role-based access control (business, data_science, admin)
- Dashboard management (admin can create and manage dashboards)
- Chart/Visual management (admin can add charts to dashboards)
- Issue/Thread creation (business users can create feedback threads)
- Flexible feedback system (dashboard-only or dashboard + chart)
- Team management (admin can create teams, assign members, set team leads)
- User management (admin can add users, assign to teams, delete users)
- Issue assignment workflow (admin assigns issues to teams/users)
- Automatic status workflow:
  - `pending` - automatically set on thread creation
  - `in_progress` - automatically set on admin assignment
  - `complete` - set by data science team members
- Thread commenting system
- Real-time notifications via Socket.io
- Admin request system (data science can request dashboard changes)
- Dashboard progress tracking
- System statistics dashboard
- Advanced filtering (by status, team, dashboard)
- Priority system (users can second threads to increase priority)
- Leaderboard for team performance
- Password strength validation
- JWT-based authentication
- Axios interceptors for automatic token attachment

### Security
- Password hashing with bcryptjs
- SQL injection prevention (parameterized queries)
- Input validation with express-validator
- Role-based route protection
- Admin account creation restriction (only via script)

### Technical
- Node.js/Express backend
- React frontend with Tailwind CSS
- PostgreSQL database
- Socket.io for real-time features
- RESTful API architecture

---

## Version History

- **v1.0.0**: Initial stable release with core features

---

## Future Enhancements

- [ ] File attachment support
- [ ] Email notifications
- [ ] Advanced analytics and reporting
- [ ] Superset API integration
- [ ] Full-text search
- [ ] Unit and integration tests
- [ ] CI/CD pipeline
- [ ] Docker containerization
- [ ] Performance optimizations

