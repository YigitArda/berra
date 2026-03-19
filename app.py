"""
BusScanner - Flask Backend (Hızlandırılmış)
- concurrent.futures ile paralel şehir araması
- Reachable cache: sadece ulaşılabilir şehirler
- Thread pool ile hızlı SSE
"""
import json, time, datetime, threading, random
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlencode
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from flask import Flask, jsonify, request, Response, send_from_directory

app = Flask(__name__, static_folder='public', static_url_path='')

FLIX_SEARCH    = "https://global.api.flixbus.com/search/service/v4/search"
FLIX_REACHABLE = "https://global.api.flixbus.com/cms/cities/{uuid}/reachable?language=en-gl&limit=9999"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1",
]

def get_headers():
    return {
        "User-Agent":      random.choice(USER_AGENTS),
        "Accept":          "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9,de;q=0.8",

        "Origin":          "https://shop.global.flixbus.com",
        "Referer":         "https://shop.global.flixbus.com/",
        "x-client-id":    "web_passenger",
        "sec-ch-ua":      '"Chromium";v="122", "Not(A:Brand";v="24"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
    }

HEADERS = get_headers()  # backward compat

COUNTRY_MAP = {
    "DE": ("Almanya","🇩🇪"), "AT": ("Avusturya","🇦🇹"), "CH": ("İsviçre","🇨🇭"),
    "FR": ("Fransa","🇫🇷"),  "IT": ("İtalya","🇮🇹"),    "ES": ("İspanya","🇪🇸"),
    "PT": ("Portekiz","🇵🇹"),"NL": ("Hollanda","🇳🇱"),  "BE": ("Belçika","🇧🇪"),
    "PL": ("Polonya","🇵🇱"), "CZ": ("Çekya","🇨🇿"),     "SK": ("Slovakya","🇸🇰"),
    "HU": ("Macaristan","🇭🇺"),"RO": ("Romanya","🇷🇴"), "BG": ("Bulgaristan","🇧🇬"),
    "GR": ("Yunanistan","🇬🇷"),"HR": ("Hırvatistan","🇭🇷"),"SI": ("Slovenya","🇸🇮"),
    "BA": ("Bosna-Hersek","🇧🇦"),"RS": ("Sırbistan","🇷🇸"),"ME": ("Karadağ","🇲🇪"),
    "MK": ("Kuzey Makedonya","🇲🇰"),"AL": ("Arnavutluk","🇦🇱"),"TR": ("Türkiye","🇹🇷"),
    "GB": ("İngiltere","🇬🇧"),"DK": ("Danimarka","🇩🇰"),"SE": ("İsveç","🇸🇪"),
    "NO": ("Norveç","🇳🇴"),  "FI": ("Finlandiya","🇫🇮"),"EE": ("Estonya","🇪🇪"),
    "LV": ("Letonya","🇱🇻"), "LT": ("Litvanya","🇱🇹"),  "LU": ("Lüksemburg","🇱🇺"),
    "UA": ("Ukrayna","🇺🇦"), "MD": ("Moldova","🇲🇩"),   "LI": ("Lihtenştayn","🇱🇮"),
    "AD": ("Andorra","🇦🇩"),
    "XK": ("Kosova","🇽🇰"),
}

# requests Session — connection pooling, otomatik keep-alive
_session = requests.Session()
_adapter = HTTPAdapter(
    pool_connections=20,
    pool_maxsize=50,
    max_retries=Retry(total=2, backoff_factor=0.3, status_forcelist=[500,502,503,504])
)
_session.mount("https://", _adapter)
_session.mount("http://", _adapter)
# requests'in varsayılan "python-requests/x.x" User-Agent'ını kaldır
_session.headers.clear()

SEED_UUIDS = {
    "Munich":  "40d901a5-8646-11e6-9066-549f350fcb0c",
    "Berlin":  "40d8f682-8646-11e6-9066-549f350fcb0c",
    "Vienna":  "40de1f31-8646-11e6-9066-549f350fcb0c",
    "Paris":   "40de8964-8646-11e6-9066-549f350fcb0c",
}

