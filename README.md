# BookWise Companion

BookWise Companion is an intelligent reading assistant built with Next.js and powered by Google's Generative AI. It allows users to upload their personal library of books and engage in insightful conversations with an AI that has read them all. This application leverages Retrieval-Augmented Generation (RAG) to provide contextually-aware answers based on the content of the uploaded books.

## Key Features

- **User Authentication:** Secure sign-up and login functionality using Firebase Authentication.
- **Personal Library Management:** Upload, view, and manage your personal collection of books.
- **Custom Book Covers:** Users can upload a custom cover image for each book.
- **Intelligent AI Chat:** A persistent, chat-based interface to converse with an AI about any book in your library.
- **Persistent Chat History:** Chat conversations are saved per-user, allowing you to pick up where you left off.
- **Responsive Design:** A seamless experience across desktop and mobile devices, with resizable panels for power users.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (using App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
- **AI/LLM Integration:** [Genkit (Google's Generative AI Toolkit)](https://firebase.google.com/docs/genkit)
- **Backend & Database:** [Firebase](https://firebase.google.com/)
  - **Authentication:** Manages user identity.
  - **Firestore:** NoSQL database for storing user data, book metadata, and chat history.
  - **Storage:** Cloud storage for user-uploaded book files (PDFs) and cover images.

## AI and RAG Implementation

The core of this application is its ability to "read" and discuss the books you upload. This is achieved using a technique called **Retrieval-Augmented Generation (RAG)**.

1.  **Indexing:** When a user uploads a book (PDF), the `indexBook` Genkit flow is triggered. This flow extracts the text content from the document.
2.  **Embedding & Storage (Conceptual):** In a full production environment, this extracted text would be split into chunks. Each chunk would be converted into a numerical representation called an "embedding" using a powerful language model. These embeddings are then stored in a specialized **vector database** (such as Firestore Vector Search, Pinecone, or ChromaDB). This process creates a searchable knowledge base for each book. *The current implementation has the framework for this but does not store embeddings to keep the project simple.*
3.  **Retrieval:** When you ask the AI a question, your query is also converted into an embedding. The application then searches the vector database to find the chunks of text from your books that are most semantically similar to your question.
4.  **Generation:** The retrieved text chunks are then passed to the Gemini LLM along with your original question and the chat history. This provides the AI with the specific context it needs to generate a relevant, accurate, and helpful response, effectively allowing it to answer questions based on the content of your private library.

All AI-related logic is managed through **Genkit flows**, which are server-side TypeScript functions defined in the `src/ai/flows/` directory.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- A Firebase project

### 1. Set Up Firebase

1.  Create a new project on the [Firebase Console](https://console.firebase.google.com/).
2.  Add a new Web App to your project.
3.  Copy the `firebaseConfig` object provided.
4.  Enable **Authentication** (with the Email/Password provider), **Firestore**, and **Storage** in the Firebase Console.

### 2. Configure Environment Variables

Create a file named `.env` in the root of the project and add your Firebase project credentials. You can find these in your Firebase project settings.

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Install Dependencies & Run

```bash
# Install packages
npm install

# Run the development server
npm run dev
```

The application will be available at `http://localhost:9002`.

## Project Structure

```
/src
├── ai/                # Genkit AI flows and configuration
├── app/               # Next.js App Router (pages and layouts)
├── components/        # Reusable React components (UI, auth, etc.)
├── hooks/             # Custom React hooks
├── lib/               # Utility functions, Firebase config, type definitions
└── ...
```
