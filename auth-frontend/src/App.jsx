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

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/employer" element={<EmployerDashboard />} />
      <Route path="/student-profile" element={<StudentProfile />} />
      <Route path="/employer-profile" element={<EmployerProfile />} />
      

      <Route path="/view-student-profile/:username" element={<StudentProfileView />} />
      
      <Route path="/view-employer-profile" element={<EmployerProfileView />} />
      <Route path="/post-listing" element={<PostListing />} />
      <Route path="/listing/:listingId" element={<JobListingDetail />} />
      <Route path="/listings" element={<StudentListings />} />
      <Route path="/saved-jobs" element={<SavedJobs />} />
      <Route path="/cv-feedback" element={<CVFeedback />} />
      <Route path="/student-interviews" element={<StudentInterviews />} />
      <Route path="/employer-interviews" element={<EmployerInterviews />} />
      <Route path="/apply/:listingId" element={<JobApplicationForm />} />
      <Route path="/application/:applicationId" element={<ApplicationDetail />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;
