import cv2
import mediapipe as mp
import json
import time
import random
import requests
import os
import numpy as np
import openai
import base64
from fastapi import FastAPI, WebSocket
from openai import OpenAI
from datetime import datetime
from elevenlabs import ElevenLabs, play


app = FastAPI()

# mediapipe setup
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose = mp_pose.Pose()

# ==== CONFIGURACIÓN ELEVENLABS ====
ELEVEN_API_KEY = "sk_404a33dd38b152b6714728b5e767c964dfdee7b104995f14"  # <- Coloca tu API Key
OPEN_API_KEY = ""
GROQ_API_KEY = ""

# ==== ELEVENLABS CLIENT ====
eleven_client = ElevenLabs(api_key=ELEVEN_API_KEY)

# ==== OPENAI CLIENT ====
openai_client = OpenAI(
  api_key=OPEN_API_KEY
)

# ==== CONFIGURACIÓN MEDIAPIPE ====
mp_pose = mp.solutions.pose
pose = mp_pose.Pose()
mp_drawing = mp.solutions.drawing_utils
start_time = time.time()

# ==== VARIABLES DE CONTROL ====
pausado = False
grabando = True
history = []
posx = [
    'RIGHT_SHOULDER', 'RIGHT_ELBOW', 'RIGHT_WRIST','RIGHT_HIP',
    'LEFT_SHOULDER', 'LEFT_ELBOW', 'LEFT_WRIST','LEFT_HIP'
]

# ==== AUX ====
def calcular_angulos_corporales(posiciones):
    """
    Calcula los ángulos principales del cuerpo a partir de las posiciones.
    
    Args:
        posiciones: Diccionario con coordenadas de MediaPipe
        
    Returns:
        dict: Ángulos calculados en grados
    """
    def angulo_3_puntos(p1, p2, p3):
        """Calcula ángulo entre 3 puntos (p2 es el vértice)"""
        try:
            a = np.array([p1['x'], p1['y']])
            b = np.array([p2['x'], p2['y']])
            c = np.array([p3['x'], p3['y']])
            
            ba = a - b
            bc = c - b
            
            cos_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
            cos_angle = np.clip(cos_angle, -1.0, 1.0)
            angle = np.degrees(np.arccos(cos_angle))
            
            return round(angle, 1)
        except:
            return None
    
    def simetria_posiciones(pos1, pos2):
        """Calcula simetría entre dos posiciones (0-180 grados)"""
        try:
            a = np.array([pos1['x'], pos1['y']])
            b = np.array([pos2['x'], pos2['y']])
            delta = a - b
            angle = np.degrees(np.arctan2(delta[1], delta[0]))
            angle = abs(angle)
            if angle > 180:
                angle = 360 - angle
            return round(angle, 1)
        except:
            return None
    
    angulos = {}
    simetrias = {}
    
    # Brazos
    if all(k in posiciones for k in ['LEFT_SHOULDER', 'LEFT_ELBOW', 'LEFT_WRIST']):
        angulos['codo_izquierdo'] = angulo_3_puntos(
            posiciones['LEFT_SHOULDER'], posiciones['LEFT_ELBOW'], posiciones['LEFT_WRIST'])
    
    if all(k in posiciones for k in ['RIGHT_SHOULDER', 'RIGHT_ELBOW', 'RIGHT_WRIST']):
        angulos['codo_derecho'] = angulo_3_puntos(
            posiciones['RIGHT_SHOULDER'], posiciones['RIGHT_ELBOW'], posiciones['RIGHT_WRIST'])
        
    if all(k in posiciones for k in ['RIGHT_HIP','RIGHT_SHOULDER', 'RIGHT_ELBOW']):
        angulos['hombro_derecho'] = angulo_3_puntos(
            posiciones['RIGHT_HIP'],posiciones['RIGHT_SHOULDER'], posiciones['RIGHT_ELBOW'])

    if all(k in posiciones for k in ['LEFT_HIP','LEFT_SHOULDER', 'LEFT_ELBOW']):
        angulos['hombro_izquierdo'] = angulo_3_puntos(
            posiciones['LEFT_HIP'], posiciones['LEFT_SHOULDER'], posiciones['LEFT_ELBOW'])
        
    if all(k in posiciones for k in ['RIGHT_HIP','RIGHT_SHOULDER', 'RIGHT_WRIST']):
        angulos['brazo_derecho'] = angulo_3_puntos(
            posiciones['RIGHT_HIP'],posiciones['RIGHT_SHOULDER'], posiciones['RIGHT_WRIST'])

    if all(k in posiciones for k in ['LEFT_HIP','LEFT_SHOULDER', 'LEFT_WRIST']):
        angulos['brazo_izquierdo'] = angulo_3_puntos(
            posiciones['LEFT_HIP'], posiciones['LEFT_SHOULDER'], posiciones['LEFT_WRIST'])
    
    if all(k in posiciones for k in ['RIGHT_SHOULDER','LEFT_SHOULDER']):
        simetrias['simetria_hombros'] = simetria_posiciones(
            posiciones['RIGHT_SHOULDER'], posiciones['LEFT_SHOULDER']
        )

    if all(k in posiciones for k in ['RIGHT_ELBOW','LEFT_ELBOW']):
        simetrias['simetria_codos'] = simetria_posiciones(
            posiciones['RIGHT_ELBOW'], posiciones['LEFT_ELBOW']
        )

    if all(k in posiciones for k in ['RIGHT_HIP','LEFT_HIP']):
        simetrias['simetria_cadera'] = simetria_posiciones(
            posiciones['RIGHT_HIP'], posiciones['LEFT_HIP']
        )

    if all(k in posiciones for k in ['RIGHT_WRIST','LEFT_WRIST']):
        simetrias['simetria_munecas'] = simetria_posiciones(
            posiciones['RIGHT_WRIST'], posiciones['LEFT_WRIST']
        )

    return angulos, simetrias


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


