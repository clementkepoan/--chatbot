# 麵屋心 (Menya Kokoro) - AI Restaurant Management System

A full-stack restaurant management system with AI-powered chatbot capabilities, featuring a Next.js frontend and FastAPI backend. The system provides multilingual support, real-time chat functionality, and comprehensive admin management tools.

---

## 🌟 Features

### Frontend (Next.js)

- **Multilingual Support**: English and Traditional Chinese interface
- **AI Chatbot Interface**: Real-time streaming chat with typing indicators
- **Admin Dashboard**: Excel-like editable tables for menu and restaurant management
- **Authentication System**: Secure admin registration and login with admin codes
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Real-time Updates**: Automatic data synchronization and live editing


### Backend (FastAPI)

- **Conversational AI**: Google Gemini integration for natural language understanding
- **Vector Database**: Pinecone for advanced retrieval-augmented generation (RAG)
- **Knowledge Base**: Supabase integration for menu and restaurant data
- **API Endpoints**: Chat, health monitoring, database sync, and summary generation
- **Docker Support**: Containerized deployment ready


---

## 🏗️ Architecture

```plaintext
Frontend (Next.js) ←→ Backend (FastAPI) ←→ External Services
     ↓                      ↓                    ↓
- React Components    - Chat Processing      - Google Gemini
- Admin Dashboard     - Vector Search       - Supabase DB
- Authentication      - Data Sync           - Pinecone Vector DB
- Language Support    - Health Monitoring   - Ngrok Tunneling
```

---

## 🚀 Prerequisites

### Frontend

- Node.js 18+
- npm or yarn


### Backend

- Python 3.10+
- Docker (optional)


### API Keys Required

- **Supabase**: URL and Service Role Key
- **Google Gemini**: API Key
- **Pinecone**: API Key and Environment
- **Vercel**: For frontend deployment (optional)


---

## 📦 Installation & Setup

### 1. Clone the Repository

```shellscript
git clone <repository-url>
cd menya-kokoro-system
```

### 2. Backend Setup

```shellscript
cd backend
pip install -r requirements.txt
```

Create `.env` file in backend directory:

```plaintext
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=restaurant-knowledge
DEBUG=True
```

### 3. Frontend Setup

```shellscript
cd frontend
npm install
```

Create `.env.local` file in frontend directory:

```plaintext
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Database Setup

Run the SQL scripts in your Supabase project:

- `backend/database_setup.sql`
- Execute the table creation scripts from the frontend


---

## 🏃‍♂️ Running the Application

### Development Mode

**Start Backend:**

```shellscript
cd backend
python server.py
# Server runs on http://localhost:8000
```

**Start Frontend:**

```shellscript
cd frontend
npm run dev
# App runs on http://localhost:3000
```

### Production with Docker

**Backend:**

```shellscript
cd backend
docker-compose up --build
```

**Frontend:**
Deploy to Vercel or build locally:

```shellscript
cd frontend
npm run build
npm start
```

---

## 🔗 API Integration

The frontend communicates with the backend through these key endpoints:

### Chat System

- **Endpoint**: `POST /chat`
- **Purpose**: Real-time AI conversations
- **Features**: Language detection, session management, streaming responses


### Database Sync

- **Endpoint**: `POST /updatedb`
- **Purpose**: Sync frontend changes to vector database
- **Trigger**: Admin dashboard "Save Changes" button


### Summary Generation

- **Endpoint**: `GET /summary/{language}`
- **Purpose**: Generate restaurant insights and recommendations
- **Languages**: `english`, `traditionalchinese`


---

## 🎯 Key Features Explained

### 1. Multilingual AI Chat

- Users can chat in English or Traditional Chinese
- AI responses adapt to user's language preference
- Context-aware conversations about menu and restaurant info


### 2. Admin Management System

- **Excel-like Interface**: Click-to-edit tables for menu items and restaurant details
- **Real-time Validation**: Instant feedback on data entry
- **Bulk Operations**: Add, edit, delete multiple items efficiently
- **Auto-save**: Changes automatically sync to database


### 3. Authentication & Security

- **Admin Code Protection**: Registration requires hardcoded admin code (123456)
- **Supabase Auth**: Secure user management and session handling
- **Row Level Security**: Database-level access control


### 4. Vector-Powered Search

- **Semantic Search**: AI understands context and intent
- **RAG Implementation**: Retrieves relevant information for accurate responses
- **Real-time Updates**: Vector database stays synchronized with admin changes


---

## 📁 Project Structure

```plaintext
menya-kokoro-system/
├── frontend/
│   ├── app/                    # Next.js app router
│   ├── components/             # React components
│   │   ├── admin/             # Admin dashboard components
│   │   ├── auth/              # Authentication forms
│   │   └── ui/                # Reusable UI components
│   ├── lib/                   # Utilities and configurations
│   └── public/                # Static assets
├── backend/
│   ├── server.py              # FastAPI main application
│   ├── ai_init.py             # AI service initialization
│   ├── vector_db.py           # Pinecone integration
│   ├── database_setup.sql     # Database schema
│   └── requirements.txt       # Python dependencies
└── README.md                  # This file
```

---

## 🔧 Configuration

### Admin Code

Default admin registration code is `123456`. Users must enter this code to create admin accounts.

### Language Support

- **Frontend**: Automatic language detection and switching
- **Backend**: Processes requests in user's preferred language
- **Database**: Stores multilingual content


### Environment Variables

Ensure all required environment variables are set in both frontend and backend `.env` files.

---

## 🚀 Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch


### Backend (Docker/Cloud)

1. Use provided Docker configuration
2. Deploy to your preferred cloud provider
3. Set up ngrok or similar for webhook endpoints


---

## 🔍 API Documentation

### Health Monitoring

- **GET /**: Basic health check
- **GET /health**: Detailed system status


### Chat Endpoints

- **POST /chat**: Main conversation endpoint
- **GET /summary/language**: Generate restaurant summaries


### Admin Endpoints

- **POST /updatedb**: Synchronize database changes


For detailed API documentation, visit `http://localhost:8000/docs` when running the backend.

---

## 🐛 Troubleshooting

### Common Issues

**Frontend not loading data:**

- Check Supabase environment variables
- Verify service role key is set
- Ensure RLS policies allow service role access


**Backend connection errors:**

- Verify all API keys in `.env` file
- Check Pinecone index name and environment
- Ensure Supabase URL and keys are correct


**Chat not working:**

- Confirm backend is running on correct port
- Check CORS settings in FastAPI
- Verify Gemini API key is valid


### Debug Mode

Enable debug logging by setting `DEBUG=True` in backend `.env` file.

---

## 📄 License

MIT License - feel free to use this project for your own restaurant management needs!

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request


---

## 📞 Support

For issues and questions:

- Check the troubleshooting section
- Review API documentation at `/docs`
- Examine console logs for error details


---

**Built with ❤️ for 麵屋心 (Menya Kokoro)**