"""
Student Information Extraction Service
Uses Gemini OCR to extract student details from answer sheet headers
"""

from services.gemini_ocr import GeminiOCRService
from PIL import Image
import json
import re

class StudentExtractor:
    def __init__(self):
        self.ocr_service = GeminiOCRService()
    
    def extract_student_info(self, image):
        """
        Extract student information from answer sheet first page
        
        Args:
            image: PIL Image or path to image
            
        Returns:
            dict with keys: name, roll_number, class_name
        """
        try:
            # Gemini prompt specifically for header extraction
            prompt = """Extract student information from this answer sheet header.

Look for:
1. Student Name (usually after "Name:", "Student:", or similar)
If any field is not found, use null. Return ONLY the JSON, no other text.
2. Roll Number / Roll No / Reg No / Student ID (usually after "Roll No:", "Reg No:", "Student ID:", etc.)
3. Class / Standard (if visible, usually after "Class:", "Std:", etc.)

Return ONLY a JSON object with this structure:
{
  "name": "Student Name",
  "roll_number": "Roll/Reg/Student ID Number",  
  "class": "Class Name"
}

If any field is not found, use null. Return ONLY the JSON, no other text."""

            # Call Gemini
            if isinstance(image, str):
                # It's a path
                result = self.ocr_service.model.generate_content([prompt, Image.open(image)])
            else:
                # It's already a PIL Image
                result = self.ocr_service.model.generate_content([prompt, image])
            
            # Parse response
            text = result.text.strip()
            
            # Clean up response to extract JSON
            # Sometimes Gemini wraps JSON in markdown code blocks
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            elif '```' in text:
                text = text.split('```')[1].split('```')[0].strip()
            
            # Parse JSON
            info = json.loads(text)
            
            # Clean up extracted data
            student_info = {
                'name': self._clean_name(info.get('name')),
                'roll_number': self._clean_roll_number(info.get('roll_number')),
                'class_name': self._clean_class_name(info.get('class'))
            }
            
            print(f"✅ Extracted student info: {student_info}")
            return student_info
            
        except Exception as e:
            print(f"⚠️ Error extracting student info: {str(e)}")
            # Return empty info on error
            return {
                'name': None,
                'roll_number': None,
                'class_name': None
            }
    
    def _clean_name(self, name):
        """Clean and standardize student name"""
        if not name or name == 'null':
            return None
        # Remove extra whitespace, title case
        return ' '.join(name.strip().split()).title()
    
    def _clean_roll_number(self, roll_no):
        """Clean and standardize roll number"""
        if not roll_no or roll_no == 'null':
            return None
        # Remove whitespace, uppercase
        return roll_no.strip().upper()
    
    def _clean_class_name(self, class_name):
        """Clean and standardize class name"""
        if not class_name or class_name == 'null':
            return None
        # Remove extra whitespace
        return ' '.join(class_name.strip().split())
