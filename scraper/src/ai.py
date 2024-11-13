import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI()


with open("./data/un-sovereign-countries.json", "r") as file:
    countries = [{"id": c["alpha2"].lower(), "name": c["name"]} for c in json.load(file)]


class Completions:
    @staticmethod
    def get_country_code_based_on_country_name(country_name: str):
        prompt = "You must only answer in JSON objects. You will receive the name of a country, territory or region possibly in a raw format. You must return a JSON object with this structure: { 'is_sovereign': boolean; 'country': 'XX' | null } where 'XX' is the alpha2 code of the country. If the territory provided is not a sovereign member of the United Nations (i.e.: Puerto Rico, Hong Kong, Taiwan), you must return null for the 'country' key.\n\nThese are the only possible country codes for UN Recognized Countries: " + ','.join([c['id'] for c in countries])
        prompt += f"\n\nDo not include three backticks in your response to specify the return format. Instead, just return raw JSON content."
        completion = client.chat.completions.create(model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": prompt},
                {
                  "role": "user",
                  "content": f"Name: {country_name}"
                }
            ]
        )

        return completion
