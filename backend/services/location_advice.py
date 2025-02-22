import openai
import json
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPEN_AI_API_KEY")


def decimal_to_dms(decimal):
    degrees = int(abs(decimal))
    minutes_full = (abs(decimal) - degrees) * 60
    minutes = int(minutes_full)
    seconds = (minutes_full - minutes) * 60
    return degrees, minutes, seconds

def format_coordinate(lat, lon):
    lat_dir = "N" if lat >= 0 else "S"
    lon_dir = "E" if lon >= 0 else "W"

    # Convert to DMS:
    lat_deg, lat_min, lat_sec = decimal_to_dms(lat)
    lon_deg, lon_min, lon_sec = decimal_to_dms(lon)

    # print(f"{lat_deg}°{lat_min}′{lat_sec:.0f}″ {lat_dir}", f"{lon_deg}°{lon_min}′{lon_sec:.0f}″ {lon_dir}")

    return  f"{lat_deg}°{lat_min}′{lat_sec:.0f}″ {lat_dir}", f"{lon_deg}°{lon_min}′{lon_sec:.0f}″ {lon_dir}"

def generate_location(lat1, lon1, lat2, lon2):

    prompt = (
    f"Find suitable locations to meet up in public between {format_coordinate(lat1, lon1)} and {format_coordinate(lat2, lon2)}.\n"
    "Suitable locations include surveilled coffee shops, restaurants, etc.\n\n"
    "Return your output in standard JSON format as shown below:\n"
    '{\n'
    '  "data": [\n'
    '    {\n'
    '      "SuitableLocationName": "",\n'
    '      "SuitableLocationGPSLat": "",\n'
    '      "SuitableLocationGPSLong": "",\n'
    '      "SuitableLocationGoogleMapsLink": ""\n'
    '    }\n'
    '  ]\n'
    '}\n\n'
    "I want EXCLUSIVELY a JSON response with exact location data. Do not include any additional text."
    )

    client = openai.OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a exact location finder for safe and suitable meet-ups between buyers and sellers, you exclusively respond in JSON as per the prescribed format."},
            {"role": "user", "content": prompt}
        ]
    )

    output = response.choices[0].message.content


    print(json.dumps(output, indent=4))

generate_location(53.3121, -6.2624, 53.4, -6.8)