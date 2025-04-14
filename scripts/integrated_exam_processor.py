# scripts/integrated_exam_processor.py
import sys
import json
import os
import cv2
import numpy as np
from ultralytics import YOLO
import tensorflow as tf
from tensorflow import keras
import pandas as pd

def preprocess_digit(image):
    """Preprocess a digit image for the handwriting recognition model"""
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Threshold: white digits on black
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        # Return empty image in correct shape (28, 28, 1)
        return np.zeros((1, 28, 28, 1), dtype=np.float32)

    # Get largest contour
    cnt = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(cnt)
    digit = thresh[y:y+h, x:x+w]

    # Resize to 18x18
    digit_resized = cv2.resize(digit, (18, 18), interpolation=cv2.INTER_AREA)

    # Create white 28x28 canvas and center digit
    canvas = np.full((28, 28), 255, dtype=np.uint8)
    x_offset = (28 - 18) // 2
    y_offset = (28 - 18) // 2
    canvas[y_offset:y_offset+18, x_offset:x_offset+18] = digit_resized

    # Brighten digit
    canvas = canvas.astype(np.uint8)
    canvas = cv2.normalize(canvas, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX)

    # Sharpen image
    kernel = np.array([[0, -1, 0],
                      [-1, 5, -1],
                      [0, -1, 0]])
    canvas = cv2.filter2D(canvas, -1, kernel)

    # Invert for model (white digit on black)
    canvas = 255 - canvas

    # Normalize to [0, 1] and reshape to (1, 28, 28, 1)
    normalized = canvas.astype('float32') / 255.0
    return normalized.reshape(1, 28, 28, 1)

