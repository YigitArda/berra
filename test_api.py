import urllib.request
import json

# Test 1: Autocomplete endpoint çalışıyor mu?
url = "https://global.api.flixbus.com/search/autocomplete/cities?q=Munich&lang=en&country=en&flixbus_cities_only=false&is_train_only=false"
req = urllib.request.Request(url, headers={
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
    "Origin": "https://shop.global.flixbus.com",
    "Referer": "https://shop.global.flixbus.com/",
})
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        data = json.loads(r.read())
        city = data[0]
        print(f"OK: Munich id={city['id']} legacy_id={city['legacy_id']}")
except Exception as e:
    print(f"FAIL: {e}")

# Test 2: Search endpoint çalışıyor mu?
import datetime
tomorrow = (datetime.date.today() + datetime.timedelta(days=7)).strftime("%d.%m.%Y")
munich_uuid = "40d901a5-8646-11e6-9066-549f350fcb0c"
# Vienna uuid (bizim bildiğimiz)
vienna_uuid = "40de8964-8646-11e6-9066-549f350fcb0c"

search_url = (
    f"https://global.api.flixbus.com/search/service/v4/search"
    f"?from_city_id={munich_uuid}&to_city_id={vienna_uuid}"
    f"&departure_date={tomorrow}&products=%7B%22adult%22%3A1%7D"
    f"&currency=EUR&locale=de_DE&search_by=cities&include_after_midnight_rides=1"
)
req2 = urllib.request.Request(search_url, headers={
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
    "Origin": "https://shop.global.flixbus.com",
    "Referer": "https://shop.global.flixbus.com/",
    "x-client-id": "web_passenger",
})
try:
    with urllib.request.urlopen(req2, timeout=15) as r:
        data = json.loads(r.read())
        trips = data.get("trips", [])
        results = list(trips[0].get("results", {}).values()) if trips else []
        available = [t for t in results if t.get("status") == "available"]
        if available:
            prices = [t["price"]["total"] for t in available if t.get("price")]
            print(f"OK: Search Munich->Vienna {len(available)} sefer, en ucuz €{min(prices):.2f}")
        else:
            print(f"OK: Search cevap geldi ama sefer yok (trips={len(trips)})")
except Exception as e:
    print(f"FAIL: Search {e}")
