import json
import os
import time
from datetime import datetime
from typing import Optional

# ==================== CONFIG ====================
WATCHLIST = [
    "GOOGL", "MSFT", "APP", "META", "NVDA", "AMZN", "TSLA", "UNH",
    "ALAB", "LITE", "AMD", "CRWD", "PLTR",
    "AVAV", "ONDS",
    "LEU", "OKLO", "SMR", "LTBR", "USAR",
    "ASTS",
]

NEWS_DIR = "news"
MAX_ARTICLES_PER_TICKER = 8   # cap to avoid token overload
FETCH_DELAY_SECONDS = 1.0     # polite delay between article fetches
REQUEST_TIMEOUT = 10          # seconds per article fetch

os.makedirs(NEWS_DIR, exist_ok=True)
os.makedirs(os.path.join(NEWS_DIR, "digest"), exist_ok=True)


# ==================== FULL TEXT EXTRACTION ====================

def fetch_full_text(url: str) -> Optional[str]:
    try:
        import trafilatura
        downloaded = trafilatura.fetch_url(url, no_ssl=False, timeout=REQUEST_TIMEOUT)
        if not downloaded:
            return None
        text = trafilatura.extract(
            downloaded,
            include_comments=False,
            include_tables=False,
            no_fallback=False,
        )
        return text.strip() if text else None
    except Exception:
        return None


# ==================== NEWS FETCH ====================

def fetch_ticker_news(ticker: str) -> list[dict]:
    import yfinance as yf

    try:
        t = yf.Ticker(ticker)
        raw_news = t.news or []
    except Exception as e:
        print(f"  yfinance error for {ticker}: {e}")
        return []

    articles = []
    seen_urls = set()

    for item in raw_news[:MAX_ARTICLES_PER_TICKER]:
        content = item.get("content", {})

        title = content.get("title", "")
        url = (
            content.get("canonicalUrl", {}).get("url")
            or content.get("clickThroughUrl", {}).get("url")
            or ""
        )
        summary = content.get("summary", "")
        provider = content.get("provider", {}).get("displayName", "")
        pub_time = content.get("pubDate", "")

        if not title or not url or url in seen_urls:
            continue
        seen_urls.add(url)

        print(f"    [{provider}] {title[:70]}...")

        # Attempt full text extraction
        full_text = fetch_full_text(url)
        if full_text:
            print(f"      Full text: {len(full_text)} chars")
        else:
            print(f"      Full text: unavailable (paywall or JS-only)")

        articles.append({
            "ticker": ticker,
            "title": title,
            "url": url,
            "provider": provider,
            "published_at": pub_time,
            "summary": summary,
            "full_text": full_text,
            "has_full_text": full_text is not None,
        })

        time.sleep(FETCH_DELAY_SECONDS)

    return articles


# ==================== DEDUPLICATION ====================

def deduplicate(all_articles: list[dict]) -> list[dict]:
    seen = set()
    unique = []
    for a in all_articles:
        if a["url"] not in seen:
            seen.add(a["url"])
            unique.append(a)
    return unique


# ==================== MAIN ====================

def main():
    print("=" * 60)
    print("Stock News Fetcher")
    print(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print(f"{len(WATCHLIST)} tickers")
    print("=" * 60)

    try:
        import yfinance  # noqa
    except ImportError:
        print("ERROR: yfinance not installed. Run: pip install yfinance")
        return

    try:
        import trafilatura  # noqa
        print("trafilatura: available (full text extraction enabled)")
    except ImportError:
        print("WARNING: trafilatura not installed — full text will be skipped.")
        print("  Run: pip install trafilatura")

    today = datetime.now().strftime("%Y%m%d")
    all_articles: list[dict] = []

    for ticker in WATCHLIST:
        print(f"\n{ticker}...")
        articles = fetch_ticker_news(ticker)
        all_articles.extend(articles)

        # Save per-ticker file
        ticker_dir = os.path.join(NEWS_DIR, ticker)
        os.makedirs(ticker_dir, exist_ok=True)
        ticker_path = os.path.join(ticker_dir, f"{today}.json")
        with open(ticker_path, "w", encoding="utf-8") as f:
            json.dump(articles, f, indent=2, ensure_ascii=False)
        print(f"  Saved {len(articles)} articles -> {ticker_path}")

    # Save combined digest (deduplicated)
    digest = deduplicate(all_articles)
    digest_path = os.path.join(NEWS_DIR, "digest", f"{today}.json")
    with open(digest_path, "w", encoding="utf-8") as f:
        json.dump(digest, f, indent=2, ensure_ascii=False)

    full_text_count = sum(1 for a in digest if a["has_full_text"])
    print("\n" + "=" * 60)
    print(f"Total articles:    {len(digest)} (deduplicated)")
    print(f"With full text:    {full_text_count}")
    print(f"Title-only:        {len(digest) - full_text_count}")
    print(f"Digest saved to:   {digest_path}")
    print("=" * 60)


if __name__ == "__main__":
    main()
