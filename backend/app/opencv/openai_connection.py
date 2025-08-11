from openai import OpenAI
from dotenv import load_dotenv
import os   


load_dotenv()
OPEN_API_KEY = os.getenv("OPENAI_API_KEY")
# # ==== OPENAI CLIENT ====
openai_client = OpenAI(
  api_key=OPEN_API_KEY
)


# === OPENAI GPT-4o ====
def text_to_text_gpt(datos, ejercicio):
    """
    Transforma texto a texto usando OpenAI GPT-4o
    """
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-5-nano",
            messages=[
                {"role": "system", "content": "You are a professional sports trainer."},
                {"role": "user", "content": f"""
    Analyze the following exercise {ejercicio} using next data and give concise, clear feedback in English, maximum 50 words, in a motivating and professional tone. Data:{datos}
    """}
            ]
        )
        if response.status_code == 200:
            return response.choices[0].message.content
        else:
            return "Error connecting to OpenAI. Keep your form up."
    except Exception as e:
        return f"Keep your form in {ejercicio}. Keep it up."