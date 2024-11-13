import json
import gzip
import base64

import pandas as pd
from io import StringIO
from bs4 import BeautifulSoup
from ai import Completions


class Utils:
    @staticmethod
    def is_table_a_visa_requirement_table(df: pd.DataFrame):
        lower_cols = [col.lower().strip() for col in df.columns]
        target_terms = ['visa requirement', 'entry requirement']
        return any([term in lower_cols for term in target_terms])


class RuleSets:
    def __init__(self):
        with open('./data/country-name-exceptions.json', 'r') as file:
            self.country_name_exceptions = json.load(file)

    def get_country_code_by_name(self, country_name: str):
        if country_name in self.country_name_exceptions:
            return self.country_name_exceptions[country_name]
        return None


class Parser:
    def __init__(self, countries: list[dict[str, str]], html_file_dir: str, print_log=True):
        self.countries = countries
        self.html_file_dir = html_file_dir
        self.exceptions = RuleSets()
        self.non_sovereign_country_cache = []
        self.completion_country_cache = {}
        self.print_log = print_log
        self.logs = []

    def log(self, *message):
        if self.print_log:
            print(*message)
        self.logs.append(" ".join(map(str, message)).replace(
            "\033[92m", "").replace("\033[00m", ""))

    def build_dataset(self):
        dataset = self.build_empty_dataset()
        for country_of_citizenship in self.countries:
            citizenship_country_id = country_of_citizenship["id"]
            with open(f"{self.html_file_dir}/html_{citizenship_country_id}.html", "r") as file:
                html = file.read()

            visa_req_df, country_column, visa_requirement_column = self.parse_article_html(
                html)
            for _, row in visa_req_df.iterrows():
                destination_country_name = row[country_column].strip()
                destination_country_id = self.find_exact_country_code(
                    destination_country_name)
                if not destination_country_id:
                    destination_country_id = self.exceptions.get_country_code_by_name(
                        destination_country_name)

                if not destination_country_id:
                    if destination_country_name in self.non_sovereign_country_cache:
                        self.log(
                            f"Skipping cached non-sovereign country: {destination_country_name}")
                        continue

                if not destination_country_id:
                    if destination_country_name in self.completion_country_cache:
                        destination_country_id = self.completion_country_cache[destination_country_name]
                        self.log(f"Fetching cached completion for sovereign country: {
                                 destination_country_name}, {destination_country_id}")
                    else:
                        # AI fallback
                        try:
                            self.log(f"Making API call to OpenAI for completion for country name: {
                                     row[country_column]}")
                            completion = Completions.get_country_code_based_on_country_name(
                                destination_country_name)
                            completion_data = json.loads(
                                completion.choices[0].message.content)
                        except json.JSONDecodeError:
                            self.log(f"Error parsing JSON content for country '{
                                     destination_country_name}': {completion.choices[0].message.content}")
                            continue

                        if not completion_data['is_sovereign']:
                            self.non_sovereign_country_cache.append(
                                destination_country_name)
                            self.log(
                                f"Skipping non-sovereign country: {destination_country_name}")
                            continue

                        if completion_data['country'] is None:
                            self.log(f"Skipping completion for unidentified country: {
                                     destination_country_name}")
                            continue

                        destination_country_id = completion_data['country'].lower(
                        )
                        self.completion_country_cache[destination_country_name] = destination_country_id

                target_record = [idx for idx, record in enumerate(
                    dataset) if record['country_of_citizenship'] == citizenship_country_id and record['country_of_destination'] == destination_country_id]
                if len(target_record) == 0:
                    self.log("Skipping completion for non-existent record:",
                             (citizenship_country_id, destination_country_id))
                    continue

                self.log(f"\033[92m✓\033[00m Updating visa requirement for: {
                         (citizenship_country_id, destination_country_id)}")
                dataset[target_record[0]
                        ]['visa_requirement'] = row[visa_requirement_column].lower()

        return dataset

    def build_empty_dataset(self):
        records = []

        for country_of_citizenship in self.countries:
            for country_of_destination in self.countries:
                if country_of_citizenship["id"] != country_of_destination["id"]:
                    records.append({
                        "country_of_citizenship": country_of_citizenship["id"],
                        "country_of_destination": country_of_destination["id"],
                        "visa_requirement": None,
                    })

        return records

    def find_exact_country_code(self, country_name: str):
        for country in self.countries:
            if country["name"] == country_name:
                return country["id"]

    @classmethod
    def parse_article_html(cls, html: str):
        soup = BeautifulSoup(html, 'lxml')
        tables = soup.find_all('table', class_='sortable')

        df = cls.get_visa_requirements_df(tables)
        country_column = cls.get_country_column_name(df.columns)
        if not country_column:
            raise Exception("Country column not found")
        df[country_column] = df[country_column].str.replace(
            r'^Â\s*', '', regex=True)

        visa_requirement_column = cls.get_visa_requirement_column_name(
            df.columns)
        if not visa_requirement_column:
            raise Exception("Visa requirement column not found")
        df[visa_requirement_column] = df[visa_requirement_column].str.replace(
            r'\[\d+\]', '', regex=True).str.strip()

        return df, country_column, visa_requirement_column

    @staticmethod
    def get_visa_requirements_df(tables: list[BeautifulSoup]):
        if len(tables) == 0:
            raise None

        if len(tables) == 1:
            return pd.read_html(StringIO(str(tables[0])))[0]

        for table in tables:
            df = pd.read_html(StringIO(str(table)))[0]
            if Utils.is_table_a_visa_requirement_table(df):
                return df

        return None

    @staticmethod
    def get_country_column_name(columns: list[str]):
        target_terms = ['Country', 'Country / Region']
        for term in target_terms:
            if term in columns:
                return term
        return None

    @staticmethod
    def get_visa_requirement_column_name(columns: list[str]):
        target_terms = ['Visa requirement', 'Entry requirement']
        for term in target_terms:
            if term in columns:
                return term
        return None


if __name__ == '__main__':
    with open("./data/un-sovereign-countries.json", "r") as file:
        countries = [{"id": c["alpha2"].lower(), "name": c["name"]}
                     for c in json.load(file)]

    p = Parser(countries=countries, html_file_dir="output")
    dataset = p.build_dataset()
    df = pd.DataFrame(dataset)
    df.to_json("output/dataset.json", orient="records")

    with open("output/logs.txt", "w") as file:
        file.write('\n'.join(p.logs))

    df['visa_requirement'] = df['visa_requirement'].astype('category')
    visa_mapping = dict(enumerate(df['visa_requirement'].cat.categories))
    visa_enum = [visa_mapping[i] for i in range(len(visa_mapping))]
    df['visa_requirement'] = df['visa_requirement'].cat.codes

    rename_map = {'country_of_citizenship': 'c',
                  'country_of_destination': 'd', 'visa_requirement': 'v'}
    csv_file_path = "output/dataset.csv"
    df.rename(columns=rename_map).to_csv(csv_file_path, index=False)

    gz_file_path = "output/dataset.csv.gz"
    with open(csv_file_path, "rb") as csv_file:
        with gzip.open(gz_file_path, "wb") as gz_file:
            gz_file.writelines(csv_file)

    with open(gz_file_path, "rb") as gz_file:
        base64_output = base64.b64encode(gz_file.read()).decode('utf-8')

    with open("output/compressed_dataset.json", "w") as json_file:
        json.dump({
            "compressed": base64_output,
            "visa_enum": visa_enum,
        }, json_file)
