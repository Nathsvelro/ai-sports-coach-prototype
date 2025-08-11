import cv2
import mediapipe as mp
import json
import time
import random
import numpy as np
import base64
from datetime import datetime
from elevenlabs import play
from tools import calcular_angulos_corporales
from elevenlabs_connection import text_to_speech
from ollama_connection import text_to_text_ollama

# mediapipe setup
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose = mp_pose.Pose()

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

        # PROCESAR SOLO SI NO ESTÁ PAUSADO
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