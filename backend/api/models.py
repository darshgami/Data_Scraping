from django.db import models

class SearchSession(models.Model):
    keyword = models.CharField(max_length=255)
    directory = models.CharField(max_length=255)
    city = models.CharField(max_length=100, blank=True, null=True)
    pincode = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.keyword} - {self.created_at}"

class ScrapedData(models.Model):
    session = models.ForeignKey(SearchSession, related_name='results', on_delete=models.CASCADE)
    company_name = models.CharField(max_length=255)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.company_name
