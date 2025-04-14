# scripts/process_exam.py
import sys
import json
import os
import cv2
import numpy as np
from ultralytics import YOLO  # YOLOv8 library
import pandas as pd
import pytesseract  # For OCR
from PIL import Image

# Load the YOLOv8 model
model = YOLO('C:\\Users\\arnav\\Documents\\College\\Sem4\\CS2213_IML\\frontend\\my-app\\scripts\\model\\MSDM_v1.pt')  # Update with your model path

def process_image(image_path, metadata):
    """Process a single image with YOLOv8 and save the result image."""
    img = cv2.imread(image_path)

    # Run YOLOv8 detection
    results = model(img, verbose=False)

    # Extract detection results
    detections = []
    for result in results:
        boxes = result.boxes
        for box in boxes:
            class_id = int(box.cls[0].item())
            class_name = model.names[class_id]
            detections.append(class_name)

            # Get bounding box coordinates
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())

            # Draw bounding box on the image
            color = (0, 255, 0)  # Green color for bounding box
            cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)

            # Add label to the bounding box
            label = f"{class_name} ({box.conf[0]:.2f})"
            cv2.putText(img, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

    # Save the processed image
    output_path = os.path.join("processed_images", os.path.basename(image_path))
    os.makedirs("processed_images", exist_ok=True)  # Ensure the directory exists
    cv2.imwrite(output_path, img)

    # Create Excel data structure
    excel_data = organize_excel_data(detections, metadata)

    # Return detections + excel data + output image path
    return {
        'detections': detections,
        'excel_data': excel_data,
        'processed_image_path': output_path
    }

def organize_excel_data(detections, metadata):
    """Organize detections into structured Excel data"""
    result = {
        'metadata': metadata,
        'students': []
    }

    # Default one student since no USN parsing yet
    student_data = {
        'sem': '',
        'programme': '',
        'usn': '',
        'total_marks': '',
        'questions': {}
    }

    # Initialize question sub-classes
    for q in range(1, 11):  # 1-10
        student_data['questions'][f'q{q}'] = {}
        for sub in 'abcde':
            student_data['questions'][f'q{q}'][sub] = 0

    # Mark presence based on detections
    for cls in detections:
        if cls == 'sem':
            student_data['sem'] = 1
        elif cls in ['btech', 'bca', 'bsc']:
            student_data['programme'] = cls.upper()
        elif cls == 'usn':
            student_data['usn'] = 1
        elif cls == 'totalMarks':
            student_data['total_marks'] = 1
        elif cls[0].isdigit() and cls[1] in 'abcde':
            q_num = cls[0]
            sub_q = cls[1]
            student_data['questions'][f'q{q_num}'][sub_q] = 1

    result['students'].append(student_data)
    return result


def main():
    """Main function to process image and return results as JSON"""
    if len(sys.argv) < 2:
        sys.stderr.write(json.dumps({'error': 'Missing image path argument'}) + "\n")
        sys.exit(1)

    image_path = sys.argv[1]

    if len(sys.argv) >= 3:
        try:
            metadata_json = sys.argv[2]
            metadata = json.loads(metadata_json)
        except json.JSONDecodeError as e:
            sys.stderr.write(json.dumps({'error': f'Failed to parse metadata JSON: {str(e)}'}) + "\n")
            sys.exit(1)
    else:
        metadata = {"programme": "BCA", "semester": "4"}

    result = process_image(image_path, metadata)

    # Only this JSON print. No other logs, no extra lines.
    
    sys.stdout.write(json.dumps(result))
    sys.stdout.flush()

if __name__ == "__main__":
    main()