# === configuraciones de ventana opcionales ===
def mostrar_controles(frame):
    """
    Muestra los controles disponibles en la ventana.
    """
    controles = [
        "CONTROLES:",
        "ESPACIO - Pausa/Reanudar",
        "Q - Salir y guardar",
        "R - Iniciar/Parar grabación",
        "C - Limpiar historial",
        "S - Guardar historial ahora"
    ]
    
    y_offset = 30
    for i, texto in enumerate(controles):
        color = (255, 255, 255) if i == 0 else (200, 200, 200)
        grosor = 2 if i == 0 else 1
        cv2.putText(frame, texto, (10, y_offset + i * 25), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, grosor)

def mostrar_estado(frame):
    """
    Muestra el estado actual del sistema.
    """
    estados = [
        f"Estado: {'PAUSADO' if pausado else 'ACTIVO'}",
        f"Grabando: {'SI' if grabando else 'NO'}",
        f"Capturas: {len(history)}",
        f"Tiempo: {time.time() - start_time:.1f}s"
    ]
    
    y_offset = 200
    for i, texto in enumerate(estados):
        if "PAUSADO" in texto:
            color = (0, 0, 255)  # Rojo para pausado
        elif "ACTIVO" in texto:
            color = (0, 255, 0)  # Verde para activo
        else:
            color = (255, 255, 255)  # Blanco para otros
            
        cv2.putText(frame, texto, (10, y_offset + i * 25), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)


# === Guardar historial ===
def guardar_historial():
    """
    Guarda el historial en un archivo JSON.
    """
    if not history:
        print("📭 No hay datos para guardar")
        return
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    nombre_archivo = f"coordenadas_{timestamp}.json"
    
    try:
        with open(nombre_archivo, 'w') as archivo:
            json.dump(history, archivo, indent=2)
        print(f"✅ Historial guardado en: {nombre_archivo}")
    except Exception as e:
        print(f"❌ Error guardando: {e}")