city_cache = {}          # uuid -> {name, country_code, flag, country_tr}
city_cache_ready = False
name_to_uuid = {}

# Reachable cache: from_uuid -> [to_uuid, ...] (ulaşılabilir şehirler)
reachable_cache = {}
reachable_lock  = threading.Lock()

# Tek unified cache — trips için
search_cache = {}
search_cache_lock = threading.Lock()
SEARCH_CACHE_TTL = 7200  # 2 saat

def cache_get(from_uuid, date):
    """Belirli bir kalkış+tarih için tüm cached sonuçları döndür"""
    prefix = f"{from_uuid}|"
    results = {}
    oldest_ts = None
    with search_cache_lock:
        for key, entry in search_cache.items():
            if key.startswith(prefix) and key.endswith(f"|{date}"):
                if (time.time() - entry["ts"]) < SEARCH_CACHE_TTL:
                    # key = from|to|date -> to_uuid al
                    parts = key.split("|")
                    if len(parts) == 3:
                        to_uuid = parts[1]
                        if entry["data"]:  # sadece sefer olan şehirler
                            # En ucuz seferi al
                            b = entry["data"][0]
                            results[to_uuid] = {"price": b["price"]}
                        if oldest_ts is None or entry["ts"] < oldest_ts:
                            oldest_ts = entry["ts"]
    return results if results else None, oldest_ts

def cache_age_str(ts):
    if not ts: return ""
    mins = int((time.time() - ts) / 60)
    if mins < 1: return "az önce güncellendi"
    if mins < 60: return f"{mins} dakika önce güncellendi"
    return f"{mins//60} saat önce güncellendi"

# Prefetch worker takibi
prefetch_running = set()
prefetch_running_lock = threading.Lock()

# SQLite disk cache


