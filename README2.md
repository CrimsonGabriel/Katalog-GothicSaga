## Gothic Saga – Interactive 3D Item Catalog
An interactive, web-based 3D item catalog and crafting database developed for the **Gothic Saga** server. 
It enables in-browser 3D asset inspection (WebGL/Three.js) across various crafting professions.
> 🇵🇱 **Uwaga / Note:** Dokumentacja, interfejs oraz opisy w projekcie są prowadzone w języku polskim.

## Security & Asset Exclusions
To protect server-side IP and custom assets:
- **Encrypted Data Only:** Only pre-processed binary asset packages (`.sgm`) are included.
- **Excluded Tools:** Core source files, conversion tools, asset pipelines, and decryption keys have been stripped from this public repository.

## Key Features
- **In-Browser 3D Viewer:** Interactive real-time 3D model inspection (zoom, rotate, view textures) leveraging WebGL/Three.js renderers.
- **Categorized Crafting System:** Structured showcase of items divided by professions (Smithing, Alchemy, Enchanting, Tailoring, Hunting, Outdoor Crafting, etc.).
- **Asset Pipeline:** Custom conversion process extracting standard Gothic / ZenGin engine 3D models (`.3ds` / `.asc` / `.zen`) into web-friendly formats (`.gltf` / `.obj` / `.webp`).
- **Responsive UI:** Custom-styled dark fantasy user interface matching the original game aesthetic.

## Tech Stack & Tools
- **Frontend:** HTML5, CSS3 (Custom Flex/Grid layouts), JavaScript (ES6+).
- **3D Graphics:** WebGL / Three.js.
- **AI-Assisted Workflow:** Utilized LLM tools (ChatGPT, Gemini) for rapid scaffolding, refactoring, and automating metadata parsing scripts.
- **Deployment:** Nginx web server on Linux VPS.


## Repository Disclaimer & Asset Removal
> **Note:** This repository serves as a portfolio showcase for the code and architecture. Proprietary textures, and copyrighted game assets from Piranha Bytes / Gothic Saga have been stripped or replaced with placeholder assets in accordance with usage guidelines and copyright standards.

## Author
**Gabriel Piątek (Crimson)**  
*Former Lead Technician at Gothic Saga*