def procesar_frame(frame_b64):
    # Convertir a RGB para MediaPipe
    img_data = base64.b64decode(frame_b64.split(",")[1])
    np_arr = np.frombuffer(img_data, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(rgb_frame)
    
    posiciones = {}

    if results.pose_landmarks:
        h, w, _ = frame.shape
        for i, lm in enumerate(results.pose_landmarks.landmark):
            if lm.visibility < 0.5:
                continue
            if mp_pose.PoseLandmark(i).name not in posx:
                continue
            posiciones[mp_pose.PoseLandmark(i).name] = {
                "x": round(lm.x * w, 2),
                "y": round(lm.y * h, 2),
                "z": round(lm.z, 4),
                "visibility": round(lm.visibility, 4),
                "timestamp": time.time()
            }

        angulos, simetrias = calcular_angulos_corporales(posiciones)
        return angulos, simetrias
    return {}, {}


@app.websocket("/ws/video")
async def websocket_video(websocket: WebSocket):
    await websocket.accept()

    ejercicio = None
    history = []
    start_time = time.time()

    try:
        while True:
            mensaje = await websocket.receive_json()
            data = json.loads(mensaje)

            if "ejercicio" in data and ejercicio is None:
                ejercicio = data["ejercicio"]

            if "frame" in data and data["frame"]:
                # Procesar frame
                angulos, simetrias = procesar_frame(data['frame'])

                # Guardar en historial
                history.append({
                    "timestamp": time.time(),
                    "angulos": angulos,
                    "simetrias": simetrias
                })

                
            # mantener 15 segundos
            if time.time() - start_time >= 15:
                # llamada a ollama
                response = text_to_text_ollama(datos=random.sample(history[5:-6],3), ejercicio=ejercicio)
                # envio a elevenlabs
                audio = text_to_speech(datos=response)
                # regreso audio
                return audio

    except Exception as e:
        print("WebSocket cerrado:", e)
    finally:
        cv2.destroyAllWindows()


def run_opencv_process(ejercicio:str="curl biceps"):
# ==== CAPTURA DE CÁMARA ====
    # cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    cap = cv2.VideoCapture(0)
    start_time = time.time()
    cv2.namedWindow('Control de Entrenamiento', cv2.WINDOW_NORMAL)
    cv2.resizeWindow('Control de Entrenamiento', 800, 600)

    start_point = time.time()
    time_interval = 0.5

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # CONTROLES DE TECLADO
        
        key = cv2.waitKey(1) & 0xFF
        """
        if key == ord('q') or key == 27:  # 'q' o ESC para salir
            print("🛑 Saliendo...")
            break
        elif key == ord(' '):  # ESPACIO para pausa
            pausado = not pausado
            print(f"⏯️  {'Pausado' if pausado else 'Reanudado'}")
        elif key == ord('r'):  # 'r' para iniciar/parar grabación
            grabando = not grabando
            print(f"🔴 Grabación: {'INICIADA' if grabando else 'DETENIDA'}")
        elif key == ord('c'):  # 'c' para limpiar historial
            history.clear()
            print("🗑️  Historial limpiado")
        elif key == ord('s'):  # 's' para guardar ahora
            guardar_historial()
        """

        # ✅ PROCESAR SOLO SI NO ESTÁ PAUSADO
        if not pausado:
            # Convertir a RGB para MediaPipe
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(rgb_frame)
            # results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

            if results.pose_landmarks:
                mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)

                # Extraer todas las posiciones en un diccionario
                h, w, _ = frame.shape
                posiciones = {}
                for i, lm in enumerate(results.pose_landmarks.landmark):
                    if lm.visibility < 0.5:
                        continue

                    if mp_pose.PoseLandmark(i).name not in posx:
                        continue

                    posiciones[mp_pose.PoseLandmark(i).name] = {
                        "x": round(lm.x * w, 2),
                        "y": round(lm.y * h, 2),
                        "z": round(lm.z, 4),
                        "visibility": round(lm.visibility, 4),
                        "timestamp": time.time()
                    }

                # Calcular ángulos
                angulos, simetrias = calcular_angulos_corporales(posiciones)

                # Agregar al historial solo si está grabando
                if grabando and time.time() - start_point >= time_interval:
                    history.append({
                        "timestamp": time.time(),
                        "angulos": angulos,
                        "simetrias": simetrias
                    })
                    start_point = time.time()
                    #print(f"📊 Captura #{len(history)} guardada")

        if time.time() - start_time >= 15:
            break
        
        # MOSTRAR INTERFAZ EN PANTALLA (Opcional)
        # mostrar_controles(frame)
        # mostrar_estado(frame)
        
        # Indicador visual de pausa
        """
        if pausado:
            cv2.rectangle(frame, (300, 250), (500, 350), (0, 0, 255), -1)
            cv2.putText(frame, "PAUSADO", (330, 310), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1.5, (255, 255, 255), 3)

        """
        cv2.imshow('Control de Entrenamiento', frame)
        
    
    #print("💾 Guardando historial final...")
    #guardar_historial()
    #print(f"📊 Total de capturas: {len(history)}")

    cap.release()
    cv2.destroyAllWindows()
    cv2.waitKey(1)

    # ollama2
    response = text_to_text_ollama(datos=random.sample(history[5:-6],3), ejercicio=ejercicio)
    
    # elevenlabs
    audio = text_to_speech(datos=response)
    return audio


if __name__ == "__main__": 
    audio = run_opencv_process(ejercicio="curl biceps")
    play(audio)