def load_cities():
    global city_cache, city_cache_ready
    try:
        for city_name, uuid in SEED_UUIDS.items():
            url = FLIX_REACHABLE.format(uuid=uuid)
            r = _session.get(url, headers=get_headers(), timeout=30)
            r.raise_for_status()
            cities = r.json()
            # API {"result": [...], "count": N} formatında dönüyor
            if isinstance(cities, dict):
                cities = cities.get("result") or cities.get("cities") or cities.get("data") or []
            for c in cities:
                if not isinstance(c, dict):
                    continue
                uuid2 = c.get("uuid") or c.get("id")
                name  = c.get("name","")
                code  = c.get("country","") or c.get("country_code","")
                if not uuid2 or not name: continue
                tr, flag = COUNTRY_MAP.get(code, (code, "🏳"))
                # search_volume filtresi — 100.000 altı küçük ilçeleri atla
                search_volume = c.get("search_volume", 0) or 0
                if search_volume > 0 and search_volume < 100000:
                    continue
                loc = c.get("location", {})
                lat = loc.get("lat")
                lon = loc.get("lon")
                if uuid2 not in city_cache:
                    city_cache[uuid2] = {"name":name,"country_code":code,"flag":flag,"country_tr":tr,
                                         "search_volume":search_volume,"lat":lat,"lon":lon}
                else:
                    city_cache[uuid2]["search_volume"] = search_volume
                    if lat: city_cache[uuid2]["lat"] = lat
                    if lon: city_cache[uuid2]["lon"] = lon
            # Seed şehrini de ekle
            city_cache[uuid] = {"name":city_name,"country_code":"DE","flag":"🇩🇪","country_tr":"Almanya"}
        print(f"[CITIES] {len(city_cache)} şehir yüklendi.")
        city_cache_ready = True
    except Exception as e:
        print(f"[CITIES] Hata: {e}")
        # Fallback: autocomplete API'den manuel yükle
        try:
            fallback_cities = [
                ("Munich","40d901a5-8646-11e6-9066-549f350fcb0c","DE"),
                ("Berlin","40d8f682-8646-11e6-9066-549f350fcb0c","DE"),
                ("Vienna","40de1f31-8646-11e6-9066-549f350fcb0c","AT"),
                ("Paris","40de8964-8646-11e6-9066-549f350fcb0c","FR"),
                ("Amsterdam","40dde3b8-8646-11e6-9066-549f350fcb0c","NL"),
                ("Prague","40de1ad1-8646-11e6-9066-549f350fcb0c","CZ"),
                ("Barcelona","40e086ed-8646-11e6-9066-549f350fcb0c","ES"),
                ("Rome","40de90ff-8646-11e6-9066-549f350fcb0c","IT"),
                ("Milan","40ddcc6e-8646-11e6-9066-549f350fcb0c","IT"),
                ("Hamburg","40d91e53-8646-11e6-9066-549f350fcb0c","DE"),
                ("Frankfurt","40d90407-8646-11e6-9066-549f350fcb0c","DE"),
                ("Cologne","40d91025-8646-11e6-9066-549f350fcb0c","DE"),
                ("Stuttgart","40d90995-8646-11e6-9066-549f350fcb0c","DE"),
                ("Zurich","40d8fa3c-8646-11e6-9066-549f350fcb0c","CH"),
                ("Brussels","40de6287-8646-11e6-9066-549f350fcb0c","BE"),
                ("Budapest","40de6527-8646-11e6-9066-549f350fcb0c","HU"),
                ("Warsaw","40e19c59-8646-11e6-9066-549f350fcb0c","PL"),
                ("Krakow","40de7eb5-8646-11e6-9066-549f350fcb0c","PL"),
                ("Zagreb","40dea87d-8646-11e6-9066-549f350fcb0c","HR"),
                ("Ljubljana","40de8044-8646-11e6-9066-549f350fcb0c","SI"),
                ("Bratislava","40de54de-8646-11e6-9066-549f350fcb0c","SK"),
                ("Sarajevo","b4b1c3c9-608f-4920-9dfc-85762cef4b04","BA"),
                ("Belgrade","340bdce6-7eb1-4c50-bd1e-fd43485cdfef","RS"),
                ("Sofia","40e09335-8646-11e6-9066-549f350fcb0c","BG"),
                ("Bucharest","40e110b4-8646-11e6-9066-549f350fcb0c","RO"),
                ("Innsbruck","40dd9a2a-8646-11e6-9066-549f350fcb0c","AT"),
                ("Salzburg","40de3471-8646-11e6-9066-549f350fcb0c","AT"),
                ("Graz","40de3c97-8646-11e6-9066-549f350fcb0c","AT"),
                ("Linz","40dbff67-8646-11e6-9066-549f350fcb0c","AT"),
                ("Lyon","40df89c1-8646-11e6-9066-549f350fcb0c","FR"),
                ("Marseille","40df8e99-8646-11e6-9066-549f350fcb0c","FR"),
                ("Istanbul","99c50ec5-3ecb-11ea-8017-02437075395e","TR"),
            ]
            for name, uuid, code in fallback_cities:
                tr, flag = COUNTRY_MAP.get(code, (code, "🏳"))
                city_cache[uuid] = {"name":name,"country_code":code,"flag":flag,"country_tr":tr}
            print(f"[CITIES] Fallback: {len(city_cache)} şehir yüklendi")
        except Exception as e2:
            print(f"[CITIES] Fallback hatası: {e2}")
        city_cache_ready = True

def build_name_index():
    global name_to_uuid
    name_to_uuid = {info["name"].lower(): uuid for uuid, info in city_cache.items()}

def get_uuid_by_name(name):
    nl = name.lower()
    if nl in name_to_uuid: return name_to_uuid[nl]
    for key, uuid in name_to_uuid.items():
        if nl in key or key in nl: return uuid
    return None

def get_reachable(from_uuid):
    """Bir şehirden ulaşılabilen şehirleri döndür (cache'li)."""
    with reachable_lock:
        if from_uuid in reachable_cache:
            return reachable_cache[from_uuid]
    try:
        url = FLIX_REACHABLE.format(uuid=from_uuid)
        r = _session.get(url, headers=get_headers(), timeout=30)
        r.raise_for_status()
        cities = r.json()
        uuids = [c.get("uuid") or c.get("id") for c in cities if c.get("uuid") or c.get("id")]
        # Sadece city_cache'de olanları al
        uuids = [u for u in uuids if u in city_cache and u != from_uuid]
        with reachable_lock:
            reachable_cache[from_uuid] = uuids
        print(f"[REACHABLE] {city_cache.get(from_uuid,{}).get('name','?')}: {len(uuids)} şehir")
        return uuids
    except Exception as e:
        print(f"[REACHABLE] Hata: {e} — tüm şehirler kullanılacak")
        fallback = [u for u in city_cache if u != from_uuid]
        with reachable_lock:
            reachable_cache[from_uuid] = fallback
        return fallback

