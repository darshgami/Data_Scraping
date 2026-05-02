from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import SearchSession, ScrapedData
from .serializers import SearchSessionSerializer
from .scraper_utils import run_playwright_scraper
from django.http import HttpResponse
import pandas as pd
import io

class ScrapeUrlView(APIView):
    """
    Triggers Playwright scraping on the backend for a given URL.
    """
    def post(self, request):
        url = request.data.get('url')
        city = request.data.get('city', '')
        pincode = request.data.get('pincode', '')
        
        if not url:
            return Response({"error": "URL is required"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Run Playwright Scraper
        results = run_playwright_scraper(url, city_filter=city, pincode_filter=pincode)

        if not results:
            return Response({"error": "No business data found matching your filters on this page."}, status=status.HTTP_404_NOT_FOUND)

        # 2. Save to Database for history
        session = SearchSession.objects.create(
            keyword="Web Scraping",
            directory=url.split('//')[-1].split('/')[0],
            city=city,
            pincode=pincode
        )

        for res in results:
            ScrapedData.objects.create(
                session=session,
                company_name=res.get('Company Name', 'N/A'),
                address=res.get('Address', 'N/A')
            )

        # 3. Generate CSV
        df = pd.DataFrame(results)
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)

        # 4. Return CSV directly
        response = HttpResponse(
            output.getvalue(),
            content_type='text/csv'
        )
        response['Content-Disposition'] = f'attachment; filename="BDS_Data_{city or "Export"}.csv"'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'
        response['X-Session-ID'] = str(session.id)
        
        return response

class ExportCSVView(APIView):
    """
    Exports existing session data as CSV.
    """
    def get(self, request, session_id):
        try:
            session = SearchSession.objects.get(id=session_id)
            results = ScrapedData.objects.filter(session=session)
            
            data = []
            for res in results:
                data.append({
                    "Company Name": res.company_name,
                    "Address": res.address
                })

            df = pd.DataFrame(data)
            output = io.StringIO()
            df.to_csv(output, index=False)
            output.seek(0)

            response = HttpResponse(
                output.getvalue(),
                content_type='text/csv'
            )
            response['Content-Disposition'] = f'attachment; filename="BDS_Data_{session_id}.csv"'
            response['Access-Control-Expose-Headers'] = 'Content-Disposition'
            return response
        except SearchSession.DoesNotExist:
            return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)

class SessionHistoryView(APIView):
    def get(self, request):
        sessions = SearchSession.objects.all().order_by('-created_at')
        serializer = SearchSessionSerializer(sessions, many=True)
        return Response(serializer.data)
