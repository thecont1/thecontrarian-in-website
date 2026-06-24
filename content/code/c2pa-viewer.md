---
title: c2pa-viewer
description: Web app to verify C2PA content credentials and view EXIF/IPTC info embedded within an image. We do frontend as well as API call!
author: Mahesh Shantaram
status: draft
repoOwner: thecont1
repoName: c2pa-viewer
license: ""
createdDate: 2026-06-24
lastUpdated: 2026-02-11
tags:
  - "c2pa"
  - "exif-metadata"
  - "image-viewer"
  - "iptc-metadata"
  - "metadata-extraction"
  - "photography"
  - "provenance"
  - "verifiable-credentials"
repoUrl: "https://github.com/thecont1/c2pa-viewer"
repoEmail: ms@thecontrarian.in
appUrl: "https://apps.thecontrarian.in/c2pa"
fileTree:
  - ".dockerignore"
  - ".gitignore"
  - ".python-version"
  - "API_ENDPOINTS.md"
  - "Dockerfile"
  - "LICENSE.md"
  - "README.md"
  - "content_credentials_logo.svg"
  - "fly.toml"
  - "index.html"
  - "pyproject.toml"
  - "script.js"
  - "server.py"
  - "styles.css"
  - "test_server.py"
  - "uv.lock"
---

# C2PA Viewer

