# Contributing to KRA Feedback Management System

Thank you for your interest in contributing to the KRA Feedback Management System! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- A clear, descriptive title
- Steps to reproduce the bug
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (OS, Node version, etc.)

### Suggesting Features

We welcome feature suggestions! Please create an issue with:
- A clear description of the feature
- Use cases and benefits
- Any mockups or examples (if applicable)

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test your changes**
   - Ensure the application runs without errors
   - Test the specific feature you added/modified
   - Check for any console errors

5. **Commit your changes**
   ```bash
   git commit -m "feat: Add your feature description"
   ```
   Use conventional commit messages:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `style:` for formatting
   - `refactor:` for code refactoring
   - `test:` for tests
   - `chore:` for maintenance

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Provide a clear description of your changes
   - Reference any related issues
   - Add screenshots for UI changes

## 📋 Code Style Guidelines

### JavaScript/Node.js
- Use ES6+ features
- Follow async/await pattern (prefer over callbacks)
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Handle errors appropriately

### React
- Use functional components with hooks
- Keep components small and focused
- Use meaningful prop names
- Extract reusable logic into custom hooks
- Use Tailwind CSS for styling

### Database
- Use parameterized queries (prevent SQL injection)
- Add appropriate indexes
- Document complex queries

## 🧪 Testing

Before submitting:
- Test your changes thoroughly
- Ensure no console errors
- Test on different user roles (business, data_science, admin)
- Verify database operations work correctly

## 📝 Documentation

- Update README.md if you add new features
- Add comments to complex code sections
- Update API documentation if endpoints change
- Keep CHANGELOG.md updated

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm run install-all`
3. Set up the database (see SETUP.md)
4. Create `.env` file from `.env.example`
5. Run the application: `npm run dev`

## 📞 Questions?

Feel free to open an issue for any questions or clarifications!

Thank you for contributing! 🎉

