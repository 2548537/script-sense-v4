import google.generativeai as genai
from PIL import Image
import io
import time
from config import Config

class GeminiOCRService:
    """Service for OCR using Google Gemini API"""
    
    def __init__(self):
        """Initialize Gemini API"""
        if not Config.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not set in environment variables")
        
        genai.configure(api_key=Config.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
    
    def transcribe_handwriting(self, image_data, is_path=True):
        """
        Transcribe handwritten text from image
        
        Args:
            image_data: File path or PIL Image object
            is_path: Whether image_data is a file path
            
        Returns:
            Transcribed text string
        """
        try:
            if is_path:
                image = Image.open(image_data)
            else:
                image = image_data
            
            prompt = """Analyze this image of a handwritten academic derivation (Science/Math/Engineering).
            
            GOAL: Create a clean, readable transcription using actual symbols.
            
            1. SYMBOLS & NOTATION: 
               - Use actual Unicode mathematical symbols instead of LaTeX code where possible.
               - Examples: Use θ (theta), μ (mu), ρ (rho), ±, √, →, ¹, ², ³, etc.
               - Do NOT use dollar signs ($) or LaTeX backslashes (\) unless absolutely necessary for complex fractions.
               
            2. EQUATIONS: 
               - Write equations as they appear visually (e.g., "R sin θ + F cos θ = mv² / r").
               - Use standard text formatting for fractions (e.g., "a / b") unless they are very complex.
               
            3. STRUCTURE: 
               - Preserve line breaks and alignment exactly as written.
               - Include step identifiers like (1), (2), or ①, ②.
               
            4. ACCURACY: 
               - Distinguish between 'v' (velocity) and 'v' (greek nu) if possible, but prioritize readability.
               - Ensure subscripts are clear (e.g., "v_max" or "v_1").
               
            5. RESPONSE FORMAT: 
               - Return ONLY the clean transcription text. No metadata or conversation."""
            
            response = self.model.generate_content([prompt, image])
            
            if response and response.text:
                return response.text.strip()
            else:
                return "No text could be transcribed from this image."
                
        except Exception as e:
            print(f"Error in transcription: {str(e)}")
            return f"Error: {str(e)}"
    
    def extract_diagram(self, image_data, is_path=True):
        """
        Analyze image to detect and describe diagrams
        
        Args:
            image_data: File path or PIL Image object
            is_path: Whether image_data is a file path
            
        Returns:
            Dictionary with diagram information
        """
        try:
            if is_path:
                image = Image.open(image_data)
            else:
                image = image_data
            
            prompt = """Analyze this image region for SCIENTIFIC, MATHEMATICAL, or EDUCATIONAL diagrams, charts, or sketches.
            
            CRITICAL INSTRUCTIONS:
            1. If a diagram is present, describe its GEOMETRIC and STRUCTURAL properties (e.g., "Right-angled triangle with labels A, B, C", "Circuit with resistor and battery").
            2. Identify any labels, variables, or values associated with the diagram.
            3. For graphs: Identify the axes, labels, and general trend (e.g., "Linear graph through origin").
            4. Ignore random scribbles or crossed-out content.
            
            IF A VALID DIAGRAM IS FOUND:
            - Type: [Specific type of diagram]
            - Labels: [List all visible labels and numbers]
            - Description: [Detailed structural description]
            
            IF NO VALID DIAGRAM IS FOUND:
            - Explicitly respond with "No diagrams found."."""
            
            response = self.model.generate_content([prompt, image])
            
            if response and response.text:
                has_diagram = "no diagram" not in response.text.lower() and "no valid diagram" not in response.text.lower()
                return {
                    'has_diagram': has_diagram,
                    'description': response.text.strip(),
                    'image_available': True
                }
            else:
                return {
                    'has_diagram': False,
                    'description': 'Could not analyze image',
                    'image_available': False
                }
                
        except Exception as e:
            print(f"Error in diagram extraction: {str(e)}")
            return {
                'has_diagram': False,
                'description': f'Error: {str(e)}',
                'image_available': False
            }
    
    def auto_analyze_page(self, image_data, is_path=True):
        """
        Automatically analyze a full page to extract transcription and diagram bounding boxes.
        
        Args:
            image_data: File path or PIL Image object
            is_path: Whether image_data is a file path
            
        Returns:
            Dictionary with transcription and a list of diagram objects
        """
        try:
            if is_path:
                image = Image.open(image_data)
            else:
                image = image_data
            
            prompt = """Analyze this image of an academic answer sheet. I need a complete transcription of all handwritten text and identification of all diagrams.
            
            Return the result in a valid JSON format with the following structure:
            {
              "transcription": "The full transcription of all text on the page, preserving order and using actual symbols (θ, μ, ρ, v², etc.)",
              "diagrams": [
                {
                  "description": "Short description of what the diagram represents",
                  "bounding_box": [ymin, xmin, ymax, xmax] 
                }
              ]
            }

            CRITICAL FOR DIAGRAMS:
            1. Bounding boxes MUST be in normalized coordinates [0-1000] where [0,0] is top-left and [1000,1000] is bottom-right.
            2. Be GENEROUS with diagram bounding boxes. Include all related labels, vectors, axis titles, and satellite components.
            3. If a diagram has labels (like 'mg', 'R sin θ', 'F cos θ') nearby, they MUST be included in the bounding box.
            4. If there are no diagrams, return an empty list for "diagrams".
            5. Use actual symbols for Math/Science notation.
            6. Return ONLY the JSON object. No other text."""
            
            # Using JSON mode if supported or just standard generation
            response = self.model.generate_content(
                [prompt, image],
                generation_config={"response_mime_type": "application/json"}
            )
            
            import json
            if response and response.text:
                try:
                    result = json.loads(response.text)
                    return {
                        'transcription': result.get('transcription', ''),
                        'diagrams': result.get('diagrams', []),
                        'success': True
                    }
                except json.JSONDecodeError:
                    # Fallback if JSON isn't perfect but present
                    return {
                        'transcription': "Error: Failed to parse AI response as JSON.",
                        'diagrams': [],
                        'success': False
                    }
            else:
                return {
                    'transcription': "No response from AI.",
                    'diagrams': [],
                    'success': False
                }
                
        except Exception as e:
            print(f"Error in automatic analysis: {str(e)}")
            return {
                'transcription': f"Error: {str(e)}",
                'diagrams': [],
                'success': False
            }

    def process_pdf_region(self, image_data, coordinates=None):
        """
        Process a specific region of a PDF page
        """
        try:
            image = image_data
            
            # Crop if coordinates provided
            if coordinates:
                x = float(coordinates.get('x', 0))
                y = float(coordinates.get('y', 0))
                w_coord = float(coordinates.get('width', 0))
                h_coord = float(coordinates.get('height', 0))
                
                # Check if coordinates are normalized (0-1)
                if x <= 1.0 and y <= 1.0 and w_coord <= 1.0 and h_coord <= 1.0:
                    x = int(x * image.width)
                    y = int(y * image.height)
                    width = int(w_coord * image.width)
                    height = int(h_coord * image.height)
                else:
                    width = int(w_coord) if w_coord > 0 else image.width
                    height = int(h_coord) if h_coord > 0 else image.height
                
                # Ensure we don't go out of bounds
                x = max(0, x)
                y = max(0, y)
                width = min(width, image.width - x)
                height = min(height, image.height - y)
                
                if width > 0 and height > 0:
                    image = image.crop((x, y, x + width, y + height))
            
            # Get both transcription and diagram analysis
            transcription = self.transcribe_handwriting(image, is_path=False)
            diagram_info = self.extract_diagram(image, is_path=False)
            
            return {
                'transcription': transcription,
                'diagram_info': diagram_info,
                'success': True
            }
            
        except Exception as e:
            print(f"Error processing PDF region: {str(e)}")
            return {
                'transcription': '',
                'diagram_info': {'has_diagram': False, 'description': '', 'image_available': False},
                'success': False,
                'error': str(e)
            }
