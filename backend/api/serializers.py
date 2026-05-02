from rest_framework import serializers
from .models import SearchSession, ScrapedData

class ScrapedDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScrapedData
        fields = ['id', 'company_name', 'address', 'created_at']

class SearchSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchSession
        fields = ['id', 'keyword', 'directory', 'city', 'pincode', 'created_at']