# ── Arama ──────────────────────────────────────────────────────────────────────

def do_search(from_uuid, to_uuid, date_str):
    # Önce search_cache'e bak
    cache_key = f"{from_uuid}|{to_uuid}|{date_str}"
    with search_cache_lock:
        entry = search_cache.get(cache_key)
        if entry and (time.time() - entry["ts"]) < SEARCH_CACHE_TTL:
            return entry["data"]
    y, m, d = date_str.split("-")
    flix_date = f"{d}.{m}.{y}"
    params = urlencode({
        "from_city_id":   from_uuid,
        "to_city_id":     to_uuid,
        "departure_date": flix_date,
        "products":       json.dumps({"adult": 1}),
        "currency":       "EUR",
        "locale":         "de_DE",
        "search_by":      "cities",
        "include_after_midnight_rides": "1",
    })
    url = f"{FLIX_SEARCH}?{params}"
    r = _session.get(url, headers=get_headers(), timeout=12)
    r.raise_for_status()
    data = r.json()
    # Debug: ilk seferin ham verisini yazdır
    try:
        trips_raw = data.get("trips", [])
        if trips_raw:
            first_results = trips_raw[0].get("results", {})
            if first_results:
                first_key = list(first_results.keys())[0]
                t = first_results[first_key]
                import json as _json
                print(f"[DEBUG RAW] {_json.dumps({k:v for k,v in t.items() if k in ('transfer_type_key','transfers_count','legs','status','price')}, ensure_ascii=False)}")
    except Exception as de:
        print(f"[DEBUG ERR] {de}")
    result = parse_trips(data, from_uuid, to_uuid, date_str)
    with search_cache_lock:
        search_cache[cache_key] = {"data": result, "ts": time.time()}
    return result

def parse_trips(data, from_uuid, to_uuid, date_str):
    y, m, d = date_str.split("-")
    book_url = (f"https://shop.global.flixbus.com/s"
                f"?departureCity={from_uuid}&arrivalCity={to_uuid}"
                f"&rideDate={d}.{m}.{y}&currency=EUR&adult=1&children=0&bike_slot=0")
    trips = []
    for group in data.get("trips", []):
        for t in group.get("results", {}).values():
            try:
                if t.get("status") != "available": continue
                price = t.get("price", {}).get("total")
                if not price or price <= 0: continue
                dep_str = t.get("departure", {}).get("date", "")
                arr_str = t.get("arrival",   {}).get("date", "")
                dep_dt  = datetime.datetime.fromisoformat(dep_str) if dep_str else None
                arr_dt  = datetime.datetime.fromisoformat(arr_str) if arr_str else None
                if not dep_dt: continue
                dur = t.get("duration", {})
                dur_min = dur.get("hours", 0) * 60 + dur.get("minutes", 0)
                if not dur_min and arr_dt:
                    dur_min = int((arr_dt - dep_dt).total_seconds() / 60)
                seats_low   = t.get("remaining", {}).get("seats_left_at_price")
                seats_avail = t.get("available", {}).get("seats")
                trips.append({
                    "dep":     dep_dt.strftime("%H:%M"),
                    "arr":     arr_dt.strftime("%H:%M") if arr_dt else "??:??",
                    "dur_min": dur_min,
                    "price":   round(price, 2),
                    "seats":   seats_low if seats_low is not None else seats_avail,
                    "direct":  (
                        t.get("transfer_type_key") in ("direct", "direct_with_border_crossing") or
                        t.get("transfers_count", 1) == 0 or
                        len(t.get("legs", [])) <= 1
                    ),
                    "bookUrl": book_url,
                })
            except Exception:
                pass
    seen = {}
    for t in trips:
        key = (t["dep"], t["arr"])
        if key not in seen or t["price"] < seen[key]["price"]:
            seen[key] = t
    return sorted(seen.values(), key=lambda x: x["price"])

