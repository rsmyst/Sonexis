# 🎙️ Sonexis - Voice Authentication System

A modern web application that provides secure voice-based authentication and identity verification using advanced machine learning models.

# Screenshots
<img width="500" alt="S_1961" src="https://github.com/user-attachments/assets/056f9a63-2766-4670-92db-80f852da4a06" />
<img width="500" alt="S_1962" src="https://github.com/user-attachments/assets/4e74be99-1547-4de0-85f1-70bbb20d90bb" />
<img width="500" alt="S_1963" src="https://github.com/user-attachments/assets/3e5da66c-e72f-49d2-8cfe-f5097a2e04c7" />
<img width="500" alt="S_1964" src="https://github.com/user-attachments/assets/66382d02-8802-4834-bd79-9be0f3820590" />
<img width="500" alt="S_1965" src="https://github.com/user-attachments/assets/6619c2db-96eb-4079-9399-cb9d093c970c" />


## 🌟 Features

### Voice Authentication

- **Voice Enrollment**: Users can enroll their voice by recording a sample
- **Voice Verification**: Real-time voice verification using ML-based embeddings
- **Speech-to-Text**: Powered by OpenAI's Whisper model for accurate transcription
- Voice Authentication Python Server Details available at the following repo: https://github.com/rsmyst/SpeakerAuth

### User Management

- Secure authentication system
- User profile management
- Account settings and preferences
- Admin dashboard for user management

### Analytics & Visualization

- Interactive graphs and charts
- Usage statistics and history
- Performance metrics visualization

### Security

- Secure voice data handling
- Encrypted storage of voice embeddings
- Protected API endpoints

## 🛠️ Tech Stack

### Frontend

- Next.js 15.2.4
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Chart.js & Recharts
- Radix UI Components

### Backend

- FastAPI (Python ML Server)
- Next.js API Routes
- Prisma ORM
- MySQL/PostgreSQL Database

### Authentication

- NextAuth.js
- Bcrypt for password hashing
- JWT tokens

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python 3.8+
- MySQL/PostgreSQL
- Git

### Installation

1. Clone the repository

```bash
git clone https://github.com/rsmyst/Sonexis.git
cd sonexis
```

2. Install frontend dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Initialize the database

```bash
npx prisma generate
npx prisma db push
```

5. Start the development servers

```bash
# Start the frontend
npm run dev

# Start the ML server (in a separate terminal)
python SpeakerAuth/speaker_auth.py
```

## 🔧 Configuration

The application requires several environment variables to be set:

- `DATABASE_URL`: Database connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth.js
- `ML_SERVER_URL`: URL of the Python ML server
- `OPENAI_API_KEY`: For Whisper integration
- Other service-specific keys

## 📚 API Documentation

### Voice Authentication Endpoints

- `POST /api/voice/enroll`: Enroll a new voice sample
- `POST /api/voice/verify`: Verify voice identity
- `POST /api/voice/transcribe`: Convert speech to text

### User Management Endpoints

- `POST /api/auth/register`: Register new user
- `POST /api/auth/login`: User login
- `GET /api/user/profile`: Get user profile
- `PUT /api/user/profile`: Update user profile

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- OpenAI Whisper for speech-to-text capabilities
- The open-source community for various tools and libraries
- Contributors and maintainers

---

For support or questions, please open an issue in the repository.
