# Learnix

An AI-powered study platform designed for engineering students. Learnix combines course management, AI-assisted learning tools, and productivity features into a single, cohesive workspace.

## What You Can Do

### Learn Smarter with AI
- Upload a PDF lecture note and get a concise summary in seconds
- Ask the AI tutor any academic question and receive detailed explanations
- Generate flashcards from your study materials for quick revision
- Create practice quizzes to test your understanding before exams

### Collaborate with Peers
- Join official course channels to access shared resources
- Create private study groups and invite classmates
- Chat in real-time with group members about coursework
- Share files, notes, and resources within your courses

### Stay Organized
- Keep all your course materials in one searchable location
- Upload and organize PDFs, lecture slides, and reference documents
- Track your study sessions with the built-in focus timer
- Manage tasks and deadlines with the todo list

### Typical Workflow
1. Sign in with your institutional email
2. Join your enrolled courses or create a study group
3. Upload lecture PDFs to the course resource hub
4. Use AI tools to summarize notes, generate flashcards, or create practice quizzes
5. Collaborate with classmates via real-time chat
6. Track your study time with focus sessions

## Features

### Core Functionality
- **Course Hub** - Organize courses and study groups with file sharing and resource management
- **Study Groups** - Create invite-only or open study groups with member management
- **Real-time Chat** - Course and group chat rooms powered by WebSockets

### AI-Powered Tools
- **AI Doubt Solver** - Chat with an AI tutor for instant explanations and academic assistance
- **PDF Summarizer** - Generate concise summaries from lecture notes and documents
- **Flashcard Generator** - Automatically create flashcards from uploaded PDFs
- **Quiz Generator** - Generate practice quizzes from course materials

### Productivity
- **Focus Timer** - Built-in Pomodoro timer with session tracking
- **Todo List** - Task management with completion tracking
- **Profile & Stats** - View study statistics and progress

## Tech Stack

### Frontend
- Next.js 14
- React 18
- Tailwind CSS
- Firebase Authentication
- Socket.IO Client
- Framer Motion

### Backend
- Node.js with Express 5
- Prisma ORM
- PostgreSQL
- Socket.IO
- Cloudinary (file storage)
- Firebase Admin SDK

### ML Service
- FastAPI
- Google Gemini AI
- pdfplumber (PDF processing)

## Project Structure

```
learnix/
├── frontend/          # Next.js application
│   └── src/
│       ├── app/       # App router pages
│       ├── components/# React components
│       ├── context/   # React context providers
│       └── lib/       # Utilities and config
├── backend/           # Express.js API server
│   └── src/
│       ├── controllers/
│       ├── middlewares/
│       ├── models/
│       └── routes/
└── ml/                # FastAPI ML service
```

## Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL
- Firebase project (for authentication)
- Cloudinary account (for file storage)
- Google AI API key (for Gemini)

## Environment Variables

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:9000
NEXT_PUBLIC_SOCKET_URL=http://localhost:9000
```

### Backend (`backend/.env`)

```env
PORT=9000
DATABASE_URL=postgresql://user:password@localhost:5432/learnix
FRONTEND_URL=http://localhost:3000
ML_SERVICE_URL=http://localhost:8000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### ML Service (`ml/.env`)

```env
GOOGLE_API_KEY=your_gemini_api_key
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/learnix.git
cd learnix
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. Backend Setup

```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

### 4. ML Service Setup

```bash
cd ml
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Running the Application

Start all three services:

| Service  | Command           | URL                    |
|----------|-------------------|------------------------|
| Frontend | `npm run dev`     | http://localhost:3000  |
| Backend  | `npm run dev`     | http://localhost:9000  |
| ML       | `uvicorn main:app`| http://localhost:8000  |

## Database

The application uses PostgreSQL with Prisma ORM. Key models include:

- **User** - Authentication and profile data
- **Course** - Courses and study groups
- **CourseEnrollment** - User-course relationships
- **ChatMessage** - Real-time chat messages
- **AIChat / AIChatMessage** - AI conversation history
- **fileSummary / fileFlashcards / fileQuiz** - AI-generated content

Run migrations:

```bash
cd backend
npx prisma migrate dev
```

## API Endpoints

### Authentication
- `POST /auth/login` - User login/registration

### Courses
- `GET /api/courses` - List enrolled courses
- `POST /api/courses/join` - Join a course
- `POST /api/courses/create-study-group` - Create study group

### AI Tools
- `POST /api/courses/summarize/:courseId` - Summarize PDF
- `POST /api/courses/flashcards/:courseId` - Generate flashcards
- `POST /api/courses/quiz/:courseId` - Generate quiz
- `POST /api/courses/send-ai-chat-message/:chatId` - Chat with AI

### Chat
- `GET /api/chat/:courseId/history` - Get chat history

## Deployment

### Backend (Node.js)

Ensure `prisma generate` runs during build:

```json
{
  "scripts": {
    "build": "prisma generate",
    "postinstall": "prisma generate"
  }
}
```

### Frontend (Vercel)

Set environment variables in your Vercel project settings.

### ML Service

Deploy as a containerized service or use platforms like Railway, Render, or Google Cloud Run.

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

