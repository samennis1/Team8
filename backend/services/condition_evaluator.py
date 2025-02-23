import openai
import json
from typing import List, Dict
import os
from dotenv import load_dotenv

load_dotenv()

class ConditionEvaluator:
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
        self.system_prompt = """
            You are an AI-powered evaluator specializing in assessing the appearance condition of second-hand electronic devices based on images. Your goal is to analyze the device's external condition strictly based on the provided images.

            Evaluation Criteria:
            - Screen & Body: Check for visible scratches, cracks, dents, or other damages.
            - Buttons & Ports: Assess whether all buttons appear intact and if charging, headphone, and USB ports show signs of wear or damage.
            - Camera & Lenses: Examine the lenses for visible dust, cracks, or blurriness.
            
            Output Format:
                Your response must be a JSON object ONLY in the following format:
                {
                    "appearance_cond": "<Concise 20-word description of the device's condition>",
                    "reliability": <Reliability percentage based on image clarity and coverage>
                }
            Reliability Calculation:
            - If the images clearly show all key areas, provide high reliability (80-100%).
            - If some details are missing or unclear, reduce the reliability accordingly.
            - If critical areas are obscured or not visible, lower the reliability significantly (below 50%).
            Do not include any extra text or explanation outside the JSON response.
            """

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

    def evalute_condition(self, prompt: str, image_urls: List[str] = None) -> Dict:
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
            }

def evaluate_condition(image_urls):
    prompt = "start evaluation"
    api_key = os.getenv("OPEN_AI_API_KEY")
    evaluator = ConditionEvaluator(api_key)
    
    result = evaluator.evalute_condition(prompt, image_urls)
    print("Evaluation Result:")
    print(json.dumps(result, indent=4))
    return json.dumps(result, indent=4)

# evaluate_condition([
#             "https://forums.macrumors.com/attachments/1721668/",
#             "https://www.thesun.co.uk/wp-content/uploads/2020/11/IMG_0577-2.jpg?strip=all&w=960"
#         ])