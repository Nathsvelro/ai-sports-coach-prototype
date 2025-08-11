from elevenlabs import ElevenLabs, play
import os
from dotenv import load_dotenv

# ==== ELEVENLABS CLIENT ====
load_dotenv()
ELEVEN_API_KEY = os.getenv("ELEVENLABS_API_KEY")
eleven_client = ElevenLabs(api_key=ELEVEN_API_KEY)

def text_to_speech(datos:str):
    """
    Envía las coordenadas del cuerpo en formato JSON como texto al agente.
    """
    texto = datos
    audio = eleven_client.text_to_speech.convert(
        voice_id="21m00Tcm4TlvDq8ikWAM",
        model_id="eleven_multilingual_v2",
        text=texto
    )
    return audio

if __name__ == "__main__":
    # Ejemplo de uso
    texto = "Hola, este es un ejemplo de texto a voz."
    audio = text_to_speech(texto)
    play(audio)
    print("Audio generado y guardado como output.mp3")