# ── Endpointler ────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return send_from_directory("public", "index.html")

@app.route("/api/cities")
def api_cities():
    # Şehirler yüklenene kadar bekle (max 45sn)
    for _ in range(90):
        if city_cache_ready:
            break
        time.sleep(0.5)
    result = []
    for uuid, info in sorted(city_cache.items(), key=lambda x: x[1]["name"]):
        result.append({"id":uuid,"name":info["name"],"flag":info["flag"],"country":info["country_tr"],
                        "sv":info.get("search_volume",0),
                        "lat":info.get("lat"),"lon":info.get("lon")})
    return jsonify(result)

@app.route("/api/health")
def api_health():
    return jsonify({"ok": True, "cities": len(city_cache), "ready": city_cache_ready})

@app.route("/api/search")
def api_search():
    from_id  = request.args.get("from")
    to_id    = request.args.get("to")
    date_str = request.args.get("date")
    if not from_id or not to_id or not date_str:
        return jsonify({"error": "from, to, date gerekli"}), 400
    from_uuid = from_id if len(from_id) > 20 else get_uuid_by_name(from_id)
    to_uuid   = to_id   if len(to_id)   > 20 else get_uuid_by_name(to_id)
    if not from_uuid: return jsonify({"error": f"Bilinmeyen şehir: {from_id}"}), 400
    if not to_uuid:   return jsonify({"error": f"Bilinmeyen şehir: {to_id}"}), 400
    cache_key = f"{from_uuid}|{to_uuid}|{date_str}"
    # Geçmiş tarihler cache'lenmesin
    today = datetime.date.today().isoformat()
    use_cache = date_str >= today

    # Memory cache kontrolü (2 saat TTL)
    with search_cache_lock:
        entry = search_cache.get(cache_key)
        if entry and (time.time() - entry.get("ts", 0)) < SEARCH_CACHE_TTL:
            return jsonify({"trips": entry["data"]})

    print(f"[SEARCH] {date_str} | {city_cache.get(from_uuid,{}).get('name','?')} -> {city_cache.get(to_uuid,{}).get('name','?')}")
    try:
        trips = do_search(from_uuid, to_uuid, date_str)
        with search_cache_lock:
            search_cache[cache_key] = {"data": trips, "ts": time.time()}
        return jsonify({"trips": trips})
    except requests.exceptions.HTTPError as e:
        return jsonify({"error": f"FlixBus API hatası (HTTP {e.response.status_code if e.response else '?'})" }), 502
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/reachable")
def api_reachable():
    """Reachable API'den anlık destinasyon listesi - yaklaşık fiyatlarla"""
    from_uuid = request.args.get("from")
    if not from_uuid:
        return jsonify({"error": "from gerekli"}), 400

    cache_key = f"reachable|{from_uuid}"
    # Memory cache'den kontrol et (1 saat geçerli)
    with search_cache_lock:
        if cache_key in search_cache:
            cached = search_cache[cache_key]
            if time.time() - cached["ts"] < 3600:
                return jsonify(cached["data"])

    try:
        url = FLIX_REACHABLE.format(uuid=from_uuid) 
        req = Request(url, headers=get_headers())
        with urlopen(req, timeout=15) as r:
            raw = json.loads((gzip.decompress(r.read()) if r.info().get('Content-Encoding') == 'gzip' else r.read()).decode('utf-8'))

        cities = raw if isinstance(raw, list) else raw.get("result", [])

        results = []
        for c in cities:
            if not isinstance(c, dict): continue
            uuid2 = c.get("uuid") or c.get("id")
            name  = c.get("name", "")
            code  = c.get("country", "")
            if not uuid2 or not name: continue
            tr, flag = COUNTRY_MAP.get(code, (code, "🏳"))
            price_info = c.get("price", {}).get("EUR", {})
            min_price = price_info.get("min")
            avg_price = price_info.get("avg")
            if not min_price: continue
            results.append({
                "toId": uuid2,
                "name": name,
                "country": tr,
                "flag": flag,
                "minPrice": min_price,
                "avgPrice": avg_price,
                "bookUrl": f"https://shop.global.flixbus.com/s?departureCity={from_uuid}&arrivalCity={uuid2}&currency=EUR&adult=1"
            })

        results.sort(key=lambda x: x["minPrice"])
        with search_cache_lock:
            search_cache[cache_key] = {"ts": time.time(), "data": results}
        return jsonify(results)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/everywhere")
