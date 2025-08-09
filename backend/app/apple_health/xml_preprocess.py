import xml.etree.ElementTree as ET
import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
import argparse


class AppleHealthXMLProcessor:
    """
    Procesador para convertir archivos XML de Apple Health a formato JSON.
    Maneja diferentes tipos de datos de salud y organiza la información de manera estructurada.
    """
    
    def __init__(self):
        self.health_data = {
            "metadata": {},
            "records": [],
            "workouts": [],
            "clinical_records": [],
            "activity_summaries": []
        }
        
        # Mapeo de tipos de datos comunes de Apple Health
        self.data_type_mapping = {
            "HKQuantityTypeIdentifierHeight": "height",
            "HKQuantityTypeIdentifierBodyMass": "weight", 
            "HKQuantityTypeIdentifierHeartRate": "heart_rate",
            "HKQuantityTypeIdentifierStepCount": "step_count",
            "HKQuantityTypeIdentifierDistanceWalkingRunning": "distance_walking_running",
            "HKQuantityTypeIdentifierActiveEnergyBurned": "active_energy_burned",
            "HKQuantityTypeIdentifierBasalEnergyBurned": "basal_energy_burned",
            "HKCategoryTypeIdentifierSleepAnalysis": "sleep_analysis",
            "HKQuantityTypeIdentifierRestingHeartRate": "resting_heart_rate",
            "HKQuantityTypeIdentifierVO2Max": "vo2_max",
            "HKQuantityTypeIdentifierFlightsClimbed": "flights_climbed"
        }
    
    def parse_xml_file(self, xml_file_path: str) -> None:
        """
        Parsea el archivo XML de Apple Health y extrae los datos.
        
        Args:
            xml_file_path (str): Ruta al archivo XML de Apple Health
        """
        print(f"Procesando archivo XML: {xml_file_path}")
        
        try:
            tree = ET.parse(xml_file_path)
            root = tree.getroot()
            
            # Extraer metadatos
            self._extract_metadata(root)
            
            # Extraer registros de salud
            self._extract_health_records(root)
            
            # Extraer entrenamientos
            self._extract_workouts(root)
            
            # Extraer registros clínicos
            self._extract_clinical_records(root)
            
            # Extraer resúmenes de actividad
            self._extract_activity_summaries(root)
            
            print(f"Procesamiento completado:")
            print(f"- Registros de salud: {len(self.health_data['records'])}")
            print(f"- Entrenamientos: {len(self.health_data['workouts'])}")
            print(f"- Registros clínicos: {len(self.health_data['clinical_records'])}")
            print(f"- Resúmenes de actividad: {len(self.health_data['activity_summaries'])}")
            
        except ET.ParseError as e:
            print(f"Error al parsear el archivo XML: {e}")
            raise
        except Exception as e:
            print(f"Error inesperado: {e}")
            raise
    
    def _extract_metadata(self, root: ET.Element) -> None:
        """Extrae metadatos del archivo XML."""
        # Información del export
        export_date = root.attrib.get('exportDate', '')
        
        # Información del dispositivo
        me_element = root.find('.//Me')
        if me_element is not None:
            self.health_data['metadata'] = {
                'export_date': export_date,
                'date_of_birth': me_element.attrib.get('HKCharacteristicTypeIdentifierDateOfBirth', ''),
                'biological_sex': me_element.attrib.get('HKCharacteristicTypeIdentifierBiologicalSex', ''),
                'blood_type': me_element.attrib.get('HKCharacteristicTypeIdentifierBloodType', ''),
                'fitzpatrick_skin_type': me_element.attrib.get('HKCharacteristicTypeIdentifierFitzpatrickSkinType', '')
            }
    
    def _extract_health_records(self, root: ET.Element) -> None:
        """Extrae registros de datos de salud."""
        records = root.findall('.//Record')
        
        for record in records:
            record_data = {
                'type': self._normalize_data_type(record.attrib.get('type', '')),
                'original_type': record.attrib.get('type', ''),
                'source_name': record.attrib.get('sourceName', ''),
                'source_version': record.attrib.get('sourceVersion', ''),
                'device': record.attrib.get('device', ''),
                'unit': record.attrib.get('unit', ''),
                'creation_date': record.attrib.get('creationDate', ''),
                'start_date': record.attrib.get('startDate', ''),
                'end_date': record.attrib.get('endDate', ''),
                'value': record.attrib.get('value', ''),
                'metadata': {}
            }
            
            # Extraer metadatos adicionales
            metadata_values = record.findall('.//MetadataEntry')
            for metadata in metadata_values:
                key = metadata.attrib.get('key', '')
                value = metadata.attrib.get('value', '')
                record_data['metadata'][key] = value
            
            self.health_data['records'].append(record_data)
    
    def _extract_workouts(self, root: ET.Element) -> None:
        """Extrae datos de entrenamientos."""
        workouts = root.findall('.//Workout')
        
        for workout in workouts:
            workout_data = {
                'workout_activity_type': workout.attrib.get('workoutActivityType', ''),
                'duration': workout.attrib.get('duration', ''),
                'duration_unit': workout.attrib.get('durationUnit', ''),
                'total_distance': workout.attrib.get('totalDistance', ''),
                'total_distance_unit': workout.attrib.get('totalDistanceUnit', ''),
                'total_energy_burned': workout.attrib.get('totalEnergyBurned', ''),
                'total_energy_burned_unit': workout.attrib.get('totalEnergyBurnedUnit', ''),
                'source_name': workout.attrib.get('sourceName', ''),
                'source_version': workout.attrib.get('sourceVersion', ''),
                'device': workout.attrib.get('device', ''),
                'creation_date': workout.attrib.get('creationDate', ''),
                'start_date': workout.attrib.get('startDate', ''),
                'end_date': workout.attrib.get('endDate', ''),
                'metadata': {},
                'workout_events': [],
                'workout_routes': []
            }
            
            # Extraer metadatos del entrenamiento
            metadata_values = workout.findall('.//MetadataEntry')
            for metadata in metadata_values:
                key = metadata.attrib.get('key', '')
                value = metadata.attrib.get('value', '')
                workout_data['metadata'][key] = value
            
            # Extraer eventos del entrenamiento
            workout_events = workout.findall('.//WorkoutEvent')
            for event in workout_events:
                event_data = {
                    'type': event.attrib.get('type', ''),
                    'date': event.attrib.get('date', ''),
                    'metadata': {}
                }
                
                event_metadata = event.findall('.//MetadataEntry')
                for metadata in event_metadata:
                    key = metadata.attrib.get('key', '')
                    value = metadata.attrib.get('value', '')
                    event_data['metadata'][key] = value
                
                workout_data['workout_events'].append(event_data)
            
            # Extraer rutas del entrenamiento
            workout_routes = workout.findall('.//WorkoutRoute')
            for route in workout_routes:
                route_data = {
                    'source_name': route.attrib.get('sourceName', ''),
                    'source_version': route.attrib.get('sourceVersion', ''),
                    'device': route.attrib.get('device', ''),
                    'creation_date': route.attrib.get('creationDate', ''),
                    'start_date': route.attrib.get('startDate', ''),
                    'end_date': route.attrib.get('endDate', '')
                }
                workout_data['workout_routes'].append(route_data)
            
            self.health_data['workouts'].append(workout_data)
    
    def _extract_clinical_records(self, root: ET.Element) -> None:
        """Extrae registros clínicos."""
        clinical_records = root.findall('.//ClinicalRecord')
        
        for record in clinical_records:
            clinical_data = {
                'type': record.attrib.get('type', ''),
                'identifier': record.attrib.get('identifier', ''),
                'source_name': record.attrib.get('sourceName', ''),
                'source_url': record.attrib.get('sourceURL', ''),
                'fhir_version': record.attrib.get('fhirVersion', ''),
                'received_date': record.attrib.get('receivedDate', ''),
                'resource_file_path': record.attrib.get('resourceFilePath', '')
            }
            
            self.health_data['clinical_records'].append(clinical_data)
    
    def _extract_activity_summaries(self, root: ET.Element) -> None:
        """Extrae resúmenes de actividad diaria."""
        activity_summaries = root.findall('.//ActivitySummary')
        
        for summary in activity_summaries:
            summary_data = {
                'date_components': summary.attrib.get('dateComponents', ''),
                'active_energy_burned': summary.attrib.get('activeEnergyBurned', ''),
                'active_energy_burned_goal': summary.attrib.get('activeEnergyBurnedGoal', ''),
                'active_energy_burned_unit': summary.attrib.get('activeEnergyBurnedUnit', ''),
                'apple_exercise_time': summary.attrib.get('appleExerciseTime', ''),
                'apple_exercise_time_goal': summary.attrib.get('appleExerciseTimeGoal', ''),
                'apple_stand_hours': summary.attrib.get('appleStandHours', ''),
                'apple_stand_hours_goal': summary.attrib.get('appleStandHoursGoal', '')
            }
            
            self.health_data['activity_summaries'].append(summary_data)
    
    def _normalize_data_type(self, original_type: str) -> str:
        """Normaliza los tipos de datos de Apple Health a nombres más legibles."""
        return self.data_type_mapping.get(original_type, original_type.replace('HKQuantityTypeIdentifier', '').replace('HKCategoryTypeIdentifier', ''))
    
    def save_to_json(self, output_file_path: str, indent: int = 2) -> None:
        """
        Guarda los datos procesados en un archivo JSON.
        
        Args:
            output_file_path (str): Ruta del archivo JSON de salida
            indent (int): Indentación para el formato JSON
        """
        try:
            with open(output_file_path, 'w', encoding='utf-8') as f:
                json.dump(self.health_data, f, indent=indent, ensure_ascii=False)
            
            print(f"Datos guardados exitosamente en: {output_file_path}")
            
            # Mostrar estadísticas del archivo generado
            file_size = os.path.getsize(output_file_path)
            print(f"Tamaño del archivo: {file_size / (1024 * 1024):.2f} MB")
            
        except Exception as e:
            print(f"Error al guardar el archivo JSON: {e}")
            raise
    
    def get_data_summary(self) -> Dict[str, Any]:
        """
        Devuelve un resumen de los datos procesados.
        
        Returns:
            Dict con estadísticas de los datos
        """
        record_types = {}
        for record in self.health_data['records']:
            record_type = record['type']
            record_types[record_type] = record_types.get(record_type, 0) + 1
        
        workout_types = {}
        for workout in self.health_data['workouts']:
            workout_type = workout['workout_activity_type']
            workout_types[workout_type] = workout_types.get(workout_type, 0) + 1
        
        return {
            'total_records': len(self.health_data['records']),
            'total_workouts': len(self.health_data['workouts']),
            'total_clinical_records': len(self.health_data['clinical_records']),
            'total_activity_summaries': len(self.health_data['activity_summaries']),
            'record_types': record_types,
            'workout_types': workout_types,
            'date_range': self._get_date_range()
        }
    
    def _get_date_range(self) -> Dict[str, str]:
        """Obtiene el rango de fechas de los datos."""
        dates = []
        
        # Recopilar fechas de registros
        for record in self.health_data['records']:
            if record['start_date']:
                dates.append(record['start_date'])
        
        # Recopilar fechas de entrenamientos
        for workout in self.health_data['workouts']:
            if workout['start_date']:
                dates.append(workout['start_date'])
        
        if dates:
            dates.sort()
            return {
                'earliest_date': dates[0],
                'latest_date': dates[-1]
            }
        
        return {'earliest_date': '', 'latest_date': ''}


