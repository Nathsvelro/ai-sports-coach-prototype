import requests
from dotenv import load_dotenv
import os   

load_dotenv()   
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# ==== GROQ ====
def text_to_text_groq(datos, ejercicio):
    """
    Usa Groq con Llama
    """
    try:
        if not datos:
            return "There is not enough data to analyze."
        
        prompt = f"""
You are a professional sports trainer. Analyze the following exercise {ejercicio} using next data and give concise, clear feedback in English, maximum 50 words, in a motivating and professional tone. Data:{datos}
"""

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messages": [
                {"role": "system", "content": "Eres un entrenador personal conciso y motivador."},
                {"role": "user", "content": prompt}
            ],
            "model": "llama3-8b-8192",  
            "max_tokens": 400,
            "temperature": 0.7
        }
        
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=15
        )
        
        if response.status_code == 200:
            resultado = response.json()
            texto = resultado['choices'][0]['message']['content'].strip()
            print(f"🚀 Groq: {texto}")
            return texto
        else:
            print(f"❌ Error Groq: {response.status_code}")
            return f"Continúa con buena técnica en {ejercicio}."
            
    except Exception as e:
        print(f"❌ Error con Groq: {e}")
        return f"Mantén la forma en {ejercicio}."