def api_everywhere():
    from_id  = request.args.get("from")
    date_str = request.args.get("date")
    if not from_id or not date_str:
        return jsonify({"error": "from ve date gerekli"}), 400
    from_uuid = from_id if len(from_id) > 20 else get_uuid_by_name(from_id)
    if not from_uuid:
        return jsonify({"error": f"Bilinmeyen şehir: {from_id}"}), 400

    from_name = city_cache.get(from_uuid, {}).get("name", from_uuid)
    print(f"[EVERYWHERE] {date_str} | {from_name} — reachable yükleniyor...")

    # Ulaşılabilir şehirleri al (cache'li)
    target_uuids = get_reachable(from_uuid)
    targets = [(u, city_cache[u]) for u in target_uuids if u in city_cache]
    print(f"[EVERYWHERE] {len(targets)} hedef şehir, paralel arama başlıyor")

    def generate():
        yield f"data:{json.dumps({'type':'start','total':len(targets)})}\n\n"
        found = 0
        done  = 0
        lock  = threading.Lock()

        def search_one(args):
            to_uuid, city = args
            try:
                trips = do_search(from_uuid, to_uuid, date_str)
                if trips:
                    b = trips[0]
                    return {"type":"result","toId":to_uuid,"name":city["name"],
                            "flag":city["flag"],"country":city["country_tr"],
                            "price":b["price"],"dep":b["dep"],"arr":b["arr"],
                            "durMin":b["dur_min"],"direct":b["direct"],"bookUrl":b["bookUrl"],
                            "lat":city.get("lat"),"lon":city.get("lon")}
            except Exception:
                pass
            return None

        # 8 paralel worker — FlixBus'u çok zorlamadan hızlı tara
        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = {executor.submit(search_one, t): t for t in targets}
            results_buf = []
            buf_lock = threading.Lock()

            for future in as_completed(futures):
                done += 1
                result = future.result()
                if result:
                    found += 1
                    with buf_lock:
                        results_buf.append(json.dumps(result))

                # Her 5 sonuçta bir veya her 20 şehirde bir gönder
                if done % 5 == 0 or done % 20 == 0:
                    with buf_lock:
                        for r in results_buf:
                            yield f"data:{r}\n\n"
                        results_buf.clear()
                    yield f"data:{json.dumps({'type':'progress','done':done,'total':len(targets),'found':found})}\n\n"

            # Kalan sonuçları gönder
            with buf_lock:
                for r in results_buf:
                    yield f"data:{r}\n\n"

        yield f"data:{json.dumps({'type':'done','found':found})}\n\n"
        print(f"[EVERYWHERE] DONE: {found}/{len(targets)} destinasyon")

    return Response(generate(), mimetype="text/event-stream",
                    headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})

@app.route("/api/cache/clear")
def api_cache_clear():
    """Belirli kalkış+tarih kombinasyonunun cache'ini sıfırla"""
    from_id   = request.args.get("from")
    dates_str = request.args.get("dates")
    if not from_id or not dates_str:
        return jsonify({"ok": False})
    from_uuid = from_id if len(from_id) > 20 else get_uuid_by_name(from_id)
    if not from_uuid:
        return jsonify({"ok": False})
    dates = [d.strip() for d in dates_str.split(",") if d.strip()]
    cleared = 0
    with search_cache_lock:
        keys_to_del = [k for k in search_cache 
                       if k.startswith(f"{from_uuid}|") and 
                       any(k.endswith(f"|{d}") for d in dates)]
        for k in keys_to_del:
            del search_cache[k]
            cleared += 1
    # Prefetch running set'ini de temizle
    with prefetch_running_lock:
        for d in dates:
            prefetch_running.discard(f"{from_uuid}|{d}")
    print(f"[CACHE CLEAR] {from_uuid} | {len(dates)} tarih | {cleared} kayıt silindi")
    return jsonify({"ok": True, "cleared": cleared})

