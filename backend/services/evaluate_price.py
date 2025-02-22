import openai
import json
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPEN_AI_API_KEY")

def evaluate_price(desc, price):

    prompt = f'{desc} (Asking: EUR {price})'

    client = openai.OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": """Your goal is to respond in the prescribed JSON format (do not include anything else except the prescribed JSON output), and calculate the fair market value (in currency EUR) of a product.

            You'll be provided the name of the product and your goal is to scower the internet for all possible listings including Amazon, Facebook Marketplace, CEX,
            Ebay, CEX, Currys etc. depending upon the country of the buyer & seller, in this case it is always Republic of Ireland.

            Also note that the fair market value may be lower than the Original Maximum Retail Price, and how good of a deal is it. 

            Also consider things like if it's broken or not, and if say, screen of the laptop doesn't turn on, you consider that while analysing the fair market value

            Factor in the difference in price (you will be provided an asking price) also, if it's minimal, ensure that fair market value matches asking price.

            Suggestion must always be less than 20 words.
            JSON Format:
            data = {
            fairMarketValue = 1000,
            goodDeal = true,
            suggestion = "AI recommends purchasing the product, considering the asking price is way lower than the potential value of the product.",
            }
            """},
            {"role": "user", "content": prompt}
        ]
    )

    output = response.choices[0].message.content


    print(json.dumps(output, indent=4))
    return json.dumps(output, indent=4)

# evaluate_price('Used MacBook Pro M1 Pro (2021) 14 Inch', 500)