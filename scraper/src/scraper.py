import os
import time
import json
import random
import requests


class Scraper:
    def __init__(self, countries: list[dict[str, str]]):
        self.countries = countries

    def scrape(self):
        if not os.path.exists("output"):
            os.makedirs("output")

        for country in self.countries:
            country_id = country["id"]
            link = country["link"]
            try:
                response = self.make_request(link)
            except requests.exceptions.RequestException as e:
                print(f"Error scraping country '{country_id}': {e}")
                continue
            
            with open(f"output/html_{country_id}.html", "w") as file:
                print(f"Storing article HTML file for country {country_id}...")
                file.write(response.text)

            delay = random.uniform(2, 4)
            time.sleep(delay)


    @staticmethod
    def make_request(url: str, timeout: int = 10) -> requests.Response:
        USER_AGENTS = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
        ]

        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        }

        return requests.get(url, headers=headers, timeout=timeout)


if __name__ == '__main__':
    with open("./data/scraping-links.json", "r") as file:
        countries = json.load(file)

    s = Scraper(countries=countries)
    s.scrape()
