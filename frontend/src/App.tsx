import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';

// Import pages
import HomePage from './pages/HomePage';
import PaperAnalysisPage from './pages/PaperAnalysisPage';
import AIDetectionPage from './pages/AIDetectionPage';
import PaperUniquenessPage from './pages/PaperUniquenessPage';
import PaperDetailsPage from './pages/PaperDetailsPage';
import PaperStructuringPage from './pages/PaperStructuringPage';
import RoomsPage from './pages/RoomsPage';
import RoomDetailsPage from './pages/RoomDetailsPage';
import CreateRoomPage from './pages/CreateRoomPage';
import SubmitIdeaPage from './pages/SubmitIdeaPage';
import IdeaDetailsPage from './pages/IdeaDetailsPage';
import NotFoundPage from './pages/NotFoundPage';
import PaperStructureCheckPage from './pages/PaperStructureCheckPage';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            
            {/* Paper Analysis Routes */}
            <Route path="/paper-analysis" element={<PaperAnalysisPage />} />
            <Route path="/ai-detection" element={<AIDetectionPage />} />
            <Route path="/paper-uniqueness" element={<PaperUniquenessPage />} />
            <Route path="/papers/:paperId" element={<PaperDetailsPage />} />
            <Route path="/paper-structuring" element={<PaperStructuringPage />} />
            <Route path="/paper-structure-check" element={<PaperStructureCheckPage />} />
            
            {/* Room Routes */}
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/rooms/new" element={<CreateRoomPage />} />
            <Route path="/rooms/:roomId" element={<RoomDetailsPage />} />
            
            {/* Idea Routes */}
            <Route path="/rooms/:roomId/submit-idea" element={<SubmitIdeaPage />} />
            <Route path="/ideas/:ideaId" element={<IdeaDetailsPage />} />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
