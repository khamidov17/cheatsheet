# CheatSheetAI

AI-powered exam cheatsheet generator with Vercel Web Analytics integration.

## Features

- Generate AI-powered cheatsheets from various sources
- Support for PDF, Word documents, and web URLs
- Premium features with Pro subscription
- Google OAuth authentication
- Admin dashboard for user management
- **Vercel Web Analytics** for tracking user engagement

## Getting Started

### Prerequisites

- Node.js >= 18
- npm, pnpm, yarn, or bun

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Vercel Web Analytics

This project includes Vercel Web Analytics for tracking visitor data and page views. The analytics scripts are integrated into all HTML pages.

For detailed information about Vercel Web Analytics setup, configuration, and usage, see the [Vercel Web Analytics Documentation](./docs/vercel-web-analytics.md).

### Quick Setup

The analytics are already integrated into:
- `public/index.html` - Main application page
- `public/admin.html` - Admin dashboard

When deployed to Vercel, analytics will automatically start tracking:
- Page views
- Visitor counts
- Navigation patterns

To view analytics data:
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click the **Analytics** tab

## Deployment

Deploy to Vercel:

```bash
vercel deploy
```

Or connect your Git repository to Vercel for automatic deployments on every push to main.

## Environment Variables

Configure these on Vercel or in your local environment:

- `ADMIN_USER` - Admin username (default: admin123)
- `ADMIN_PASS` - Admin password
- `PORT` - Server port (default: 3000)

## Project Structure

```
.
├── public/              # Static files
│   ├── css/            # Stylesheets
│   ├── js/             # Client-side JavaScript
│   ├── images/         # Image assets
│   ├── index.html      # Main application
│   └── admin.html      # Admin dashboard
├── docs/               # Documentation
│   └── vercel-web-analytics.md  # Analytics guide
├── server.js           # Express server
├── package.json        # Dependencies
└── vercel.json         # Vercel configuration
```

## Technologies

- **Backend**: Express.js, Node.js
- **Frontend**: HTML, CSS, JavaScript
- **Authentication**: Google OAuth
- **Analytics**: Vercel Web Analytics
- **File Processing**: pdf-parse, mammoth, cheerio
- **Deployment**: Vercel

## License

ISC
