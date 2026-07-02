import re
from datetime import datetime

class Validators:
    @staticmethod
    def validate_page_params(page, limit):
        """
        Validates and sanitizes pagination indices, returning clean integers.
        """
        try:
            clean_page = max(1, int(page))
        except (ValueError, TypeError):
            clean_page = 1
            
        try:
            clean_limit = min(100, max(1, int(limit))) # Limit capped between 1 and 100
        except (ValueError, TypeError):
            clean_limit = 25 # Default page limit
            
        return clean_page, clean_limit

    @staticmethod
    def sanitize_text(text):
        """
        Cleans alphanumeric inputs to remove potential injection tokens.
        """
        if not text:
            return ""
        # Remove any character that isn't alphanumeric, space, hyphen or comma
        return re.sub(r'[^\w\s\-,]', '', str(text)).strip()

    @staticmethod
    def validate_date(date_str):
        """
        Validates date format DD/MM/YYYY or YYYY-MM-DD.
        """
        if not date_str:
            return None
        # Try to parse standard patterns
        for fmt in ('%d/%m/%Y', '%Y-%m-%d'):
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.strftime('%Y-%m-%d')
            except ValueError:
                continue
        return None
