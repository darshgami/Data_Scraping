from django.urls import path
from .views import ScrapeUrlView, HistoryPlaceholderView

urlpatterns = [
    path('scrape/', ScrapeUrlView.as_view(), name='scrape'),
    path('history/', HistoryPlaceholderView.as_view(), name='history'),
]
