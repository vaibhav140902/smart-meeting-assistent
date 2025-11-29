A production-ready platform for recording, transcribing, and summarizing meetings using AI.

## 🚀 Features

- Real-time meeting transcription
- AI-powered summaries
- Action item tracking
- Team collaboration
- Google Meet integration
- AWS cloud storage
- Real-time updates via Socket.io

## 🛠️ Tech Stack

**Backend:** Node.js, Express, PostgreSQL, MongoDB, Redis
**Frontend:** React, Redux, Socket.io
**Cloud:** AWS (S3, RDS), Docker
**AI:** OpenAI GPT, Deepgram

## 📋 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js >= 18
- Git

### Installation

```bash
# Clone repo
git clone <repo-url>
cd smart-meeting-assistant

# Setup env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Update .env with your API keys
nano backend/.env
nano frontend/.env

# Start with Docker
docker-compose up

# Or manually
cd backend && npm install && npm run dev
cd frontend && npm install && npm start
```

## 📚 Project Structure

```
smart-meeting-assistant/
├── backend/
│   ├── src/
│   │   ├── config/      (Database, Redis, AWS, Google)
│   │   ├── models/      (User, Team, Meeting, ActionItem)
│   │   ├── services/    (Auth, Transcription, AI, Email)
│   │   ├── controllers/ (Route handlers)
│   │   ├── routes/      (API endpoints)
│   │   ├── middleware/  (Auth, Validation, Error)
│   │   └── utils/       (Helpers, Errors)
│   ├── package.json
│   ├── server.js
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── redux/       (State management)
│   │   ├── services/    (API calls)
│   │   ├── components/  (React components)
│   │   ├── pages/       (Page components)
│   │   ├── hooks/       (Custom hooks)
│   │   ├── utils/       (Helpers)
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get profile

### Meetings
- `GET /api/meetings` - List meetings
- `POST /api/meetings` - Create meeting
- `GET /api/meetings/:id` - Get meeting
- `PUT /api/meetings/:id` - Update meeting

### Action Items
- `GET /api/action-items` - List items
- `POST /api/action-items` - Create item
- `PUT /api/action-items/:id` - Update item

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📦 Deployment

### AWS Deployment
1. Push to GitHub
2. CI/CD triggers deployment
3. Docker builds and pushes to ECR
4. ECS updates services

See `DEPLOYMENT.md` for details.

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Submit pull request

## 📄 License

MIT

## 👤 Author

Your Name

---

Made with ❤️ for better meetings

// ============================================================
// FILE: .env.example (BACKEND)
// Purpose: Template for environment variables
// ============================================================

# Server
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=smart_meeting_assistant

# MongoDB
MONGO_URI=mongodb://localhost:27017/smart_meeting_assistant

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRE=30d

# Google
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=smart-meeting-assistant-bucket

# APIs
DEEPGRAM_API_KEY=your_deepgram_api_key
OPENAI_API_KEY=your_openai_api_key
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@smartmeetingassistant.com

// ============================================================
// FILE: .env.example (FRONTEND)
// Purpose: Template for frontend env vars
// ============================================================

REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_ENVIRONMENT=development