An API-based image viewer web application that allows users to verify [C2PA content credentials](https://contentcredentials.org/) as well as view EXIF and IPTC information embedded within the image.

## Features

### 1. Image Viewer
- Displays the main image with a clean white background and subtle shadow effect
- Shows verification status badges:
  - **Content Credentials**: Green "Authenticity Verified" badge for C2PA-verified images
  - **Digital Source Type**: Shows image origin (e.g., "Digital Camera (RAW)", "Generative AI")
- Responsive design that works on all screen sizes

### 2. Metadata Extraction
- Extracts EXIF and IPTC metadata from images
- Displays photography information (camera make, model, lens, exposure settings)
- Shows detailed metadata sections:
  - Camera & Lens (make, model, serial numbers)
  - Exposure Settings (aperture, shutter speed, ISO, focal length)
  - Image Details (format, resolution, dimensions)
  - Photographer Information (artist, capture dates)

### 3. C2PA Verification
- Extracts and displays C2PA thumbnails (claim and ingredient images)
- Shows provenance history with timestamps and detailed edit actions
- Displays specific adjustment values (e.g., "Blacks: -5", "Clarity: +20")
- **Digital Source Type Detection**:
  - Detects camera capture (DNG, RAW files → "Digital Camera (RAW)")
  - Detects AI-generated content (Adobe Firefly, DALL-E, Midjourney → "Generative AI")
  - Shows orange badge for AI-generated, green badge for camera capture

### 4. API Integration
- RESTful API for metadata extraction
- Accepts image URIs as input
- Handles both local files and remote URLs
- CORS-enabled for cross-origin requests

## API Endpoints

### Core Endpoints

| Endpoint | Method | Description | Performance |
|----------|--------|-------------|-------------|
| `/api/exif_metadata` | GET | EXIF, IPTC, GPS metadata only | Fast (~10-50ms) |
| `/api/c2pa_metadata` | GET | C2PA provenance, thumbnails, digital source type | Slower (~100-500ms+) |
| `/api/c2pa_mini` | GET | Minimal C2PA for quick verification | Fast (~50-200ms) |
| `/api/upload` | POST | Upload image, returns all metadata | Variable |

### GET `/api/exif_metadata`

Retrieve EXIF, IPTC, and GPS metadata for an image (no C2PA cryptographic verification).

**Query Parameters:**
- `uri` (required): Image file path or URL

**Example:**
```
GET /api/exif_metadata?uri=https://example.com/image.jpg
```

**Response:**
```json
{
  "image.jpg": {
    "filename": "image.jpg",
    "format": "JPEG",
    "width": 4000,
    "height": 3000,
    "file_size_bytes": 1234567,
    "file_size_mb": 1.18,
    "photography": {
      "camera_make": "Canon",
      "camera_model": "EOS R5",
      "lens_model": "RF 24-70mm f/2.8L",
      "aperture": "f/2.8",
      "shutter_speed": "1/250s",
      "iso": "400",
      "focal_length": "50mm"
    },
    "exif": { "Make": "Canon", "Model": "EOS R5", ... },
    "gps": { "latitude": "40.7128", "longitude": "-74.0060" },
    "iptc": { "title": "Sunset", "description": "A beautiful sunset", ... }
  }
}
```

### GET `/api/c2pa_metadata`

Retrieve C2PA provenance data, including signature information, edit actions, embedded thumbnails, and digital source type.

**Query Parameters:**
- `uri` (required): Image file path or URL

**Example:**
```
GET /api/c2pa_metadata?uri=https://example.com/image.jpg
```

**Response:**
```json
{
  "provenance": [
    { "name": "Claim Generator", "generator": "Lightroom Classic 15.1" },
    { "name": "Issued By", "issuer": "Adobe Inc." },
    { "name": "Issued On", "date": "Jan 08, 2026 at 04:21 PM IST" },
  ],
  "c2pa_data": { "basic_info": {...}, "signature_info": {...}, "assertions": [...] },
  "thumbnails": {
    "claim_thumbnail": "base64_encoded_data...",
    "ingredient_thumbnail": "base64_encoded_data..."
  },
  "digital_source_type": {
    "code": "digitalCapture",
    "label": "Digital Camera (RAW)"
  }
}
```

### GET `/api/c2pa_mini`

Retrieve minimal C2PA credentials for quick trust verification (e.g., hover previews). Optimized for speed with 5-minute response caching.

**Query Parameters:**
- `uri` (required): Image file path or URL

**Example:**
```
GET /api/c2pa_mini?uri=https://example.com/image.jpg
```

**Response:**
```json
{
  "creator": "John Doe",
  "issued_by": "Adobe Inc.",
  "issued_on": "Jan 08, 2026 at 04:21 PM IST",
  "status": "Authenticity Verified",
  "digital_source_type": "Digital Camera (RAW)",
  "more": "https://apps.thecontrarian.in/c2pa/?uri=..."
}
```

### POST `/api/upload`

Upload an image file and receive complete metadata (EXIF + C2PA) plus the image as a base64 data URL.

**Request:** `multipart/form-data` with file field named `file`

**Example:**
```
POST /api/upload
Content-Type: multipart/form-data
file: [image file]
```

**Response:**
```json
{
  "filename.jpg": {
    "filename": "filename.jpg",
    "format": "JPEG",
    "width": 4000,
    "height": 3000,
    "photography": {...},
    "exif": {...},
    "gps": {...},
    "iptc": {...},
    "provenance": [...],
    "thumbnails": {...},
    "digital_source_type": { "code": "digitalCapture", "label": "Digital Camera (RAW)" },
    "image_data": "data:image/jpeg;base64,..."
  }
}
```

### Static File Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serve the main HTML page |
| `/styles.css` | GET | Serve CSS stylesheet |
| `/script.js` | GET | Serve JavaScript file |
| `/content_credentials_logo.svg` | GET | Serve Content Credentials logo |
| `/{filename}` | GET | Serve image files (jpg, jpeg, png, gif) |

## How to Run the App

### Prerequisites
- Python 3.12 or higher 
- UV package manager ([install](https://docs.astral.sh/uv/getting-started/installation/))

### Installation
1. Clone the repository
   ```bash
   git clone https://github.com/thecont1/c2pa-viewer.git
   cd c2pa-viewer
   ```

2. Install dependencies using UV:
   ```bash
   uv sync
   ```

### Running the Server

Start the server:
```bash
uv run uvicorn server:app --host 0.0.0.0 --port 8080
```

The server will start on `http://localhost:8080`.

### Testing the API

Run the test script (requires server to be running):

```bash
# Test with default remote image
uv run python test_server.py

# Test with a local file
uv run python test_server.py --uri /path/to/image.jpg --skip-upload

# Test with a URL
uv run python test_server.py --uri https://example.com/image.jpg

# Test upload endpoint
uv run python test_server.py --uri /path/to/image.jpg
```

### Usage

Access the application:
- Frontend: `http://localhost:8080/`
- With image: `http://localhost:8080/?uri=https://example.com/image.jpg`

Example:
[http://localhost:8080/?uri=https://thecontrarian.in/library/originals/GHANA/DSCF9243.jpg](http://localhost:8080/?uri=https://thecontrarian.in/library/originals/GHANA/DSCF9243.jpg)

## Technology Stack

- **Backend**: Python 3.12, FastAPI, c2pa-python
- **Frontend**: HTML5, CSS3, JavaScript
- **Metadata Extraction**: 
  - [c2pa-python](https://github.com/contentauth/c2pa-python) (official C2PA SDK)
  - [pillow](https://github.com/python-pillow/Pillow) (EXIF and image processing)
- **Server**: Uvicorn (ASGI server)

## Main Entry Points

| File | Description |
|------|-------------|
| `index.html` | Main HTML file for the application |
| `server.py` | FastAPI server with all API endpoints |
| `styles.css` | CSS styling |
| `script.js` | Frontend JavaScript for rendering metadata |
| `test_server.py` | API endpoint tests |

## Architecture Notes

### API Design
The API separates EXIF extraction from C2PA verification for performance:
- **EXIF/IPTC extraction** is fast (simple binary parsing, ~10-50ms)
- **C2PA verification** is slower (cryptographic signature verification, ~100-500ms+)

This separation allows clients to request only the data they need.

### Digital Source Type Detection
The system detects image origin from C2PA data:
1. Checks `claim_generator` for AI tools (Firefly, DALL-E, Midjourney, etc.)
2. Checks actions for AI-related operations (`text_to_image`, generative fills)
3. Checks ingredient formats for camera types (DNG, RAW → "Digital Camera (RAW)")
4. Falls back to "Digital Camera" for standard C2PA images

### Why FastAPI over Flask
- Modern async/await support
- Built-in data validation with Pydantic
- Automatic API documentation (OpenAPI/Swagger)
- Better type safety and IDE support
- Higher performance

### Why c2pa-python over ExifTool
- Official C2PA SDK with proper API
- More reliable metadata extraction
- Better thumbnail extraction
- No external process dependencies
- Direct access to C2PA manifest structure

## File Structure
```
c2pa-viewer/
├── index.html           # Main HTML file
├── styles.css           # Stylesheet
├── script.js            # Frontend JavaScript
├── server.py            # FastAPI server with all API endpoints
├── test_server.py       # API endpoint tests
├── pyproject.toml       # Project dependencies (UV)
├── uv.lock              # Dependency lock file
├── Dockerfile           # Docker configuration
├── fly.toml             # Fly.io deployment config
└── README.md            # This file
```

## License
This project is licensed under the MIT License.