@app.route("/api/cache/status")
def api_cache_status():
    """Cache durumunu döndür — kaç sonuç var, ne zaman güncellendi"""
    from_id   = request.args.get("from")
    dates_str = request.args.get("dates")
    if not from_id or not dates_str:
        return jsonify({})
    from_uuid = from_id if len(from_id) > 20 else get_uuid_by_name(from_id)
    if not from_uuid:
        return jsonify({})
    dates = [d.strip() for d in dates_str.split(",") if d.strip()]
    
    oldest_ts = None
    total_cached = 0
    with search_cache_lock:
        for key, entry in search_cache.items():
            parts = key.split("|")
            if len(parts) == 3 and parts[0] == from_uuid and parts[2] in dates:
                if (time.time() - entry["ts"]) < SEARCH_CACHE_TTL:
                    total_cached += 1
                    if oldest_ts is None or entry["ts"] < oldest_ts:
                        oldest_ts = entry["ts"]
    
    return jsonify({
        "cached": total_cached,
        "age_str": cache_age_str(oldest_ts) if oldest_ts else None,
        "age_secs": int(time.time() - oldest_ts) if oldest_ts else None,
        "fresh": oldest_ts is not None
    })

@app.route("/api/prefetch")
def api_prefetch():
    """Arka planda prefetch başlatır, hemen 200 döner"""
    from_id   = request.args.get("from")
    dates_str = request.args.get("dates")
    if not from_id or not dates_str:
        return jsonify({"ok": False})
    from_uuid = from_id if len(from_id) > 20 else get_uuid_by_name(from_id)
    if not from_uuid:
        return jsonify({"ok": False})

    dates = [d.strip() for d in dates_str.split(",") if d.strip()]

    def run_prefetch():
        target_uuids = get_reachable(from_uuid)
        targets = [(u, city_cache[u]) for u in target_uuids if u in city_cache]

        for date in dates:
            # Cache'de varsa ve tazeyse atla
            results, ts = cache_get(from_uuid, date)
            if results is not None:
                print(f"[PREFETCH] {date} cache'de mevcut, atlanıyor")
                continue

            key = f"{from_uuid}|{date}"
            with prefetch_running_lock:
                if key in prefetch_running:
                    continue
                prefetch_running.add(key)

            print(f"[PREFETCH] {date} başlıyor — {len(targets)} şehir")

            def search_one_pf(args):
                to_uuid, city, d = args
                try:
                    trips = do_search(from_uuid, to_uuid, d)
                    if trips:
                        b = trips[0]
                        result = {
                            "toId": to_uuid, "name": city["name"],
                            "flag": city["flag"], "country": city["country_tr"],
                            "price": b["price"], "dep": b["dep"], "arr": b["arr"],
                            "durMin": b["dur_min"], "direct": b["direct"],
                            "bookUrl": b["bookUrl"], "bestDate": d
                        }
                        cache_set(from_uuid, d, to_uuid, result)
                        return result
                except:
                    pass
                return None

            combos = [(u, city, date) for u, city in targets]
            with ThreadPoolExecutor(max_workers=20) as ex:
                list(ex.map(lambda c: search_one_pf(c), combos))

            with prefetch_running_lock:
                prefetch_running.discard(key)
            print(f"[PREFETCH] {date} tamamlandı")

    threading.Thread(target=run_prefetch, daemon=True).start()
    return jsonify({"ok": True, "dates": len(dates)})