def main():
    """Función principal para ejecutar el procesador desde línea de comandos."""
    parser = argparse.ArgumentParser(description='Convertir archivo XML de Apple Health a JSON')
    parser.add_argument('input_file', help='Ruta al archivo XML de Apple Health')
    parser.add_argument('-o', '--output', help='Ruta del archivo JSON de salida (opcional)')
    parser.add_argument('--summary', action='store_true', help='Mostrar resumen de los datos procesados')
    
    args = parser.parse_args()
    
    # Validar archivo de entrada
    if not os.path.exists(args.input_file):
        print(f"Error: El archivo {args.input_file} no existe.")
        return
    
    # Determinar archivo de salida
    if args.output:
        output_file = args.output
    else:
        base_name = os.path.splitext(os.path.basename(args.input_file))[0]
        output_file = f"{base_name}_processed.json"
    
    # Procesar archivo
    processor = AppleHealthXMLProcessor()
    
    try:
        processor.parse_xml_file(args.input_file)
        processor.save_to_json(output_file)
        
        if args.summary:
            print("\n" + "="*50)
            print("RESUMEN DE DATOS PROCESADOS")
            print("="*50)
            summary = processor.get_data_summary()
            
            print(f"Total de registros: {summary['total_records']}")
            print(f"Total de entrenamientos: {summary['total_workouts']}")
            print(f"Total de registros clínicos: {summary['total_clinical_records']}")
            print(f"Total de resúmenes de actividad: {summary['total_activity_summaries']}")
            
            if summary['date_range']['earliest_date']:
                print(f"Rango de fechas: {summary['date_range']['earliest_date']} - {summary['date_range']['latest_date']}")
            
            print("\nTipos de registros más comunes:")
            sorted_records = sorted(summary['record_types'].items(), key=lambda x: x[1], reverse=True)
            for record_type, count in sorted_records[:10]:
                print(f"  {record_type}: {count}")
            
            if summary['workout_types']:
                print("\nTipos de entrenamientos:")
                for workout_type, count in summary['workout_types'].items():
                    print(f"  {workout_type}: {count}")
        
        print(f"\n✅ Conversión completada exitosamente!")
        print(f"Archivo JSON generado: {output_file}")
        
    except Exception as e:
        print(f"❌ Error durante el procesamiento: {e}")


if __name__ == "__main__":
    main()