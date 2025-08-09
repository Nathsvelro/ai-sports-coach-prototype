# AI Sports Coach Frontend

This is a Next.js application with shadcn/ui components for the AI Sports Coach prototype.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Form Handling**: React Hook Form + Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

The development server will start at [http://localhost:3000](http://localhost:3000).

## Available Components

The following shadcn/ui components are pre-installed and ready to use:

- **Button** - Various button variants and styles
- **Card** - Content containers with header, content, and footer
- **Input** - Form input fields
- **Badge** - Status indicators and labels
- **Progress** - Progress bars and indicators
- **Tabs** - Tabbed navigation
- **Dialog** - Modal dialogs
- **Sheet** - Slide-out panels
- **Form** - Form components with validation
- **Avatar** - User profile images
- **Label** - Form labels
- **Separator** - Visual dividers

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/          # React components
│   └── ui/            # shadcn/ui components
└── lib/                # Utility functions
    └── utils.ts        # shadcn/ui utilities
```

## Customization

### Adding New Components

To add more shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

### Styling

The project uses Tailwind CSS v4 with CSS variables for theming. Customize colors and styles in `src/app/globals.css`.

## Development

- **Hot Reload**: Changes are reflected immediately in development
- **TypeScript**: Full type safety and IntelliSense support
- **ESLint**: Code quality and consistency
- **Tailwind**: Utility-first CSS framework

## Deployment

This project can be deployed to:
- Vercel (recommended for Next.js)
- Netlify
- Any Node.js hosting platform

Build the project with `npm run build` and serve the `out` directory.
