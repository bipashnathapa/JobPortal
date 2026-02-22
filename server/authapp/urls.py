from django.urls import path
from .views import (
    register, 
    login, 
    home, 
    student_dashboard, 
    employer_dashboard, 
    verify_email, 
    get_profile, 
    update_profile,
    get_employer_profile,
    update_employer_profile,
    view_student_profile, 
    post_listing,
    get_employer_listings,    
    delete_listing ,
    get_listing_detail,
    get_all_listings,
    submit_application,
    get_employer_applications,
    update_application_status,
    get_student_notifications,
    mark_notification_read,
    get_employer_notifications,
)

urlpatterns = [
    path('', home),
    path('register/', register),
    path('login/', login),
    path('student-dashboard/', student_dashboard),
    path('employer-dashboard/', employer_dashboard),
    path('verify-email/', verify_email),
    
    
    # Student profile
    path('student-profile/', get_profile),
    path('student-profile/update/', update_profile),
    path('view-student-profile/<str:username>/', view_student_profile),  
    
    # Employer profile
    path('employer-profile/', get_employer_profile),
    path('employer-profile/update/', update_employer_profile),

    path('post-listing/', post_listing),
    path('employer-listings/', get_employer_listings),         
    path('delete-listing/<str:listing_id>/', delete_listing), 
    path('listing/<str:listing_id>/', get_listing_detail),
    path('all-listings/', get_all_listings), 
    path('apply/<str:listing_id>/', submit_application),
    path('employer-applications/', get_employer_applications),
    path('application/<str:application_id>/status/', update_application_status),
    path('student-notifications/', get_student_notifications),
    path('notification/<str:notification_id>/read/', mark_notification_read),
    path('employer-notifications/', get_employer_notifications),
]