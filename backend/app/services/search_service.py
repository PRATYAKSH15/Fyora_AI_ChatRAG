from duckduckgo_search import DDGS
from typing import List, Dict
import asyncio

class SearchService:
    def __init__(self):
        self.ddgs = DDGS()
    
    async def search(self, query: str, max_results: int = 5) -> List[Dict]:
        """Perform web search using DuckDuckGo"""
        try:
            # Run in thread pool since duckduckgo_search is synchronous
            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(
                None,
                lambda: list(self.ddgs.text(query, max_results=max_results))
            )
            
            return [
                {
                    "title": r.get("title", ""),
                    "url": r.get("href", ""),
                    "snippet": r.get("body", ""),
                    "source": "web_search"
                }
                for r in results
            ]
        except Exception as e:
            print(f"Search error: {e}")
            return []

search_service = SearchService()