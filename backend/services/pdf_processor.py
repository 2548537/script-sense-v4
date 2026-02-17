import fitz  # PyMuPDF
from PIL import Image
import io
import os

class PDFProcessor:
    """Service for processing PDF files"""
    
    @staticmethod
    def get_page_count(pdf_path):
        """Get total number of pages in PDF"""
        try:
            doc = fitz.open(pdf_path)
            count = len(doc)
            doc.close()
            return count
        except Exception as e:
            print(f"Error getting page count: {str(e)}")
            return 0
    
    @staticmethod
    def pdf_page_to_image(pdf_path, page_number, zoom=2.0):
        """
        Convert a PDF page to PIL Image
        
        Args:
            pdf_path: Path to PDF file
            page_number: Page number (0-indexed)
            zoom: Zoom factor for quality (default 2.0)
            
        Returns:
            PIL Image object
        """
        try:
            doc = fitz.open(pdf_path)
            
            if page_number >= len(doc):
                doc.close()
                raise ValueError(f"Page {page_number} does not exist")
            
            page = doc[page_number]
            
            # Render page to image with zoom, explicitly using cropbox for consistency with web viewers
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat, clip=page.cropbox)
            
            # Convert to PIL Image
            img_data = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_data))

            # Auto-rotate to portrait if needed (fail-safe)
            try:
                if image.width > image.height:
                    print(f"🔄 Auto-rotating page {page_number} to portrait...")
                    # Handle different Pillow versions
                    if hasattr(Image, 'Transpose'):
                        rotation = Image.Transpose.ROTATE_270
                    else:
                        rotation = Image.ROTATE_270
                    image = image.transpose(rotation)
            except Exception as rot_e:
                print(f"⚠️ Rotation failed but continuing: {rot_e}")
            
            doc.close()
            return image
            
        except Exception as e:
            print(f"Error converting PDF page to image: {str(e)}")
            raise
    
    @staticmethod
    def extract_region(pdf_path, page_number, coordinates):
        """
        Extract a specific region from a PDF page
        
        Args:
            pdf_path: Path to PDF file
            page_number: Page number (0-indexed)
            coordinates: Dict with {x, y, width, height} in pixels
            
        Returns:
            PIL Image of the extracted region
        """
        try:
            # Get full page image
            full_image = PDFProcessor.pdf_page_to_image(pdf_path, page_number, zoom=4.0)
            
            # Extract coordinates
            x = float(coordinates.get('x', 0))
            y = float(coordinates.get('y', 0))
            w_coord = float(coordinates.get('width', 0))
            h_coord = float(coordinates.get('height', 0))
            
            # Check if coordinates are normalized (0-1)
            if x <= 1.0 and y <= 1.0 and w_coord <= 1.0 and h_coord <= 1.0:
                # Treat as normalized
                x = int(x * full_image.width)
                y = int(y * full_image.height)
                width = int(w_coord * full_image.width)
                height = int(h_coord * full_image.height)
            else:
                # Treat as pixels
                x = int(x)
                y = int(y)
                width = int(w_coord) if w_coord > 0 else full_image.width
                height = int(h_coord) if h_coord > 0 else full_image.height
            
            # --- INCREASED PADDING FOR SAFETY ---
            padding = 40
            x = max(0, x - padding)
            y = max(0, y - padding)
            width = width + (2 * padding)
            height = height + (2 * padding)
            
            # Ensure valid bounds
            width = min(width, full_image.width - x)
            height = min(height, full_image.height - y)
            
            if width <= 0 or height <= 0:
                raise ValueError(f"Invalid crop dimensions: w={width}, h={height}")
            
            # Crop region
            region = full_image.crop((x, y, x + width, y + height))
            
            return region
            
        except Exception as e:
            print(f"Error extracting region: {str(e)}")
            raise
    
    @staticmethod
    def generate_thumbnail(pdf_path, output_path, size=(200, 280)):
        """
        Generate thumbnail from first page of PDF
        
        Args:
            pdf_path: Path to PDF file
            output_path: Where to save thumbnail
            size: Thumbnail size tuple (width, height)
            
        Returns:
            Path to thumbnail
        """
        try:
            # Get first page
            image = PDFProcessor.pdf_page_to_image(pdf_path, 0, zoom=1.5)
            
            # Create thumbnail
            image.thumbnail(size, Image.Resampling.LANCZOS)
            
            # Save thumbnail
            image.save(output_path, 'PNG')
            
            return output_path
            
        except Exception as e:
            print(f"Error generating thumbnail: {str(e)}")
            return None
    
    @staticmethod
    def get_all_page_images(pdf_path, zoom=1.5):
        """
        Get all pages as images
        
        Args:
            pdf_path: Path to PDF file
            zoom: Zoom factor
            
        Returns:
            List of PIL Images
        """
        try:
            doc = fitz.open(pdf_path)
            images = []
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                mat = fitz.Matrix(zoom, zoom)
                pix = page.get_pixmap(matrix=mat)
                img_data = pix.tobytes("png")
                image = Image.open(io.BytesIO(img_data))
                images.append(image)
            
            doc.close()
            return images
            
        except Exception as e:
            print(f"Error getting all page images: {str(e)}")
            return []
