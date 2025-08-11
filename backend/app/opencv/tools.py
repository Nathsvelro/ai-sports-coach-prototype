# -*- coding: utf-8 -*-
# Function to process data from MediaPipe pose landmarks and calculate body angles and symmetries.
# This module is used in the OpenCV application for real-time exercise analysis.

import numpy as np

def calcular_angulos_corporales(posiciones:dict) -> tuple[dict,dict]:
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