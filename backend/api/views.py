from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging
from .scraper_utils import run_playwright_scraper

# Setup logging
logger = logging.getLogger(__name__)

class ScrapeUrlView(APIView):
    """
    Service Layer: Orchestrates Max-Capture scraping.
    """
    def post(self, request):
        url = request.data.get('url')
        city = request.data.get('city', '').strip()
        pincode = request.data.get('pincode', '').strip()
        
        if not url:
            return Response({"error": "Target URL is required"}, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"--- Processing Max-Capture Scrape ---")
        logger.info(f"URL: {url}, City: {city}")

        try:
            results = run_playwright_scraper(url, city_filter=city, pincode_filter=pincode)
            
            if not results:
                return Response({
                    "error": f"No businesses found matching '{city}' on this page. Try searching without the city name on the website first.",
                    "results": [],
                    "count": 0
                }, status=status.HTTP_200_OK)

            return Response({
                "message": f"Successfully extracted {len(results)} records.",
                "results": results,
                "count": len(results)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Critical Error: {str(e)}")
            return Response({"error": "Analysis failed. The website might be blocking automated access."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class HistoryPlaceholderView(APIView):
    def get(self, request):
        return Response({"message": "Stateless mode active."})
