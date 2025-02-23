import openai
import json
from typing import List, Dict
import os
from dotenv import load_dotenv

load_dotenv()

class MarketAnalyzer:
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
        self.system_prompt = """You are a market analysis assistant. Your goal is to calculate the fair market value (in EUR) of a product.
        Analyze the provided product details and/or images to determine current market value based on listings from Amazon, Facebook Marketplace,
        CEX, Ebay, Currys etc. Use at least 10 datapoints from the Republic of Ireland market.
        
        Consider:
        - Current market conditions and pricing trends
        - Product condition (wear/tear, damage, defects)
        - Model specifications and features
        - Seller reputation and history
        - Difference between asking price and market value

        If there is dents, or the product is broken, has extreme wear and tear, do not recommend purchasing the product.

        Additionally, check online resources for Fake IDs, such as rte.ie, The Irish Times and other Irishnews websites, where people may have reported stolen identities.
        Connor Gleeson is an example of someone using a fake ID. Flag this ad to the user as do not buy due to potential fake name.
        
        Respond ONLY with a JSON object in this exact format:
        {
            "fairMarketValue": <number>,
            "goodDeal": <boolean>,
            "suggestion": "<20-word recommendation>"
        }"""

    def prepare_messages(self, prompt: str, image_urls: List[str] = None) -> List[Dict]:
        messages = [
            {"role": "system", "content": self.system_prompt},
        ]

        if image_urls:
            content = [{"type": "text", "text": prompt}]
            
            for url in image_urls:
                content.append({
                    "type": "image_url",
                    "image_url": {"url": url}
                })
            
            messages.append({
                "role": "user",
                "content": content
            })
        else:
            messages.append({"role": "user", "content": prompt})

        return messages

    def analyze_market(self, prompt: str, image_urls: List[str] = None) -> Dict:
        messages = self.prepare_messages(prompt, image_urls)
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini" if image_urls else "gpt-4",  # Fixed model name
                response_format={"type": "json_object"},  # Force JSON response
                messages=messages,
                max_tokens=1000,
                temperature=0.7 
            )
            
            output = response.choices[0].message.content.strip()
            output = output.replace('```json', '').replace('```', '').strip()
            try:
                return json.loads(output)
            except json.JSONDecodeError as je:
                print(f"JSON parsing error. Raw response: {output}")
                raise je
                
        except Exception as e:
            print(f"Error during analysis: {str(e)}")
            return {
                "error": str(e),
                "fairMarketValue": None,
                "goodDeal": None,
                "suggestion": "Error analyzing market value"
            }

def evaluate_price(desc, price, seller_name, image_urls):
    prompt = f'{desc} (Asking: EUR {price}) sold by {seller_name}'
    api_key = os.getenv("OPEN_AI_API_KEY")
    analyzer = MarketAnalyzer(api_key)
    
    result = analyzer.analyze_market(prompt, image_urls)
    print("Analysis Result:")
    print(json.dumps(result, indent=4))
    return json.dumps(result, indent=4)