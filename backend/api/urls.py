from django.urls import path
from .views import ScrapeUrlView, ExportCSVView, SessionHistoryView

urlpatterns = [
    path('scrape-url/', ScrapeUrlView.as_view(), name='scrape_url'),
    path('export-csv/<int:session_id>/', ExportCSVView.as_view(), name='export_csv'),
    path('history/', SessionHistoryView.as_view(), name='history'),
]
