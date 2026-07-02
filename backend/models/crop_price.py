class CropPrice:
    def __init__(self, commodity, state, district, market, variety, grade, arrival_date, min_price, max_price, modal_price):
        self.commodity = commodity
        self.state = state
        self.district = district
        self.market = market
        self.variety = variety
        self.grade = grade
        self.arrival_date = arrival_date
        
        # Parse prices to numeric types
        self.min_price = self._parse_price(min_price)
        self.max_price = self._parse_price(max_price)
        self.modal_price = self._parse_price(modal_price)

    def _parse_price(self, price_val):
        try:
            return float(price_val)
        except (ValueError, TypeError):
            return 0.0

    @classmethod
    def from_api_dict(cls, data):
        """
        Instantiates the class by parsing the data.gov.in API dictionary fields.
        """
        return cls(
            commodity=data.get('commodity', 'N/A'),
            state=data.get('state', 'N/A'),
            district=data.get('district', 'N/A'),
            market=data.get('market', 'N/A'),
            variety=data.get('variety', 'N/A'),
            grade=data.get('grade', 'N/A'),
            arrival_date=data.get('arrival_date', 'N/A'),
            min_price=data.get('min_price', 0),
            max_price=data.get('max_price', 0),
            modal_price=data.get('modal_price', 0)
        )

    def to_dict(self):
        """
        Serializes record fields into a standard dictionary.
        """
        return {
            "commodity": self.commodity,
            "state": self.state,
            "district": self.district,
            "market": self.market,
            "variety": self.variety,
            "grade": self.grade,
            "arrival_date": self.arrival_date,
            "min_price": self.min_price,
            "max_price": self.max_price,
            "modal_price": self.modal_price
        }
