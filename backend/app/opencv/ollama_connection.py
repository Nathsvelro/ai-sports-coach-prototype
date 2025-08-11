import requests
import subprocess
import os   

process = subprocess.Popen(
    ['ollama','run','llama2'], 
    stdout=subprocess.PIPE, 
    stderr=subprocess.PIPE
)

# === OLLAMA (local) ====
def text_to_text_ollama(datos, ejercicio):
    """
    Usa Ollama para generar texto de acuerdo al prompt
    """
    try:
        # Crear resumen de datos
        if not datos:
            return "No hay datos suficientes para analizar."
        
        
        # Crear prompt específico
        prompt = f"""
You are a professional sports trainer. Analyze the following exercise {ejercicio} using next data and give concise, clear feedback in English, maximum 50 words, in a motivating and professional tone. Data:{datos}
"""

        # Llamada a Ollama (local)
        response = requests.post(
            'http://localhost:11434/api/generate', # update if needed
            json={
                'model': 'llama2',  
                'prompt': prompt,
                'stream': False,
                'options': {
                    'temperature': 0.5,
                    'max_tokens': 500
                }
            },
            timeout=45
        )
        
        if response.status_code == 200:
            result = response.json()
            texto_analisis = result['response'].strip()
            #print(f"🤖 Ollama: {texto_analisis}")
            return texto_analisis
        else:
            return "Failed to connect to Ollama. Keep your form up."
            
    except Exception as e:
        print(f"❌ Error con Ollama: {e}")
        return f"Maintain your form in {ejercicio}. Keep it up."
    

if __name__ == "__main__":
    # Test the Ollama connection
    test_data = {
        "angle": 45,
        "symmetry": "balanced",
        "speed": "moderate"
    }
    test_exercise = "Push-up"
    result = text_to_text_ollama(test_data, test_exercise)
    print(f"Test Result: {result}")