@app.route("/api/prefetch/status")
def api_prefetch_status():
    """Cache durumunu döndür"""
    from_id   = request.args.get("from")
    dates_str = request.args.get("dates")
    if not from_id or not dates_str:
        return jsonify({})
    from_uuid = from_id if len(from_id) > 20 else get_uuid_by_name(from_id)
    dates = [d.strip() for d in dates_str.split(",") if d.strip()]
    status = {}
    for date in dates:
        results, ts = cache_get(from_uuid, date)
        status[date] = {
            "ready": results is not None,
            "count": len(results) if results else 0,
            "age": cache_age_str(ts) if ts else None
        }
    return jsonify(status)

@app.route("/api/everywhere/multi")
def api_everywhere_multi():
    from_id   = request.args.get("from")
    dates_str = request.args.get("dates")  # virgülle ayrılmış tarihler
    if not from_id or not dates_str:
        return jsonify({"error": "from ve dates gerekli"}), 400
    from_uuid = from_id if len(from_id) > 20 else get_uuid_by_name(from_id)
    if not from_uuid:
        return jsonify({"error": f"Bilinmeyen şehir: {from_id}"}), 400

    dates = [d.strip() for d in dates_str.split(",") if d.strip()]
    target_uuids = get_reachable(from_uuid)
    targets = [(u, city_cache[u]) for u in target_uuids if u in city_cache]

    print(f"[MULTI] {from_uuid} | {len(dates)} tarih x {len(targets)} şehir = {len(dates)*len(targets)} kombinasyon")

    def generate():
        # Her şehir için tüm tarihlerde en ucuz sonucu bul
        total_combos = len(dates) * len(targets)
        yield f"data:{json.dumps({'type':'start','total':total_combos})}\n\n"

        best = {}       # to_uuid -> en iyi sonuç
        done = 0
        best_lock = threading.Lock()
        buf = []
        buf_lock = threading.Lock()

        def search_one(args):
            to_uuid, city, date = args
            try:
                # do_search zaten cache'e bakıyor ve cache'e yazıyor
                trips = do_search(from_uuid, to_uuid, date)
                if trips:
                    b = trips[0]
                    return {"type":"result","toId":to_uuid,"name":city["name"],
                            "flag":city["flag"],"country":city["country_tr"],
                            "price":b["price"],"dep":b["dep"],"arr":b["arr"],
                            "durMin":b["dur_min"],"direct":b["direct"],
                            "bookUrl":b["bookUrl"],"bestDate":date,
                            "lat":city.get("lat"),"lon":city.get("lon")}
            except Exception:
                pass
            return None

        # Tüm tarih+şehir kombinasyonlarını oluştur
        combos = [(u, city, date) for date in dates for u, city in targets]

        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = {executor.submit(search_one, c): c for c in combos}
            results_buf = []

            for future in as_completed(futures):
                done += 1
                result = future.result()
                if result:
                    key = result["toId"]
                    with best_lock:
                        if key not in best or result["price"] < best[key]["price"]:
                            best[key] = result
                            results_buf.append(json.dumps(result))

                # Her 10 sonuçta bir gönder
                if done % 10 == 0:
                    with best_lock:
                        for r in results_buf:
                            yield f"data:{r}\n\n"
                        results_buf.clear()
                    yield f"data:{json.dumps({'type':'progress','done':done,'total':total_combos})}\n\n"

            # Kalanları gönder
            with best_lock:
                for r in results_buf:
                    yield f"data:{r}\n\n"

        # En eski cache timestamp'ini bul
        oldest_ts = None
        for date in dates:
            _, ts = cache_get(from_uuid, date)
            if ts and (oldest_ts is None or ts < oldest_ts):
                oldest_ts = ts
        age_str = cache_age_str(oldest_ts) if oldest_ts else "az önce güncellendi"
        yield f"data:{json.dumps({'type':'done','found':len(best),'age':age_str})}\n\n"
        print(f"[MULTI] DONE: {len(best)} destinasyon")

    return Response(generate(), mimetype="text/event-stream",
                    headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})

# ── Başlangıç ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n================================================")
    print("  BusScanner başlıyor...")
    print("  http://localhost:3000")
    print("================================================\n")

    def startup():
        load_cities()
        build_name_index()

    threading.Thread(target=startup, daemon=True).start()
    app.run(host="0.0.0.0", port=3000, debug=False, threaded=True, use_reloader=False, processes=1)