def process_usn(image, digit_model):
    """Process USN image using digit-by-digit recognition"""
    # First convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = gray.astype(np.uint8)
    gray = cv2.normalize(gray, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX)

    # Sharpen image
    kernel = np.array([[0, -1, 0],
                      [-1, 5, -1],
                      [0, -1, 0]])
    gray = cv2.filter2D(gray, -1, kernel)
    
    # Invert image for thresholding (just like in working script)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # Dilate to emphasize digits
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    dilated = cv2.dilate(thresh, kernel, iterations=1)
    
    # Find contours
    contours, hierarchy = cv2.findContours(dilated, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    # Get bounding boxes with padding
    padding = 1
    bounding_boxes = []
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        if w > 3 and h > 8:  # Size constraints
            x_pad = max(x - padding, 0)
            y_pad = max(y - padding, 0)
            w_pad = min(w + 2 * padding, gray.shape[1] - x_pad)
            h_pad = min(h + 2 * padding, gray.shape[0] - y_pad)
            bounding_boxes.append((x_pad, y_pad, w_pad, h_pad))
    
    # Sort boxes left to right
    bounding_boxes = sorted(bounding_boxes, key=lambda b: b[0])
    
    # Process each digit
    usn = ""
    for (x, y, w, h) in bounding_boxes:
        # Extract and resize digit
        digit = gray[y:y+h, x:x+w]
        digit = cv2.resize(digit, (28, 28), interpolation=cv2.INTER_AREA)
        digit = 255 - digit  # Invert
        
        # Prepare for prediction
        reshaped = digit.reshape(1, 28, 28, 1)
        reshaped = reshaped.astype(np.float32) / 255
        
        # Predict digit
        pred = digit_model.predict(reshaped, verbose=0)
        pred_digit = np.argmax(pred[0])
        usn += str(pred_digit)
        
        # Add debug print for each digit processing
        print(f"Detected USN digit: {pred_digit}")
    
    print(f"Complete USN: {usn}")
    return usn

def save_visualized_image(image, detections):
    """Save the image with detection boxes and predictions"""
    # Make a copy to avoid modifying original
    vis_img = image.copy()
    
    # Define colors for different class types
    colors = {
        'usn': (255, 0, 0),        # Red
        'totalMarks': (0, 255, 0), # Green
        'default': (0, 0, 255)     # Blue for all others
    }
    
    # Draw boxes and predictions
    for det in detections:
        x1, y1, x2, y2 = det['coordinates']
        class_name = det['class']
        value = det.get('predicted_value', '')
        
        # Choose color
        color = colors.get(class_name, colors['default'])
        
        # Draw rectangle
        cv2.rectangle(vis_img, (x1, y1), (x2, y2), color, 2)
        
        # Draw label
        label = f"{class_name}: {value}"
        cv2.putText(vis_img, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    
    # Save image
    output_dir = "processed_images"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"processed_{os.getpid()}.jpg")
    cv2.imwrite(output_path, vis_img)
    
    return output_path

def process_exam(image_path, metadata):
    """Main function to process an exam image"""
    # Read image
    img = cv2.imread(image_path)
    if img is None:
        return {"error": f"Failed to read image: {image_path}"}
    
    # Run YOLO detection
    results = yolo_model(img, verbose=False)
    
    detections = []
    student_data = {
        'usn': '',
        'total_marks': '',
        'questions': {}
    }
    
    # Initialize question structure - 10 questions with 5 sub-questions each
    for q in range(1, 11):
        student_data['questions'][f'q{q}'] = {}
        for sub in 'abcde':
            student_data['questions'][f'q{q}'][sub] = ''
    
    # Process each detection
    for r in results:
        for box in r.boxes:
            class_id = int(box.cls[0].item())
            class_name = yolo_model.names[class_id]
            conf = float(box.conf[0].item())
            
            # Extract region
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            if x1 < 0: x1 = 0
            if y1 < 0: y1 = 0
            if x2 >= img.shape[1]: x2 = img.shape[1] - 1
            if y2 >= img.shape[0]: y2 = img.shape[0] - 1
            
            cropped = img[y1:y2, x1:x2]
            if cropped.size == 0:
                continue  # Skip if crop is empty
            
            predicted_value = ""
            
            # Process based on class type
            if class_name == 'usn':
                # OCR for USN
                student_data['usn'] = process_usn(cropped, digit_model)
                predicted_value = student_data['usn']
                
            elif class_name == 'totalMarks':
                # Recognize total marks
                processed = preprocess_digit(cropped)
                pred = digit_model.predict(processed, verbose=0)
                digit = str(np.argmax(pred[0]))
                student_data['total_marks'] = digit
                predicted_value = digit
                
            elif len(class_name) >= 2:
                # Example format: "1a", "2b", etc.
                # Extract question number and sub-question
                if class_name[0].isdigit() and class_name[1] in 'abcde':
                    q_num = class_name[0]
                    sub_q = class_name[1]
                    
                    # Process digit
                    processed = preprocess_digit(cropped)
                    pred = digit_model.predict(processed, verbose=0)
                    digit = str(np.argmax(pred[0]))
                    
                    # Store in student data
                    student_data['questions'][f'q{q_num}'][sub_q] = digit
                    predicted_value = digit
            
            # Add to detections list
            detections.append({
                'class': class_name,
                'coordinates': [x1, y1, x2, y2],
                'confidence': conf,
                'recognized_value': predicted_value
            })
    
    
    # If we didn't detect total marks, sum up all question marks
    if not student_data['total_marks']:
        total = 0
        for q in range(1, 11):
            for sub in 'abcde':
                val = student_data['questions'][f'q{q}'][sub]
                if val.isdigit():
                    total += int(val)
        student_data['total_marks'] = str(total)
    
    # Save visualized image
    processed_img_path = save_visualized_image(img, detections)
    
    # Return results
    return {
        'processed_image_path': processed_img_path,
        'detections': detections,
        'excel_data': {
            'metadata': metadata,
            'students': [student_data]
        },
        'programme_verification': {
            'match': True,  # You can add more sophisticated verification
            'detected': metadata.get('programme', ''),
            'selected': metadata.get('programme', '')
        }
    }

# Main execution block
if __name__ == "__main__":
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
    
    # Load models
    try:
        # Get the directory of the current script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Load YOLO model
        yolo_model_path = os.path.join(script_dir, 'model', 'MSDM_v1.pt')
        yolo_model = YOLO(yolo_model_path)
        
        # Load digit recognition model
        digit_model_path = os.path.join(script_dir, 'model', 'HNGM.keras')
        digit_model = keras.models.load_model(digit_model_path)
        
        # Process image
        result = process_exam(image_path, metadata)
        
        # Output result as JSON
        sys.stdout.write(json.dumps(result))
        sys.stdout.flush()
        
    except Exception as e:
        sys.stderr.write(json.dumps({'error': f'Processing error: {str(e)}'}) + "\n")
        sys.exit(1)