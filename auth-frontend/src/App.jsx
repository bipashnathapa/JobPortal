import { Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";
import StudentProfile from "./pages/StudentProfile";
import EmployerProfile from "./pages/EmployerProfile";
import StudentProfileView from "./pages/StudentProfileView"; 
import EmployerProfileView from "./pages/EmployerProfileView";
import PostListing from "./pages/PostListings";
import JobListingDetail from "./pages/JobListingDetail";
import StudentListings from "./pages/StudentListings";
import JobApplicationForm from "./pages/JobApplicationForm";
import ApplicationDetail from "./pages/ApplicationDetail";
import SavedJobs from "./pages/SavedJobs";
import HomePage from "./pages/HomePage";
import StudentInterviews from "./pages/StudentInterviews";
import EmployerInterviews from "./pages/EmployerInterviews";
import AdminDashboard from "./pages/AdminDashboard";
import CVFeedback from "./pages/CVFeedback";
import CvAnalysisHistory from "./pages/CvAnalysisHistory";
import ResumeScorer from "./pages/ResumeScorer";
import StudentNotifications from "./pages/StudentNotifications";
import StudentApplications from "./pages/StudentApplications";
import EmployerNotifications from "./pages/EmployerNotifications";
import RequireLoggedOut from "./components/RequireLoggedOut";

function App() {
  return (
    <Routes>
      <Route path="/" element={<RequireLoggedOut><AuthPage /></RequireLoggedOut>} />
      <Route path="/login" element={<RequireLoggedOut><LoginPage /></RequireLoggedOut>} />
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/student/notifications" element={<StudentNotifications />} />
      <Route path="/student/applications" element={<StudentApplications />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/employer" element={<EmployerDashboard />} />
      <Route path="/employer/notifications" element={<EmployerNotifications />} />
      <Route path="/student-profile" element={<StudentProfile />} />
      <Route path="/employer-profile" element={<EmployerProfile />} />
      

      <Route path="/view-student-profile/:username" element={<StudentProfileView />} />
      
      <Route path="/view-employer-profile" element={<EmployerProfileView />} />
      <Route path="/post-listing" element={<PostListing />} />
      <Route path="/listing/:listingId" element={<JobListingDetail />} />
      <Route path="/listings" element={<StudentListings />} />
      <Route path="/saved-jobs" element={<SavedJobs />} />
      <Route path="/cv-feedback" element={<CVFeedback />} />
      <Route path="/cv-analysis-history" element={<CvAnalysisHistory />} />
      <Route path="/resume-scorer" element={<ResumeScorer />} />
      <Route path="/student-interviews" element={<StudentInterviews />} />
      <Route path="/employer-interviews" element={<EmployerInterviews />} />
      <Route path="/apply/:listingId" element={<JobApplicationForm />} />
      <Route path="/application/:applicationId" element={<ApplicationDetail />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;
