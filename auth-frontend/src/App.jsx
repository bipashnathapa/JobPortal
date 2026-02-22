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

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/employer" element={<EmployerDashboard />} />
      <Route path="/student-profile" element={<StudentProfile />} />
      <Route path="/employer-profile" element={<EmployerProfile />} />
      

      <Route path="/view-student-profile/:username" element={<StudentProfileView />} />
      
      <Route path="/view-employer-profile" element={<EmployerProfileView />} />
      <Route path="/post-listing" element={<PostListing />} />
      <Route path="/listing/:listingId" element={<JobListingDetail />} />
      <Route path="/listings" element={<StudentListings />} />
      <Route path="/apply/:listingId" element={<JobApplicationForm />} />
      <Route path="/application/:applicationId" element={<ApplicationDetail />} />
    </Routes>
  );
}

export default App;