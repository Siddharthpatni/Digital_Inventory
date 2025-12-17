# Contributing to Digital Inventory

First off, thank you for considering contributing to Digital Inventory! It's people like you that make this project such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by respect and professionalism. Please be kind and courteous to all contributors.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if applicable**
- **Note your environment** (OS, Node.js version, browser)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any similar features in other applications**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure your code follows the existing style
4. Make sure your code lints without errors
5. Write a clear commit message
6. Issue the pull request!

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/Digital_Inventory.git
cd Digital_Inventory

# Install dependencies
npm install

# Start development server
npm run dev
```

## Coding Standards

### JavaScript

- Use ES6+ features (arrow functions, destructuring, etc.)
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### CSS

- Use CSS variables for colors and spacing
- Follow BEM naming convention where applicable
- Keep selectors specific but not overly complex
- Add comments for major sections

### Commits

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters
- Reference issues and pull requests after the first line

### Example Commit Messages

```
Add barcode scanning feature

- Implement Quagga.js integration
- Add scanner modal UI
- Update inventory when barcode detected

Fixes #123
```

## Project Structure

- `/server` - Backend Express.js code
- `/public` - Frontend HTML/CSS/JS
- `/data` - Database files (not committed)
- `/docs` - Documentation and screenshots

## Testing

Before submitting a pull request:

1. Test all CRUD operations
2. Verify responsive design on mobile/tablet
3. Check dark mode compatibility
4. Test with different browser

s
5. Ensure no console errors

## Questions?

Feel free to open an issue with the question label or reach out to the maintainers.

---

Thank you for contributing to Digital Inventory! 🎉
